'use server';

import { revalidatePath } from 'next/cache';
import { copilotApi } from 'copilot-node-sdk';

const copilotApiKey = process.env.COPILOT_API_KEY;
const assemblyApiKey = process.env.ASSEMBLY_API_KEY;
const isDev = process.env.NODE_ENV === 'development';

const ASSEMBLY_BASE_URI = 'https://api.assembly.com/v1';


// ---------- Unified types (single source of truth)
// clients
export interface Client {
  avatarImageUrl?: string;
  companyId?: string;
  companyIds?: string[];
  createdAt?: string;
  creationMethod?: string;
  customFields?: any;
  email?: string;
  fallbackColor?: string;
  familyName?: string;
  firstLoginDate?: string;
  givenName?: string;
  id?: string;
  inviteUrl?: string;
  invitedBy?: string;
  lastLoginDate?: string;
  object?: 'client';
  status?: string;
  updatedAt?: string;
}

export interface ClientsData {
  data?: Client[] | undefined;
  nextToken?: string;
}

export type ListClientsResponse = {
  success: boolean;
  data?: ClientsData;
  error?: string;
};

// forms
export interface FormField {
  formFieldId?: string;
  title?: string;
  description?: string;
  type?: 'multiSelect' | 'singleSelect' | 'title' | 'shortAnswer' | 'longAnswer' | 'fileUpload';
  isRequired?: boolean;
  multipleChoiceOptions?: string[];
}

 export interface Form {
  id?: string;
  createdAt?: string;
  object?: 'form';
  name?: string;
  description?: string;
  formFieldIds?: string[];
  formFields?: FormField[];
  allowMultipleSubmissions?: boolean;
  visibility?: 'allClients' | string;
  formResponseRequests?: number;
  formResponseSubmissions?: number;
  latestSubmissionDate?: string;
}

export interface FormsResponse {
  data?: Form[];
  nextToken?: string;
}

// form responses
export interface FormResponseField {
  title?: string;
  description?: string;
  type?: 'multiSelect' | 'singleSelect' | 'title' | 'shortAnswer' | 'longAnswer' | 'fileUpload'; // ts error here from sdk, possibly incorrect
  multipleChoiceOptions?: string[];
  isRequired?: boolean;
  answer?: string | string[];
  attachmentUrls?: string[];
}

export interface FormResponse {
  allowMultipleSubmissions?: boolean;
  clientId?: string;
  companyId?: string;
  createdAt?: string;
  formDescription?: string;
  formFieldIds?: string[];
  formFields?: Record<string, FormResponseField>;
  formId?: string;
  formName?: string;
  id?: string;
  object?: 'formResponse';
  status?: 'completed' | 'pending';
  submissionDate?: string;
  visibility?: 'requestedClients' | 'allClients';
  fields?: {
    formName?: string;
    formDescription?: string;
    formFieldIds?: string[];
    formFields?: Record<string, FormResponseField>;
    status?: string;
    allowMultipleSubmissions?: boolean;
    visibility?: string;
    submissionDate?: string;
  };
}

export interface FormResponsesApiResponse {
  data?: FormResponse[];
}

export type FormResponseArray = FormResponse[]


// contracts

export interface ContractField {
  id?: string;
  inputType?: string
  isOptional?: boolean;
  label?: string;
  page?: number;
  type?: string
  value?: string;
}

export interface Contract {
  clientId?: string;
  companyId?: string;
  contractTemplateId?: string;
  createdAt?: string;
  creationMode?: 'template';
  fields?: ContractField[];
  fileUrl?: string;
  id?: string;
  name?: string;
  object?: 'contract';
  recipientId?: string;
  shareDate?: string;
  signedFileUrl?: string;
  status?: 'signed' | 'pending' | 'draft';
  submissionDate?: string;
  updatedAt?: string;
}

export interface ContractsResponse {
  data?: Contract[];
}

export type ContractArray = Contract[]







//--------- api/sdk calls--------------

// Helper function to create SDK instance
function createSDK(token: string) {
  if (!copilotApiKey) {
    throw new Error('COPILOT_API_KEY is not configured');
  }
  if (!token) {
    throw new Error('Token is required');
  }
  return copilotApi({
    apiKey: copilotApiKey,
    token: token,
  });
}


