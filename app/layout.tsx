import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const marketingSans = localFont({
  src: "../assets/fonts/geist-variable.ttf",
  variable: "--font-marketing-sans",
  display: "swap",
  weight: "100 900",
});

const marketingMono = localFont({
  src: "../assets/fonts/geist-mono-variable.ttf",
  variable: "--font-marketing-mono",
  display: "swap",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.newbeeapp.com"),
  title: {
    default: "Newbee — Diaspora & Expat Community Super-App in Germany",
    template: "%s | Newbee",
  },
  description:
    "From 'Help?!' to 'Heeey!' — Newbee connects newcomers, expats, and local communities across Germany with city hubs, cultural events with QR tickets, relocation guides, and verified native-speaking experts. Available on iOS, Android, and Web.",
  keywords: [
    "Newbee",
    "Newbee App",
    "newbeeapp.com",
    "Expat Community Germany",
    "Turkish Community Germany",
    "Frankfurt Expats",
    "Berlin Expats",
    "Munich Expats",
    "Verified Experts Germany",
    "Beeyondapps",
    "Frankfurt School Accelerator",
    "Hessen Ideen",
  ],
  openGraph: {
    title: "Newbee — Diaspora & Expat Community Super-App in Germany",
    description:
      "City communities, cultural events with instant QR tickets, and verified native-speaking experts across Germany. Available on iOS, Android, and app.newbeeapp.com.",
    url: "https://www.newbeeapp.com",
    siteName: "Newbee",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Newbee — Diaspora & Expat Community Super-App in Germany",
    description:
      "From 'Help?!' to 'Heeey!' — City communities, local events, and verified native-speaking experts on iOS, Android, and Web.",
  },
  icons: {
    icon: "/brand/newbee-logo.png",
    apple: "/brand/newbee-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${marketingSans.variable} ${marketingMono.variable}`}
    >
      <body className="nk-page">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
