'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useCountryDistribution } from '@/hooks/useAnalytics'
import { Globe } from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884D8',
  '#82CA9D',
  '#FFC658',
  '#FF6B9D',
  '#A569BD',
  '#5DADE2',
]

export function CountryDistributionChart() {
  const { data: distribution, isLoading } = useCountryDistribution()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Country Distribution</CardTitle>
          <CardDescription>Student applications by destination country</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    )
  }

  if (!distribution || distribution.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Country Distribution</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <Globe className="h-12 w-12 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Country Distribution</CardTitle>
        <CardDescription>Top destinations for student applications</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={distribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {distribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
