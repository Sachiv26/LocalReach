import { LegalPage, type LegalSection } from "@/components/marketing/legal-page";

const sections: LegalSection[] = [
  {
    heading: "Buyer beware",
    paragraphs: [
      "LocalReach is a marketplace platform and does not guarantee sellers, buyers, products or transactions.",
      "Always perform your own due diligence before paying. Meet in a safe public place, inspect the item, and never send money to a stranger without safeguards.",
    ],
  },
  {
    heading: "Red flags",
    paragraphs: ["Be extra careful when you see:"],
    list: [
      "A seller who pressures you to pay a deposit before you have seen the item",
      "Prices that seem too good to be true",
      "Sellers asking for your banking details or OTPs",
      "Requests to meet somewhere far away or at your home",
      "\u201CWinners\u201D of competitions you never entered",
      "Anyone claiming a guaranteed profit or an investment opportunity",
    ],
  },
  {
    heading: "Our role",
    paragraphs: [
      "Community admins moderate adverts using automated checks and their own judgment. Automated checks are never the final authority — humans can override them.",
      "A \u201CVerified\u201D badge means the business contact details were verified by LocalReach. It is not a recommendation and not a guarantee of trustworthiness.",
      "LocalReach is not responsible for transactions. Please report suspicious adverts so we can investigate.",
    ],
  },
  {
    heading: "Report a suspicious advert",
    paragraphs: [
      "Use the \u201CReport\u201D button on any advert. Reports go to the community admin queue for review.",
    ],
  },
];

export const metadata = {
  title: "Safety",
  description: "Buyer-beware safety guidance for LocalReach communities.",
};

export default function SafetyPage() {
  return <LegalPage title="Safety & Buyer Beware" updated="13 September 2026" sections={sections} />;
}