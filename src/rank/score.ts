import type { Vacancy, Verdict } from "../types.ts";
import * as re from "./patterns.ts";
import { formatSalary, parseSalary, salaryTop } from "./salary.ts";

const MIN_SALARY = 2500;

type Reason = { weight: number; text: string };

export function scoreVacancy(vacancy: Vacancy): Verdict {
  const { title } = vacancy;
  const text = `${title}\n${vacancy.description}`;
  const salary = parseSalary(title);
  const top = salary ? salaryTop(salary) : undefined;
  const remote = re.REMOTE.test(text);
  const abroad = re.ABROAD.test(text);
  const middle = re.MIDDLE.test(title);
  const junior = re.JUNIOR.test(title) && !middle;

  if (!re.QA_ROLE.test(title)) return excluded("не QA-роль");
  if (re.MANAGEMENT.test(title)) return excluded("лид/менеджер");
  if (re.SENIOR.test(title) && !middle) return excluded("Senior");
  if (re.TRAINEE.test(title)) return excluded("Trainee/стажёр");
  if (re.MANUAL_TITLE.test(title) && !re.AUTOMATION_TITLE.test(title)) {
    return excluded("ручное тестирование");
  }
  if (!re.AUTOMATION_TEXT.test(text))
    return excluded("нет автоматизации в описании");
  if (re.CRYPTO.test(text)) return excluded("крипта/Web3");
  if (re.DEFENSE.test(text)) return excluded("армия/оборонка");
  if (re.FOREIGN_LANGUAGE.test(text)) return excluded("нужен другой язык");
  if (top !== undefined && top < MIN_SALARY)
    return excluded(`вилка до $${top}`);
  if (!remote && re.OFFICE_OR_HYBRID.test(text)) return excluded("офис/гибрид");
  if (junior && !abroad && (top === undefined || top < MIN_SALARY)) {
    return excluded("Junior в Украине без вилки от $2500");
  }

  const reasons: Reason[] = [];
  const warnings: string[] = [];
  const add = (weight: number, reason: string) =>
    reasons.push({ weight, text: reason });

  const playwright = re.PLAYWRIGHT.test(text);
  const typescript = re.TYPESCRIPT.test(text);
  const javascript = re.JAVASCRIPT.test(text);
  const cypress = re.CYPRESS.test(text);

  if (playwright && typescript)
    add(50, "Playwright + TypeScript — твой основной стек");
  else if (playwright) add(35, "Playwright в стеке");
  else if (typescript) add(15, "TypeScript в стеке");
  else if (javascript) add(15, "JavaScript/Node.js в стеке");

  if (cypress && !playwright) {
    add(15, "Cypress — близко к твоему опыту");
    warnings.push("стек отличается: Cypress вместо Playwright");
  }

  if (!playwright && !cypress && !typescript && !javascript) {
    if (re.JAVA.test(text))
      warnings.push("только Java/Selenium — низкий приоритет");
    else if (re.PYTHON.test(text))
      warnings.push("только Python — низкий приоритет");
    else if (re.CSHARP.test(text))
      warnings.push("только C#/.NET — низкий приоритет");
  }

  if (re.API_TESTING.test(text)) add(10, "API-тестирование");
  if (re.CI_CD.test(text)) add(10, "CI/CD в задачах");
  if (re.ACCESSIBILITY.test(text))
    add(5, "доступность (a11y) — есть опыт с axe-core");
  if (re.FRONTEND.test(text))
    add(5, "фронтенд-контекст — твои 9 лет пригодятся");

  if (middle) {
    add(10, "уровень Middle");
    if (re.SENIOR.test(title))
      warnings.push("Middle/Senior — могут ждать больше опыта");
  } else if (junior) {
    add(-5, "Junior");
    warnings.push(
      abroad
        ? "Junior: проверь, что работа правда вне Украины"
        : "Junior — уровень ниже основного",
    );
  }

  if (remote && abroad) add(20, "удалёнка, ЕС/весь мир");
  else if (remote) add(15, "удалёнка");
  else warnings.push("формат работы не указан");

  if (re.FINLAND.test(text)) {
    add(-15, "Финляндия");
    warnings.push("Финляндия — низкий приоритет");
  }

  if (salary) add(15, `вилка ${formatSalary(salary)}`);

  const total = reasons.reduce((sum, r) => sum + r.weight, 0);
  const topReasons = reasons
    .filter((r) => r.weight > 0)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)
    .map((r) => r.text);

  return {
    kind: "scored",
    score: Math.max(0, Math.min(100, total)),
    reasons: topReasons,
    warnings,
  };
}

function excluded(reason: string): Verdict {
  return { kind: "excluded", reason };
}
