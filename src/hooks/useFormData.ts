"use client"

import { useState, useEffect, useCallback } from "react"
import { type FormData, DEFAULT_FORM_DATA, FormDataSchema } from "../types"

const STORAGE_KEY = "cleartech-background-form-data"
const AUTO_SAVE_INTERVAL = 30000 // 30 seconds

export function useFormData() {
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA)
  const [isLoading, setIsLoading] = useState(true)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        const validated = FormDataSchema.safeParse(parsed)
        if (validated.success) {
          setFormData(validated.data)
        }
      }
    } catch (error) {
      console.error("Error loading form data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Save to localStorage
  const saveToStorage = useCallback((data: FormData) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      setLastSaved(new Date())
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error("Error saving form data:", error)
    }
  }, [])

  // Update form data
  const updateFormData = useCallback((updates: Partial<FormData>) => {
    setFormData((prev) => {
      const newData = { ...prev, ...updates }
      return newData
    })
    setHasUnsavedChanges(true)
  }, [])

  // Update nested identification data
  const updateIdentification = useCallback(
    (updates: Partial<FormData["identification"]>) => {
      updateFormData({
        identification: { ...formData.identification, ...updates },
      })
    },
    [formData.identification, updateFormData],
  )

  // Reset form data
  const resetFormData = useCallback(() => {
    setFormData(DEFAULT_FORM_DATA)
    localStorage.removeItem(STORAGE_KEY)
    setHasUnsavedChanges(false)
    setLastSaved(null)
  }, [])

  // Manual save
  const saveFormData = useCallback(() => {
    saveToStorage(formData)
  }, [formData, saveToStorage])

  // Auto-save effect
  useEffect(() => {
    if (!hasUnsavedChanges) return

    const timer = setTimeout(() => {
      saveToStorage(formData)
    }, AUTO_SAVE_INTERVAL)

    return () => clearTimeout(timer)
  }, [formData, hasUnsavedChanges, saveToStorage])

  return {
    formData,
    isLoading,
    lastSaved,
    hasUnsavedChanges,
    updateFormData,
    updateIdentification,
    resetFormData,
    saveFormData,
  }
}

// remove