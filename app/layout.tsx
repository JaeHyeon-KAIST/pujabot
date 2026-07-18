import type { Metadata, Viewport } from "next";
import { Baloo_2, Mukta, Tiro_Devanagari_Hindi } from "next/font/google";
import { SerwistProvider } from "@serwist/turbopack/react";
import "./globals.css";
import DemoTools from "@/components/DemoTools";
import NoPinchZoom from "@/components/NoPinchZoom";

const baloo = Baloo_2({
  subsets: ["latin", "devanagari"],
  weight: ["600", "700", "800"],
  variable: "--font-baloo",
  display: "swap",
});

const mukta = Mukta({
  subsets: ["latin", "devanagari"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mukta",
  display: "swap",
});

const tiro = Tiro_Devanagari_Hindi({
  subsets: ["latin", "devanagari"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-tiro",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PujaBot — Which puja, with whom, how",
  description:
    "Tell us your occasion in your own words — PujaBot suggests the right puja, an auspicious panchang date, and verified pandits near you. All ritual content is pandit-reviewed, never AI-generated.",
  applicationName: "PujaBot",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "PujaBot" },
};

export const viewport: Viewport = {
  themeColor: "#fff8ec",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${baloo.variable} ${mukta.variable} ${tiro.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">
        <SerwistProvider
          swUrl="/serwist/sw.js"
          disable={process.env.NODE_ENV === "development"}
        >
          <DemoTools />
          <NoPinchZoom />
          <div id="app-scroll">{children}</div>
        </SerwistProvider>
      </body>
    </html>
  );
}
