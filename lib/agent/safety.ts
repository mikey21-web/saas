/**
 * Agent Safety System — 3-layer protection
 * 1. Rate limiter: 50 actions/hour, 200/day per agent
 * 2. Cost limiter: ₹100 per run, ₹500 per day per agent
 * 3. Time window: active hours enforcement (default 9am-9pm IST)
 * 4. Iteration guard: max 10 LLM loops per execution
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SafetyConfig {
  maxActionsPerHour: number
  maxActionsPerDay: number
  maxCostPerRunINR: number
  maxCostPerDayINR: number
  maxIterations: number
  activeHoursStart: number  // 0-23 IST
  activeHoursEnd: number    // 0-23 IST
  emergencyKillSwitch: boolean
}

export interface SafetyCheckResult {
  allowed: boolean
  reason?: string
  level: 'ok' | 'warn' | 'block'
}

export interface SafetyState {
  agentId: string
  userId: string
  iterationCount: number
  runCostINR: number
  actionsThisHour: number
  actionsToday: number
  dailyCostINR: number
}

export type SafetyViolation =
  | 'RATE_LIMIT_HOUR'
  | 'RATE_LIMIT_DAY'
  | 'COST_LIMIT_RUN'
  | 'COST_LIMIT_DAY'
  | 'MAX_ITERATIONS'
  | 'OUTSIDE_ACTIVE_HOURS'
  | 'EMERGENCY_KILL_SWITCH'

export class SafetyError extends Error {
  public violation: SafetyViolation

  constructor(violation: SafetyViolation, message: string) {
    super(message)
    this.name = 'SafetyError'
    this.violation = violation
  }
}

// ─── Default Configuration ───────────────────────────────────────────────────

export const DEFAULT_SAFETY_CONFIG: SafetyConfig = {
  maxActionsPerHour: 50,
  maxActionsPerDay: 200,
  maxCostPerRunINR: 100,
  maxCostPerDayINR: 500,
  maxIterations: 10,
  activeHoursStart: 9,   // 9 AM IST
  activeHoursEnd: 21,    // 9 PM IST
  emergencyKillSwitch: false,
}

// ─── In-memory rate tracking (production: use Redis) ─────────────────────────

interface RateEntry {
  count: number
  resetAt: number
}

const hourlyRates = new Map<string, RateEntry>()
const dailyRates = new Map<string, RateEntry>()
const dailyCosts = new Map<string, number>()
const killSwitchUsers = new Set<string>()

function getHourlyRate(agentId: string): RateEntry {
  const existing = hourlyRates.get(agentId)
  const now = Date.now()

  if (!existing || now >= existing.resetAt) {
    const entry: RateEntry = { count: 0, resetAt: now + 3_600_000 }
    hourlyRates.set(agentId, entry)
    return entry
  }

  return existing
}

function getDailyRate(agentId: string): RateEntry {
  const existing = dailyRates.get(agentId)
  const now = Date.now()

  if (!existing || now >= existing.resetAt) {
    const entry: RateEntry = { count: 0, resetAt: now + 86_400_000 }
    dailyRates.set(agentId, entry)
    return entry
  }

  return existing
}

function getDailyCost(agentId: string): number {
  return dailyCosts.get(agentId) ?? 0
}

// ─── Safety Check Functions ──────────────────────────────────────────────────

/**
 * Check if the current iteration count exceeds the maximum.
 */
export function checkIterationLimit(
  iterationCount: number,
  config: SafetyConfig = DEFAULT_SAFETY_CONFIG
): SafetyCheckResult {
  if (iterationCount >= config.maxIterations) {
    return {
      allowed: false,
      reason: `Max iterations reached (${iterationCount}/${config.maxIterations}). Stopping to prevent infinite loops.`,
      level: 'block',
    }
  }

  if (iterationCount >= config.maxIterations - 2) {
    return {
      allowed: true,
      reason: `Approaching iteration limit (${iterationCount}/${config.maxIterations})`,
      level: 'warn',
    }
  }

  return { allowed: true, level: 'ok' }
}

/**
 * Check if the agent is within its hourly and daily rate limits.
 */
export function checkRateLimit(
  agentId: string,
  config: SafetyConfig = DEFAULT_SAFETY_CONFIG
): SafetyCheckResult {
  const hourly = getHourlyRate(agentId)

  if (hourly.count >= config.maxActionsPerHour) {
    return {
      allowed: false,
      reason: `Hourly rate limit exceeded (${hourly.count}/${config.maxActionsPerHour} actions). Resets at ${new Date(hourly.resetAt).toISOString()}.`,
      level: 'block',
    }
  }

  const daily = getDailyRate(agentId)

  if (daily.count >= config.maxActionsPerDay) {
    return {
      allowed: false,
      reason: `Daily rate limit exceeded (${daily.count}/${config.maxActionsPerDay} actions). Resets at ${new Date(daily.resetAt).toISOString()}.`,
      level: 'block',
    }
  }

  return { allowed: true, level: 'ok' }
}

