// Vérifie le mode déplacement : sélection par appui, déplacement via une cible,
// et glisser-déposer. Desktop et mobile.
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

async function run(label, viewport, browser) {
  let failures = 0
  const fail = (message) => {
    failures += 1
    console.log(`   FAIL ${message}`)
  }
  const page = await browser.newPage({ viewport })
  await login(page)

  await page.getByRole('button', { name: /Modifier|Edit/ }).first().click()
  await page.getByText(/Mode déplacement|Move mode/).waitFor({ timeout: 5000 })
  console.log(`${label} : mode déplacement activé`)

  // 1. Appui sur une carte = sélection
  const card = page.locator('[role="button"][aria-label]').first()
  await card.scrollIntoViewIfNeeded()
  await card.click()
  await page.waitForTimeout(300)
  const selectedText = await page
    .getByText(/carte\(s\) sélectionnée|card\(s\) selected/)
    .first()
    .textContent({ timeout: 3000 })
    .catch(() => null)
  if (selectedText) console.log(`   OK sélection : ${selectedText.trim()}`)
  else fail('la sélection de carte ne s’affiche pas')

  // 2. Clic sur une cible = déplacement (pas de glisser)
  await page.locator('[data-drop-target="reason:finish"]').first().click()
  const toast = await page
    .getByText(/Déplacé dans|Moved to/)
    .first()
    .textContent({ timeout: 8000 })
    .catch(() => null)
  if (toast) console.log(`   OK déplacement par appui : ${toast.trim()}`)
  else fail('aucun déplacement après clic sur une cible')

  // 3. Glisser-déposer d'une autre carte vers une cible
  const cards = page.locator('[role="button"][aria-label]')
  const dragCard = cards.nth(1)
  const chip = page.locator('[data-drop-target="reason:remember"]').first()
  await dragCard.scrollIntoViewIfNeeded()
  const from = await dragCard.boundingBox()
  const to = await chip.boundingBox()
  if (from && to) {
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
    await page.mouse.down()
    for (let i = 1; i <= 10; i += 1) {
      await page.mouse.move(
        from.x + ((to.x + to.width / 2 - from.x) * i) / 10,
        from.y + ((to.y + to.height / 2 - from.y) * i) / 10,
      )
      await page.waitForTimeout(20)
    }
    await page.mouse.up()
    const dragToast = await page
      .getByText(/Déplacé dans|Moved to/)
      .first()
      .textContent({ timeout: 6000 })
      .catch(() => null)
    if (dragToast) console.log(`   OK glisser-déposer : ${dragToast.trim()}`)
    else fail('le glisser-déposer ne fonctionne pas')
  } else {
    fail('carte ou cible introuvable pour le glisser')
  }

  await page.getByRole('button', { name: /Terminer|Done/ }).click()
  await page.close()
  return failures
}

async function main() {
  const browser = await chromium.launch()
  let failures = 0
  failures += await run('desktop 1280', { width: 1280, height: 900 }, browser)
  failures += await run('mobile 390', { width: 390, height: 844 }, browser)
  await browser.close()
  console.log(failures === 0 ? '\nMode déplacement : tout fonctionne.' : `\n${failures} problème(s).`)
  process.exit(failures > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error('ERREUR :', error.message)
  process.exit(1)
})
