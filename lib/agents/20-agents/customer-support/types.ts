import { Annotation } from '@langchain/langgraph'

export interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface WebsiteLink {
  url: string
  title?: string
}

export interface PageContent {
  url: string
  text: string
}

export interface AIResponse {
  answer: string
  intermediate_steps?: Array<{ tool: string; input: string; output: string }>
  sources?: string[]
}

export interface UserContext {
  userId: string
  phoneNumber: string
  companyName: string
  websiteUrl: string
  conversationHistory: Message[]
}

const CustomerSupportAnnotation = Annotation.Root({
  userId: {
    value: (x: string, y: string) => y || x,
    default: () => '',
  },
  phoneNumber: {
    value: (x: string, y: string) => y || x,
    default: () => '',
  },
  companyName: {
    value: (x: string, y: string) => y || x,
    default: () => '',
  },
  websiteUrl: {
    value: (x: string, y: string) => y || x,
    default: () => '',
  },
  userMessage: {
    value: (x: string, y: string) => y || x,
    default: () => '',
  },
  messageTimestamp: {
    value: (x: number, y: number) => y || x,
    default: () => Date.now(),
  },
  withinWindow: {
    value: (x: boolean, y: boolean) => y !== undefined ? y : x,
    default: () => false,
  },
  conversationHistory: {
    value: (x: Message[], y: Message[]) => [...x, ...y],
    default: () => [],
  },
  aiResponse: {
    value: (x: AIResponse | null, y: AIResponse | null) => y || x,
    default: () => null,
  },
  cleanedAnswer: {
    value: (x: string, y: string) => y || x,
    default: () => '',
  },
  sentSuccessfully: {
    value: (x: boolean, y: boolean) => y !== undefined ? y : x,
    default: () => false,
  },
})

export type CustomerSupportState = typeof CustomerSupportAnnotation.State
export { CustomerSupportAnnotation }
