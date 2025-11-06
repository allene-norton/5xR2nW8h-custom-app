'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, GripVertical, FileText, Image } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { BackgroundCheckFormData, BackgroundCheckFile } from '@/types';
import {
  generateCoverLetterPDF,
  mergePDFs,
  processFileForPDF,
} from '@/lib/pdf-utils';
import { FileItem } from '@/components/admin/AdminInterface'; // Import from AdminInterface

// interface FileItem {
//   id: string;
//   name: string;
//   type: 'cover' | 'submitted' | 'uploaded';
//   url?: string;
//   file?: File;
//   data?: any; // For cover letter data
// }

interface PDFDownloadSectionProps {
  formData: BackgroundCheckFormData;
  submittedFiles: Array<{ id: string; name: string; url: string }>;
  uploadedFiles: BackgroundCheckFile[];
  allFileItems: FileItem[];
}

export function PDFDownloadSection({
  formData,
  submittedFiles,
  uploadedFiles,
  allFileItems,
}: PDFDownloadSectionProps) {
  const [fileItems, setFileItems] = useState<FileItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setFileItems(allFileItems);
  }, [allFileItems]);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(fileItems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setFileItems(items);
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'cover':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'submitted':
        return <FileText className="w-4 h-4 text-green-600" />;
      case 'uploaded':
        return <Image className="w-4 h-4 text-purple-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  // const handleDownloadPDF = async () => {
  //   setIsGenerating(true);
  //   try {
  //     const pdfFiles: Blob[] = [];

  //     for (const item of fileItems) {
  //       if (item.type === 'cover') {
  //         // Generate cover letter PDF
  //         try {
  //           const coverPDF = await generateCoverLetterPDF(item.data);
  //           if (coverPDF && coverPDF.type === 'application/pdf') {
  //             pdfFiles.push(coverPDF);
  //           } else {
  //             console.warn('Cover letter PDF generation returned invalid data');
  //           }
  //         } catch (coverError) {
  //           console.error('Error generating cover letter PDF:', coverError);
  //         }
  //       } else if (item.url) {
  //         try {
  //           const response = await fetch(item.url);
  //           if (!response.ok) {
  //             throw new Error(`Failed to fetch file: ${response.statusText}`);
  //           }

  //           const blob = await response.blob();

  //           // Use the utility function to process the file
  //           const processedPDF = await processFileForPDF(blob, item.name);
  //           if (processedPDF) {
  //             pdfFiles.push(processedPDF);
  //             console.log(`Processed file ${item.name} successfully`);
  //           }
  //         } catch (fileError) {
  //           console.error(`Error processing file ${item.name}:`, fileError);
  //         }
  //       }
  //     }

  //     if (pdfFiles.length === 0) {
  //       throw new Error('No valid files could be processed');
  //     }

  //     console.log(`Processing ${pdfFiles.length} files for PDF generation`);

  //     let finalPDF: Blob;

  //     if (pdfFiles.length === 1) {
  //       finalPDF = pdfFiles[0];
  //     } else {
  //       finalPDF = await mergePDFs(pdfFiles);
  //     }

  //     // Download the PDF
  //     const url = URL.createObjectURL(finalPDF);
  //     const a = document.createElement('a');
  //     a.href = url;
  //     a.download = `${formData.identification.firstName}_${formData.identification.lastName}_Background_Check.pdf`;
  //     document.body.appendChild(a);
  //     a.click();
  //     document.body.removeChild(a);
  //     URL.revokeObjectURL(url);
  //   } catch (error) {
  //     console.error('Error generating PDF:', error);
  //     alert(
  //       'Error generating PDF. Please check that all files are valid and try again.',
  //     );
  //   } finally {
  //     setIsGenerating(false);
  //   }
  // };

  const handleDownloadPDF = async () => {
  setIsGenerating(true);
  try {
    const pdfFiles: Blob[] = [];
    
    for (const item of fileItems) {
      if (item.type === 'cover') {
        try {
          const coverPDF = await generateCoverLetterPDF(item.data);
          if (coverPDF && coverPDF.type === 'application/pdf') {
            pdfFiles.push(coverPDF);
          } else {
            console.warn('Cover letter PDF generation returned invalid data');
          }
        } catch (coverError) {
          console.error('Error generating cover letter PDF:', coverError);
        }
      } else if (item.url) {
        try {
          const response = await fetch(item.url);
          if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.statusText}`);
          }
          const blob = await response.blob();
          const processedPDF = await processFileForPDF(blob, item.name);
          if (processedPDF) {
            pdfFiles.push(processedPDF);
            console.log(`Processed file ${item.name} successfully`);
          }
        } catch (fileError) {
          console.error(`Error processing file ${item.name}:`, fileError);
        }
      }
    }
    
    if (pdfFiles.length === 0) {
      throw new Error('No valid files could be processed');
    }
    
    console.log(`Processing ${pdfFiles.length} files for PDF generation`);
    
    let finalPDF: Blob;
    if (pdfFiles.length === 1) {
      finalPDF = pdfFiles[0];
    } else {
      finalPDF = await mergePDFs(pdfFiles);
    }
    
    const filename = `${formData.identification.firstName}_${formData.identification.lastName}_Background_Check.pdf`;
    
    // Convert to base64 for form submission
    const arrayBuffer = await finalPDF.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    let binaryString = '';
    const chunkSize = 8192;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      binaryString += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    const base64 = btoa(binaryString);
    const isInIframe = window !== window.parent;
    
    if (isInIframe) {
      console.log('Using form submission method for iframe download');
      
      // Create a new window with a form-based download approach
      const newWindow = window.open('', '_blank', 'width=600,height=400');
      if (newWindow) {
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Downloading PDF...</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                background: #f8fafc;
                margin: 0;
                padding: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
              }
              .container {
                background: white;
                padding: 40px;
                border-radius: 12px;
                box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
                text-align: center;
                max-width: 400px;
                width: 100%;
              }
              .status {
                background: #dcfce7;
                color: #166534;
                padding: 12px 20px;
                border-radius: 8px;
                margin-bottom: 20px;
                font-weight: 600;
              }
              .btn {
                background: #3b82f6;
                color: white;
                border: none;
                padding: 14px 28px;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                margin: 8px;
                transition: all 0.2s;
                text-decoration: none;
                display: inline-block;
              }
              .btn:hover {
                background: #2563eb;
                transform: translateY(-1px);
              }
              .btn-secondary {
                background: #6b7280;
              }
              .btn-secondary:hover {
                background: #4b5563;
              }
              .file-info {
                background: #f1f5f9;
                padding: 16px;
                border-radius: 8px;
                margin: 20px 0;
                font-size: 14px;
                color: #475569;
              }
              .spinner {
                display: inline-block;
                width: 20px;
                height: 20px;
                border: 3px solid #f3f4f6;
                border-radius: 50%;
                border-top-color: #3b82f6;
                animation: spin 1s ease-in-out infinite;
                margin-right: 8px;
              }
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="status">
                <span class="spinner"></span>
                Preparing your download...
              </div>
              
              <h2 style="color: #1e293b; margin-bottom: 16px;">Background Check Report</h2>
              
              <div class="file-info">
                <strong>File:</strong> ${filename}<br>
                <strong>Size:</strong> ${Math.round(finalPDF.size / 1024)} KB
              </div>
              
              <form id="downloadForm" method="post" action="data:application/octet-stream;base64,${base64}" style="display: none;">
              </form>
              
              <button onclick="downloadFile()" class="btn" id="downloadBtn">
                📥 Download PDF
              </button>
              
              <button onclick="window.close()" class="btn btn-secondary">
                ✕ Close Window
              </button>
            </div>
            
            <script>
              let downloadAttempted = false;
              
              function downloadFile() {
                if (downloadAttempted) return;
                downloadAttempted = true;
                
                console.log('Attempting download...');
                
                try {
                  // Method 1: Create blob and download
                  const binaryString = atob('${base64}');
                  const bytes = new Uint8Array(binaryString.length);
                  for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                  }
                  const blob = new Blob([bytes], { type: 'application/pdf' });
                  
                  // Try multiple download methods
                  const url = URL.createObjectURL(blob);
                  
                  // Method A: Direct link click
                  const a = document.createElement('a');
                  a.style.display = 'none';
                  a.href = url;
                  a.download = '${filename}';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  
                  // Method B: Window location (fallback)
                  setTimeout(() => {
                    if (confirm('Download not started? Try alternative method?')) {
                      window.location.href = url;
                    }
                  }, 2000);
                  
                  // Method C: Open in new tab (second fallback)
                  setTimeout(() => {
                    const newTab = window.open(url, '_blank');
                    if (!newTab) {
                      alert('Please allow popups and try again');
                    }
                  }, 4000);
                  
                  // Update UI
                  document.querySelector('.status').innerHTML = '✅ Download started!';
                  document.getElementById('downloadBtn').textContent = '✅ Downloaded';
                  document.getElementById('downloadBtn').disabled = true;
                  
                  // Cleanup
                  setTimeout(() => URL.revokeObjectURL(url), 10000);
                  
                } catch (error) {
                  console.error('Download error:', error);
                  document.querySelector('.status').innerHTML = '❌ Download failed';
                  alert('Download failed. Please try again or contact support.');
                }
              }
              
              // Auto-trigger download after page loads
              setTimeout(() => {
                if (!downloadAttempted) {
                  downloadFile();
                }
              }, 1500);
              
              // Prevent multiple attempts
              document.getElementById('downloadBtn').addEventListener('click', downloadFile);
            </script>
          </body>
          </html>
        `);
        newWindow.document.close();
      } else {
        throw new Error('Could not open download window. Please allow popups and try again.');
      }
    } else {
      // Normal environment
      const url = URL.createObjectURL(finalPDF);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Error generating PDF. Please check that all files are valid and try again.');
  } finally {
    setIsGenerating(false);
  }
};

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Download Complete Report</span>
          <Button
            onClick={handleDownloadPDF}
            disabled={isGenerating || fileItems.length === 0}
            className="flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>{isGenerating ? 'Generating...' : 'Download PDF'}</span>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          Drag and drop to reorder files. The cover letter will be included at
          the beginning of the PDF.
        </p>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="file-list">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {fileItems.map((item, index) => (
                  <Draggable key={item.id} draggableId={item.id!} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`flex items-center space-x-3 p-3 bg-white border rounded-lg ${
                          snapshot.isDragging ? 'shadow-lg' : 'shadow-sm'
                        } ${item.type === 'cover' ? 'border-blue-200 bg-blue-50' : ''}`}
                      >
                        <div
                          {...provided.dragHandleProps}
                          className="cursor-grab active:cursor-grabbing"
                        >
                          <GripVertical className="w-4 h-4 text-gray-400" />
                        </div>

                        {getFileIcon(item.type)}

                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-gray-500 capitalize">
                            {item.type === 'cover'
                              ? 'Generated Cover Letter'
                              : `${item.type} File`}
                          </p>
                        </div>

                        <div className="text-xs text-gray-400">
                          #{index + 1}
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {fileItems.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No files available for download</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
