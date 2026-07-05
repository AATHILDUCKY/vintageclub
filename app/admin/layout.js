// Admin section layout. Its only job is to override the site-wide viewport so
// the admin acts like a native app on phones: no pinch-zoom / double-tap zoom,
// which otherwise makes the dense forms and tables jump around while editing.
// This applies to every /admin/* route (login + panel) and nests inside the
// root layout, so the storefront keeps its normal zoomable viewport.
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
  themeColor: "#0a0a0a",
};

export default function AdminSectionLayout({ children }) {
  return children;
}
