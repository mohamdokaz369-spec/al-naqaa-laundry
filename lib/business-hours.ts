const OPEN_HOUR = 9;
const CLOSE_HOUR = 17;

export function isBusinessHours(): boolean {
  const now = new Date();
  const h = now.getHours();
  const day = now.getDay(); // 0=Sun, 5=Fri, 6=Sat
  if (day === 5 || day === 6) return false; // Friday/Saturday closed
  return h >= OPEN_HOUR && h < CLOSE_HOUR;
}

// Returns a time slot for the next available business window.
// If currently within hours, returns today's next slot (rounded up to next half hour).
// Otherwise returns 09:00 the next business day.
export function getNextBusinessSlot(): { date: string; time: string } {
  const now = new Date();
  const d = new Date(now);

  function isWeekend(day: number) {
    return day === 5 || day === 6;
  }

  function nextBusinessDay(from: Date): Date {
    const d2 = new Date(from);
    d2.setDate(d2.getDate() + 1);
    while (isWeekend(d2.getDay())) {
      d2.setDate(d2.getDate() + 1);
    }
    return d2;
  }

  const h = d.getHours();
  const min = d.getMinutes();

  // If today is a business day and we're before closing with room for a slot
  if (!isWeekend(d.getDay()) && h < CLOSE_HOUR - 1) {
    if (h >= OPEN_HOUR) {
      // Round up to next half hour
      const roundedMin = min < 30 ? 30 : 60;
      const slotH = roundedMin === 60 ? h + 1 : h;
      const slotM = roundedMin === 60 ? 0 : 30;
      if (slotH < CLOSE_HOUR) {
        const dateStr = d.toISOString().split("T")[0];
        const timeStr = `${String(slotH).padStart(2, "0")}:${String(slotM).padStart(2, "0")}`;
        return { date: dateStr, time: timeStr };
      }
    }
  }

  // Fall through — use next business day at 09:00
  const next = nextBusinessDay(d);
  return {
    date: next.toISOString().split("T")[0],
    time: "09:00",
  };
}

export function businessStatusMessage(): string {
  if (isBusinessHours()) {
    return "سيتصل بك فريقنا خلال ساعة لتأكيد موعد الاستلام.";
  }
  const slot = getNextBusinessSlot();
  return `طلبك مسجل. سنتواصل معك في بداية الدوام (${slot.date} الساعة ${slot.time}) لتأكيد الموعد.`;
}
