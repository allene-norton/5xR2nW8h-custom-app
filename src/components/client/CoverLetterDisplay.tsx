"use client"

import parse from "html-react-parser"
import { Card, CardContent } from "../ui/card"
import { StatusBadge } from "../shared/StatusBadge"
import { Calendar, MapPin, User, Shield, FileText } from "lucide-react"
import { type BackgroundCheckFormData, FORM_TYPE_INFO, type Status } from "../../types"
import { checkResultTextClass } from "../admin/CheckResultSelect"
import { useCoverLetterTemplate } from "@/hooks/useCoverLetterTemplate"
import { STATUS_LABELS, type CoverLetterTemplate } from "@/types/cover-letter"

interface CoverLetterDisplayProps {
  formData: BackgroundCheckFormData
  /**
   * Pass a template explicitly to preview draft (unsaved) edits — used by the
   * cover letter settings page. Every other caller omits this and the
   * component loads the saved template itself.
   */
  templateOverride?: CoverLetterTemplate
}

const STATUS_STYLES: Record<Status, { text: string; bg: string; border: string }> = {
  cleared: { text: "text-green-700", bg: "bg-green-50", border: "border-green-200" },
  pending: { text: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-200" },
  denied: { text: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
}

export function CoverLetterDisplay({ formData, templateOverride }: CoverLetterDisplayProps) {
  const { template: loadedTemplate } = useCoverLetterTemplate()
  const template = templateOverride ?? loadedTemplate

  const client = formData.client
  const formTypeInfo = FORM_TYPE_INFO[formData.formType]
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  const statusStyle = STATUS_STYLES[formData.status]

  return (
    <Card className="bg-white shadow-lg">
      <CardContent className="p-8">
        {/* Letterhead */}
        <div className="border-b border-gray-200 pb-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center">
                  <img
                  src="/ct-logo.png"
                  alt="CT Logo"
                  className="w-12 h-12 rounded-lg object-contain"
                />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{template.companyName}</h1>
                  <p className="text-gray-600">{template.companyTagline}</p>
                </div>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <h2 className="text-1xl font-bold text-gray-900">{template.heroTagline}</h2>
                <p> Contact Us: {template.contactEmail}</p>
              </div>
            </div>
            <div className="text-right">
              <StatusBadge status={formData.status} size="lg" />
            </div>
          </div>
        </div>

        {/* Letter Content */}
        <div className="space-y-6">
          {/* Date and Reference */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Date: {currentDate}</span>
            </div>
            <div>
              Reference #: BGC-{formData.client.split('-',1)}
            </div>
          </div>

          {/* Recipient Information */}
          {client && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2 flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Applicant Information</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p>
                    <strong>Name:</strong> {formData.identification.firstName} {formData.identification.lastName}
                  </p>
                  <p>
                    <strong>Client:</strong> {formData.identification.firstName}
                  </p>
                  <p>
                    <strong>Form Type:</strong> {formTypeInfo.title}
                  </p>
                </div>
                <div>
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 mt-0.5 text-gray-500" />
                    <div>
                      <p>{formData.identification.streetAddress}</p>
                      {formData.identification.streetAddress2 && <p>{formData.identification.streetAddress2}</p>}
                      <p>
                        {formData.identification.city}, {formData.identification.state}{" "}
                        {formData.identification.postalCode}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Letter Body */}
          <div className="prose prose-gray max-w-none">
            <div className="text-gray-700 leading-relaxed">{parse(template.introParagraphHtml)}</div>

            {/* Background Checks Performed */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-6">
              <h4 className="font-medium text-blue-900 mb-3 flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Background Checks Performed</span>
              </h4>
              <div className="space-y-1.5">
                {formData.backgroundChecks.map((check) => {
                  const result = formData.backgroundCheckFiles?.find(
                    (file) => file.checkName === check,
                  )?.result
                  return (
                    <div key={check} className="flex items-start gap-2 text-sm">
                      <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-600"></div>
                      <span className="flex-1 text-blue-800">{check}</span>
                      <span
                        className={`flex-shrink-0 font-semibold ${checkResultTextClass(result)}`}
                      >
                        {result || '—'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Status-specific content. The label and its color are applied
                here, not stored as part of the editable text — rich text
                edited through the settings page can't carry inline color
                styling reliably, so keeping it structural guarantees the
                color coding can't be broken by an edit. */}
            <div className={`rounded-lg border p-4 my-6 ${statusStyle.bg} ${statusStyle.border}`}>
              <p className={`font-semibold mb-1 ${statusStyle.text}`}>{STATUS_LABELS[formData.status]}</p>
              <div className="text-gray-700 leading-relaxed">
                {parse(template.statusParagraphs[formData.status])}
              </div>
            </div>

            {/* Additional Notes */}
            {formData.memo && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 my-6">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>Additional Notes</span>
                </h4>
                <p className="text-gray-700 text-sm leading-relaxed">{formData.memo}</p>
              </div>
            )}
            <br/>
            <div className="text-gray-700 leading-relaxed">{parse(template.complianceParagraphHtml)}</div>
            <div className="text-gray-700 leading-relaxed">{parse(template.contactParagraphHtml)}</div>
            <br/>

            <div className="text-gray-700 leading-relaxed">{parse(template.closingParagraphHtml)}</div>

            <div className="mt-8 pt-4 border-t border-gray-200">
              <div className="text-gray-700">{parse(template.signatureBlockHtml)}</div>
              <h2 className="text-1xl font-bold text-gray-900">{template.heroTagline}</h2>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-xs text-gray-500">
          <div className="mb-2">{parse(template.confidentialityNoticeHtml)}</div>
        </div>
      </CardContent>
    </Card>
  )
}
