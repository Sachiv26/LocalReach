import { LegalPage, type LegalSection } from "@/components/marketing/legal-page";

const sections: LegalSection[] = [
  {
    heading: "Free advertising rules",
    paragraphs: [
      "Members can advertise for free up to the community quota (default: 2 adverts per rolling 7-day period).",
      "Maximum 2 photos per advert, unless the community allows more.",
      "Members may submit adverts at any time — there are no quiet hours.",
      "Multiple products/services must be combined into one collage/catalogue and count as one post.",
      "Supermarkets, restaurants and takeaways may advertise daily specials, but remain limited to 2 photos.",
    ],
  },
  {
    heading: "Prohibited content",
    paragraphs: ["The following are not allowed in any community:"],
    list: [
      "Live pet sales",
      "Firearms or weapons",
      "Politics",
      "Racism or sexism",
      "Swearing",
      "Pornography or explicit content",
      "Referrals, promotions or links to other WhatsApp groups or platforms",
    ],
  },
  {
    heading: "Community rules",
    paragraphs: [
      "Each community defines its own rules. Community admins can edit rules through the admin rule editor, and every decision can be overridden by a human admin.",
      "The rules you see on your community page are the rules that apply to your adverts.",
    ],
  },
  {
    heading: "Moderation",
    paragraphs: [
      "Adverts are checked automatically for prohibited content and quota, then (where enabled) reviewed by a community admin.",
      "Admins are not responsible for transactions between members.",
    ],
  },
];

export const metadata = {
  title: "Community Rules",
  description: "The standard rules across LocalReach communities.",
};

export default function CommunityRulesPage() {
  return <LegalPage title="Community Rules" updated="13 September 2026" sections={sections} />;
}