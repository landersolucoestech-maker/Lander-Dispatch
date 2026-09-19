const DAY_MS = 86_400_000;

function atNoon(date: Date) {
  const next = new Date(date);
  next.setHours(12, 0, 0, 0);
  return next;
}

export function mockDate(dayOffset = 0) {
  const date = atNoon(new Date(Date.now() + dayOffset * DAY_MS));
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function mockDateTime(dayOffset = 0, hour = 9, minute = 0) {
  const date = atNoon(new Date(Date.now() + dayOffset * DAY_MS));
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}
