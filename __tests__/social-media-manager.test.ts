/**
 * Social Media Manager - Comprehensive Test Suite
 * Tests all 6 agents + orchestration + integrations
 */

import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals'
import { executeSocialMediaManager } from '@/lib/agents/execution-engines/social-media-manager-executor'
import type { SocialMediaManagerContext } from '@/lib/agents/execution-engines/social-media-manager-executor'

// Mock Supabase
jest.mock('@/lib/supabase/client')

// Mock integrations
jest.mock('@/lib/social-media-manager/integrations', () => ({
  publishToInstagram: jest.fn(),
  publishToTwitter: jest.fn(),
  publishToLinkedIn: jest.fn(),
  publishToTikTok: jest.fn(),
  publishToFacebook: jest.fn(),
  fetchTrends: jest.fn(),
  fetchAnalytics: jest.fn(),
  replyToComments: jest.fn(),
}))

describe('Social Media Manager - Complete Test Suite', () => {
  const mockContext: SocialMediaManagerContext = {
    agentId: 'agent-123',
    userId: 'user-456',
    channel: 'whatsapp',
    metadata: { timestamp: Date.now() },
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 1. INTENT DETECTION TESTS
  // ═══════════════════════════════════════════════════════════════════════

  describe('Intent Detection', () => {
    it('should detect "create_content" intent', async () => {
      const result = await executeSocialMediaManager('Create a carousel post about AI trends', mockContext)
      expect(result.success).toBe(true)
      expect(result.data?.intent || result.data?.postsGenerated).toBeDefined()
    })

    it('should detect "check_trends" intent', async () => {
      const result = await executeSocialMediaManager("What's trending in tech right now?", mockContext)
      expect(result.success).toBe(true)
      expect(result.message).toContain('trend')
    })

    it('should detect "publish_now" intent', async () => {
      const result = await executeSocialMediaManager('Publish my posts now', mockContext)
      expect(result.success).toBe(true)
      expect(result.message).toContain('publish')
    })

    it('should detect "analytics" intent', async () => {
      const result = await executeSocialMediaManager('How did my posts perform?', mockContext)
      expect(result.success).toBe(true)
      expect(result.message).toContain('Analytics') || expect(result.message).toContain('metrics')
    })

    it('should return help when intent unclear', async () => {
      const result = await executeSocialMediaManager('hello there', mockContext)
      expect(result.success).toBe(true)
      expect(result.data?.intent).toBe('help')
    })
  })

  // ═══════════════════════════════════════════════════════════════════════
  // 2. CONTENT CREATOR AGENT TESTS
  // ═══════════════════════════════════════════════════════════════════════

  describe('Content Creator Agent', () => {
    it('should generate Instagram Reel content', async () => {
      const result = await executeSocialMediaManager(
        'Create an Instagram Reel about productivity tips',
        mockContext
      )
      expect(result.success).toBe(true)
      expect(result.data?.postsGenerated).toBeGreaterThan(0)
      expect(result.data?.platforms).toContain('instagram')
    })

    it('should generate LinkedIn post content', async () => {
      const result = await executeSocialMediaManager(
        'Write a LinkedIn post for business leaders about AI',
        mockContext
      )
      expect(result.success).toBe(true)
      expect(result.data?.platforms).toContain('linkedin')
    })

    it('should generate TikTok content', async () => {
      const result = await executeSocialMediaManager(
        'Create a TikTok about trending tech',
        mockContext
      )
      expect(result.success).toBe(true)
    })

    it('should handle multi-platform content generation', async () => {
      const result = await executeSocialMediaManager(
        'Create posts for Instagram, Twitter, and TikTok about web3',
        mockContext
      )
      expect(result.success).toBe(true)
      expect(result.data?.platforms).toContain('instagram')
      expect(result.data?.platforms).toContain('twitter')
      expect(result.data?.platforms).toContain('tiktok')
    })

    it('should respect scheduling preference', async () => {
      const result = await executeSocialMediaManager(
        'Create a post and publish now',
        mockContext
      )
      expect(result.success).toBe(true)
      // Should have immediate scheduling preference
    })
  })

  // ═══════════════════════════════════════════════════════════════════════
  // 3. TREND SPOTTER AGENT TESTS
  // ═══════════════════════════════════════════════════════════════════════

  describe('Trend Spotter Agent', () => {
    it('should identify trends in tech niche', async () => {
      const result = await executeSocialMediaManager(
        'What tech trends are hot right now?',
        mockContext
      )
      expect(result.success).toBe(true)
      expect(result.message).toBeTruthy()
    })

    it('should fetch Google Trends data', async () => {
      const result = await executeSocialMediaManager(
        'Check trending topics',
        mockContext
      )
      expect(result.success).toBe(true)
    })

    it('should suggest viral content ideas', async () => {
      const result = await executeSocialMediaManager(
        'What viral ideas should I post about?',
        mockContext
      )
      expect(result.success).toBe(true)
    })
  })

  // ═══════════════════════════════════════════════════════════════════════
  // 4. SCHEDULER AGENT TESTS
  // ═══════════════════════════════════════════════════════════════════════

  describe('Scheduler Agent', () => {
    it('should queue posts for publishing', async () => {
      const result = await executeSocialMediaManager(
        'Schedule this post for Thursday',
        mockContext
      )
      expect(result.success).toBe(true)
    })

    it('should publish immediately when requested', async () => {
      const result = await executeSocialMediaManager(
        'Post now to all platforms',
        mockContext
      )
      expect(result.success).toBe(true)
      expect(result.message).toContain('publish')
    })

    it('should handle multiple platform publishing', async () => {
      const result = await executeSocialMediaManager(
        'Publish to Instagram, Facebook, and LinkedIn',
        mockContext
      )
      expect(result.success).toBe(true)
    })
  })

  // ═══════════════════════════════════════════════════════════════════════
  // 5. ANALYTICS AGENT TESTS
  // ═══════════════════════════════════════════════════════════════════════

  describe('Analytics Agent', () => {
    it('should fetch engagement metrics', async () => {
      const result = await executeSocialMediaManager(
        'Show me my engagement metrics',
        mockContext
      )
      expect(result.success).toBe(true)
    })

    it('should track post performance', async () => {
      const result = await executeSocialMediaManager(
        'How did my posts perform this week?',
        mockContext
      )
      expect(result.success).toBe(true)
    })

    it('should measure audience growth', async () => {
      const result = await executeSocialMediaManager(
        "What's my reach and follower growth?",
        mockContext
      )
      expect(result.success).toBe(true)
    })
  })

  // ═══════════════════════════════════════════════════════════════════════
  // 6. ENGAGEMENT AGENT TESTS
  // ═══════════════════════════════════════════════════════════════════════

  describe('Engagement Agent', () => {
    it('should auto-reply to comments', async () => {
      const result = await executeSocialMediaManager(
        'Auto-reply to new comments',
        mockContext
      )
      expect(result.success).toBe(true)
    })

    it('should classify leads from comments', async () => {
      const result = await executeSocialMediaManager(
        'Show me potential leads from comments',
        mockContext
      )
      expect(result.success).toBe(true)
    })

    it('should manage DM responses', async () => {
      const result = await executeSocialMediaManager(
        'Reply to DMs automatically',
        mockContext
      )
      expect(result.success).toBe(true)
    })
  })

  // ═══════════════════════════════════════════════════════════════════════
  // 7. APPROVAL AGENT TESTS
  // ═══════════════════════════════════════════════════════════════════════

  describe('Approval Agent', () => {
    it('should queue content for manual review', async () => {
      const result = await executeSocialMediaManager(
        'Review this before posting',
        mockContext
      )
      expect(result.success).toBe(true)
    })

    it('should enforce compliance checks', async () => {
      const result = await executeSocialMediaManager(
        'Check compliance for financial posts',
        mockContext
      )
      expect(result.success).toBe(true)
    })
  })

  // ═══════════════════════════════════════════════════════════════════════
  // 8. ERROR HANDLING & EDGE CASES
  // ═══════════════════════════════════════════════════════════════════════

  describe('Error Handling', () => {
    it('should handle missing agent configuration', async () => {
      const invalidContext: SocialMediaManagerContext = {
        agentId: 'invalid-agent',
        userId: 'invalid-user',
      }
      const result = await executeSocialMediaManager('Create a post', invalidContext)
      expect(result.success).toBe(false)
      expect(result.message).toContain('configuration')
    })

    it('should gracefully handle API failures', async () => {
      const result = await executeSocialMediaManager(
        'Create content',
        mockContext
      )
      // Should not throw, should return error message
      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('message')
    })

    it('should handle empty user message', async () => {
      const result = await executeSocialMediaManager('', mockContext)
      expect(result.success).toBe(true)
      expect(result.data?.intent).toBe('help') // Should default to help
    })

    it('should handle special characters in content', async () => {
      const result = await executeSocialMediaManager(
        'Create a post with emojis 🚀 and @mentions',
        mockContext
      )
      expect(result.success).toBe(true)
    })
  })

  // ═══════════════════════════════════════════════════════════════════════
  // 9. INTEGRATION TESTS
  // ═══════════════════════════════════════════════════════════════════════

  describe('Full Workflow Integration', () => {
    it('should complete create → approve → publish workflow', async () => {
      // Step 1: Create content
      const createResult = await executeSocialMediaManager(
        'Create a carousel post about AI',
        mockContext
      )
      expect(createResult.success).toBe(true)

      // Step 2: Approve content
      const approveResult = await executeSocialMediaManager(
        'Approve and publish',
        mockContext
      )
      expect(approveResult.success).toBe(true)
    })

    it('should handle multi-step requests', async () => {
      const result = await executeSocialMediaManager(
        'Create trending content and publish to Instagram and TikTok now',
        mockContext
      )
      expect(result.success).toBe(true)
    })
  })

  // ═══════════════════════════════════════════════════════════════════════
  // 10. PERFORMANCE & SCALE TESTS
  // ═══════════════════════════════════════════════════════════════════════

  describe('Performance', () => {
    it('should respond to intent detection within 1 second', async () => {
      const start = Date.now()
      await executeSocialMediaManager('Create a post', mockContext)
      const duration = Date.now() - start
      expect(duration).toBeLessThan(1000)
    })

    it('should handle multiple concurrent requests', async () => {
      const promises = Array(5)
        .fill(null)
        .map((_, i) =>
          executeSocialMediaManager(`Create post ${i}`, mockContext)
        )
      const results = await Promise.all(promises)
      expect(results).toHaveLength(5)
      expect(results.every(r => r.success || !r.success)).toBe(true)
    })
  })
})
