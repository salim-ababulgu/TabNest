// Capture de vraies captures d'écran du dashboard, pour la landing.
// Prérequis : serveur de dev lancé sur http://localhost:5173/ et Playwright installé.
// Usage : node scripts/capture-screenshots.mjs
//
// Idempotent : utilise un compte de démonstration fixe, efface ses données
// d'exemple puis les réinsère avant de photographier. Aucun secret n'est
// écrit ni affiché (clés lues dans .env.local).

import { readFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const index = line.indexOf('=')
      return [line.slice(0, index), line.slice(index + 1).replace(/^["']|["']$/g, '')]
    }),
)

const SUPABASE_URL = env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY
const APP_URL = 'http://localhost:5173/'
const OUT_DIR = fileURLToPath(new URL('../public/screenshots/', import.meta.url))

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont requis dans .env.local')
  process.exit(1)
}

const EMAIL = process.env.TABNEST_DEMO_EMAIL ?? ''
const PASSWORD = process.env.TABNEST_DEMO_PASSWORD ?? ''

const days = (n) => new Date(Date.now() + n * 24 * 3600 * 1000).toISOString()
const hoursAgo = (n) => new Date(Date.now() - n * 3600 * 1000).toISOString()

function authHeaders(token) {
  return { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` }
}

async function insert(token, path, body) {
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    method: 'POST',
    headers: { ...authHeaders(token), Prefer: 'return=representation' },
    body: JSON.stringify(body),
  })
  if (!response.ok) throw new Error(`${path} -> ${response.status} ${await response.text()}`)
  return response.json()
}

async function removeAll(token, userId) {
  for (const table of ['pages', 'groups']) {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?user_id=eq.${userId}`,
      { method: 'DELETE', headers: { ...authHeaders(token), Prefer: 'return=minimal' } },
    )
    if (!response.ok) throw new Error(`delete ${table} -> ${response.status} ${await response.text()}`)
  }
}

function storedUser(page) {
  return page.evaluate(() => {
    const key = Object.keys(localStorage).find((item) => item.includes('auth-token'))
    if (!key) return null
    const raw = localStorage.getItem(key)
    if (!raw) return null
    try {
      const session = JSON.parse(raw)
      return { token: session.access_token ?? null, userId: session.user?.id ?? null }
    } catch {
      return null
    }
  })
}

async function signInOrUp(page) {
  await page.goto(APP_URL, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: /Créer un compte gratuit|Create a free account/ }).first().click()

  const exists = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  }).then((response) => response.ok)

  if (exists) {
    await page.getByRole('tab', { name: 'Connexion', exact: true }).click()
    await page.locator('#email').fill(EMAIL)
  await page.locator('#password').fill(PASSWORD)
    await page.getByRole('button', { name: 'Se connecter', exact: true }).click()
  } else {
    await page.locator('#password').fill(PASSWORD)
    await page.getByRole('button', { name: 'Créer un compte', exact: true }).click()
  }
  await page.getByText('Ce qui compte revient').waitFor({ timeout: 20000 })
}

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })

  await signInOrUp(page)
  const session = await storedUser(page)
  if (!session?.token || !session?.userId) throw new Error('Session introuvable')

  await removeAll(session.token, session.userId)

  const [emploi, voiture] = await Promise.all([
    insert(session.token, '/rest/v1/groups', { name: 'Emploi', user_id: session.userId }),
    insert(session.token, '/rest/v1/groups', { name: 'Achat de voiture', user_id: session.userId }),
  ])

  const pages = [
    { url: 'https://www.welcometothejungle.com/fr/companies', title: 'Entreprises qui recrutent', group_id: emploi[0].id, kind: 'normal', reason: 'finish', visit_count: 4, last_visited_at: hoursAgo(5), expires_at: days(7), pinned: false, theme_color: '#f0c95b' },
    { url: 'https://www.leboncoin.fr/voitures', title: 'Voitures', group_id: voiture[0].id, kind: 'normal', reason: 'explore', visit_count: 6, last_visited_at: hoursAgo(2), expires_at: days(14), pinned: true, theme_color: '#ff6e14' },
    { url: 'https://developer.mozilla.org/fr/docs/Web/CSS/CSS_grid_layout', title: 'CSS Grid', group_id: null, kind: 'documentation', reason: 'remember', visit_count: 3, last_visited_at: hoursAgo(26), expires_at: days(30), pinned: false, theme_color: '#1b1b1b' },
    { url: 'https://www.figma.com/community', title: 'Figma Community', group_id: emploi[0].id, kind: 'normal', reason: 'decide', visit_count: 2, last_visited_at: hoursAgo(9), expires_at: days(3), pinned: false, theme_color: '#a259ff' },
    { url: 'https://www.netflix.com/fr/', title: 'Netflix', group_id: null, kind: 'normal', reason: 'remember', visit_count: 5, last_visited_at: hoursAgo(30), expires_at: days(30), pinned: false, theme_color: '#141414' },
    { url: 'https://github.com/salim-ababulgu/TabNest', title: 'TabNest sur GitHub', group_id: null, kind: 'normal', reason: 'finish', visit_count: 4, last_visited_at: hoursAgo(3), expires_at: days(7), pinned: false, theme_color: '#24292f' },
    { url: 'https://linear.app/', title: 'Linear', group_id: null, kind: 'normal', reason: 'finish', visit_count: 3, last_visited_at: hoursAgo(20), expires_at: days(7), pinned: false, theme_color: '#5e6ad2' },
    { url: 'https://www.airbnb.fr/', title: 'Airbnb', group_id: null, kind: 'normal', reason: 'explore', visit_count: 2, last_visited_at: hoursAgo(50), expires_at: days(14), pinned: false, theme_color: '#ff5a5f' },
  ]

  await insert(session.token, '/rest/v1/pages', pages.map((item) => ({ ...item, user_id: session.userId })))

  await page.reload({ waitUntil: 'networkidle' })
  await page.getByText('Ce qui compte revient').waitFor({ timeout: 20000 })
  await page.waitForTimeout(900)
  mkdirSync(OUT_DIR, { recursive: true })

  // Vue d'ensemble : hero + carte d'accueil (l'extension absente est normale)
  await page.screenshot({ path: join(OUT_DIR, 'dashboard-overview.png') })

  // Grille de cartes
  await page.evaluate(() => window.scrollTo(0, 560))
  await page.waitForTimeout(700)
  await page.screenshot({ path: join(OUT_DIR, 'dashboard-grid.png') })

  // Détail d'un site (raisons + durée de vie)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.locator('button', { hasText: 'Détails' }).first().click()
  await page.waitForTimeout(600)
  await page.screenshot({ path: join(OUT_DIR, 'dashboard-detail.png') })

  // Mobile : même page, taille d'écran réduite
  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByText('Ce qui compte revient').waitFor({ timeout: 20000 })
  await page.waitForTimeout(700)
  await page.screenshot({ path: join(OUT_DIR, 'dashboard-mobile.png') })

  await browser.close()
  console.log('Captures enregistrées dans public/screenshots/')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
