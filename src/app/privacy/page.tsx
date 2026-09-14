import { LegalPage, type LegalSection } from "@/components/marketing/legal-page";

const sections: LegalSection[] = [
  {
    heading: "What we collect",
    paragraphs: [
      "We collect the minimum data needed to operate the marketplace: your name, email address, a password (stored hashed), and optional contact details you choose to share (phone, WhatsApp number).",
      "If you post an advert we store its title, description, category, price and location as you provide them.",
      "We do not collect unnecessary personal information. Our analytics do not store IP addresses or track you across the web.",
    ],
  },
  {
    heading: "Your data, your choices",
    paragraphs: [
      "You can request account deletion at any time from your dashboard settings. This anonymises your account and removes your personal details from the public database.",
      "Marketing emails are only sent with your consent. You can opt out at any time in account settings.",
      "You can download or export your own data by contacting us; automated self-serve export is on our roadmap.",
    ],
  },
  {
    heading: "What we do NOT collect",
    paragraphs: [
      "LocalReach never scrapes WhatsApp groups, never imports WhatsApp member lists, and never adds people to a database without their own registration.",
      "We do not collect identity documents or sensitive personal information to verify members.",
    ],
  },
  {
    heading: "Cookies",
    paragraphs: [
      "We use a session cookie so you can stay signed in, and strictly-functional cookies to keep the site working. We do not use ad-tracking cookies.",
    ],
  },
  {
    heading: "Third parties",
    paragraphs: [
      "When payments are enabled, your payment is processed by the configured payment provider (e.g. PayFast) under their own privacy policy. We never store your card details.",
    ],
  },
];

export const metadata = {
  title: "Privacy Policy",
  description: "How LocalReach handles your data.",
};

export default function PrivacyPage() {
  return <LegalPage title="Privacy Policy" updated="13 September 2026" sections={sections} />;
}