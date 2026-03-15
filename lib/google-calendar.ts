const CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3";
const CLASS_PATTERN = /^class?e? with (.+)$/i;

// ── Raw API types ─────────────────────────────────────────────────────────────

interface GoogleCalendarEventDateTime {
  dateTime?: string; // ISO 8601, present for timed events
  date?: string;     // YYYY-MM-DD, present for all-day events
  timeZone?: string;
}

interface GoogleCalendarEventItem {
  id: string;
  summary?: string;
  start: GoogleCalendarEventDateTime;
  end: GoogleCalendarEventDateTime;
}

interface GoogleCalendarEventsResponse {
  items: GoogleCalendarEventItem[];
  nextPageToken?: string;
}

// ── Public types ──────────────────────────────────────────────────────────────

export interface ClassSession {
  eventId: string;
  clientName: string;
  date: string;        // YYYY-MM-DD
  durationHours: number; // decimal, e.g. 1.5
}

// ── Utility ───────────────────────────────────────────────────────────────────

function capitalize(name: string): string {
  return name
    .normalize("NFD")
    // Remove accent marks (á→a, é→e, ú→u) but keep the tilde (ñ stays ñ)
    .replace(/[\u0300-\u0302\u0304-\u036f]/g, "")
    .trim()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

// ── Main function ─────────────────────────────────────────────────────────────

/**
 * Fetches events from the user's primary Google Calendar within the given
 * date range and returns only "Class with [Name]" events as structured data.
 *
 * @param accessToken  - OAuth access token from the NextAuth session
 * @param startDate    - Start of the range (inclusive), e.g. first day of month
 * @param endDate      - End of the range (exclusive), e.g. first day of next month
 */
export async function getClassSessions(
  accessToken: string,
  startDate: Date,
  endDate: Date
): Promise<ClassSession[]> {
  const params = new URLSearchParams({
    timeMin: startDate.toISOString(),
    timeMax: endDate.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "2500",
  });

  const res = await fetch(
    `${CALENDAR_API_BASE}/calendars/primary/events?${params}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      // Opt out of Next.js caching so data is always fresh
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error(
      `Google Calendar API error: ${res.status} ${res.statusText}`
    );
  }

  const data: GoogleCalendarEventsResponse = await res.json();

  const sessions: ClassSession[] = [];

  for (const event of data.items) {
    const title = event.summary ?? "";
    const match = title.match(CLASS_PATTERN);

    // Skip non-matching or all-day events (no dateTime means no duration)
    if (!match || !event.start.dateTime || !event.end.dateTime) continue;

    const clientName = capitalize(match[1]);
    const startMs = new Date(event.start.dateTime).getTime();
    const endMs = new Date(event.end.dateTime).getTime();
    const durationHours = (endMs - startMs) / 3_600_000;
    const date = event.start.dateTime.slice(0, 10); // YYYY-MM-DD

    sessions.push({
      eventId: event.id,
      clientName,
      date,
      durationHours,
    });
  }

  return sessions;
}
