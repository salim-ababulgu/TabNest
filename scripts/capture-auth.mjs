// Capture les écrans d'inscription et de connexion (desktop + mobile).
import { chromium } from 'playwright'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const BASE = 'http://localhost:5173'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const out = (name) => path.join(root, 'public', 'screenshots', name)

async function main() {
  const browser = await chromium.launch()

  const desktop = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await desktop.goto(BASE + '/', { waitUntil: 'networkidle' })
  await desktop.getByRole('button', { name: /Créer un compte gratuit|Create a free account/ }).first().click()
  await desktop.waitForTimeout(900)
  await desktop.screenshot({ path: out('auth-signup-desktop.png') })
  await desktop.getByRole('tab', { name: 'Connexion' }).click()
  await desktop.waitForTimeout(400)
  await desktop.screenshot({ path: out('auth-login-desktop.png') })
  await desktop.close()

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await mobile.goto(BASE + '/', { waitUntil: 'networkidle' })
  await mobile.getByRole('button', { name: /Créer un compte gratuit|Create a free account/ }).first().click()
  await mobile.waitForTimeout(900)
  await mobile.screenshot({ path: out('auth-signup-mobile.png') })
  await mobile.close()

  await browser.close()
  console.log('captures écrites')
}

main().catch((error) => {
  console.error('ERREUR :', error.message)
  process.exit(1)
})
