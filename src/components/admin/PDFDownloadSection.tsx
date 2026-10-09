'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Download,
  GripVertical,
  FileText,
  Image,
  X,
  AlertTriangle,
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { BackgroundCheckFormData, BackgroundCheckFile } from '@/types';
import {
  generateCoverLetterPDF,
  mergePDFs,
  prepareFileForPDF,
} from '@/lib/pdf-utils';
import { FileItem } from '@/components/admin/AdminInterface'; // Import from AdminInterface

interface SkippedFile {
  name: string;
  reason: string;
}

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
  const [skippedFiles, setSkippedFiles] = useState<SkippedFile[]>([]);

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

  const handleRemoveFile = (fileId: string | undefined) => {
    if (!fileId) return;
    setFileItems(prev => prev.filter(item => item.id !== fileId));
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

  /**
   * Fetch a document's bytes. Tries the storage URL directly first, then falls
   * back to the same-origin proxy if the browser blocks it (CORS) or the
   * request fails outright.
   */
  const fetchDocument = async (url: string): Promise<Blob> => {
    try {
      const response = await fetch(url);
      if (response.ok) return await response.blob();
      console.warn(
        `Direct fetch returned ${response.status}, retrying through proxy`,
      );
    } catch (directError) {
      console.warn('Direct fetch failed, retrying through proxy', directError);
    }

    const proxyResponse = await fetch(
      `/api/pdf-proxy?url=${encodeURIComponent(url)}`,
    );
    if (!proxyResponse.ok) {
      throw new Error(
        `Could not download the file (${proxyResponse.status} ${proxyResponse.statusText})`,
      );
    }
    return await proxyResponse.blob();
  };

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    setSkippedFiles([]);

    try {
      const pdfFiles: Blob[] = [];
      const skipped: SkippedFile[] = [];

      for (const item of fileItems) {
        const label = item.name || 'Untitled document';

        if (item.type === 'cover') {
          try {
            // Use the live form data, not `item.data`. That snapshot is only
            // rebuilt when the selected client changes, so anything edited
            // afterwards (status, notes, check results) was missing from the
            // generated cover letter.
            const coverPDF = await generateCoverLetterPDF(formData);
            if (coverPDF && coverPDF.type === 'application/pdf') {
              pdfFiles.push(coverPDF);
            } else {
              skipped.push({
                name: label,
                reason: 'Cover letter generation returned invalid data',
              });
            }
          } catch (coverError) {
            console.error('Error generating cover letter PDF:', coverError);
            skipped.push({
              name: label,
              reason:
                coverError instanceof Error
                  ? coverError.message
                  : 'Cover letter could not be generated',
            });
          }
        } else if (item.url) {
          try {
            const blob = await fetchDocument(item.url);
            const prepared = await prepareFileForPDF(blob, label);

            if (prepared.ok) {
              pdfFiles.push(prepared.pdf);
              console.log(
                `Processed ${label} as ${prepared.detected} successfully`,
              );
            } else {
              console.warn(`Skipping ${label}: ${prepared.reason}`);
              skipped.push({ name: label, reason: prepared.reason });
            }
          } catch (fileError) {
            console.error(`Error processing file ${label}:`, fileError);
            skipped.push({
              name: label,
              reason:
                fileError instanceof Error
                  ? fileError.message
                  : 'Could not be downloaded',
            });
          }
        } else {
          skipped.push({
            name: label,
            reason: 'No file location available for this document',
          });
        }
      }

      setSkippedFiles(skipped);

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

      // Simple and clean - just open the PDF in a new window
      const url = URL.createObjectURL(finalPDF);
      window.open(url, '_blank', 'noopener,noreferrer');

      console.log('PDF opened in new window');

      // Cleanup after delay
      setTimeout(() => URL.revokeObjectURL(url), 30000);
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
            <span>{isGenerating ? 'Generating...' : 'View PDF'}</span>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          Drag and drop to reorder files. Click the X to remove files from the PDF. The cover letter will be included at the beginning of the PDF.
        </p>

        {skippedFiles.length > 0 && (
          <div className="mb-4 rounded-lg border border-yellow-300 bg-yellow-50 p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600" />
              <div className="flex-1">
                <h4 className="mb-1 text-sm font-medium text-yellow-900">
                  {skippedFiles.length === 1
                    ? '1 document was left out of the report'
                    : `${skippedFiles.length} documents were left out of the report`}
                </h4>
                <p className="mb-2 text-xs text-yellow-800">
                  The PDF was generated without these. Resolve them and
                  regenerate before sending the report.
                </p>
                <ul className="space-y-1 text-sm text-yellow-800">
                  {skippedFiles.map((file, index) => (
                    <li key={`${file.name}-${index}`}>
                      <span className="font-medium">{file.name}</span>
                      {' — '}
                      {file.reason}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

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

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFile(item.id)}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
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
