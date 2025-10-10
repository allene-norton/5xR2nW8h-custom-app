'use server'

import { revalidatePath } from 'next/cache'
import { copilotApi } from 'copilot-node-sdk';

const apiKey = process.env.COPILOT_API_KEY

// Helper function to create SDK instance
function createSDK(token: string) {
  if (!apiKey) {
    throw new Error('COPILOT_API_KEY is not configured')
  }

  if (!token) {
    throw new Error('Token is required')
  }

  return copilotApi({
    apiKey: apiKey,
    token: token,
  })
}

export async function listClients(token: string) {
  try {
    const sdk = createSDK(token)
    const clients = await sdk.listClients({limit: 2000})
    revalidatePath('/internal')
    return { success: true, data: clients }
  } catch (error) {
    console.error('Error fetching clients:', error)
    return { success: false, error: 'Failed to fetch clients' }
  }
}
export type ListClientsResponse = Awaited<ReturnType<typeof listClients>>


