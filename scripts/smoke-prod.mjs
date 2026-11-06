// Test de fumée du site en production, comme un vrai utilisateur.
// Usage : node scripts/smoke-prod.mjs
// Vérifie : accueil, /extension, /confidentialite, connexion d'un compte existant,
// arrivée sur le dashboard.

import { chromium } from 'playwright'

const BASE = 'https://tabnest-alb.pages.dev'
const EMAIL = 'demo@tabnest.demo'
const PASSWORD = 'DemoCapture-2025!'

const results = []

function report(name, ok, detail = '') {
  results.push({ name, ok, detail })
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`)
}

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })

  // 1. Accueil
  const home = await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 30000 })
  report('Accueil (HTTP 200)', home?.status() === 200)
  const heroVisible = await page.getByRole('heading', { level: 1 }).first().isVisible().catch(() => false)
  report('Titre principal visible', heroVisible)

  // 2. Pages clés
  for (const [name, path] of [
    ['/extension', '/extension'],
    ['/confidentialite', '/confidentialite'],
    ['/cgu', '/cgu'],
  ]) {
    const res = await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 30000 })
    report(name, res?.status() === 200)
  }

  // 3. Connexion d'un compte existant
  await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 30000 })
  await page.getByLabel('Votre adresse e-mail').fill(EMAIL)
  await page.getByRole('button', { name: 'Commencer', exact: true }).click()
  await page.waitForTimeout(800)
  await page.getByRole('button', { name: 'Connexion', exact: true }).click()
  await page.waitForTimeout(400)
  await page.locator('#password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click()
  await page.waitForTimeout(5000)
  const h1 = (await page.locator('h1').first().textContent().catch(() => '')) ?? ''
  const dashboardVisible = /Ce qui compte revient|What matters comes back/.test(h1)
  report('Connexion → dashboard', dashboardVisible, h1.slice(0, 60))

  if (dashboardVisible) {
    const cards = await page.locator('[data-site]').count().catch(() => 0)
    report('Cartes de sites affichées', cards > 0, `${cards} carte(s)`)
  } else {
    const alertText = await page.locator('[role="alert"]').first().textContent().catch(() => null)
    report('Message d’erreur', alertText !== null, alertText ?? 'aucun message d’erreur')
  }

  await browser.close()

  const failed = results.filter((r) => !r.ok)
  console.log(`\n${results.length - failed.length}/${results.length} vérifications réussies`)
  process.exit(failed.length > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error('ERREUR :', error.message)
  process.exit(1)
})
