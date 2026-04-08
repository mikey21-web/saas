import { AiCmoState } from '../types'

/**
 * Scraper Agent
 * Fetches content from homepage + key subpages (about, services, blog)
 * Uses native fetch — no external scraping library needed
 */
export async function scraperAgent(state: AiCmoState): Promise<Partial<AiCmoState>> {
  try {
    const baseUrl = state.websiteUrl.replace(/\/$/, '')
    const pagesToScrape = [
      baseUrl,
      `${baseUrl}/about`,
      `${baseUrl}/about-us`,
      `${baseUrl}/services`,
      `${baseUrl}/products`,
      `${baseUrl}/blog`,
      `${baseUrl}/why-us`,
    ]

    const scrapedTexts: string[] = []
    const successfulPages: string[] = []

    for (const pageUrl of pagesToScrape) {
      try {
        const res = await fetch(pageUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; DiyaaBot/1.0; +https://diyaa.ai)',
            Accept: 'text/html',
          },
          signal: AbortSignal.timeout(8000),
        })

        if (!res.ok) continue

        const html = await res.text()

        // Extract readable text from HTML
        const text = html
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<nav[\s\S]*?<\/nav>/gi, '')
          .replace(/<footer[\s\S]*?<\/footer>/gi, '')
          .replace(/<header[\s\S]*?<\/header>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .trim()
          .slice(0, 3000) // 3000 chars per page

        if (text.length > 200) {
          scrapedTexts.push(`\n\n=== PAGE: ${pageUrl} ===\n${text}`)
          successfulPages.push(pageUrl)
        }
      } catch {
        // Skip failed pages silently
      }
    }

    if (scrapedTexts.length === 0) {
      return {
        scrapeError: `Could not scrape any pages from ${state.websiteUrl}. The site may block bots or be down.`,
        scrapedContent: '',
        scrapedPages: [],
      }
    }

    return {
      scrapedContent: scrapedTexts.join('\n').slice(0, 12000), // Cap total at 12k chars for LLM
      scrapedPages: successfulPages,
      scrapeError: null,
    }
  } catch (err) {
    return {
      scrapeError: err instanceof Error ? err.message : 'Scrape failed',
      scrapedContent: '',
      scrapedPages: [],
    }
  }
}
