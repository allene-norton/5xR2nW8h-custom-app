'use client';

import type { FormData } from '@/types';
import type {
  ListClientsResponse,
  ListFileChannelsResponse,
} from '@/lib/actions/client-actions';

// import { ListClientsResponse } from '@/lib/actions/sdk-requests'; //Prod
// import { devListClientsResponse } from '@/types/dev'; //dev

import { ConfigurationSection } from '@/components/admin/ConfigurationSection';
import { ApplicantInfoSection } from '@/components/admin/ApplicantInfoSection';
import { BackgroundChecksSection } from '@/components/admin/BackgroundChecksSection';
import { CustomChecksSection } from '@/components/admin/CustomChecksSection';
import { StatusSection } from '@/components/admin/StatusSection';
import { FileUploadSection } from '@/components/admin/FileUploadSection';
import { SubmittedFormsSection } from '@/components/admin/SubmittedFormsSection';

interface AdminInterfaceProps {
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
  updateIdentification: (updates: Partial<FormData['identification']>) => void;
  resetFormData: () => void;
  clientsResponse: ListClientsResponse;
  clientsLoading: boolean;
  clientsError: string | null;
  fileChannelsResponse: ListFileChannelsResponse;
  fileChannelsLoading: boolean;
  fileChannelsError: string | null;
}

export function AdminInterface({
  formData,
  updateFormData,
  updateIdentification,
  resetFormData,
  clientsResponse,
  clientsLoading,
  clientsError,
  fileChannelsResponse,
  fileChannelsLoading,
  fileChannelsError,
}: AdminInterfaceProps) {
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
        updateFormData={updateFormData}
      />

      {/* Custom Checks */}
      <CustomChecksSection
        formType={formData.formType}
        selectedChecks={formData.backgroundChecks}
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
      <SubmittedFormsSection clientId={formData.client} />
    </div>
  );
}

// test new remote
