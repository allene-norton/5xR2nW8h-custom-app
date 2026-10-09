import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { PDFDocument } from 'pdf-lib';
import {
  FORM_TYPE_INFO,
  type BackgroundCheckFormData,
  type CheckResult,
} from '@/types';
import {
  detectFileType,
  describeFileType,
  isImageType,
  type DetectedFileType,
} from '@/lib/file-type';

/** Color used for a check result in the report. */
function getCheckResultColor(result?: CheckResult): string {
  switch (result) {
    case 'Cleared':
    case 'No Records Found':
      return '#047857';
    case 'Records Found':
      return '#b91c1c';
    case 'Under Review':
    case 'Pending':
      return '#b45309';
    case 'Not Applicable':
      return '#6b7280';
    default:
      return '#1e40af';
  }
}

async function imageToBase64(imagePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = img.width;
      canvas.height = img.height;

      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const base64 = canvas.toDataURL('image/png');
        resolve(base64);
      } else {
        reject(new Error('Could not get canvas context'));
      }
    };

    img.onerror = () => {
      reject(new Error('Could not load image'));
    };

    img.src = imagePath;
  });
}

export async function generateCoverLetterPDF(
  formData: BackgroundCheckFormData,
): Promise<Blob> {
  // Convert logo to base64 first
  const logoSrc = `${window.location.origin}/ct-logo.png`;
  let logoBase64 = '';

  try {
    logoBase64 = await imageToBase64(logoSrc);
    console.log('Logo converted to base64 successfully');
  } catch (error) {
    console.error('Failed to convert logo to base64:', error);
    throw new Error(
      'Could not load the required logo image. Please ensure ct-logo.png exists in the public folder.',
    );
  }

  // Create a completely isolated iframe for PDF generation
  const iframe = document.createElement('iframe');
  iframe.style.cssText = `
    position: fixed !important;
    top: -10000px !important;
    left: -10000px !important;
    width: 800px !important;
    height: 1200px !important;
    border: none !important;
    visibility: hidden !important;
  `;

  document.body.appendChild(iframe);

  try {
    // Wait for iframe to load
    await new Promise((resolve) => {
      iframe.onload = resolve;
      iframe.src = 'about:blank';
    });

    const iframeDoc = iframe.contentDocument;
    if (!iframeDoc) {
      throw new Error('Unable to access iframe document');
    }

    // Write the HTML document
    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            color: #000000;
            background-color: transparent;
            font-family: Arial, sans-serif;
          }
          body {
            background-color: white;
            font-family: Arial, sans-serif;
            color: #000000;
          }
          .pdf-container {
            width: 754px;
            min-height: 1083px;
            background-color: white;
            padding: 40px;
            box-sizing: content-box;
            font-family: Arial, sans-serif;
            color: #000000;
          }
          .logo-img {
            width: 48px;
            height: 48px;
            border-radius: 8px;
            margin-right: 12px;
          }
        </style>
      </head>
      <body>
        <div class="pdf-container" id="pdf-content">
          <!-- Content will be inserted here -->
        </div>
      </body>
      </html>
    `);
    iframeDoc.close();

    // Wait for document to be ready
    await new Promise((resolve) => setTimeout(resolve, 100));

    const container = iframeDoc.getElementById('pdf-content');
    if (!container) {
      throw new Error('Unable to find PDF container in iframe');
    }

    // Generate the content with base64 embedded logo
    const client = formData.client;
    const formTypeInfo = FORM_TYPE_INFO[formData.formType];
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    container.innerHTML = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #374151;">
        <!-- Letterhead -->
        <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 24px; margin-bottom: 32px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <img src="${logoBase64}" alt="CT Logo" class="logo-img">
                <div>
                  <h1 style="font-size: 24px; font-weight: bold; margin: 0; color: #111827;">ClearTech</h1>
                  <p style="margin: 0; color: #6b7280;">Background Checks and Security Consulting</p>
                </div>
              </div>
              <h2 style="font-size: 20px; font-weight: bold; margin: 0; color: #111827;">A People-Focused Approach to Screening</h2>
              <p style="font-size: 14px; color: #6b7280; margin: 4px 0;">Contact Us: admin@cleartechbackground.com</p>
            </div>
            <div style="background: ${getStatusColor(formData.status)}; padding: 8px 16px; border-radius: 8px; color: white; font-weight: 600; text-transform: uppercase;">
              ${formData.status}
            </div>
          </div>
        </div>

        <!-- Date and Reference -->
        <div style="display: flex; justify-content: space-between; font-size: 14px; color: #6b7280; margin-bottom: 24px;">
          <span>Date: ${currentDate}</span>
          <span>Reference #: BGC-${formData.client.split('-', 1)}</span>
        </div>

        <!-- Applicant Information -->
        ${
          client
            ? `
          <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
            <h3 style="font-weight: 600; color: #111827; margin-bottom: 16px;">Applicant Information</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 14px;">
              <div>
                <p><strong>Name:</strong> ${formData.identification.firstName} ${formData.identification.lastName}</p>
                <p><strong>Client:</strong> ${formData.identification.firstName}</p>
                <p><strong>Form Type:</strong> ${formTypeInfo.title}</p>
              </div>
              <div>
                <p>${formData.identification.streetAddress}</p>
                ${formData.identification.streetAddress2 ? `<p>${formData.identification.streetAddress2}</p>` : ''}
                <p>${formData.identification.city}, ${formData.identification.state} ${formData.identification.postalCode}</p>
              </div>
            </div>
          </div>
        `
            : ''
        }

        <!-- Letter Body -->
        <div style="line-height: 1.8;">
          <!-- <p>Dear ${formData.identification.firstName} ${formData.identification.lastName},</p> -->
          
          <p>We are pleased to provide you with the results of your background screening conducted by ClearTech
          Background Services. This comprehensive screening was performed in accordance with the requirements for
          the State of Illinois and includes the background checks listed below:</p>

          <!-- Background Checks -->
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <h4 style="font-weight: 600; color: #1e40af; margin-bottom: 12px;">Background Checks Performed</h4>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              ${formData.backgroundChecks
                .map((check) => {
                  const result = formData.backgroundCheckFiles?.find(
                    (file) => file.checkName === check,
                  )?.result;
                  return `
                <tr>
                  <td style="padding: 4px 8px 4px 0; vertical-align: top; width: 14px;">
                    <div style="width: 8px; height: 8px; background: #2563eb; border-radius: 50%; margin-top: 6px;"></div>
                  </td>
                  <td style="padding: 4px 8px 4px 0; vertical-align: top; color: #1e40af;">${check}</td>
                  <td style="padding: 4px 0; vertical-align: top; text-align: right; white-space: nowrap; font-weight: 600; color: ${getCheckResultColor(
                    result,
                  )};">${result || '—'}</td>
                </tr>
              `;
                })
                .join('')}
            </table>
          </div>

          <!-- Status Content -->
          ${getStatusContent(formData.status)}

          <!-- Additional Notes -->
          ${
            formData.memo
              ? `
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 24px 0;">
              <h4 style="font-weight: 600; color: #111827; margin-bottom: 8px;">Additional Notes</h4>
              <p style="color: #374151; font-size: 14px; line-height: 1.6;">${formData.memo}</p>
            </div>
          `
              : ''
          }

          <br>
          <p>This background screening was conducted in compliance with the Fair Credit Reporting Act (FCRA) and all
          applicable state and local laws.</p>
          
          <p>If you have any questions about these results or need additional
          information, please contact our office at admin@cleartechbackground.com.</p>
          
          <br>
          <p>Thank you for choosing ClearTech Background Services.</p>

          <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
            <p>
              Sincerely,<br><br>
              <strong>ClearTech Admin Team</strong><br>
              <h2 style="font-size: 20px; font-weight: bold; margin: 0; color: #111827;">A People-Focused Approach to Screening</h2>
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
          <p style="margin-bottom: 8px;">
            <strong>Confidentiality Notice:</strong> This document contains confidential and privileged information. If
            you are not the intended recipient, please notify the sender immediately and destroy this document.
          </p>
        </div>
      </div>
    `;

    // Wait for content to render
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Generate canvas from the clean iframe
    const canvas = await html2canvas(container, {
      scale: 1,
      useCORS: false, // Not needed since we're using base64
      allowTaint: false, // Not needed since we're using base64
      backgroundColor: '#ffffff',
      logging: false,
      foreignObjectRendering: true,
    });

    // Verify canvas
    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error('Failed to generate canvas from HTML content');
    }

    const imgData = canvas.toDataURL('image/png', 1.0);

    if (
      !imgData ||
      imgData === 'data:,' ||
      !imgData.startsWith('data:image/png;base64,')
    ) {
      throw new Error('Failed to generate valid PNG data from canvas');
    }

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const marginMM = 10;
    const availableWidth = pdfWidth - 2 * marginMM;
    const availableHeight = pdfHeight - 2 * marginMM;

    const canvasAspectRatio = canvas.width / canvas.height;
    const availableAspectRatio = availableWidth / availableHeight;

    let finalWidth, finalHeight;

    if (canvasAspectRatio > availableAspectRatio) {
      finalWidth = availableWidth;
      finalHeight = availableWidth / canvasAspectRatio;
    } else {
      finalHeight = availableHeight;
      finalWidth = availableHeight * canvasAspectRatio;
    }

    const xOffset = marginMM + (availableWidth - finalWidth) / 2;
    const yOffset = marginMM + (availableHeight - finalHeight) / 2;

    pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight);

    return pdf.output('blob');
  } finally {
    // Clean up iframe
    if (iframe && iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'cleared':
      return '#059669';
    case 'pending':
      return '#d97706';
    case 'denied':
      return '#dc2626';
    default:
      return '#6b7280';
  }
}

