// lib/actions/client-actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { copilotApi } from 'copilot-node-sdk';

const copilotApiKey = process.env.COPILOT_API_KEY
const assemblyApiKey = process.env.ASSEMBLY_API_KEY
const isDev = process.env.NODE_ENV === 'development'

// Unified types (single source of truth)
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
  object?: "client";
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
}

// Helper function to create SDK instance
function createSDK(token: string) {
  if (!copilotApiKey) {
    throw new Error('COPILOT_API_KEY is not configured')
  }
  if (!token) {
    throw new Error('Token is required')
  }
  return copilotApi({
    apiKey: copilotApiKey,
    token: token,
  })
}

// Unified listClients action
export async function listClients(token?: string): Promise<ListClientsResponse> {
  try {
    if (isDev) {
      // Dev mode: use Assembly API directly
      if (!assemblyApiKey) {
        throw new Error('ASSEMBLY_API_KEY is required for dev mode')
      }
      
      const response = await fetch('https://api.assembly.com/v1/clients', {
        method: 'GET',
        headers: {
          'X-API-KEY': assemblyApiKey,
        },
      })
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`)
      }
      
      const data = await response.json()
      revalidatePath('/internal')
      return { success: true, data }
      
    } else {
      // Prod mode: use Copilot SDK with token
      if (!token) {
        throw new Error('Token is required in production')
      }
      
      const sdk = createSDK(token)
      const clients = await sdk.listClients({ limit: 2000 })
      revalidatePath('/internal')
      return { success: true, data: clients as ClientsData}
    }
    
  } catch (error) {
    console.error('Error fetching clients:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch clients' 
    }
  }
}