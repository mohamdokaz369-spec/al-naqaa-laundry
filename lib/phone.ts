export function normalizePhone(phone: string): string {
  const digits = phone.replace(/[\s()+-]/g, "");
  if (/^05\d{8}$/.test(digits)) return `972${digits.slice(1)}`;
  if (/^9725\d{8}$/.test(digits)) return digits;
  return "";
}
