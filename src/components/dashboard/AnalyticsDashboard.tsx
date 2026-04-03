'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts'
import { Users, FileText, CheckCircle, TrendingUp, DollarSign, Clock } from 'lucide-react'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export function AnalyticsDashboard() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    visaApproved: 0,
    visaRejected: 0,
    totalDocuments: 0,
    pendingDocuments: 0,
    totalRevenue: 0,
    pendingRevenue: 0,
  })
  const [pipelineData, setPipelineData] = useState<any[]>([])
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [counselorPerformance, setCounselorPerformance] = useState<any[]>([])
  const [countryDistribution, setCountryDistribution] = useState<any[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      // Load basic stats
      await Promise.all([
        loadStudentStats(),
        loadPipelineStats(),
        loadMonthlyTrend(),
        loadCounselorPerformance(),
        loadCountryDistribution(),
      ])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadStudentStats() {
    const { data: students } = await supabase
      .from('students')
      .select('status, intended_country, gpa')
    
    const totalStudents = students?.length || 0
    const activeStudents = students?.filter(s => s.status === 'active').length || 0
    
    setStats(prev => ({
      ...prev,
      totalStudents,
      activeStudents,
    }))
  }

  async function loadPipelineStats() {
    const { data: pipeline } = await supabase
      .from('student_pipeline')
      .select(`
        current_stage_id,
        pipeline_stages (
          name,
          color
        )
      `)
    
    const { data: documents } = await supabase
      .from('documents')
      .select('ocr_status')

    // Group by stage
    const stageCounts: Record<string, number> = {}
    pipeline?.forEach(p => {
      const stageName = (p.pipeline_stages as any)?.name || 'Unknown'
      stageCounts[stageName] = (stageCounts[stageName] || 0) + 1
    })

    const pipelineChartData = Object.entries(stageCounts).map(([name, count], index) => ({
      name,
      value: count,
      color: COLORS[index % COLORS.length],
    }))

    const pendingDocs = documents?.filter(d => d.ocr_status === 'pending' || d.ocr_status === 'processing').length || 0
    const totalDocs = documents?.length || 0

    setPipelineData(pipelineChartData)
    setStats(prev => ({
      ...prev,
      totalDocuments: totalDocs,
      pendingDocuments: pendingDocs,
    }))
  }

  async function loadMonthlyTrend() {
    // Simulated monthly data (in production, query by created_at)
    const mockData = [
      { month: 'Jan', students: 12, revenue: 24000, visas: 8 },
      { month: 'Feb', students: 19, revenue: 38000, visas: 12 },
      { month: 'Mar', students: 15, revenue: 30000, visas: 10 },
      { month: 'Apr', students: 22, revenue: 44000, visas: 15 },
      { month: 'May', students: 28, revenue: 56000, visas: 18 },
      { month: 'Jun', students: 25, revenue: 50000, visas: 16 },
    ]
    setMonthlyData(mockData)
    
    const totalRevenue = mockData.reduce((sum, m) => sum + m.revenue, 0)
    setStats(prev => ({ ...prev, totalRevenue }))
  }

  async function loadCounselorPerformance() {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('role', 'counselor')

    const counselorData = await Promise.all(
      profiles?.map(async (counselor) => {
        const { count: studentCount } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('counselor_id', counselor.id)

        return {
          name: counselor.full_name || 'Unnamed',
          students: studentCount || 0,
          conversion: Math.round(Math.random() * 30 + 60), // Mock conversion rate
        }
      }) || []
    )

    setCounselorPerformance(counselorData)
  }

  async function loadCountryDistribution() {
    const { data: students } = await supabase
      .from('students')
      .select('intended_country')

    const countryCounts: Record<string, number> = {}
    students?.forEach(s => {
      const country = s.intended_country || 'Unspecified'
      countryCounts[country] = (countryCounts[country] || 0) + 1
    })

    const countryData = Object.entries(countryCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)

    setCountryDistribution(countryData)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your study abroad consultancy performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeStudents} active students
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDocuments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingDocuments} pending verification
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all months
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12.5 days</div>
            <p className="text-xs text-muted-foreground">
              Average per application
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="countries">Countries</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Monthly Trend */}
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Monthly Revenue Trend</CardTitle>
                <CardDescription>Revenue and student enrollment over time</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="revenue" stroke="#8884d8" fillOpacity={1} fill="url(#colorRevenue)" />
                    <Area type="monotone" dataKey="students" stroke="#82ca9d" fillOpacity={1} fill="url(#colorStudents)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Country Distribution */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Top Destinations</CardTitle>
                <CardDescription>Most popular study destinations</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={countryDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {countryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Distribution</CardTitle>
              <CardDescription>Students at each stage of the application process</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={pipelineData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="Students" fill="#8884d8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Counselor Performance</CardTitle>
              <CardDescription>Student load and conversion rates by counselor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {counselorPerformance.map((counselor, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{counselor.name}</span>
                      <div className="flex items-center gap-4">
                        <Badge variant="secondary">{counselor.students} students</Badge>
                        <Badge>{counselor.conversion}% conversion</Badge>
                      </div>
                    </div>
                    <Progress value={counselor.conversion} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="countries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Country Analytics</CardTitle>
              <CardDescription>Detailed breakdown by destination country</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={countryDistribution}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
