// ─── Business WhatsApp config ─────────────────────────────────────────────────
// Change this one constant to update the number across the entire app.
export const BUSINESS_WHATSAPP_NUMBER = "972500000000";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Converts any Israeli phone format to the E.164 digits WhatsApp requires.
 * 05XXXXXXXX → 9725XXXXXXXX, strips spaces/dashes.
 */
export function normalizePhoneForWhatsApp(phone: string): string {
  return phone.replace(/^0/, "972").replace(/\D/g, "");
}

/**
 * Returns a wa.me link for any phone number with an optional pre-filled message.
 */
export function whatsappUrl(phone: string, message?: string): string {
  const normalized = normalizePhoneForWhatsApp(phone);
  const base = `https://wa.me/${normalized}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/**
 * Returns a wa.me link to the business WhatsApp number with an optional pre-filled message.
 */
export function businessWhatsAppUrl(message?: string): string {
  const base = `https://wa.me/${BUSINESS_WHATSAPP_NUMBER}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
