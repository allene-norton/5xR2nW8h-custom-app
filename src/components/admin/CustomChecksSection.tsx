'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '../ui/badge';
import { Plus, X } from 'lucide-react';
import { CheckResultSelect } from '@/components/admin/CheckResultSelect';
import { type FormType, type CheckResult, BACKGROUND_CHECK_OPTIONS, DEFAULT_CHECK_RESULT, BackgroundCheckFiles, BackgroundCheckFormData, BackgroundCheckFile } from '../../types';

interface CustomChecksSectionProps {
  formType: FormType;
  selectedChecks: string[];
  selectedClientId: string;
  backgroundCheckFiles: BackgroundCheckFiles;
  updateFormData: (
    updates: Partial<
      Pick<
        BackgroundCheckFormData,
        'backgroundChecks' | 'backgroundCheckFiles'
      >
    >,
  ) => void;
  onFileCreated?: (updateBackgroundCheckFile: BackgroundCheckFile) => void
  updateCheckFileStatus: (updatedFileInfo: BackgroundCheckFile,) => void
}

export function CustomChecksSection({
  formType,
  selectedChecks,
  selectedClientId,
  backgroundCheckFiles,
  updateCheckFileStatus,
  updateFormData,
}: CustomChecksSectionProps) {
  const [customCheckName, setCustomCheckName] = useState('');

  const predefinedChecks = BACKGROUND_CHECK_OPTIONS[formType];
  const customChecks = selectedChecks.filter(
    (checkName) => !(predefinedChecks as readonly string[]).includes(checkName),
  );

  const handleAddCustomCheck = () => {
  if (!customCheckName.trim()) return;
  const trimmedName = customCheckName.trim();
  
  // Check if check already exists
  if (selectedChecks.includes(trimmedName)) {
    return; // Could show error message here
  }
  
  // Add the custom check to selected checks AND create the corresponding file object
  const newChecks = [...selectedChecks, trimmedName];
  const newBackgroundCheckFile: BackgroundCheckFile = {
    checkName: trimmedName,
    fileUploaded: false,
    fileName: '',
    fileId: '',
    result: DEFAULT_CHECK_RESULT,
  };
  
  updateFormData({ 
    backgroundChecks: newChecks,
    backgroundCheckFiles: [...backgroundCheckFiles, newBackgroundCheckFile]
  });
  
  console.log(`updateFormData called from CustomChecks setChecks`);
  setCustomCheckName('');
};

const handleRemoveCustomCheck = (checkToRemove: string) => {
  const newChecks = selectedChecks.filter((check) => check !== checkToRemove);
  const newBackgroundCheckFiles = backgroundCheckFiles.filter(
    (file) => file.checkName !== checkToRemove
  );
  
  updateFormData({ 
    backgroundChecks: newChecks,
    backgroundCheckFiles: newBackgroundCheckFiles
  });
  
  console.log(`updateFormData called from CustomChecks removechecks`);
};

const handleResultChange = (checkName: string, result: CheckResult) => {
  const newBackgroundCheckFiles = (backgroundCheckFiles || []).map((file) =>
    file.checkName === checkName ? { ...file, result } : file,
  );

  updateFormData({ backgroundCheckFiles: newBackgroundCheckFiles });
};

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddCustomCheck();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Plus className="w-5 h-5 text-green-600" />
            <CardTitle>Custom Background Checks</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            {customChecks.length} custom checks
          </Badge>
        </div>
        <CardDescription>
          Add additional background checks not listed in the standard options
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Add Custom Check Input */}
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="To create a custom check, enter the name here first"
              value={customCheckName}
              onChange={(e) => setCustomCheckName(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button
              onClick={handleAddCustomCheck}
              disabled={
                !customCheckName.trim() ||
                selectedChecks.includes(customCheckName.trim())
              }
              size="sm"
              className="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Check
            </Button>
          </div>

          {/* Display Custom Checks */}
          {customChecks.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900">
                Added Custom Checks:
              </h4>
              <div className="space-y-2">
                {customChecks.map((checkName) => {
                  const fileInfo = backgroundCheckFiles.find(
                    (f) => f.checkName === checkName,
                  );
                  return (
                    <div
                      key={checkName}
                      className="flex flex-col gap-2 rounded-lg border border-green-200 bg-green-50 p-3 sm:flex-row sm:items-center sm:gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium text-green-900">
                          {checkName}
                        </span>
                        {fileInfo?.fileUploaded && (
                          <Badge
                            variant="outline"
                            className="ml-2 text-xs bg-green-100 text-green-800 border-green-300"
                          >
                            File Uploaded
                          </Badge>
                        )}
                        {fileInfo?.fileName && (
                          <p className="mt-1 text-xs text-green-700">
                            {fileInfo.fileName}
                          </p>
                        )}
                      </div>
                      <div className="w-full sm:w-48">
                        <CheckResultSelect
                          checkName={checkName}
                          result={fileInfo?.result}
                          onChange={(result) =>
                            handleResultChange(checkName, result)
                          }
                          compact
                        />
                      </div>
                      <button
                        onClick={() => handleRemoveCustomCheck(checkName)}
                        className="self-start rounded-full p-1 text-green-800 transition-colors hover:bg-green-200 sm:self-center"
                        aria-label={`Remove ${checkName}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {customChecks.length === 0 && (
            <p className="text-sm text-gray-500 italic">
              No custom checks added yet. Use the input above to add additional
              background checks.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
