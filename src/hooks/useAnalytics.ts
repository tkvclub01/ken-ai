'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { DashboardStats, PipelineData, MonthlyData, CounselorPerformance, CountryDistribution } from '@/types'

/**
 * Hook to fetch dashboard statistics
 */
export function useDashboardStats() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      // Fetch student stats
      const { data: students } = await supabase
        .from('students')
        .select('status, current_stage')

      // Fetch document stats
      const { data: documents } = await supabase
        .from('documents')
        .select('ocr_status')

      const stats: DashboardStats = {
        totalStudents: students?.length || 0,
        activeStudents: students?.filter((s) => s.status === 'active').length || 0,
        visaApproved: students?.filter((s) => s.current_stage === 'visa').length || 0,
        visaRejected: 0, // You'd need to track this separately
        totalDocuments: documents?.length || 0,
        pendingDocuments: documents?.filter((d) => d.ocr_status === 'pending').length || 0,
        totalRevenue: 0, // Add revenue tracking if needed
        pendingRevenue: 0,
      }

      return stats
    },
  })
}

/**
 * Hook to fetch pipeline data for funnel chart
 */
export function usePipelineData() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['dashboard', 'pipeline'],
    queryFn: async () => {
      const { data: students } = await supabase.from('students').select('current_stage')

      const pipelineData: PipelineData[] = [
        { id: 'lead', name: 'Lead', count: 0, conversion_rate: 0 },
        { id: 'applied', name: 'Applied', count: 0, conversion_rate: 0 },
        { id: 'interview', name: 'Interview', count: 0, conversion_rate: 0 },
        { id: 'visa', name: 'Visa', count: 0, conversion_rate: 0 },
        { id: 'departed', name: 'Departed', count: 0, conversion_rate: 0 },
        { id: 'completed', name: 'Completed', count: 0, conversion_rate: 0 },
      ]

      students?.forEach((student) => {
        const stage = pipelineData.find((p) => p.id === student.current_stage)
        if (stage) stage.count++
      })

      // Calculate conversion rates
      for (let i = 0; i < pipelineData.length - 1; i++) {
        const current = pipelineData[i].count
        const next = pipelineData[i + 1].count
        pipelineData[i].conversion_rate = current > 0 ? next / current : 0
      }

      return pipelineData
    },
  })
}

/**
 * Hook to fetch monthly trends
 */
export function useMonthlyTrends() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['dashboard', 'monthly'],
    queryFn: async () => {
      const { data: students } = await supabase
        .from('students')
        .select('created_at')
        .order('created_at', { ascending: true })

      const monthlyData: MonthlyData[] = []

      // Group by month
      students?.forEach((student) => {
        const month = new Date(student.created_at).toLocaleDateString('en-US', {
          year: '2-digit',
          month: 'short',
        })

        const existing = monthlyData.find((m) => m.month === month)
        if (existing) {
          existing.students++
        } else {
          monthlyData.push({ month, students: 1, revenue: 0 })
        }
      })

      return monthlyData
    },
  })
}

/**
 * Hook to fetch country distribution
 */
export function useCountryDistribution() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['dashboard', 'countries'],
    queryFn: async () => {
      const { data: students } = await supabase
        .from('students')
        .select('target_country')

      const distribution: CountryDistribution[] = []

      students?.forEach((student) => {
        if (!student.target_country) return

        const existing = distribution.find((c) => c.country === student.target_country)
        if (existing) {
          existing.count++
        } else {
          distribution.push({ country: student.target_country, count: 1 })
        }
      })

      return distribution.sort((a, b) => b.count - a.count).slice(0, 10)
    },
  })
}

/**
 * Combined analytics hook for comprehensive dashboard data
 */
export function useAnalytics() {
  const { data: stats } = useDashboardStats()
  const { data: pipeline } = usePipelineData()
  const { data: monthly } = useMonthlyTrends()
  const { data: countries } = useCountryDistribution()

  return {
    data: {
      ...stats,
      pipeline,
      monthly,
      countries,
    },
    isLoading: !stats || !pipeline || !monthly || !countries,
  }
}
