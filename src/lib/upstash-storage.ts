// lib/upstash-storage.ts
import { Redis } from '@upstash/redis';
import type { BackgroundCheckFormData } from '@/types';
import type { CoverLetterTemplate } from '@/types/cover-letter';

const redis = Redis.fromEnv();

export async function saveFormData(clientId: string, data: BackgroundCheckFormData) {
  await redis.set(`form:${clientId}`, data);
}

export async function getFormData(clientId: string): Promise<BackgroundCheckFormData | null> {
  return await redis.get(`form:${clientId}`);
}

export async function deleteFormData(clientId: string) {
  await redis.del(`form:${clientId}`);
}

// Cover letter template — workspace-wide (not per-client), so this is a
// single fixed key rather than keyed by clientId like the form data above.
const COVER_LETTER_TEMPLATE_KEY = 'cover-letter-template:default';

export async function saveCoverLetterTemplate(template: CoverLetterTemplate) {
  await redis.set(COVER_LETTER_TEMPLATE_KEY, template);
}

export async function getCoverLetterTemplate(): Promise<CoverLetterTemplate | null> {
  return await redis.get(COVER_LETTER_TEMPLATE_KEY);
}

// Optional for admin/debugging
// export async function listFormDataKeys(): Promise<string[]> {
//   return await redis.keys('form:*');
// }