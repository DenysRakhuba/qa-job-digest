import type { Vacancy, Verdict } from "./types.ts";
import { formatSalary, parseSalary, salaryTop } from "./salary.ts";

const MIN_SALARY = 2500;

const QA_ROLE = /\b(qa|aqa|аqa|sdet|test|tester|testing|quality)\b|тест/i;
const MANAGEMENT =
  /\b(lead|manager|head|director|architect|principal|staff|chief)\b|(?<![а-яёіїєґ])лід|менеджер/i;
const SENIOR = /\b(senior|sr\.?|expert|exceptional)\b|сеньйор|синьор/i;
const MIDDLE = /\b(middle|mid|regular)\b|мідл/i;
const JUNIOR = /\b(junior|jun)\b|джуніор/i;
const TRAINEE = /\b(trainee|intern|internship)\b|стаж[еу]р|стажист/i;
const MANUAL_TITLE = /\b(manual)\b|мануал|ручн/i;
const AUTOMATION_TITLE = /auto|aqa|аqa|sdet|автомат/i;
const AUTOMATION_TEXT =
  /playwright|cypress|selenium|webdriver|appium|puppeteer|pytest|testng|junit|rest.?assured|automation|автоматиз|автотест/i;

const CRYPTO =
  /crypto|(?<![а-яёіїєґ])крипт|web3|blockchain|блокчейн|\bdefi\b|\bnft\b|bitcoin|ethereum|solana|smart.contract|смарт.контракт|\bdapp/i;
const FOREIGN_LANGUAGE =
  /\b(german|polish|dutch|french|finnish|swedish|norwegian|danish|italian|spanish|czech|romanian|hebrew)\b[^.\n]{0,25}\b(c1|c2|b2|fluent|native)\b|\b(fluent|native)\b[^.\n]{0,15}\b(german|polish|dutch|french|finnish|swedish|norwegian|danish|italian|spanish|czech|romanian|hebrew)\b/i;

const REMOTE = /віддален|remote|удален|дистанц|work from home|\bwfh\b/i;
const OFFICE_OR_HYBRID =
  /\bhybrid\b|гібрид|гибрид|\boffice\b|офіс|офис|on-?site|days per week/i;
const ABROAD =
  /за кордоном|за рубежом|abroad|worldwide|anywhere|\beu\b|\beurope|європ|европ|poland|польщ|krakow|warsaw|germany|portugal|spain|bucharest|romania|netherlands|\buk\b|london/i;
const FINLAND = /finland|фінлянд|финлянд|helsinki|гельсінкі|suomi/i;
const MILITARY =
  /(?<![а-яёіїєґ])зсу(?![а-яёіїєґ])|війська|військов[аої] частин|оцсп/i;

const PLAYWRIGHT = /playwright/i;
const TYPESCRIPT = /typescript|\bts\b/i;
const JAVASCRIPT = /javascript|\bjs\b|node\.?js/i;
const CYPRESS = /cypress/i;
const JAVA = /\bjava\b|selenium/i;
const PYTHON = /python|pytest/i;
const CSHARP = /c#|\.net\b/i;
const API_TESTING =
  /api.{0,15}(test|automation|тест)|rest.?assured|postman|swagger|openapi|graphql|rest api/i;
const CI_CD =
  /ci\/cd|github actions|gitlab.ci|jenkins|azure devops|circleci|pipeline/i;
const ACCESSIBILITY = /accessibility|a11y|wcag|axe-core/i;
const FRONTEND = /angular|frontend|front-end/i;

type Reason = { weight: number; text: string };

