import { chromium } from "playwright"
const b = await chromium.launch()
async function shot(name, width, height, steps) {
  const p = await b.newPage({ viewport: { width, height } })
  await p.addInitScript(() => localStorage.setItem("tabnest-theme", "dark"))
  await p.goto("http://localhost:5173/", { waitUntil: "networkidle" })
  await p.waitForTimeout(700)
  if (steps) await steps(p)
  await p.waitForTimeout(600)
  await p.screenshot({ path: `public/screenshots/${name}.png` })
  const info = await p.evaluate(() => ({
    dark: document.documentElement.classList.contains("dark"),
    bodyBg: getComputedStyle(document.body).backgroundColor,
    bodyColor: getComputedStyle(document.body).color,
  }))
  console.log(name, JSON.stringify(info))
  await p.close()
}
await shot("dark-landing-1280", 1280, 900)
await shot("dark-auth-1280", 1280, 900, async (p) => {
  await p.getByRole("button", { name: "Commencer", exact: true }).click()
})
await shot("dark-auth-390", 390, 844, async (p) => {
  await p.getByRole("button", { name: "Commencer", exact: true }).click()
})
await b.close()
