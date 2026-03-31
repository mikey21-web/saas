"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

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

        // Calculate stats
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
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome, {user?.firstName || "Agent Master"}! 👋
        </h1>
        <p className="text-gray-600">Manage your AI employees from one place</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="text-gray-600 text-sm font-medium mb-2">Active Agents</div>
          <div className="text-3xl font-bold text-gray-900">{stats.activeCount}</div>
          <p className="text-xs text-gray-500 mt-2">{agents.length} total deployed</p>
        </div>
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="text-gray-600 text-sm font-medium mb-2">Total Messages</div>
          <div className="text-3xl font-bold text-gray-900">{stats.todayMessages}</div>
          <p className="text-xs text-gray-500 mt-2">This month across all agents</p>
        </div>
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="text-gray-600 text-sm font-medium mb-2">Usage</div>
          <div className="text-3xl font-bold text-blue-600">{Math.round(stats.totalUsagePercent)}%</div>
          <p className="text-xs text-gray-500 mt-2">Of monthly capacity</p>
        </div>
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="text-gray-600 text-sm font-medium mb-2">Trial Status</div>
          <div className="text-lg font-bold text-blue-600">Active</div>
          <p className="text-xs text-gray-500 mt-2">7 days free remaining</p>
        </div>
      </div>

      {/* Agents Grid or Empty State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : agents.length > 0 ? (
        <div>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Your Agents</h2>
            <Link
              href="/store"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
            >
              + Hire New Agent
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <Link
                key={agent.id}
                href={`/agents/${agent.id}`}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-4xl mb-2">{agent.icon || "🤖"}</div>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {agent.name}
                    </h3>
                    <p className="text-sm text-gray-600">{agent.business_name}</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${agent.status === "active" ? "bg-green-500" : "bg-gray-400"}`} />
                </div>

                <p className="text-xs text-gray-500 mb-4">{agent.industry}</p>

                <div className="space-y-3 mb-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">Calls/Email/WhatsApp</span>
                      <span className="text-gray-500">
                        {agent.monthly_calls_used + agent.monthly_emails_used + agent.monthly_whatsapp_used} msgs
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{
                          width: `${Math.min(
                            ((agent.monthly_calls_used + agent.monthly_emails_used + agent.monthly_whatsapp_used) /
                              (agent.monthly_calls_limit + agent.monthly_emails_limit + agent.monthly_whatsapp_limit)) *
                              100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
                  <span className={`text-xs font-medium ${agent.status === "active" ? "text-green-600" : "text-gray-500"}`}>
                    {agent.status === "active" ? "✓ Active" : "⊘ Paused"}
                  </span>
                  <span className="text-xs text-blue-600 font-medium group-hover:underline">View →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <div className="text-6xl mb-4">🤖</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Agents Yet</h2>
          <p className="text-gray-600 mb-6">
            Create your first AI employee from our agent store or build one from scratch
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/store"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              Browse Agent Store
            </Link>
            <Link
              href="/create-agent"
              className="px-6 py-3 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Create Custom Agent
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
