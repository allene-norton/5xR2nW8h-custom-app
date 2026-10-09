'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  type CoverLetterTemplate,
  CoverLetterTemplateSchema,
  DEFAULT_COVER_LETTER_TEMPLATE,
} from '@/types/cover-letter';

/**
 * Loads the workspace's cover letter template (falling back to the built-in
 * defaults while loading or on error, so every consumer — the client portal
 * preview, the PDF generator, the settings page itself — always has
 * something valid to render) and exposes a way to save changes to it.
 */
export function useCoverLetterTemplate() {
  const [template, setTemplate] = useState<CoverLetterTemplate>(
    DEFAULT_COVER_LETTER_TEMPLATE,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadTemplate = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const response = await fetch('/api/cover-letter-template');
      if (!response.ok) {
        throw new Error(`Failed to load template (${response.status})`);
      }
      const data = await response.json();
      const validated = CoverLetterTemplateSchema.safeParse(data);
      if (validated.success) {
        setTemplate(validated.data);
      } else {
        console.error('Cover letter template failed validation:', validated.error);
        setTemplate(DEFAULT_COVER_LETTER_TEMPLATE);
      }
    } catch (error) {
      console.error('Error loading cover letter template:', error);
      setLoadError(
        error instanceof Error ? error.message : 'Failed to load template',
      );
      setTemplate(DEFAULT_COVER_LETTER_TEMPLATE);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplate();
  }, [loadTemplate]);

  const saveTemplate = useCallback(async (next: CoverLetterTemplate) => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const response = await fetch('/api/cover-letter-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save template');
      }
      setTemplate(result.data);
      return result.data as CoverLetterTemplate;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to save template';
      setSaveError(message);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, []);

  return {
    template,
    isLoading,
    loadError,
    isSaving,
    saveError,
    saveTemplate,
    reloadTemplate: loadTemplate,
  };
}
