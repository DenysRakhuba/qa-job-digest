export type Salary = { min?: number; max?: number };

const NUMBER = String.raw`(\d+(?:[ ,]\d{3})*)`;
const RANGE = new RegExp(
  String.raw`[$€]\s?${NUMBER}\s?[–—-]\s?[$€]?\s?${NUMBER}`,
);
const UP_TO = new RegExp(String.raw`(?:до|up to)\s?[$€]\s?${NUMBER}`, "i");
const FROM = new RegExp(String.raw`(?:від|от|from)\s?[$€]\s?${NUMBER}`, "i");
const SINGLE = new RegExp(String.raw`[$€]\s?${NUMBER}`);

const MAX_MONTHLY = 20_000;

function toNumber(raw: string): number {
  return Number(raw.replace(/[ ,]/g, ""));
}

function plausible(salary: Salary): Salary | undefined {
  const values = [salary.min, salary.max].filter((v) => v !== undefined);
  return values.every((v) => v > 0 && v <= MAX_MONTHLY) ? salary : undefined;
}

export function parseSalary(text: string): Salary | undefined {
  const range = text.match(RANGE);
  if (range) {
    return plausible({ min: toNumber(range[1]), max: toNumber(range[2]) });
  }

  const upTo = text.match(UP_TO);
  if (upTo) {
    return plausible({ max: toNumber(upTo[1]) });
  }

  const from = text.match(FROM);
  if (from) {
    return plausible({ min: toNumber(from[1]) });
  }

  const single = text.match(SINGLE);
  if (single) {
    const value = toNumber(single[1]);
    return plausible({ min: value, max: value });
  }

  return undefined;
}

export function salaryTop(salary: Salary): number {
  return salary.max ?? salary.min ?? 0;
}

export function formatSalary(salary: Salary): string {
  if (salary.min !== undefined && salary.max !== undefined) {
    return salary.min === salary.max
      ? `$${salary.min}`
      : `$${salary.min}–${salary.max}`;
  }
  return salary.max !== undefined ? `до $${salary.max}` : `от $${salary.min}`;
}
