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
import { FormCard } from '@/components/shared/FormCard';
import { RefreshCw, FolderOpen } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import {
  listForms,
  listFormResponses,
  FormResponse,
  FormResponseArray,
} from '@/lib/actions/client-actions';

interface SubmittedFormsSectionProps {
  clientId: string;
}

export function SubmittedFormsSection({
  clientId,
}: SubmittedFormsSectionProps) {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? undefined;

  //STATES
  const [forms, setForms] = useState<FormResponseArray>([]);
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
      console.log(`FormsData:`, formsData);

      if ('error' in formsData) {
        console.error('Error fetching forms:', formsData.error);
        return;
      }

      const forms = formsData.data;

      // get responses for all forms
      const allFormResponsesPromises =
        forms?.map(async (form) => { //error has any type when using sdk but need to keep for api development
          try {
            // In dev mode, only formId is needed. In production need to pass a token
            const responses = await listFormResponses(form.id!, token);
            return responses || [];
          } catch (err) {
            console.error(`Error loading responses for form ${form.id}:`, err);
            return [];
          }
        }) || [];

      const allResponsesArrays = await Promise.all(allFormResponsesPromises);
      
      const allResponses = allResponsesArrays
        .flatMap(
          (responseArray) =>
            ('data' in responseArray ? responseArray.data : []) || [],
        )
        .filter((response) => response !== null);

      // Filter responses where the recipient matches the clientId
      const clientForms = allResponses.filter(
        (response) => response.clientId === clientId,
      );
      console.log(`ClientId`, clientId);
      console.log(`Client Responses:`, clientForms);

      setForms(clientForms as FormResponseArray);
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
            <p className="text-gray-600">
              No documents have been submitted yet
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {forms.map((form: FormResponse) => (
              <FormCard
                key={form.id}
                formResponse={form}
                variant="admin"
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
