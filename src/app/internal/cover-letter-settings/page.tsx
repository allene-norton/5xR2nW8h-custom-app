'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { CoverLetterSettingsForm } from '@/components/admin/CoverLetterSettingsForm';

function CoverLetterSettingsContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const backHref = token ? `/internal?token=${token}` : '/internal';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <Link
              href={backHref}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Admin Interface
            </Link>
            <div className="h-6 w-px bg-gray-200" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Cover Letter Settings
              </h1>
              <p className="text-sm text-gray-500">
                Edit the wording used on every report&apos;s cover letter
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CoverLetterSettingsForm />
      </main>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

export default function CoverLetterSettingsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CoverLetterSettingsContent />
    </Suspense>
  );
}
