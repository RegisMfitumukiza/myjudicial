export interface ICSBookingData {
  id: string;
  expertName: string;
  serviceName: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
}

function formatICSDate(isoString: string): string {
  const date = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

function escapeICS(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function generateICS(booking: ICSBookingData): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MyJudicial//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${booking.id}@myjudicial.com`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${formatICSDate(booking.start)}`,
    `DTEND:${formatICSDate(booking.end)}`,
    `SUMMARY:Consultation with ${escapeICS(booking.expertName)} - ${escapeICS(booking.serviceName)}`,
    `DESCRIPTION:${escapeICS(booking.description ?? `Legal consultation: ${booking.serviceName}`)}`,
  ];

  if (booking.location) {
    lines.push(`LOCATION:${escapeICS(booking.location)}`);
  }

  lines.push(
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Your consultation starts in 30 minutes",
    "END:VALARM",
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Your consultation starts in 1 hour",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR"
  );

  return lines.join("\r\n");
}

export function downloadICS(booking: ICSBookingData): void {
  const icsContent = generateICS(booking);
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `myjudicial-booking-${booking.id.slice(0, 8)}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
