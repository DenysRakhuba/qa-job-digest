import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { scoreVacancy } from "../../src/rank/score.ts";
import type { Vacancy, Verdict } from "../../src/types.ts";

function vacancy(title: string, description: string): Vacancy {
  return {
    source: "dou",
    title,
    link: "https://example.com/1/",
    description,
    publishedAt: "Tue, 27 Oct 2026 12:00:00 +0200",
  };
}

function reasonOf(verdict: Verdict): string | undefined {
  return verdict.kind === "excluded" ? verdict.reason : undefined;
}

function scored(verdict: Verdict) {
  assert.equal(verdict.kind, "scored");
  return verdict;
}

describe("scoreVacancy: hard filters", () => {
  it("excludes Senior roles", () => {
    const verdict = scoreVacancy(
      vacancy("Senior QA Automation Engineer", "Playwright, remote"),
    );
    assert.equal(reasonOf(verdict), "Senior");
  });

  it("keeps Middle/Senior with a warning", () => {
    const verdict = scored(
      scoreVacancy(vacancy("Middle/Senior AQA", "Playwright, remote")),
    );
    assert.ok(verdict.warnings.some((w) => w.includes("Middle/Senior")));
  });

  it("excludes leads and managers", () => {
    const verdict = scoreVacancy(
      vacancy("QA Team Lead (Manual and Automation)", "Playwright"),
    );
    assert.equal(reasonOf(verdict), "лид/менеджер");
  });

  it("excludes non-QA automation roles", () => {
    const verdict = scoreVacancy(
      vacancy("Network Automation Engineer (Ansible)", "automation"),
    );
    assert.equal(reasonOf(verdict), "не QA-роль");
  });

  it("excludes manual-only titles", () => {
    const verdict = scoreVacancy(vacancy("Manual QA Engineer", "Playwright"));
    assert.equal(reasonOf(verdict), "ручное тестирование");
  });

  it("excludes crypto", () => {
    const verdict = scoreVacancy(
      vacancy("QA Automation Engineer", "Playwright, crypto exchange, remote"),
    );
    assert.equal(reasonOf(verdict), "крипта/Web3");
  });

  it("excludes army and defense", () => {
    for (const description of [
      "Playwright, IT-підрозділ ЗСУ",
      "Playwright, defense sector, remote",
      "Playwright, БПЛА",
    ]) {
      const verdict = scoreVacancy(
        vacancy("QA Automation Engineer", description),
      );
      assert.equal(reasonOf(verdict), "армия/оборонка");
    }
  });

  it("keeps companies that only mention supporting veterans", () => {
    const verdict = scoreVacancy(
      vacancy(
        "QA Automation Engineer",
        "Playwright, remote. We support military veterans",
      ),
    );
    assert.equal(verdict.kind, "scored");
  });

  it("does not mistake Ukrainian 'скрипт' for crypto", () => {
    const verdict = scoreVacancy(
      vacancy("QA Automation Engineer", "Bash-скриптів, Playwright, віддалено"),
    );
    assert.equal(verdict.kind, "scored");
  });

  it("excludes a salary below $2500", () => {
    const verdict = scoreVacancy(
      vacancy("Automation QA в Company, $1900–2300, віддалено", "Playwright"),
    );
    assert.equal(reasonOf(verdict), "вилка до $2300");
  });

  it("keeps a range that reaches $2500", () => {
    const verdict = scoreVacancy(
      vacancy("Automation QA в Company, $2000–2500, віддалено", "Playwright"),
    );
    assert.equal(verdict.kind, "scored");
  });

  it("excludes office-only roles", () => {
    const verdict = scoreVacancy(
      vacancy("QA Automation Engineer", "Playwright. Hybrid, 2 days per week"),
    );
    assert.equal(reasonOf(verdict), "офис/гибрид");
  });

  it("excludes a Junior in Ukraine without a $2500 salary", () => {
    const verdict = scoreVacancy(
      vacancy("Junior AQA Engineer", "Playwright, віддалено"),
    );
    assert.equal(reasonOf(verdict), "Junior в Украине без вилки от $2500");
  });

  it("keeps a Junior abroad", () => {
    const verdict = scoreVacancy(
      vacancy("Junior AQA Engineer", "Playwright, remote from Europe"),
    );
    assert.equal(verdict.kind, "scored");
  });

  it("excludes roles that need another language", () => {
    const verdict = scoreVacancy(
      vacancy(
        "QA Automation Engineer",
        "Playwright, remote. Fluent German required",
      ),
    );
    assert.equal(reasonOf(verdict), "нужен другой язык");
  });
});

describe("scoreVacancy: ranking", () => {
  it("ranks Playwright + TypeScript above Java + Selenium", () => {
    const playwright = scored(
      scoreVacancy(
        vacancy("QA Automation Engineer", "Playwright, TypeScript, remote"),
      ),
    );
    const selenium = scored(
      scoreVacancy(vacancy("QA Automation Engineer", "Java, Selenium, remote")),
    );
    assert.ok(playwright.score > selenium.score);
    assert.ok(
      selenium.warnings.includes("только Java/Selenium — низкий приоритет"),
    );
  });

  it("marks Cypress as a different stack", () => {
    const verdict = scored(
      scoreVacancy(vacancy("QA Automation Engineer", "Cypress, remote")),
    );
    assert.ok(
      verdict.warnings.includes("стек отличается: Cypress вместо Playwright"),
    );
  });

  it("gives at most three reasons, strongest first", () => {
    const verdict = scored(
      scoreVacancy(
        vacancy(
          "Middle QA Automation Engineer",
          "Playwright, TypeScript, API testing, GitHub Actions, remote, EU",
        ),
      ),
    );
    assert.equal(verdict.reasons.length, 3);
    assert.equal(
      verdict.reasons[0],
      "Playwright + TypeScript — твой основной стек",
    );
  });

  it("caps the score at 100", () => {
    const verdict = scored(
      scoreVacancy(
        vacancy(
          "Middle SDET, від $4000",
          "Playwright, TypeScript, API testing, CI/CD, accessibility, Angular, remote, worldwide",
        ),
      ),
    );
    assert.equal(verdict.score, 100);
  });

  it("ranks Middle above Junior at the same stack", () => {
    const middle = scored(
      scoreVacancy(
        vacancy("Middle AQA Engineer", "Playwright, remote, Europe"),
      ),
    );
    const junior = scored(
      scoreVacancy(
        vacancy("Junior AQA Engineer", "Playwright, remote, Europe"),
      ),
    );
    assert.ok(middle.score > junior.score);
  });

  it("shows the salary in reasons", () => {
    const verdict = scored(
      scoreVacancy(
        vacancy("QA Automation в X, від $3000, віддалено", "Playwright"),
      ),
    );
    assert.ok(verdict.reasons.includes("вилка от $3000"));
  });

  it("lowers Finland", () => {
    const remote = scored(
      scoreVacancy(vacancy("QA Automation Engineer", "Playwright, remote")),
    );
    const finland = scored(
      scoreVacancy(
        vacancy("QA Automation Engineer", "Playwright, remote, Helsinki"),
      ),
    );
    assert.ok(finland.score < remote.score);
  });
});
