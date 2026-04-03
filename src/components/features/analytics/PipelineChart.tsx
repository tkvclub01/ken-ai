'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { usePipelineData } from '@/hooks/useAnalytics'
import { getStageColor } from '@/lib/utils'

export function PipelineChart() {
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
    <Card>
      <CardHeader>
        <CardTitle>Pipeline Overview</CardTitle>
        <CardDescription>Student journey through application stages</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pipelineData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" radius={[4, 4, 0, 0]}>
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
}
