/**
 * WhatsApp-ready advert content generators.
 *
 * WhatsApp stays central: these produce copy-paste / share-link friendly
 * versions of adverts for admins and advertisers. Supports community
 * configurable templates via the WhatsAppTemplate table ({{variables}}).
 */

export type WhatsAppTemplateKey = "SHORT" | "DETAILED" | "BUSINESS_SPECIAL";

export type WhatsAppAdvertData = {
  title: string;
  price: string; // pre-formatted, e.g. "R1,850,000" or "Free"
  description: string;
  location: string;
  contactName: string;
  contactPhone?: string | null;
  whatsappNumber?: string | null;
  url: string;
  communityName: string;
};

export const DEFAULT_SHORT_TEMPLATE = `📢 LOCAL AD

{{title}}

💰 {{price}}

📍 {{location}}

📞 {{whatsapp}}

👉 View full details:
{{url}}

⚠️ Buyer beware. Please perform your own due diligence.`;

export const DEFAULT_DETAILED_TEMPLATE = `{{title}}

{{description}}

💰 {{price}}
📍 {{location}}

📞 Contact {{contact}}:
{{whatsapp}}

View full advert:
{{url}}

⚠️ Buyer beware. LocalReach does not guarantee transactions. Perform your own due diligence before paying.`;

export const DEFAULT_BUSINESS_SPECIAL_TEMPLATE = `🏪 {{communityName}} SPECIAL

{{title}}

{{description}}

💰 {{price}}
📍 {{location}}

📞 Chat to the business:
{{whatsapp}}

👉 Full details:
{{url}}`;

export const DEFAULT_TEMPLATES: Record<WhatsAppTemplateKey, string> = {
  SHORT: DEFAULT_SHORT_TEMPLATE,
  DETAILED: DEFAULT_DETAILED_TEMPLATE,
  BUSINESS_SPECIAL: DEFAULT_BUSINESS_SPECIAL_TEMPLATE,
};

function formatPriceForWhatsApp(
  price: string | null,
  priceType: string,
  currency = "ZAR"
): string {
  if (priceType === "FREE") return "FREE";
  if (priceType === "CONTACT_SELLER" || !price) return "Contact seller";
  const prefix =
    priceType === "FROM"
      ? "From "
      : priceType === "PER_DAY"
        ? " per day"
        : priceType === "PER_MONTH"
          ? " per month"
          : priceType === "NEGOTIABLE"
            ? " (negotiable)"
            : "";
  if (priceType === "FROM") return `From ${price}`;
  if (priceType === "PER_DAY") return `${price} per day`;
  if (priceType === "PER_MONTH") return `${price} per month`;
  if (priceType === "NEGOTIABLE") return `${price} (negotiable)`;
  void currency;
  return `${price}${prefix ? "" : ""}`;
}

/** Renders a template string with {{variables}}. Unknown variables are dropped. */
export function renderWhatsAppTemplate(
  template: string,
  vars: Record<string, string | undefined | null>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const value = vars[key];
    return value ? value : "";
  });
}

export function generateWhatsAppText(
  variant: WhatsAppTemplateKey,
  data: WhatsAppAdvertData,
  opts?: {
    templateOverride?: string;
    priceRaw?: string | null;
    priceType?: string;
  }
): string {
  const template = opts?.templateOverride ?? DEFAULT_TEMPLATES[variant];
  const price = formatPriceForWhatsApp(
    opts?.priceRaw ?? data.price ?? null,
    opts?.priceType ?? "FIXED"
  );
  const contact = data.contactName || "Seller";
  const waNumber = data.whatsappNumber ?? data.contactPhone ?? "";
  return renderWhatsAppTemplate(template, {
    title: data.title,
    price,
    description: data.description,
    location: data.location || data.communityName,
    contact,
    whatsapp: waNumber ? `https://wa.me/${waNumber.replace(/[^0-9]/g, "")}` : data.url,
    url: data.url,
    communityName: data.communityName,
  });
}

/** Builds a wa.me share link with pre-filled text. */
export function whatsappShareLink(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/** Helper for advert pages: builds the share data from an advert record. */
export function whatsappDataFromAdvert(advert: {
  title: string;
  description: string;
  price: { toNumber(): number } | number | null;
  priceType: string;
  suburb: string | null;
  city: string | null;
  contactName: string;
  contactPhone: string | null;
  whatsappNumber: string | null;
  slug: string;
  community: { name: string; slug: string };
}, appUrl: string): WhatsAppAdvertData {
  const price =
    advert.price === null
      ? null
      : `R${Number(advert.price).toLocaleString("en-ZA")}`;
  return {
    title: advert.title,
    price: price ?? "",
    description: advert.description,
    location: [advert.suburb, advert.city].filter(Boolean).join(", "),
    contactName: advert.contactName,
    contactPhone: advert.contactPhone,
    whatsappNumber: advert.whatsappNumber,
    url: `${appUrl}/ads/${advert.slug}`,
    communityName: advert.community.name,
  };
}
