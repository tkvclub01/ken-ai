'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export interface ArticleUsageStats {
  articleId: string
  viewCount: number
  searchQueriesLeadingToArticle: string[]
  helpfulCount: number
  notHelpfulCount: number
  averageTimeSpent: number // seconds
  lastViewedAt: string
}

export interface ContentGap {
  topic: string
  unansweredQuestions: number
  suggestedArticles: string[]
  priority: 'high' | 'medium' | 'low'
}

/**
 * Hook for tracking and analyzing knowledge base article usage
 */
export function useKnowledgeBaseAnalytics() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  /**
   * Track article view
   */
  const trackArticleView = useMutation({
    mutationFn: async ({
      articleId,
      searchQuery,
      timeSpent,
    }: {
      articleId: string
      searchQuery?: string
      timeSpent?: number
    }) => {
      const { error } = await supabase.rpc('track_article_view', {
        p_article_id: articleId,
        p_search_query: searchQuery || null,
        p_time_spent: timeSpent || null,
      })

      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['article-usage'] })
    },
  })

  /**
   * Record helpful/not helpful feedback
   */
  const recordFeedback = useMutation({
    mutationFn: async ({
      articleId,
      isHelpful,
    }: {
      articleId: string
      isHelpful: boolean
    }) => {
      const { error } = await supabase.rpc('record_article_feedback', {
        p_article_id: articleId,
        p_is_helpful: isHelpful,
      })

      if (error) throw new Error(error.message)
    },
    onSuccess: (_, variables) => {
      toast.success(
        variables.isHelpful ? 'Thanks for your feedback!' : 'We\'ll improve this article'
      )
      queryClient.invalidateQueries({ queryKey: ['article-usage'] })
    },
  })

  /**
   * Get article usage statistics
   */
  const getArticleUsage = useQuery({
    queryKey: ['article-usage'],
    queryFn: async (): Promise<ArticleUsageStats[]> => {
      const { data, error } = await supabase.rpc('get_article_usage_stats')

      if (error) throw new Error(error.message)
      return data || []
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  /**
   * Identify content gaps (unanswered questions)
   */
  const getContentGaps = useQuery({
    queryKey: ['content-gaps'],
    queryFn: async (): Promise<ContentGap[]> => {
      const { data, error } = await supabase.rpc('identify_content_gaps')

      if (error) throw new Error(error.message)
      return data || []
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  })

  /**
   * Get low-rated articles needing improvement
   */
  const getLowRatedArticles = useQuery({
    queryKey: ['low-rated-articles'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_low_rated_articles', {
        p_threshold: 0.5, // Less than 50% helpful
      })

      if (error) throw new Error(error.message)
      return data || []
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
  })

  /**
   * Get popular search queries with no results
   */
  const getFailedSearches = useQuery({
    queryKey: ['failed-searches'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_failed_search_queries', {
        p_limit: 50,
      })

      if (error) throw new Error(error.message)
      return data || []
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  })

  return {
    trackArticleView,
    recordFeedback,
    getArticleUsage,
    getContentGaps,
    getLowRatedArticles,
    getFailedSearches,
  }
}
