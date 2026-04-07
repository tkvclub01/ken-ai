'use client'

import { memo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { usePipelineData } from '@/hooks/useAnalytics'
import { getStageColor } from '@/lib/utils'

export const PipelineChart = memo(function PipelineChart() {
  const { data: pipelineData, isLoading } = usePipelineData()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Overview</CardTitle>
          <CardDescription>Student journey through stages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-xl transition-all duration-300 border-2 border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Pipeline Overview</CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">Student journey through application stages</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full" style={{ minHeight: 300, minWidth: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pipelineData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {pipelineData?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getStageColor(entry.id)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
})
