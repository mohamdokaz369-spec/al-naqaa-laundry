export const BUSINESS_TIME_ZONE = "Asia/Jerusalem";
export function businessClock(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: BUSINESS_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const get = (key: string) => parts.find(p => p.type === key)!.value;
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
}
export function isWorkingDate(date: string) {
  const parsed = new Date(`${date}T12:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}
export function isBusinessHours(now = new Date()): boolean {
  const { date, time } = businessClock(now);
  return isWorkingDate(date) && time >= "09:00" && time < "18:00";
}
export function getNextBusinessSlot(now = new Date()): { date: string; time: string } {
  const clock = businessClock(now);
  let date = clock.date;
  const [hour, minute] = clock.time.split(":").map(Number);
  const minutes = Math.max(540, (Math.floor((hour * 60 + minute) / 30) + 1) * 30);
  if (isWorkingDate(date) && minutes < 1080) return { date, time: `${String(Math.floor(minutes / 60)).padStart(2,"0")}:${String(minutes % 60).padStart(2,"0")}` };
  do {
    const next = new Date(`${date}T12:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    date = next.toISOString().slice(0,10);
  } while (!isWorkingDate(date));
  return { date, time: "09:00" };
}
export function businessStatusMessage(): string {
  if (isBusinessHours()) return "طلبك مسجل. سيتواصل معك فريقنا لتأكيد موعد الاستلام.";
  const slot = getNextBusinessSlot();
  return `طلبك مسجل. سنتواصل معك في بداية الدوام (${slot.date} الساعة ${slot.time}) لتأكيد الموعد.`;
}

/** Available pickup appointments in the laundry timezone; closing time is excluded. */
export function pickupSlots(date: string, now = new Date()): string[] {
  const clock = businessClock(now);
  if (!isWorkingDate(date) || date < clock.date) return [];
  const slots: string[] = [];
  for (let minute = 9 * 60; minute < 18 * 60; minute += 30) {
    const time = `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
    if (date > clock.date || time > clock.time) slots.push(time);
  }
  return slots;
}
