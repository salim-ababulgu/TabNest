// Vérifie l'écran d'inscription / connexion : validation temps réel, rôle des
// onglets, règles de mot de passe, erreurs traduites, langue, débordement.
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
  const ok = (message) => console.log(`   OK ${message}`)

  for (const [label, viewport] of [
    ['desktop 1280', { width: 1280, height: 900 }],
    ['mobile 390', { width: 390, height: 844 }],
  ]) {
    const page = await browser.newPage({ viewport })
    await openAuth(page)

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    )
    if (overflow) fail(`${label} : débordement horizontal`)
    else ok(`${label} : pas de débordement`)

    // Onglets accessibles
    await page.getByRole('tab', { name: 'Connexion' }).click()
    await page.waitForTimeout(250)
    if (await page.getByRole('heading', { name: /Content de te revoir/ }).isVisible()) {
      ok(`${label} : titre connexion`)
    } else fail(`${label} : titre connexion absent`)

    // Validation e-mail : bouton désactivé tant que l'e-mail est invalide
    await page.locator('#email').fill('pas-un-email')
    await page.locator('#password').fill('MotDePasse2026!')
    const submit = page.getByRole('button', { name: /^Se connecter$/ })
    if (await submit.isDisabled()) ok(`${label} : bouton bloqué avec e-mail invalide`)
    else fail(`${label} : bouton actif avec e-mail invalide`)

    // Message d'erreur e-mail après sortie du champ
    await page.locator('#email').blur()
    await page.waitForTimeout(200)
    const emailError = await page
      .getByText(/adresse e-mail ne semble pas valide/)
      .isVisible()
      .catch(() => false)
    if (emailError) ok(`${label} : message e-mail invalide`)
    else fail(`${label} : pas de message e-mail invalide`)

    // Règles de mot de passe (inscription)
    await page.getByRole('tab', { name: 'Inscription' }).click()
    await page.waitForTimeout(250)
    const ruleText = await page.getByText(/8 caractères minimum/).isVisible().catch(() => false)
    if (ruleText) ok(`${label} : règles de mot de passe affichées`)
    else fail(`${label} : règles absentes`)

    await page.locator('#password').fill('abc')
    await page.waitForTimeout(250)
    if (await page.getByRole('button', { name: /^Créer un compte$/ }).isDisabled()) {
      ok(`${label} : bouton bloqué avec mot de passe faible`)
    } else fail(`${label} : bouton actif avec mot de passe faible`)

    // E-mail valide + mot de passe complet → bouton actif
    await page.locator('#email').fill(process.env.TABNEST_DEMO_EMAIL ?? '')
    await page.locator('#password').fill('MotDePasse2026!')
    await page.waitForTimeout(300)
    const enabled = await page.getByRole('button', { name: /^Créer un compte$/ }).isEnabled()
    if (enabled) ok(`${label} : bouton actif quand tout est valide`)
    else fail(`${label} : bouton toujours bloqué alors que valide`)

    // Afficher / masquer
    const before = await page.locator('#password').getAttribute('type')
    await page.getByRole('button', { name: /Afficher le mot de passe/ }).click()
    const after = await page.locator('#password').getAttribute('type')
    if (before === 'password' && after === 'text') ok(`${label} : afficher/masquer`)
    else fail(`${label} : afficher/masquer inopérant`)

    // Erreur Supabase traduite (mauvais mot de passe, compte existant)
    await page.getByRole('tab', { name: 'Connexion' }).click()
    await page.locator('#email').fill(process.env.TABNEST_DEMO_EMAIL ?? '')
    await page.locator('#password').fill('MauvaisMotDePasse!123')
    await page.getByRole('button', { name: /^Se connecter$/ }).click()
    const errorBox = await page
      .locator('[role="alert"]')
      .first()
      .textContent({ timeout: 15000 })
      .catch(() => null)
    if (errorBox && /E-mail ou mot de passe incorrect/.test(errorBox)) {
      ok(`${label} : erreur d'authentification traduite`)
    } else fail(`${label} : erreur non traduite (${errorBox ?? 'aucune'})`)

    // Changement de langue (desktop seulement pour rester rapide)
    if (viewport.width >= 1024) {
      await page.getByRole('button', { name: 'EN', exact: true }).click()
      await page.waitForTimeout(300)
      if (await page.getByRole('heading', { name: /Welcome back/ }).isVisible()) {
        ok(`${label} : bascule de langue FR → EN`)
      } else fail(`${label} : bascule de langue inopérante`)
      await page.getByRole('button', { name: 'FR', exact: true }).click()
    }

    await page.close()
  }

  await browser.close()
  console.log(failures === 0 ? '\nAuthentification : OK.' : `\n${failures} problème(s).`)
  process.exit(failures > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error('ERREUR :', error.message)
  process.exit(1)
})
