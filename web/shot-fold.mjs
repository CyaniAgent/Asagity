import { chromium } from "playwright";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 820 }, deviceScaleFactor: 2 });
await page.goto("http://localhost:2000/login", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);

// locate the init-account button
const btn = page.getByText("初始化新账号").first();
await btn.waitFor({ timeout: 8000 });

// before
await page.screenshot({ path: "C:/Users/p1590/AppData/Local/Temp/fold-0.png" });

await btn.click();
await page.waitForTimeout(380);
await page.screenshot({ path: "C:/Users/p1590/AppData/Local/Temp/fold-1.png" });
await page.waitForTimeout(900);
await page.screenshot({ path: "C:/Users/p1590/AppData/Local/Temp/fold-2.png" });

await browser.close();
console.log("done");
