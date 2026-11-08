// Vérifie qu'aucun élément ne déborde de la modale de détail, en mobile et en desktop.
import { chromium } from 'playwright'

const BASE = 'http://localhost:5173'
const EMAIL = process.env.TABNEST_DEMO_EMAIL ?? ''
const PASSWORD = process.env.TABNEST_DEMO_PASSWORD ?? ''

async function login(page) {
  await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 30000 })
    await page.getByRole('button', { name: /Créer un compte gratuit|Create a free account/ }).first().click()
  await page.waitForTimeout(700)
  await page.getByRole('tab', { name: /^Connexion$|Sign in/ }).click()
  await page.locator('#email').fill(EMAIL)
  await page.locator('#password').fill(PASSWORD)
  await page.getByRole('button', { name: /Se connecter|Sign in/ }).last().click()
  await page.getByText(/Ce qui compte revient|What matters comes back/).waitFor({ timeout: 20000 })
}

async function openDetail(page) {
  await page.getByRole('button', { name: /Détails|Details/ }).first().click()
  await page.waitForTimeout(500)
}

async function overflowReport(page) {
  return page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]')
    if (!dialog) return { ok: false, reason: 'modale introuvable', offenders: [] }
    const box = dialog.getBoundingClientRect()
    const offenders = []
    for (const el of dialog.querySelectorAll('*')) {
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) continue
      if (r.right > box.right + 1 || r.left < box.left - 1) {
        offenders.push({
          tag: el.tagName.toLowerCase(),
          cls: String(el.className).slice(0, 60),
          text: (el.textContent || '').trim().slice(0, 40),
          right: Math.round(r.right - box.right),
          left: Math.round(box.left - r.left),
        })
        if (offenders.length >= 8) break
      }
    }
    const pageOverflow = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    return { ok: offenders.length === 0 && !pageOverflow, offenders, pageOverflow, box: { w: Math.round(box.width) } }
  })
}

async function main() {
  const browser = await chromium.launch()
  let failures = 0

  for (const [label, viewport] of [
    ['mobile 360x740', { width: 360, height: 740 }],
    ['desktop 1280x800', { width: 1280, height: 800 }],
  ]) {
    const page = await browser.newPage({ viewport })
    await login(page)
    await openDetail(page)
    const report = await overflowReport(page)
    const status = report.ok ? 'OK  ' : 'FAIL'
    console.log(`${status} ${label} — modale ${report.box?.w ?? '?'}px, pageOverflow=${report.pageOverflow}`)
    if (!report.ok) {
      failures += 1
      for (const o of report.offenders ?? []) {
        console.log(`   déborde: <${o.tag}> "${o.text}" class="${o.cls}" (droite +${o.right}px / gauche +${o.left}px)`)
      }
      if (report.reason) console.log('   ', report.reason)
    }
    await page.close()
  }

  await browser.close()
  process.exit(failures > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error('ERREUR :', error.message)
  process.exit(1)
})
