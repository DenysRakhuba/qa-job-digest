// Title: role and level.
export const QA_ROLE =
  /\b(qa|aqa|аqa|sdet|test|tester|testing|quality)\b|тест/i;
export const MANAGEMENT =
  /\b(lead|manager|head|director|architect|principal|staff|chief)\b|(?<![а-яёіїєґ])лід|менеджер/i;
export const SENIOR = /\b(senior|sr\.?|expert|exceptional)\b|сеньйор|синьор/i;
export const MIDDLE = /\b(middle|mid|regular)\b|мідл/i;
export const JUNIOR = /\b(junior|jun)\b|джуніор/i;
export const TRAINEE = /\b(trainee|intern|internship)\b|стаж[еу]р|стажист/i;
export const MANUAL_TITLE = /\b(manual)\b|мануал|ручн/i;
export const AUTOMATION_TITLE = /auto|aqa|аqa|sdet|автомат/i;

// Text: always excluded.
export const AUTOMATION_TEXT =
  /playwright|cypress|selenium|webdriver|appium|puppeteer|pytest|testng|junit|rest.?assured|automation|автоматиз|автотест/i;
export const CRYPTO =
  /crypto|(?<![а-яёіїєґ])крипт|web3|blockchain|блокчейн|\bdefi\b|\bnft\b|bitcoin|ethereum|solana|smart.contract|смарт.контракт|\bdapp/i;
export const DEFENSE =
  /(?<![а-яёіїєґ])зсу(?![а-яёіїєґ])|(?<![а-яёіїєґ])армі[яїюі]|військ|оцсп|міноборони|оборон|\bdefen[cs]e\b|military(?! veteran)|\barmy\b|miltech|мілтех|drone|дрон|бпла|безпілот|\buav\b/i;
export const FOREIGN_LANGUAGE =
  /\b(german|polish|dutch|french|finnish|swedish|norwegian|danish|italian|spanish|czech|romanian|hebrew)\b[^.\n]{0,25}\b(c1|c2|b2|fluent|native)\b|\b(fluent|native)\b[^.\n]{0,15}\b(german|polish|dutch|french|finnish|swedish|norwegian|danish|italian|spanish|czech|romanian|hebrew)\b/i;

// Text: format and location.
export const REMOTE = /віддален|remote|удален|дистанц|work from home|\bwfh\b/i;
export const OFFICE_OR_HYBRID =
  /\bhybrid\b|гібрид|гибрид|\boffice\b|офіс|офис|on-?site|days per week/i;
export const ABROAD =
  /за кордоном|за рубежом|abroad|worldwide|anywhere|\beu\b|\beurope|європ|европ|poland|польщ|krakow|warsaw|germany|portugal|spain|bucharest|romania|netherlands|\buk\b|london/i;
export const FINLAND = /finland|фінлянд|финлянд|helsinki|гельсінкі|suomi/i;

// Text: stack and skills.
export const PLAYWRIGHT = /playwright/i;
export const TYPESCRIPT = /typescript|\bts\b/i;
export const JAVASCRIPT = /javascript|\bjs\b|node\.?js/i;
export const CYPRESS = /cypress/i;
export const JAVA = /\bjava\b|selenium/i;
export const PYTHON = /python|pytest/i;
export const CSHARP = /c#|\.net\b/i;
export const API_TESTING =
  /api.{0,15}(test|automation|тест)|rest.?assured|postman|swagger|openapi|graphql|rest api/i;
export const CI_CD =
  /ci\/cd|github actions|gitlab.ci|jenkins|azure devops|circleci|pipeline/i;
export const ACCESSIBILITY = /accessibility|a11y|wcag|axe-core/i;
export const FRONTEND = /angular|frontend|front-end/i;
