import { EmailAutomatorState } from '../types'

/**
 * Scheduler Agent: Schedule emails to send at optimal times
 */
export async function schedulerAgent(state: EmailAutomatorState): Promise<Partial<EmailAutomatorState>> {
  try {
    const now = new Date()
    const scheduleTimestamps: string[] = []

    // Calculate send times based on journey type
    const baseHour = 9 // 9 AM IST optimal for open rates

    if (state.emailSequence.length === 0) {
      return { scheduled: false, scheduleTimestamps: [] }
    }

    state.emailSequence.forEach((email, index) => {
      let sendDate = new Date(now)

      switch (state.journeyType) {
        case 'onboarding':
          // Send: Day 0 9am, Day 1 2pm, Day 3 9am
          if (index === 0) sendDate.setHours(baseHour)
          else if (index === 1) sendDate.setDate(now.getDate() + 1) && sendDate.setHours(14)
          else if (index === 2) sendDate.setDate(now.getDate() + 3) && sendDate.setHours(baseHour)
          break

        case 'nurture':
          // Send: Every 2 days, alternating 9am/2pm
          sendDate.setDate(now.getDate() + index * 2)
          sendDate.setHours(index % 2 === 0 ? baseHour : 14)
          break

        case 'winback':
          // Send: Days 1, 3, 7, 14
          const winbackDays = [1, 3, 7, 14]
          if (index < winbackDays.length) {
            sendDate.setDate(now.getDate() + winbackDays[index])
            sendDate.setHours(baseHour)
          }
          break

        case 'upsell':
          // Send: Immediate, 2 days, 5 days
          const upsellDays = [0, 2, 5]
          if (index < upsellDays.length) {
            sendDate.setDate(now.getDate() + upsellDays[index])
            sendDate.setHours(baseHour)
          }
          break

        case 'educational':
          // Send: Weekly for 7 weeks
          sendDate.setDate(now.getDate() + index * 7)
          sendDate.setHours(baseHour)
          break
      }

      // Ensure minimum 1 hour in future
      if (sendDate.getTime() < now.getTime() + 3600000) {
        sendDate = new Date(now.getTime() + 3600000)
      }

      scheduleTimestamps.push(sendDate.toISOString())
    })

    return {
      scheduled: true,
      scheduleTimestamps,
      scheduleStatus: `${scheduleTimestamps.length} emails scheduled`,
      sendStartDate: scheduleTimestamps[0] || new Date().toISOString(),
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return { error: `Scheduling failed: ${msg}` }
  }
}
