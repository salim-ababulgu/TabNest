// Vérifie les étagères personnalisées : création, compteur, filtrage, persistance,
// doublon refusé, suppression, et présence dans le tiroir mobile.
import { chromium } from 'playwright'

const BASE = 'http://localhost:5173'
const EMAIL = 'demo@tabnest.demo'
const PASSWORD = 'DemoCapture-2025!'

async function login(page) {
  await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 30000 })
  await page.getByLabel('Votre adresse e-mail').fill(EMAIL)
  await page.getByRole('button', { name: 'Commencer', exact: true }).click()
  await page.waitForTimeout(700)
  await page.getByRole('button', { name: /^Connexion$/ }).click()
  await page.locator('#password').fill(PASSWORD)
  await page.getByRole('button', { name: /^Se connecter$/ }).click()
  await page.getByText(/Ce qui compte revient|What matters comes back/).waitFor({ timeout: 20000 })
  await page.waitForTimeout(500)
}

async function openShelfForm(page) {
  await page.getByRole('button', { name: /Ranger les étagères|Edit shelves/ }).click()
  await page.getByRole('button', { name: /Nouvelle étagère|New shelf/ }).click()
}

async function fillAndCreate(page, name, ruleLabel) {
  await page.getByLabel(/Nom de l’étagère|Shelf name/).fill(name)
  await page.getByRole('button', { name: ruleLabel }).first().click()
  await page.getByRole('button', { name: /^Créer$|^Create$/ }).click()
}

async function main() {
  const browser = await chromium.launch()
  let failures = 0
  const fail = (message) => {
    failures += 1
    console.log('   FAIL', message)
  }

  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await login(page)

  // 1. Créer une étagère « Doc » (règle Documentation)
  await openShelfForm(page)
  await fillAndCreate(page, 'Doc', 'Documentation')
  const toast = await page
    .getByText(/Étagère « Doc » créée|Shelf “Doc” created/)
    .first()
    .isVisible({ timeout: 5000 })
    .catch(() => false)
  if (toast) console.log('OK   création confirmée par un toast')
  else fail('pas de toast de création')

  const row = page.getByRole('button', { name: /^Doc/ }).first()
  if (await row.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('OK   étagère « Doc » visible dans la liste')
  } else fail('étagère absente de la liste')

  // 2. Cliquer l'étagère filtre la grille
  await row.click()
  await page.waitForTimeout(700)
  const title = await page.getByRole('heading', { name: /Doc/ }).first().textContent()
  if (title?.includes('Doc')) console.log('OK   titre = nom de l’étagère')
  else fail(`le titre ne reprend pas le nom de l’étagère (lu : ${title})`)
  const cards = await page.locator('[data-site]').count()
  console.log(`   ${cards} site(s) dans l’étagère Doc`)

  // 3. Persistance après rechargement
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByText(/Ce qui compte revient|What matters comes back/).waitFor({ timeout: 20000 })
  await page.waitForTimeout(600)
  const persisted = await page.getByRole('button', { name: /^Doc/ }).first().isVisible().catch(() => false)
  if (persisted) console.log('OK   étagère conservée après rechargement')
  else fail('étagère perdue au rechargement')

  // 4. Doublon refusé
  await openShelfForm(page)
  await page.getByLabel(/Nom de l’étagère|Shelf name/).fill('doc')
  await page.getByRole('button', { name: /^Créer$|^Create$/ }).click()
  const dup = await page
    .getByText(/Ce nom est déjà pris|That name is taken/)
    .isVisible({ timeout: 3000 })
    .catch(() => false)
  if (dup) console.log('OK   doublon refusé')
  else fail('doublon accepté')
  await page.getByRole('button', { name: /^Annuler$|^Cancel$/ }).click()

  // 5. Suppression
  await page
    .getByRole('button', { name: /Supprimer Doc|Remove Doc/ })
    .first()
    .click({ force: true })
  await page.waitForTimeout(500)
  const gone = await page.getByRole('button', { name: /^Doc$/ }).count()
  if (gone === 0) console.log('OK   étagère supprimée')
  else fail('étagère toujours présente après suppression')
  await page.getByRole('button', { name: /Ranger les étagères|Edit shelves/ }).click()
  await page.close()

  // 6. Mobile : la même liste vit dans le tiroir
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await login(mobile)
  await mobile.getByRole('button', { name: /Ouvrir le menu|Open menu/ }).first().click()
  await mobile.waitForTimeout(500)
  const drawer = mobile.getByRole('dialog').first()
  const drawerTitle = await drawer
    .getByText(/Étagères|Shelves/)
    .first()
    .isVisible()
    .catch(() => false)
  if (drawerTitle) console.log('OK   tiroir mobile : liste « Étagères » présente')
  else fail('tiroir mobile sans liste d’étagères')
  const pencil = await drawer
    .getByRole('button', { name: /Ranger les étagères|Edit shelves/ })
    .first()
    .isVisible()
    .catch(() => false)
  if (pencil) console.log('OK   tiroir mobile : crayon « Ranger » présent')
  else fail('tiroir mobile : crayon absent')
  await mobile.close()

  await browser.close()
  console.log(failures === 0 ? '\nÉtagères : OK.' : `\n${failures} problème(s).`)
  process.exit(failures > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error('ERREUR :', error.message)
  process.exit(1)
})
