// Vérifie le mode déplacement : activation, glisser d'une carte vers une section, toast.
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

  // Entrer en mode déplacement
  await page.getByRole('button', { name: /Modifier|Edit/ }).first().click()
  await page.getByText(/Mode déplacement|Move mode/).waitFor({ timeout: 5000 })
  console.log('OK   mode déplacement activé')

  // Trouver une carte (overlay du mode déplacement) et une cible
  const overlay = page.locator('[role="button"][aria-label]').first()
  const card = overlay
  const chip = page.locator('[data-drop-target="reason:explore"]').first()
  await card.scrollIntoViewIfNeeded()
  const cardBox = await card.boundingBox()
  const chipBox = await chip.boundingBox()
  if (!cardBox || !chipBox) {
    console.log('FAIL carte ou cible introuvable')
    process.exit(1)
  }

  // Glisser avec la souris (génère des pointer events)
  await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2)
  await page.mouse.down()
  const steps = 12
  for (let i = 1; i <= steps; i += 1) {
    await page.mouse.move(
      cardBox.x + ((chipBox.x + chipBox.width / 2 - cardBox.x) * i) / steps,
      cardBox.y + ((chipBox.y + chipBox.height / 2 - cardBox.y) * i) / steps,
    )
    await page.waitForTimeout(25)
  }
  await page.mouse.up()

  const toast = await page
    .getByText(/Déplacé dans|Moved to/)
    .first()
    .textContent({ timeout: 8000 })
    .catch(() => null)
  console.log(toast ? `OK   dépôt accepté : ${toast.trim()}` : 'FAIL aucun toast après le dépôt')

  // Terminer le mode
  await page.getByRole('button', { name: /Terminer|Done/ }).click()
  const stillEditing = await page
    .getByText(/Mode déplacement|Move mode/)
    .isVisible()
    .catch(() => false)
  console.log(stillEditing ? 'FAIL mode toujours actif' : 'OK   mode terminé')

  await browser.close()
  process.exit(toast ? 0 : 1)
}

main().catch((error) => {
  console.error('ERREUR :', error.message)
  process.exit(1)
})
