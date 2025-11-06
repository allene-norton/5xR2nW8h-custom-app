import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { PDFDocument } from 'pdf-lib';
import  { FORM_TYPE_INFO, type BackgroundCheckFormData } from '@/types';

export async function generateCoverLetterPDF(formData: BackgroundCheckFormData): Promise<Blob> {
  // Create a temporary div with the cover letter content
  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.width = '800px';
  tempDiv.style.backgroundColor = 'white';
  tempDiv.style.padding = '40px';
  
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

  try {
    // Convert to canvas then PDF
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    
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