// Vérifie le CRUD complet : projets (créer, renommer, supprimer),
// pages expirées (masquées, restaurées), formulaire de retour.
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
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  let failures = 0
  const fail = (message) => {
    failures += 1
    console.log('   FAIL', message)
  }
  const ok = (message) => console.log(`   OK ${message}`)

  await login(page)

  // ---------- 1. Projet : créer ----------
  await page.getByRole('button', { name: /Nouveau projet|New project/ }).first().click()
  await page.waitForTimeout(400)
  const projectName = `Test CRUD ${Date.now().toString().slice(-5)}`
  await page.locator('#new-group').fill(projectName)
  await page.getByRole('button', { name: /^Créer$|^Create$/ }).click()
  await page.waitForTimeout(1200)
  const created = await page.getByRole('button', { name: projectName }).count()
  if (created > 0) ok('projet créé et visible dans la navigation')
  else fail('projet créé mais absent de la navigation')

  // ---------- 2. Projet : renommer (mode Ranger) ----------
  await page.getByRole('button', { name: /Ranger les étagères|Edit shelves/ }).click()
  await page.waitForTimeout(300)
  await page.getByRole('button', { name: new RegExp(`Renommer ${projectName}`) }).click()
  const renamed = `${projectName} modifié`
  const renameInput = page.locator('input[aria-label="Renommer"]').first()
  await renameInput.fill(renamed)
  await renameInput.press('Enter')
  await page.waitForTimeout(1200)
  const renamedVisible = await page.getByRole('button', { name: renamed }).count()
  if (renamedVisible > 0) ok('projet renommé')
  else fail('renommage du projet non appliqué')

  // ---------- 3. Projet : supprimer ----------
  await page.getByRole('button', { name: new RegExp(`Supprimer ${renamed}`) }).click()
  await page.waitForTimeout(400)
  const dialog = await page
    .getByRole('heading', { name: /Supprimer ce projet|Delete this project/ })
    .isVisible()
    .catch(() => false)
  if (dialog) ok('confirmation de suppression affichée')
  else fail('aucune confirmation de suppression')
  await page.getByRole('button', { name: /^Retirer$|^Remove$/ }).last().click()
  await page.waitForTimeout(1200)
  const gone = await page.getByRole('button', { name: renamed }).count()
  if (gone === 0) ok('projet supprimé')
  else fail('projet toujours présent après suppression')
  await page.getByRole('button', { name: /Ranger les étagères|Edit shelves/ }).click()

  // ---------- 4. Pages expirées : masquées + restauration ----------
  const bannerBefore = await page
    .getByText(/page\(s\) expirée\(s\) sont masquées|expired page\(s\) are hidden/)
    .isVisible()
    .catch(() => false)
  if (bannerBefore) ok('bandeau des pages expirées visible')
  else console.log('   info : aucune page expirée dans le compte de démo')

  await page.getByRole('button', { name: /Archives/ }).first().click()
  await page.waitForTimeout(1200)
  const restore = page.getByRole('button', { name: /Restaurer|Restore/ }).first()
  const hasExpired = await restore.isVisible().catch(() => false)
  if (hasExpired) {
    await restore.click()
    await page.waitForTimeout(1500)
    const toast = await page
      .getByText(/restaurée\(s\)|restored/)
      .first()
      .isVisible()
      .catch(() => false)
    if (toast) ok('page expirée restaurée (toast)')
    else fail('restauration sans toast')
  } else {
    console.log('   info : aucune page expirée à restaurer dans la démo')
  }

  // ---------- 5. Formulaire de retour ----------
  await page.getByRole('button', { name: /Ouvrir les paramètres|Open settings/ }).first().click()
  await page.waitForTimeout(500)
  const feedbackRow = await page
    .getByText(/Donner mon avis|Send feedback/)
    .first()
    .isVisible()
    .catch(() => false)
  if (feedbackRow) ok('section « Donner mon avis » dans les paramètres')
  else fail('section de retour absente des paramètres')
  await page.getByRole('button', { name: /^Écrire$|^Write$/ }).click()
  await page.waitForTimeout(500)
  const sendDisabled = await page
    .getByRole('button', { name: /^Envoyer$|^Send$/ })
    .isDisabled()
    .catch(() => true)
  if (sendDisabled) ok('envoi bloqué tant que le message est vide')
  else fail('envoi actif sans message')
  await page.locator('#feedback-message').fill('Test de retour automatique')
  await page.waitForTimeout(300)
  const catVisible = await page.getByRole('button', { name: /Un problème|A problem/ }).first().isVisible()
  if (catVisible) ok('catégories de retour disponibles')
  else fail('catégories absentes')

  await browser.close()
  console.log(failures === 0 ? '\nCRUD : OK.' : `\n${failures} problème(s).`)
  process.exit(failures > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error('ERREUR :', error.message)
  process.exit(1)
})
