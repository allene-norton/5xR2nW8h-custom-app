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
        // Generate cover letter PDF
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
          // Use the utility function to process the file
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
    
    // Create blob URL
    const url = URL.createObjectURL(finalPDF);
    const filename = `${formData.identification.firstName}_${formData.identification.lastName}_Background_Check.pdf`;
    
    // Try multiple download strategies for iframe compatibility
    const isInIframe = window !== window.parent;
    
    if (isInIframe) {
      console.log('Detected iframe environment, using new window download');
      
      // Strategy 1: Try to open in new window with download
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Downloading PDF...</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  text-align: center; 
                  padding: 50px;
                  background-color: #f5f5f5;
                }
                .container {
                  background: white;
                  padding: 30px;
                  border-radius: 8px;
                  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                  max-width: 400px;
                  margin: 0 auto;
                }
                .download-btn {
                  background: #3b82f6;
                  color: white;
                  padding: 12px 24px;
                  border: none;
                  border-radius: 6px;
                  cursor: pointer;
                  text-decoration: none;
                  display: inline-block;
                  margin: 10px;
                  font-size: 16px;
                }
                .download-btn:hover {
                  background: #2563eb;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h2>PDF Ready for Download</h2>
                <p>Your background check report is ready.</p>
                <a href="${url}" download="${filename}" class="download-btn" id="downloadLink">
                  Download PDF
                </a>
                <br>
                <button onclick="window.close()" class="download-btn" style="background: #6b7280;">
                  Close Window
                </button>
              </div>
              <script>
                // Auto-trigger download
                setTimeout(() => {
                  document.getElementById('downloadLink').click();
                }, 500);
                
                // Auto-close after download (optional)
                setTimeout(() => {
                  if (confirm('Download completed. Close this window?')) {
                    window.close();
                  }
                }, 2000);
              </script>
            </body>
          </html>
        `);
        newWindow.document.close();
      } else {
        // Strategy 2: Fallback if popup is blocked
        console.log('Popup blocked, trying direct navigation');
        window.location.href = url;
      }
    } else {
      // Normal environment - regular download
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    
    // Clean up URL after delay
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 5000);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert(
      'Error generating PDF. Please check that all files are valid and try again.',
    );
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
