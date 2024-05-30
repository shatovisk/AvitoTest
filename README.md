# Скриншотное тестирование с использованием Puppeteer, Pixelmatch и PNGJS

Эта инструкция описывает шаги для настройки и выполнения скриншотного тестирования вашего веб-сайта с использованием Puppeteer, Pixelmatch и PNGJS. 

## Шаг 1: Установка Node.js и npm

Убедитесь, что у вас установлены Node.js и npm. Если нет, установите их, следуя инструкциям на официальном сайте Node.js.

## Шаг 2: Подготовка рабочего каталога

Создайте новый рабочий каталог для вашего проекта и перейдите в него:


1. mkdir screenshot-tests
2. cd screenshot-tests


## Шаг 3: Инициализация проекта и установка зависимостей

Инициализируйте проект и установите необходимые зависимости:

1. npm init -y
2. npm install puppeteer pixelmatch pngjs


## Шаг 4: Создание рабочего скрипта

Создайте файл screenshot-tests-with-diffs.js и вставьте в него следующий код:

javascript




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
    { name: 'TC_ECO_002', desc: 'Скриншот заголовка страницы', selector: '.desktop-wrapper-saQEa' }, 
    { name: 'TC_ECO_003', desc: 'Скриншот изображения на странице', selector: '.desktop-frog-TwIs_' }, 
    { name: 'TC_ECO_004', desc: 'Скриншот кнопки', selector: '.styles-item-hsxqs' }, 
    { name: 'TC_ECO_005', desc: 'Скриншот секции страницы', selector: '.desktop-wrapper-jWOWh' } 
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



## Шаг 5: Запуск скрипта

Для выполнения скрипта и создания скриншотов выполните следующую команду:

node screenshot-tests-with-diffs.js


## Объяснение кода

1. Импорт зависимостей:
   - Подключаем puppeteer, fs, pixelmatch и pngjs.

2. Функции для создания и сравнения скриншотов:
   - createScreenshot(element, path): Создает скриншот указанного элемента.
   - createFullPageScreenshot(page, path): Создает скриншот всей страницы.
   - compareImages(img1Path, img2Path, diffPath): Сравнивает два изображения и сохраняет изображение с различиями, если они есть.

3. Основной поток выполнения:
   - Запуск браузера и открытие страницы.
   - Цикл по каждому тест-кейсу для создания и сравнения скриншотов соответствующих элементов или всей страницы.
   - Создание папок для текущих, эталонных и изображений с различиями.
   - Вывод результатов о наличии различий.

## Ожидаемый результат

1. Формирование скриншотов:
   - Скрипт создаст скриншоты для всех определенных тест-кейсов и сохранит их в папке output.

2. Сравнение с базовыми изображениями:
   - При наличии базовых изображений скрипт выполнит сравнение и сохранит диффы (различия) в папке output/diff.

3. Логирование результатов:
   - В консоль будут выведены результаты выполнения, включая информацию о наличии различий пикселей.

Файлы будут сохранены в структуре:
- output/
  - Текущие скриншоты.
- output/baseline/
  - Базовые скриншоты.
- output/diff/
  - Изображения с различиями.

Теперь вы готовы провести скриншотное тестирование и отслеживать визуальные изменения вашего сайта!


