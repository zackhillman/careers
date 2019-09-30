const puppeteer = require('puppeteer');


async function run () {
    const browser = await puppeteer.launch({headless:true});
    const page = await browser.newPage();
    await page.goto('https://handins.ccs.neu.edu/courses');
    await page.waitFor('body > div:nth-child(4) > h1');

    header = await page.$('body > div:nth-child(4) > h1');
    var result = await header.evaluate( doit );

    console.log(result);
}
function doit(element) {

  return element.innerText;

}

run();
