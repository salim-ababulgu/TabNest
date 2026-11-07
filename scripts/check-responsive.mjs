// Vérifie l'adaptation du dashboard par écran (mobile 390 / desktop 1280).
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
  await page.waitForTimeout(400)
}

function fail(message) {
  console.log('FAIL', message)
  return 1
}

async function main() {
  const browser = await chromium.launch()
  let failures = 0

  // ---------- Mobile ----------
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await login(mobile)

  const noHScroll = await mobile.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  )
  if (!noHScroll) failures += fail('mobile : la page défile horizontalement')

  // La carte doit être en ligne : hauteur < largeur du conteneur
  const card = mobile.locator('[data-site] article').first()
  const cardBox = await card.boundingBox()
  if (cardBox && cardBox.height > 150) {
    failures += fail(`mobile : la carte est haute (${Math.round(cardBox.height)}px), pas en ligne compacte`)
  } else {
    console.log('OK   mobile : carte en ligne compacte', cardBox ? `${Math.round(cardBox.width)}x${Math.round(cardBox.height)}` : '')
  }

  // Barre d'onglets du bas visible
  const tabBar = await mobile.getByRole('navigation', { name: /Navigation mobile|Mobile navigation/ }).isVisible().catch(() => false)
  if (!tabBar) failures += fail('mobile : barre d’onglets absente') 
  else console.log('OK   mobile : barre d’onglets visible')

  // Modale plein écran
  await mobile.getByRole('button', { name: /Détails|Details/ }).first().click()
  await mobile.waitForTimeout(500)
  const modal = await mobile.locator('[role="dialog"]').boundingBox()
  if (!modal || modal.width < 380 || modal.height < 700) {
    failures += fail(`mobile : la modale n’est pas plein écran (${modal ? `${Math.round(modal.width)}x${Math.round(modal.height)}` : 'absente'})`)
  } else {
    console.log('OK   mobile : modale plein écran', `${Math.round(modal.width)}x${Math.round(modal.height)}`)
  }
  await mobile.keyboard.press('Escape')
  await mobile.close()

  // ---------- Desktop ----------
  const desktop = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await login(desktop)
  const dCard = await desktop.locator('[data-site] article').first().boundingBox()
  if (dCard && dCard.height < dCard.width) {
    failures += fail('desktop : la carte devrait être verticale (image en haut)')
  } else {
    console.log('OK   desktop : carte verticale', dCard ? `${Math.round(dCard.width)}x${Math.round(dCard.height)}` : '')
  }
  await desktop.getByRole('button', { name: /Détails|Details/ }).first().click()
  await desktop.waitForTimeout(500)
  const dModal = await desktop.locator('[role="dialog"]').boundingBox()
  if (dModal && dModal.width > 520) {
    failures += fail(`desktop : modale trop large (${Math.round(dModal.width)}px)`)
  } else {
    console.log('OK   desktop : modale centrée', dModal ? `${Math.round(dModal.width)}x${Math.round(dModal.height)}` : '')
  }
  await desktop.close()

  await browser.close()
  console.log(failures === 0 ? '\nTout est adapté par écran.' : `\n${failures} problème(s).`)
  process.exit(failures > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error('ERREUR :', error.message)
  process.exit(1)
})
