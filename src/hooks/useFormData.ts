// hooks/useFormData.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  type BackgroundCheckFormData,
  DEFAULT_FORM_DATA,
  FormDataSchema,
} from '../types';

// const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

interface UseFormDataOptions {
  clientId: string;
}

export function useFormData({ clientId }: UseFormDataOptions) {
  const [formData, setFormData] =
    useState<BackgroundCheckFormData>(DEFAULT_FORM_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Load data from Upstash on mount
  useEffect(() => {
    async function loadData() {
      console.log('Loading data for clientId:', clientId); // Debug log
      try {
        const response = await fetch(`/api/form-data?clientId=${clientId}`);
        console.log('API response status:', response.status); // Debug log

        if (response.ok) {
          const data = await response.json();
          console.log('Raw API data:', data); // Debug log

          if (data) {
            // Client has saved data - use it
            const validated = FormDataSchema.safeParse(data);
            console.log('Validation result:', validated); // Debug log

            if (validated.success) {
              console.log('Setting form data:', validated.data); // Debug log
              setFormData(validated.data);
              setHasUnsavedChanges(false);
              setLastSaved(new Date()); // Set last saved to now since we just loaded saved data
            } else {
              console.error('Schema validation failed:', validated.error);
            }
          } else {
            // No saved data for this client - reset to default
            console.log('No saved data, resetting to default');
            setFormData((prev) => ({
              ...DEFAULT_FORM_DATA,
              client: clientId, // Preserve the selected client
            }));
            setHasUnsavedChanges(false);
            setLastSaved(null);
          }
        } else {
          console.error('API request failed:', response.statusText);
          setFormData(DEFAULT_FORM_DATA);
        }
      } catch (error) {
        console.error('Error loading form data:', error);
        setFormData(DEFAULT_FORM_DATA);
      } finally {
        setIsLoading(false);
      }
    }

    if (clientId) {
      setIsLoading(true); // Set loading when switching clients
      loadData();
    } else {
      // No client selected - reset everything
      setIsLoading(false);
      setFormData(DEFAULT_FORM_DATA);
      setHasUnsavedChanges(false);
      setLastSaved(null);
    }
  }, [clientId]);

  // Save to Upstash
  const saveToDatabase = useCallback(
    async (data: BackgroundCheckFormData) => {
      if (!clientId) return;

      setIsSaving(true);
      setValidationErrors({});

      try {
        const response = await fetch('/api/form-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId, data }),
        });

        const result = await response.json();

        if (response.ok) {
          setLastSaved(new Date());
          setHasUnsavedChanges(false);
        } else {
          if (result.details?.issues) {
            const errors: Record<string, string> = {};
            result.details.issues.forEach((issue: any) => {
              const path = issue.path.join('.');
              errors[path] = issue.message;
            });
            setValidationErrors(errors);
          }

          // Throw error so saveFormData can catch it
          throw new Error(result.error || 'Failed to save form data');
        }
      } catch (error) {
        console.error('Error saving form data:', error);
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [clientId],
  );

  // Update form data with auto-sync for backgroundCheckFiles
  const updateFormData = useCallback(
    (updates: Partial<BackgroundCheckFormData>) => {
      setFormData((prev) => {
        const newData = { ...prev, ...updates };

        // Auto-sync backgroundCheckFiles when backgroundChecks change
        if (updates.backgroundChecks) {
          const existingFiles = prev.backgroundCheckFiles;
          const newChecks = updates.backgroundChecks;

          const updatedFiles = newChecks.map((checkName) => {
            const existing = existingFiles.find(
              (f) => f.checkName === checkName,
            );
            return existing || { checkName, fileUploaded: false };
          });

          newData.backgroundCheckFiles = updatedFiles;
        }

        return newData;
      });
      setHasUnsavedChanges(true);
      // Clear validation errors when user makes changes
      if (Object.keys(validationErrors).length > 0) {
        setValidationErrors({});
      }
    },
    [validationErrors],
  );

  // Update nested identification data
  const updateIdentification = useCallback(
    (updates: Partial<BackgroundCheckFormData['identification']>) => {
      updateFormData({
        identification: { ...formData.identification, ...updates },
      });
    },
    [formData.identification, updateFormData],
  );

  // Update file upload status for a specific check
  const updateCheckFileStatus = useCallback(
    (updatedFileInfo: {
      checkName: string;
      fileUploaded: boolean;
      fileName?: string;
    }) => {
      setFormData((prev) => {
        const updatedFiles = prev.backgroundCheckFiles.map((file) =>
          file.checkName === updatedFileInfo.checkName
            ? {
                ...file,
                fileUploaded: updatedFileInfo.fileUploaded,
                fileName: updatedFileInfo.fileName,
              }
            : file,
        );

        return { ...prev, backgroundCheckFiles: updatedFiles };
      });
      setHasUnsavedChanges(true);
    },
    [],
  );

  // Reset form data
  const resetFormData = useCallback(async () => {
    if (!clientId) return;

    setFormData(DEFAULT_FORM_DATA);
    try {
      await fetch(`/api/form-data?clientId=${clientId}`, { method: 'DELETE' });
      setHasUnsavedChanges(false);
      setLastSaved(null);
    } catch (error) {
      console.error('Error resetting form data:', error);
    }
  }, [clientId]);

  // Manual save
  const saveFormData = useCallback(
    async (overrideData?: Partial<BackgroundCheckFormData>) => {
      console.log('saveFormData called with clientId:', clientId);
      const dataToSave = overrideData
        ? { ...formData, ...overrideData }
        : formData;
      console.log('saveFormData called with formData:', dataToSave);
      if (!clientId) {
        console.error('No clientId provided for save');
        throw new Error('No client selected');
      }
      try {
        await saveToDatabase(dataToSave);
        console.log('Save completed successfully');
      } catch (error) {
        console.error('Save failed in saveFormData:', error);
        throw error;
      }
    },
    [formData, saveToDatabase, clientId],
  );

  // Auto-save effect
  // useEffect(() => {
  //   if (!hasUnsavedChanges || !clientId) return;

  //   const timer = setTimeout(() => {
  //     saveToDatabase(formData);
  //   }, AUTO_SAVE_INTERVAL);

  //   return () => clearTimeout(timer);
  // }, [formData, hasUnsavedChanges, saveToDatabase, clientId]);

  return {
    formData,
    isLoading,
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    validationErrors,
    updateFormData,
    updateIdentification,
    updateCheckFileStatus,
    resetFormData,
    saveFormData,
  };
}
