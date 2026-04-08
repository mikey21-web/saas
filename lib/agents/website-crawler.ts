/**
 * Website Crawler for Agent Knowledge Base
 *
 * Crawls user websites and extracts business information
 * for agent context and knowledge base.
 */

import { callAI } from '@/lib/ai/router'

export interface CrawlResult {
  success: boolean
  title?: string
  description?: string
  sections?: CrawledSection[]
  contactInfo?: ContactInfo
  faqs?: FAQ[]
  extractedText: string
  error?: string
}

export interface CrawledSection {
  heading: string
  content: string
  url: string
}

export interface ContactInfo {
  email?: string
  phone?: string
  address?: string
  hours?: string
}

export interface FAQ {
  question: string
  answer: string
  source?: string
}

/**
 * Simple website crawler - extracts text content from pages
 */
export async function crawlWebsite(url: string): Promise<CrawlResult> {
  try {
    // Validate URL
    const parsedUrl = new URL(url)
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return { success: false, sections: [], extractedText: '', error: 'Invalid URL protocol' }
    }

    // Fetch the webpage
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'diyaa.ai Knowledge Bot/1.0',
        Accept: 'text/html,application/xhtml+xml',
      },
    })

    clearTimeout(timeout)

    if (!response.ok) {
      return { success: false, sections: [], extractedText: '', error: `HTTP ${response.status}` }
    }

    const html = await response.text()

    // Extract text content using basic parsing
    const extracted = extractTextFromHTML(html)

    // Use AI to parse and structure the content
    const structured = await parseContentWithAI(extracted, url)

    return {
      success: true,
      ...structured,
      extractedText: extracted,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, sections: [], extractedText: '', error: message }
  }
}

/**
 * Extract clean text from HTML
 */
function extractTextFromHTML(html: string): string {
  // Remove scripts and styles
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')

  // Replace common HTML elements with newlines
  text = text
    .replace(/<\/(p|div|h[1-6]|li|tr|br)>/gi, '\n')
    .replace(/<p[^>]*>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")

  // Remove remaining HTML tags
  text = text.replace(/<[^>]+>/g, ' ')

  // Clean up whitespace
  text = text
    .replace(/\n\s*\n/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim()

  // Limit to reasonable size for AI processing
  return text.slice(0, 15000)
}

/**
 * Use AI to parse extracted content into structured data
 */
async function parseContentWithAI(
  htmlText: string,
  url: string
): Promise<{
  title?: string
  description?: string
  sections: CrawledSection[]
  contactInfo?: ContactInfo
  faqs?: FAQ[]
}> {
  const systemPrompt = `You are a website content analyzer. Extract structured information from the given website content.

Analyze and extract:
1. **title**: The business/website name
2. **description**: A brief description of what the business does (2-3 sentences)
3. **sections**: Key sections of the website (products, services, about, etc.)
4. **contactInfo**: Any contact information found (email, phone, address, hours)
5. **faqs**: Any frequently asked questions or Q&A sections found

Return a JSON object with these fields. If a field is not found, use null.
Focus on business-relevant information that would help an AI agent understand the business.`

  const userMessage = `Website URL: ${url}

Website Content:
${htmlText}`

  try {
    const response = await callAI({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.3,
      maxTokens: 2000,
    })

    const content = response.content || ''

    // Try to parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          title: parsed.title || undefined,
          description: parsed.description || undefined,
          sections: Array.isArray(parsed.sections) ? parsed.sections : [],
          contactInfo: parsed.contactInfo || undefined,
          faqs: Array.isArray(parsed.faqs) ? parsed.faqs : [],
        }
      } catch {
        // JSON parse failed, return basic extraction
      }
    }

    // Fallback: return raw content as sections
    return {
      sections: [
        {
          heading: 'Website Content',
          content: htmlText.slice(0, 5000),
          url,
        },
      ],
    }
  } catch (error) {
    console.error('AI parsing failed:', error)
    return {
      sections: [
        {
          heading: 'Website Content',
          content: htmlText.slice(0, 5000),
          url,
        },
      ],
    }
  }
}

/**
 * Crawl multiple pages from a website
 */
export async function crawlMultiplePages(urls: string[]): Promise<CrawlResult[]> {
  const results: CrawlResult[] = []

  // Limit concurrent requests
  const limit = 3
  for (let i = 0; i < urls.length; i += limit) {
    const batch = urls.slice(i, i + limit)
    const batchResults = await Promise.all(batch.map((url) => crawlWebsite(url)))
    results.push(...batchResults)
  }

  return results
}

/**
 * Extract links from a page for crawling
 */
export function extractLinksFromHTML(html: string, baseUrl: string): string[] {
  const links: string[] = []
  const base = new URL(baseUrl)

  const linkRegex = /<a[^>]+href=["']([^"']+)["']/gi
  let match

  while ((match = linkRegex.exec(html)) !== null) {
    try {
      const href = match[1]
      const absoluteUrl = new URL(href, baseUrl).toString()

      // Only include internal links from same domain
      if (absoluteUrl.startsWith(base.origin)) {
        links.push(absoluteUrl)
      }
    } catch {
      // Invalid URL, skip
    }
  }

  // Deduplicate and limit
  return [...new Set(links)].slice(0, 20)
}

/**
 * Quick crawl - just get basic info without deep parsing
 */
export async function quickCrawl(url: string): Promise<{
  title?: string
  description?: string
  success: boolean
  error?: string
}> {
  try {
    const result = await crawlWebsite(url)
    return {
      title: result.title,
      description: result.description,
      success: result.success,
      error: result.error,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
