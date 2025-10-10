"use client"

import type { FormData } from "../../types"
import { ConfigurationSection } from "./ConfigurationSection"
import { ApplicantInfoSection } from "./ApplicantInfoSection"
import { BackgroundChecksSection } from "./BackgroundChecksSection"
import { CustomChecksSection } from "@/components/admin/CustomChecksSection"
import { StatusSection } from "./StatusSection"
import { FileUploadSection } from "./FileUploadSection"
import { SubmittedDocumentsSection } from "./SubmittedDocumentsSection"

interface AdminInterfaceProps {
  formData: FormData
  updateFormData: (updates: Partial<FormData>) => void
  updateIdentification: (updates: Partial<FormData["identification"]>) => void
  resetFormData: () => void
}

export function AdminInterface({ formData, updateFormData, updateIdentification, resetFormData }: AdminInterfaceProps) {
  return (
    <div className="space-y-8">
      {/* Configuration Section */}
      <ConfigurationSection formData={formData} updateFormData={updateFormData} />

      {/* Applicant Information */}
      <ApplicantInfoSection identification={formData.identification} updateIdentification={updateIdentification} />

      {/* Background Checks */}
      <BackgroundChecksSection
        formType={formData.formType}
        selectedChecks={formData.backgroundChecks}
        updateFormData={updateFormData}
      />

      {/* Custom Checks */}
      <CustomChecksSection
        formType={formData.formType}
        selectedChecks={formData.backgroundChecks}
        updateFormData={updateFormData}
      />

      {/* Status and Memo */}
      <StatusSection status={formData.status} memo={formData.memo} updateFormData={updateFormData} />

      {/* File Upload */}
      <FileUploadSection uploadedFile={formData.uploadedFile} updateFormData={updateFormData} />

      {/* Submitted Documents */}
      <SubmittedDocumentsSection clientId={formData.client} />
    </div>
  )
}


// test new remote