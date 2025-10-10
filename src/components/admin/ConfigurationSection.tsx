'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Badge } from '../ui/badge';
import { Settings, User, FileText } from 'lucide-react';
import {
  type FormData,
  SAMPLE_CLIENTS,
  FORM_TYPE_INFO,
  Client
} from '../../types';
import { ListClientsResponse } from '@/lib/actions/sdk-requests';

interface ConfigurationSectionProps {
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
  clientsResponse: ListClientsResponse;
  clientsLoading: boolean;
  clientsError: string | null;
}

export function ConfigurationSection({
  formData,
  updateFormData,
  clientsResponse,
  clientsLoading,
  clientsError,
}: ConfigurationSectionProps) {

  const clients = clientsResponse.data?.data

  const selectedClient = clients?.find(
    (client) => client.id === formData.client,
  );
  const formTypeInfo = FORM_TYPE_INFO[formData.formType];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-blue-600" />
          <CardTitle>Configuration</CardTitle>
        </div>
        <CardDescription>
          Select the client and form type for this background check
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Client Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label
              htmlFor="client-select"
              className="flex items-center space-x-2"
            >
              <User className="w-4 h-4" />
              <span>Client</span>
            </Label>
            <Select
              value={formData.client}
              onValueChange={(value) => updateFormData({ client: value })}
            >
              <SelectTrigger id="client-select">
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients?.filter(client => client.id).map((client) => (
                  <SelectItem key={client.id} value={client.id!}>
                    <div className="flex flex-col">
                      <span className="font-medium">{client.givenName} {client.familyName}</span>
                      {client.email && (
                        <span className="text-sm text-gray-500">
                          {client.email}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedClient && (
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <strong>Email:</strong> {selectedClient.email}
                </p>
                {/* <p>
                  <strong>Phone:</strong> {selectedClient.phone}
                </p> */}
              </div>
            )}
          </div>

          {/* Form Type Selection */}
          <div className="space-y-2">
            <Label
              htmlFor="form-type-select"
              className="flex items-center space-x-2"
            >
              <FileText className="w-4 h-4" />
              <span>Form Type</span>
            </Label>
            <Select
              value={formData.formType}
              onValueChange={(value: 'tenant' | 'employment' | 'nonprofit') =>
                updateFormData({ formType: value, backgroundChecks: [] })
              }
            >
              <SelectTrigger id="form-type-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tenant">Tenant Screening</SelectItem>
                <SelectItem value="employment">
                  Employment Verification
                </SelectItem>
                <SelectItem value="nonprofit">Nonprofit Volunteer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Form Type Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-blue-900">
                {formTypeInfo.title}
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                {formTypeInfo.description}
              </p>
              <div className="mt-3">
                <p className="text-sm font-medium text-blue-900 mb-2">
                  Required Checks:
                </p>
                <div className="flex flex-wrap gap-2">
                  {formTypeInfo.requiredChecks.map((check) => (
                    <Badge
                      key={check}
                      variant="outline"
                      className="text-xs bg-blue-100 text-blue-800 border-blue-300"
                    >
                      {check}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
