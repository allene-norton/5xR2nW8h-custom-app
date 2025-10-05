"use client"

import { Card, CardContent } from "../ui/card"
import { Button } from "../ui/button"
import { FileText, ImageIcon, File, Eye, Download, ExternalLink } from "lucide-react"

interface DocumentCardProps {
  title: string
  type: string
  fileInfo?: {
    size?: number
    uploadedAt?: Date
  }
  variant: "admin" | "client"
  onView?: () => void
  onDownload?: () => void
  className?: string
}

export function DocumentCard({
  title,
  type,
  fileInfo,
  variant,
  onView,
  onDownload,
  className = "",
}: DocumentCardProps) {
  const getIcon = () => {
    if (type === "pdf" || type === "application/pdf") {
      return <FileText className="w-8 h-8 text-red-600" />
    }
    if (type.startsWith("image/") || type === "image") {
      return <ImageIcon className="w-8 h-8 text-green-600" />
    }
    return <File className="w-8 h-8 text-blue-600" />
  }

  const getTypeLabel = () => {
    if (type === "pdf" || type === "application/pdf") return "PDF"
    if (type.startsWith("image/") || type === "image") return "Image"
    return "Document"
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <Card className={`hover:shadow-md transition-shadow ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          {/* Document Icon */}
          <div className="flex-shrink-0">{getIcon()}</div>

          {/* Document Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 truncate" title={title}>
              {title}
            </h4>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">{getTypeLabel()}</span>
              {fileInfo?.size && <span className="text-xs text-gray-500">{formatFileSize(fileInfo.size)}</span>}
            </div>
            {fileInfo?.uploadedAt && (
              <p className="text-xs text-gray-500 mt-1">Uploaded {fileInfo.uploadedAt.toLocaleDateString()}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-2 mt-4">
          {variant === "admin" ? (
            <>
              {onView && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onView}
                  className="flex items-center space-x-1 bg-transparent"
                >
                  <Eye className="w-4 h-4" />
                  <span>View</span>
                </Button>
              )}
              {onDownload && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDownload}
                  className="flex items-center space-x-1 bg-transparent"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </Button>
              )}
            </>
          ) : (
            <>
              {onView && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onView}
                  className="flex items-center space-x-1 bg-transparent"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View</span>
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
