'use client'

import { Folder, Plus, MoreVertical, Archive, Trash2 } from 'lucide-react'
import { useState } from 'react'

interface Project {
  id: number
  name: string
  description: string
  agentCount: number
  status: 'active' | 'archived'
  createdDate: string
  color: string
}

const mockProjects: Project[] = [
  {
    id: 1,
    name: 'Lead Generation',
    description: 'WhatsApp and email lead capture for sales team',
    agentCount: 3,
    status: 'active',
    createdDate: '1 week ago',
    color: 'bg-blue-500',
  },
  {
    id: 2,
    name: 'Customer Support',
    description: '24/7 automated support via multiple channels',
    agentCount: 2,
    status: 'active',
    createdDate: '2 weeks ago',
    color: 'bg-green-500',
  },
  {
    id: 3,
    name: 'Appointment Booking',
    description: 'Automated clinic and salon appointment scheduling',
    agentCount: 4,
    status: 'active',
    createdDate: '3 weeks ago',
    color: 'bg-purple-500',
  },
  {
    id: 4,
    name: 'Old Marketing Campaign',
    description: 'Archived: Previous seasonal campaign',
    agentCount: 0,
    status: 'archived',
    createdDate: '2 months ago',
    color: 'bg-gray-600',
  },
]

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>(mockProjects)
  const [activeTab, setActiveTab] = useState<'active' | 'all'>('active')

  const filtered = activeTab === 'active' ? projects.filter((p) => p.status === 'active') : projects

  const handleDelete = (id: number) => {
    setProjects(projects.filter((p) => p.id !== id))
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold" style={{ color: '#f0eff0' }}>
            Projects
          </h1>
          <button
            disabled
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm opacity-50 cursor-not-allowed transition-all"
            style={{ background: '#666666', color: '#999999' }}
          >
            <Plus size={16} />
            New Project (Soon)
          </button>
        </div>
        <p style={{ color: '#71717a' }}>Organize agents into projects for better team management</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('active')}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{
            background: activeTab === 'active' ? '#e879f9' : 'rgba(255,255,255,0.05)',
            color: activeTab === 'active' ? '#0c0c0d' : '#71717a',
            border: activeTab === 'active' ? 'none' : '1px solid rgba(255,255,255,0.08)',
          }}
        >
          Active ({projects.filter((p) => p.status === 'active').length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{
            background: activeTab === 'all' ? '#e879f9' : 'rgba(255,255,255,0.05)',
            color: activeTab === 'all' ? '#0c0c0d' : '#71717a',
            border: activeTab === 'all' ? 'none' : '1px solid rgba(255,255,255,0.08)',
          }}
        >
          All ({projects.length})
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((project) => (
          <div
            key={project.id}
            className="rounded-2xl p-6 border transition-all hover:border-opacity-100"
            style={{
              borderColor:
                project.status === 'active' ? 'rgba(232,121,249,0.3)' : 'rgba(255,255,255,0.08)',
              background:
                project.status === 'active' ? 'rgba(232,121,249,0.05)' : 'rgba(255,255,255,0.02)',
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`w-12 h-12 ${project.color} rounded-lg flex items-center justify-center`}
              >
                <Folder size={24} style={{ color: '#fff' }} />
              </div>
              <button className="p-2 rounded-lg transition-colors" style={{ color: '#71717a' }}>
                <MoreVertical size={18} />
              </button>
            </div>

            <h3 className="text-lg font-semibold mb-1" style={{ color: '#f0eff0' }}>
              {project.name}
            </h3>
            <p className="text-sm mb-4" style={{ color: '#71717a' }}>
              {project.description}
            </p>

            <div
              className="flex items-center justify-between pt-4 border-t"
              style={{ borderColor: 'rgba(255,255,255,0.08)' }}
            >
              <span className="text-xs" style={{ color: '#71717a' }}>
                {project.createdDate}
              </span>
              <span className="text-sm font-medium" style={{ color: '#e879f9' }}>
                {project.agentCount} agent{project.agentCount !== 1 ? 's' : ''}
              </span>
            </div>

            {project.status === 'archived' && (
              <div
                className="mt-4 pt-4 border-t border-gray-200 flex gap-2"
                style={{ borderColor: 'rgba(255,255,255,0.08)' }}
              >
                <button
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1 text-xs font-medium rounded transition-colors"
                  style={{ color: '#e879f9', background: 'rgba(232,121,249,0.1)' }}
                >
                  <Archive size={14} />
                  Unarchive
                </button>
                <button
                  onClick={() => handleDelete(project.id)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1 text-xs font-medium rounded transition-colors"
                  style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div
          className="text-center py-12 rounded-2xl border"
          style={{ borderColor: 'rgba(232,121,249,0.3)', background: 'rgba(232,121,249,0.05)' }}
        >
          <p className="text-4xl mb-4">📁</p>
          <p className="mb-4" style={{ color: '#71717a' }}>
            No projects yet
          </p>
          <button
            className="px-4 py-2 rounded-lg font-medium text-sm transition-all"
            style={{ background: '#e879f9', color: '#0c0c0d' }}
          >
            Create Your First Project
          </button>
        </div>
      )}
    </div>
  )
}
