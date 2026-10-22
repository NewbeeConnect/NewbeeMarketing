import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy & Data Protection",
  description:
    "Official Newbee Privacy Policy and Data Protection Notice (Beeyondapps Technology Ltd.).",
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
