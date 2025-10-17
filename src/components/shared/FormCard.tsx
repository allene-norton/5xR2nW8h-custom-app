"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, ExternalLink } from "lucide-react"
import { FormResponse, FormResponseArray } from "@/lib/actions/client-actions"

// interface FormCardProps {
//   title: string
//   responseUrl?: string
//   fileUrl?: string
//   onResponseClick?: () => void
//   onFileClick?: () => void
// }

interface FormCardProps {
  formResponse: FormResponse;
  variant?: 'admin' | 'client'; // or whatever variants you have
  onResponseClick?: () => void;
  onFileClick?: () => void;
}

export function FormCard({ formResponse, onResponseClick, onFileClick }: FormCardProps) {
  // const handleResponseClick = () => {
  //   if (responseUrl) {
  //     window.open(responseUrl, "_blank")
  //   }
  //   onResponseClick?.()
  // }

  // const handleFileClick = () => {
  //   if (fileUrl) {
  //     window.open(fileUrl, "_blank")
  //   }
  //   onFileClick?.()
  // }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          {formResponse.formName}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex gap-2">
        {/* <Button variant="outline" size="sm" onClick={handleResponseClick} className="flex-1 bg-transparent">
          <ExternalLink className="h-4 w-4 mr-2" />
          Form Response
        </Button>
        <Button variant="outline" size="sm" onClick={handleFileClick} className="flex-1 bg-transparent">
          <ExternalLink className="h-4 w-4 mr-2" />
          View File
        </Button> */}
      </CardContent>
    </Card>
  )
}
