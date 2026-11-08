import { chromium } from "playwright"
import path from "node:path"
import os from "node:os"
import fs from "node:fs"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const extensionPath = path.join(root, "extension")
const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "tabnest-shot-"))
const context = await chromium.launchPersistentContext(userDataDir, {
  headless: false,
  args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
})
let worker = context.serviceWorkers()[0]
if (!worker) worker = await context.waitForEvent("serviceworker")
const id = new URL(worker.url()).host
const page = await context.newPage()
await page.setViewportSize({ width: 336, height: 720 })
await page.goto(`chrome-extension://${id}/popup.html`)
await page.waitForTimeout(500)
await page.screenshot({ path: "public/screenshots/popup-auth.png" })
await page.locator("#email").fill(process.env.TABNEST_DEMO_EMAIL ?? '')
await page.locator("#password").fill(process.env.TABNEST_DEMO_PASSWORD ?? '')
await page.locator("#login-btn").click()
await page.waitForTimeout(2500)
await page.locator("details summary", { hasText: "Importer" }).click()
await page.locator("details summary", { hasText: "Fermer les onglets" }).click()
await page.waitForTimeout(300)
await page.screenshot({ path: "public/screenshots/popup-connected.png" })
await page.emulateMedia({ colorScheme: "dark" })
await page.waitForTimeout(300)
await page.screenshot({ path: "public/screenshots/popup-connected-dark.png" })
await context.close()
fs.rmSync(userDataDir, { recursive: true, force: true })
console.log("captures popup écrites")
