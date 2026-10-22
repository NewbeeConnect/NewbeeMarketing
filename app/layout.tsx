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
    default:
      "Newbee — One-stop app to navigate all challenges of moving and living abroad",
    template: "%s | Newbee",
  },
  description:
    "One-stop app to navigate all challenges of moving and living abroad. Ask questions, organize and join local events, and meet new people in your city. Available on iOS, Android, and Web at app.newbeeapp.com.",
  keywords: [
    "Newbee",
    "Newbee App",
    "newbeeapp.com",
    "Moving Abroad",
    "Living Abroad",
    "Expat Community",
    "Local Events",
    "Meet New People",
    "Ask Questions Abroad",
    "Beeyondapps",
  ],
  openGraph: {
    title:
      "Newbee — One-stop app to navigate all challenges of moving and living abroad",
    description:
      "Ask questions, organize and join local events, and meet new people in your city. Download Newbee on iOS & Android or continue on app.newbeeapp.com.",
    url: "https://www.newbeeapp.com",
    siteName: "Newbee",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Newbee — One-stop app to navigate all challenges of moving and living abroad",
    description:
      "Ask questions, organize and join local events, and meet new people in your city. Available on iOS, Android, and Web.",
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
