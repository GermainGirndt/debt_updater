const puppeteer = require("puppeteer");
const dateFns = require("date-fns");

function delay(timeout) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
}

const today = new Date();

const minimalSalaries = [
  { startDate: new Date(2021, 01 - 1, 01), value: 1100 },
  { startDate: new Date(2020, 02 - 1, 01), value: 1045 },
  { startDate: new Date(2020, 01 - 1, 01), value: 1039 },
  { startDate: new Date(2019, 01 - 1, 01), value: 998 },
];

debts = [];

const initial_date = new Date(2019, 05 - 1, 15);
let comparingDate = initial_date;
const final_date = new Date(2021, 04 - 1, 16);

console.log(initial_date, final_date);

let finalDateIsNotReached = true;

while (finalDateIsNotReached) {
  minimalSalaryInForce = minimalSalaries.find((minimalSalary) => {
    wasInForce = dateFns.isAfter(comparingDate, minimalSalary.startDate);
    return wasInForce;
  });

  debt = {
    label:
      dateFns.format(comparingDate, "MM/yyyy") +
      " - Principal Pensão Alimentícia - 11% do SM",
    date: dateFns.format(comparingDate, "ddMMyyyy"),
    value: `${minimalSalaryInForce.value * (11 / 100)}`.replace(".", ","),
  };

  debts.push(debt);

  comparingDate = dateFns.add(comparingDate, { months: 1 });
  finalDateIsNotReached = dateFns.isBefore(comparingDate, final_date);
  console.log(comparingDate, finalDateIsNotReached);
}

console.log(initial_date, final_date);
console.log(debts);

async function addLine(page, debt) {
  await page.type("#formRelatorivoA", debt.label);
  await page.focus("#formDataInicial_input");
  await page.waitForSelector("#formDataInicial_input", {
    display: "block",
  });
  await page.type("#formDataInicial_input", debt.date);
  await page.type("#formValor_input", debt.value);

  await page.click("#btnVincularValorAtualizacao");
}

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(
    "http://www8.tjmg.gov.br/cadej/pages/web/calculoSimples.xhtml"
  );

  for (debt of debts) {
    await addLine(page, debt);
    await delay(3000);
  }

  await page.click("#btnCalcular");
  await delay(3000);

  await Promise.all([
    page.$eval("li a[href*='tabVisualizarCalculo']", (el) => el.click()),
    page.waitForNavigation(),
  ]).catch((e) => console.log(e));

  await page.click("#j_idt206");
})();