export function scoreVacancy(vacancy: Vacancy): Verdict {
  const { title } = vacancy;
  const text = `${title}\n${vacancy.description}`;
  const salary = parseSalary(title);
  const top = salary ? salaryTop(salary) : undefined;
  const remote = REMOTE.test(text);
  const abroad = ABROAD.test(text);

  if (!QA_ROLE.test(title)) return excluded("не QA-роль");
  if (MANAGEMENT.test(title)) return excluded("лид/менеджер");
  if (SENIOR.test(title) && !MIDDLE.test(title)) return excluded("Senior");
  if (TRAINEE.test(title)) return excluded("Trainee/стажёр");
  if (MANUAL_TITLE.test(title) && !AUTOMATION_TITLE.test(title))
    return excluded("ручное тестирование");
  if (!AUTOMATION_TEXT.test(text))
    return excluded("нет автоматизации в описании");
  if (CRYPTO.test(text)) return excluded("крипта/Web3");
  if (FOREIGN_LANGUAGE.test(text)) return excluded("нужен другой язык");
  if (top !== undefined && top < MIN_SALARY)
    return excluded(`вилка до $${top}`);
  if (!remote && OFFICE_OR_HYBRID.test(text)) return excluded("офис/гибрид");

  const junior = JUNIOR.test(title) && !MIDDLE.test(title);
  if (junior && !abroad && (top === undefined || top < MIN_SALARY)) {
    return excluded("Junior в Украине без вилки от $2500");
  }

  const reasons: Reason[] = [];
  const warnings: string[] = [];

  const playwright = PLAYWRIGHT.test(text);
  const typescript = TYPESCRIPT.test(text);
  const javascript = JAVASCRIPT.test(text);
  const cypress = CYPRESS.test(text);

  if (playwright && typescript) {
    reasons.push({
      weight: 50,
      text: "Playwright + TypeScript — твой основной стек",
    });
  } else if (playwright) {
    reasons.push({ weight: 35, text: "Playwright в стеке" });
  } else if (typescript || javascript) {
    reasons.push({
      weight: 15,
      text: typescript ? "TypeScript в стеке" : "JavaScript/Node.js в стеке",
    });
  }

  if (cypress && !playwright) {
    reasons.push({ weight: 15, text: "Cypress — близко к твоему опыту" });
    warnings.push("стек отличается: Cypress вместо Playwright");
  }

  if (!playwright && !cypress && !typescript && !javascript) {
    if (JAVA.test(text))
      warnings.push("только Java/Selenium — низкий приоритет");
    else if (PYTHON.test(text))
      warnings.push("только Python — низкий приоритет");
    else if (CSHARP.test(text))
      warnings.push("только C#/.NET — низкий приоритет");
  }

  if (API_TESTING.test(text))
    reasons.push({ weight: 10, text: "API-тестирование" });
  if (CI_CD.test(text)) reasons.push({ weight: 10, text: "CI/CD в задачах" });
  if (ACCESSIBILITY.test(text))
    reasons.push({
      weight: 5,
      text: "доступность (a11y) — есть опыт с axe-core",
    });
  if (FRONTEND.test(text))
    reasons.push({
      weight: 5,
      text: "фронтенд-контекст — твои 9 лет пригодятся",
    });

  // Level.
  if (MIDDLE.test(title)) {
    reasons.push({ weight: 10, text: "уровень Middle" });
    if (SENIOR.test(title))
      warnings.push("Middle/Senior — могут ждать больше опыта");
  } else if (junior) {
    reasons.push({ weight: -5, text: "Junior" });
    warnings.push(
      abroad
        ? "Junior: проверь, что работа правда вне Украины"
        : "Junior — уровень ниже основного",
    );
  }

  if (remote && abroad)
    reasons.push({ weight: 20, text: "удалёнка, ЕС/весь мир" });
  else if (remote) reasons.push({ weight: 15, text: "удалёнка" });
  else warnings.push("формат работы не указан");

  if (FINLAND.test(text)) {
    reasons.push({ weight: -15, text: "Финляндия" });
    warnings.push("Финляндия — низкий приоритет");
  }

  if (salary)
    reasons.push({ weight: 15, text: `вилка ${formatSalary(salary)}` });
  if (MILITARY.test(text))
    warnings.push("вакансия в ЗСУ — уточни, не служба ли это");

  const score = Math.max(
    0,
    Math.min(
      100,
      reasons.reduce((sum, r) => sum + r.weight, 0),
    ),
  );
  const topReasons = reasons
    .filter((r) => r.weight > 0)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)
    .map((r) => r.text);

  return { kind: "scored", score, reasons: topReasons, warnings };
}

function excluded(reason: string): Verdict {
  return { kind: "excluded", reason };
}
