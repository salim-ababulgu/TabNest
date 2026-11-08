// Vérifie les squelettes de chargement : fidélité de géométrie, bascule, CLS.
import { chromium } from 'playwright'

const BASE = 'http://localhost:5173'
const EMAIL = process.env.TABNEST_DEMO_EMAIL ?? ''
const PASSWORD = process.env.TABNEST_DEMO_PASSWORD ?? ''

async function login(page) {
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.getByLabel('Votre adresse e-mail').fill(EMAIL)
  await page.getByRole('button', { name: 'Commencer', exact: true }).click()
  await page.waitForTimeout(700)
  await page.getByRole('tab', { name: /^Connexion$/ }).click()
  await page.locator('#password').fill(PASSWORD)
  await page.getByRole('button', { name: /^Se connecter$/ }).click()
}

async function slowData(page) {
  const slow = async (route) => {
    if (route.request().method() !== 'GET') return route.continue()
    await new Promise((resolve) => setTimeout(resolve, 1400))
    return route.continue()
  }
  await page.route('**/rest/v1/pages*', slow)
  await page.route('**/rest/v1/groups*', slow)
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
    await page.addInitScript(() => {
      window.__cls = 0
      window.__clsLog = []
      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.hadRecentInput) continue
            window.__cls += entry.value
            window.__clsLog.push({
              value: Math.round(entry.value * 1000) / 1000,
              nodes: (entry.sources ?? []).map((source) => {
                const node = source.node
                if (!node) return '?'

                const name = node.nodeName
                const cls = typeof node.className === 'string' ? node.className.slice(0, 60) : ''
                const rect = source.currentRect
                return `${name}.${cls} @${Math.round(rect?.top ?? -1)}`
              }),
            })
          }
        }).observe({ type: 'layout-shift', buffered: true })
      } catch {
        // navigateur sans layout-shift
      }
    })
    await slowData(page)
    await login(page)

    // Pendant le chargement : squelettes de grille et de navigation
    const grid = page.locator('[data-skeleton-grid]')
    const nav = page.locator('[data-skeleton-nav]')
    const gridVisible = await grid
      .waitFor({ state: 'visible', timeout: 8000 })
      .then(() => true)
      .catch(() => false)
    const navVisible = gridVisible
      ? await nav.isVisible().catch(() => false)
      : await nav
          .waitFor({ state: 'visible', timeout: 8000 })
          .then(() => true)
          .catch(() => false)
    if (gridVisible) console.log(`${label} : OK grille squelettique visible`)
    else fail(`${label} : pas de grille squelettique`)
    if (viewport.width >= 768) {
      if (navVisible) console.log(`${label} : OK navigation squelettique visible`)
      else fail(`${label} : pas de navigation squelettique`)
    } else {
      console.log(`${label} : navigation dans le tiroir (hors écran, non testée ici)`)
    }

    const during = await page.evaluate(() => ({
      sites: document.querySelectorAll('[data-site]').length,
      skeletonCards: document.querySelectorAll('[data-skeleton-grid] article').length,
      busy: document.querySelector('[data-skeleton-grid]')?.getAttribute('aria-busy'),
      topHeight: document.querySelector('[data-skeleton-top]')?.getBoundingClientRect().height ?? 0,
      gridHeight: document.querySelector('[data-skeleton-grid]')?.getBoundingClientRect().height ?? 0,
    }))
    console.log(
      `   ${during.skeletonCards} cartes squelettes, ${during.sites} vraie(s) carte(s), aria-busy=${during.busy}, bande ${Math.round(during.topHeight)} px`,
    )
    if (during.sites !== 0) fail(`${label} : des vraies cartes apparaissent pendant le squelette`)
    if (during.busy !== 'true') fail(`${label} : aria-busy manquant`)

    // Géométrie : le squelette doit ressembler à la vraie carte
    const skel = await page.locator('[data-skeleton-grid] article').first().boundingBox()
    if (skel) {
      if (viewport.width < 640 && skel.height > 150) {
        fail(`${label} : squelette trop haut en mobile (${Math.round(skel.height)} px)`)
      } else if (viewport.width >= 640 && skel.height <= skel.width) {
        fail(`${label} : squelette non vertical en desktop`)
      } else {
        console.log(`   OK géométrie du squelette (${Math.round(skel.width)}×${Math.round(skel.height)} px)`)
      }
    } else fail(`${label} : squelette introuvable pour la mesure`)

    // On mesure les sauts de mise en page à partir du squelette (la bascule
    // landing → dashboard n'est pas représentative du chargement des données).
    await page.evaluate(() => {
      window.__cls = 0
    })

    // Après chargement : les cartes remplacent le squelette
    await page.locator('[data-site]').first().waitFor({ timeout: 20000 })
    await page.waitForTimeout(500)
    const after = await page.evaluate(() => ({
      skeletons: document.querySelectorAll('[data-skeleton-grid]').length,
      sites: document.querySelectorAll('[data-site]').length,
      cls: Math.round((window.__cls ?? 0) * 1000) / 1000,
      log: (window.__clsLog ?? []).slice(-3),
      topHeight: document.querySelector('section.mt-8')?.getBoundingClientRect().height ?? 0,
    }))
    console.log(
      `   bande : squelette ${Math.round(during.topHeight)} px → réelle ${Math.round(after.topHeight)} px`,
    )
    if (after.skeletons === 0) console.log(`${label} : OK squelette remplacé (${after.sites} cartes)`)
    else fail(`${label} : squelette encore présent après chargement`)
    if (after.cls <= 0.1) console.log(`${label} : OK aucun saut de mise en page (CLS ${after.cls})`)
    else {
      fail(`${label} : saut de mise en page (CLS ${after.cls})`)
      console.log('   sources :', JSON.stringify(after.log))
    }

    await page.close()
  }

  await browser.close()
  console.log(failures === 0 ? '\nSquelettes : OK.' : `\n${failures} problème(s).`)
  process.exit(failures > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error('ERREUR :', error.message)
  process.exit(1)
})
