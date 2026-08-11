#!/usr/bin/env node
// Xifra i desxifra la zona privada de la pàgina del viatge.
//
//   node tools/xina-crypt.mjs encrypt    private/privat.html  ->  payload dins index.html
//   node tools/xina-crypt.mjs decrypt    payload d'index.html ->  private/privat.html
//
// La contrasenya es demana per teclat, o es pot passar amb XINA_PASS=...
// El text en clar (private/) NO es puja mai al repo: mira .gitignore.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { webcrypto as crypto } from 'node:crypto'
import { createInterface } from 'node:readline'

const ITERATIONS = 300000
const INDEX = 'index.html'
const SOURCE = 'private/privat.html'
const OPEN = '<script id="privatPayload" type="application/json">'
const CLOSE = '</script>'

const b64 = (bytes) => Buffer.from(bytes).toString('base64')
const unb64 = (str) => new Uint8Array(Buffer.from(str, 'base64'))

async function deriveKey(password, salt) {
  const material = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

function askPassword(prompt) {
  if (process.env.XINA_PASS) return Promise.resolve(process.env.XINA_PASS)
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true })
    rl.stdoutMuted = true
    rl._writeToOutput = function (s) {
      rl.output.write(rl.stdoutMuted && !s.includes(prompt) ? '' : s)
    }
    rl.question(prompt, (answer) => {
      rl.close()
      process.stdout.write('\n')
      resolve(answer)
    })
  })
}

function splicePayload(html, json) {
  const start = html.indexOf(OPEN)
  if (start === -1) throw new Error(`No trobo el marcador ${OPEN} a ${INDEX}`)
  const from = start + OPEN.length
  const end = html.indexOf(CLOSE, from)
  if (end === -1) throw new Error('Marcador de payload sense tancar')
  return html.slice(0, from) + json + html.slice(end)
}

function readPayload(html) {
  const start = html.indexOf(OPEN)
  if (start === -1) throw new Error(`No trobo el marcador ${OPEN} a ${INDEX}`)
  const from = start + OPEN.length
  const end = html.indexOf(CLOSE, from)
  const raw = html.slice(from, end).trim()
  if (!raw) throw new Error('El payload és buit: encara no has xifrat res.')
  return JSON.parse(raw)
}

async function encrypt() {
  const plaintext = readFileSync(SOURCE, 'utf8')
  const password = await askPassword('Contrasenya per xifrar: ')
  if (password.length < 8) {
    console.error('✗ Contrasenya massa curta. Mínim 8 caràcters (millor una frase llarga).')
    process.exit(1)
  }
  const confirm = await askPassword('Repeteix-la: ')
  if (confirm !== password) {
    console.error('✗ No coincideixen. No he tocat res.')
    process.exit(1)
  }

  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(password, salt)
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext)
  )

  const payload = {
    v: 1,
    kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: ITERATIONS, salt: b64(salt) },
    cipher: 'AES-GCM',
    iv: b64(iv),
    ct: b64(new Uint8Array(ct))
  }

  writeFileSync(INDEX, splicePayload(readFileSync(INDEX, 'utf8'), JSON.stringify(payload)))
  const kb = (JSON.stringify(payload).length / 1024).toFixed(1)
  console.log(`✓ Zona privada xifrada dins ${INDEX} (${kb} kB de text xifrat).`)
  console.log(`  ${plaintext.length} caràcters en clar protegits amb AES-256-GCM.`)
}

async function decrypt() {
  const payload = readPayload(readFileSync(INDEX, 'utf8'))
  const password = await askPassword('Contrasenya per desxifrar: ')
  const key = await deriveKey(password, unb64(payload.kdf.salt))
  let plaintext
  try {
    const buf = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: unb64(payload.iv) }, key, unb64(payload.ct)
    )
    plaintext = new TextDecoder().decode(buf)
  } catch {
    console.error('✗ Contrasenya incorrecta (o el payload està corromput).')
    process.exit(1)
  }
  mkdirSync('private', { recursive: true })
  writeFileSync(SOURCE, plaintext)
  console.log(`✓ Recuperat a ${SOURCE}. Edita'l i torna a fer: node tools/xina-crypt.mjs encrypt`)
}

const command = process.argv[2]
if (command === 'encrypt') await encrypt()
else if (command === 'decrypt') await decrypt()
else {
  console.log('Ús: node tools/xina-crypt.mjs encrypt | decrypt')
  process.exit(1)
}
