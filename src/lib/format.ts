export function formatZAR(value: number): string {
  if (!value) return "R 0";
  const rounded = Math.round(value);
  return "R " + rounded.toLocaleString("en-ZA");
}

export function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `R${(value / 1_000_000).toFixed(1)}m`;
  if (Math.abs(value) >= 1_000) return `R${(value / 1_000).toFixed(0)}k`;
  return formatZAR(value);
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function formatDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().slice(0, 10);
}
