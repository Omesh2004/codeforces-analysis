"use client"

import { useState, useEffect, useCallback } from "react"
import { cacheManager } from "@/lib/cache-manager"

interface UseStudentDataOptions {
  studentId: string
  endpoint: string
  params?: Record<string, any>
  enabled?: boolean
}

interface UseStudentDataReturn<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  clearCache: () => void
}

export function useStudentData<T = any>({
  studentId,
  endpoint,
  params,
  enabled = true,
}: UseStudentDataOptions): UseStudentDataReturn<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(
    async (useCache = true) => {
      if (!enabled || !studentId) {
        setLoading(false)
        return
      }

      try {
        // Check cache first
        if (useCache) {
          const cachedData = cacheManager.get(studentId, endpoint, params)
          if (cachedData) {
            setData(cachedData)
            setLoading(false)
            setError(null)
            return
          }
        }

        setLoading(true)
        setError(null)

        // Build URL with params
        const url = new URL(`/api/students/${studentId}/${endpoint}`, window.location.origin)
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, String(value))
          })
        }

        const response = await fetch(url.toString())

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()

        // Cache the result
        cacheManager.set(studentId, endpoint, result, params)

        setData(result)
        setError(null)
      } catch (err) {
        console.error(`Failed to fetch ${endpoint}:`, err)
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    },
    [studentId, endpoint, params, enabled],
  )

  const refetch = useCallback(async () => {
    await fetchData(false) // Force fresh fetch
  }, [fetchData])

  const clearCache = useCallback(() => {
    cacheManager.clearStudent(studentId)
  }, [studentId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch, clearCache }
}
