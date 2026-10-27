const DOU_URL =
  "https://jobs.dou.ua/vacancies/feeds/?category=QA&search=automation";

const response = await fetch(DOU_URL, {
  headers: { "User-Agent": "job-search-digest (personal, 1 request/day)" },
});

if (!response.ok) {
  throw new Error(`DOU RSS: HTTP ${response.status}`);
}

const xml = await response.text();
const itemCount = xml.split("<item>").length - 1;

console.log(`Status: ${response.status}`);
console.log(`Items: ${itemCount}`);
console.log(xml.slice(0, 500));
