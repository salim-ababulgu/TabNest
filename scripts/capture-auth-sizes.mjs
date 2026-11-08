import { chromium } from "playwright"
const b = await chromium.launch()
for (const [name, w, h] of [["auth-tablet-768", 768, 1024], ["auth-small-320", 320, 640]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } })
  await p.goto("http://localhost:5173/", { waitUntil: "networkidle" })
  await p.getByRole("button", { name: "Commencer", exact: true }).click()
  await p.waitForTimeout(800)
  await p.screenshot({ path: `public/screenshots/${name}.png` })
  await p.close()
}
await b.close()
console.log("captures tablette + petit écran écrites")
