"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { ArrowRight, Zap } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  icon?: string;
  status: string;
  template_id: string;
  business_name: string;
  industry: string;
  model_tier: string;
  monthly_calls_used: number;
  monthly_calls_limit: number;
  monthly_emails_used: number;
  monthly_emails_limit: number;
  monthly_whatsapp_used: number;
  monthly_whatsapp_limit: number;
  created_at: string;
}

export default function DashboardHome() {
  const { user } = useUser();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeCount: 0,
    todayMessages: 0,
    totalUsagePercent: 0,
  });

  useEffect(() => {
    const fetchAgents = async () => {
      if (!user) return;
      try {
        const { data, error } = await (supabase
          .from("agents")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })) as any;

        if (error) throw error;
        setAgents(data || []);

        const activeCount = (data || []).filter((a: Agent) => a.status === "active").length;
        const totalMessages = (data || []).reduce((sum: number, a: Agent) => sum + a.monthly_calls_used + a.monthly_emails_used + a.monthly_whatsapp_used, 0);

        setStats({
          activeCount,
          todayMessages: totalMessages,
          totalUsagePercent: activeCount > 0 ? 35 : 0,
        });
      } catch (err) {
        console.error("Failed to fetch agents:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, [user]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
            {user?.firstName || "Welcome"}
          </h1>
          <p className="text-gray-400 text-lg">Your AI workforce, automated and working 24/7</p>
        </div>
        <Link
          href="/store"
          className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-sm transition-all"
          style={{ background: '#e879f9', color: '#0c0c0d' }}
        >
          <Zap className="w-4 h-4" />
          Hire Agent
        </Link>
      </div>

      {/* Stats Grid - Premium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Agents', value: stats.activeCount, unit: `of ${agents.length} deployed` },
          { label: 'Total Messages', value: stats.todayMessages, unit: 'this month' },
          { label: 'Usage', value: `${Math.round(stats.totalUsagePercent)}%`, unit: 'monthly capacity' },
          { label: 'Trial Status', value: 'Active', unit: '7 days remaining' },
        ].map((stat, i) => (
          <div
            key={i}
            className="rounded-2xl p-6 border transition-all"
            style={{
              borderColor: 'rgba(255,255,255,0.1)',
              background: i === 1 ? 'rgba(232,121,249,0.08)' : 'rgba(255,255,255,0.02)',
            }}
          >
            <p className="text-xs uppercase tracking-[0.2em] mb-4 opacity-60 font-medium">{stat.label}</p>
            <p className="text-4xl font-bold mb-2" style={i === 1 ? { color: '#e879f9' } : {}}>{stat.value}</p>
            <p className="text-sm text-gray-400">{stat.unit}</p>
          </div>
        ))}
      </div>

      {/* Agents Section */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-transparent border-t-[#e879f9] rounded-full animate-spin" />
        </div>
      ) : agents.length > 0 ? (
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-6">Your Agents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => {
              const totalUsed = agent.monthly_calls_used + agent.monthly_emails_used + agent.monthly_whatsapp_used;
              const totalLimit = agent.monthly_calls_limit + agent.monthly_emails_limit + agent.monthly_whatsapp_limit;
              const usagePercent = Math.round((totalUsed / totalLimit) * 100);

              return (
                <Link
                  key={agent.id}
                  href={`/agents/${agent.id}`}
                  className="group rounded-2xl p-6 border transition-all hover:border-opacity-100"
                  style={{
                    borderColor: agent.status === 'active' ? 'rgba(232,121,249,0.5)' : 'rgba(255,255,255,0.1)',
                    background: agent.status === 'active' ? 'rgba(232,121,249,0.06)' : 'rgba(255,255,255,0.02)',
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="text-3xl mb-2">{agent.icon || '🤖'}</div>
                      <h3 className="text-lg font-bold">{agent.name}</h3>
                      <p className="text-sm text-gray-400">{agent.business_name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: agent.status === 'active' ? '#10b981' : '#6b7280' }}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mb-4 uppercase tracking-wide">{agent.industry}</p>

                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Usage</span>
                      <span className="font-medium" style={{ color: '#e879f9' }}>{usagePercent}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all rounded-full"
                        style={{ background: '#e879f9', width: `${usagePercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                    <span className="text-xs font-medium" style={{ color: agent.status === 'active' ? '#10b981' : '#9ca3af' }}>
                      {agent.status === 'active' ? '● Active' : '○ Paused'}
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-gray-300 transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ) : (
        <div
          className="rounded-2xl p-16 text-center border-2 border-dashed"
          style={{ borderColor: 'rgba(232,121,249,0.3)', background: 'rgba(232,121,249,0.03)' }}
        >
          <p className="text-5xl mb-4">🤖</p>
          <h2 className="text-2xl font-bold tracking-tight mb-2">No Agents Yet</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Your AI workforce is one click away. Choose from our pre-built agents or create a custom one.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/store"
              className="px-6 py-3 rounded-lg font-medium text-sm transition-all"
              style={{ background: '#e879f9', color: '#0c0c0d' }}
            >
              Browse Agent Store
            </Link>
            <Link
              href="/create-agent"
              className="px-6 py-3 rounded-lg font-medium text-sm transition-all border"
              style={{ borderColor: 'rgba(232,121,249,0.3)', color: 'inherit' }}
            >
              Build Custom
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
