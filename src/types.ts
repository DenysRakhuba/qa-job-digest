export type Source = "dou" | "djinni";

export type Vacancy = {
  source: Source;
  title: string;
  link: string;
  description: string;
  publishedAt: string;
};

export type Verdict =
  | { kind: "excluded"; reason: string }
  | { kind: "scored"; score: number; reasons: string[]; warnings: string[] };

export type ScoredVacancy = Vacancy & {
  score: number;
  reasons: string[];
  warnings: string[];
};
