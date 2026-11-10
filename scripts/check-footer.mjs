// Vérifie le pied de page du tableau de bord (accès permanent aux mentions légales).
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
    await login(page)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(500)

    const info = await page.evaluate(() => {
      const footer = document.querySelector('footer')
      if (!footer) return { found: false }
      const rect = footer.getBoundingClientRect()
      const links = Array.from(footer.querySelectorAll('a')).map((a) => ({
        href: a.getAttribute('href'),
        text: (a.textContent ?? '').trim(),
      }))
      const tabBar = document.querySelector('nav[aria-label="Navigation mobile"]')
      const tabBarVisible = tabBar ? getComputedStyle(tabBar).display !== 'none' : false
      const tabRect = tabBarVisible ? tabBar.getBoundingClientRect() : null
      return {
        found: true,
        bottom: Math.round(rect.bottom),
        top: Math.round(rect.top),
        links,
        text: (footer.textContent ?? '').replace(/\s+/g, ' ').trim(),
        tabBarTop: tabRect ? Math.round(tabRect.top) : null,
        viewportHeight: window.innerHeight,
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      }
    })

    if (!info.found) {
      fail(`${label} : pied de page absent`)
      await page.close()
      continue
    }
    ok(`${label} : pied de page présent`)

    const required = ['/mentions-legales', '/cgu', '/confidentialite', '/cookies', '/remboursement']
    const missing = required.filter((href) => !info.links.some((link) => link.href === href))
    if (missing.length === 0) ok(`${label} : 5 documents obligatoires liés`)
    else fail(`${label} : liens manquants ${missing.join(', ')}`)

    if (/ABA/.test(info.text)) ok(`${label} : mention de l'éditeur`)
    else fail(`${label} : mention de l'éditeur absente`)

    if (info.tabBarTop !== null && info.bottom > info.tabBarTop + 1) {
      fail(`${label} : le pied de page passe sous la barre d'onglets`)
    } else if (info.tabBarTop === null) {
      ok(`${label} : pas de barre d'onglets (pied de page libre)`)
    } else {
      ok(`${label} : pied de page accessible (pas de recouvrement)`)
    }

    if (info.overflow) fail(`${label} : débordement horizontal`)
    else ok(`${label} : pas de débordement`)

    // La page mentions légales répond et affiche son titre
    await page.goto(BASE + '/mentions-legales', { waitUntil: 'networkidle' })
    await page.waitForTimeout(400)
    const title = await page
      .getByRole('heading', { level: 1 })
      .first()
      .textContent()
      .catch(() => null)
    if (title && /Mentions légales/.test(title)) ok(`${label} : page /mentions-legales accessible`)
    else fail(`${label} : page /mentions-legales introuvable (${title})`)
    const host = await page.getByText(/Cloudflare/).first().isVisible().catch(() => false)
    if (host) ok(`${label} : hébergeur mentionné`)
    else fail(`${label} : hébergeur non mentionné`)

    await page.close()
  }

  await browser.close()
  console.log(failures === 0 ? '\nPied de page et mentions légales : OK.' : `\n${failures} problème(s).`)
  process.exit(failures > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error('ERREUR :', error.message)
  process.exit(1)
})
