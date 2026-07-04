import Link from "next/link";

// Same shared container width used by every home-page section, so the footer
// lines up with content on whichever page renders it.
const SHELL = "mx-auto w-[90%] max-w-[1600px]";

/* ─── Footer — editorial brand block. Shared by the home & about pages. ─── */
export default function Footer({ storeName, categories = [], whatsappNumber = "", content = {} }) {
  const year = new Date().getFullYear();
  const cleanWa = String(whatsappNumber || "").replace(/\D/g, "");
  const waHref = cleanWa ? `https://wa.me/${cleanWa}` : "/checkout";
  const socials = [
    { label: "Instagram", href: "https://instagram.com", icon: IgIcon },
    { label: "WhatsApp", href: waHref, icon: WaIcon },
    { label: "Shop", href: "/shop", icon: GridIcon },
  ];
  const shopLinks = [
    { label: "All products", href: "/shop" },
    { label: "New arrivals", href: "/shop?sort=new" },
    ...categories.slice(0, 3).map((c) => ({ label: c.name, href: `/shop?category=${encodeURIComponent(c.name)}` })),
  ];
  const exploreLinks = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Your bag", href: "/cart" },
    { label: "Checkout", href: "/checkout" },
    { label: "WhatsApp support", href: waHref },
  ];

  return (
    <footer className="mt-4 bg-ink text-paper">
      <div className={`${SHELL} py-8 sm:py-12`}>
        <div className="border-b border-white/10 py-14 text-center sm:py-20">
          <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-white/45">{content.footer_eyebrow}</p>
          <h2 className="mt-6 font-sans text-5xl font-light uppercase leading-[0.88] tracking-[0.08em] sm:text-7xl lg:text-[7rem]">
            {content.footer_heading}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl font-sans text-xl uppercase leading-tight tracking-[0.04em] text-white/90 sm:text-2xl">
            {content.footer_tagline}
          </p>
          <p className="mx-auto mt-5 max-w-xl font-mono text-[11px] uppercase tracking-[0.24em] text-white/45 sm:text-[12px]">
            {content.footer_text}
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink transition hover:bg-white/90"
            >
              Shop the edit ↗
            </Link>
          </div>
        </div>

        <div className="grid gap-12 py-12 sm:grid-cols-2 lg:grid-cols-[1.1fr_1fr_1fr_1fr]">
          <div>
            <p className="font-sans text-xl font-semibold uppercase tracking-tight">{storeName}®</p>
            <p className="mt-4 max-w-xs font-mono text-[11px] leading-relaxed text-white/45">
              Clean silhouettes, strong basics, and direct WhatsApp checkout for every order.
            </p>
            <div className="mt-7 space-y-3">
              {socials.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noreferrer" : undefined}
                  className="group flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.15em] text-white/60 transition hover:text-white"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/5 transition group-hover:border-white/35 group-hover:bg-white/10">
                    <Icon />
                  </span>
                  {label}
                </a>
              ))}
            </div>
          </div>

          <FooterCol title="Pages" links={shopLinks} />
          <FooterCol title="Support" links={exploreLinks} />

          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">Help</p>
            <ul className="mt-4 space-y-2.5">
              {[
                { label: "Delivery & returns", href: "/checkout" },
                { label: "Size guide", href: "/shop" },
                { label: "Contact", href: cleanWa ? waHref : "/checkout" },
              ].map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="font-mono text-[12px] uppercase tracking-[0.1em] text-white/70 transition hover:text-white">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
            <Link
              href="/shop"
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white px-4 py-2 font-mono text-[11px] uppercase tracking-[0.15em] text-ink transition hover:bg-white/90"
            >
              View collection ↗
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 pt-6 font-mono text-[11px] uppercase tracking-[0.15em] text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <span>© {year} {storeName} · All rights reserved</span>
          <div className="flex gap-6">
            <a href="#" className="transition hover:text-white">Terms &amp; Conditions</a>
            <a href="#" className="transition hover:text-white">Privacy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {links.map((l, i) => (
          <li key={`${l.label}-${i}`}>
            <Link href={l.href} className="font-mono text-[12px] uppercase tracking-[0.1em] text-white/70 transition hover:text-white">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* Social icons (SVG) */
const sIco = { width: 15, height: 15, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7 };
const IgIcon = () => <svg {...sIco}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" /></svg>;
const WaIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-2.9.9.9-2.8-.2-.3A8 8 0 1 1 12 20Zm4.5-5.4c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.1-.2 0-.4.1-.5l.4-.5c.1-.2.1-.3 0-.5l-.7-1.7c-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.7.7-.9 1.7-.5 2.8.5 1.4 1.9 3.4 4.3 4.5 1.6.7 2.2.7 3 .6.5-.1 1.4-.6 1.6-1.2.2-.5.2-1 .1-1.1Z" /></svg>;
const GridIcon = () => <svg {...sIco}><rect x="4" y="4" width="7" height="7" rx="1" /><rect x="13" y="4" width="7" height="7" rx="1" /><rect x="4" y="13" width="7" height="7" rx="1" /><rect x="13" y="13" width="7" height="7" rx="1" /></svg>;
