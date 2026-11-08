// Test de fumée de l'extension : chargement, connexion e-mail/mot de passe, interface.
import { chromium } from 'playwright'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const extensionPath = path.join(root, 'extension')
const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tabnest-ext-'))

async function main() {
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  })
  let failures = 0
  const fail = (message) => {
    failures += 1
    console.log('   FAIL', message)
  }
  const ok = (message) => console.log(`   OK ${message}`)

  let worker = context.serviceWorkers()[0]
  if (!worker) worker = await context.waitForEvent('serviceworker', { timeout: 15000 })
  const extensionId = new URL(worker.url()).host
  ok(`extension chargée (id ${extensionId.slice(0, 8)}…)`)

  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(`chrome-extension://${extensionId}/popup.html`)
  await page.waitForTimeout(600)

  if (await page.locator('#google-btn').isVisible()) ok('bouton « Continuer avec Google » présent')
  else fail('bouton Google absent')

  if (await page.locator('#login-form').isVisible()) ok('formulaire e-mail visible')
  else fail('formulaire e-mail absent')

  // Validation regex : bouton bloqué tant que les champs sont invalides
  const initiallyDisabled = await page.locator('#login-btn').isDisabled()
  if (initiallyDisabled) ok('bouton de connexion désactivé au départ')
  else fail('bouton de connexion actif sans contenu')

  await page.locator('#email').fill('pas-un-email')
  await page.locator('#email').blur()
  await page.waitForTimeout(200)
  const emailErrorVisible = await page.locator('#email-error').isVisible().catch(() => false)
  if (emailErrorVisible) ok('erreur d’e-mail invalide affichée')
  else fail('aucune erreur pour un e-mail invalide')

  await page.locator('#email').fill('demo@tabnest.demo')
  await page.locator('#password').fill('123')
  await page.locator('#password').blur()
  await page.waitForTimeout(200)
  const shortPwError = await page.locator('#password-error').isVisible().catch(() => false)
  if (shortPwError) ok('mot de passe trop court signalé')
  else fail('mot de passe court non signalé')
  const stillDisabled = await page.locator('#login-btn').isDisabled()
  if (stillDisabled) ok('bouton toujours bloqué avec un mot de passe court')
  else fail('bouton actif malgré un mot de passe court')

  await page.locator('#password').fill('DemoCapture-2025!')
  await page.waitForTimeout(200)
  const enabled = await page.locator('#login-btn').isEnabled()
  if (enabled) ok('bouton activé quand tout est valide')
  else fail('bouton resté bloqué alors que valide')

  await page.locator('#login-btn').click()

  const loggedIn = await page
    .locator('#logged-in')
    .waitFor({ state: 'visible', timeout: 15000 })
    .then(() => true)
    .catch(() => false)
  if (loggedIn) ok('connexion e-mail/mot de passe réussie dans l’extension')
  else fail('connexion impossible dans l’extension')

  const skeletonGone = await page
    .locator('#loading')
    .isHidden()
    .catch(() => false)
  if (skeletonGone) ok('squelette de chargement remplacé par le contenu')
  else fail('le squelette de chargement reste affiché')

  // Panneaux repliés : on les ouvre pour vérifier leur contenu
  await page.locator('details summary', { hasText: 'Importer' }).click()
  await page.locator('details summary', { hasText: 'Fermer les onglets' }).click()
  await page.waitForTimeout(200)

  if (loggedIn) {
    const account = await page.locator('#account').textContent()
    if (/demo@tabnest\.demo/.test(account ?? '')) ok('compte affiché')
    else fail(`compte inattendu (${account})`)

    const reasons = await page.locator('[data-reason]').count()
    if (reasons === 4) ok('4 boutons de rangement présents')
    else fail(`${reasons} bouton(s) de rangement au lieu de 4`)

    if (await page.locator('#pin-btn').isVisible()) ok('bouton épingler présent')
    else fail('bouton épingler absent')

    if (await page.locator('#group-select').isVisible()) ok('sélecteur de projet présent')
    else fail('sélecteur de projet absent')

    const removeExists = await page.locator('#remove-btn').count()
    const restoreExists = await page.locator('#restore-btn').count()
    if (removeExists === 1 && restoreExists === 1) {
      ok('actions CRUD présentes (retirer / restaurer)')
    } else {
      fail('actions CRUD absentes du popup')
    }
  }

  // Import historique / favoris + fermeture automatique
  const hasImport = await page.locator('#import-history').isVisible().catch(() => false)
  if (hasImport) ok('bouton d’import de l’historique présent')
  else fail('bouton d’import de l’historique absent')
  const hasBookmarks = await page.locator('#import-bookmarks').isVisible().catch(() => false)
  if (hasBookmarks) ok('bouton d’import des favoris présent')
  else fail('bouton d’import des favoris absent')
  const hasAutoClose = await page.locator('#auto-close').isVisible().catch(() => false)
  if (hasAutoClose) ok('réglage de fermeture automatique présent')
  else fail('réglage de fermeture automatique absent')

  const settingsMessages = await page.evaluate(async () => {
    const sent = []
    const original = chrome.runtime.sendMessage
    chrome.runtime.sendMessage = (message, callback) => {
      sent.push(message?.type)
      return original(message, callback)
    }
    document.querySelector('#auto-close').click()
    document.querySelector('#import-history').click()
    document.querySelector('#import-bookmarks').click()
    return sent
  })
  if (settingsMessages.includes('set-auto-close')) ok('la bascule envoie « set-auto-close »')
  else fail('la bascule n’envoie aucun message')
  if (
    settingsMessages.includes('import-history') &&
    settingsMessages.includes('import-bookmarks')
  ) {
    ok('les imports envoient bien leurs messages')
  } else {
    fail('les boutons d’import n’envoient pas de message')
  }

  // Les boutons de rangement déclenchent un message au service worker
  const messageTypes = await page.evaluate(() => {
    const sent = []
    const original = chrome.runtime.sendMessage
    chrome.runtime.sendMessage = (message, callback) => {
      sent.push(message?.type)
      return original(message, callback)
    }
    document.querySelector('[data-reason="remember"]').click()
    document.querySelector('#pin-btn').click()
    return sent
  })
  if (messageTypes.includes('classify')) ok('les actions envoient bien « classify » au service worker')
  else fail('aucun message « classify » envoyé')

  // Mode sombre du popup
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.waitForTimeout(300)
  const darkBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  const darkParts = darkBg.match(/\d+/g)?.map(Number) ?? [255, 255, 255]
  if (darkParts[0] + darkParts[1] + darkParts[2] < 200) {
    ok(`mode sombre appliqué (fond ${darkBg})`)
  } else {
    fail(`mode sombre non appliqué (fond ${darkBg})`)
  }

  if (errors.length === 0) ok('aucune erreur JavaScript dans le popup')
  else fail(`erreurs JS : ${errors.join(' | ')}`)

  await context.close()
  fs.rmSync(userDataDir, { recursive: true, force: true })
  console.log(failures === 0 ? '\nExtension : OK.' : `\n${failures} problème(s).`)
  process.exit(failures > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error('ERREUR :', error.message)
  try {
    fs.rmSync(userDataDir, { recursive: true, force: true })
  } catch {
    // nettoyage non critique
  }
  process.exit(1)
})
