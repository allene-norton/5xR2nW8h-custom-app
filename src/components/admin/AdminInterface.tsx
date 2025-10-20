'use client';

// TYPE IMPORTS
import type { BackgroundCheckFormData } from '@/types';
import type {
  ListClientsResponse,
  ListFileChannelsResponse,
  Client
} from '@/lib/actions/client-actions';

// COMPONENT IMPORTS 
import { ConfigurationSection } from '@/components/admin/ConfigurationSection';
import { ApplicantInfoSection } from '@/components/admin/ApplicantInfoSection';
import { BackgroundChecksSection } from '@/components/admin/BackgroundChecksSection';
import { CustomChecksSection } from '@/components/admin/CustomChecksSection';
import { StatusSection } from '@/components/admin/StatusSection';
import { FileUploadSection } from '@/components/admin/FileUploadSection';
import { SubmittedFormsSection } from '@/components/admin/SubmittedFormsSection';

interface AdminInterfaceProps {
  formData: BackgroundCheckFormData;
  updateFormData: (updates: Partial<BackgroundCheckFormData>) => void;
  updateIdentification: (updates: Partial<BackgroundCheckFormData['identification']>) => void;
  updateCheckFileStatus: (
    checkName: string, 
    fileUploaded: boolean,
    fileName?: string,
    fileId?: string
  ) => void;
  resetFormData: () => void;
  clientsResponse: ListClientsResponse;
  clientsLoading: boolean;
  clientsError: string | null;
  fileChannelsResponse: ListFileChannelsResponse;
  fileChannelsLoading: boolean;
  fileChannelsError: string | null;
  selectedClient: Client | null; // Changed from selectedClientId
  onClientSelect: (client: Client) => void; // Changed signature
  validationErrors?: Record<string, string>;
}

export function AdminInterface({
  formData,
  updateFormData,
  updateIdentification,
  updateCheckFileStatus,
  resetFormData,
  clientsResponse,
  clientsLoading,
  clientsError,
  fileChannelsResponse,
  fileChannelsLoading,
  fileChannelsError,
  selectedClient,
  onClientSelect,
  validationErrors = {}
}: AdminInterfaceProps) {

  // console.log(formData)


  return (
    <div className="space-y-8">
      {/* Configuration Section */}
      <ConfigurationSection
        formData={formData}
        updateFormData={updateFormData}
        updateIdentification={updateIdentification}
        clientsResponse={clientsResponse}
        clientsLoading={clientsLoading}
        clientsError={clientsError}
        fileChannelsResponse={fileChannelsResponse}
        fileChannelsLoading={fileChannelsLoading}
        fileChannelsError={fileChannelsError}
        selectedClient={selectedClient}
        onClientSelect={onClientSelect}
      />

      {/* Applicant Information */}
      <ApplicantInfoSection
        identification={formData.identification}
        updateIdentification={updateIdentification}
      />

      {/* Background Checks */}
      <BackgroundChecksSection
        formType={formData.formType}
        selectedChecks={formData.backgroundChecks}
        selectedClientId={selectedClient?.id || ''}
        backgroundCheckFiles={formData.backgroundCheckFiles}
        updateCheckFileStatus={updateCheckFileStatus}
        updateFormData={updateFormData}
      />

      {/* Custom Checks */}
      <CustomChecksSection
        formType={formData.formType}
        selectedChecks={formData.backgroundChecks}
        selectedClientId={selectedClient?.id || ''}
        backgroundCheckFiles={formData.backgroundCheckFiles}
        updateCheckFileStatus={updateCheckFileStatus}
        updateFormData={updateFormData}
      />

      {/* Status and Memo */}
      <StatusSection
        status={formData.status}
        memo={formData.memo}
        updateFormData={updateFormData}
      />

      {/* File Upload */}
      <FileUploadSection
        uploadedFile={formData.uploadedFile}
        updateFormData={updateFormData}
      />

      {/* Submitted Documents */}
      <SubmittedFormsSection 
      clientId={formData.client} 
      fileChannelId={formData.fileChannelId}
      />
    </div>
  );
}

// db connection merged !
