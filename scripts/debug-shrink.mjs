// Diagnostic : que voit elementFromPoint sous le pointeur pendant le glisser ?
import { chromium } from 'playwright'

const BASE = 'http://localhost:5173'
const EMAIL = 'demo@tabnest.demo'
const PASSWORD = 'DemoCapture-2025!'

async function login(page) {
  await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 30000 })
  await page.getByLabel('Votre adresse e-mail').fill(EMAIL)
  await page.getByRole('button', { name: 'Commencer', exact: true }).click()
  await page.waitForTimeout(700)
  await page.getByRole('button', { name: /^Connexion$/ }).click()
  await page.locator('#password').fill(PASSWORD)
  await page.getByRole('button', { name: /^Se connecter$/ }).click()
  await page.getByText(/Ce qui compte revient|What matters comes back/).waitFor({ timeout: 20000 })
}

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await login(page)
  await page.getByRole('button', { name: /Modifier|Edit/ }).first().click()
  await page.getByText(/Mode déplacement|Move mode/).waitFor({ timeout: 5000 })

  const target = page.locator('[data-drop-target="explore"]').first()
  const tb = await target.boundingBox()
  const overlay = page.locator('[data-site] article [role="button"][aria-label]').first()
  const box = await overlay.boundingBox()
  console.log('cible :', tb, 'carte :', box)

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  for (let i = 1; i <= 6; i += 1) {
    await page.mouse.move(box.x + box.width / 2 + i * 10, box.y + box.height / 2 + i * 10)
    await page.waitForTimeout(20)
  }
  await page.mouse.move(tb.x + tb.width / 2, tb.y + tb.height / 2, { steps: 12 })
  await page.waitForTimeout(300)

  const info = await page.evaluate(
    ({ x, y }) => {
      const el = document.elementFromPoint(x, y)
      const ghost = Array.from(document.querySelectorAll('article')).find(
        (node) => getComputedStyle(node).position === 'fixed',
      )
      return {
        element: el ? `${el.tagName}.${String(el.className).slice(0, 60)}` : null,
        dropTarget: el?.closest('[data-drop-target]')?.dataset.dropTarget ?? null,
        ghost: ghost
          ? {
              transform: getComputedStyle(ghost).transform,
              pointerEvents: getComputedStyle(ghost).pointerEvents,
              rect: ghost.getBoundingClientRect().toJSON(),
            }
          : null,
        targetsInDom: document.querySelectorAll('[data-drop-target]').length,
      }
    },
    { x: tb.x + tb.width / 2, y: tb.y + tb.height / 2 },
  )
  console.log(JSON.stringify(info, null, 2))

  await page.mouse.up()
  await browser.close()
}

main().catch((error) => {
  console.error('ERREUR :', error.message)
  process.exit(1)
})
