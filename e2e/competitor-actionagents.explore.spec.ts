import { test } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const COMPETITOR_URL = process.env.COMPETITOR_URL || 'https://actionagents.io'
const COMPETITOR_EMAIL = process.env.COMPETITOR_EMAIL || ''
const COMPETITOR_PASSWORD = process.env.COMPETITOR_PASSWORD || ''
const MANUAL_LOGIN = process.env.COMPETITOR_MANUAL_LOGIN === '1'

test('explore actionagents end-to-end', async ({ page }, testInfo) => {
  const artifactsDir = path.join(testInfo.outputDir, 'artifacts')
  fs.mkdirSync(artifactsDir, { recursive: true })
  const findings: string[] = []

  const note = async (msg: string) => {
    findings.push(msg)
    console.log(msg)
  }

  await note(`Opening ${COMPETITOR_URL}`)
  await page.goto(COMPETITOR_URL, { waitUntil: 'domcontentloaded' })
  await page.screenshot({ path: path.join(artifactsDir, '00-landing.png'), fullPage: true })

  // Try common login CTA buttons/links.
  const loginCandidates = [
    'text=Login',
    'text=Log in',
    'text=Sign in',
    'a[href*="login"]',
    'a[href*="signin"]',
    'button:has-text("Login")',
    'button:has-text("Sign in")',
  ]

  for (const candidate of loginCandidates) {
    const el = page.locator(candidate).first()
    if (await el.isVisible().catch(() => false)) {
      await note(`Clicking login trigger: ${candidate}`)
      await el.click().catch(() => {})
      break
    }
  }

  await page.waitForLoadState('domcontentloaded')
  await page.screenshot({ path: path.join(artifactsDir, '01-login-page.png'), fullPage: true })

  if (MANUAL_LOGIN) {
    await note('Manual login mode enabled. Complete login/OTP in browser, then press Enter here.')
    await new Promise<void>((resolve) => {
      process.stdin.resume()
      process.stdin.setEncoding('utf8')
      process.stdin.once('data', () => resolve())
    })
  } else if (COMPETITOR_EMAIL && COMPETITOR_PASSWORD) {
    const emailInput = page
      .locator('input[type="email"], input[name*="email" i], input[placeholder*="email" i]')
      .first()
    const passwordInput = page
      .locator('input[type="password"], input[name*="password" i], input[placeholder*="password" i]')
      .first()

    if (await emailInput.isVisible().catch(() => false)) {
      await emailInput.fill(COMPETITOR_EMAIL)
      await note('Filled email')
    }
    if (await passwordInput.isVisible().catch(() => false)) {
      await passwordInput.fill(COMPETITOR_PASSWORD)
      await note('Filled password')
    }

    const submitCandidates = [
      'button[type="submit"]',
      'button:has-text("Login")',
      'button:has-text("Log in")',
      'button:has-text("Sign in")',
    ]
    for (const candidate of submitCandidates) {
      const btn = page.locator(candidate).first()
      if (await btn.isVisible().catch(() => false)) {
        await btn.click().catch(() => {})
        await note(`Clicked submit: ${candidate}`)
        break
      }
    }
  } else {
    await note('No credentials provided via env; complete login manually in opened browser.')
    await note('Press Enter in terminal after you complete login/OTP.')
    await new Promise<void>((resolve) => {
      process.stdin.resume()
      process.stdin.setEncoding('utf8')
      process.stdin.once('data', () => resolve())
    })
  }

  // Wait for post-login navigation; allow manual OTP/captcha handling.
  await page.waitForTimeout(12_000)
  await page.screenshot({ path: path.join(artifactsDir, '02-post-login.png'), fullPage: true })
  await note(`Current URL after login attempt: ${page.url()}`)

  // Crawl visible links/buttons iteratively (safe bounded exploration).
  const visited = new Set<string>()
  for (let i = 0; i < 15; i++) {
    const url = page.url()
    if (!visited.has(url)) {
      visited.add(url)
      await note(`Visited page ${visited.size}: ${url}`)
      await page.screenshot({
        path: path.join(artifactsDir, `page-${String(visited.size).padStart(2, '0')}.png`),
        fullPage: true,
      })
    }

    const navLinks = page.locator('a[href]:visible')
    const count = await navLinks.count()
    let clicked = false

    for (let j = 0; j < Math.min(count, 50); j++) {
      const link = navLinks.nth(j)
      const href = (await link.getAttribute('href').catch(() => null)) || ''
      const text = (await link.textContent().catch(() => ''))?.trim() || ''

      if (!href) continue
      if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) continue
      if (href.includes('logout') || href.includes('signout')) continue
      if (/privacy|terms|cookie/i.test(text)) continue

      const before = page.url()
      await link.click({ timeout: 3000 }).catch(() => {})
      await page.waitForTimeout(1500)
      const after = page.url()
      if (after !== before) {
        await note(`Clicked nav link "${text || href}" -> ${after}`)
        clicked = true
        break
      }
    }

    if (!clicked) {
      // Click one visible button to reveal modals/flows.
      const btn = page.locator('button:visible').first()
      if (await btn.isVisible().catch(() => false)) {
        const label = ((await btn.textContent().catch(() => '')) || '').trim()
        if (label && !/logout|sign out|delete/i.test(label)) {
          await btn.click().catch(() => {})
          await page.waitForTimeout(1000)
          await note(`Clicked button: ${label}`)
        }
      }
      break
    }
  }

  fs.writeFileSync(path.join(artifactsDir, 'findings.txt'), findings.join('\n'), 'utf8')
  await note(`Exploration done. Artifacts: ${artifactsDir}`)
})

