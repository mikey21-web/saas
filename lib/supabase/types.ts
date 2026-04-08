export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          clerk_id: string
          email: string
          full_name: string | null
          business_name: string | null
          timezone: string
          language: string
          plan_tier: 'intern' | 'agent'
          plan_status: 'active' | 'paused' | 'cancelled'
          usage_pause_all: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          clerk_id: string
          email: string
          full_name?: string
          business_name?: string
          timezone?: string
          language?: string
          plan_tier?: 'intern' | 'agent'
        }
        Update: {
          full_name?: string
          business_name?: string
          timezone?: string
          language?: string
          plan_tier?: 'intern' | 'agent'
          plan_status?: 'active' | 'paused' | 'cancelled'
          usage_pause_all?: boolean
        }
      }

      agents: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          template_id: string | null
          template_version: string | null
          status: 'active' | 'paused' | 'archived'
          system_prompt: string | null
          business_name: string | null
          business_industry: string | null
          business_description: string | null
          tone: 'professional' | 'casual' | 'friendly'
          channels_whatsapp: boolean
          whatsapp_phone_number_id: string | null
          channels_email: boolean
          channels_sms: boolean
          channels_phone: boolean
          ai_model: 'groq' | 'gemini' | 'kimi' | 'byok'
          ai_model_tier: 'fast' | 'balanced' | 'smartest'
          byok_provider: string | null
          byok_api_key_encrypted: string | null
          active_hours_start: number
          active_hours_end: number
          active_hours_timezone: string
          monthly_calls_used: number
          monthly_emails_used: number
          monthly_whatsapp_used: number
          monthly_api_requests: number
          deployed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          name: string
          description?: string
          template_id?: string
          template_version?: string
          system_prompt?: string
          business_name?: string
          business_industry?: string
          business_description?: string
          tone?: 'professional' | 'casual' | 'friendly'
          channels_whatsapp?: boolean
          whatsapp_phone_number_id?: string
          channels_email?: boolean
          channels_sms?: boolean
          channels_phone?: boolean
          ai_model?: 'groq' | 'gemini' | 'kimi' | 'byok'
          ai_model_tier?: 'fast' | 'balanced' | 'smartest'
        }
        Update: {
          name?: string
          description?: string
          status?: 'active' | 'paused' | 'archived'
          system_prompt?: string
          business_name?: string
          business_industry?: string
          business_description?: string
          tone?: 'professional' | 'casual' | 'friendly'
          channels_whatsapp?: boolean
          whatsapp_phone_number_id?: string
          channels_email?: boolean
          channels_sms?: boolean
          channels_phone?: boolean
          ai_model?: 'groq' | 'gemini' | 'kimi' | 'byok'
          ai_model_tier?: 'fast' | 'balanced' | 'smartest'
          active_hours_start?: number
          active_hours_end?: number
          monthly_calls_used?: number
          monthly_emails_used?: number
          monthly_whatsapp_used?: number
          monthly_api_requests?: number
          deployed_at?: string
        }
      }

      conversations: {
        Row: {
          id: string
          user_id: string
          agent_id: string
          contact_phone_or_email: string
          channel: 'whatsapp' | 'email' | 'sms' | 'phone'
          status: 'active' | 'escalated' | 'resolved'
          escalation_reason: string | null
          total_messages: number
          total_cost_inr: number
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          agent_id: string
          contact_phone_or_email: string
          channel: 'whatsapp' | 'email' | 'sms' | 'phone'
        }
        Update: {
          status?: 'active' | 'escalated' | 'resolved'
          escalation_reason?: string
          total_messages?: number
          total_cost_inr?: number
        }
      }

      messages: {
        Row: {
          id: string
          conversation_id: string
          agent_id: string
          role: 'user' | 'agent'
          content: string
          channel: string
          tool_name: string | null
          tool_input: string | null
          tool_result: string | null
          cost_inr: number | null
          response_time_ms: number | null
          feedback_score: number | null
          feedback_text: string | null
          created_at: string
        }
        Insert: {
          conversation_id: string
          agent_id: string
          role: 'user' | 'agent'
          content: string
          channel: string
          tool_name?: string
          tool_input?: string
          tool_result?: string
          cost_inr?: number
          response_time_ms?: number
        }
        Update: {
          feedback_score?: number
          feedback_text?: string
        }
      }

      contacts: {
        Row: {
          id: string
          user_id: string
          name: string
          phone: string | null
          email: string | null
          business_name: string | null
          whatsapp_consent: boolean
          sms_consent: boolean
          call_consent: boolean
          email_consent: boolean
          consent_date: string | null
          consent_source: 'form' | 'inbound' | 'manual' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          name: string
          phone?: string
          email?: string
          business_name?: string
          whatsapp_consent?: boolean
          sms_consent?: boolean
          call_consent?: boolean
          email_consent?: boolean
          consent_source?: 'form' | 'inbound' | 'manual'
        }
        Update: {
          name?: string
          phone?: string
          email?: string
          business_name?: string
          whatsapp_consent?: boolean
          sms_consent?: boolean
          call_consent?: boolean
          email_consent?: boolean
        }
      }

      knowledge_documents: {
        Row: {
          id: string
          agent_id: string
          user_id: string
          title: string
          content: string
          source: 'manual' | 'url' | 'pdf' | 'qa'
          source_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          user_id: string
          title: string
          content: string
          source: 'manual' | 'url' | 'pdf' | 'qa'
          source_url?: string
        }
        Update: {
          title?: string
          content?: string
        }
      }

      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          razorpay_customer_id: string | null
          razorpay_subscription_id: string | null
          plan_tier: 'intern' | 'agent'
          billing_currency: 'INR' | 'USD'
          billing_amount: number
          status: 'active' | 'trialing' | 'past_due' | 'cancelled'
          trial_ends_at: string | null
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          cancelled_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          plan_tier: 'intern' | 'agent'
          billing_currency?: 'INR' | 'USD'
          billing_amount: number
          status?: 'active' | 'trialing'
        }
        Update: {
          status?: 'active' | 'trialing' | 'past_due' | 'cancelled'
          cancel_at_period_end?: boolean
          stripe_subscription_id?: string
          razorpay_subscription_id?: string
        }
      }

      addon_purchases: {
        Row: {
          id: string
          user_id: string
          addon_type: 'calls' | 'whatsapp' | 'emails' | 'powered_ai'
          addon_name: string | null
          quantity: number | null
          price_inr: number
          stripe_item_id: string | null
          razorpay_item_id: string | null
          status: 'active' | 'expired'
          purchased_at: string
          expires_at: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          addon_type: 'calls' | 'whatsapp' | 'emails' | 'powered_ai'
          addon_name?: string
          quantity?: number
          price_inr: number
        }
        Update: {
          status?: 'active' | 'expired'
        }
      }

      inbox_messages: {
        Row: {
          id: string
          user_id: string
          conversation_id: string
          agent_id: string
          status: 'pending' | 'approved' | 'escalated' | 'resolved'
          priority: 'low' | 'normal' | 'high'
          last_message_content: string | null
          last_message_at: string | null
          taken_over_by_user: boolean
          taken_over_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          conversation_id: string
          agent_id: string
          status?: 'pending' | 'approved' | 'escalated' | 'resolved'
          priority?: 'low' | 'normal' | 'high'
        }
        Update: {
          status?: 'pending' | 'approved' | 'escalated' | 'resolved'
          taken_over_by_user?: boolean
          taken_over_at?: string
        }
      }

      activity_logs: {
        Row: {
          id: string
          user_id: string
          agent_id: string | null
          action: string
          details: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          agent_id?: string | null
          action: string
          details?: string
        }
      }
    }
  }
}
