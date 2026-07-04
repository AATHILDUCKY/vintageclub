import Link from "next/link";
import { getHomeContent, getPublicSettings } from "@/lib/models";
import { abs, ogImage } from "@/lib/seo";

export const dynamic = "force-dynamic";

const SHELL = "mx-auto w-[90%] max-w-[1600px]";

export function generateMetadata() {
  const content = getHomeContent();
  const title = "About";
  const description = content.about_intro || "About Vintage Club.";
  return {
    title,
    description,
    alternates: { canonical: "/about" },
    openGraph: {
      type: "website",
      title,
      description,
      url: abs("/about"),
      images: [{ url: ogImage(content.about_image), alt: content.about_image_alt || title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [ogImage(content.about_image)] },
  };
}

export default function AboutPage() {
  const content = getHomeContent();
  const settings = getPublicSettings();
  const values = [
    { title: content.about_value1_title, text: content.about_value1_text },
    { title: content.about_value2_title, text: content.about_value2_text },
    { title: content.about_value3_title, text: content.about_value3_text },
  ];

  return (
    <div className="bg-paper text-ink">
      <section className={`${SHELL} py-8 sm:py-12`}>
        <div className="border-t border-ink pt-4">
          <p className="font-mono text-sm uppercase tracking-[0.22em] text-ash">
            {content.about_eyebrow}
          </p>
          <div className="mt-5 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
            <div>
              <h1 className="max-w-4xl font-sans text-4xl font-bold uppercase leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
                {content.about_heading}
              </h1>
              <p className="mt-6 max-w-2xl font-mono text-base leading-8 text-ash sm:text-lg">
                {content.about_intro}
              </p>
              <div className="mt-8 border-y border-ink py-4">
                <p className="font-sans text-4xl font-bold uppercase leading-none tracking-tight sm:text-6xl">Since</p>
                <p className="mt-1 font-sans text-6xl font-bold uppercase leading-none tracking-tight sm:text-8xl">
                  {content.about_since}
                </p>
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/shop" className="btn-primary">Shop the edit</Link>
                <Link href="/" className="btn-outline">Back home</Link>
              </div>
            </div>
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={content.about_image}
                alt={content.about_image_alt || settings.storeName}
                className="aspect-[4/5] w-full object-cover grayscale lg:max-h-[620px]"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </section>

      <section className={`${SHELL} py-10 sm:py-16`}>
        <div className="grid gap-8 border-t border-line pt-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={content.about_second_image}
              alt={content.about_second_image_alt || ""}
              className="aspect-[4/5] w-full object-cover grayscale sm:aspect-[16/11] lg:aspect-[4/5]"
              loading="lazy"
            />
          </div>
          <div className="flex flex-col justify-between">
            <div>
              <p className="font-mono text-sm uppercase tracking-[0.22em] text-ash">01 — Story</p>
              <h2 className="mt-3 font-sans text-3xl font-bold uppercase leading-none tracking-tight sm:text-5xl">
                {content.about_story_heading}
              </h2>
              <p className="mt-6 max-w-3xl text-lg leading-9 text-ash sm:text-xl">
                {content.about_story}
              </p>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {values.map((item, i) => (
                <div key={item.title} className="border-t border-ink pt-3">
                  <p className="font-mono text-sm text-ash">{String(i + 2).padStart(2, "0")}</p>
                  <h3 className="mt-3 font-sans text-2xl font-bold uppercase tracking-tight">{item.title}</h3>
                  <p className="mt-2 text-base leading-7 text-ash">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={`${SHELL} pb-16 pt-4`}>
        <div className="border border-ink bg-ink px-6 py-12 text-center text-paper sm:py-16">
          <p className="font-mono text-sm uppercase tracking-[0.24em] text-white/50">Vintage Club</p>
          <h2 className="mx-auto mt-4 max-w-3xl font-sans text-3xl font-bold uppercase leading-none tracking-tight sm:text-5xl">
            {content.about_cta_heading}
          </h2>
          <p className="mx-auto mt-4 max-w-xl font-mono text-base leading-8 text-white/60">
            {content.about_cta_text}
          </p>
          <Link href="/shop" className="btn mt-7 bg-paper text-ink hover:bg-white/90">
            Shop now
          </Link>
        </div>
      </section>
    </div>
  );
}