function getStatusContent(status: string): string {
  switch (status) {
    case 'cleared':
      return `<p><strong style="color: #059669;">CLEARED:</strong> The results of this screening <strong>have been successfully completed and cleared</strong>. If you have any questions or would like additional information regarding these results, please contact our office.
</p>`;
    case 'pending':
      return `<p><strong style="color: #d97706;">PENDING:</strong> Your background screening is currently in
      progress. We are awaiting responses from one or more verification sources. We will notify you as soon as
      the screening is complete.</p>`;
    case 'denied':
      return `<p><strong style="color: #dc2626;">DENIED:</strong> Your background screening has revealed information
      that does not meet the required standards for this application. If you believe this information is
      incorrect, please contact us immediately to discuss the dispute process.</p>`;
    default:
      return '';
  }
}

// A4 portrait in PDF points, with ~10mm margins, matching the cover letter.
const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;
const PAGE_MARGIN_PT = 28.35;

/**
 * Re-encode an image the browser can decode but pdf-lib cannot embed
 * (GIF/WebP/BMP, or HEIC on Safari) into PNG bytes.
 */
async function reencodeImageToPng(blob: Blob): Promise<Uint8Array> {
  if (typeof createImageBitmap !== 'function') {
    throw new Error('This browser cannot decode the image format');
  }

  const bitmap = await createImageBitmap(blob);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    // Flatten transparency onto white so scanned IDs do not come out black.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0);

    const pngBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png'),
    );
    if (!pngBlob) throw new Error('Could not re-encode image as PNG');

    return new Uint8Array(await pngBlob.arrayBuffer());
  } finally {
    bitmap.close?.();
  }
}

