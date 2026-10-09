import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://webytex-spatial-showroom.vercel.app"),
  title: "Spatial Showroom | A space for your ideas by Webytex",
  description: "Describe your ideal home office and explore it in 3D. An interactive design demonstration by Webytex Agencies, with a curated fictional collection and transparent CAD pricing.",
  icons: { icon: "/mark.svg" },
  openGraph: { title: "Spatial Showroom by Webytex", description: "Describe the space. See it take shape.", type: "website", locale: "en_CA", images: [{ url: "/social-preview.png", width: 1920, height: 1080, alt: "Spatial Showroom by Webytex: an original home office with a pinned chair and a conversational design request." }] },
  twitter: { card: "summary_large_image", title: "Spatial Showroom by Webytex", images: ["/social-preview.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-CA"><body>{children}</body></html>;
}
