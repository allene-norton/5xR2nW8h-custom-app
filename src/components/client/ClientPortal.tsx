"use client"

import type { BackgroundCheckFormData } from "../../types"
import { CoverLetterDisplay } from "./CoverLetterDisplay"
import { ClientDocumentsDisplay } from "./ClientDocumentsDisplay"
import { ListFilesResponse } from "@/lib/actions/client-actions"

interface ClientPortalProps {
  formData: BackgroundCheckFormData
  reportFiles: ListFilesResponse
}

export function ClientPortal({ formData, reportFiles }: ClientPortalProps) {
  return (
    <div className="space-y-8">
      {/* Cover Letter */}
      <CoverLetterDisplay formData={formData} />

      {/* Client Documents */}
      <ClientDocumentsDisplay clientId={formData.client} fileChannelId={formData.fileChannelId} reportFiles={reportFiles} />
    </div>
  )
}
