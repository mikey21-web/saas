"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";

export default function DashboardHome() {
  const { user } = useUser();

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
          <div className="text-3xl font-bold text-gray-900">0</div>
        </div>
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="text-gray-600 text-sm font-medium mb-2">Messages Today</div>
          <div className="text-3xl font-bold text-gray-900">0</div>
        </div>
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="text-gray-600 text-sm font-medium mb-2">Plan</div>
          <div className="text-lg font-bold text-brand-600">Trial</div>
        </div>
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="text-gray-600 text-sm font-medium mb-2">Days Left</div>
          <div className="text-3xl font-bold text-gray-900">7</div>
        </div>
      </div>

      {/* Empty State */}
      <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
        <div className="text-6xl mb-4">🤖</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Agents Yet</h2>
        <p className="text-gray-600 mb-6">
          Create your first AI employee from our agent store or build one from scratch
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/store"
            className="px-6 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium transition-colors"
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
    </div>
  );
}
