#!/usr/bin/env node
/**
 * diyaa.ai — Vulnerability Scanner
 * File: scripts/security-scan.js
 *
 * Runs a full security sweep:
 *   1. npm audit       — dependency CVEs
 *   2. OWASP patterns  — code-level checks
 *   3. Secret scan     — hardcoded credentials
 *   4. Header audit    — HTTP security headers
 *   5. Supabase RLS    — row-level security check
 *
 * Install deps:
 *   npm install --save-dev snyk better-npm-audit chalk
 *
 * Run:
 *   node scripts/security-scan.js
 *   node scripts/security-scan.js --fix     (auto-fix where possible)
 *   node scripts/security-scan.js --strict  (fail on warnings too)
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// ─── Config ──────────────────────────────────────────────────────────────────
const COLORS = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  reset: '\x1b[0m',
}

const STRICT = process.argv.includes('--strict')
const AUTO_FIX = process.argv.includes('--fix')

const results = {
  passed: [],
  warnings: [],
  failures: [],
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function log(color, icon, label, msg = '') {
  console.log(
    `${COLORS[color]}${icon} ${COLORS.bold}${label}${COLORS.reset}${msg ? ` — ${msg}` : ''}`
  )
}

function pass(label, msg) {
  results.passed.push(label)
  log('green', '✅', label, msg)
}
function warn(label, msg) {
  results.warnings.push(label)
  log('yellow', '⚠️ ', label, msg)
}
function fail(label, msg) {
  results.failures.push(label)
  log('red', '🚨', label, msg)
}
function section(title) {
  console.log(
    `\n${COLORS.cyan}${COLORS.bold}── ${title} ${'─'.repeat(50 - title.length)}${COLORS.reset}`
  )
}

function run(cmd) {
  try {
    return { stdout: execSync(cmd, { encoding: 'utf8', stdio: 'pipe' }), code: 0 }
  } catch (e) {
    return { stdout: e.stdout || '', stderr: e.stderr || '', code: e.status || 1 }
  }
}

// ─── 1. NPM AUDIT ─────────────────────────────────────────────────────────────
function runNpmAudit() {
  section('1. NPM DEPENDENCY AUDIT (CVE Check)')

  const result = run('npm audit --json')
  let audit

  try {
    audit = JSON.parse(result.stdout)
  } catch {
    // If npm audit fails to even run or return JSON (can happen on windows powershell sometimes)
    warn('npm audit', 'Could not parse audit output. Check npm version.')
    return
  }

  const vulns = audit.metadata?.vulnerabilities || {}
  const critical = vulns.critical || 0
  const high = vulns.high || 0
  const moderate = vulns.moderate || 0
  const low = vulns.low || 0
  const total = audit.metadata?.totalDependencies || 0

  console.log(`   Scanned ${total} dependencies`)
  console.log(`   Critical: ${critical} | High: ${high} | Moderate: ${moderate} | Low: ${low}`)

  if (critical > 0)
    fail('npm-audit-critical', `${critical} critical vulnerabilities — run: npm audit fix`)
  else if (high > 0) fail('npm-audit-high', `${high} high vulnerabilities — run: npm audit fix`)
  else if (moderate > 0) warn('npm-audit-moderate', `${moderate} moderate vulnerabilities`)
  else pass('npm-audit', 'Zero high/critical CVEs in dependencies')

  if (AUTO_FIX && (critical > 0 || high > 0)) {
    console.log('   🔧 Auto-fixing...')
    run('npm audit fix')
    pass('npm-audit-fix', 'Auto-fix applied — re-run scan to verify')
  }

  // Print vulnerable packages
  if (audit.vulnerabilities) {
    const serious = Object.entries(audit.vulnerabilities).filter(([, v]) =>
      ['critical', 'high'].includes(v.severity)
    )
    if (serious.length > 0) {
      console.log('\n   Affected packages:')
      serious.forEach(([pkg, v]) => {
        console.log(
          `   ${COLORS.red}  • ${pkg} (${v.severity}) — ${v.via?.[0]?.title || 'unknown CVE'}${COLORS.reset}`
        )
      })
    }
  }
}

// ─── 2. OWASP TOP 10 CODE PATTERNS ───────────────────────────────────────────
function runOwaspPatternScan() {
  section('2. OWASP TOP 10 PATTERN SCAN (Code Level)')

  const scanDir = path.join(process.cwd(), 'app')
  if (!fs.existsSync(scanDir)) {
    warn('owasp-scan', 'app/ directory not found — skipping')
    return
  }

  const patterns = [
    // A01 — Broken Access Control
    {
      id: 'A01',
      name: 'Unprotected API routes',
      regex:
        /export async function (GET|POST|PUT|DELETE)[\s\S]{0,200}(?!auth|session|getServerSession|supabase\.auth)/,
      file: /route\.ts$/,
    },
    // A02 — Cryptographic Failures
    {
      id: 'A02',
      name: 'MD5 usage (weak hash)',
      regex: /require\(['"]crypto['"]\)[\s\S]*\.createHash\(['"]md5['"]\)/,
      file: /\.(ts|js)$/,
    },
    {
      id: 'A02',
      name: 'HTTP (not HTTPS) fetch',
      regex: /fetch\(['"]http:\/\/(?!localhost)/,
      file: /\.(ts|tsx|js)$/,
    },
    // A03 — Injection
    { id: 'A03', name: 'Raw SQL string concat', regex: /`SELECT[\s\S]*?\${/, file: /\.(ts|js)$/ },
    { id: 'A03', name: 'eval() usage', regex: /\beval\s*\(/, file: /\.(ts|tsx|js)$/ },
    { id: 'A03', name: 'child_process exec', regex: /exec\s*\(/, file: /\.(ts|js)$/ },
    // A05 — Security Misconfiguration
    {
      id: 'A05',
      name: 'CORS wildcard (*)',
      regex: /Access-Control-Allow-Origin['":\s]*\*/,
      file: /\.(ts|js)$/,
    },
    {
      id: 'A05',
      name: 'Disabled TLS verify',
      regex: /rejectUnauthorized\s*:\s*false/,
      file: /\.(ts|js)$/,
    },
    // A07 — Auth Failures
    {
      id: 'A07',
      name: 'JWT decoded without verify',
      regex: /jwt\.decode\((?!.*verify)/,
      file: /\.(ts|js)$/,
    },
    // A09 — Logging Sensitive Data
    {
      id: 'A09',
      name: 'Logging passwords',
      regex: /console\.(log|info|debug)\([\s\S]*?(password|token|secret|key)/i,
      file: /\.(ts|tsx|js)$/,
    },
  ]

  function walkDir(dir, callback) {
    if (!fs.existsSync(dir)) return
    fs.readdirSync(dir).forEach((file) => {
      const fullPath = path.join(dir, file)
      if (fs.statSync(fullPath).isDirectory()) {
        if (!['node_modules', '.next', 'dist'].includes(file)) walkDir(fullPath, callback)
      } else {
        callback(fullPath)
      }
    })
  }

  const findings = []

  walkDir(scanDir, (filePath) => {
    const content = fs.readFileSync(filePath, 'utf8')
    patterns.forEach((pattern) => {
      if (pattern.file.test(filePath) && pattern.regex.test(content)) {
        findings.push({ ...pattern, file: filePath.replace(process.cwd(), '') })
      }
    })
  })

  if (findings.length === 0) {
    pass('owasp-patterns', 'No OWASP Top 10 patterns detected')
  } else {
    findings.forEach((f) => {
      fail(`owasp-${f.id}`, `${f.name} in ${f.file}`)
    })
  }
}

