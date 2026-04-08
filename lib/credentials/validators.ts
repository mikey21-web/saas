/**
 * Client-safe credential validators (no crypto, no server-only imports)
 */

export interface CredentialValidation {
  field: string
  valid: boolean
  message?: string
  suggestedFix?: string
}

export function validateWhatsAppNumber(number: string): CredentialValidation {
  const cleaned = number.replace(/\D/g, '')
  if (!cleaned)
    return {
      field: 'whatsapp_number',
      valid: false,
      message: 'WhatsApp number cannot be empty',
      suggestedFix: 'Enter your business WhatsApp number (with country code)',
    }
  if (cleaned.length < 10)
    return {
      field: 'whatsapp_number',
      valid: false,
      message: 'WhatsApp number too short',
      suggestedFix: 'Include country code (e.g., 919876543210)',
    }
  if (cleaned.length > 15)
    return {
      field: 'whatsapp_number',
      valid: false,
      message: 'WhatsApp number too long',
      suggestedFix: 'Remove any extra characters',
    }
  return { field: 'whatsapp_number', valid: true, message: `Formatted as +${cleaned}` }
}

export async function validateWebsiteUrl(url: string): Promise<CredentialValidation> {
  if (!url?.trim())
    return {
      field: 'website_url',
      valid: false,
      message: 'Website URL cannot be empty',
      suggestedFix: 'Enter your full website URL (e.g., https://www.example.com)',
    }
  try {
    const urlObj = new URL(url)
    if (!['http:', 'https:'].includes(urlObj.protocol))
      return {
        field: 'website_url',
        valid: false,
        message: 'Only HTTP/HTTPS URLs allowed',
        suggestedFix: 'Use https://www.example.com format',
      }
    if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1')
      return {
        field: 'website_url',
        valid: false,
        message: 'Localhost/private IPs not allowed',
        suggestedFix: 'Use a public website URL',
      }
    return { field: 'website_url', valid: true, message: 'Valid URL format' }
  } catch {
    return {
      field: 'website_url',
      valid: false,
      message: 'Invalid URL format',
      suggestedFix: 'Use https://www.example.com format',
    }
  }
}

export function validateOpenAIKey(key: string): CredentialValidation {
  if (!key?.trim())
    return {
      field: 'openai_api_key',
      valid: false,
      message: 'API key cannot be empty',
      suggestedFix: 'Paste your OpenAI API key from platform.openai.com',
    }
  if (!key.startsWith('sk-'))
    return {
      field: 'openai_api_key',
      valid: false,
      message: 'Invalid OpenAI key format (must start with sk-)',
      suggestedFix: 'Get a valid key from https://platform.openai.com/api-keys',
    }
  if (key.length < 20)
    return {
      field: 'openai_api_key',
      valid: false,
      message: 'API key too short',
      suggestedFix: 'Verify you copied the entire key correctly',
    }
  return { field: 'openai_api_key', valid: true, message: 'Valid OpenAI key format' }
}

export function validateGroqKey(key: string): CredentialValidation {
  if (!key?.trim())
    return {
      field: 'groq_api_key',
      valid: false,
      message: 'API key cannot be empty',
      suggestedFix: 'Paste your Groq API key from console.groq.com',
    }
  if (!key.startsWith('gsk_'))
    return {
      field: 'groq_api_key',
      valid: false,
      message: 'Invalid Groq key format (must start with gsk_)',
      suggestedFix: 'Get a valid key from https://console.groq.com',
    }
  if (key.length < 20)
    return {
      field: 'groq_api_key',
      valid: false,
      message: 'API key too short',
      suggestedFix: 'Verify you copied the entire key correctly',
    }
  return { field: 'groq_api_key', valid: true, message: 'Valid Groq key format' }
}
