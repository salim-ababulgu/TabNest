// Diagnostic de la connexion en production : capture le message d'erreur affiché.
import { chromium } from 'playwright'

const BASE = 'https://filnest.pages.dev'
const EMAIL = process.env.TABNEST_DEMO_EMAIL ?? ''
const PASSWORD = process.env.TABNEST_DEMO_PASSWORD ?? ''

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })

  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log('[console.error]', msg.text().slice(0, 300))
  })

  await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 30000 })
    await page.getByRole('button', { name: /Créer un compte gratuit|Create a free account/ }).first().click()
  await page.getByRole('button', { name: 'Connexion', exact: true }).click()
  await page.locator('#email').fill(EMAIL)
  await page.locator('#password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click()

  await page.waitForTimeout(6000)

  const alert = await page.locator('[role="alert"]').first().textContent().catch(() => null)
  console.log('Message d’erreur affiché :', alert ?? '(aucun)')

  const url = page.url()
  console.log('URL après tentative :', url)

  const heading = await page.locator('h1').first().textContent().catch(() => null)
  console.log('Titre de la page :', heading ?? '(aucun)')

  await browser.close()
}

main().catch((error) => {
  console.error('ERREUR :', error.message)
  process.exit(1)
})
