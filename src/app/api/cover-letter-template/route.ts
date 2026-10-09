// app/api/cover-letter-template/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  CoverLetterTemplateSchema,
  DEFAULT_COVER_LETTER_TEMPLATE,
} from '@/types/cover-letter';
import {
  getCoverLetterTemplate,
  saveCoverLetterTemplate,
} from '@/lib/upstash-storage';
import { sanitizeRichTextHtml, sanitizePlainText } from '@/lib/sanitize-html';

export async function GET() {
  try {
    const stored = await getCoverLetterTemplate();
    return NextResponse.json(stored || DEFAULT_COVER_LETTER_TEMPLATE);
  } catch (error) {
    console.error('Error fetching cover letter template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cover letter template' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Sanitize before validating: plain-text fields have markup stripped
    // entirely, rich-text fields are cut down to the allowlisted vocabulary
    // the editor (and the renderers that consume this) actually support.
    // This runs server-side regardless of what the settings page UI already
    // restricts, since the UI isn't the only thing that can reach this route.
    const sanitized = {
      companyName: sanitizePlainText(body?.companyName ?? ''),
      companyTagline: sanitizePlainText(body?.companyTagline ?? ''),
      heroTagline: sanitizePlainText(body?.heroTagline ?? ''),
      contactEmail: sanitizePlainText(body?.contactEmail ?? ''),
      introParagraphHtml: sanitizeRichTextHtml(body?.introParagraphHtml ?? ''),
      statusParagraphs: {
        cleared: sanitizeRichTextHtml(body?.statusParagraphs?.cleared ?? ''),
        pending: sanitizeRichTextHtml(body?.statusParagraphs?.pending ?? ''),
        denied: sanitizeRichTextHtml(body?.statusParagraphs?.denied ?? ''),
      },
      complianceParagraphHtml: sanitizeRichTextHtml(
        body?.complianceParagraphHtml ?? '',
      ),
      contactParagraphHtml: sanitizeRichTextHtml(
        body?.contactParagraphHtml ?? '',
      ),
      closingParagraphHtml: sanitizeRichTextHtml(
        body?.closingParagraphHtml ?? '',
      ),
      signatureBlockHtml: sanitizeRichTextHtml(body?.signatureBlockHtml ?? ''),
      confidentialityNoticeHtml: sanitizeRichTextHtml(
        body?.confidentialityNoticeHtml ?? '',
      ),
    };

    const validated = CoverLetterTemplateSchema.safeParse(sanitized);
    if (!validated.success) {
      console.error(
        'Cover letter template validation error:',
        JSON.stringify(validated.error.issues, null, 2),
      );
      return NextResponse.json(
        { error: 'Invalid template', details: validated.error },
        { status: 400 },
      );
    }

    await saveCoverLetterTemplate(validated.data);
    return NextResponse.json({ success: true, data: validated.data });
  } catch (error) {
    console.error('Error saving cover letter template:', error);
    return NextResponse.json(
      { error: 'Failed to save cover letter template' },
      { status: 500 },
    );
  }
}
