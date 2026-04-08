/**
 * Google Sheets Invoice Logger
 * Logs every invoice to a Google Sheet for tracking
 * No n8n required
 */

import { google } from 'googleapis'

export interface InvoiceLogEntry {
  invoiceNumber: string
  invoiceDate: string
  dueDate: string
  clientName: string
  clientPhone?: string
  clientEmail?: string
  description: string
  baseAmount: number
  gstRate: number
  gstAmount: number
  totalAmount: number
  paymentLink?: string
  pdfUrl?: string
  status: 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  businessName: string
}

export async function logInvoiceToSheets(
  entry: InvoiceLogEntry
): Promise<{ success: boolean; error?: string }> {
  const spreadsheetId = process.env.INVOICEBOT_SHEETS_ID
  const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON

  if (!spreadsheetId || !credentialsJson) {
    // Silently skip if not configured — Sheets is optional
    return { success: true }
  }

  try {
    const credentials = JSON.parse(credentialsJson) as Record<string, unknown>

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })

    const sheets = google.sheets({ version: 'v4', auth })

    // Ensure header row exists on first use
    await ensureHeaderRow(sheets, spreadsheetId)

    // Append invoice row
    const row = [
      entry.invoiceNumber,
      entry.invoiceDate,
      entry.dueDate,
      entry.clientName,
      entry.clientPhone || '',
      entry.clientEmail || '',
      entry.description,
      entry.baseAmount,
      entry.gstRate + '%',
      entry.gstAmount,
      entry.totalAmount,
      entry.paymentLink || '',
      entry.pdfUrl || '',
      entry.status,
      entry.businessName,
    ]

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Invoices!A:O',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [row] },
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: `Sheets logging failed: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

export async function markInvoicePaidInSheets(
  invoiceNumber: string,
  paidDate: string
): Promise<{ success: boolean; error?: string }> {
  const spreadsheetId = process.env.INVOICEBOT_SHEETS_ID
  const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON

  if (!spreadsheetId || !credentialsJson) {
    return { success: true }
  }

  try {
    const credentials = JSON.parse(credentialsJson) as Record<string, unknown>
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })
    const sheets = google.sheets({ version: 'v4', auth })

    // Find the row with matching invoice number
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Invoices!A:A',
    })

    const rows = response.data.values || []
    const rowIndex = rows.findIndex((row) => row[0] === invoiceNumber)
    if (rowIndex === -1) return { success: false, error: 'Invoice not found in sheet' }

    // Row is 1-indexed, plus header row
    const sheetRow = rowIndex + 1

    // Update status column (N = col 14) to PAID and add paid date
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: [
          { range: `Invoices!N${sheetRow}`, values: [['PAID']] },
          { range: `Invoices!P${sheetRow}`, values: [[paidDate]] },
        ],
      },
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: `Failed to mark paid: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

async function ensureHeaderRow(sheets: ReturnType<typeof google.sheets>, spreadsheetId: string) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Invoices!A1',
    })

    if (!response.data.values || response.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Invoices!A1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [
            [
              'Invoice No',
              'Invoice Date',
              'Due Date',
              'Client Name',
              'Client Phone',
              'Client Email',
              'Description',
              'Base Amount',
              'GST Rate',
              'GST Amount',
              'Total Amount',
              'Payment Link',
              'PDF URL',
              'Status',
              'Business Name',
              'Paid Date',
            ],
          ],
        },
      })
    }
  } catch {
    // Ignore — sheet may not exist yet, append will create it
  }
}
