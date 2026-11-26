// Знімає скриншоти запущеного фронтенду через headless Chrome (CDP), без
// залежностей — лише Node 22+ (вбудовані fetch і WebSocket).
//
//   node .claude/skills/ui-check/shots.mjs <outDir> <name:path:theme:width[:action]>...
//
//   theme  — light | dark
//   width  — ширина вікна; < 600 емулює мобільний пристрій
//   action — burger (відкрити мобільне меню) | full (уся сторінка, до 2600px)
//
// Логіниться через API як SHOTS_EMAIL / SHOTS_PASSWORD (за замовчуванням —
// сід-адмін з backend/.env.example). Шляхи, крім /login, отримують токен.
import { spawn } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'

const [outDir, ...specs] = process.argv.slice(2)
if (!outDir || specs.length === 0) {
  console.error('usage: node shots.mjs <outDir> <name:path:theme:width[:action]>...')
  process.exit(1)
}

const FRONTEND = process.env.SHOTS_FRONTEND ?? 'http://localhost:5173'
const BACKEND = process.env.SHOTS_BACKEND ?? 'http://localhost:3000'
const CHROME = process.env.SHOTS_CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PORT = 9333
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

mkdirSync(outDir, { recursive: true })

const loginRes = await fetch(`${BACKEND}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: process.env.SHOTS_EMAIL ?? 'admin@beautycrm.local',
    password: process.env.SHOTS_PASSWORD ?? 'ChangeMe123!',
  }),
})
if (!loginRes.ok) {
  console.error(`login failed: HTTP ${loginRes.status} — set SHOTS_EMAIL / SHOTS_PASSWORD`)
  process.exit(1)
}
const { accessToken } = await loginRes.json()

const profileDir = `${outDir}/.chrome-profile`
const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profileDir}`,
  '--no-first-run',
  '--hide-scrollbars',
  'about:blank',
])

let wsUrl
for (let i = 0; i < 50 && !wsUrl; i++) {
  await sleep(200)
  try {
    const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()
    wsUrl = targets.find((t) => t.type === 'page')?.webSocketDebuggerUrl
  } catch {
    // Chrome ще стартує
  }
}
if (!wsUrl) {
  chrome.kill()
  console.error('Chrome did not start (is another instance using port 9333?)')
  process.exit(1)
}

const ws = new WebSocket(wsUrl)
await new Promise((resolve) => ws.addEventListener('open', resolve))
let nextId = 0
const pending = new Map()
ws.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data)
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg)
    pending.delete(msg.id)
  }
})
const send = (method, params = {}) =>
  new Promise((resolve) => {
    const id = ++nextId
    pending.set(id, resolve)
    ws.send(JSON.stringify({ id, method, params }))
  })
const evaluate = async (expression) =>
  (await send('Runtime.evaluate', { expression, awaitPromise: true })).result?.result?.value

await send('Page.enable')
await send('Page.navigate', { url: `${FRONTEND}/login` })
await sleep(1500)

for (const spec of specs) {
  const [name, path, theme = 'light', width = '1440', action] = spec.split(':')
  const w = Number(width)
  await send('Emulation.setDeviceMetricsOverride', {
    width: w,
    height: w < 600 ? 844 : 900,
    deviceScaleFactor: 1,
    mobile: w < 600,
  })
  const token = path === '/login' ? null : accessToken
  await evaluate(
    `localStorage.setItem('crm.theme', ${JSON.stringify(theme)});` +
      (token
        ? `localStorage.setItem('crm.accessToken', ${JSON.stringify(token)})`
        : `localStorage.removeItem('crm.accessToken')`),
  )
  await send('Page.navigate', { url: FRONTEND + path })
  await sleep(2200)

  if (action === 'burger') {
    await evaluate(`document.querySelector('.mobile-topbar .icon-button')?.click()`)
    await sleep(500)
  }

  let clip
  if (action === 'full') {
    const height = await evaluate('document.documentElement.scrollHeight')
    clip = { x: 0, y: 0, width: w, height: Math.min(Number(height) || 900, 2600), scale: 1 }
  }
  const shot = await send('Page.captureScreenshot', {
    format: 'png',
    ...(clip ? { clip, captureBeyondViewport: true } : {}),
  })
  if (!shot.result) {
    console.error(`${name}: ${JSON.stringify(shot.error)}`)
    continue
  }
  writeFileSync(`${outDir}/${name}.png`, Buffer.from(shot.result.data, 'base64'))
  console.log(`saved ${outDir}/${name}.png`)
}

ws.close()
chrome.kill()
await sleep(300)
rmSync(profileDir, { recursive: true, force: true })
