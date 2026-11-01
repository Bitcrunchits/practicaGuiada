export function formatSessionDate(value: unknown): string {
  if (typeof value !== "string") {
    return "Fecha sin definir";
  }

  const rawValue = value.trim();

  if (rawValue.length < 10) {
    return value;
  }

  const [year, month, day] = rawValue.slice(0, 10).split("-");

  if (
    !year ||
    !month ||
    !day ||
    !/^\d{4}$/.test(year) ||
    !/^\d{2}$/.test(month) ||
    !/^\d{2}$/.test(day)
  ) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

export function toIsoDateOnly(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, 10);
}

export function getTodayIsoDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
