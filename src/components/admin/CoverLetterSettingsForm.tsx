'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Save, CheckCircle, AlertTriangle, RotateCcw } from 'lucide-react';
import { RichTextField } from '@/components/admin/RichTextField';
import { CoverLetterDisplay } from '@/components/client/CoverLetterDisplay';
import { useCoverLetterTemplate } from '@/hooks/useCoverLetterTemplate';
import type { CoverLetterTemplate } from '@/types/cover-letter';
import { DEFAULT_FORM_DATA, type Status } from '@/types';

// Sample data so editors see the letter laid out with realistic content —
// name, address, a full set of checks with results — without touching any
// real client's report.
const PREVIEW_STATUSES: Status[] = ['cleared', 'pending', 'denied'];
function buildSampleFormData(status: Status) {
  return {
    ...DEFAULT_FORM_DATA,
    client: 'sample-client-0001',
    formType: 'employment' as const,
    status,
    identification: {
      ...DEFAULT_FORM_DATA.identification,
      firstName: 'Jordan',
      lastName: 'Sample',
      streetAddress: '123 Main St',
      city: 'Chicago',
      state: 'IL',
      postalCode: '60601',
    },
    backgroundChecks: [
      'Criminal History Clearance',
      'Personal Wellness Assessment',
      'Chicago Police Clearance',
      'FBI Clearance',
    ],
    backgroundCheckFiles: [
      { checkName: 'Criminal History Clearance', fileUploaded: true, result: 'No Records Found' as const },
      { checkName: 'Personal Wellness Assessment', fileUploaded: true, result: 'Cleared' as const },
      { checkName: 'Chicago Police Clearance', fileUploaded: true, result: 'No Records Found' as const },
      { checkName: 'FBI Clearance', fileUploaded: true, result: 'Pending' as const },
    ],
    memo: 'This is a sample note to show how the Additional Notes section looks.',
  };
}