/**
 * Wrap a single image in a one-page A4 PDF, scaled to fit and centered.
 *
 * JPEG and PNG are embedded straight from their bytes by pdf-lib, so this does
 * not depend on the browser being able to render the image into an <img> tag —
 * that dependency was the reason government ID photos silently went missing.
 */
export async function imageToPDF(
  bytes: Uint8Array,
  detected: DetectedFileType,
  sourceBlob: Blob,
): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();

  let image;
  if (detected === 'jpeg') {
    image = await pdfDoc.embedJpg(bytes);
  } else if (detected === 'png') {
    image = await pdfDoc.embedPng(bytes);
  } else {
    image = await pdfDoc.embedPng(await reencodeImageToPng(sourceBlob));
  }

  const page = pdfDoc.addPage([A4_WIDTH_PT, A4_HEIGHT_PT]);
  const availableWidth = A4_WIDTH_PT - 2 * PAGE_MARGIN_PT;
  const availableHeight = A4_HEIGHT_PT - 2 * PAGE_MARGIN_PT;

  // Fill as much of the page as the aspect ratio allows, so a photographed ID
  // is as legible as possible in the printed packet.
  const scale = Math.min(
    availableWidth / image.width,
    availableHeight / image.height,
  );
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;

  page.drawImage(image, {
    x: (A4_WIDTH_PT - drawWidth) / 2,
    y: (A4_HEIGHT_PT - drawHeight) / 2,
    width: drawWidth,
    height: drawHeight,
  });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}

