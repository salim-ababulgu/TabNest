// Vérifie l'écran d'inscription / connexion : bascule, force du mot de passe,
// affichage du mot de passe, message d'erreur, absence de débordement.
import { chromium } from 'playwright'

const BASE = 'http://localhost:5173'

async function openAuth(page) {
  await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 30000 })
  await page.getByRole('button', { name: 'Commencer', exact: true }).click()
  await page.waitForTimeout(700)
}

async function main() {
  const browser = await chromium.launch()
  let failures = 0
  const fail = (message) => {
    failures += 1
    console.log('   FAIL', message)
  }

  for (const [label, viewport] of [
    ['desktop 1280', { width: 1280, height: 900 }],
    ['mobile 390', { width: 390, height: 844 }],
  ]) {
    const page = await browser.newPage({ viewport })
    await openAuth(page)

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    )
    if (overflow) fail(`${label} : la page déborde horizontalement`)
    else console.log(`${label} : OK pas de débordement`)

    // Bascule Connexion / Inscription
    await page.getByRole('tab', { name: 'Connexion' }).click()
    await page.waitForTimeout(250)
    const loginTitle = await page.getByRole('heading', { name: /Content de te revoir/ }).isVisible()
    if (loginTitle) console.log(`${label} : OK titre connexion`)
    else fail(`${label} : titre connexion absent`)

    await page.getByRole('tab', { name: 'Inscription' }).click()
    await page.waitForTimeout(250)
    const signupTitle = await page.getByRole('heading', { name: /Crée ton nid/ }).isVisible()
    if (signupTitle) console.log(`${label} : OK titre inscription`)
    else fail(`${label} : titre inscription absent`)

    // Force du mot de passe (inscription, sans envoyer le formulaire)
    await page.locator('#password').fill('abc')
    await page.waitForTimeout(200)
    const weak = await page.getByText(/Mot de passe faible/).isVisible().catch(() => false)
    if (weak) console.log(`${label} : OK indicateur de mot de passe faible`)
    else fail(`${label} : indicateur de force absent`)
    await page.locator('#password').fill('MotDePasse2026!')
    await page.waitForTimeout(200)
    const strong = await page.getByText(/Mot de passe solide/).isVisible().catch(() => false)
    if (strong) console.log(`${label} : OK indicateur de mot de passe solide`)
    else fail(`${label} : indicateur « solide » absent`)

    // Afficher / masquer le mot de passe
    const pwTypeBefore = await page.locator('#password').getAttribute('type')
    await page.getByRole('button', { name: /Afficher le mot de passe/ }).click()
    const pwTypeAfter = await page.locator('#password').getAttribute('type')
    if (pwTypeBefore === 'password' && pwTypeAfter === 'text') {
      console.log(`${label} : OK bouton afficher/masquer`)
    } else {
      fail(`${label} : bouton afficher/masquer inopérant`)
    }

    // Erreur propre en mode connexion (mauvais mot de passe)
    await page.getByRole('tab', { name: 'Connexion' }).click()
    await page.locator('#email').fill('demo@tabnest.demo')
    await page.locator('#password').fill('MauvaisMotDePasse!123')
    await page.getByRole('button', { name: /^Se connecter$/ }).click()
    const errorBox = await page
      .locator('[role="alert"]')
      .first()
      .textContent({ timeout: 15000 })
      .catch(() => null)
    if (errorBox) console.log(`${label} : OK message d'erreur affiché (« ${errorBox.trim().slice(0, 60)} »)`)
    else fail(`${label} : aucun message d'erreur`)

    await page.close()
  }

  await browser.close()
  console.log(failures === 0 ? '\nInscription / connexion : OK.' : `\n${failures} problème(s).`)
  process.exit(failures > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error('ERREUR :', error.message)
  process.exit(1)
})
