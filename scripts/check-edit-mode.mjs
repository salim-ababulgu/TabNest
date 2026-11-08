// Vérifie le mode déplacement : sélection par appui puis section du menu (PC + mobile).
import { chromium } from 'playwright'

const BASE = 'http://localhost:5173'
const EMAIL = process.env.TABNEST_DEMO_EMAIL ?? ''
const PASSWORD = process.env.TABNEST_DEMO_PASSWORD ?? ''

async function login(page) {
  await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 30000 })
  await page.getByLabel('Votre adresse e-mail').fill(EMAIL)
  await page.getByRole('button', { name: 'Commencer', exact: true }).click()
  await page.waitForTimeout(700)
  await page.getByRole('tab', { name: /^Connexion$/ }).click()
  await page.locator('#password').fill(PASSWORD)
  await page.getByRole('button', { name: /^Se connecter$/ }).click()
  await page.getByText(/Ce qui compte revient|What matters comes back/).waitFor({ timeout: 20000 })
}

async function runDesktop(browser) {
  let failures = 0
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await login(page)

  await page.getByRole('button', { name: /Modifier|Edit/ }).first().click()
  await page.getByText(/Mode déplacement|Move mode/).waitFor({ timeout: 5000 })
  console.log('desktop : mode déplacement activé')

  // La carte doit changer de curseur en mode déplacement
  const overlay = page.locator('[data-site] article [role="button"][aria-label]').first()
  const cursor = await overlay.evaluate((el) => getComputedStyle(el).cursor)
  if (cursor !== 'grab') {
    failures += 1
    console.log(`   FAIL curseur de la carte : ${cursor} (attendu : grab)`)
  } else {
    console.log('   OK curseur « grab » sur la carte')
  }
  const card = overlay

  await card.click()
  const selected = await page
    .getByText(/carte\(s\) sélectionnée|card\(s\) selected/)
    .first()
    .isVisible({ timeout: 3000 })
    .catch(() => false)
  if (!selected) failures += 1
  console.log(selected ? '   OK sélection par appui' : '   FAIL sélection')

  // Clic sur une section de la sidebar (cible unique)
  const today = page.getByRole('button', { name: /Aujourd|Today/ }).first()
  await today.click()
  const toast = await page
    .getByText(/Déplacé dans|Moved to/)
    .first()
    .textContent({ timeout: 8000 })
    .catch(() => null)
  if (toast) console.log(`   OK déplacement via le menu : ${toast.trim()}`)
  else {
    failures += 1
    console.log('   FAIL déplacement via le menu')
  }

  await page.getByRole('button', { name: /Terminer|Done/ }).click()
  await page.close()
  return failures
}

async function runMobile(browser) {
  let failures = 0
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await login(page)

  await page.getByRole('button', { name: /Modifier|Edit/ }).first().click()
  await page.getByText(/Mode déplacement|Move mode/).waitFor({ timeout: 5000 })
  console.log('mobile : mode déplacement activé')

  // Sélectionner deux cartes
  const cards = page.locator('[role="button"][aria-label]')
  await cards.nth(0).click()
  await cards.nth(1).click()
  const selectedText = await page
    .getByText(/carte\(s\) sélectionnée|card\(s\) selected/)
    .first()
    .textContent({ timeout: 3000 })
    .catch(() => null)
  console.log(
    selectedText
      ? `   OK multi-sélection : ${selectedText.trim()}`
      : '   FAIL multi-sélection',
  )
  if (!selectedText) failures += 1

  // Cible = onglet du bas (Pistes)
  await page.getByRole('button', { name: /Pistes|Leads/ }).first().click()
  const toast = await page
    .getByText(/Déplacé dans|Moved to/)
    .first()
    .textContent({ timeout: 8000 })
    .catch(() => null)
  if (toast) console.log(`   OK déplacement via la barre du bas : ${toast.trim()}`)
  else {
    failures += 1
    console.log('   FAIL déplacement via la barre du bas')
  }

  await page.getByRole('button', { name: /Terminer|Done/ }).click()
  await page.close()
  return failures
}

async function main() {
  const browser = await chromium.launch()
  const failures = (await runDesktop(browser)) + (await runMobile(browser))
  await browser.close()
  console.log(failures === 0 ? '\nMode déplacement simplifié : OK.' : `\n${failures} problème(s).`)
  process.exit(failures > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error('ERREUR :', error.message)
  process.exit(1)
})
