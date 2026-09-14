import { LegalPage, type LegalSection } from "@/components/marketing/legal-page";

const sections: LegalSection[] = [
  {
    heading: "What LocalReach is",
    paragraphs: [
      "LocalReach is a marketplace platform that helps local communities organise advertising. We provide the technology: adverts, a business directory, moderation tools and optional paid boosts.",
      "LocalReach does not own or operate the WhatsApp groups or other community channels that members use. Those groups are run by their own administrators.",
      "We do not scrape or import WhatsApp community members, and we never add members to a database without their own registration.",
    ],
  },
  {
    heading: "WhatsApp communities",
    paragraphs: [
      "LocalReach works alongside existing WhatsApp advertising groups. Existing group admins remain community administrators — LocalReach provides supporting technology, marketplace tools and monetisation.",
      "A WhatsApp invite link is only displayed on a community page when the community admin has enabled it and provided the URL.",
      "We never send messages into WhatsApp automatically unless an official, legally supported API integration is configured by the community admin.",
    ],
  },
  {
    heading: "Ads and transactions",
    paragraphs: [
      "LocalReach is a venue for advertising. We are not a party to any transaction between a buyer and a seller.",
      "LocalReach does not guarantee sellers, buyers, products or transactions. Always perform your own due diligence before paying.",
      "When community admins reject or approve adverts, they act on behalf of their community. LocalReach provides the moderation tools but the final decision on community-specific rules rests with community admins.",
    ],
  },
  {
    heading: "No legal advice",
    paragraphs: [
      "Nothing on this site constitutes legal advice. We are not a law firm and we do not provide legal services.",
      "For questions about your rights or obligations, please consult a qualified South African legal professional.",
    ],
  },
  {
    heading: "Contact",
    paragraphs: [
      "Questions about this policy or your data can be sent to the platform operator using the contact details provided on your local community page.",
    ],
  },
];

export const metadata = {
  title: "Terms of Service",
  description: "Terms of service for using LocalReach.",
};

export default function TermsPage() {
  return <LegalPage title="Terms of Service" updated="13 September 2026" sections={sections} />;
}