export type PreparedFile =
  | { ok: true; pdf: Blob; detected: DetectedFileType }
  | { ok: false; reason: string; detected: DetectedFileType };

/**
 * Turn any submitted document into a PDF ready to merge into the packet.
 *
 * The file's type is determined from its own bytes rather than the
 * Content-Type header, which is unreliable for both form attachments (served
 * from storage as `application/octet-stream`) and files uploaded through this
 * app (always PUT as `application/pdf`).
 *
 * Returns an explicit failure reason instead of null so the caller can tell
 * staff which document did not make it into the packet.
 */
export async function prepareFileForPDF(
  blob: Blob,
  fileName?: string,
): Promise<PreparedFile> {
  const label = fileName || 'unknown file';

  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(await blob.arrayBuffer());
  } catch (error) {
    return {
      ok: false,
      detected: 'unknown',
      reason: 'Could not read the file contents',
    };
  }

  if (bytes.length === 0) {
    return { ok: false, detected: 'unknown', reason: 'File is empty' };
  }

  const detected = detectFileType(bytes);

  if (detected === 'pdf') {
    // Load it here so a corrupt PDF fails on its own rather than aborting the
    // whole merge further down.
    try {
      await PDFDocument.load(bytes, { ignoreEncryption: true });
    } catch (error) {
      return {
        ok: false,
        detected,
        reason: `PDF could not be read (it may be corrupt or password protected): ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      };
    }
    return { ok: true, pdf: blob, detected };
  }

  if (isImageType(detected)) {
    try {
      const pdf = await imageToPDF(bytes, detected, blob);
      return { ok: true, pdf, detected };
    } catch (error) {
      const base = `${describeFileType(detected)} could not be converted`;
      const hint =
        detected === 'heic'
          ? '. HEIC photos from iPhones are not supported by most browsers — ask the applicant to re-upload as JPEG or PNG, or convert it before adding it to the packet'
          : detected === 'tiff'
            ? '. TIFF images are not supported by most browsers — convert it to JPEG or PDF first'
            : '';
      console.error(`Failed to convert ${label}:`, error);
      return { ok: false, detected, reason: `${base}${hint}` };
    }
  }

  return {
    ok: false,
    detected,
    reason:
      'File is not a PDF or a supported image. It may have failed to upload, or be a format this report cannot embed',
  };
}

export async function mergePDFs(pdfBlobs: Blob[]): Promise<Blob> {
  const mergedPdf = await PDFDocument.create();

  for (const blob of pdfBlobs) {
    const arrayBuffer = await blob.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer, {
      ignoreEncryption: true,
    });
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  const pdfBytes = await mergedPdf.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}
