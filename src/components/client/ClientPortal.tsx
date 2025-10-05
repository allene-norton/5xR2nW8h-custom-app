"use client"

import type { FormData } from "../../types"
import { CoverLetterDisplay } from "./CoverLetterDisplay"
import { ClientDocumentsDisplay } from "./ClientDocumentsDisplay"

interface ClientPortalProps {
  formData: FormData
}

export function ClientPortal({ formData }: ClientPortalProps) {
  return (
    <div className="space-y-8">
      {/* Cover Letter */}
      <CoverLetterDisplay formData={formData} />

      {/* Client Documents */}
      <ClientDocumentsDisplay clientId={formData.client} />
    </div>
  )
}
