/**
 * Social Media Manager - Direct Execution Test
 * Run with: npx ts-node test-social-media-manager.ts
 */

import { executeSocialMediaManager } from '@/lib/agents/execution-engines/social-media-manager-executor'
import type { SocialMediaManagerContext } from '@/lib/agents/execution-engines/social-media-manager-executor'

const mockContext: SocialMediaManagerContext = {
  agentId: 'test-agent-123',
  userId: 'test-user-456',
  channel: 'whatsapp',
  metadata: { timestamp: Date.now() },
}

const tests = [
  { name: '✍️  Create Instagram Reel', input: 'Create an Instagram Reel about productivity tips' },
  { name: '📊 Check Trends', input: 'What tech trends are hot right now?' },
  { name: '📤 Publish Now', input: 'Publish my posts now' },
  { name: '📈 Analytics', input: 'How did my posts perform?' },
  { name: '💬 Engagement', input: 'Auto-reply to new comments' },
  { name: '✔️  Approval', input: 'Review this before posting' },
  { name: '🆘 Help Intent', input: 'hello there' },
  { name: '🎯 Multi-Platform', input: 'Create posts for Instagram, Twitter, and TikTok about web3' },
  { name: '⏰ Scheduling', input: 'Schedule this post for Thursday' },
  { name: '👀 Special Chars', input: 'Create a post with emojis 🚀 and @mentions' },
]

async function runTests() {
  console.log('\n🧪 SOCIAL MEDIA MANAGER - TEST EXECUTION\n')
  console.log('=' .repeat(80))

  let passed = 0
  let failed = 0

  for (const test of tests) {
    try {
      console.log(`\n[TEST] ${test.name}`)
      console.log(`Input: "${test.input}"`)

      const result = await executeSocialMediaManager(test.input, mockContext)

      console.log(`Status: ${result.success ? '✅ PASS' : '❌ FAIL'}`)
      console.log(`Message: ${result.message}`)

      if (result.data) {
        console.log(`Data: ${JSON.stringify(result.data, null, 2)}`)
      }

      if (result.success) {
        passed++
      } else {
        failed++
      }
    } catch (error) {
      console.log(`❌ ERROR: ${error instanceof Error ? error.message : String(error)}`)
      failed++
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log(`\n📊 TEST RESULTS`)
  console.log(`   ✅ Passed: ${passed}`)
  console.log(`   ❌ Failed: ${failed}`)
  console.log(`   📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%\n`)

  process.exit(failed > 0 ? 1 : 0)
}

runTests()
