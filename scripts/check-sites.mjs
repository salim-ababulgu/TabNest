// Vérifie la vue « Sites » (liste dense de tous les domaines consultés).
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
  await page.waitForTimeout(700)
}

async function main() {
  const browser = await chromium.launch()
  let failures = 0
  const fail = (message) => {
    failures += 1
    console.log('   FAIL', message)
  }
  const ok = (message) => console.log(`   OK ${message}`)

  for (const [label, viewport] of [
    ['desktop 1280', { width: 1280, height: 900 }],
    ['mobile 390', { width: 390, height: 844 }],
  ]) {
    const page = await browser.newPage({ viewport })
    await login(page)

    if (viewport.width < 768) {
      await page.getByRole('button', { name: /Ouvrir le menu|Open menu/ }).first().click()
      await page.waitForTimeout(500)
    }
    const nav = page.getByRole('button', { name: /^Sites/ }).first()
    if (await nav.isVisible().catch(() => false)) ok(`${label} : entrée « Sites » dans la navigation`)
    else fail(`${label} : entrée « Sites » absente`)
    await nav.click()
    await page.waitForTimeout(900)

    const rows = await page.locator('ul.divide-y > li').count()
    if (rows > 0) ok(`${label} : ${rows} site(s) listé(s)`)
    else fail(`${label} : liste vide`)

    const headers = await page
      .getByText(/Dernière visite|Last visit/)
      .first()
      .isVisible()
      .catch(() => false)
    if (headers && viewport.width >= 640) ok(`${label} : colonnes présentes`)
    else if (viewport.width < 640) ok(`${label} : affichage compact (colonnes masquées)`)
    else fail(`${label} : en-têtes de colonnes absents`)

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    )
    if (overflow) fail(`${label} : débordement horizontal`)
    else ok(`${label} : pas de débordement`)

    // Ouvrir une fiche depuis la liste
    await page.getByRole('button', { name: /^Détails$/ }).first().click()
    await page.waitForTimeout(600)
    const dialog = await page.locator('[role="dialog"]').isVisible().catch(() => false)
    if (dialog) ok(`${label} : la fiche s'ouvre depuis la liste`)
    else fail(`${label} : la fiche ne s'ouvre pas`)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)

    await page.close()
  }

  await browser.close()
  console.log(failures === 0 ? '\nVue Sites : OK.' : `\n${failures} problème(s).`)
  process.exit(failures > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error('ERREUR :', error.message)
  process.exit(1)
})
