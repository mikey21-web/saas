# Rhys — Cold Outreach Agent

## Overview
**Sales | Official | Personalized outreach at scale | $50/mo**

An AI sales rep that researches prospects, writes hyper-personalized cold emails, and manages multi-touch sequences. Combines deep prospect research with persuasive writing to book meetings that matter.

**Deploy Now** — $50/mo (₹4,199/mo)

## What this agent does
- Research prospects and companies before outreach
- Write personalized cold emails (not templates) 
- Manage multi-touch email sequences (3-5 touches)
- Adapt messaging based on prospect's role and industry
- Track response rates and optimize messaging
- Identify ideal customer profile signals from research

## Built-in skills
- **Email** — Send personalized cold emails via Resend/SendGrid
- **Web Search** — LinkedIn, company websites, news for research
- **Scheduling & Reminders** — Calendly integration, follow-up timing

## Multi-Agent Architecture (4 Agents)
```
1. RESEARCH AGENT → LinkedIn + company research
2. COPYWRITER AGENT → Personalized email generation
3. SEQUENCER AGENT → Multi-touch sequence management
4. ANALYTICS AGENT → Response tracking + optimization
```

## Credentials Required
- Resend/SendGrid API key (email sending)
- LinkedIn Sales Navigator or company domain list
- Calendly link (meeting booking)
- AI Model (diyaa.ai powered or bring your own)

## India-First Features
- Hinglish personalization for Indian prospects
- WhatsApp follow-up option (email + WhatsApp combo)
- UPI payment link for paid discovery calls
- Local time zone scheduling (IST)

## Integration Flow
```
Upload CSV → Agent researches each prospect → 
Generates sequence → Sends Day 1 email → 
Tracks opens/replies → Follow-up Day 3 → 
Calendly link Day 7 → Books meetings → 
Weekly performance report
```

## Expected Results
**20-40% open rates** (vs 5-10% templates)
**5-10% reply rates** (vs 1-2% templates)
**2-5 meetings booked per 100 emails**

## Pricing Comparison
| Feature | Rhys | Typical Cold Email Tool |
|---------|------|------------------------|
| Prospect Research | ✅ AI Deep Research | ❌ Static lists |
| Personalization | ✅ Hyper-personal | ❌ Name swap |
| Sequence Management | ✅ 5-touch auto | ❌ Manual |
| India Support | ✅ WhatsApp + UPI | ❌ Email only |
| Price/mo | $50 | $99+ |

## Quick Start
1. Deploy Rhys from Agent Store
2. Upload prospect CSV (name, company, email, role)
3. Set email sender + Calendly link
4. Review first 5 emails
5. Launch campaign (100 emails/day)

**Ready to book meetings that matter. Deploy now.**

---

**Technical Notes:**
- Template ID: `rhys-cold-outreach`
- AgentType: `coldoutreach`
- Store integration: Live at /store
- Orchestration: LangGraph 4-agent pipeline
- Cost optimized: Groq Llama3 for research/copy
