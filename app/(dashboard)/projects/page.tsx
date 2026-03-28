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
    color: 'bg-blue-100',
  },
  {
    id: 2,
    name: 'Customer Support',
    description: '24/7 automated support via multiple channels',
    agentCount: 2,
    status: 'active',
    createdDate: '2 weeks ago',
    color: 'bg-green-100',
  },
  {
    id: 3,
    name: 'Appointment Booking',
    description: 'Automated clinic and salon appointment scheduling',
    agentCount: 4,
    status: 'active',
    createdDate: '3 weeks ago',
    color: 'bg-purple-100',
  },
  {
    id: 4,
    name: 'Old Marketing Campaign',
    description: 'Archived: Previous seasonal campaign',
    agentCount: 0,
    status: 'archived',
    createdDate: '2 months ago',
    color: 'bg-gray-100',
  },
]

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>(mockProjects)
  const [activeTab, setActiveTab] = useState<'active' | 'all'>('active')

  const filtered = activeTab === 'active'
    ? projects.filter(p => p.status === 'active')
    : projects

  const handleDelete = (id: number) => {
    setProjects(projects.filter(p => p.id !== id))
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm">
            <Plus size={16} />
            New Project
          </button>
        </div>
        <p className="text-gray-600">Organize agents into projects for better team management</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'active'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Active ({projects.filter(p => p.status === 'active').length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({projects.length})
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(project => (
          <div
            key={project.id}
            className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-12 h-12 ${project.color} rounded-lg flex items-center justify-center`}>
                <Folder size={24} className={
                  project.color === 'bg-blue-100' ? 'text-blue-600' :
                  project.color === 'bg-green-100' ? 'text-green-600' :
                  project.color === 'bg-purple-100' ? 'text-purple-600' :
                  'text-gray-600'
                } />
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <MoreVertical size={18} className="text-gray-400" />
              </button>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-1">{project.name}</h3>
            <p className="text-sm text-gray-600 mb-3">{project.description}</p>

            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <span className="text-xs text-gray-500">{project.createdDate}</span>
              <span className="text-sm font-medium text-gray-700">
                {project.agentCount} agent{project.agentCount !== 1 ? 's' : ''}
              </span>
            </div>

            {project.status === 'archived' && (
              <div className="mt-3 pt-3 border-t border-gray-200 flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-1 px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors">
                  <Archive size={14} />
                  Unarchive
                </button>
                <button
                  onClick={() => handleDelete(project.id)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded transition-colors"
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
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-4xl mb-4">📁</p>
          <p className="text-gray-600 mb-4">No projects yet</p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm">
            Create Your First Project
          </button>
        </div>
      )}
    </div>
  )
}
