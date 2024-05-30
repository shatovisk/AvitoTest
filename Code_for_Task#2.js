const puppeteer = require('puppeteer');
const fs = require('fs');
const pixelmatch = require('pixelmatch');
const PNG = require('pngjs').PNG;

async function createScreenshot(element, path) {
  if (element) {
    await element.screenshot({ path });
  } else {
    throw new Error(`Element not found for selector`);
  }
}

async function createFullPageScreenshot(page, path) {
  await page.screenshot({ path, fullPage: true });
}

async function compareImages(img1Path, img2Path, diffPath) {
  const img1 = PNG.sync.read(fs.readFileSync(img1Path));
  const img2 = PNG.sync.read(fs.readFileSync(img2Path));
  const { width, height } = img1;
  const diff = new PNG({ width, height });

  const numDiffPixels = pixelmatch(img1.data, img2.data, diff.data, width, height, { threshold: 0.1 });
  fs.writeFileSync(diffPath, PNG.sync.write(diff));
  return numDiffPixels;
}

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://www.avito.ru/avito-care/eco-impact', { waitUntil: 'load', timeout: 0 });

  // Создаем папки для хранения изображений
  if (!fs.existsSync('output')) fs.mkdirSync('output');
  if (!fs.existsSync('output/baseline')) fs.mkdirSync('output/baseline');
  if (!fs.existsSync('output/diff')) fs.mkdirSync('output/diff');

  // Массив тест-кейсов
  const testCases = [
    { name: 'TC_ECO_001', desc: 'Скриншот всей страницы', selector: null },
    { name: 'TC_ECO_002', desc: 'Скриншот заголовка страницы', selector: '.desktop-wrapper-saQEa' }, // заменить на реальный селектор
    { name: 'TC_ECO_003', desc: 'Скриншот изображения на странице', selector: '.desktop-frog-TwIs_' }, // заменить на реальный селектор
    { name: 'TC_ECO_004', desc: 'Скриншот кнопки', selector: '.styles-item-hsxqs' }, // заменить на реальный селектор
    { name: 'TC_ECO_005', desc: 'Скриншот секции страницы', selector: '.desktop-wrapper-jWOWh' } // заменить на реальный селектор
  ];

  // Основной цикл по тест-кейсам
  for (const testCase of testCases) {
    const screenshotPath = `output/${testCase.name}.png`;
    const baselinePath = `output/baseline/${testCase.name}.png`;
    const diffPath = `output/diff/${testCase.name}.png`;

    console.log(`Running: ${testCase.desc}`);

    if (testCase.selector) {
      const elementHandle = await page.$(testCase.selector);
      try {
        await createScreenshot(elementHandle, screenshotPath);
      } catch (error) {
        console.log(`Failed to take screenshot for ${testCase.desc}: ${error.message}`);
        continue;
      }
    } else {
      await createFullPageScreenshot(page, screenshotPath);
    }

    if (fs.existsSync(baselinePath)) {
      const numDiffPixels = await compareImages(screenshotPath, baselinePath, diffPath);

      if (numDiffPixels > 0) {
        console.log(`Differences found in ${testCase.name}.png: ${numDiffPixels} pixels different`);
      } else {
        console.log(`${testCase.name}.png matches the baseline image`);
      }
    } else {
      console.log(`Baseline image not found for ${testCase.name}.png, saving as baseline.`);
      fs.copyFileSync(screenshotPath, baselinePath);
    }
  }

  await browser.close();
})();
