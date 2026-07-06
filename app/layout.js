import "./globals.css";
import Script from "next/script";
import { StoreProvider } from "./context/StoreProvider";
import Header from "./components/Header";
import MobileNav from "./components/MobileNav";
import Toast from "./components/Toast";
import { siteUrl } from "@/lib/seo";
import { getSetting } from "@/lib/models";

// Rendered per-request so admin-configured Analytics / Search Console settings
// apply on every page (including the cart & checkout funnel) without a rebuild.
export const dynamic = "force-dynamic";

const SITE = siteUrl();
const STORE = process.env.STORE_NAME || "Vintage Club";
const DESC = "Modern vintage menswear — monochrome staples and vintage-inspired tailoring, built to last. Order in seconds on WhatsApp, no account needed.";

// Async so the Google Search Console verification token (set in Admin →
// Settings) is read per-request and rendered as a <meta> tag by Next.
export async function generateMetadata() {
  const googleSiteVerification = getSetting("google_site_verification", "");
  return {
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
    ...(googleSiteVerification ? { verification: { google: googleSiteVerification } } : {}),
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