// listClients action
export async function listClients(
  token?: string,
): Promise<ListClientsResponse> {
  try {
    if (isDev) {
      // Dev mode: use Assembly API directly
      if (!assemblyApiKey) {
        throw new Error('ASSEMBLY_API_KEY is required for dev mode');
      }

      const response = await fetch(`${ASSEMBLY_BASE_URI}/clients`, {
        method: 'GET',
        headers: {
          'X-API-KEY': assemblyApiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      revalidatePath('/internal');
      return { success: true, data };
    } else {
      // Prod mode: use Copilot SDK with token
      if (!token) {
        throw new Error('Token is required in production');
      }

      const sdk = createSDK(token);
      const clients = await sdk.listClients({ limit: 2000 });
      revalidatePath('/internal');
      return { success: true, data: clients as ClientsData };
    }
  } catch (error) {
    console.error('Error fetching clients:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch clients',
    };
  }
}

// listForms action
export async function listForms(token?: string) {
  try {
    if (isDev) {
      // Dev mode: use Assembly API directly
      if (!assemblyApiKey) {
        throw new Error('ASSEMBLY_API_KEY is required for dev mode');
      }

      const response = await fetch(`${ASSEMBLY_BASE_URI}/forms`, {
        method: 'GET',
        headers: {
          'X-API-KEY': assemblyApiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      revalidatePath('/internal');
      return data;
    } else {
      // Prod mode: use Copilot SDK with token
      if (!token) {
        throw new Error('Token is required in production');
      }

      const sdk = createSDK(token);
      const data = await sdk.listForms({limit: 2000})
      revalidatePath('/internal');
      return data
    }
  } catch (error) {
    console.error('Error fetching forms:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to fetch forms',
    };
  }
}


// listFormResponses action
export async function listFormResponses(formId: string, token?: string ) {
  try {
    if (isDev) {
      // Dev mode: use Assembly API directly
      if (!assemblyApiKey) {
        throw new Error('ASSEMBLY_API_KEY is required for dev mode');
      }

      const response = await fetch(`${ASSEMBLY_BASE_URI}/forms/${formId}/form-responses`, {
        method: 'GET',
        headers: {
          'X-API-KEY': assemblyApiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      revalidatePath('/internal');
      return data;
    } else {
      // Prod mode: use SDK with token
      if (!token) {
        throw new Error('Token is required in production');
      }

      const sdk = createSDK(token);
      const data = await sdk.listFormResponses({id: formId})
      revalidatePath('/internal');
      return data
    }
  } catch (error) {
    console.error('Error fetching forms:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to fetch forms',
    };
  }
}

// listContracts action
export async function listContracts(clientId: string, token?: string) {
  try {
    if (isDev) {
      // Dev mode: use Assembly API directly
      if (!assemblyApiKey) {
        throw new Error('ASSEMBLY_API_KEY is required for dev mode');
      }

      const response = await fetch(`${ASSEMBLY_BASE_URI}/contracts?clientId=${clientId}`, {
        method: 'GET',
        headers: {
          'X-API-KEY': assemblyApiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      revalidatePath('/internal');
      return data;
    } else {
      // Prod mode: use Copilot SDK with token
      if (!token) {
        throw new Error('Token is required in production');
      }

      const sdk = createSDK(token);
      const data = await sdk.listContracts({clientId: clientId})
      revalidatePath('/internal');
      return data
    }
  } catch (error) {
    console.error('Error fetching forms:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to fetch forms',
    };
  }
}

// findFileChannel action
export async function findFileChannel(clientId: string, token?: string) {
  try {
    if (isDev) {
      // Dev mode: use Assembly API directly
      if (!assemblyApiKey) {
        throw new Error('ASSEMBLY_API_KEY is required for dev mode');
      }

      const response = await fetch(`${ASSEMBLY_BASE_URI}/channels/files?clientId=${clientId}`, {
        method: 'GET',
        headers: {
          'X-API-KEY': assemblyApiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      revalidatePath('/internal');
      return data;
    } else {
      // Prod mode: use Copilot SDK with token
      if (!token) {
        throw new Error('Token is required in production');
      }

      const sdk = createSDK(token);
      const data = await sdk.listFileChannels({clientId: clientId})
      revalidatePath('/internal');
      return data
    }
  } catch (error) {
    console.error('Error fetching forms:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to fetch forms',
    };
  }
}