export function CoverLetterSettingsForm() {
  const { template, isLoading, loadError, isSaving, saveError, saveTemplate } =
    useCoverLetterTemplate();
  const [draft, setDraft] = useState<CoverLetterTemplate | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [previewStatus, setPreviewStatus] = useState<Status>('cleared');

  // Seed the draft once the real template has loaded, so edits start from
  // the saved content rather than the hardcoded defaults flashing briefly.
  useEffect(() => {
    if (!isLoading && draft === null) {
      setDraft(template);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  if (isLoading || !draft) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cover letter template...</p>
        </div>
      </div>
    );
  }

  const update = (updates: Partial<CoverLetterTemplate>) => {
    setDraft((prev) => (prev ? { ...prev, ...updates } : prev));
    setSavedAt(null);
  };

  const updateStatusParagraph = (status: Status, html: string) => {
    if (!draft) return;
    update({
      statusParagraphs: { ...draft.statusParagraphs, [status]: html },
    });
  };

  const handleSave = async () => {
    if (!draft) return;
    try {
      const saved = await saveTemplate(draft);
      setDraft(saved);
      setSavedAt(new Date());
    } catch {
      // saveError from the hook already covers this; nothing else to do.
    }
  };

  const handleResetToSaved = () => {
    setDraft(template);
    setSavedAt(null);
  };

  const sampleFormData = buildSampleFormData(previewStatus);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
      {/* Editor */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Letterhead</CardTitle>
            </div>
            <CardDescription>
              Company name, tagline, and contact email shown at the top (and
              bottom) of every report.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="companyName" className="text-sm font-medium text-gray-900">
                Company Name
              </Label>
              <Input
                id="companyName"
                value={draft.companyName}
                onChange={(e) => update({ companyName: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="companyTagline" className="text-sm font-medium text-gray-900">
                Company Subtitle
              </Label>
              <Input
                id="companyTagline"
                value={draft.companyTagline}
                onChange={(e) => update({ companyTagline: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="heroTagline" className="text-sm font-medium text-gray-900">
                Tagline
              </Label>
              <Input
                id="heroTagline"
                value={draft.heroTagline}
                onChange={(e) => update({ heroTagline: e.target.value })}
              />
              <p className="text-xs text-gray-500">
                Appears at the top of the letter and again near the signature.
              </p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="contactEmail" className="text-sm font-medium text-gray-900">
                Contact Email
              </Label>
              <Input
                id="contactEmail"
                value={draft.contactEmail}
                onChange={(e) => update({ contactEmail: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Letter Body</CardTitle>
            <CardDescription>
              The narrative copy. Applicant name/address, the status badge,
              and the checks + results table are generated per report and
              aren&apos;t edited here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <RichTextField
              label="Introduction"
              description="Appears right after the applicant's information, before the list of checks performed."
              value={draft.introParagraphHtml}
              onChange={(html) => update({ introParagraphHtml: html })}
            />

            <div className="space-y-2 rounded-lg border border-gray-200 p-3">
              <Label className="text-sm font-medium text-gray-900">
                Status Explanations
              </Label>
              <p className="text-xs text-gray-500">
                Shown below the checks table. The CLEARED / PENDING / DENIED
                label and its color are applied automatically — only the
                explanation text below it is edited here.
              </p>
              <Tabs
                value={previewStatus}
                onValueChange={(value) => setPreviewStatus(value as Status)}
              >
                <TabsList>
                  {PREVIEW_STATUSES.map((status) => (
                    <TabsTrigger key={status} value={status} className="capitalize">
                      {status}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {PREVIEW_STATUSES.map((status) => (
                  <TabsContent key={status} value={status} className="pt-3">
                    <RichTextField
                      label={`${status.charAt(0).toUpperCase() + status.slice(1)} explanation`}
                      value={draft.statusParagraphs[status]}
                      onChange={(html) => updateStatusParagraph(status, html)}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </div>

            <RichTextField
              label="Compliance Statement"
              description="The FCRA / applicable-law paragraph."
              value={draft.complianceParagraphHtml}
              onChange={(html) => update({ complianceParagraphHtml: html })}
            />

            <RichTextField
              label="Contact Paragraph"
              value={draft.contactParagraphHtml}
              onChange={(html) => update({ contactParagraphHtml: html })}
            />

            <RichTextField
              label="Closing"
              description='E.g. "Thank you for choosing..."'
              value={draft.closingParagraphHtml}
              onChange={(html) => update({ closingParagraphHtml: html })}
            />

            <RichTextField
              label="Signature Block"
              description='E.g. "Sincerely, ClearTech Admin Team"'
              value={draft.signatureBlockHtml}
              onChange={(html) => update({ signatureBlockHtml: html })}
            />

            <RichTextField
              label="Confidentiality Notice"
              description="Shown in the footer of every report."
              value={draft.confidentialityNoticeHtml}
              onChange={(html) => update({ confidentialityNoticeHtml: html })}
            />
          </CardContent>
        </Card>

        <div className="flex items-center gap-3 sticky bottom-4 bg-white/95 backdrop-blur border rounded-lg p-4 shadow-lg">
          <Button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
          </Button>
          <Button
            variant="outline"
            onClick={handleResetToSaved}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset to Saved</span>
          </Button>
          <div className="flex items-center gap-2 text-sm">
            {saveError ? (
              <>
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-red-600">{saveError}</span>
              </>
            ) : savedAt ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-gray-600">Saved</span>
              </>
            ) : loadError ? (
              <>
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <span className="text-yellow-700">
                  Couldn&apos;t load the saved template — showing defaults
                </span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Live preview */}
      <div className="xl:sticky xl:top-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">Preview</h3>
          <Badge variant="outline" className="text-xs capitalize">
            {previewStatus} example
          </Badge>
        </div>
        <div className="max-h-[85vh] overflow-y-auto rounded-lg">
          <CoverLetterDisplay formData={sampleFormData} templateOverride={draft} />
        </div>
      </div>
    </div>
  );
}
