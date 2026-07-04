import "./globals.css";
import { StoreProvider } from "./context/StoreProvider";
import Header from "./components/Header";
import MobileNav from "./components/MobileNav";
import Toast from "./components/Toast";
import { siteUrl } from "@/lib/seo";

const SITE = siteUrl();
const STORE = process.env.STORE_NAME || "Vintage Club";
const DESC = "Modern vintage menswear — monochrome staples and vintage-inspired tailoring, built to last. Order in seconds on WhatsApp, no account needed.";

export const metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: `${STORE} — Modern Vintage Menswear`,
    template: `%s — ${STORE}`,
  },
  description: DESC,
  applicationName: STORE,
  keywords: ["menswear", "vintage clothing", "streetwear", "fashion", STORE, "monochrome fashion", "Sri Lanka menswear"],
  authors: [{ name: STORE }],
  creator: STORE,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: STORE,
    title: `${STORE} — Modern Vintage Menswear`,
    description: DESC,
    url: SITE,
    images: [{ url: "/images/hero-men.jpg", width: 1200, height: 1500, alt: STORE }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${STORE} — Modern Vintage Menswear`,
    description: DESC,
    images: ["/images/hero-men.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0a0a0a",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>
          <Header />
          <main className="min-h-screen pb-20 sm:pb-0">{children}</main>
          <MobileNav />
          <Toast />
        </StoreProvider>
      </body>
    </html>
  );
}
