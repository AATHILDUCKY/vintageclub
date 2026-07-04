"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { compressImageToWebP, formatBytes } from "@/lib/imageCompress";

const TEXT_GROUPS = [
  {
    title: "Hero",
    fields: [
      { key: "hero_heading", label: "Hero heading", type: "text", hint: "The big statement line in the hero." },
      { key: "hero_sub", label: "Hero description", type: "area", hint: "Short paragraph under the heading." },
      { key: "meta_left", label: "Hero label — left", type: "text" },
      { key: "meta_right", label: "Hero label — right", type: "text" },
    ],
  },
  {
    title: "Ticker",
    fields: [
      { key: "ticker", label: "Announcement ticker", type: "area", hint: "One message per line — they scroll across the top." },
      { key: "quote", label: "Editorial quote", type: "area" },
    ],
  },
  {
    title: "Lookbook",
    fields: [
      { key: "lookbook_label", label: "Lookbook eyebrow", type: "text" },
      { key: "lookbook_heading", label: "Lookbook heading", type: "text" },
      { key: "look1_tag", label: "Look 1 — tag", type: "text" },
      { key: "look1_label", label: "Look 1 — caption", type: "text" },
      { key: "look2_tag", label: "Look 2 — tag", type: "text" },
      { key: "look2_label", label: "Look 2 — caption", type: "text" },
      { key: "look3_tag", label: "Look 3 — tag", type: "text" },
      { key: "look3_label", label: "Look 3 — caption", type: "text" },
    ],
  },
  {
    title: "Call to action",
    fields: [
      { key: "cta_heading", label: "CTA heading", type: "text" },
      { key: "cta_text", label: "CTA description", type: "area" },
    ],
  },
  {
    title: "Footer statement",
    fields: [
      { key: "footer_eyebrow", label: "Footer eyebrow", type: "text" },
      { key: "footer_heading", label: "Footer heading (large)", type: "text" },
      { key: "footer_tagline", label: "Footer tagline", type: "text" },
      { key: "footer_text", label: "Footer description", type: "area" },
    ],
  },
  {
    title: "About page",
    fields: [
      { key: "about_eyebrow", label: "About eyebrow", type: "text" },
      { key: "about_since", label: "Since year", type: "text" },
      { key: "about_heading", label: "About heading", type: "area" },
      { key: "about_intro", label: "About intro", type: "area" },
      { key: "about_story_heading", label: "Story heading", type: "text" },
      { key: "about_story", label: "Story paragraph", type: "area" },
      { key: "about_value1_title", label: "Value 1 — title", type: "text" },
      { key: "about_value1_text", label: "Value 1 — text", type: "area" },
      { key: "about_value2_title", label: "Value 2 — title", type: "text" },
      { key: "about_value2_text", label: "Value 2 — text", type: "area" },
      { key: "about_value3_title", label: "Value 3 — title", type: "text" },
      { key: "about_value3_text", label: "Value 3 — text", type: "area" },
      { key: "about_cta_heading", label: "CTA heading", type: "text" },
      { key: "about_cta_text", label: "CTA text", type: "area" },
    ],
  },
];

const IMAGE_FIELDS = [
  { key: "hero_image", label: "Hero image", ratio: "aspect-[4/5]" },
  { key: "editorial_image", label: "Editorial image", ratio: "aspect-[16/9]" },
  { key: "look1_image", label: "Lookbook 1", ratio: "aspect-[4/5]" },
  { key: "look2_image", label: "Lookbook 2", ratio: "aspect-[4/5]" },
  { key: "look3_image", label: "Lookbook 3", ratio: "aspect-[4/5]" },
  { key: "about_image", label: "About hero image", ratio: "aspect-[4/5]" },
  { key: "about_second_image", label: "About story image", ratio: "aspect-[4/5]" },
];

const TRUST_IMAGE_FIELDS = [
  { key: "value1_image", fallbackKey: "value1_icon", titleKey: "value1_title", textKey: "value1_text", label: "Trust card 1" },
  { key: "value2_image", fallbackKey: "value2_icon", titleKey: "value2_title", textKey: "value2_text", label: "Trust card 2" },
  { key: "value3_image", fallbackKey: "value3_icon", titleKey: "value3_title", textKey: "value3_text", label: "Trust card 3" },
  { key: "value4_image", fallbackKey: "value4_icon", titleKey: "value4_title", textKey: "value4_text", label: "Trust card 4" },
];

