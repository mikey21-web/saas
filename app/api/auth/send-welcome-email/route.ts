import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email, fullName } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    const result = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: '🎉 Welcome to diyaa.ai! Your AI Employees Await',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #e879f9 0%, #a855f7 100%); color: white; padding: 40px 20px; border-radius: 12px; text-align: center; margin-bottom: 30px; }
              .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
              .header p { margin: 10px 0 0 0; font-size: 14px; opacity: 0.9; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 8px; margin-bottom: 20px; }
              .content h2 { color: #0c0c0d; margin-top: 0; }
              .feature-list { list-style: none; padding: 0; margin: 20px 0; }
              .feature-list li { padding: 12px 0; padding-left: 30px; position: relative; color: #555; }
              .feature-list li:before { content: '✓'; position: absolute; left: 0; color: #e879f9; font-weight: bold; }
              .cta-button { display: inline-block; background: linear-gradient(135deg, #e879f9 0%, #a855f7 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
              .footer { text-align: center; color: #999; font-size: 12px; padding-top: 20px; border-top: 1px solid #ddd; }
              .badge { display: inline-block; background: #e879f9; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to diyaa.ai</h1>
                <p>Your AI Employees Are Ready to Work 🚀</p>
              </div>

              <div class="content">
                <h2>Hi ${fullName || 'there'},</h2>
                <p>Your account is all set! You're now ready to hire your first AI employee and start automating your business tasks.</p>

                <h3 style="color: #e879f9; margin-top: 30px;">What You Can Do Now:</h3>
                <ul class="feature-list">
                  <li><strong>Browse the Agent Store</strong> — Choose from 15+ pre-built AI agents (LeadCatcher, PayChaser, TaskMaster, etc.)</li>
                  <li><strong>Deploy in Minutes</strong> — Answer 5-6 questions about your business, and your agent is live</li>
                  <li><strong>Connect Channels</strong> — WhatsApp, Email, SMS, Phone — agents work across all channels</li>
                  <li><strong>Run Workflows</strong> — Create multi-agent task orchestrations for complex automation</li>
                  <li><strong>Track Usage</strong> — Real-time analytics and cost tracking for every agent</li>
                </ul>

                <h3 style="color: #0c0c0d; margin-top: 30px;">Quick Start:</h3>
                <ol style="color: #555;">
                  <li>Go to <strong>Agent Store</strong></li>
                  <li>Pick an agent (e.g., "Lead Catcher" for lead qualification)</li>
                  <li>Click <strong>"Deploy"</strong> and answer business questions</li>
                  <li>Your agent is live in &lt; 5 minutes</li>
                  <li>Start forwarding inquiries to your agent's WhatsApp/Email</li>
                </ol>

                <center>
                  <a href="https://diyaa.ai/dashboard" class="cta-button">Go to Dashboard</a>
                </center>

                <h3 style="color: #0c0c0d; margin-top: 30px;">Need Help?</h3>
                <p>Check out our <strong>Academy</strong> section for tutorials, or reply to this email anytime. We're here to help! 💜</p>

                <p style="margin-top: 40px; color: #0c0c0d;"><strong>What's next?</strong></p>
                <p>Start with a free trial (7 days, no credit card), then upgrade to a paid plan when you're ready.</p>
              </div>

              <div class="footer">
                <p>© 2026 diyaa.ai. All rights reserved. | <a href="https://diyaa.ai/privacy" style="color: #999;">Privacy</a> | <a href="https://diyaa.ai/terms" style="color: #999;">Terms</a></p>
                <p>You're receiving this email because you signed up for diyaa.ai. <a href="https://diyaa.ai/unsubscribe" style="color: #999;">Manage preferences</a></p>
              </div>
            </div>
          </body>
        </html>
      `,
    })

    if (result.error) {
      console.error('Resend error:', result.error)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true, emailId: result.data?.id })
  } catch (error) {
    console.error('Welcome email error:', error)
    return NextResponse.json({ error: 'Failed to send welcome email' }, { status: 500 })
  }
}
