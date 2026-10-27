import { fetchDou } from "./sources/dou.ts";

const vacancies = await fetchDou();
console.log(`DOU: ${vacancies.length}`);
console.log(vacancies.slice(0, 3));
