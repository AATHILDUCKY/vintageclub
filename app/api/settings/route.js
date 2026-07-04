import { z } from "zod";
import { route, ok, fail } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import {
  getPublicSettings,
  setSetting,
  getVariantOptions,
  setVariantOptions,
  setPaymentOptions,
} from "@/lib/models";

function normalizeWhatsAppNumber(value, defaultCountryCode = "94") {
  let digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith(defaultCountryCode) && digits.length >= 10) return digits;
  if (digits.startsWith("0") && digits.length === 10 && defaultCountryCode) {
    return `${defaultCountryCode}${digits.slice(1)}`;
  }
  return digits;
}

function isValidWhatsAppNumber(value, defaultCountryCode = "94") {
  const normalized = normalizeWhatsAppNumber(value, defaultCountryCode);
  return /^\d{10,15}$/.test(normalized);
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public: store name, currency, WhatsApp number, plus the size/colour option
// pools the product form draws its toggle chips from.
export const GET = route(async () => {
  return ok({ settings: getPublicSettings(), variantOptions: getVariantOptions() });
});

const schema = z.object({
  storeName: z.string().min(1).optional(),
  currency: z.string().min(1).optional(),
  whatsappNumber: z.string().min(1).optional(),
  // Logo: a data-URI (uploaded) or "" to remove. Capped to keep the row small.
  logo: z.string().max(1_500_000).optional(),
  // Master option pools for the product form.
  sizeOptions: z.array(z.string()).optional(),
  colourOptions: z.array(z.string()).optional(),
  paymentOptions: z.array(z.object({
    id: z.string().optional(),
    name: z.string().min(1).max(40),
    icon: z.string().max(1_500_000).default(""),
    enabled: z.boolean().default(true),
  })).max(12).optional(),
});

// Admin only: update store settings + WhatsApp receiving number.
export const PUT = route(async (req) => {
  await requireAdmin();
  const b = schema.parse(await req.json());
  if (b.storeName !== undefined) setSetting("store_name", b.storeName);
  if (b.currency !== undefined) setSetting("currency", b.currency);
  if (b.logo !== undefined) setSetting("store_logo", b.logo);
  if (b.whatsappNumber !== undefined) {
    const normalized = normalizeWhatsAppNumber(b.whatsappNumber);
    if (!isValidWhatsAppNumber(normalized)) {
      return fail(400, "WhatsApp number must be 10–15 digits after normalization.");
    }
    setSetting("whatsapp_number", normalized);
  }
  if (b.sizeOptions !== undefined || b.colourOptions !== undefined) {
    setVariantOptions({ sizes: b.sizeOptions, colours: b.colourOptions });
  }
  if (b.paymentOptions !== undefined) setPaymentOptions(b.paymentOptions);
  return ok({ settings: getPublicSettings(), variantOptions: getVariantOptions() });
});
