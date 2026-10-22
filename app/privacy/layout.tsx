import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy & KVKK Clarification",
  description:
    "Official Newbee Privacy Policy, GDPR Data Protection Notice, and KVKK Clarification Text in English, Turkish, and German (BEEYONDAPPS TEKNOLOJİ LİMİTED ŞİRKETİ).",
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
