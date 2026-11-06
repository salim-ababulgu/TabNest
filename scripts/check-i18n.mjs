// Vérification ponctuelle : couverture des clés des dictionnaires ES/ZH par rapport aux FR.
import { readFileSync } from 'node:fs'

function extractBlock(text, constName) {
  const start = text.indexOf(constName)
  if (start === -1) return null
  const open = text.indexOf('{', start)
  if (open === -1) return null
  let depth = 0
  let inStr = null
  let esc = false
  for (let i = open; i < text.length; i += 1) {
    const c = text[i]
    if (inStr) {
      if (esc) esc = false
      else if (c === '\\') esc = true
      else if (c === inStr) inStr = null
      continue
    }
    if (c === "'" || c === '"') {
      inStr = c
      continue
    }
    if (c === '{') depth += 1
    else if (c === '}') {
      depth -= 1
      if (depth === 0) return text.slice(open + 1, i)
    }
  }
  return null
}

function keySet(block) {
  const keys = new Set()
  const re = /^\s*'([^']+)'\s*:/gm
  let m
  while ((m = re.exec(block)) !== null) keys.add(m[1])
  return keys
}

const frLanding = extractBlock(readFileSync('src/lib/i18n.ts', 'utf8'), 'FR')
const frProduct = extractBlock(readFileSync('src/lib/i18n-dash.ts', 'utf8'), 'FR')
const frKeys = new Set([...keySet(frLanding), ...keySet(frProduct)])

for (const [file, name] of [
  ['src/lib/i18n-zh.ts', 'ZH_ALL'],
  ['src/lib/i18n-es.ts', 'ES_ALL'],
]) {
  let text
  try {
    text = readFileSync(file, 'utf8')
  } catch {
    console.log(`${file} : absent`)
    continue
  }
  const block = extractBlock(text, name)
  if (!block) {
    console.log(`${file} : bloc ${name} introuvable`)
    continue
  }
  const keys = keySet(block)
  const missing = [...frKeys].filter((k) => !keys.has(k))
  const extra = [...keys].filter((k) => !frKeys.has(k))
  console.log(`${file} : ${keys.size} clés | manquantes ${missing.length} | en trop ${extra.length}`)
  if (missing.length) console.log('  manquantes:', missing.join(', '))
  if (extra.length) console.log('  en trop:', extra.join(', '))
}
