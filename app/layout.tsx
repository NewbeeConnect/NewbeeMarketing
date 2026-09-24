import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Newbee",
  description: "Download Newbee on the App Store or Google Play.",
};

// The only route is /download, a redirect. This layout exists because Next.js
// requires a root layout for its built-in not-found page.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
