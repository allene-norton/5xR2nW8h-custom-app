import { z } from 'zod';

// The cover letter's editable narrative copy, kept separate from
// BackgroundCheckFormData because it's workspace-wide configuration, not
// per-client data — one template is shared across every report.
//
// What's NOT in here on purpose: applicant name/address, the status badge,
// the background-checks + results table, and the memo. Those are
// structurally generated from a specific report's data and would be too easy
// to break if exposed as free-text HTML, so they stay out of this template
// and are rendered the same way they always have been.
//
// Each paragraph field holds sanitized HTML from the Tiptap editor (see
// sanitize-html.ts) restricted to paragraphs/bold/italic/links/lists — no
// inline styles or color survive a round trip through that editor, which is
// why the status labels (CLEARED/PENDING/DENIED) and their colors are NOT
// part of the editable text; they're rendered programmatically around it so
// editing the explanation text can't silently break the color coding.

export const CoverLetterTemplateSchema = z.object({
  companyName: z.string().min(1).max(200),
  companyTagline: z.string().min(1).max(200),
  heroTagline: z.string().min(1).max(200),
  contactEmail: z.string().min(1).max(200),
  introParagraphHtml: z.string().min(1).max(4000),
  statusParagraphs: z.object({
    cleared: z.string().min(1).max(4000),
    pending: z.string().min(1).max(4000),
    denied: z.string().min(1).max(4000),
  }),
  complianceParagraphHtml: z.string().min(1).max(4000),
  contactParagraphHtml: z.string().min(1).max(4000),
  closingParagraphHtml: z.string().min(1).max(4000),
  signatureBlockHtml: z.string().min(1).max(4000),
  confidentialityNoticeHtml: z.string().min(1).max(4000),
});

export type CoverLetterTemplate = z.infer<typeof CoverLetterTemplateSchema>;

// Matches the copy that was previously hardcoded in CoverLetterDisplay.tsx
// and generateCoverLetterPDF verbatim (minus the status labels' colors,
// which are now applied programmatically — see the note above), so nothing
// changes visually until someone actually edits something on the settings
// page.
export const DEFAULT_COVER_LETTER_TEMPLATE: CoverLetterTemplate = {
  companyName: 'ClearTech',
  companyTagline: 'Background Checks and Security Consulting',
  heroTagline: 'A People-Focused Approach to Screening',
  contactEmail: 'admin@cleartechbackground.com',
  introParagraphHtml:
    '<p>We are pleased to provide you with the results of your background screening conducted by ClearTech Background Services. This comprehensive screening was performed in accordance with the requirements for the State of Illinois and includes the background checks listed below:</p>',
  statusParagraphs: {
    cleared:
      '<p>The results of this screening <strong>have been successfully completed and cleared</strong>. If you have any questions or would like additional information regarding these results, please contact our office.</p>',
    pending:
      '<p>Your background screening is currently in progress. We are awaiting responses from one or more verification sources. We will notify you as soon as the screening is complete.</p>',
    denied:
      '<p>Your background screening has revealed information that does not meet the required standards for this application. If you believe this information is incorrect, please contact us immediately to discuss the dispute process.</p>',
  },
  complianceParagraphHtml:
    '<p>This background screening was conducted in compliance with the Fair Credit Reporting Act (FCRA) and all applicable state and local laws.</p>',
  contactParagraphHtml:
    '<p>If you have any questions about these results or need additional information, please contact our office at admin@cleartechbackground.com.</p>',
  closingParagraphHtml:
    '<p>Thank you for choosing ClearTech Background Services.</p>',
  signatureBlockHtml: '<p>Sincerely,</p><p><strong>ClearTech Admin Team</strong></p>',
  confidentialityNoticeHtml:
    '<p><strong>Confidentiality Notice:</strong> This document contains confidential and privileged information. If you are not the intended recipient, please notify the sender immediately and destroy this document.</p>',
};

export const STATUS_LABELS: Record<'cleared' | 'pending' | 'denied', string> = {
  cleared: 'CLEARED',
  pending: 'PENDING',
  denied: 'DENIED',
};
