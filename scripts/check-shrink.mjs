// Vérifie que la carte rétrécit sur une cible du menu, puis est déposée (avec une
// nouvelle tentative si le premier geste rate à cause d'un rendu en cours).
import { chromium } from 'playwright'

const BASE = 'http://localhost:5173'
const EMAIL = process.env.TABNEST_DEMO_EMAIL ?? ''
const PASSWORD = process.env.TABNEST_DEMO_PASSWORD ?? ''

async function login(page) {
  await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 30000 })
    await page.getByRole('button', { name: /Créer un compte gratuit|Create a free account/ }).first().click()
  await page.waitForTimeout(700)
  await page.getByRole('tab', { name: /^Connexion$/ }).click()
  await page.locator('#email').fill(EMAIL)
  await page.locator('#password').fill(PASSWORD)
  await page.getByRole('button', { name: /^Se connecter$/ }).click()
  await page.getByText(/Ce qui compte revient|What matters comes back/).waitFor({ timeout: 20000 })
}

function ghostScale(transform) {
  if (!transform || transform === 'none') return 1
  const match = transform.match(/matrix\(([^)]+)\)/)
  if (!match) return 1
  return Number(match[1].split(',')[0])
}

async function attempt(page) {
  const overlay = page.locator('[data-site] article [role="button"][aria-label]').first()
  await overlay.scrollIntoViewIfNeeded()
  await page.waitForTimeout(250)
  const box = await overlay.boundingBox()
  const target = page.locator('[data-drop-target="explore"]').first()
  const targetBox = await target.boundingBox()
  if (!box || !targetBox) return { ok: false, reason: 'carte ou cible introuvable' }

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  const startX = box.x + box.width / 2
  const startY = box.y + box.height / 2
  for (let i = 1; i <= 8; i += 1) {
    await page.mouse.move(startX + i * 8, startY + i * 8)
    await page.waitForTimeout(25)
  }
  const ghostCreated = await page.evaluate(() =>
    Array.from(document.querySelectorAll('article')).some(
      (el) => getComputedStyle(el).position === 'fixed',
    ),
  )
  if (!ghostCreated) {
    await page.mouse.up()
    return { ok: false, reason: 'le clone de la carte n’a pas été créé' }
  }

  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, {
    steps: 10,
  })
  await page.waitForTimeout(450)

  const info = await page.evaluate(
    ({ x, y }) => {
      const fixed = Array.from(document.querySelectorAll('article')).find(
        (el) => getComputedStyle(el).position === 'fixed',
      )
      const element = document.elementFromPoint(x, y)
      return {
        transform: fixed ? getComputedStyle(fixed).transform : null,
        dropTarget: element?.closest('[data-drop-target]')?.dataset.dropTarget ?? null,
      }
    },
    { x: targetBox.x + targetBox.width / 2, y: targetBox.y + targetBox.height / 2 },
  )

  await page.mouse.up()
  await page.waitForTimeout(600)
  const toast = await page
    .getByText(/Déplacé dans|Moved to/)
    .first()
    .textContent({ timeout: 4000 })
    .catch(() => null)

  return { ok: ghostScale(info.transform) < 0.9, scale: ghostScale(info.transform), dropTarget: info.dropTarget, toast }
}

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await login(page)
  await page.getByRole('button', { name: /Modifier|Edit/ }).first().click()
  await page.getByText(/Mode déplacement|Move mode/).waitFor({ timeout: 5000 })

  let result = await attempt(page)
  if (!result.ok) {
    console.log('   tentative 1 incomplète :', result.reason ?? result.scale)
    // Sortir et réentrer en mode déplacement pour repartir propre
    await page.getByRole('button', { name: /Terminer|Done/ }).click().catch(() => {})
    await page.getByRole('button', { name: /Modifier|Edit/ }).first().click()
    await page.getByText(/Mode déplacement|Move mode/).waitFor({ timeout: 5000 })
    result = await attempt(page)
  }

  console.log(
    result.ok
      ? `OK   la carte rétrécit sur la cible (échelle ${result.scale.toFixed(2)})`
      : `FAIL pas de rétrécissement (échelle ${result.scale?.toFixed(2) ?? '?'})`,
  )
  if (result.toast) console.log(`OK   dépôt sur le menu : ${result.toast.trim()}`)
  else console.log('FAIL aucun dépôt')

  await browser.close()
  const ok = Boolean(result.ok && result.toast)
  console.log(ok ? '\nRétrécissement + dépôt : OK.' : '\nProblème(s) détecté(s).')
  process.exit(ok ? 0 : 1)
}

main().catch((error) => {
  console.error('ERREUR :', error.message)
  process.exit(1)
})
