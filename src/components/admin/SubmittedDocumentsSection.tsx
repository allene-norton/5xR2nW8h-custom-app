"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { DocumentCard } from "../shared/DocumentCard"
import { RefreshCw, FolderOpen } from "lucide-react"
import { fetchClientDocuments, type SDKDocument } from "../../utils/sdk-integration"

interface SubmittedDocumentsSectionProps {
  clientId: string
}

export function SubmittedDocumentsSection({ clientId }: SubmittedDocumentsSectionProps) {
  const [documents, setDocuments] = useState<SDKDocument[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadDocuments = async () => {
    if (!clientId) {
      setDocuments([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const clientDocuments = await fetchClientDocuments(clientId)
      setDocuments(clientDocuments)
    } catch (err) {
      setError("Failed to load client documents")
      console.error("Error loading documents:", err)
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

  const handleDownloadDocument = (document: SDKDocument) => {
    if (document.url) {
      const link = document.createElement("a")
      link.href = document.url
      link.download = document.title
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FolderOpen className="w-5 h-5 text-blue-600" />
            <CardTitle>Submitted Documents</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadDocuments}
            disabled={isLoading || !clientId}
            className="flex items-center space-x-2 bg-transparent"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
        <CardDescription>Documents submitted by the client through the portal</CardDescription>
      </CardHeader>
      <CardContent>
        {!clientId ? (
          <div className="text-center py-8">
            <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Select a client to view their submitted documents</p>
          </div>
        ) : isLoading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading documents...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">{error}</div>
            <Button variant="outline" onClick={loadDocuments}>
              Try Again
            </Button>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8">
            <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No documents have been submitted yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((document) => (
              <DocumentCard
                key={document.id}
                title={document.title}
                type={document.type}
                variant="admin"
                onView={() => handleViewDocument(document)}
                onDownload={() => handleDownloadDocument(document)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
