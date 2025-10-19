// lib/upstash-storage.ts
import { Redis } from '@upstash/redis';
import type { BackgroundCheckFormData } from '@/types';

const redis = Redis.fromEnv();

export async function saveFormData(userId: string, data: BackgroundCheckFormData) {
  await redis.set(`form:${userId}`, data);
}

export async function getFormData(userId: string): Promise<BackgroundCheckFormData | null> {
  return await redis.get(`form:${userId}`);
}

export async function deleteFormData(userId: string) {
  await redis.del(`form:${userId}`);
}

// Optional for admin/debugging
// export async function listFormDataKeys(): Promise<string[]> {
//   return await redis.keys('form:*');
// }