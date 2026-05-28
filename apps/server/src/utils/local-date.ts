const APP_TIME_ZONE = "Asia/Shanghai";

export function getLocalDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

export function getTomorrowLocalDateKey(date = new Date()) {
  const next = new Date(date.getTime() + 24 * 60 * 60 * 1000);
  return getLocalDateKey(next);
}
