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

  if (!re.QA_ROLE.test(title)) return excluded("not a QA role");
  if (re.MANAGEMENT.test(title)) return excluded("lead/manager");
  if (re.SENIOR.test(title) && !middle) return excluded("Senior");
  if (re.TRAINEE.test(title)) return excluded("trainee/intern");
  if (re.MANUAL_TITLE.test(title) && !re.AUTOMATION_TITLE.test(title)) {
    return excluded("manual testing");
  }
  if (!re.AUTOMATION_TEXT.test(text))
    return excluded("no automation in the description");
  if (re.CRYPTO.test(text)) return excluded("crypto/Web3");
  if (re.DEFENSE.test(text)) return excluded("army/defense");
  if (re.FOREIGN_LANGUAGE.test(text))
    return excluded("another working language");
  if (top !== undefined && top < MIN_SALARY)
    return excluded(`salary up to $${top}`);
  if (!remote && re.OFFICE_OR_HYBRID.test(text))
    return excluded("office/hybrid");
  if (junior && !abroad && (top === undefined || top < MIN_SALARY)) {
    return excluded("Junior in Ukraine without a $2500+ salary");
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
    add(50, "Playwright + TypeScript, the main stack");
  else if (playwright) add(35, "Playwright in the stack");
  else if (typescript) add(15, "TypeScript in the stack");
  else if (javascript) add(15, "JavaScript/Node.js in the stack");

  if (cypress && !playwright) {
    add(15, "Cypress, close to Playwright");
    warnings.push("different stack: Cypress instead of Playwright");
  }

  if (!playwright && !cypress && !typescript && !javascript) {
    if (re.JAVA.test(text)) warnings.push("Java/Selenium only, low priority");
    else if (re.PYTHON.test(text)) warnings.push("Python only, low priority");
    else if (re.CSHARP.test(text)) warnings.push("C#/.NET only, low priority");
  }

  if (re.API_TESTING.test(text)) add(10, "API testing");
  if (re.CI_CD.test(text)) add(10, "CI/CD");
  if (re.ACCESSIBILITY.test(text))
    add(5, "accessibility (a11y), axe-core experience");
  if (re.FRONTEND.test(text))
    add(5, "frontend context, 9 years of frontend experience");

  if (middle) {
    add(10, "Middle level");
    if (re.SENIOR.test(title))
      warnings.push("Middle/Senior, may expect more experience");
  } else if (junior) {
    add(-5, "Junior");
    warnings.push(
      abroad
        ? "Junior: check that the job is really outside Ukraine"
        : "Junior, below the target level",
    );
  }

  if (remote && abroad) add(20, "remote, EU/worldwide");
  else if (remote) add(15, "remote");
  else warnings.push("work format not stated");

  if (re.FINLAND.test(text)) {
    add(-15, "Finland");
    warnings.push("Finland, low priority");
  }

  if (salary) add(15, `salary ${formatSalary(salary)}`);

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
