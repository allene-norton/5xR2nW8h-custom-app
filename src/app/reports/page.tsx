"use client"

import { ClientPortal } from "../../components/client/ClientPortal"
import { useFormData } from "../../hooks/useFormData"
import { Badge } from "../../components/ui/badge"

export default function ReportsPage() {
const tempClientId = '8b891bf8-1827-4574-9290-1e76fa33dc41'

  const { formData, isLoading } = useFormData({clientId: tempClientId})

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your background check report...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">CT</span>
                </div>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">ClearTech Background Services</h1>
                <p className="text-sm text-gray-500">Background Check Report</p>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center space-x-4">
              <Badge
                variant={
                  formData.status === "cleared"
                    ? "default"
                    : formData.status === "pending"
                      ? "secondary"
                      : "destructive"
                }
                className={
                  formData.status === "cleared"
                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                    : formData.status === "pending"
                      ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                      : "bg-red-100 text-red-800 hover:bg-red-200"
                }
              >
                {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ClientPortal formData={formData} />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            © 2025 ClearTech Background Services. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
