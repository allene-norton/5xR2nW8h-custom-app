"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { ContractCard } from "../shared/ContractCard"
import { FolderOpen, RefreshCw } from "lucide-react"
import { fetchClientDocuments, type SDKDocument } from "../../utils/sdk-integration"

interface ClientDocumentsDisplayProps {
  clientId: string
}

export function ClientDocumentsDisplay({ clientId }: ClientDocumentsDisplayProps) {
  const [documents, setDocuments] = useState<SDKDocument[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadDocuments = async () => {
    if (!clientId) {
      setDocuments([])
      return
    }

    setIsLoading(true)

    try {
      const clientDocuments = await fetchClientDocuments(clientId)

      // Add some mock documents for the client view
      const mockDocuments: SDKDocument[] = [
        {
          id: "app-form",
          title: "Application Form",
          type: "pdf",
          url: "/mock-documents/application-form.pdf",
        },
        {
          id: "bg-report",
          title: "Background Report",
          type: "pdf",
          url: "/mock-documents/background-report.pdf",
        },
        {
          id: "signed-agreement",
          title: "Signed Agreement",
          type: "pdf",
          url: "/mock-documents/signed-agreement.pdf",
        },
        ...clientDocuments,
      ]

      setDocuments(mockDocuments)
    } catch (error) {
      console.error("Error loading documents:", error)
      setDocuments([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDocuments()
  }, [clientId])

  const handleViewDocument = (document: SDKDocument) => {
    if (document.url) {
      window.open(document.url, "_blank")
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <FolderOpen className="w-5 h-5 text-blue-600" />
          <CardTitle>Your Documents</CardTitle>
        </div>
        <CardDescription>View and download your background check documents and related files</CardDescription>
      </CardHeader>
      <CardContent>
        {!clientId ? (
          <div className="text-center py-8">
            <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No client selected</p>
          </div>
        ) : isLoading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading your documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8">
            <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No documents available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((document) => (
              <DocumentCard
                key={document.id}
                title={document.title}
                type={document.type}
                variant="client"
                onView={() => handleViewDocument(document)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