/**
 * Check if the cost for the current run or today exceeds limits.
 */
export function checkCostLimit(
  agentId: string,
  runCostINR: number,
  config: SafetyConfig = DEFAULT_SAFETY_CONFIG
): SafetyCheckResult {
  if (runCostINR >= config.maxCostPerRunINR) {
    return {
      allowed: false,
      reason: `Run cost limit exceeded: ₹${runCostINR.toFixed(2)} / ₹${config.maxCostPerRunINR} max per run.`,
      level: 'block',
    }
  }

  const todayCost = getDailyCost(agentId) + runCostINR

  if (todayCost >= config.maxCostPerDayINR) {
    return {
      allowed: false,
      reason: `Daily cost limit exceeded: ₹${todayCost.toFixed(2)} / ₹${config.maxCostPerDayINR} max per day.`,
      level: 'block',
    }
  }

  if (runCostINR >= config.maxCostPerRunINR * 0.8) {
    return {
      allowed: true,
      reason: `Approaching run cost limit: ₹${runCostINR.toFixed(2)} / ₹${config.maxCostPerRunINR}`,
      level: 'warn',
    }
  }

  return { allowed: true, level: 'ok' }
}

/**
 * Check if the current time is within the agent's active hours (IST).
 */
export function checkTimeWindow(
  config: SafetyConfig = DEFAULT_SAFETY_CONFIG
): SafetyCheckResult {
  // Get current hour in IST (UTC+5:30)
  const now = new Date()
  const istOffset = 5.5 * 60 * 60 * 1000
  const istTime = new Date(now.getTime() + istOffset + now.getTimezoneOffset() * 60 * 1000)
  const currentHour = istTime.getHours()

  if (currentHour < config.activeHoursStart || currentHour >= config.activeHoursEnd) {
    return {
      allowed: false,
      reason: `Outside active hours. Current IST hour: ${currentHour}. Active: ${config.activeHoursStart}:00 - ${config.activeHoursEnd}:00 IST.`,
      level: 'block',
    }
  }

  return { allowed: true, level: 'ok' }
}

/**
 * Check if the emergency kill switch is active for a user.
 */
export function checkKillSwitch(userId: string): SafetyCheckResult {
  if (killSwitchUsers.has(userId)) {
    return {
      allowed: false,
      reason: `Emergency kill switch activated for user ${userId}. All agents paused.`,
      level: 'block',
    }
  }

  return { allowed: true, level: 'ok' }
}

// ─── Composite Safety Check ─────────────────────────────────────────────────

/**
 * Run ALL safety checks for an agent iteration.
 * Returns the first blocking violation, or OK if all pass.
 */
export function runSafetyChecks(state: SafetyState, config: SafetyConfig = DEFAULT_SAFETY_CONFIG): SafetyCheckResult {
  // 1. Kill switch (highest priority)
  const killCheck = checkKillSwitch(state.userId)
  if (!killCheck.allowed) return killCheck

  // 2. Time window
  const timeCheck = checkTimeWindow(config)
  if (!timeCheck.allowed) return timeCheck

  // 3. Iteration limit
  const iterCheck = checkIterationLimit(state.iterationCount, config)
  if (!iterCheck.allowed) return iterCheck

  // 4. Rate limit
  const rateCheck = checkRateLimit(state.agentId, config)
  if (!rateCheck.allowed) return rateCheck

  // 5. Cost limit
  const costCheck = checkCostLimit(state.agentId, state.runCostINR, config)
  if (!costCheck.allowed) return costCheck

  // Return any warnings from non-blocking checks
  const warnings = [iterCheck, costCheck].filter((c) => c.level === 'warn')
  if (warnings.length > 0) {
    return {
      allowed: true,
      reason: warnings.map((w) => w.reason).join('; '),
      level: 'warn',
    }
  }

  return { allowed: true, level: 'ok' }
}

// ─── State Mutation Functions ────────────────────────────────────────────────

/**
 * Record an action for rate limiting purposes.
 */
export function recordAction(agentId: string): void {
  const hourly = getHourlyRate(agentId)
  hourly.count++

  const daily = getDailyRate(agentId)
  daily.count++
}

/**
 * Record cost spent during a run.
 */
export function recordCost(agentId: string, costINR: number): void {
  const current = dailyCosts.get(agentId) ?? 0
  dailyCosts.set(agentId, current + costINR)
}

/**
 * Activate emergency kill switch for a user — pauses all their agents.
 */
export function activateKillSwitch(userId: string): void {
  killSwitchUsers.add(userId)
}

/**
 * Deactivate emergency kill switch for a user.
 */
export function deactivateKillSwitch(userId: string): void {
  killSwitchUsers.delete(userId)
}

/**
 * Reset all rate tracking for an agent (for testing or manual reset).
 */
export function resetAgentLimits(agentId: string): void {
  hourlyRates.delete(agentId)
  dailyRates.delete(agentId)
  dailyCosts.delete(agentId)
}
