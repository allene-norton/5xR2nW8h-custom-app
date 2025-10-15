'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Button } from '../ui/button';
import { DocumentCard } from '../shared/DocumentCard';
import { RefreshCw, FolderOpen } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import {
  listForms,
  listFormResponses,
  Form,
  FormField,
  FormResponse,
  FormsResponse,
  FormResponsesApiResponse,
  FormResponseField,
} from '@/lib/actions/client-actions';

interface SubmittedDocumentsSectionProps {
  clientId: string;
}

export function SubmittedDocumentsSection({
  clientId,
}: SubmittedDocumentsSectionProps) {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? undefined;

  //STATES
  const [forms, setForms] = useState<FormResponsesApiResponse[]>([]); // change tyoe
  const [allFormResponses, setAllFormResponses] = useState([]);

  // loading / error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Loading
  const loadForms = async () => {
    if (!clientId) {
      setForms([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // get all workspace forms
      const formsData = await listForms(token);

      const forms = formsData.data;

      // get responses for all forms
      const allFormResponsesPromises = forms.map(async (form: Form) => {
        try {
          // In dev mode, only formId is needed. In production, you might need to pass a token
          const responses = await listFormResponses(form.id!, token);
          return responses || [];
        } catch (err) {
          console.error(`Error loading responses for form ${form.id}:`, err);
          return [];
        }
      });

      const allResponsesArrays = await Promise.all(allFormResponsesPromises);

      // Flatten all responses into a single array
      const allResponses = allResponsesArrays.flat();

      // Filter responses where the recipient matches the clientId
      const clientForms = allResponses.filter(
        (response) =>
          response.recipient === clientId || response.recipientId === clientId,
      );

      setForms(clientForms);
    } catch (err) {
      setError('Failed to load client forms');
      console.error('Error loading client forms:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Contract Loading - add function to retrieve contracts for client

  useEffect(() => {
    loadForms();
  }, [clientId]);


  // handlers -- unsure
  // const handleViewDocument = (document: SDKDocument) => {
  //   if (document.url) {
  //     window.open(document.url, '_blank');
  //   }
  // };

  // const handleDownloadDocument = (document: SDKDocument) => {
  //   if (document.url) {
  //     const link = document.createElement('a');
  //     link.href = document.url;
  //     link.download = document.title;
  //     document.body.appendChild(link);
  //     link.click();
  //     document.body.removeChild(link);
  //   }
  // };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FolderOpen className="w-5 h-5 text-blue-600" />
            <CardTitle>Submitted Documents</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadForms}
            disabled={isLoading || !clientId}
            className="flex items-center space-x-2 bg-transparent"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
            />
            <span>Refresh</span>
          </Button>
        </div>
        <CardDescription>
          Documents submitted by the client through the portal
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!clientId ? (
          <div className="text-center py-8">
            <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              Select a client to view their submitted documents
            </p>
          </div>
        ) : isLoading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading documents...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">{error}</div>
            <Button variant="outline" onClick={loadForms}>
              Try Again
            </Button>
          </div>
        ) : forms.length === 0 ? (
          <div className="text-center py-8">
            <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No documents have been submitted yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* {forms.map((document) => (
              <DocumentCard
                key={document.id}
                title={document.title}
                type={document.type}
                variant="admin"
                onView={() => handleViewDocument(document)}
                onDownload={() => handleDownloadDocument(document)}
              />
            ))} */}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
