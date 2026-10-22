import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact, Partnerships & Account Deletion",
  description:
    "Contact the Newbee team for platform support, City Lead applications, Verified Expert onboarding, event partnerships, or GDPR/KVKK account and data deletion requests.",
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
