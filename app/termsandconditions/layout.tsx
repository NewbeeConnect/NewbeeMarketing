import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "Official Newbee Terms of Service and Community Guidelines in English, Turkish, and German (BEEYONDAPPS TEKNOLOJİ LİMİTED ŞİRKETİ).",
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
