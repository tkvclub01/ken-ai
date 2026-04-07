-- Migration 018: Knowledge Base Analytics Functions
-- Purpose: Add RPC functions for tracking and analyzing knowledge base usage
-- Date: April 6, 2026

-- ============================================================================
-- Table: article_views (for tracking article usage)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.article_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.knowledge_base(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  search_query TEXT,
  time_spent INTEGER, -- in seconds
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_article_views_article_id ON public.article_views(article_id);
CREATE INDEX IF NOT EXISTS idx_article_views_user_id ON public.article_views(user_id);
CREATE INDEX IF NOT EXISTS idx_article_views_viewed_at ON public.article_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_article_views_org_id ON public.article_views(organization_id);

-- ============================================================================
-- Table: article_feedback (for helpful/not helpful ratings)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.article_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.knowledge_base(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  is_helpful BOOLEAN NOT NULL,
  feedback_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  UNIQUE(article_id, user_id) -- One feedback per user per article
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_article_feedback_article_id ON public.article_feedback(article_id);
CREATE INDEX IF NOT EXISTS idx_article_feedback_user_id ON public.article_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_article_feedback_org_id ON public.article_feedback(organization_id);

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE public.article_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_feedback ENABLE ROW LEVEL SECURITY;

-- Article Views Policies
CREATE POLICY "Users can view their own article views"
  ON public.article_views FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IN (
    SELECT user_id FROM public.organization_members 
    WHERE role IN ('admin', 'manager')
  ));

CREATE POLICY "Users can insert their own article views"
  ON public.article_views FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Article Feedback Policies
CREATE POLICY "Users can view all feedback"
  ON public.article_feedback FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own feedback"
  ON public.article_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback"
  ON public.article_feedback FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- RPC Function: track_article_view
-- ============================================================================

CREATE OR REPLACE FUNCTION public.track_article_view(
  p_article_id UUID,
  p_search_query TEXT DEFAULT NULL,
  p_time_spent INTEGER DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  -- Get user's organization
  SELECT organization_id INTO v_org_id
  FROM public.profiles
  WHERE id = v_user_id
  LIMIT 1;
  
  -- Insert view record
  INSERT INTO public.article_views (article_id, user_id, search_query, time_spent, organization_id)
  VALUES (p_article_id, v_user_id, p_search_query, p_time_spent, v_org_id);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.track_article_view TO authenticated;

-- ============================================================================
-- RPC Function: record_article_feedback
-- ============================================================================

CREATE OR REPLACE FUNCTION public.record_article_feedback(
  p_article_id UUID,
  p_is_helpful BOOLEAN,
  p_feedback_text TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  -- Get user's organization
  SELECT organization_id INTO v_org_id
  FROM public.profiles
  WHERE id = v_user_id
  LIMIT 1;
  
  -- Upsert feedback (update if exists, insert if not)
  INSERT INTO public.article_feedback (article_id, user_id, is_helpful, feedback_text, organization_id)
  VALUES (p_article_id, v_user_id, p_is_helpful, p_feedback_text, v_org_id)
  ON CONFLICT (article_id, user_id)
  DO UPDATE SET
    is_helpful = EXCLUDED.is_helpful,
    feedback_text = EXCLUDED.feedback_text,
    created_at = NOW();
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.record_article_feedback TO authenticated;

-- ============================================================================
-- RPC Function: get_article_usage_stats
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_article_usage_stats()
RETURNS TABLE (
  article_id UUID,
  view_count BIGINT,
  search_queries TEXT[],
  helpful_count BIGINT,
  not_helpful_count BIGINT,
  average_time_spent NUMERIC,
  last_viewed_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    av.article_id,
    COUNT(av.id)::BIGINT as view_count,
    ARRAY_REMOVE(ARRAY_AGG(DISTINCT av.search_query), NULL)::TEXT[] as search_queries,
    COALESCE(SUM(CASE WHEN af.is_helpful THEN 1 ELSE 0 END), 0)::BIGINT as helpful_count,
    COALESCE(SUM(CASE WHEN af.is_helpful = FALSE THEN 1 ELSE 0 END), 0)::BIGINT as not_helpful_count,
    AVG(av.time_spent)::NUMERIC as average_time_spent,
    MAX(av.viewed_at) as last_viewed_at
  FROM public.article_views av
  LEFT JOIN public.article_feedback af ON av.article_id = af.article_id
  GROUP BY av.article_id
  ORDER BY view_count DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_article_usage_stats TO authenticated;

-- ============================================================================
-- RPC Function: identify_content_gaps
-- ============================================================================

CREATE OR REPLACE FUNCTION public.identify_content_gaps()
RETURNS TABLE (
  topic TEXT,
  unanswered_questions INTEGER,
  suggested_articles TEXT[],
  priority TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    av.search_query as topic,
    COUNT(*)::INTEGER as unanswered_questions,
    ARRAY[]::TEXT[] as suggested_articles,
    CASE 
      WHEN COUNT(*) >= 10 THEN 'high'
      WHEN COUNT(*) >= 5 THEN 'medium'
      ELSE 'low'
    END::TEXT as priority
  FROM public.article_views av
  LEFT JOIN public.knowledge_base ka ON 
    to_tsvector('english', ka.title || ' ' || COALESCE(ka.content, '')) @@ 
    plainto_tsquery('english', av.search_query)
  WHERE av.search_query IS NOT NULL
    AND ka.id IS NULL
  GROUP BY av.search_query
  HAVING COUNT(*) >= 3
  ORDER BY unanswered_questions DESC
  LIMIT 50;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.identify_content_gaps TO authenticated;

-- ============================================================================
-- RPC Function: get_low_rated_articles
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_low_rated_articles(p_threshold FLOAT DEFAULT 0.5)
RETURNS TABLE (
  article_id UUID,
  title TEXT,
  total_feedback BIGINT,
  helpful_percentage FLOAT,
  needs_improvement BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ka.id as article_id,
    ka.title,
    COUNT(af.id)::BIGINT as total_feedback,
    (SUM(CASE WHEN af.is_helpful THEN 1 ELSE 0 END)::FLOAT / NULLIF(COUNT(af.id), 0)) * 100 as helpful_percentage,
    (SUM(CASE WHEN af.is_helpful THEN 1 ELSE 0 END)::FLOAT / NULLIF(COUNT(af.id), 0)) < p_threshold as needs_improvement
  FROM public.knowledge_base ka
  JOIN public.article_feedback af ON ka.id = af.article_id
  GROUP BY ka.id, ka.title
  HAVING COUNT(af.id) >= 5 -- Minimum feedback threshold
  ORDER BY helpful_percentage ASC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_low_rated_articles TO authenticated;

-- ============================================================================
-- RPC Function: get_failed_search_queries
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_failed_search_queries(p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  search_query TEXT,
  failure_count BIGINT,
  last_searched TIMESTAMP WITH TIME ZONE,
  unique_users BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    av.search_query,
    COUNT(*)::BIGINT as failure_count,
    MAX(av.viewed_at) as last_searched,
    COUNT(DISTINCT av.user_id)::BIGINT as unique_users
  FROM public.article_views av
  LEFT JOIN public.knowledge_base ka ON 
    to_tsvector('english', ka.title || ' ' || COALESCE(ka.content, '')) @@ 
    plainto_tsquery('english', av.search_query)
  WHERE av.search_query IS NOT NULL
    AND ka.id IS NULL
  GROUP BY av.search_query
  ORDER BY failure_count DESC
  LIMIT p_limit;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_failed_search_queries TO authenticated;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE public.article_views IS 'Tracks when users view knowledge base articles';
COMMENT ON TABLE public.article_feedback IS 'Stores user feedback on article helpfulness';
COMMENT ON FUNCTION public.track_article_view IS 'Records an article view with optional search query and time spent';
COMMENT ON FUNCTION public.record_article_feedback IS 'Records helpful/not helpful feedback for an article';
COMMENT ON FUNCTION public.get_article_usage_stats IS 'Returns comprehensive usage statistics for all articles';
COMMENT ON FUNCTION public.identify_content_gaps IS 'Identifies topics users are searching for but not finding';
COMMENT ON FUNCTION public.get_low_rated_articles IS 'Returns articles with low helpful ratings that need improvement';
COMMENT ON FUNCTION public.get_failed_search_queries IS 'Returns search queries that returned no results';
