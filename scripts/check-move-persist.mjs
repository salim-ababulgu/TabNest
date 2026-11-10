// Vérifie : (1) la carte entière suit le pointeur (clone GSAP), (2) le déplacement est bien enregistré.
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
  await page.getByRole('button', { name: /Rafraîchir|Refresh/ }).first().waitFor({ timeout: 20000 })
}

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  let failures = 0
  await login(page)

  const firstSite = page.locator('[data-site]').first()
  const domain = await firstSite.getAttribute('data-site')
  console.log(`site de test : ${domain}`)

  await page.getByRole('button', { name: /Modifier|Edit/ }).first().click()
  await page.getByText(/Mode déplacement|Move mode/).waitFor({ timeout: 5000 })

  // --- 1. La carte entière est "saisie" : un clone plein format suit le pointeur
  const overlay = page.locator('[data-site] article [role="button"][aria-label]').first()
  const box = await overlay.boundingBox()
  if (!box) {
    console.log('FAIL : carte introuvable')
    process.exit(1)
  }
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  for (let i = 1; i <= 8; i += 1) {
    await page.mouse.move(box.x + box.width / 2 + i * 12, box.y + box.height / 2 + i * 6)
    await page.waitForTimeout(25)
  }
  const ghost = await page.evaluate(() => {
    const fixed = Array.from(document.querySelectorAll('article')).find(
      (el) => getComputedStyle(el).position === 'fixed',
    )
    if (!fixed) return null
    const rect = fixed.getBoundingClientRect()
    return { width: Math.round(rect.width), height: Math.round(rect.height) }
  })
  if (ghost && ghost.width > 100) {
    console.log(`OK   carte saisie en entier (clone ${ghost.width}x${ghost.height}px)`)
  } else {
    failures += 1
    console.log('FAIL la carte entière ne suit pas le pointeur')
  }
  await page.mouse.up()
  await page.waitForTimeout(300)

  // --- 2. Déplacement via une section + persistance après rechargement
  await overlay.click()
  await page.getByRole('button', { name: /Pistes|Leads/ }).first().click()
  const toast = await page
    .getByText(/Déplacé dans|Moved to/)
    .first()
    .textContent({ timeout: 8000 })
    .catch(() => null)
  console.log(toast ? `OK   déplacement : ${toast.trim()}` : 'FAIL aucun déplacement')
  if (!toast) failures += 1

  await page.reload({ waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /Rafraîchir|Refresh/ }).first().waitFor({ timeout: 20000 })
  await page.getByRole('button', { name: /Pistes|Leads/ }).first().click()
  await page.waitForTimeout(1000)
  const stillThere = await page.locator(`[data-site="${domain}"]`).count()
  if (stillThere > 0) {
    console.log('OK   le déplacement est enregistré (visible dans « Pistes » après rechargement)')
  } else {
    failures += 1
    console.log('FAIL le déplacement n’est pas enregistré')
  }

  await browser.close()
  console.log(failures === 0 ? '\nSaisie + persistance : OK.' : `\n${failures} problème(s).`)
  process.exit(failures > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error('ERREUR :', error.message)
  process.exit(1)
})
