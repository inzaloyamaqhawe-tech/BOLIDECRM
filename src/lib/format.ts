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

function normalizeForCompare(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

/** Finds an existing name that's *close* to the typed one but not an exact
 * match — catches a typo ("AJ Propertie's") that would otherwise silently
 * create a near-duplicate company record. Returns the closest candidate
 * within a small edit-distance budget, or undefined if nothing's close. */
export function findSimilarName(typed: string, existingNames: string[]): string | undefined {
  const normTyped = normalizeForCompare(typed);
  if (!normTyped) return undefined;
  let best: { name: string; distance: number } | undefined;
  for (const name of existingNames) {
    const normExisting = normalizeForCompare(name);
    if (normExisting === normTyped) return undefined; // exact match — not a "did you mean"
    const distance = levenshtein(normTyped, normExisting);
    const budget = normExisting.length <= 6 ? 1 : normExisting.length <= 12 ? 2 : 3;
    if (distance <= budget && (!best || distance < best.distance)) {
      best = { name, distance };
    }
  }
  return best?.name;
}
