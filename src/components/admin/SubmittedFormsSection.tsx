'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Button } from '../ui/button';
import { FormCard } from '@/components/shared/FormCard';
import { ContractCard } from '@/components/shared/ContractCard';
import { RefreshCw, FolderOpen, AlertTriangle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import {
  listForms,
  listFormResponses,
  Form,
  FormResponse,
  FormResponseField,
  FormResponseArray,
  ContractArray,
  ContractsResponse,
  Contract,
  listContracts,
} from '@/lib/actions/client-actions';
// import { Contract } from 'copilot-design-system/dist/icons';
import { FileItem } from '@/components/admin/AdminInterface';

interface SubmittedFormsSectionProps {
  clientId: string;
  variant?: 'admin' | 'client';
  setFileItem?: (fileObj: FileItem) => void;
}

export function SubmittedFormsSection({
  clientId,
  variant,
  setFileItem,
}: SubmittedFormsSectionProps) {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? undefined;

  // console.log(`Sumbission Section FileChannelId:`, fileChannelId)

  //STATES
  const [forms, setForms] = useState<FormResponseArray>([]);
  const [contracts, setContracts] = useState<ContractArray>([]);

  // loading / error states
  const [isLoadingForms, setIsLoadingForms] = useState(false);
  const [isLoadingContracts, setIsLoadingContracts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Non-blocking: some forms' responses failed to load while others
  // succeeded, so the list below is incomplete rather than empty.
  const [formLoadWarning, setFormLoadWarning] = useState<string | null>(null);

  const isLoading = isLoadingForms || isLoadingContracts;

  // Tracks which client the UI is currently showing, so a response that
  // arrives after the user has switched clients is discarded instead of
  // attaching the previous applicant's documents to the new one's report.
  const currentClientIdRef = useRef(clientId);
  useEffect(() => {
    currentClientIdRef.current = clientId;
  }, [clientId]);

  // Form Loading
  const loadForms = useCallback(async () => {
    if (!clientId) {
      setForms([]);
      return;
    }
    setIsLoadingForms(true);
    setError(null);
    setFormLoadWarning(null);
    try {
      // get all workspace forms
      const formsData = await listForms(token);
      if ('error' in formsData) {
        console.error('Error fetching forms:', formsData.error);
        if (currentClientIdRef.current === clientId) {
          setError(formsData.error || 'Failed to load forms');
        }
        return;
      }
      const forms = formsData.data;

      // get responses for all forms. listFormResponses (the server action)
      // catches its own errors and returns { error } rather than throwing,
      // so a per-form failure has to be detected explicitly here — otherwise
      // it silently contributes nothing to `allResponses` below and the UI
      // just looks like that client has no submitted documents, with no
      // indication anything went wrong.
      const failedFormNames: string[] = [];
      const allFormResponsesPromises =
        forms?.map(async (form: Form) => {
          try {
            const responses = await listFormResponses(form.id!, token);
            if (responses && 'error' in responses) {
              console.error(
                `Error loading responses for form "${form.name || form.id}":`,
                responses.error,
              );
              failedFormNames.push(form.name || form.id || 'Unknown form');
            }
            return responses || [];
          } catch (err) {
            console.error(
              `Error loading responses for form "${form.name || form.id}":`,
              err,
            );
            failedFormNames.push(form.name || form.id || 'Unknown form');
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

      // The user switched clients while this was in flight — drop the result.
      if (currentClientIdRef.current !== clientId) return;

      setForms(clientForms as FormResponseArray);
      setFormLoadWarning(
        failedFormNames.length > 0
          ? `Could not load responses for: ${failedFormNames.join(', ')}. Documents from these forms may be missing below — try Refresh.`
          : null,
      );

      if (setFileItem) {
        clientForms.forEach((form: FormResponse) => {
          if (form.formFields) {
            let attachmentIndex = 0;
            Object.values(form.formFields).forEach(
              (field: FormResponseField) => {
                if (field.attachmentUrls && field.attachmentUrls.length > 0) {
                  field.attachmentUrls.forEach((url: string) => {
                    const fileItem: FileItem = {
                      id: `${form.id}-attachment-${attachmentIndex}`,
                      name: `${form.formName || 'Form'} - Attachment ${attachmentIndex + 1}`,
                      type: 'submitted',
                      url: url,
                      data: null,
                    };
                    setFileItem(fileItem);
                    attachmentIndex++;
                  });
                }
              },
            );
          }
        });
      }
    } catch (err) {
      setError('Failed to load client forms');
      console.error('Error loading client forms:', err);
    } finally {
      setIsLoadingForms(false);
    }
  }, [clientId, token]);

  const loadContracts = useCallback(async () => {
    if (!clientId) {
      setContracts([]);
      return;
    }
    setIsLoadingContracts(true);
    setError(null);
    try {
      // console.log(`loading contracts for client`, clientId);
      const contractsData = await listContracts(clientId, token);

      if ('error' in contractsData) {
        console.error('Error fetching contracts:', contractsData.error);
        if (currentClientIdRef.current === clientId) {
          setError(contractsData.error || 'Failed to load contracts');
        }
        return;
      }


      const contracts = contractsData.data;
      const signedContracts = contracts.filter(
        (contract: Contract) => contract.status === 'signed',
      );

      // The user switched clients while this was in flight — drop the result.
      if (currentClientIdRef.current !== clientId) return;

      setContracts(signedContracts as ContractArray);

      if (setFileItem) {
        signedContracts.forEach((contract: Contract, index: number) => {
          if (contract.signedFileUrl) {
            const fileItem: FileItem = {
              id: contract.id,
              name: contract.name || `Signed Contract ${index + 1}`,
              type: 'submitted',
              url: contract.signedFileUrl,
              data: null
            };
            setFileItem(fileItem);
          }
        });
      }
    } catch (err) {
      setError('Failed to load client contracts');
      console.error('Error loading client contracts:', err);
    } finally {
      setIsLoadingContracts(false);
    }
  }, [clientId, token]);

  useEffect(() => {
    loadForms();
    loadContracts();
  }, [loadForms, loadContracts]); // Now we can safely include them

  // Update the refresh button onClick
  const handleRefresh = useCallback(() => {
    loadForms();
    loadContracts();
  }, [loadForms, loadContracts]);

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
            onClick={handleRefresh}
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
          {variant === 'client'
            ? 'Your submitted forms and documents'
            : 'Documents submitted by the client through the portal'}
        </CardDescription>
        {formLoadWarning && (
          <div className="flex items-start space-x-2 rounded-lg border border-yellow-300 bg-yellow-50 p-3 mt-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-yellow-800">{formLoadWarning}</p>
          </div>
        )}
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
        ) : forms.length === 0 && contracts.length === 0 ? (
          <div className="text-center py-8">
            <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              No documents have been submitted yet
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {forms.map((form: FormResponse) => (
              <FormCard key={form.id} formResponse={form} variant={variant} />
            ))}
            {contracts.map((contract: Contract) => (
              <ContractCard
                key={contract.id}
                contract={contract}
                variant={variant}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
