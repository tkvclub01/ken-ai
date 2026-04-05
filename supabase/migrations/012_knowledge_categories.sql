-- ============================================
-- KNOWLEDGE BASE CATEGORIES MIGRATION
-- Admin-managed categories for knowledge base articles
-- ============================================

-- STEP 1: Create knowledge_categories table
CREATE TABLE knowledge_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#007AFF',
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  article_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 2: Create indexes
CREATE INDEX idx_knowledge_categories_name ON knowledge_categories(name);
CREATE INDEX idx_knowledge_categories_active ON knowledge_categories(is_active);

-- STEP 3: Create updated_at trigger
CREATE TRIGGER update_knowledge_categories_updated_at 
  BEFORE UPDATE ON knowledge_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- STEP 4: Enable Row Level Security
ALTER TABLE knowledge_categories ENABLE ROW LEVEL SECURITY;

-- STEP 5: Create RLS Policies

-- Policy 1: All authenticated users can view active categories
CREATE POLICY "knowledge_categories_view_all" ON knowledge_categories
FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND is_active = true
);

-- Policy 2: Admins can view all categories (including inactive)
CREATE POLICY "knowledge_categories_admin_view" ON knowledge_categories
FOR SELECT
USING (
  user_has_permission(auth.uid(), 'manage_settings')
);

-- Policy 3: Only admins can create categories
CREATE POLICY "knowledge_categories_admin_create" ON knowledge_categories
FOR INSERT
WITH CHECK (
  user_has_permission(auth.uid(), 'manage_settings')
);

-- Policy 4: Only admins can update categories
CREATE POLICY "knowledge_categories_admin_update" ON knowledge_categories
FOR UPDATE
USING (
  user_has_permission(auth.uid(), 'manage_settings')
)
WITH CHECK (
  user_has_permission(auth.uid(), 'manage_settings')
);

-- Policy 5: Only admins can delete categories
CREATE POLICY "knowledge_categories_admin_delete" ON knowledge_categories
FOR DELETE
USING (
  user_has_permission(auth.uid(), 'manage_settings')
);

-- STEP 6: Insert default categories
INSERT INTO knowledge_categories (name, description, color, icon) VALUES
('Australia', 'Visa requirements, scholarships, and guides for Australia', '#FF9500', 'flag'),
('United Kingdom', 'UK student visa, universities, and living guides', '#5856D6', 'flag'),
('United States', 'F-1 visa, universities, and study guides for USA', '#007AFF', 'flag'),
('Canada', 'Study permits, universities, and immigration guides', '#34C759', 'flag'),
('Scholarships', 'Scholarship opportunities and application guides', '#FF2D55', 'award'),
('Academic Requirements', 'GPA, test scores, and admission requirements', '#5AC8FA', 'book'),
('English Tests', 'IELTS, TOEFL, PTE preparation and comparison', '#FF9500', 'globe'),
('Application Process', 'Step-by-step application guides and checklists', '#30D158', 'clipboard'),
('Visa Appeals', 'Visa rejection appeals and reapplication guides', '#FF3B30', 'alert'),
('Pre-departure', 'Checklists and preparation before leaving', '#64D2FF', 'plane')
ON CONFLICT (name) DO NOTHING;

-- STEP 7: Update knowledge_base table to add category_id foreign key
ALTER TABLE knowledge_base
ADD COLUMN category_id UUID REFERENCES knowledge_categories(id);

-- Update existing records to map text categories to category IDs
UPDATE knowledge_base kb
SET category_id = kc.id
FROM knowledge_categories kc
WHERE kb.category = kc.name;

-- STEP 8: Create helper functions
CREATE OR REPLACE FUNCTION update_category_article_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE knowledge_categories 
    SET article_count = article_count + 1
    WHERE id = NEW.category_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Decrement old category count
    IF OLD.category_id IS NOT NULL THEN
      UPDATE knowledge_categories 
      SET article_count = GREATEST(article_count - 1, 0)
      WHERE id = OLD.category_id;
    END IF;
    -- Increment new category count
    IF NEW.category_id IS NOT NULL THEN
      UPDATE knowledge_categories 
      SET article_count = article_count + 1
      WHERE id = NEW.category_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE knowledge_categories 
    SET article_count = GREATEST(article_count - 1, 0)
    WHERE id = OLD.category_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_category_article_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON knowledge_base
FOR EACH ROW EXECUTE FUNCTION update_category_article_count();

-- STEP 9: Add comments
COMMENT ON TABLE knowledge_categories IS 'Admin-managed categories for knowledge base articles';
COMMENT ON COLUMN knowledge_categories.icon IS 'Lucide icon name for category';
COMMENT ON COLUMN knowledge_categories.article_count IS 'Cached count of articles in this category';

-- ============================================
-- MIGRATION COMPLETE! ✅
-- ============================================
