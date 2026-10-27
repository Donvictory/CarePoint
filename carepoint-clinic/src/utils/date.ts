const dateFmt = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const dayHeadingFmt = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const timeFmt = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});

const zoneFmt = new Intl.DateTimeFormat(undefined, { timeZoneName: "short" });

const dayKeyFmt = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export const formatDate = (iso: string): string => dateFmt.format(new Date(iso));

export const formatDayHeading = (iso: string): string =>
  dayHeadingFmt.format(new Date(iso));

export const formatTime = (iso: string): string => timeFmt.format(new Date(iso));

export const formatTimeRange = (startIso: string, endIso: string): string =>
  `${formatTime(startIso)} to ${formatTime(endIso)}`;

export const dayKey = (iso: string): string => dayKeyFmt.format(new Date(iso));

export function durationMinutes(startIso: string, endIso: string): number {
  return Math.round((Date.parse(endIso) - Date.parse(startIso)) / 60000);
}

export function timeZoneLabel(iso: string): string {
  const part = zoneFmt
    .formatToParts(new Date(iso))
    .find((p) => p.type === "timeZoneName");
  return part?.value ?? "";
}
