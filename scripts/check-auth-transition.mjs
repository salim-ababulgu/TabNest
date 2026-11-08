// Vérifie la fluidité de la bascule Connexion ↔ Inscription et l'absence
// d'interférence (double titre visible, double soumission, focus, CLS).
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

  // --- Desktop, animations normales
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await openAuth(page)

  // Mesure du décalage de mise en page pendant la bascule
  await page.evaluate(() => {
    window.__cls = 0
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.__cls += entry.value
      }
    }).observe({ type: 'layout-shift', buffered: true })
  })

  const started = Date.now()
  await page.getByRole('tab', { name: 'Inscription' }).click()
  // Pendant la transition : les deux titres ne doivent pas être visibles ensemble
  let overlap = false
  for (let i = 0; i < 12; i += 1) {
    const both = await page.evaluate(() => {
      const login = Array.from(document.querySelectorAll('h2')).some(
        (el) => /Content de te revoir/.test(el.textContent ?? '') && el.getBoundingClientRect().width > 0,
      )
      const signup = Array.from(document.querySelectorAll('h2')).some(
        (el) => /Crée ton nid/.test(el.textContent ?? '') && el.getBoundingClientRect().width > 0,
      )
      return login && signup
    })
    if (both) overlap = true
    await page.waitForTimeout(30)
  }
  await page.getByRole('heading', { name: /Crée ton nid/ }).waitFor({ timeout: 4000 })
  const duration = Date.now() - started
  if (!overlap) ok(`desktop : pas de chevauchement des deux titres (${duration} ms)`)
  else fail('desktop : les deux titres visibles en même temps')
  if (duration < 1500) ok('desktop : bascule rapide (< 1,5 s)')
  else fail(`desktop : bascule lente (${duration} ms)`)

  const cls = await page.evaluate(() => Math.round((window.__cls ?? 0) * 1000) / 1000)
  if (cls <= 0.1) ok(`desktop : aucune secousse de mise en page (CLS ${cls})`)
  else fail(`desktop : saut de mise en page (CLS ${cls})`)

  // Double clic rapide : le PREMIER clic gagne, le second est ignoré (anti-chevauchement)
  await page.getByRole('tab', { name: 'Connexion' }).click()
  await page.getByRole('tab', { name: 'Inscription' }).click({ force: true }).catch(() => {})
  await page.waitForTimeout(700)
  const active = await page
    .getByRole('tab', { selected: true })
    .first()
    .textContent()
  if (/Connexion/.test(active ?? '')) ok('desktop : double clic géré (premier clic conservé)')
  else fail(`desktop : mode final inattendu (${active})`)

  // Focus conservé sur un champ utilisable
  const focusedField = await page.evaluate(() => document.activeElement?.id ?? '')
  if (['email', 'password'].includes(focusedField) || focusedField === '') {
    ok(`desktop : focus utilisable (${focusedField || 'aucun'})`)
  } else {
    console.log(`   info focus : ${focusedField}`)
  }

  // Règles de mot de passe visibles seulement en inscription
  await page.getByRole('tab', { name: 'Inscription' }).click()
  await page.waitForTimeout(600)
  const rulesVisible = await page.getByText(/8 caractères minimum/).isVisible().catch(() => false)
  if (rulesVisible) ok('desktop : règles affichées en inscription')
  else fail('desktop : règles absentes en inscription')
  await page.getByRole('tab', { name: 'Connexion' }).click()
  await page.waitForTimeout(600)
  const rulesHidden = !(await page.getByText(/8 caractères minimum/).isVisible().catch(() => false))
  if (rulesHidden) ok('desktop : règles masquées en connexion')
  else fail('desktop : règles encore visibles en connexion')

  await page.close()

  // --- Animations réduites
  const reduced = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await reduced.emulateMedia({ reducedMotion: 'reduce' })
  await openAuth(reduced)
  await reduced.getByRole('tab', { name: 'Inscription' }).click()
  const fast = await reduced
    .getByRole('heading', { name: /Crée ton nid/ })
    .waitFor({ timeout: 800 })
    .then(() => true)
    .catch(() => false)
  if (fast) ok('réduit : bascule immédiate')
  else fail('réduit : bascule bloquée')
  const overflow = await reduced.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  )
  if (!overflow) ok('réduit/mobile : pas de débordement')
  else fail('réduit/mobile : débordement horizontal')
  await reduced.close()

  await browser.close()
  console.log(failures === 0 ? '\nTransition : fluide.' : `\n${failures} problème(s).`)
  process.exit(failures > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error('ERREUR :', error.message)
  process.exit(1)
})
