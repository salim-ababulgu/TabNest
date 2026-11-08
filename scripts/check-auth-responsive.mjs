// Vérifie l'écran d'authentification sur tous les formats d'écran.
import { chromium } from 'playwright'

const BASE = 'http://localhost:5173'

const VIEWPORTS = [
  { label: '320x640 (très petit)', width: 320, height: 640 },
  { label: '360x740 (Android)', width: 360, height: 740 },
  { label: '390x844 (iPhone)', width: 390, height: 844 },
  { label: '768x1024 (tablette)', width: 768, height: 1024 },
  { label: '1024x800 (petit PC)', width: 1024, height: 800 },
  { label: '1280x900 (PC)', width: 1280, height: 900 },
  { label: '1440x900 (grand PC)', width: 1440, height: 900 },
]

async function openAuth(page) {
  await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 30000 })
  await page.getByRole('button', { name: 'Commencer', exact: true }).click()
  await page.waitForTimeout(800)
}

async function main() {
  const browser = await chromium.launch()
  let failures = 0
  const fail = (message) => {
    failures += 1
    console.log(`   FAIL ${message}`)
  }

  for (const viewport of VIEWPORTS) {
    const page = await browser.newPage({ viewport })
    await openAuth(page)

    const metrics = await page.evaluate(() => {
      const doc = document.documentElement
      const card = document.querySelector('.rounded-2xl.border.bg-card')
      const langButtons = Array.from(
        document.querySelectorAll('[role="group"][aria-label="Langue"] button'),
      )
      const lastLang = langButtons[langButtons.length - 1]
      const aside = document.querySelector('aside')
      return {
        overflow: doc.scrollWidth > doc.clientWidth + 1,
        scrollWidth: doc.scrollWidth,
        clientWidth: doc.clientWidth,
        cardWidth: card ? card.getBoundingClientRect().width : 0,
        cardTop: card ? card.getBoundingClientRect().top : 0,
        langRight: lastLang ? lastLang.getBoundingClientRect().right : 0,
        asideVisible: aside ? getComputedStyle(aside).display !== 'none' : false,
      }
    })

    const problems = []
    if (metrics.overflow) problems.push(`débordement (${metrics.scrollWidth} > ${metrics.clientWidth})`)
    if (metrics.cardWidth > viewport.width - 24) problems.push(`carte trop large (${Math.round(metrics.cardWidth)})`)
    if (metrics.langRight > viewport.width - 4) problems.push(`sélecteur de langue coupé (droite ${Math.round(metrics.langRight)})`)
    if (viewport.width < 1024 && metrics.asideVisible) problems.push('panneau produit affiché sur petit écran')
    if (viewport.width >= 1024 && !metrics.asideVisible) problems.push('panneau produit absent sur grand écran')

    if (problems.length === 0) {
      console.log(`OK   ${viewport.label} — carte ${Math.round(metrics.cardWidth)} px`)
    } else {
      fail(`${viewport.label} — ${problems.join(' ; ')}`)
    }

    // Le formulaire reste utilisable : champs + bouton visibles
    const emailVisible = await page.locator('#email').isVisible().catch(() => false)
    const submitVisible = await page
      .getByRole('button', { name: /Créer un compte|Se connecter/ })
      .first()
      .isVisible()
      .catch(() => false)
    if (!emailVisible || !submitVisible) fail(`${viewport.label} — formulaire incomplet à l'écran`)

    // Bascule en connexion : pas de débordement après changement de mode
    await page.getByRole('tab', { name: 'Connexion' }).click()
    await page.waitForTimeout(600)
    const after = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      rules: Array.from(document.querySelectorAll('#auth-rules')).length,
    }))
    if (after.overflow) fail(`${viewport.label} — débordement après bascule`)
    if (after.rules !== 0) fail(`${viewport.label} — règles encore présentes en connexion`)

    await page.close()
  }

  await browser.close()
  console.log(failures === 0 ? '\nAuthentification : responsive OK.' : `\n${failures} problème(s).`)
  process.exit(failures > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error('ERREUR :', error.message)
  process.exit(1)
})
