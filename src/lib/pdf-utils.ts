import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { PDFDocument } from 'pdf-lib';
import  { FORM_TYPE_INFO, type BackgroundCheckFormData } from '@/types';

export async function generateCoverLetterPDF(formData: BackgroundCheckFormData): Promise<Blob> {
  // Create a temporary div with the cover letter content
  const tempDiv = document.createElement('div');
  // Use pixel dimensions that html2canvas can handle properly
  // A4 at 96 DPI: 794x1123 pixels, with padding
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.width = '754px'; // 794px - 40px padding
  tempDiv.style.minHeight = '1083px'; // 1123px - 40px padding  
  tempDiv.style.backgroundColor = 'white';
  tempDiv.style.padding = '40px';
  tempDiv.style.boxSizing = 'content-box';
  tempDiv.style.fontFamily = 'Arial, sans-serif';
  tempDiv.style.color = '#000000';

  // Add CSS reset to prevent oklch and other problematic styles
  // tempDiv.style.cssText = `
  //   position: absolute;
  //   left: -9999px;
  //   width: 210mm;
  //   min-height: 297mm;
  //   background-color: white;
  //   padding: 20mm;
  //   box-sizing: border-box;
  //   font-family: Arial, sans-serif;
  //   color: #000000;
  //   all: initial;
  //   * {
  //     all: unset;
  //     display: revert;
  //     box-sizing: border-box;
  //   }
  // `;
  
  // Generate the cover letter HTML (replicating CoverLetterDisplay logic)
  const client = formData.client;
  const formTypeInfo = FORM_TYPE_INFO[formData.formType];
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long", 
    day: "numeric",
  });

  tempDiv.innerHTML = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #374151;">
      <!-- Letterhead -->
      <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 24px; margin-bottom: 32px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <img src="/ct-logo.png" alt="CT Logo" style="width: 48px; height: 48px; margin-right: 12px; border-radius: 8px;">
              <div>
                <h1 style="font-size: 24px; font-weight: bold; margin: 0; color: #111827;">ClearTech</h1>
                <p style="margin: 0; color: #6b7280;">Background Checks and Security Consulting</p>
              </div>
            </div>
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
        <span>Reference #: BGC-${formData.client.split('-',1)}</span>
      </div>

      <!-- Applicant Information -->
      ${client ? `
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
      ` : ''}

      <!-- Letter Body -->
      <div style="line-height: 1.8;">
        <p>Dear ${formData.identification.firstName} ${formData.identification.lastName},</p>
        
        <p>We are pleased to provide you with the results of your background screening conducted by ClearTech
        Background Services. This comprehensive screening was performed in accordance with the requirements for
        <strong>${formTypeInfo.title.toLowerCase()}</strong> and includes the background checks listed below.</p>

        <!-- Background Checks -->
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <h4 style="font-weight: 600; color: #1e40af; margin-bottom: 12px;">Background Checks Performed</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            ${formData.backgroundChecks.map(check => `
              <div style="display: flex; align-items: center; font-size: 14px;">
                <div style="width: 8px; height: 8px; background: #2563eb; border-radius: 50%; margin-right: 8px;"></div>
                <span style="color: #1e40af;">${check}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Status Content -->
        ${getStatusContent(formData.status)}

        <!-- Additional Notes -->
        ${formData.memo ? `
          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <h4 style="font-weight: 600; color: #111827; margin-bottom: 8px;">Additional Notes</h4>
            <p style="color: #374151; font-size: 14px; line-height: 1.6;">${formData.memo}</p>
          </div>
        ` : ''}

        <br>
        <p>This background screening was conducted in compliance with the Fair Credit Reporting Act (FCRA) and all
        applicable state and local laws.</p>
        
        <p>If you have any questions about these results or need additional
        information, please contact our office at admin@cleartechbackground.com</p>
        
        <br>
        <p>Thank you for choosing ClearTech Background Services.</p>

        <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
          <p>
            Sincerely,<br><br>
            <strong>ClearTech Background Services Team</strong><br>
            <span style="font-size: 14px; color: #6b7280;">Professional Background Screening Division</span>
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

  document.body.appendChild(tempDiv);

  // Wait for any images to load
  await new Promise(resolve => setTimeout(resolve, 100));

  try {
    // Convert to canvas then PDF with additional options
    const canvas = await html2canvas(tempDiv, {
      scale: 1, // Reduce scale to avoid memory issues
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: tempDiv.offsetWidth,
      height: tempDiv.offsetHeight,
      ignoreElements: (element) => {
        // Skip elements that might have problematic styles
        if (element instanceof HTMLElement) {
          return !!(element.style?.color?.includes('oklch'));
        }
        return false;
      },
      onclone: (clonedDoc) => {
        // Remove any stylesheets that might contain oklch
        const stylesheets = clonedDoc.querySelectorAll('link[rel="stylesheet"], style');
        stylesheets.forEach(sheet => {
          if (sheet.textContent && sheet.textContent.includes('oklch')) {
            sheet.remove();
          }
        });
        
        // Add safe CSS reset to cloned document
        const style = clonedDoc.createElement('style');
        style.textContent = `
          * {
            color: #000000 !important;
            background-color: transparent !important;
          }
          body * {
            font-family: Arial, sans-serif !important;
          }
        `;
        clonedDoc.head.appendChild(style);
      }
    });

    // Verify canvas was created properly
    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error('Failed to generate canvas from HTML content');
    }

    const imgData = canvas.toDataURL('image/png', 1.0);
    
    // Verify the image data is valid
    if (!imgData || imgData === 'data:,' || !imgData.startsWith('data:image/png;base64,')) {
      throw new Error('Failed to generate valid PNG data from canvas');
    }

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Calculate dimensions to fit the page with margins
    const marginMM = 10; // 10mm margins
    const availableWidth = pdfWidth - (2 * marginMM);
    const availableHeight = pdfHeight - (2 * marginMM);
    
    // Scale to fit within available space while maintaining aspect ratio
    const canvasAspectRatio = canvas.width / canvas.height;
    const availableAspectRatio = availableWidth / availableHeight;
    
    let finalWidth, finalHeight;
    
    if (canvasAspectRatio > availableAspectRatio) {
      // Canvas is wider relative to available space
      finalWidth = availableWidth;
      finalHeight = availableWidth / canvasAspectRatio;
    } else {
      // Canvas is taller relative to available space
      finalHeight = availableHeight;
      finalWidth = availableHeight * canvasAspectRatio;
    }
    
    // Center the content
    const xOffset = marginMM + (availableWidth - finalWidth) / 2;
    const yOffset = marginMM + (availableHeight - finalHeight) / 2;
    
    pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight);
    
    return pdf.output('blob');
  } finally {
    document.body.removeChild(tempDiv);
  }
}


function getStatusColor(status: string): string {
  switch (status) {
    case 'cleared': return '#059669';
    case 'pending': return '#d97706';
    case 'denied': return '#dc2626';
    default: return '#6b7280';
  }
}

function getStatusContent(status: string): string {
  switch (status) {
    case 'cleared':
      return `<p><strong style="color: #059669;">CLEARED:</strong> Your background screening has been completed
      successfully. All checks have passed the required standards, and no disqualifying information was found.
      You may proceed with your application process.</p>`;
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

export async function convertImageToPDF(imageBlob: Blob, fileName?: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(imageBlob);
    
    img.onload = () => {
      try {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        // Calculate dimensions to fit the page while maintaining aspect ratio
        const marginMM = 10; // 10mm margins
        const availableWidth = pdfWidth - (2 * marginMM);
        const availableHeight = pdfHeight - (2 * marginMM);
        
        const imgAspectRatio = img.width / img.height;
        const availableAspectRatio = availableWidth / availableHeight;
        
        let finalWidth, finalHeight;
        
        if (imgAspectRatio > availableAspectRatio) {
          finalWidth = availableWidth;
          finalHeight = availableWidth / imgAspectRatio;
        } else {
          finalHeight = availableHeight;
          finalWidth = availableHeight * imgAspectRatio;
        }
        
        // Center the image
        const xOffset = marginMM + (availableWidth - finalWidth) / 2;
        const yOffset = marginMM + (availableHeight - finalHeight) / 2;
        
        // Determine image format for jsPDF
        const format = imageBlob.type.includes('png') ? 'PNG' : 'JPEG';
        
        pdf.addImage(img, format, xOffset, yOffset, finalWidth, finalHeight);
        const pdfBlob = pdf.output('blob');
        URL.revokeObjectURL(url);
        resolve(pdfBlob);
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load image: ${fileName || 'unknown'}`));
    };
    
    img.src = url;
  });
}

export async function processFileForPDF(blob: Blob, fileName?: string): Promise<Blob | null> {
  const mimeType = blob.type;
  
  if (mimeType === 'application/pdf' || mimeType === 'application/octet-stream') {
    // Validate PDF files
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const pdfHeader = String.fromCharCode(...uint8Array.slice(0, 4));
    
    if (pdfHeader === '%PDF') {
      return blob;
    } else {
      console.warn(`File ${fileName || 'unknown'} does not appear to be a valid PDF`);
      return null;
    }
  } else if (mimeType.startsWith('image/')) {
    // Convert images to PDF
    try {
      return await convertImageToPDF(blob, fileName);
    } catch (error) {
      console.error(`Failed to convert image ${fileName || 'unknown'} to PDF:`, error);
      return null;
    }
  } else {
    console.warn(`Unsupported file type for ${fileName || 'unknown'}: ${mimeType}`);
    return null;
  }
}

export async function mergePDFs(pdfBlobs: Blob[]): Promise<Blob> {
  const mergedPdf = await PDFDocument.create();

  for (const blob of pdfBlobs) {
    const arrayBuffer = await blob.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  const pdfBytes = await mergedPdf.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}