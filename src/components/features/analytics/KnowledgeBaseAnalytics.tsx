'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { useKnowledgeBaseAnalytics } from '@/hooks/useKnowledgeBaseAnalytics'
import { 
  BookOpen, 
  TrendingUp, 
  AlertCircle, 
  Search, 
  ThumbsUp, 
  ThumbsDown,
  Clock,
  Eye,
  MessageSquare
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export function KnowledgeBaseAnalytics() {
  const {
    getArticleUsage,
    getContentGaps,
    getLowRatedArticles,
    getFailedSearches,
  } = useKnowledgeBaseAnalytics()

  const articleUsage = getArticleUsage.data || []
  const contentGaps = getContentGaps.data || []
  const lowRatedArticles = getLowRatedArticles.data || []
  const failedSearches = getFailedSearches.data || []

  // Calculate totals
  const totalViews = articleUsage.reduce((sum, article) => sum + article.viewCount, 0)
  const avgHelpfulRate = articleUsage.length > 0
    ? (articleUsage.reduce((sum, article) => {
        const total = article.helpfulCount + article.notHelpfulCount
        return sum + (total > 0 ? (article.helpfulCount / total) * 100 : 0)
      }, 0) / articleUsage.length).toFixed(1)
    : 0

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all articles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Helpful Rate</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgHelpfulRate}%</div>
            <p className="text-xs text-muted-foreground">
              User satisfaction
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Gaps</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contentGaps.length}</div>
            <p className="text-xs text-muted-foreground">
              Topics needing articles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Searches</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedSearches.length}</div>
            <p className="text-xs text-muted-foreground">
              No results found
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Most Viewed Articles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Most Viewed Articles
            </CardTitle>
            <CardDescription>Top performing knowledge base content</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {articleUsage.slice(0, 10).map((article, index) => {
                  const totalFeedback = article.helpfulCount + article.notHelpfulCount
                  const helpfulRate = totalFeedback > 0
                    ? ((article.helpfulCount / totalFeedback) * 100).toFixed(0)
                    : 0

                  return (
                    <div key={article.articleId} className="space-y-2 p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">#{index + 1}</Badge>
                            <span className="text-sm font-medium truncate">
                              Article ID: {article.articleId.slice(0, 8)}...
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {article.viewCount} views
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {article.averageTimeSpent ? `${Math.round(article.averageTimeSpent)}s avg` : 'N/A'}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="flex items-center gap-1 text-xs">
                            <ThumbsUp className="h-3 w-3 text-green-500" />
                            <span className="font-medium">{helpfulRate}%</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {article.helpfulCount}/{article.notHelpfulCount}
                          </div>
                        </div>
                      </div>

                      {/* Helpfulness Progress */}
                      <Progress value={Number(helpfulRate)} className="h-1.5" />

                      {/* Last Viewed */}
                      {article.lastViewedAt && (
                        <div className="text-xs text-muted-foreground">
                          Last viewed: {formatDistanceToNow(new Date(article.lastViewedAt), { addSuffix: true })}
                        </div>
                      )}
                    </div>
                  )
                })}

                {articleUsage.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>No article data yet</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Content Gaps & Failed Searches */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Content Opportunities
            </CardTitle>
            <CardDescription>Topics users are searching for but not finding</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {/* High Priority Content Gaps */}
                {contentGaps.filter(gap => gap.priority === 'high').length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      High Priority Gaps
                    </h4>
                    {contentGaps.filter(gap => gap.priority === 'high').map((gap, index) => (
                      <div key={index} className="p-3 rounded-lg border bg-red-50 dark:bg-red-950/20">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{gap.topic}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {gap.unansweredQuestions} unanswered questions
                            </p>
                          </div>
                          <Badge variant="destructive" className="text-xs">High</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Medium Priority Content Gaps */}
                {contentGaps.filter(gap => gap.priority === 'medium').length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold flex items-center gap-2 text-orange-600">
                      <AlertCircle className="h-4 w-4" />
                      Medium Priority Gaps
                    </h4>
                    {contentGaps.filter(gap => gap.priority === 'medium').map((gap, index) => (
                      <div key={index} className="p-3 rounded-lg border bg-orange-50 dark:bg-orange-950/20">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{gap.topic}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {gap.unansweredQuestions} unanswered questions
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs border-orange-500 text-orange-600">Medium</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Top Failed Searches */}
                {failedSearches.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      Common Failed Searches
                    </h4>
                    {failedSearches.slice(0, 5).map((search: { search_query: string; failure_count: number; unique_users: number }, index: number) => (
                      <div key={index} className="p-3 rounded-lg border bg-card">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium">&quot;{search.search_query}&quot;</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                              <span>{search.failure_count} attempts</span>
                              <span>{search.unique_users} users</span>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="text-xs">
                            Create Article
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {contentGaps.length === 0 && failedSearches.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>No content gaps detected</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Low Rated Articles */}
      {lowRatedArticles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ThumbsDown className="h-5 w-5" />
              Articles Needing Improvement
            </CardTitle>
            <CardDescription>Articles with low helpful ratings that need updates</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {lowRatedArticles.map((article: { article_id: string; title: string; total_feedback: number; helpful_percentage: number }) => (
                  <div key={article.article_id} className="p-4 rounded-lg border bg-card">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold mb-2">{article.title}</h4>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {article.total_feedback} feedback entries
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3 text-green-500" />
                            {article.helpful_percentage?.toFixed(1)}% helpful
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive" className="mb-2">Needs Work</Badge>
                        <Button variant="outline" size="sm">
                          Review Article
                        </Button>
                      </div>
                    </div>
                    
                    {/* Rating Progress */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>Helpful Rating</span>
                        <span>{article.helpful_percentage?.toFixed(1)}%</span>
                      </div>
                      <Progress value={article.helpful_percentage || 0} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