// ─── 3. SECRET / CREDENTIAL SCAN ─────────────────────────────────────────────
function runSecretScan() {
  section('3. SECRET & CREDENTIAL SCAN')

  const secretPatterns = [
    { name: 'Anthropic API key', regex: /sk-ant-[a-zA-Z0-9]{32,}/ },
    { name: 'OpenAI API key', regex: /sk-[a-zA-Z0-9]{32,}/ },
    { name: 'Google API key', regex: /AIza[0-9A-Za-z-_]{35}/ },
    { name: 'Stripe secret key', regex: /sk_live_[a-zA-Z0-9]{24,}/ },
    {
      name: 'Supabase service key',
      regex: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9-_]{50,}/,
    },
    { name: 'Private key block', regex: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/ },
    { name: 'AWS access key', regex: /AKIA[0-9A-Z]{16}/ },
    { name: 'Groq API key', regex: /gsk_[a-zA-Z0-9]{32,}/ },
    { name: 'Resend API key', regex: /re_[a-zA-Z0-9]{32,}/ },
  ]

  // Walk all code files
  const findings = []
  function walkDir(dir, callback) {
    if (!fs.existsSync(dir)) return
    fs.readdirSync(dir).forEach((file) => {
      const fullPath = path.join(dir, file)
      if (fs.statSync(fullPath).isDirectory()) {
        if (!['node_modules', '.next', 'dist', '.git'].includes(file)) walkDir(fullPath, callback)
      } else {
        if (/\.(ts|tsx|js|mjs|cjs)$/.test(file)) callback(fullPath)
      }
    })
  }

  walkDir(process.cwd(), (filePath) => {
    if (filePath.includes('.env')) return // Skip env files
    const content = fs.readFileSync(filePath, 'utf8')
    secretPatterns.forEach((pattern) => {
      if (pattern.regex.test(content)) {
        findings.push({ name: pattern.name, file: filePath.replace(process.cwd(), '') })
      }
    })
  })

  if (findings.length === 0) {
    pass('secret-scan', 'No hardcoded secrets detected in tracked files')
  } else {
    findings.forEach((f) => fail('secret-scan', `${f.name} found in ${f.file}`))
    console.log(
      `\n   ${COLORS.yellow}Fix: move to .env.local and reference via process.env${COLORS.reset}`
    )
  }

  // Check .env files are gitignored
  const gitignorePath = path.join(process.cwd(), '.gitignore')
  const gitignore = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf8') : ''
  if (gitignore.includes('.env.local') && gitignore.includes('.env.production')) {
    pass('env-gitignored', '.env.local and .env.production are in .gitignore')
  } else {
    fail('env-gitignored', '.env files are NOT in .gitignore — risk of secret exposure')
  }
}

