'use client'

import { useEffect, useState } from 'react'
import { Metrics } from '@/components/admin/metrics'
import { RevenueChart } from '@/components/admin/revenue-chart'
import { UserGrowthChart } from '@/components/admin/user-growth'
import { RecentUsers } from '@/components/admin/recent-users'

export default function AdminOverview() {
  const [data, setData] = useState({
    totalUsers: 0,
    activeAgents: 0,
    mrrUSD: 0,
    mrrINR: 0,
    churnRate: 0,
    agentUsage: 0,
  })

  useEffect(() => {
    fetch('/api/admin/metrics')
      .then(res => res.json())
      .then(result => {
        if (!result.error) setData(result)
      })
      .catch(console.error)
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Super Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Track all SaaS metrics in real-time</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Metrics title="Total Users" value={data.totalUsers.toLocaleString()} trend="+12%" />
        <Metrics title="Active Agents" value={data.activeAgents.toLocaleString()} trend="+8%" />
        <Metrics title="MRR (USD)" value={`$${data.mrrUSD}`} trend="+15%" />
        <Metrics title="MRR (INR)" value={`₹${data.mrrINR.toLocaleString()}`} trend="+22%" />
        <Metrics title="Churn Rate" value={`${data.churnRate}%`} trend="-2%" />
        <Metrics title="Agent Usage" value={data.agentUsage.toLocaleString()} trend="+30%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart />
        <UserGrowthChart />
      </div>

      <RecentUsers />
    </div>
  )
}
