"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useStore } from "@/app/context/StoreProvider";

export default function Header() {
  const { count } = useStore();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState([]);

  // Load categories for the mobile menu (once).
  useEffect(() => {
    fetch("/api/categories", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => {});
  }, []);

  // Close the menu whenever the route changes.
  useEffect(() => { setOpen(false); }, [pathname]);

  // Lock body scroll + close on Escape while the menu is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (pathname.startsWith("/admin")) return null; // admin has its own chrome

  const navLink = (href, label) => {
    const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
    return (
      <Link href={href} className={`transition hover:text-ink ${active ? "text-ink" : "text-ash"}`}>
        {label}
      </Link>
    );
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-paper/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-[90%] max-w-[1600px] items-center justify-between">
          {/* Left: hamburger (mobile) + wordmark */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              aria-expanded={open}
              aria-controls="mobile-menu"
              className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-ink transition hover:bg-smoke sm:hidden"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            </button>
            <Link href="/" className="font-sans text-base font-bold uppercase tracking-tight sm:text-lg">
              Vintage Club<span className="align-super text-[10px]">®</span>
            </Link>
          </div>

          {/* Center nav (desktop) */}
          <nav className="hidden items-center gap-9 font-mono text-[11px] uppercase tracking-[0.18em] sm:flex">
            {navLink("/", "Home")}
            {navLink("/shop", "Shop")}
            {navLink("/about", "About")}
          </nav>

          {/* Cart */}
          <Link
            href="/cart"
            className="relative flex items-center gap-2 rounded-full border border-line px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.15em] transition hover:border-ink sm:px-4"
          >
            <BagIcon />
            <span className="hidden sm:inline">Bag</span>
            {count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-ink px-1 text-[11px] font-semibold text-paper">
                {count}
              </span>
            )}
          </Link>
        </div>
      </header>

      <MobileMenu open={open} onClose={() => setOpen(false)} categories={categories} count={count} pathname={pathname} />
    </>
  );
}

/* Full-screen editorial mobile menu */
function MobileMenu({ open, onClose, categories, count, pathname }) {
  const links = [
    { href: "/", label: "Home" },
    { href: "/shop", label: "Shop all" },
    { href: "/about", label: "About" },
    { href: "/cart", label: `Your bag${count > 0 ? ` (${count})` : ""}` },
  ];
  return (
    <div
      id="mobile-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      className={`fixed inset-0 z-50 sm:hidden ${open ? "" : "pointer-events-none"}`}
    >
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
      />
      {/* Panel — slides down from the top */}
      <div
        className={`absolute inset-x-0 top-0 flex max-h-[100dvh] flex-col overflow-y-auto bg-ink text-paper transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-[5%]">
          <span className="font-sans text-base font-bold uppercase tracking-tight">Menu</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-white/10"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-[5%] pb-10 pt-2">
          {/* Primary links */}
          <nav>
            {links.map(({ href, label }) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  className="flex items-center justify-between border-t border-white/10 py-4 font-sans text-2xl font-semibold uppercase tracking-tight"
                >
                  <span className={active ? "text-white" : "text-white/85"}>{label}</span>
                  <Arrow />
                </Link>
              );
            })}
          </nav>

          {/* Categories */}
          {categories.length > 0 && (
            <div className="mt-8">
              <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-white/40">Shop by category</p>
              <div className="mt-4 grid grid-cols-2 gap-x-4">
                {categories.map((c) => (
                  <Link
                    key={c.id ?? c.name}
                    href={`/shop?category=${encodeURIComponent(c.name)}`}
                    onClick={onClose}
                    className="flex items-center justify-between border-t border-white/10 py-3 font-mono text-[13px] uppercase tracking-[0.1em] text-white/75 transition hover:text-white"
                  >
                    {c.name}
                    <span className="text-white/30">→</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <Link
            href="/shop"
            onClick={onClose}
            className="mt-9 flex w-full items-center justify-center rounded-full bg-paper px-6 py-3.5 font-mono text-[12px] uppercase tracking-[0.15em] text-ink transition hover:bg-white/90"
          >
            Start shopping ↗
          </Link>
          <div className="mt-4 flex items-center justify-center gap-3">
            <p className="text-center font-mono text-[11px] leading-relaxed text-white/40">
              No account needed — order straight to WhatsApp.
            </p>
            {/* Admin — small icon, deliberately placed only here in this menu. */}
            <Link
              href="/admin"
              onClick={onClose}
              aria-label="Admin dashboard"
              title="Admin"
              className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-white/10 text-white/35 transition hover:border-white/30 hover:text-white/80"
            >
              <AdminIcon />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Arrow() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="text-white/50">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function AdminIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5l-8-3Z" />
      <path d="m9.5 12 1.8 1.8L14.5 10" />
    </svg>
  );
}