const TRUST_SECTION_FIELDS = [
  { key: "values_eyebrow", label: "Section eyebrow", type: "text" },
  { key: "values_heading", label: "Section heading", type: "text", hint: "Large heading shown above the trust cards." },
  { key: "values_intro", label: "Section description", type: "area", hint: "Short supporting copy above the cards." },
];

const SECTION_LINKS = [
  { id: "overview", label: "Overview", hint: "Page shortcuts" },
  { id: "images", label: "Images", hint: "Hero, editorial, about" },
  { id: "trust", label: "Trust section", hint: "Heading + 4 cards" },
  ...TEXT_GROUPS.map((group) => ({
    id: slugify(group.title),
    label: group.title,
    hint: `${group.fields.length} field${group.fields.length === 1 ? "" : "s"}`,
  })),
];

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function ContentPage() {
  const router = useRouter();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    fetch("/api/content", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (d.content) setForm(d.content); });
  }, []);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); setMsg(null); }

  async function onImage(k, file, options = {}) {
    if (!file) return;
    try {
      setMsg(null);
      const compressed = await compressImageToWebP(file, { maxBytes: 64 * 1024, maxDimension: 1500, ...options });
      set(k, compressed.dataUri);
      setMsg({ type: "ok", text: `Converted to WebP (${formatBytes(compressed.bytes)}).` });
    } catch (err) {
      setMsg({ type: "error", text: err.message || "Image compression failed." });
    }
  }

  async function save(e) {
    e.preventDefault();
    setMsg(null);
    setSaving(true);
    const res = await fetch("/api/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok || !data.ok) return setMsg({ type: "error", text: data.error || "Save failed." });
    setMsg({ type: "ok", text: "Content updated." });
    router.refresh();
  }

  if (!form) return <p className="text-sm text-ash">Loading…</p>;

  return (
    <div className="w-full">
      <div className="mb-6 rounded-2xl border border-line bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ash">Storefront CMS</p>
            <h1 className="mt-2 font-display text-2xl font-bold sm:text-3xl">Store content</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ash">
              Update the storefront section by section. Images, copy, and trust cards are grouped together so the page is easier to manage.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/" target="_blank" className="btn-ghost px-3 py-1.5 text-xs">Home ↗</a>
            <a href="/about" target="_blank" className="btn-ghost px-3 py-1.5 text-xs">About ↗</a>
          </div>
        </div>

        <div id="overview" className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="border border-line bg-smoke px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash">Sections</p>
            <p className="mt-2 text-2xl font-semibold">{SECTION_LINKS.length - 1}</p>
          </div>
          <div className="border border-line bg-smoke px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash">Image groups</p>
            <p className="mt-2 text-2xl font-semibold">3</p>
          </div>
          <div className="border border-line bg-smoke px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash">Save state</p>
            <p className={`mt-2 text-sm font-medium ${msg?.type === "ok" ? "text-emerald-600" : msg?.type === "error" ? "text-red-600" : "text-ash"}`}>
              {saving ? "Saving changes..." : msg?.text || "Ready to edit"}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-4 overflow-x-auto no-scrollbar lg:hidden">
        <div className="flex gap-2 pb-1">
          {SECTION_LINKS.map((section) => (
            <a key={section.id} href={`#${section.id}`} className="whitespace-nowrap border border-line bg-white px-3 py-2 font-mono text-[11px] uppercase tracking-[0.15em] text-ash hover:text-ink">
              {section.label}
            </a>
          ))}
        </div>
      </div>

      <form onSubmit={save} className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-6 border border-line bg-white p-3">
            <p className="px-2 pb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-ash">Page sections</p>
            <nav className="space-y-1">
              {SECTION_LINKS.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="block border border-transparent px-2 py-2 transition hover:border-line hover:bg-smoke"
                >
                  <p className="text-sm font-medium">{section.label}</p>
                  <p className="mt-0.5 text-[11px] text-ash">{section.hint}</p>
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <div className="space-y-6">
          <SectionPanel
            id="images"
            title="Images"
            description="Manage hero, editorial, lookbook, and about-page media."
          >
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {IMAGE_FIELDS.map(({ key, label, ratio }) => (
                <div key={key} className="border border-line p-3">
                  <label className="label">{label}</label>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form[key]} alt={label} className={`${ratio} w-full border border-line object-cover`} />
                  <label className="btn-outline mt-3 w-full cursor-pointer px-3 py-2 text-xs">
                    Upload new
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => onImage(key, e.target.files?.[0])} />
                  </label>
                </div>
              ))}
            </div>
            <p className="text-xs text-ash">Upload clean originals. Images are converted to WebP and compressed under 64KB before saving.</p>
          </SectionPanel>

          <SectionPanel
            id="trust"
            title="Trust section"
            description="Edit the full section heading, description, and all four cards together."
          >
            <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className="space-y-4 border border-line p-4">
                {TRUST_SECTION_FIELDS.map(({ key, label, type, hint }) => (
                  <FieldControl
                    key={key}
                    label={label}
                    type={type}
                    hint={hint}
                    value={form[key] ?? ""}
                    onChange={(value) => set(key, value)}
                  />
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {TRUST_IMAGE_FIELDS.map(({ key, fallbackKey, titleKey, textKey, label }, index) => (
                  <div key={key} className="border border-line p-3">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-[11px] text-ash">Image, title, and supporting text</p>
                      </div>
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ash">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="overflow-hidden border border-line bg-smoke">
                        {form[key] || form[fallbackKey] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={form[key] || form[fallbackKey]}
                            alt={label}
                            className="aspect-[4/3] w-full object-cover"
                          />
                        ) : (
                          <div className="flex aspect-[4/3] items-center justify-center font-mono text-[10px] uppercase tracking-wide text-ash">Image preview</div>
                        )}
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <label className="btn-outline w-full cursor-pointer px-3 py-2 text-xs">
                          Upload image
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => onImage(key, e.target.files?.[0], { maxDimension: 1100, minDimension: 260 })} />
                        </label>
                        {(form[key] || form[fallbackKey]) && (
                          <button
                            type="button"
                            className="btn-ghost w-full px-3 py-2 text-xs"
                            onClick={() => { set(key, ""); if (fallbackKey) set(fallbackKey, ""); }}
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <FieldControl
                        label="Card title"
                        value={form[titleKey] ?? ""}
                        onChange={(value) => set(titleKey, value)}
                      />

                      <FieldControl
                        label="Card text"
                        value={form[textKey] ?? ""}
                        onChange={(value) => set(textKey, value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-ash">Everything for this section is managed here in one place.</p>
          </SectionPanel>

          {TEXT_GROUPS.map((group) => (
            <SectionPanel
              key={group.title}
              id={slugify(group.title)}
              title={group.title}
              description={`${group.fields.length} editable field${group.fields.length === 1 ? "" : "s"} in this section.`}
            >
              <div className="grid gap-4 xl:grid-cols-2">
                {group.fields.map(({ key, label, type, hint }) => (
                  <div key={key} className={type === "area" ? "xl:col-span-2" : ""}>
                    <FieldControl
                      label={label}
                      type={type}
                      hint={hint}
                      value={form[key] ?? ""}
                      onChange={(value) => set(key, value)}
                    />
                  </div>
                ))}
              </div>
            </SectionPanel>
          ))}

          <div className="sticky bottom-4 z-10 border border-line bg-white p-3 shadow-[0_14px_40px_rgba(18,18,18,0.08)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className={`text-sm ${msg?.type === "ok" ? "text-emerald-600" : msg?.type === "error" ? "text-red-600" : "text-ash"}`}>
                {saving ? "Saving changes..." : msg?.text || "Changes are ready to save."}
              </p>
              <button className="btn-primary px-5 py-2.5" disabled={saving}>{saving ? "Saving..." : "Save changes"}</button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function SectionPanel({ id, title, description, children }) {
  return (
    <section id={id} className="border border-line bg-white p-5 sm:p-6">
      <div className="mb-5 flex flex-col gap-2 border-b border-line pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash">{title}</p>
          <h2 className="mt-1 text-xl font-semibold">{title}</h2>
        </div>
        {description && <p className="max-w-2xl text-sm text-ash">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function FieldControl({ label, type = "text", hint, value, onChange }) {
  return (
    <div>
      <label className="label">{label}</label>
      {type === "area" ? (
        <textarea className="input min-h-[96px]" value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className="input" value={value} onChange={(e) => onChange(e.target.value)} />
      )}
      {hint && <p className="mt-1 text-xs text-ash">{hint}</p>}
    </div>
  );
}
