// Imports
const puppeteer = require("puppeteer");
const dateFns = require("date-fns");

// Declare Functions

function delayMs(timeout) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
}

function addDebtInfo(minimalSalaries, debts, updatedComparingDate) {
  minimalSalaryInForce = minimalSalaries.find((minimalSalary) => {
    wasInForce = dateFns.isAfter(updatedComparingDate, minimalSalary.startDate);
    return wasInForce;
  });

  debt = {
    label:
      dateFns.format(updatedComparingDate, "MM/yyyy") +
      " - Principal Pensão Alimentícia - 11% do SM",
    date: dateFns.format(updatedComparingDate, "ddMMyyyy"),
    value: `${minimalSalaryInForce.value * (11 / 100)}`.replace(".", ","),
  };

  debts.push(debt);
}

function addAllDebInfos(
  minimalSalaries,
  debts,
  updatedComparingDate,
  final_date
) {
  let isFinalDateNotReached = true;
  while (isFinalDateNotReached) {
    addDebtInfo(minimalSalaries, debts, updatedComparingDate);

    updatedComparingDate = dateFns.add(updatedComparingDate, { months: 1 });
    isFinalDateNotReached = dateFns.isBefore(updatedComparingDate, final_date);
  }
}

async function launchBrowserInPage(pageToOpen) {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(pageToOpen);

  return page;
}

async function addDebtLineToPage(debt, page) {
  await page.type("#formRelatorivoA", debt.label);
  await page.focus("#formDataInicial_input");
  await page.waitForSelector("#formDataInicial_input", {
    display: "block",
  });
  await page.type("#formDataInicial_input", debt.date);
  await page.type("#formValor_input", debt.value);

  await page.click("#btnVincularValorAtualizacao");
}

async function addDebtLinesToPageWithInterval(debts, page, interval) {
  for (debt of debts) {
    await addDebtLineToPage(debt, page);
    await delayMs(interval);
  }
}

async function calculateDebts(buttonId, delay) {
  await page.click(buttonId);
  await delayMs(delay);
}

async function openTab(tabRef) {
  await Promise.all([
    page.$eval(tabRef, (el) => el.click()),
    page.waitForNavigation(),
  ]).catch((e) => console.log(e));
}

// Initialize Variables
const INTERVAL_BETWEEN_ACTIONS = 3000;
const today = new Date();
const initial_date = new Date(2019, 05 - 1, 15);
let updatedComparingDate = initial_date;
const final_date = new Date(2021, 04 - 1, 16);
const TJMG_CALC_PAGE =
  "http://www8.tjmg.gov.br/cadej/pages/web/calculoSimples.xhtml";
const minimalSalaries = [
  { startDate: new Date(2021, 01 - 1, 01), value: 1100 },
  { startDate: new Date(2020, 02 - 1, 01), value: 1045 },
  { startDate: new Date(2020, 01 - 1, 01), value: 1039 },
  { startDate: new Date(2019, 01 - 1, 01), value: 998 },
];
debts = [];
const CALC_BUTTON_ID = "#btnCalcular";
const SHOW_CALC_TAB_REF = "li a[href*='tabVisualizarCalculo']";
const DOWNLOAD_BUTTON_ID = "#j_idt206";

/////////////////////////////////////////////////////
////////////////                     ////////////////
////////////////     Run Program     ////////////////
////////////////                     ////////////////
/////////////////////////////////////////////////////

addAllDebInfos(minimalSalaries, debts, updatedComparingDate, final_date);

(async () => {
  const page = await launchBrowserInPage(TJMG_CALC_PAGE);

  await addDebtLinesToPageWithInterval(debts, page, INTERVAL_BETWEEN_ACTIONS);

  await calculateDebts(CALC_BUTTON_ID, INTERVAL_BETWEEN_ACTIONS);

  await page.focus("#formDataInicial_input");
  await page.waitForSelector("#formDataInicial_input", {
    display: "block",
  });
  await page.type("#formDataInicial_input", debt.date);

  await openTab(SHOW_CALC_TAB_REF);

  await page.click(DOWNLOAD_BUTTON_ID);
})();
