import Link from "next/link";
import ProductCard from "./components/ProductCard";
import { listProducts, getSetting, getPublicSettings, bestSellers, getHomeContent, listCategoryTags } from "@/lib/models";
import { publicizeProduct, publicizeHomeContent, publicizeCategoryTag } from "@/lib/img";
import { abs, resolveSiteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic"; // always reflect latest stock

// One shared container so every section lines up with the hero (90% width).
const SHELL = "mx-auto w-[90%] max-w-[1600px]";

function siteJsonLd(storeName, url) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", name: storeName, url, logo: abs("/images/hero-men.jpg", url) },
      {
        "@type": "WebSite",
        name: storeName,
        url,
        potentialAction: {
          "@type": "SearchAction",
          target: `${url}/shop?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
}

export default async function HomePage() {
  const site = await resolveSiteUrl();
  const settings = getPublicSettings();
  const storeName = settings.storeName || getSetting("store_name", "Vintage Club");
  const content = publicizeHomeContent(getHomeContent());
  const products = listProducts({ publicOnly: true }).map(publicizeProduct);
  const featured = products.filter((p) => p.featured);
  const edit = (featured.length ? featured : products).slice(0, 4);
  // New drops: admin-flagged products first; if none are flagged yet, fall back
  // to the newest in-stock products so the section always shows on the home page.
  const flaggedDrops = products.filter((p) => p.newDrop);
  const newest = [...products].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const newDrops = (flaggedDrops.length ? flaggedDrops : newest).slice(0, 12);

  const categoryTiles = buildCategoryTiles({
    managed: listCategoryTags().map(publicizeCategoryTag),
    products,
    fallbackImage: content.editorial_image || content.hero_image || "/images/editorial.jpg",
  });

  // Most wanted from analytics
  const top = bestSellers({ limit: 8 });
  const wanted = top
    .map((t) => products.find((p) => p.id === t.productId))
    .filter(Boolean)
    .slice(0, 4);

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd(storeName, site)) }}
      />
      <Hero storeName={storeName} categories={categoryTiles} content={content} />
      <Ticker text={content.ticker} />
      <Values content={content} />

      {newDrops.length > 0 && <NewDrops products={newDrops} />}

      {categoryTiles.length > 0 && <Categories tiles={categoryTiles} />}

      {edit.length > 0 && (
        <ProductSection index="03" label="The Edit" title="Featured pieces" href="/shop" products={edit} />
      )}

      <Editorial content={content} />
      <Lookbook content={content} />

      {wanted.length >= 2 && (
        <ProductSection index="05" label="Most wanted" title="Trending now" href="/shop" products={wanted} />
      )}

      <CtaBanner content={content} />
      <Footer storeName={storeName} categories={categoryTiles} whatsappNumber={settings.whatsappNumber} content={content} socialLinks={settings.socialLinks} />
    </div>
  );
}

function buildLoopItems(items, min = 8) {
  if (!items.length) return [];
  const loop = [...items];
  while (loop.length < min) loop.push(...items);
  return loop.slice(0, Math.max(min, items.length));
}

function buildCategoryTiles({ managed, products, fallbackImage }) {
  const byName = new Map();

  for (const cat of managed) {
    const name = String(cat.name || "").trim();
    if (!name) continue;
    byName.set(name.toLowerCase(), {
      name,
      image: cat.image || "",
      count: 0,
      managed: true,
    });
  }

  for (const product of products) {
    const name = String(product.category || "").trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (!byName.has(key)) {
      byName.set(key, { name, image: product.image || "", count: 0, managed: false });
    }
    const tile = byName.get(key);
    tile.count += 1;
    if (!tile.image && product.image) tile.image = product.image;
  }

  return [...byName.values()]
    .sort((a, b) => {
      if (a.managed !== b.managed) return a.managed ? -1 : 1;
      return a.name.localeCompare(b.name);
    })
    .map(({ managed: _managed, ...tile }) => ({
      ...tile,
      image: tile.image || fallbackImage,
    }));
}

/* ─── Shared editorial section header ─── */
function SectionHead({ index, label, title, href }) {
  return (
    <div className="mb-7 border-t border-ink pt-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ash">
            {index} — {label}
          </p>
          <h2 className="mt-2 font-sans text-3xl font-bold uppercase leading-none tracking-tight sm:text-5xl">
            {title}
          </h2>
        </div>
        {href && (
          <Link
            href={href}
            className="whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.2em] text-ash transition hover:text-ink"
          >
            View all →
          </Link>
        )}
      </div>
    </div>
  );
}

/* ─── Full-width SVG wordmark — one line on desktop, stacked (bigger) on mobile ─── */
function Wordmark({ text }) {
  const words = text.toUpperCase().split(/\s+/).filter(Boolean);
  // Mobile: size the type so the longest word fills the width, then let shorter
  // words fall naturally shorter. Avoids stretching each word to full width
  // (which distorts short words like "CLUB").
  const maxLen = Math.max(1, ...words.map((w) => w.length));
  const mobileFontSize = Math.min(26, 148 / maxLen); // vw
  return (
    <h1 aria-label={text} className="animate-fade-up">
      {/* Mobile: clean stacked wordmark — natural letterforms, no glyph stretch */}
      <span
        aria-hidden
        className="block font-sans font-bold uppercase leading-[0.85] tracking-[-0.02em] text-ink sm:hidden"
        style={{ fontSize: `${mobileFontSize.toFixed(2)}vw` }}
      >
        {words.map((w, i) => (
          <span key={w + i} className="block">{w}</span>
        ))}
      </span>
      {/* Desktop: single full-width line */}
      <svg viewBox="0 0 1000 132" width="100%" role="img" aria-hidden className="hidden w-full overflow-visible text-ink sm:block">
        <text
          x="0" y="104" textLength="1000" lengthAdjust="spacingAndGlyphs"
          fill="currentColor" fontSize="120"
          style={{ fontFamily: "var(--font-sans)", fontWeight: 600 }}
        >
          {text.toUpperCase()}
        </text>
      </svg>
    </h1>
  );
}

/* ─── Hero — editorial Swiss layout ─── */
function Hero({ storeName, categories = [], content = {} }) {
  const list = categories.slice(0, 4);
  const headingLines = String(content.hero_heading || "").split("\n");
  return (
    <section className="flex min-h-[calc(100dvh-4rem)] flex-col justify-center overflow-hidden bg-paper text-ink">
      <div className={`${SHELL} py-10 sm:py-12`}>
        <Wordmark text={storeName} />
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-ink pt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ash sm:text-[11px]">
          <span>{content.meta_left}</span>
          <span className="text-right">{content.meta_right}</span>
        </div>

        <div className="mt-10 grid gap-8 lg:mt-12 lg:grid-cols-2 lg:gap-14">
          {/* Left: statement + numbered categories */}
          <div className="flex flex-col">
            <h2 className="font-sans text-3xl font-bold uppercase leading-[1.02] tracking-tight sm:text-5xl">
              {headingLines.map((ln, i) => (
                <span key={i}>{ln}{i < headingLines.length - 1 && <br />}</span>
              ))}
            </h2>
            <p className="mt-5 max-w-sm font-mono text-xs leading-relaxed text-ash sm:text-[13px]">
              {content.hero_sub}
            </p>

            {list.length > 0 && (
              <nav className="mt-9">
                {list.map((c, i) => (
                  <Link
                    key={c.name}
                    href={`/shop?category=${encodeURIComponent(c.name)}`}
                    className="group flex items-center justify-between border-t border-line py-3.5 transition last:border-b hover:border-ink"
                  >
                    <span className="font-mono text-xs text-ash">{String(i + 1).padStart(2, "0")}</span>
                    <span className="flex items-center gap-3 font-sans text-lg font-medium uppercase tracking-tight sm:text-xl">
                      {c.name}
                      <svg className="-translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </span>
                  </Link>
                ))}
              </nav>
            )}

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/shop" className="btn-primary">Shop all</Link>
              <Link href="/shop" className="btn-outline">New arrivals</Link>
            </div>
          </div>

          {/* Right: editorial B&W image */}
          <div className="relative animate-fade-up" style={{ animationDelay: "100ms" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={content.hero_image || "/images/hero-men.jpg"}
              alt="Vintage Club menswear — editorial"
              className="aspect-[4/5] w-full object-cover object-top grayscale sm:aspect-[16/10] lg:aspect-auto lg:h-full lg:max-h-[540px]"
              loading="eager"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Announcement ticker (admin-editable: Admin → Content → Announcement ticker) ─── */
function Ticker({ text = "" }) {
  const messages = text.split("\n").map((t) => t.trim()).filter(Boolean);
  if (!messages.length) return null; // nothing to announce → no empty bar

  // Pad so one copy is wide enough to cover the viewport (else the seamless
  // loop shows a gap). Floor of 8 handles very short tickers; ×2 guarantees at
  // least the old width so wide screens never gap.
  const minItems = Math.max(8, messages.length * 2);
  const sequence = [...messages];
  while (sequence.length < minItems) sequence.push(...messages);

  // Steady scroll speed no matter how many messages there are.
  const duration = Math.max(18, sequence.length * 3.5);

  return (
    <div className="marquee overflow-hidden border-y border-ink bg-ink py-3 text-paper sm:py-3.5">
      {/* Two identical copies + a -50% translate = a seamless infinite loop. */}
      <div className="marquee-track" style={{ animationDuration: `${duration}s` }}>
        {[0, 1].map((copy) => (
          <div key={copy} className="flex items-center" aria-hidden={copy === 1}>
            {sequence.map((msg, i) => (
              <span key={i} className="flex items-center font-mono text-xs uppercase tracking-[0.32em] text-white/70 sm:text-[13px]">
                <span className="px-7 sm:px-8">{msg}</span>
                <span className="text-white/30">◆</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Value strip ─── */
function Values({ content = {} }) {
  const items = [
    { image: content.value1_image || content.value1_icon, title: content.value1_title, text: content.value1_text },
    { image: content.value2_image || content.value2_icon, title: content.value2_title, text: content.value2_text },
    { image: content.value3_image || content.value3_icon, title: content.value3_title, text: content.value3_text },
    { image: content.value4_image || content.value4_icon, title: content.value4_title, text: content.value4_text },
  ].filter((item) => item.image || item.title || item.text);
  if (!items.length) return null;

  return (
    <section className="border-b border-line bg-[#f7f3ec]">
      <div className={`${SHELL} py-12 sm:py-16 lg:py-18`}>
        <div className="max-w-3xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-ash">
            {content.values_eyebrow || "Why choose us"}
          </p>
          <h2 className="mt-4 font-sans text-3xl font-bold uppercase leading-[0.95] tracking-tight sm:text-5xl lg:text-6xl">
            {content.values_heading || "A better way to shop your next fit"}
          </h2>
          <p className="mt-5 max-w-2xl font-mono text-xs leading-relaxed text-ash sm:text-[13px]">
            {content.values_intro}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 xl:grid-cols-4">
          {items.map((item, i) => (
            <div
              key={`${item.title}-${i}`}
              className="overflow-hidden border border-ink/10 bg-white"
            >
              <div className="relative">
                {item.image ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image}
                      alt=""
                      className="aspect-[5/4] w-full object-cover"
                      loading="lazy"
                      aria-hidden="true"
                    />
                  </>
                ) : (
                  <div className="aspect-[5/4] w-full bg-[#ece5da]" />
                )}
                <span className="absolute left-3 top-3 bg-white px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ash">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>

              <div className="px-3 py-3 sm:px-4 sm:py-4">
                <p className="font-sans text-lg font-semibold uppercase leading-tight tracking-tight sm:text-2xl">
                  {item.title}
                </p>
                <p className="mt-2 font-mono text-[11px] leading-relaxed text-ash sm:text-xs">
                  {item.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Shop by category ─── */
function NewDrops({ products }) {
  const loop = buildLoopItems(products);
  // Circular queue: two flush copies + a -50% translate = a seamless infinite
  // loop. All spacing lives *inside* each card (horizontal padding), and the
  // copies butt directly together with no track padding/gap — so one copy is
  // exactly half the track and the reset never jumps. Speed scales with count.
  const duration = Math.max(22, loop.length * 3.2);

  return (
    <section className={`${SHELL} py-12 sm:py-16`}>
      <SectionHead index="01" label="Fresh arrivals" title="NEW DROPS" href="/shop" />
      <div className="-mx-[5vw] overflow-hidden border-y border-line bg-white py-4 sm:-mx-6">
        <div
          className="new-drops-track flex w-max"
          style={{ animationDuration: `${duration}s` }}
        >
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0" aria-hidden={copy === 1}>
              {loop.map((product, i) => (
                <div
                  key={`${copy}-${product.id}-${i}`}
                  className="flex w-[190px] shrink-0 px-1.5 sm:w-[240px] sm:px-2.5 lg:w-[270px]"
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Categories({ tiles }) {
  return (
    <section className={`${SHELL} py-14 sm:py-20`}>
      <SectionHead index="02" label="Browse" title="Shop by category" href="/shop" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {tiles.map((c, i) => (
          <Link
            key={c.name}
            href={`/shop?category=${encodeURIComponent(c.name)}`}
            className="group relative aspect-[4/3] animate-fade-up overflow-hidden bg-ink"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={c.image}
              alt={c.name}
              className="h-full w-full object-cover opacity-55 grayscale transition duration-500 group-hover:scale-105 group-hover:opacity-80 group-hover:grayscale-0"
              loading="lazy"
            />
            <div className="absolute inset-0 flex flex-col justify-end p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/60">
                {String(i + 1).padStart(2, "0")}
              </p>
              <p className="font-sans text-2xl font-bold uppercase tracking-tight text-paper sm:text-3xl">{c.name}</p>
              <p className="mt-0.5 font-mono text-[11px] text-white/70">{c.count} item{c.count !== 1 ? "s" : ""}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ─── Reusable product section ─── */
function ProductSection({ index, label, title, href, products }) {
  return (
    <section className={`${SHELL} py-8 sm:py-12`}>
      <SectionHead index={index} label={label} title={title} href={href} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
        {products.map((p, i) => (
          <div key={p.id} className="animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Editorial statement over a model image ─── */
function Editorial({ content = {} }) {
  return (
    <section className={`${SHELL} my-12`}>
      <div className="relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={content.editorial_image || "/images/editorial.jpg"} alt="Vintage Club editorial" className="absolute inset-0 h-full w-full object-cover grayscale" loading="lazy" />
        <div className="absolute inset-0 bg-ink/70" />
        <div className="relative px-6 py-20 text-center text-paper sm:py-28">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/60">The ethos</p>
          <p className="mx-auto mt-6 max-w-3xl font-sans text-2xl font-bold uppercase leading-tight tracking-tight sm:text-4xl">
            {content.quote}
          </p>
          <Link href="/shop" className="btn mt-9 border border-white/30 text-paper hover:bg-white/10">
            Explore the wardrobe
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── Lookbook gallery ─── */
function Lookbook({ content = {} }) {
  const shots = [
    { src: content.look1_image, label: content.look1_label, tag: content.look1_tag },
    { src: content.look2_image, label: content.look2_label, tag: content.look2_tag },
    { src: content.look3_image, label: content.look3_label, tag: content.look3_tag },
  ].filter((s) => s.src);
  return (
    <section className={`${SHELL} py-14 sm:py-20`}>
      <SectionHead index="04" label={content.lookbook_label || "Lookbook"} title={content.lookbook_heading || "Worn by the Club"} href="/shop" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {shots.map((s, i) => (
          <Link
            key={s.src}
            href="/shop"
            className={`group relative animate-fade-up overflow-hidden bg-ink ${i === 0 ? "col-span-2 sm:col-span-1" : ""}`}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={s.src}
              alt={s.label}
              className="aspect-[4/5] w-full object-cover grayscale transition duration-500 group-hover:scale-105 group-hover:grayscale-0"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4 text-paper">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/70">{s.tag}</p>
              <p className="font-sans text-lg font-semibold uppercase tracking-tight">{s.label}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ─── CTA banner ─── */
function CtaBanner({ content = {} }) {
  return (
    <section className={`${SHELL} py-14`}>
      <div className="flex flex-col items-center gap-4 border border-ink bg-ink px-6 py-16 text-center text-paper">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/50">Ready when you are</p>
        <h3 className="font-sans text-3xl font-bold uppercase tracking-tight sm:text-5xl">{content.cta_heading}</h3>
        <p className="max-w-sm font-mono text-xs leading-relaxed text-white/60">
          {content.cta_text}
        </p>
        <Link href="/shop" className="btn mt-3 bg-paper text-ink hover:bg-white/90">Start shopping</Link>
      </div>
    </section>
  );
}

/* ─── Footer — editorial brand block ─── */
function Footer({ storeName, categories = [], whatsappNumber = "", content = {}, socialLinks = [] }) {
  const year = new Date().getFullYear();
  const cleanWa = String(whatsappNumber || "").replace(/\D/g, "");
  const waHref = cleanWa ? `https://wa.me/${cleanWa}` : "/checkout";
  // Admin-managed social links first, then the WhatsApp order channel (unless the
  // admin already added one) and a Shop shortcut. Falls back to Instagram when
  // no links are configured yet so the footer never looks empty.
  const configured = (socialLinks || []).map((l) => ({
    label: l.label,
    href: l.platform === "whatsapp" && cleanWa && !/^https?:/i.test(l.url) ? waHref : l.url,
    icon: SOCIAL_ICONS[l.platform] || SOCIAL_ICONS.website,
  }));
  const base = configured.length ? configured : [{ label: "Instagram", href: "https://instagram.com", icon: IgIcon }];
  const hasWhatsapp = (socialLinks || []).some((l) => l.platform === "whatsapp");
  const socials = [
    ...base,
    ...(cleanWa && !hasWhatsapp ? [{ label: "WhatsApp", href: waHref, icon: WaIcon }] : []),
    { label: "Shop", href: "/shop", icon: GridIcon },
  ];
  const shopLinks = [
    { label: "All products", href: "/shop" },
    { label: "New arrivals", href: "/shop?sort=new" },
    ...categories.slice(0, 3).map((c) => ({ label: c.name, href: `/shop?category=${encodeURIComponent(c.name)}` })),
  ];
  const exploreLinks = [
    { label: "Home", href: "/" },
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
const FbIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M14 8.5V6.8c0-.8.2-1.3 1.4-1.3H17V2.7C16.5 2.6 15.6 2.5 14.6 2.5c-2.2 0-3.7 1.3-3.7 3.8v2.2H8.5V12h2.4v8.5H14V12h2.3l.4-3.5H14Z" /></svg>;
const TkIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 3c.3 2 1.5 3.5 3.5 3.8v2.5c-1.3 0-2.5-.4-3.6-1v5.3c0 3.2-2.3 5.6-5.4 5.6A5.3 5.3 0 0 1 5.5 13c0-3 2.4-5.4 5.9-5.1v2.7c-.4-.1-.8-.2-1.2-.2-1.5 0-2.7 1.2-2.7 2.7s1.2 2.7 2.7 2.7 2.6-1.1 2.6-2.9V3h3.7Z" /></svg>;
const YtIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M22 8.2a2.6 2.6 0 0 0-1.8-1.9C18.6 6 12 6 12 6s-6.6 0-8.2.4A2.6 2.6 0 0 0 2 8.2 27 27 0 0 0 1.7 12 27 27 0 0 0 2 15.8a2.6 2.6 0 0 0 1.8 1.9C5.4 18 12 18 12 18s6.6 0 8.2-.4a2.6 2.6 0 0 0 1.8-1.9c.3-1.2.3-3.8.3-3.8s0-2.6-.3-3.8ZM10 15V9l5 3-5 3Z" /></svg>;
const XIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 3h3l-6.6 7.5L21.7 21h-5.9l-4.3-5.6L6.4 21H3.4l7-8L2.7 3h6l3.9 5.2L17.5 3Zm-1 16h1.6L7.6 4.7H5.9L16.5 19Z" /></svg>;
const LinkedinIcon = () => <svg {...sIco}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M7 10v7M7 7v.01M11 17v-4a2 2 0 0 1 4 0v4M11 10v7" /></svg>;
const PinIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-3.6 19.3c-.1-.8-.1-2 0-2.9l1.2-5s-.3-.6-.3-1.5c0-1.4.8-2.4 1.8-2.4.9 0 1.3.6 1.3 1.4 0 .9-.6 2.2-.9 3.4-.2 1 .5 1.8 1.5 1.8 1.8 0 3-2.3 3-5 0-2-1.4-3.6-3.9-3.6a4.5 4.5 0 0 0-4.7 4.5c0 .9.3 1.5.7 2 .2.2.2.3.1.5l-.2.9c-.1.3-.3.4-.6.2-1.2-.5-1.8-1.9-1.8-3.5 0-2.6 2.2-5.7 6.5-5.7 3.5 0 5.8 2.5 5.8 5.2 0 3.5-2 6.2-4.9 6.2-1 0-1.9-.5-2.2-1.1l-.6 2.4c-.2.8-.7 1.7-1.1 2.3A10 10 0 1 0 12 2Z" /></svg>;
const SnapIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c2.6 0 4.1 1.9 4.2 4.3v1.4c0 .3.3.5.6.4l.9-.3c.5-.1 1 .5.7 1-.2.4-.9.6-1.4.8-.4.1-.6.5-.4.9.5 1.2 1.6 2.3 2.9 2.7.4.1.5.6.2.9-.5.5-1.5.6-1.8 1-.1.2 0 .5.1.7.2.4-.1.8-.5.8-.7 0-1.3.1-1.6.6-.3.5-.6 1.1-1.4 1.1-.6 0-1.2-.4-2-.4s-1.5.4-2.3.4-1.4-.4-2-.4c-.8 0-1.4.4-2 .4-.8 0-1.1-.6-1.4-1.1-.3-.5-.9-.6-1.6-.6-.4 0-.7-.4-.5-.8.1-.2.2-.5.1-.7-.3-.4-1.3-.5-1.8-1-.3-.3-.2-.8.2-.9 1.3-.4 2.4-1.5 2.9-2.7.2-.4 0-.8-.4-.9-.5-.2-1.2-.4-1.4-.8-.3-.5.2-1.1.7-1l.9.3c.3.1.6-.1.6-.4V6.3C7.9 3.9 9.4 2 12 2Z" /></svg>;
const GlobeIcon = () => <svg {...sIco}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" /></svg>;

// platform key → footer icon. `website` is the fallback for anything unmapped.
const SOCIAL_ICONS = {
  instagram: IgIcon,
  facebook: FbIcon,
  tiktok: TkIcon,
  youtube: YtIcon,
  whatsapp: WaIcon,
  x: XIcon,
  linkedin: LinkedinIcon,
  pinterest: PinIcon,
  snapchat: SnapIcon,
  website: GlobeIcon,
};
