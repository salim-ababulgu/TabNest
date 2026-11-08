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

  await page.locator('#email').fill('demo@tabnest.demo')
  await page.locator('#password').fill('DemoCapture-2025!')
  await page.locator('#login-btn').click()

  const loggedIn = await page
    .locator('#logged-in')
    .waitFor({ state: 'visible', timeout: 15000 })
    .then(() => true)
    .catch(() => false)
  if (loggedIn) ok('connexion e-mail/mot de passe réussie dans l’extension')
  else fail('connexion impossible dans l’extension')

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
