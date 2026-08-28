import {
  ensureGoogleAccessToken,
  loadGoogleConnection,
  type GoogleConnection,
} from "@/lib/google/auth";

export type GoogleCalendarConnection = Pick<
  GoogleConnection,
  "email" | "calendarId" | "calendarAutoSync"
> & { accessToken: string; expiresAt: number; autoSync: boolean };

export function loadCalendarConnection(): GoogleCalendarConnection | null {
  const c = loadGoogleConnection();
  if (!c?.accessToken) return null;
  return {
    accessToken: c.accessToken,
    expiresAt: c.expiresAt,
    email: c.email,
    calendarId: c.calendarId,
    autoSync: c.calendarAutoSync,
    calendarAutoSync: c.calendarAutoSync,
  };
}

export {
  connectGoogle as connectGoogleCalendar,
  disconnectGoogle as disconnectGoogleCalendar,
  ensureGoogleAccessToken as ensureCalendarToken,
  loadGoogleConnection,
  saveGoogleConnection,
} from "@/lib/google/auth";

export async function upsertCalendarReminderEvent(input: {
  subscriptionId: string;
  title: string;
  renewalDate: string;
  notifyTime: string;
  daysBefore: number;
  amount: number | null;
  existingEventId?: string | null;
}): Promise<string> {
  const connection = loadGoogleConnection();
  if (!connection?.calendarAutoSync || !connection.accessToken) {
    throw new Error("Google Calendar غير مربوط");
  }

  const token = await ensureGoogleAccessToken();
  const [hours, minutes] = input.notifyTime.split(":").map(Number);
  const start = new Date(`${input.renewalDate}T00:00:00`);
  start.setDate(start.getDate() - input.daysBefore);
  start.setHours(hours ?? 9, minutes ?? 0, 0, 0);
  const end = new Date(start.getTime() + 30 * 60 * 1000);

  const body = {
    summary: `تجديد: ${input.title}`,
    description: `تذكير من مصاريفي — ${input.amount ?? ""}`,
    start: { dateTime: start.toISOString(), timeZone: "Africa/Cairo" },
    end: { dateTime: end.toISOString(), timeZone: "Africa/Cairo" },
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 0 },
        { method: "email", minutes: 60 },
      ],
    },
  };

  const calendarId = encodeURIComponent(connection.calendarId);
  const eventId = input.existingEventId;

  const url = eventId
    ? `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${encodeURIComponent(eventId)}`
    : `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`;

  const response = await fetch(url, {
    method: eventId ? "PUT" : "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error("تعذر إنشاء حدث في Google Calendar");
  }

  const data = (await response.json()) as { id: string };
  return data.id;
}
