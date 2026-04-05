'use client'

import { memo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Brain, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react'

export const AISummaryWidget = memo(function AISummaryWidget() {
  // Mock AI summary - in production, this would come from your AI service
  const summary = {
    date: new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    highlights: [
      '3 new students registered today',
      '5 visa applications approved this week',
      '2 documents pending verification',
    ],
    alerts: [
      'Interview scheduled for John Doe tomorrow at 10 AM',
      'Visa deadline for Jane Smith in 3 days',
    ],
    suggestions: [
      'Follow up with 5 pending applications',
      'Review 3 new document submissions',
      'Prepare for upcoming interview sessions',
    ],
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <div>
              <CardTitle>KEN AI Daily Briefing</CardTitle>
              <CardDescription>{summary.date}</CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm">
            Refresh
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Highlights */}
        <div>
          <h4 className="mb-2 text-sm font-semibold">Today's Highlights</h4>
          <ul className="space-y-2">
            {summary.highlights.map((highlight, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Alerts */}
        <div>
          <h4 className="mb-2 text-sm font-semibold">Alerts & Reminders</h4>
          <ul className="space-y-2">
            {summary.alerts.map((alert, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <AlertCircle className="mt-0.5 h-4 w-4 text-orange-600" />
                <span>{alert}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Suggestions */}
        <div>
          <h4 className="mb-2 text-sm font-semibold">AI Suggestions</h4>
          <ul className="space-y-2">
            {summary.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <Brain className="mt-0.5 h-4 w-4 text-purple-600" />
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
})
