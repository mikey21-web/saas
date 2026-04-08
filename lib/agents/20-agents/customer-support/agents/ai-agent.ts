import type { CustomerSupportState, AIResponse } from '../types'
import { claudeClient, listLinks, getPageText, loadConversationHistory, saveMessage } from '../integrations'

const MAX_LINK_ROUNDS = 2
const MAX_PAGE_CALLS = 8

/**
 * AI Agent
 * Maps to n8n "AI Agent" (LangChain) node with list_links + get_page tools
 * Crawls company website to answer customer questions
 */
export async function aiAgent(state: CustomerSupportState): Promise<Partial<CustomerSupportState>> {
  const { userId, userMessage, companyName, websiteUrl } = state

  // Load conversation history (maps to n8n Postgres Memory node)
  const history = await loadConversationHistory(userId)

  // Save user message to history
  await saveMessage(userId, 'user', userMessage)

  // Agentic loop — crawl website to find answer
  const intermediateSteps: Array<{ tool: string; input: string; output: string }> = []
  let linkRounds = 0
  let pageCalls = 0
  let collectedContext = ''

  // Start with root URL links (step 1 in n8n agent strategy)
  if (websiteUrl && linkRounds < MAX_LINK_ROUNDS) {
    const links = await listLinks(websiteUrl)
    linkRounds++
    intermediateSteps.push({ tool: 'list_links', input: websiteUrl, output: JSON.stringify(links.slice(0, 10)) })

    // Pick up to 5 most relevant links based on user message keywords
    const keywords = userMessage.toLowerCase().split(' ')
    const relevantLinks = links
      .filter(link => keywords.some(kw => link.toLowerCase().includes(kw)))
      .slice(0, 5)

    // Fetch page content for relevant links
    for (const link of relevantLinks) {
      if (pageCalls >= MAX_PAGE_CALLS) break
      const text = await getPageText(link)
      pageCalls++
      intermediateSteps.push({ tool: 'get_page', input: link, output: text.substring(0, 200) })
      collectedContext += `\n\n--- Page: ${link} ---\n${text}`
    }
  }

  // System prompt (maps to n8n AI Agent system message)
  const systemPrompt = `You are ${companyName}'s real-time website assistant.

ANSWER RULES:
• Reply as part of ${companyName} (use "we", "our").
• Keep answers concise but complete.
• No Markdown formatting. No *, **, _, ~, or [text](url).
• Write URLs as: Description URL (e.g. Contact us https://...)
• Quote exact wording for prices, stock, shipping, payment, policies.
• If information is not found, say: "I can't find that information on our site right now. Do you want me to put you through to a human agent?"

WEBSITE CONTEXT:
${collectedContext || 'No website content retrieved yet.'}`

  // Build messages with history
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    ...history.slice(-10), // Last 10 messages for context
    { role: 'user', content: userMessage },
  ]

  // Call Claude (replacing OpenAI gpt-4o-mini from n8n)
  const response = await claudeClient.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  })

  const answer = response.content[0].type === 'text' ? response.content[0].text : ''

  // Save assistant response to history
  await saveMessage(userId, 'assistant', answer)

  const aiResponse: AIResponse = {
    answer,
    intermediate_steps: intermediateSteps,
    sources: intermediateSteps.filter(s => s.tool === 'get_page').map(s => s.input),
  }

  return { aiResponse }
}
