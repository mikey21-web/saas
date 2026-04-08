/* eslint-disable no-console */
const fs = require('fs')
const path = require('path')
const { chromium } = require('playwright')

async function main() {
  const endpoint = (process.env.CDP_ENDPOINT || 'http://127.0.0.1:9222').trim()
  const MAX_DEEP_STEPS = Number(process.env.COMPETITOR_MAX_STEPS || 30)
  const outDir = path.resolve(
    process.cwd(),
    'test-results',
    `competitor-cdp-${new Date().toISOString().replace(/[:.]/g, '-')}`
  )
  fs.mkdirSync(outDir, { recursive: true })
  const findingsPath = path.join(outDir, 'findings.txt')
  const pagesJsonPath = path.join(outDir, 'pages.json')
  const coveragePath = path.join(outDir, 'coverage.json')
  const authGatesPath = path.join(outDir, 'auth_gates.json')
  const findings = []
  const pageSnapshots = []
  const clickedKeys = new Set()
  const seenProfiles = new Set()
  const pausedAuthKeys = new Set()
  const formClickCounts = new Map()
  const stateHitCounts = new Map()
  const branchCreateHits = new Map()
  const SAFE_MODE = process.env.COMPETITOR_SAFE_MODE === '1'
  const SKIP_SKILLS_LIBRARY = process.env.COMPETITOR_SKIP_SKILLS_LIBRARY !== '0'
  const SKIP_CREATE_AGENT = process.env.COMPETITOR_SKIP_CREATE_AGENT !== '0'
  const STORE_ONLY_MODE = process.env.COMPETITOR_STORE_ONLY_MODE !== '0'
  const DASHBOARD_HOST = (process.env.COMPETITOR_DASHBOARD_HOST || 'dashboard.actionagents.io').trim()

  const note = (msg) => {
    findings.push(msg)
    console.log(msg)
  }

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const SCREENSHOT_TIMEOUT_MS = Number(process.env.COMPETITOR_SCREENSHOT_TIMEOUT_MS || 8000)
  let DASHBOARD_ORIGIN = ''

  const coverage = {
    sidebar: [],
    sectionsVisited: [],
    agentTargetsBySection: {},
    paymentBoundaries: [],
  }
  const authGates = []

  const pauseForUser = async (message) => {
    note(message)
    await new Promise((resolve) => {
      process.stdin.resume()
      process.stdin.setEncoding('utf8')
      process.stdin.once('data', () => resolve())
    })
  }

  const safeScreenshot = async (indexLabel) => {
    const baseName = `page-${String(indexLabel).padStart(2, '0')}`
    const fullPath = path.join(outDir, `${baseName}.png`)
    const viewportPath = path.join(outDir, `${baseName}-viewport.png`)

    try {
      await page.screenshot({
        path: fullPath,
        fullPage: true,
        timeout: SCREENSHOT_TIMEOUT_MS,
        animations: 'disabled',
      })
      return fullPath
    } catch (err) {
      note(`[WARN] Full-page screenshot failed (${err?.name || 'Error'}). Falling back to viewport screenshot.`)
      try {
        await page.screenshot({
          path: viewportPath,
          fullPage: false,
          timeout: Math.max(3000, Math.floor(SCREENSHOT_TIMEOUT_MS / 2)),
          animations: 'disabled',
        })
        return viewportPath
      } catch (fallbackErr) {
        note(
          `[WARN] Viewport screenshot also failed (${fallbackErr?.name || 'Error'}). Continuing without screenshot.`
        )
        return null
      }
    }
  }

  const toAbsoluteUrl = (maybeUrl, baseUrl) => {
    if (!maybeUrl) return null
    try {
      return new URL(maybeUrl, baseUrl || page.url()).href
    } catch {
      return null
    }
  }

  const isOutsideDashboardScope = (absoluteUrl) => {
    if (!absoluteUrl) return false
    try {
      const u = new URL(absoluteUrl)
      if (DASHBOARD_HOST) return u.hostname !== DASHBOARD_HOST
      if (!DASHBOARD_ORIGIN) return false
      return u.origin !== DASHBOARD_ORIGIN
    } catch {
      return true
    }
  }

  const isBlockedSkillsLibraryTarget = (text = '', absoluteUrl = '') => {
    if (!SKIP_SKILLS_LIBRARY) return false
    const t = String(text || '').toLowerCase()
    const u = String(absoluteUrl || '').toLowerCase()
    return (
      /clawhub|skills \(|skill library|plugins|marketplace/i.test(`${t} ${u}`) ||
      /\/skills(\/|$)|\/plugins(\/|$)|\/search(\/|$)|\/about(\/|$)/i.test(u)
    )
  }

  const isCreateAgentTarget = (text = '', absoluteUrl = '') => {
    const t = String(text || '').toLowerCase()
    const u = String(absoluteUrl || '').toLowerCase()
    return /create agent/.test(t) || /\/agents\/create(\/|$)/.test(u)
  }

  const isAllowedTarget = (text = '', maybeUrl = '') => {
    const abs = toAbsoluteUrl(maybeUrl, page.url())
    if (abs && isOutsideDashboardScope(abs)) return false
    if (isBlockedSkillsLibraryTarget(text, abs || maybeUrl)) return false
    if (SKIP_CREATE_AGENT && isCreateAgentTarget(text, abs || maybeUrl)) return false
    return true
  }

  const isStoreAgentUrl = (maybeUrl = '') => {
    const abs = toAbsoluteUrl(maybeUrl, page.url())
    if (!abs) return false
    try {
      const u = new URL(abs)
      return u.hostname === DASHBOARD_HOST && /^\/store\/[^/]+/i.test(u.pathname)
    } catch {
      return false
    }
  }

  note(`Connecting to Chrome CDP: ${endpoint}`)
  const browser = await chromium.connectOverCDP(endpoint)
  const context = browser.contexts()[0]
  if (!context) {
    throw new Error('No browser context found. Start Chrome with --remote-debugging-port=9222.')
  }

  const page = context.pages()[0] || (await context.newPage())
  note(`Using page: ${page.url() || '(blank)'}`)
  await page.bringToFront()
  await page.waitForTimeout(1000)
  const currentUrl = page.url()
  const currentHost = (() => {
    try {
      return new URL(currentUrl).hostname
    } catch {
      return ''
    }
  })()
  if (currentHost && currentHost !== DASHBOARD_HOST) {
    const forcedDashboardUrl = `https://${DASHBOARD_HOST}/dashboard`
    note(`[SCOPE] Current tab is ${currentHost}. Switching to ${forcedDashboardUrl}`)
    await page.goto(forcedDashboardUrl, { waitUntil: 'domcontentloaded' }).catch(() => {})
    await wait(1200)
  }
  DASHBOARD_ORIGIN = `https://${DASHBOARD_HOST}`
  note(`Dashboard origin scope: ${DASHBOARD_ORIGIN}`)
  note(`Dashboard host scope: ${DASHBOARD_HOST}`)
  if (SKIP_SKILLS_LIBRARY) note('Skills-library crawling is disabled (COMPETITOR_SKIP_SKILLS_LIBRARY=1).')
  if (SKIP_CREATE_AGENT) note('Create Agent route is skipped (COMPETITOR_SKIP_CREATE_AGENT=1).')
  if (STORE_ONLY_MODE) note('Store-only mode is enabled (COMPETITOR_STORE_ONLY_MODE=1).')

  const capturePageProfile = async (tag) => {
    const profile = await page.evaluate(() => {
      const pickText = (sel, limit = 8) =>
        Array.from(document.querySelectorAll(sel))
          .map((el) => (el.textContent || '').trim().replace(/\s+/g, ' '))
          .filter(Boolean)
          .slice(0, limit)

      const pickAttrs = (sel, attr, limit = 25) =>
        Array.from(document.querySelectorAll(sel))
          .map((el) => el.getAttribute(attr))
          .filter(Boolean)
          .slice(0, limit)

      const bodyStyle = window.getComputedStyle(document.body)
      const main = document.querySelector('main') || document.body
      const mainStyle = window.getComputedStyle(main)
      const cards = Array.from(
        document.querySelectorAll('section, article, [class*="card"], [class*="panel"], [role="region"]')
      ).slice(0, 30)

      const textContent = (document.body?.innerText || '').replace(/\s+/g, ' ').slice(0, 4000)
      const authHints = textContent
        .split(/(?<=[.!?])\s+/)
        .filter((t) =>
          /(sign in|login|log in|google|oauth|verify|otp|community|unauthorized|forbidden|access denied)/i.test(t)
        )
        .slice(0, 12)

      return {
        url: window.location.href,
        title: document.title,
        headings: pickText('h1, h2, h3', 20),
        descriptions: pickText('p, [class*="subtitle"], [class*="description"]', 30),
        buttons: pickText('button, [role="button"]', 40),
        links: pickAttrs('a[href]', 'href', 60),
        forms: Array.from(document.querySelectorAll('form')).length,
        inputs: Array.from(document.querySelectorAll('input, textarea, select')).length,
        navItems: pickText('nav a, aside a, [role="navigation"] a, [class*="sidebar"] a', 40),
        sectionsCount: cards.length,
        colors: {
          bodyBg: bodyStyle.backgroundColor,
          bodyText: bodyStyle.color,
          mainBg: mainStyle.backgroundColor,
          mainText: mainStyle.color,
        },
        authHints,
      }
    })
    const key = `${profile.url}::${tag || 'page'}`
    if (!seenProfiles.has(key)) {
      seenProfiles.add(key)
      pageSnapshots.push(profile)
      note(`Visited ${pageSnapshots.length}: ${profile.url}`)
      note(`Title: ${profile.title}`)
      if (profile.navItems.length) note(`Nav: ${profile.navItems.slice(0, 8).join(' | ')}`)
      if (profile.authHints.length) note(`Auth hints: ${profile.authHints.join(' || ')}`)
      await safeScreenshot(pageSnapshots.length)
    }
    return profile
  }

  const isCommunityAuthGate = async () => {
    const text = await page.locator('body').innerText().catch(() => '')
    return /community/i.test(text) && /(auth|authorize|connect|permission|verify|sign in|login)/i.test(text)
  }

  const isPaymentBoundary = () => /checkout|payment|pricing|billing|subscribe|plan/i.test(page.url())

  const collectSidebarHrefs = async () =>
    page.evaluate(() => {
      const toAbs = (href) => {
        try {
          return new URL(href, window.location.href).href
        } catch {
          return null
        }
      }

      const links = Array.from(
        document.querySelectorAll('aside a[href], nav a[href], [class*="sidebar"] a[href], [role="navigation"] a[href]')
      )
      const result = []
      for (const a of links) {
        const href = a.getAttribute('href')
        if (!href) continue
        const abs = toAbs(href)
        if (!abs) continue
        const text = (a.textContent || '').trim().replace(/\s+/g, ' ')
        if (!text) continue
        if (/logout|sign out/i.test(text)) continue
        if (
          /clawhub|skills \(|skill library|plugins|marketplace/i.test(`${text} ${abs}`) ||
          /\/skills(\/|$)|\/plugins(\/|$)|\/search(\/|$)|\/about(\/|$)/i.test(abs)
        ) {
          continue
        }
        result.push({ text, href: abs })
      }

      const unique = []
      const seen = new Set()
      for (const item of result) {
        const key = `${item.text}::${item.href}`
        if (!seen.has(key)) {
          seen.add(key)
          unique.push(item)
        }
      }
      const score = (item) => {
        const text = `${item.text} ${item.href}`.toLowerCase()
        if (/agent store|\/store/.test(text)) return 0
        if (/agents|\/agents/.test(text)) return 1
        if (/skills/.test(text)) return 2
        return 3
      }
      unique.sort((a, b) => score(a) - score(b))
      return unique
    })

  const collectAgentLinks = async () =>
    page.evaluate(() => {
      const toAbs = (href) => {
        try {
          return new URL(href, window.location.href).href
        } catch {
          return null
        }
      }
      const inScope = (text, href) =>
        /(agent|template|workflow|skill|community|store|deploy|launch|open|view|details)/i.test(
          `${text || ''} ${href || ''}`
        )
      const links = Array.from(document.querySelectorAll('main a[href], [role="main"] a[href], article a[href], a[href]'))
      const result = []
      for (const a of links) {
        const href = a.getAttribute('href') || ''
        if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue
        const abs = toAbs(href)
        if (!abs) continue
        const text = (a.textContent || '').trim().replace(/\s+/g, ' ')
        if (!text) continue
        if (/logout|sign out|delete|remove/i.test(text)) continue
        if (/google|oauth|apple|microsoft/i.test(`${text} ${abs}`)) continue
        if (
          /clawhub|skills \(|skill library|plugins|marketplace/i.test(`${text} ${abs}`) ||
          /\/skills(\/|$)|\/plugins(\/|$)|\/search(\/|$)|\/about(\/|$)/i.test(abs)
        ) {
          continue
        }
        if (!inScope(text, abs)) continue
        result.push({ text, href: abs })
      }
      const unique = []
      const seen = new Set()
      for (const r of result) {
        const key = `${r.text}::${r.href}`
        if (!seen.has(key)) {
          seen.add(key)
          unique.push(r)
        }
      }
      return unique
    })

  const collectStoreAgentLinks = async () =>
    page.evaluate(() => {
      const toAbs = (href) => {
        try {
          return new URL(href, window.location.href).href
        } catch {
          return null
        }
      }
      const links = Array.from(document.querySelectorAll('main a[href], [role="main"] a[href], article a[href]'))
      const result = []
      for (const a of links) {
        const href = a.getAttribute('href') || ''
        if (!href) continue
        const abs = toAbs(href)
        if (!abs) continue
        let pathname = ''
        try {
          pathname = new URL(abs).pathname
        } catch {
          continue
        }
        if (!/^\/store\/[^/]+/i.test(pathname)) continue
        const text = (a.textContent || '').trim().replace(/\s+/g, ' ')
        if (!text) continue
        result.push({ text, href: abs })
      }
      const unique = []
      const seen = new Set()
      for (const r of result) {
        const key = `${r.text}::${r.href}`
        if (!seen.has(key)) {
          seen.add(key)
          unique.push(r)
        }
      }
      return unique
    })

  const collectActionables = async () =>
    page.evaluate(() => {
      const normalize = (s) => (s || '').trim().replace(/\s+/g, ' ')
      const list = []
      const pushItem = (type, text, href, idx) => {
        const t = normalize(text)
        if (!t) return
        list.push({ type, text: t, href: href || '', idx })
      }

      const links = Array.from(document.querySelectorAll('a[href]'))
      const buttons = Array.from(document.querySelectorAll('button,[role="button"]'))
      links.forEach((el, idx) => pushItem('link', el.textContent || '', el.getAttribute('href') || '', idx))
      buttons.forEach((el, idx) => pushItem('button', el.textContent || '', '', idx))
      return list
    })

  const maybePauseAtCommunityAuth = async () => {
    if (!(await isCommunityAuthGate())) return
    const key = page.url()
    if (!pausedAuthKeys.has(key)) {
      pausedAuthKeys.add(key)
      authGates.push({ url: page.url(), title: await page.title().catch(() => '') })
      await pauseForUser(
        '[PAUSE] Community auth detected. Authorize in browser, then press Enter here to continue...'
      )
      await wait(1200)
    }
  }

  const getAutoAnswer = (hint = '') => {
    const h = hint.toLowerCase()
    if (/(name|company|about yourself|about your company)/i.test(h)) {
      return 'Hi, I am Alex from Diyaa AI. We help SMB teams automate operations and customer follow-ups.'
    }
    if (/(ideal customer|icp|target|roles|who do you want)/i.test(h)) {
      return 'Operations heads, founders, and sales managers at SMBs (10-200 employees) in India and SEA.'
    }
    if (/(call to action|cta|after hearing from you)/i.test(h)) {
      return 'Book a 15-minute discovery call and request a demo.'
    }
    if (/(goal|outcome|success)/i.test(h)) {
      return 'Generate qualified leads and automate follow-up workflows.'
    }
    return 'Auto-filled by crawler to continue product flow exploration.'
  }

  const tryAdvanceSetupForm = async (sectionName, branchName, depth) => {
    const formFields = page.locator(
      'textarea:visible, input[type="text"]:visible, input:not([type]):visible, input[type="search"]:visible'
    )
    const fieldCount = await formFields.count()
    if (fieldCount === 0) return false

    const beforeUrl = page.url()
    const beforeBody = await page
      .locator('body')
      .innerText()
      .then((t) => t.slice(0, 1200))
      .catch(() => '')

    let filledAny = false
    for (let i = 0; i < Math.min(fieldCount, 6); i++) {
      const field = formFields.nth(i)
      const isEditable = await field
        .evaluate((el) => {
          const input = el
          return !input.disabled && !input.readOnly
        })
        .catch(() => false)
      if (!isEditable) continue

      const value = await field.inputValue().catch(() => '')
      if ((value || '').trim()) continue

      const ph = await field.getAttribute('placeholder').catch(() => '')
      const name = await field.getAttribute('name').catch(() => '')
      const aria = await field.getAttribute('aria-label').catch(() => '')
      const hint = `${ph || ''} ${name || ''} ${aria || ''}`
      const answer = getAutoAnswer(hint)
      await field.fill(answer).catch(() => {})
      filledAny = true
      note(`[FORM] Filled field in ${sectionName}/${branchName} at depth ${depth}`)
    }

    const continueSelectors = [
      'main button:has-text("Continue"), [role="main"] button:has-text("Continue")',
      'main button:has-text("Next"), [role="main"] button:has-text("Next")',
      'main button:has-text("Submit"), [role="main"] button:has-text("Submit")',
      'main button:has-text("Save"), [role="main"] button:has-text("Save")',
      'main button:has-text("Proceed"), [role="main"] button:has-text("Proceed")',
      'main button:has-text("Launch"), [role="main"] button:has-text("Launch")',
      'main button:has-text("Create"), [role="main"] button:has-text("Create")',
      'button:has-text("Continue")',
      'button:has-text("Next")',
      'button:has-text("Submit")',
      'button:has-text("Save")',
      'button:has-text("Proceed")',
      'button:has-text("Launch")',
      'button:has-text("Create")',
      '[role="button"]:has-text("Continue")',
      '[role="button"]:has-text("Next")',
    ]

    let clicked = false
    for (const selector of continueSelectors) {
      const btn = page.locator(selector).first()
      const visible = await btn.isVisible().catch(() => false)
      if (!visible) continue
      const enabled = await btn.isEnabled().catch(() => false)
      if (!enabled) continue

      const clickKey = `${page.url()}::${selector}`
      const priorClicks = formClickCounts.get(clickKey) || 0
      if (priorClicks >= 2) {
        continue
      }

      await btn.click({ timeout: 2000 }).catch(() => {})
      clicked = true
      formClickCounts.set(clickKey, priorClicks + 1)
      note(`[FORM] Clicked advance button "${selector}"`)

      await wait(1300)
      const postClickUrl = page.url()
      const postClickBody = await page
        .locator('body')
        .innerText()
        .then((t) => t.slice(0, 1200))
        .catch(() => '')
      const changed = postClickUrl !== beforeUrl || postClickBody !== beforeBody
      if (changed) {
        break
      }
      note(`[FORM] No state change after "${selector}", trying next action.`)
    }

    if (!filledAny && !clicked) return false

    const afterUrl = page.url()
    const afterBody = await page
      .locator('body')
      .innerText()
      .then((t) => t.slice(0, 1200))
      .catch(() => '')

    const changed = afterUrl !== beforeUrl || afterBody !== beforeBody
    if (changed) return true
    // If we only clicked but nothing changed, treat as no progress to avoid loops.
    if (clicked && !filledAny) return false
    // If fields were filled this step, allow one more loop to attempt the next button.
    return filledAny
  }

  const deepDiveCurrentPage = async (sectionName, branchName) => {
    for (let depth = 0; depth < MAX_DEEP_STEPS; depth++) {
      const urlBeforeStep = page.url()
      const bodyBeforeStep = await page
        .locator('body')
        .innerText()
        .then((t) => t.replace(/\s+/g, ' ').slice(0, 900))
        .catch(() => '')
      const stateKey = `${branchName}::${urlBeforeStep}::${bodyBeforeStep}`
      const seenState = (stateHitCounts.get(stateKey) || 0) + 1
      stateHitCounts.set(stateKey, seenState)
      if (seenState >= 3) {
        note(`[LOOP-BREAK] Repeated state detected ${seenState}x at ${urlBeforeStep}. Breaking ${branchName}.`)
        break
      }

      if (SKIP_CREATE_AGENT && /\/agents\/create(\/|$)?/i.test(urlBeforeStep)) {
        note(`[SKIP] In Create Agent route during ${sectionName}/${branchName}; breaking by config.`)
        break
      }

      if (/\/agents\/create(\/|$)?/i.test(urlBeforeStep)) {
        const createKey = `${sectionName}::${branchName}::/agents/create`
        const hits = (branchCreateHits.get(createKey) || 0) + 1
        branchCreateHits.set(createKey, hits)
        if (hits >= 4) {
          note(`[LOOP-BREAK] Repeated /agents/create hits (${hits}) in ${sectionName}/${branchName}.`)
          break
        }
      }

      await capturePageProfile(`${sectionName}-${branchName}-depth-${depth}`)
      await maybePauseAtCommunityAuth()

      if (isPaymentBoundary()) {
        note(`[PAYMENT] Reached payment/billing boundary: ${page.url()}`)
        coverage.paymentBoundaries.push({
          section: sectionName,
          branch: branchName,
          url: page.url(),
        })
        if (await page.locator('button:has-text("Back"), a:has-text("Back")').first().isVisible().catch(() => false)) {
          await page.locator('button:has-text("Back"), a:has-text("Back")').first().click().catch(() => {})
        } else {
          await page.goBack().catch(() => {})
        }
        await wait(1200)
        break
      }

      if (SAFE_MODE) {
        note('SAFE_MODE enabled: capture-only mode, no clicks.')
        break
      }

      const advancedForm = await tryAdvanceSetupForm(sectionName, branchName, depth)
      if (advancedForm) {
        note(`[FORM] Advanced setup flow in ${sectionName}/${branchName}`)
        const afterFormUrl = page.url()
        if (afterFormUrl === urlBeforeStep) {
          const formSamePageKey = `${sectionName}::${branchName}::form-same-page::${afterFormUrl}`
          const formSameHits = (branchCreateHits.get(formSamePageKey) || 0) + 1
          branchCreateHits.set(formSamePageKey, formSameHits)
          if (formSameHits >= 3) {
            note(`[LOOP-BREAK] Form action stayed on same page ${formSameHits}x, breaking ${sectionName}/${branchName}.`)
            break
          }
        }
        continue
      }

      const actionable = await collectActionables()
      const inStoreContext = /^\/store(\/|$)/i.test(new URL(page.url()).pathname)
      const priorityRegex =
        /(agent|template|community|store|skill|explore|view|open|details|start|continue|next|launch|create|buy|upgrade|plan|checkout|payment)/i
      const candidates = actionable
        .filter((a) => {
          if (!a.text) return false
          if (/logout|sign out|delete|remove|google|oauth|apple|microsoft/i.test(`${a.text} ${a.href}`)) return false
          if (inStoreContext) {
            const utility = /(office|projects|org|activity|inbox|issues|goals|academy)/i
            if (utility.test(a.text) && !/back to store|agent store|store/i.test(a.text)) return false
          }
          return true
        })
        .sort((a, b) => {
          const score = (x) => {
            const s = `${x.text} ${x.href}`.toLowerCase()
            if (/agent store|\/store\//.test(s)) return 0
            if (/view|details|open|explore|launch/.test(s)) return 1
            if (/continue|next|submit|save|proceed|create|buy|upgrade|checkout|payment/.test(s)) return 2
            if (priorityRegex.test(x.text)) return 3
            return 4
          }
          const ap = score(a)
          const bp = score(b)
          return ap - bp
        })

      let progressed = false
      for (const c of candidates.slice(0, 80)) {
        if (!isAllowedTarget(c.text, c.href)) continue
        const key = `${page.url()}::${c.type}::${c.text}::${c.href || ''}`
        if (clickedKeys.has(key)) continue

        clickedKeys.add(key)
        const before = page.url()
        const beforeDom = await page
          .locator('body')
          .innerText()
          .then((t) => t.slice(0, 800))
          .catch(() => '')

        if (c.type === 'link') {
          const loc = page.locator('a[href]').nth(c.idx)
          await loc.click({ timeout: 2000 }).catch(() => {})
        } else {
          const loc = page.locator('button,[role="button"]').nth(c.idx)
          await loc.click({ timeout: 2000 }).catch(() => {})
        }
        await wait(1200)
        const after = page.url()
        const afterDom = await page
          .locator('body')
          .innerText()
          .then((t) => t.slice(0, 800))
          .catch(() => '')

        note(`Clicked ${c.type}: "${c.text}" -> ${after}`)
        if (after !== before || afterDom !== beforeDom) {
          progressed = true
          break
        }
      }

      if (!progressed) {
        note(`No further actionable items in ${sectionName}.`)
        break
      }
    }
  }

  await capturePageProfile('initial')
  let sidebar = await collectSidebarHrefs()
  if (STORE_ONLY_MODE) {
    const storeOnly = sidebar.filter((s) => /agent store|\/store(\/|$)/i.test(`${s.text} ${s.href}`))
    if (storeOnly.length > 0) sidebar = storeOnly
    note(`Store-only filtered sidebar targets: ${sidebar.length}`)
  }
  coverage.sidebar = sidebar
  note(`Sidebar targets found: ${sidebar.length}`)

  for (const item of sidebar) {
    if (STORE_ONLY_MODE && !/agent store|\/store(\/|$)/i.test(`${item.text} ${item.href}`)) {
      note(`[SKIP] Store-only mode ignoring sidebar "${item.text}" -> ${item.href}`)
      continue
    }
    if (!isAllowedTarget(item.text, item.href)) {
      note(`[SKIP] Out-of-scope sidebar item "${item.text}" -> ${item.href}`)
      continue
    }
    note(`\n[SIDEBAR] Visiting "${item.text}" -> ${item.href}`)
    await page.goto(item.href, { waitUntil: 'domcontentloaded' }).catch(() => {})
    await wait(1500)
    coverage.sectionsVisited.push({ name: item.text, href: item.href })
    await capturePageProfile(`section-${item.text}`)
    await maybePauseAtCommunityAuth()

    const sectionUrl = page.url()
    const sectionPath = (() => {
      try {
        return new URL(sectionUrl).pathname
      } catch {
        return ''
      }
    })()
    const agentLinks = /^\/store(\/|$)/i.test(sectionPath) ? await collectStoreAgentLinks() : await collectAgentLinks()
    const filteredLinks = /^\/store(\/|$)/i.test(sectionPath)
      ? agentLinks.filter((x) => isStoreAgentUrl(x.href))
      : agentLinks
    coverage.agentTargetsBySection[item.text] = filteredLinks
    note(`[SECTION] ${item.text} agent targets: ${filteredLinks.length}`)

    for (let i = 0; i < filteredLinks.length; i++) {
      const target = filteredLinks[i]
      if (!isAllowedTarget(target.text, target.href)) {
        note(`[SKIP] Out-of-scope target "${target.text}" -> ${target.href}`)
        continue
      }
      note(`[AGENT] ${item.text} #${i + 1}/${filteredLinks.length}: "${target.text}" -> ${target.href}`)
      await page.goto(target.href, { waitUntil: 'domcontentloaded' }).catch(() => {})
      await wait(1200)
      await maybePauseAtCommunityAuth()
      await deepDiveCurrentPage(item.text, `agent-${i + 1}`)
      await page.goto(sectionUrl, { waitUntil: 'domcontentloaded' }).catch(() => {})
      await wait(900)
    }

    await deepDiveCurrentPage(item.text, 'section-fallback')
  }

  await deepDiveCurrentPage('final-pass', 'root')

  fs.writeFileSync(findingsPath, findings.join('\n'), 'utf8')
  fs.writeFileSync(pagesJsonPath, JSON.stringify(pageSnapshots, null, 2), 'utf8')
  fs.writeFileSync(coveragePath, JSON.stringify(coverage, null, 2), 'utf8')
  fs.writeFileSync(authGatesPath, JSON.stringify(authGates, null, 2), 'utf8')
  note(`Done. Findings: ${findingsPath}`)
  note(`Page profiles: ${pagesJsonPath}`)
  note(`Coverage: ${coveragePath}`)
  note(`Auth gates: ${authGatesPath}`)
  note(`Screenshots dir: ${outDir}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

