// Diagnostic : erreur exacte de la connexion Google en production.
import { chromium } from 'playwright'

const BASE = 'https://filnest.pages.dev'

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  const failures = []
  page.on('response', async (res) => {
    if (res.url().includes('/auth/v1/authorize') || res.url().includes('supabase.co/auth')) {
      if (res.status() >= 400) {
        try {
          failures.push(`${res.status()} ${res.url().slice(0, 140)} → ${(await res.text()).slice(0, 200)}`)
        } catch {
          failures.push(`${res.status()} ${res.url().slice(0, 140)}`)
        }
      }
    }
  })

  await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 30000 })
    await page.getByRole('button', { name: /Créer un compte gratuit|Create a free account/ }).first().click()
  await page.waitForTimeout(800)
  await page.getByRole('button', { name: /Continuer avec Google|Continue with Google/ }).click()
  await page.waitForTimeout(5000)

  console.log('URL après clic Google :', page.url().slice(0, 160))
  if (failures.length) {
    console.log('Réponses en erreur :')
    for (const f of failures) console.log(' -', f)
  } else {
    console.log('Aucune réponse Supabase en erreur (la redirection Google semble acceptée).')
  }

  await browser.close()
}

main().catch((error) => {
  console.error('ERREUR :', error.message)
  process.exit(1)
})
