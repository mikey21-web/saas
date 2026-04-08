'use client'

import { useState } from 'react'
import { Mail, Phone, Search, Plus, Trash2 } from 'lucide-react'

interface Contact {
  id: number
  name: string
  phone: string
  email: string
  business?: string
  whatsappConsent: boolean
  smsConsent: boolean
  callConsent: boolean
  emailConsent: boolean
  addedDate: string
}

const mockContacts: Contact[] = [
  {
    id: 1,
    name: 'Rajesh Kumar',
    phone: '+91 98765 43210',
    email: 'rajesh@dental.com',
    business: 'Dental Clinic',
    whatsappConsent: true,
    smsConsent: true,
    callConsent: true,
    emailConsent: true,
    addedDate: '2 days ago',
  },
  {
    id: 2,
    name: 'Priya Singh',
    phone: '+91 87654 32109',
    email: 'priya@salon.com',
    business: 'Beauty Salon',
    whatsappConsent: true,
    smsConsent: false,
    callConsent: true,
    emailConsent: true,
    addedDate: '5 days ago',
  },
  {
    id: 3,
    name: 'Amit Sharma',
    phone: '+91 76543 21098',
    email: 'amit@restaurant.com',
    business: 'Restaurant',
    whatsappConsent: false,
    smsConsent: true,
    callConsent: false,
    emailConsent: true,
    addedDate: '1 week ago',
  },
]

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>(mockContacts)
  const [search, setSearch] = useState('')

  const filtered = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  )

  const handleToggleConsent = (contactId: number, consentType: string) => {
    setContacts(
      contacts.map((c) => {
        if (c.id === contactId) {
          return {
            ...c,
            [consentType]: !c[consentType as keyof Contact],
          }
        }
        return c
      })
    )
  }

  const handleDelete = (id: number) => {
    setContacts(contacts.filter((c) => c.id !== id))
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
          <button disabled className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed font-medium text-sm opacity-50">
            <Plus size={16} />
            Import (Coming Soon)
          </button>
        </div>
        <p className="text-gray-600">Manage contact consent for WhatsApp, SMS, calls, and email</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Contact</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Business</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">WhatsApp</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">SMS</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">Call</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">Email</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Added</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((contact) => (
                <tr key={contact.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{contact.name}</p>
                      <div className="flex gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Phone size={12} />
                          {contact.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail size={12} />
                          {contact.email}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{contact.business || '-'}</td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleToggleConsent(contact.id, 'whatsappConsent')}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        contact.whatsappConsent
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {contact.whatsappConsent ? '✓ Yes' : 'No'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleToggleConsent(contact.id, 'smsConsent')}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        contact.smsConsent
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {contact.smsConsent ? '✓ Yes' : 'No'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleToggleConsent(contact.id, 'callConsent')}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        contact.callConsent
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {contact.callConsent ? '✓ Yes' : 'No'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleToggleConsent(contact.id, 'emailConsent')}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        contact.emailConsent
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {contact.emailConsent ? '✓ Yes' : 'No'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-xs">{contact.addedDate}</td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleDelete(contact.id)}
                      className="p-1 hover:bg-red-100 text-red-600 rounded transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200 mt-6">
          <p className="text-4xl mb-4">📇</p>
          <p className="text-gray-600">No contacts found</p>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong>TRAI Compliance:</strong> Contacts are checked against DND (Do Not Disturb) before
          sending SMS or making calls. WhatsApp consent is also enforced. Inbound messages grant
          implicit consent.
        </p>
      </div>
    </div>
  )
}
