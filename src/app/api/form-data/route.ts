// app/api/form-data/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { FormDataSchema } from '@/types';
import {
  saveFormData,
  getFormData,
  deleteFormData,
} from '@/lib/upstash-storage';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const data = await getFormData(userId);
    return NextResponse.json(data || null);
  } catch (error) {
    console.error('Error fetching form data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch form data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, data } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Validate data
    const validated = FormDataSchema.safeParse(data);
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validated.error },
        { status: 400 }
      );
    }

    await saveFormData(userId, validated.data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving form data:', error);
    return NextResponse.json(
      { error: 'Failed to save form data' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    await deleteFormData(userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting form data:', error);
    return NextResponse.json(
      { error: 'Failed to delete form data' },
      { status: 500 }
    );
  }
}