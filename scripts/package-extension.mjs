// Construit l'archive téléchargeable de l'extension (avec sa config générée
// depuis .env.local) et l'écrit dans public/downloads/.
// Aucune clé secrète n'est incluse : seulement l'URL Supabase et la clé anon.
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourceDir = path.join(root, 'extension')
const outDir = path.join(root, 'public', 'downloads')
const outFile = path.join(outDir, 'tabnest-extension.zip')

const FILES = [
  'manifest.json',
  'background.js',
  'content.js',
  'page-meta.js',
  'popup.html',
  'popup.js',
  'popup.css',
  'i18n.js',
  'README.md',
  'icons/icon16.png',
  'icons/icon48.png',
  'icons/icon128.png',
]

function readEnv(name) {
  const envPath = path.join(root, '.env.local')
  if (!fs.existsSync(envPath)) return ''
  const line = fs
    .readFileSync(envPath, 'utf8')
    .split('\n')
    .map((row) => row.trim())
    .find((row) => row.startsWith(`${name}=`))
  return line ? line.slice(name.length + 1).replace(/^["']|["']$/g, '') : ''
}

const supabaseUrl = readEnv('VITE_SUPABASE_URL')
const supabaseKey = readEnv('VITE_SUPABASE_ANON_KEY')
if (!supabaseUrl || !supabaseKey) {
  console.error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY introuvables dans .env.local')
  process.exit(1)
}

const configSource = `// Généré par scripts/package-extension.mjs — ne pas modifier à la main.
export const SUPABASE_URL = '${supabaseUrl}'
export const SUPABASE_ANON_KEY = '${supabaseKey}'
`

// --- Écriture ZIP minimale (deflate + CRC32), sans dépendance ---
const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  return table
})()

function crc32(buffer) {
  let crc = -1
  for (let i = 0; i < buffer.length; i += 1) crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buffer[i]) & 0xff]
  return (crc ^ -1) >>> 0
}

function buildZip(entries) {
  const localParts = []
  const centralParts = []
  let offset = 0
  for (const entry of entries) {
    const name = Buffer.from(entry.name, 'utf8')
    const data = entry.data
    const compressed = zlib.deflateRawSync(data, { level: 9 })
    const crc = crc32(data)
    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4)
    local.writeUInt16LE(0, 6)
    local.writeUInt16LE(8, 8)
    local.writeUInt16LE(0, 10)
    local.writeUInt16LE(0, 12)
    local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(compressed.length, 18)
    local.writeUInt32LE(data.length, 22)
    local.writeUInt16LE(name.length, 26)
    local.writeUInt16LE(0, 28)
    localParts.push(local, name, compressed)

    const central = Buffer.alloc(46)
    central.writeUInt32LE(0x02014b50, 0)
    central.writeUInt16LE(20, 4)
    central.writeUInt16LE(20, 6)
    central.writeUInt16LE(0, 8)
    central.writeUInt16LE(8, 10)
    central.writeUInt16LE(0, 12)
    central.writeUInt16LE(0, 14)
    central.writeUInt32LE(crc, 16)
    central.writeUInt32LE(compressed.length, 20)
    central.writeUInt32LE(data.length, 24)
    central.writeUInt16LE(name.length, 28)
    central.writeUInt16LE(0, 30)
    central.writeUInt16LE(0, 32)
    central.writeUInt16LE(0, 34)
    central.writeUInt16LE(0, 36)
    central.writeUInt32LE(0, 38)
    central.writeUInt32LE(offset, 42)
    centralParts.push(central, name)

    offset += local.length + name.length + compressed.length
  }
  const centralSize = centralParts.reduce((total, part) => total + part.length, 0)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(0, 4)
  end.writeUInt16LE(0, 6)
  end.writeUInt16LE(entries.length, 8)
  end.writeUInt16LE(entries.length, 10)
  end.writeUInt32LE(centralSize, 12)
  end.writeUInt32LE(offset, 16)
  end.writeUInt16LE(0, 20)
  return Buffer.concat([...localParts, ...centralParts, end])
}

const entries = [
  ...FILES.filter((file) => fs.existsSync(path.join(sourceDir, file))).map((file) => ({
    name: file,
    data: fs.readFileSync(path.join(sourceDir, file)),
  })),
  { name: 'config.js', data: Buffer.from(configSource, 'utf8') },
]

fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(outFile, buildZip(entries))
const size = fs.statSync(outFile).size
const version = JSON.parse(fs.readFileSync(path.join(sourceDir, 'manifest.json'), 'utf8')).version
fs.writeFileSync(
  path.join(outDir, 'extension-info.json'),
  JSON.stringify({ version, builtAt: new Date().toISOString(), files: entries.length }, null, 2),
)
console.log(`archive écrite : ${path.relative(root, outFile)} (${(size / 1024).toFixed(1)} ko, v${version})`)
