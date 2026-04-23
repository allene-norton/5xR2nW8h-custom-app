'use client';

// TYPE IMPORTS
import type { BackgroundCheckFormData, BackgroundCheckFile } from '@/types';
import type {
  ListClientsResponse,
  ListFileChannelsResponse,
  Client,
} from '@/lib/actions/client-actions';
import { BACKGROUND_CHECK_OPTIONS } from '@/types';

// COMPONENT IMPORTS
import { ConfigurationSection } from '@/components/admin/ConfigurationSection';
import { ApplicantInfoSection } from '@/components/admin/ApplicantInfoSection';
import { BackgroundChecksSection } from '@/components/admin/BackgroundChecksSection';
import { CustomChecksSection } from '@/components/admin/CustomChecksSection';
import { StatusSection } from '@/components/admin/StatusSection';
import { FileUploadSection } from '@/components/admin/FileUploadSection';
import { SubmittedFormsSection } from '@/components/admin/SubmittedFormsSection';
import { CreateFolderSection } from '@/components/admin/CreateFolderSection';
import { PDFDownloadSection } from '@/components/admin/PDFDownloadSection';

import { useState, useEffect } from 'react';

export interface FileItem {
  id?: string;
  name?: string;
  type: 'cover' | 'submitted' | 'uploaded';
  url?: string;
  file?: File;
  data?: any; // For cover letter data
}

interface AdminInterfaceProps {
  formData: BackgroundCheckFormData;
  updateFormData: (updates: Partial<BackgroundCheckFormData>) => void;
  updateIdentification: (
    updates: Partial<BackgroundCheckFormData['identification']>,
  ) => void;
  updateCheckFileStatus: (updatedFileInfo: BackgroundCheckFile) => void;
  clientsResponse: ListClientsResponse;
  clientsLoading: boolean;
  clientsError: string | null;
  fileChannelsResponse: ListFileChannelsResponse;
  fileChannelsLoading: boolean;
  fileChannelsError: string | null;
  selectedClient: Client | null; // Changed from selectedClientId
  onClientSelect: (client: Client) => void; // Changed signature
  onFolderCreated?: (updateCreateFolder: { folderCreated: boolean }) => void;
  onFileCreated: (updateBackgroundCheckFile: BackgroundCheckFile) => void;
  validationErrors?: Record<string, string>;
  token?: string;
  submittedFiles?: Array<{ id: string; name: string; url: string }>;
}

