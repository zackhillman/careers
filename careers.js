const puppeteer = require('puppeteer');
var $ = require('jQuery');
const fs = require('fs');
const readlineSync = require('readline-sync');

var outputArray = [];
var errorCount = 0;
var total = 0;
var totalPostings = 0;

var startTime = 0;

async function start() {
  var browser = await puppeteer.launch({headless:true});
  var pages = await browser.pages();
  var page = pages[0];
  try {
      await scrapePage(page,browser);
  } catch (err) {
    console.log("ERROR"+(errorCount+1));
    errorCount++;
    if (errorCount < 5) {
        scrapePage(page, browser,0);
    }
  }
}

async function scrapePage(page, browser) {
      //Setup to get to postings page
      await page.goto('https://nucareers.northeastern.edu/myAccount/co-op/jobs.htm');
      var title = await page.title();
      if (title.includes("Not Logged In")) {
       await handleLogin(page);
      }

      await page.waitFor("#mainContentDiv > div.orbisModuleHeader > div > div > h1");

      var titleElement = await page.$("#mainContentDiv > div.orbisModuleHeader > div > div > h1");
      var titleText = await titleElement.evaluate((element) => {
        return element.innerText;
      });
      if (titleText.includes("Co-op Job Postings")) {
        await page.waitFor('#quickSearchCountsContainer > table:nth-child(1) > tbody > tr:nth-child(1) > td.full > a');

        totalPostings = await page.$eval('#quickSearchCountsContainer > table:nth-child(1) > tbody > tr:nth-child(1) > td.value > span', (element) => {
            return element.innerText;
        })
        await page.click('#quickSearchCountsContainer > table:nth-child(1) > tbody > tr:nth-child(1) > td.full > a');
      }
      await page.waitFor('.pagination');
      console.log("Successful log in");
      var pagination = await page.$('.pagination');

      var tabs = (await pagination.$$('li')).slice(2,-2); //list of pages (remove arrows)


      //When new tab is created get data and add it to outputArray
      browser.on('targetcreated', async(target) => {

          var newPage = await target.page();
          var newPageTitle = await newPage.title();
          if (newPageTitle == "Northeastern University - MyAccount - Cooperative Education - Job Postings / Applications") {
            await newPage.waitFor('#postingDiv');
            // await newPage.waitFor({waitUntil: 'networkidle'});
            const result = await newPage.evaluate(() => {
                var tablepost = $('#postingDiv table');

                var myRows = [];
                var headersText = [];
                var outputMap = Object.create(null);

                var $rows = $(tablepost).find("tbody tr").each(function(index) {
                  $cells = $(this).find("td");
                  if ($cells.length == 2) {
                    var key = $cells[0].innerText;
                    outputMap[key.slice(0, -1)] = $cells[1].innerText;
                  }
                });
                return outputMap;

            });
            newPage.close();
            outputArray.push(result);
          }
        });
        printStatus();
        startTime = new Date();

      //Start on page 2 because first
      for (var pageNumber = 0; pageNumber < tabs.length; pageNumber++) {
        pagination = await page.$('.pagination');
        tabs = (await pagination.$$('li')).slice(2,-2);

        tabs[pageNumber].click();
        await page.waitFor(1000);
        await page.waitFor('#postingsTable');

        var table = await page.$('#postingsTable');

        var links = await table.$$('.btn-primary');
        await page.waitFor(1000);
        let amount = 5;
        var count = 0;

        for (var linkNumber = 0; linkNumber < links.length-80; linkNumber++) {
          printStatus();
          links[linkNumber].click().catch(async (err) => {
            table = await page.$('#postingsTable');
            if (table == null) {
                throw new Error("cant be null");
            }
            links = await table.$$('.btn-primary');
            await page.waitFor(1000);
            links[linkNumber].click();
          });
          count++;
          total++;

          if (count >= amount || linkNumber >= links.length-1) {
            var times = 0;
              while (outputArray.length < total) {
                if (times > 20) {
                    throw new Error("Stuck");
                }
                  await page.waitFor(500);
                  times +=1;
              }
              linkNumber += count;
              count = 0;
          }
        }
        writeCSV(outputArray); //Write data after every page
      }
      console.log("Done!");
      browser.close();
}

function handleLogin(page) {
  var username = readlineSync.question('Enter username: ');
  var password = readlineSync.question('Enter password: ', {hideEchoBack: true});
  handleInput(username, password, page);
}

async function handleInput(username, password, page) {
  await page.click('body > div.container-fluid > div > div > div.box.boxContent > div > div > div > div.row-fluid > h2:nth-child(2) > a:nth-child(1)');
  await page.waitForNavigation({waitUntil : 'load'});
  await page.type('#username', username);
  await page.type('#password', password);
  console.log("Attempting to log in");
  await page.click('body > section > div > div:nth-child(1) > div > form > div:nth-child(3) > button');
}



start();

function writeCSV(writeArray) {
  fs.writeFile("output.txt", JSON.stringify(writeArray), (err) => {
    if (err) throw err;
  });
}


function printStatus() {
  var saved = (outputArray.length+1);
  var totalClicked = (total+1)
  var timeElapsed = (new Date() - startTime)/1000;
  var percent = Math.round((Number(outputArray.length)/Number(totalPostings))*100);
  var remainingTime = Math.round(timeElapsed * (100/percent))

  var message = `Saved: [${saved}] Clicked: [${totalClicked}] Total: [${totalPostings}] ${percent} % -- ${timeElapsed} s / ${remainingTime} s`;

  const emptyLine = ''.padEnd(process.stdout.columns, ' ')
  process.stdout.write(emptyLine + '\r')
  process.stdout.write(message+'\r')
}