// ─── 4. HTTP SECURITY HEADERS CHECK ──────────────────────────────────────────
async function runHeaderAudit() {
  section('4. HTTP SECURITY HEADERS AUDIT')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const requiredHeaders = [
    'x-content-type-options',
    'x-frame-options',
    'x-xss-protection',
    'referrer-policy',
    'permissions-policy',
  ]

  try {
    // Note: this uses native fetch in Node 18+
    const res = await fetch(`${appUrl}/api/health`, { method: 'HEAD' }).catch(() => null)
    if (!res) {
      warn('headers-audit', `Could not reach ${appUrl} — start dev server to check headers`)
      return
    }

    requiredHeaders.forEach((header) => {
      if (res.headers.get(header)) {
        pass(`header-${header}`, res.headers.get(header))
      } else {
        fail(`header-${header}`, `Missing ${header} — add to vercel.json headers config`)
      }
    })

    // Check HSTS (production only)
    if (!appUrl.includes('localhost')) {
      const hsts = res.headers.get('strict-transport-security')
      hsts
        ? pass('header-hsts', hsts)
        : warn('header-hsts', 'HSTS not set — add to production headers')
    }
  } catch (err) {
    warn('headers-audit', `Header check skipped: ${err.message}`)
  }
}

// ─── 5. SUPABASE RLS CHECK ────────────────────────────────────────────────────
function runRlsCheck() {
  section('5. SUPABASE ROW-LEVEL SECURITY CHECK')

  // Check if RLS is enabled in migration files
  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations')
  if (!fs.existsSync(migrationsDir)) {
    warn('rls-check', 'No supabase/migrations/ found — verify RLS manually in Supabase dashboard')
    return
  }

  const tables = ['agents', 'agents_config', 'agent_executions', 'agent_knowledge', 'conversations']
  const allMigrations = fs
    .readdirSync(migrationsDir)
    .map((f) => fs.readFileSync(path.join(migrationsDir, f), 'utf8'))
    .join('\n')

  tables.forEach((table) => {
    const rlsEnabled = new RegExp(`ALTER TABLE.*${table}.*ENABLE ROW LEVEL SECURITY`, 'i').test(
      allMigrations
    )
    const hasPolicy = new RegExp(`CREATE POLICY.*${table}`, 'i').test(allMigrations)

    if (rlsEnabled && hasPolicy) {
      pass(`rls-${table}`, `RLS enabled + policy defined`)
    } else if (rlsEnabled && !hasPolicy) {
      warn(`rls-${table}`, `RLS enabled but no policy found — table may be fully blocked`)
    } else {
      fail(`rls-${table}`, `RLS NOT enabled — users can read/write each other's data`)
    }
  })
}

// ─── SUMMARY ──────────────────────────────────────────────────────────────────
function printSummary() {
  section('SCAN SUMMARY')

  console.log(`\n  ${COLORS.green}✅ Passed:   ${results.passed.length}${COLORS.reset}`)
  console.log(`  ${COLORS.yellow}⚠️  Warnings: ${results.warnings.length}${COLORS.reset}`)
  console.log(`  ${COLORS.red}🚨 Failures: ${results.failures.length}${COLORS.reset}\n`)

  if (results.failures.length > 0) {
    console.log(
      `${COLORS.red}${COLORS.bold}❌ SCAN FAILED — Fix all 🚨 issues before deploying to production${COLORS.reset}\n`
    )
    process.exit(1)
  } else if (STRICT && results.warnings.length > 0) {
    console.log(
      `${COLORS.yellow}${COLORS.bold}⚠️  STRICT MODE: Warnings must also be resolved${COLORS.reset}\n`
    )
    process.exit(1)
  } else {
    console.log(
      `${COLORS.green}${COLORS.bold}✅ ALL CHECKS PASSED — Safe to deploy${COLORS.reset}\n`
    )
    process.exit(0)
  }
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(
    `\n${COLORS.bold}${COLORS.cyan}╔══════════════════════════════════════════════════════╗`
  )
  console.log(`║         diyaa.ai Security Vulnerability Scanner       ║`)
  console.log(
    `║                  ${new Date().toISOString().slice(0, 10)}                         ║`
  )
  console.log(`╚══════════════════════════════════════════════════════╝${COLORS.reset}\n`)

  runNpmAudit()
  runOwaspPatternScan()
  runSecretScan()
  await runHeaderAudit()
  runRlsCheck()
  printSummary()
}

main().catch((err) => {
  console.error('Scanner crashed:', err)
  process.exit(1)
})
