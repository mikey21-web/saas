'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function AdminRevenue() {
  const [revenue, setRevenue] = useState({
    mrrUSD: 0,
    mrrINR: 0,
    arrUSD: 0,
    arrINR: 0,
    churnRate: 0,
    customersPaying: 0,
    invoices: [] as any[],
  })

  useEffect(() => {
    fetch('/api/admin/revenue')
      .then(res => res.json())
      .then(data => { if (!data.error) setRevenue(data) })
      .catch(console.error)
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Revenue Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-gray-700 text-sm">MRR USD</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-gray-900">${revenue.mrrUSD}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-gray-700 text-sm">MRR INR</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-gray-900">₹{revenue.mrrINR.toLocaleString()}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-gray-700 text-sm">ARR USD</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-gray-900">${revenue.arrUSD}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-gray-700 text-sm">Paying Customers</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-gray-900">{revenue.customersPaying}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-gray-900">Recent Invoices</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {revenue.invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-400 py-8">No invoices yet</TableCell>
                </TableRow>
              ) : revenue.invoices.slice(0, 10).map((invoice, i) => (
                <TableRow key={i}>
                  <TableCell>{invoice.customer}</TableCell>
                  <TableCell>₹{invoice.amount}</TableCell>
                  <TableCell><Badge>{invoice.status}</Badge></TableCell>
                  <TableCell>{invoice.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