export function AdminInterface({
  formData,
  updateFormData,
  updateIdentification,
  updateCheckFileStatus,
  clientsResponse,
  clientsLoading,
  clientsError,
  fileChannelsResponse,
  fileChannelsLoading,
  fileChannelsError,
  selectedClient,
  onClientSelect,
  onFolderCreated,
  onFileCreated,
  validationErrors = {},
  submittedFiles = [],
  token,
}: AdminInterfaceProps) {
  const [fileItems, setFileItems] = useState<FileItem[]>([
    {
      id: 'cover-letter',
      name: 'Cover Letter',
      type: 'cover',
      data: formData,
    },
  ]);
  const [isClientChanging, setIsClientChanging] = useState(false);

  // console.log(formData);

  useEffect(() => {
    setIsClientChanging(true);
    setFileItems([
      {
        id: 'cover-letter',
        name: 'Cover Letter',
        type: 'cover',
        data: formData,
      },
    ]);

    // Handle file channel setting
    if (selectedClient && fileChannelsResponse?.data) {
      const selectedClientFileChannel = fileChannelsResponse.data.find(
        (channel) => channel.clientId === selectedClient.id,
      );

      if (
        selectedClientFileChannel?.id &&
        formData.fileChannelId !== selectedClientFileChannel.id
      ) {
        console.log(`Found client channel`, selectedClientFileChannel.id);
        updateFormData({
          fileChannelId: selectedClientFileChannel.id,
        });
        console.log(`updateFormData called from AdminInterface`);
      } else if (!selectedClientFileChannel && formData.fileChannelId) {
        console.log(`did not find client channel`);
        updateFormData({
          fileChannelId: undefined,
        });
      }
    }

    // Reset loading after a short delay
    // setTimeout(() => setIsClientChanging(false), 100);

    setIsClientChanging(false);
  }, [selectedClient?.id, fileChannelsResponse?.data]);

  const handleSetFileItem = (fileObj: FileItem) => {
    if (isClientChanging) return; // Prevent updates during client changes

    setFileItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === fileObj.id);
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = fileObj;
        return updated;
      } else {
        return [...prev, fileObj];
      }
    });
  };

  // console.log(`TOKEN`,token)
  // console.log(`APP API key`,process.env.COPILOT_API_KEY)
  //   console.log(`Reg API key`,process.env.ASSEMBLY_API_KEY)

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
      {formData.formType === 'consulting' ? null : (
        <BackgroundChecksSection
          formType={formData.formType}
          selectedChecks={formData.backgroundChecks}
          selectedClientId={selectedClient?.id || ''}
          backgroundCheckFiles={formData.backgroundCheckFiles}
          updateCheckFileStatus={updateCheckFileStatus}
          updateFormData={updateFormData}
        />
      )}

      {/* File Upload Sections for Standard Checks */}
      {formData.fileChannelId &&
        formData.folderCreated &&
        !isClientChanging && (
          <div className="space-y-4">
            {formData.backgroundCheckFiles
              ?.filter((backgroundCheckFile) => {
                // Only show files for checks that are in the standard options
                const availableChecks =
                  BACKGROUND_CHECK_OPTIONS[formData.formType];
                return (availableChecks as readonly string[]).includes(
                  backgroundCheckFile.checkName,
                );
              })
              .map((backgroundCheckFile) => (
                <FileUploadSection
                  key={`${selectedClient?.id}-standard-${backgroundCheckFile.checkName}`}
                  formData={formData}
                  backgroundCheckFile={backgroundCheckFile}
                  onFileCreated={onFileCreated}
                  updateCheckFileStatus={updateCheckFileStatus}
                  setFileItem={handleSetFileItem}
                  token={token}
                />
              ))}
          </div>
        )}

      {/* Custom Checks */}
      <CustomChecksSection
        formType={formData.formType}
        selectedChecks={formData.backgroundChecks}
        selectedClientId={selectedClient?.id || ''}
        backgroundCheckFiles={formData.backgroundCheckFiles}
        updateCheckFileStatus={updateCheckFileStatus}
        updateFormData={updateFormData}
      />

      {/* File Upload Sections for Custom Checks */}
      {formData.fileChannelId &&
        formData.folderCreated &&
        !isClientChanging && (
          <div className="space-y-4">
            {formData.backgroundCheckFiles
              ?.filter((backgroundCheckFile) => {
                // Only show files for checks that are NOT in the standard options (i.e., custom checks)
                const availableChecks =
                  BACKGROUND_CHECK_OPTIONS[formData.formType];
                return !(availableChecks as readonly string[]).includes(
                  backgroundCheckFile.checkName,
                );
              })
              .map((backgroundCheckFile) => (
                <FileUploadSection
                  key={`${selectedClient?.id}-custom-${backgroundCheckFile.checkName}`}
                  formData={formData}
                  backgroundCheckFile={backgroundCheckFile}
                  onFileCreated={onFileCreated}
                  updateCheckFileStatus={updateCheckFileStatus}
                  setFileItem={handleSetFileItem}
                  token={token}
                />
              ))}
          </div>
        )}

      {/* Status and Memo */}
      <StatusSection
        status={formData.status}
        memo={formData.memo}
        updateFormData={updateFormData}
      />

      {formData.fileChannelId ? (
        !formData.folderCreated &&
        !isClientChanging && (
          <CreateFolderSection
            onFolderCreated={onFolderCreated}
            updateFormData={updateFormData}
            formData={formData}
          />
        )
      ) : (
        <div className="bg-red-50 border border-red-300 rounded-lg p-6 mx-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                File Channel Required
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  No file channel found for this client. Please create one in
                  your Assembly workspace to upload files.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submitted Documents */}
      <SubmittedFormsSection
        clientId={formData.client}
        setFileItem={handleSetFileItem}
      />

      <PDFDownloadSection
        formData={formData}
        submittedFiles={submittedFiles}
        uploadedFiles={formData.backgroundCheckFiles || []}
        allFileItems={fileItems}
      />
    </div>
  );
}

// db connection merged !
