import { chromium } from "playwright";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, "screenshot.html");
const outDir = path.join(__dirname, "..", "packages", "vscode", "images");

const tabs = ["overview", "tasks", "messages"];

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  await page.goto(`file://${htmlPath}`);
  await page.waitForTimeout(500);

  for (const tab of tabs) {
    await page.evaluate((t) => window.switchTab(t), tab);
    await page.waitForTimeout(300);
    const clip = await page.evaluate(() => {
      const el = document.getElementById("dashboard");
      const rect = el.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    });
    await page.screenshot({
      path: path.join(outDir, `screenshot-${tab}.png`),
      clip,
    });
    console.log(`Saved screenshot-${tab}.png`);
  }

  await browser.close();
  console.log("Done!");
}

main().catch(console.error);
