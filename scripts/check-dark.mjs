// Vérifie le mode sombre de la page d'accueil jusqu'à l'écran de connexion.
import { chromium } from 'playwright'

const BASE = 'http://localhost:5173'

function luminance(rgb) {
  const [r, g, b] = rgb.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number).map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a, b) {
  const la = luminance(a)
  const lb = luminance(b)
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
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
    await page.goto(BASE + '/', { waitUntil: 'networkidle' })
    await page.waitForTimeout(500)

    // 1. Bascule depuis la landing
    const toggle = page.getByRole('button', { name: /Passer en sombre|Switch to dark/ }).first()
    if (!(await toggle.isVisible().catch(() => false))) {
      fail(`${label} : bouton de thème absent de la landing`)
      await page.close()
      continue
    }
    await toggle.click()
    await page.waitForTimeout(400)
    const landing = await page.evaluate(() => {
      const body = getComputedStyle(document.body)
      return {
        dark: document.documentElement.classList.contains('dark'),
        bg: body.backgroundColor,
        color: body.color,
      }
    })
    if (!landing.dark) fail(`${label} : la classe sombre n'est pas appliquée`)
    else ok(`${label} : landing en mode sombre`)
    const ratio = contrast(landing.color, landing.bg)
    if (ratio >= 4.5) ok(`${label} : contraste du texte ${ratio.toFixed(1)}:1`)
    else fail(`${label} : contraste insuffisant (${ratio.toFixed(1)}:1)`)

    // 2. Persistance jusqu'à la page de connexion
    await page.getByRole('button', { name: /Commencer|Get started/ }).first().click()
    await page.waitForTimeout(700)
    const auth = await page.evaluate(() => {
      const card = document.querySelector('.rounded-2xl.border.bg-card')
      const heading = document.querySelector('h1, h2')
      return {
        dark: document.documentElement.classList.contains('dark'),
        cardBg: card ? getComputedStyle(card).backgroundColor : '',
        heading: heading ? getComputedStyle(heading).color : '',
      }
    })
    if (!auth.dark) fail(`${label} : le thème est perdu à l'arrivée sur l'authentification`)
    else ok(`${label} : authentification en mode sombre`)
    if (auth.cardBg && auth.heading) {
      const cardRatio = contrast(auth.heading, auth.cardBg)
      if (cardRatio >= 4.5) ok(`${label} : contraste carte ${cardRatio.toFixed(1)}:1`)
      else fail(`${label} : contraste de la carte insuffisant (${cardRatio.toFixed(1)}:1)`)
    } else {
      fail(`${label} : carte d'authentification introuvable`)
    }

    // 3. Retour au clair depuis l'authentification
    const backToggle = page.getByRole('button', { name: /Passer en clair|Switch to light/ }).first()
    if (await backToggle.isVisible().catch(() => false)) {
      await backToggle.click()
      await page.waitForTimeout(400)
      const cleared = await page.evaluate(
        () => !document.documentElement.classList.contains('dark'),
      )
      if (cleared) ok(`${label} : retour au thème clair`)
      else fail(`${label} : retour au clair inopérant`)
    } else {
      fail(`${label} : bouton de thème absent de l'authentification`)
    }

    await page.close()
  }

  await browser.close()
  console.log(failures === 0 ? '\nMode sombre : OK.' : `\n${failures} problème(s).`)
  process.exit(failures > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error('ERREUR :', error.message)
  process.exit(1)
})
