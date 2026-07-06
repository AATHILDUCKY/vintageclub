import "./globals.css";
import Script from "next/script";
import { StoreProvider } from "./context/StoreProvider";
import Header from "./components/Header";
import MobileNav from "./components/MobileNav";
import Toast from "./components/Toast";
import { resolveSiteUrl, ogImage } from "@/lib/seo";
import { getSetting, getSeoSettings, keywordsList } from "@/lib/models";

// Rendered per-request so admin-configured SEO / Analytics / Search Console
// settings apply on every page (including the cart & checkout funnel) without a
// rebuild.
export const dynamic = "force-dynamic";

const STORE = process.env.STORE_NAME || "Vintage Club";
const DEFAULT_TITLE = `${STORE} — Modern Vintage Menswear`;
const DEFAULT_DESC =
  "Modern vintage menswear — monochrome staples and vintage-inspired tailoring, built to last. Order in seconds on WhatsApp, no account needed.";
const DEFAULT_KEYWORDS = ["menswear", "vintage clothing", "streetwear", "fashion", STORE, "monochrome fashion", "Sri Lanka menswear"];

// Async so the canonical URL and admin-managed SEO fields (title, description,
// keywords, OG image, Search Console token) are read per-request.
export async function generateMetadata() {
  const site = await resolveSiteUrl();
  const seo = getSeoSettings();

  const title = seo.metaTitle || DEFAULT_TITLE;
  const description = seo.metaDescription || DEFAULT_DESC;
  const keywords = seo.metaKeywords ? keywordsList() : DEFAULT_KEYWORDS;
  const shareImage = ogImage(seo.ogImage || "/images/hero-men.jpg", site);

  return {
    metadataBase: new URL(site),
    title: {
      default: title,
      template: `%s — ${STORE}`,
    },
    description,
    applicationName: STORE,
    keywords,
    authors: [{ name: STORE }],
    creator: STORE,
    publisher: STORE,
    alternates: { canonical: "/" },
    ...(seo.googleSiteVerification ? { verification: { google: seo.googleSiteVerification } } : {}),
    openGraph: {
      type: "website",
      siteName: STORE,
      title,
      description,
      url: site,
      images: [{ url: shareImage, width: 1200, height: 1500, alt: STORE }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [shareImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
    },
  };
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0a0a0a",
};

export default function RootLayout({ children }) {
  // Google Analytics 4 measurement id (set in Admin → Settings). When present,
  // gtag.js loads after the page is interactive so it never blocks first paint.
  const gaId = getSetting("google_analytics_id", "");

  return (
    <html lang="en">
      <body>
        <StoreProvider>
          <Header />
          <main className="min-h-screen pb-20 sm:pb-0">{children}</main>
          <MobileNav />
          <Toast />
        </StoreProvider>

        {gaId && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
            <Script id="google-analytics" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
