import Link from "next/link";
import Image from "next/image";
import { MapPin, Clock, BadgeCheck, Star } from "lucide-react";
import { Badge } from "@/components/ui/primitives";
import { formatPrice, timeAgo } from "@/lib/utils";

export type AdCardData = {
  id: string;
  title: string;
  slug: string;
  price: number | string | null;
  priceType: string;
  suburb: string | null;
  city: string | null;
  createdAt: Date | string;
  isFeatured: boolean;
  status?: string;
  images?: { url: string; alt?: string | null }[];
  category?: { name: string } | null;
  advertiser?: { name?: string | null } | null;
  business?: { businessName: string } | null;
};

export function priceLabel(advert: AdCardData): string {
  if (advert.priceType === "FREE") return "Free";
  if (advert.priceType === "CONTACT_SELLER" || advert.price === null)
    return "Contact seller";
  const formatted = formatPrice(advert.price);
  switch (advert.priceType) {
    case "FROM":
      return `From ${formatted}`;
    case "PER_DAY":
      return `${formatted}/day`;
    case "PER_MONTH":
      return `${formatted}/month`;
    case "NEGOTIABLE":
      return `${formatted} (neg.)`;
    default:
      return formatted;
  }
}

/** Converts a Prisma advert result into AdCardData, handling Decimal → number. */
export function toAdCardData(advert: {
  id: string;
  title: string;
  slug: string;
  price: { toNumber(): number } | number | null;
  priceType: string;
  suburb: string | null;
  city: string | null;
  createdAt: Date | string;
  isFeatured: boolean;
  status?: string;
  images?: { url: string; alt?: string | null }[];
  category?: { name: string } | null;
  advertiser?: { name?: string | null } | null;
  business?: { businessName: string } | null;
}): AdCardData {
  return {
    id: advert.id,
    title: advert.title,
    slug: advert.slug,
    price:
      advert.price === null
        ? null
        : typeof advert.price === "object"
          ? advert.price.toNumber()
          : advert.price,
    priceType: advert.priceType,
    suburb: advert.suburb,
    city: advert.city,
    createdAt: advert.createdAt,
    isFeatured: advert.isFeatured,
    status: advert.status,
    images: advert.images,
    category: advert.category,
    advertiser: advert.advertiser,
    business: advert.business,
  };
}

export function AdCard({ advert }: { advert: AdCardData }) {
  const image = advert.images?.[0]?.url;
  const location = [advert.suburb, advert.city].filter(Boolean).join(", ");
  return (
    <Link
      href={`/ads/${advert.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
        {image ? (
          <Image
            src={image}
            alt={advert.images?.[0]?.alt ?? advert.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-gray-300">
            🏘️
          </div>
        )}
        {advert.isFeatured ? (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white shadow">
            <Star className="h-3 w-3" aria-hidden /> Featured
          </span>
        ) : null}
        {advert.status && advert.status !== "PUBLISHED" ? (
          <span className="absolute right-2 top-2">
            <Badge tone="amber">{advert.status.replace("_", " ")}</Badge>
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-3.5">
        <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-brand-700">
          {advert.title}
        </h3>
        <p className="mt-1 text-lg font-bold text-brand-700">
          {priceLabel(advert)}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
          {location ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" aria-hidden /> {location}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden />{" "}
            {timeAgo(advert.createdAt)}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <span className="truncate">
            {advert.business
              ? advert.business.businessName
              : advert.advertiser?.name ?? "Local member"}
          </span>
          {advert.category ? (
            <span className="shrink-0 text-gray-400">{advert.category.name}</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export function VerifiedBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-800"
      title="Business details verified by LocalReach"
    >
      <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
      Verified
    </span>
  );
}
