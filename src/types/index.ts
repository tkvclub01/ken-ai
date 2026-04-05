// Supabase Database Types
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      students: {
        Row: {
          id: string
          full_name: string
          email: string
          phone: string
          date_of_birth: string | null
          nationality: string | null
          target_country: string | null
          target_school: string | null
          current_stage: string
          counselor_id: string | null
          status: 'lead' | 'active' | 'inactive' | 'completed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name: string
          email: string
          phone: string
          date_of_birth?: string | null
          nationality?: string | null
          target_country?: string | null
          target_school?: string | null
          current_stage?: string
          counselor_id?: string | null
          status?: 'lead' | 'active' | 'inactive' | 'completed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          phone?: string
          date_of_birth?: string | null
          nationality?: string | null
          target_country?: string | null
          target_school?: string | null
          current_stage?: string
          counselor_id?: string | null
          status?: 'lead' | 'active' | 'inactive' | 'completed'
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          student_id: string
          document_type: string
          file_name: string
          file_path: string
          file_size: number
          mime_type: string
          ocr_status: 'pending' | 'processing' | 'completed' | 'failed'
          ocr_data: Json | null
          uploaded_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          document_type: string
          file_name: string
          file_path: string
          file_size: number
          mime_type: string
          ocr_status?: 'pending' | 'processing' | 'completed' | 'failed'
          ocr_data?: Json | null
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          document_type?: string
          file_name?: string
          file_path?: string
          file_size?: number
          mime_type?: string
          ocr_status?: 'pending' | 'processing' | 'completed' | 'failed'
          ocr_data?: Json | null
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      knowledge_base: {
        Row: {
          id: string
          title: string
          content: string
          embedding: string | null
          source: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          embedding?: string | null
          source?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          embedding?: string | null
          source?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
      pipeline_stages: {
        Row: {
          id: string
          name: string
          order: number
          description: string | null
          color: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          order: number
          description?: string | null
          color?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          order?: number
          description?: string | null
          color?: string | null
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          entity_type: string
          entity_id: string | null
          changes: Json | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          entity_type: string
          entity_id?: string | null
          changes?: Json | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          entity_type?: string
          entity_id?: string | null
          changes?: Json | null
          ip_address?: string | null
          created_at?: string
        }
      }
      knowledge_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          color: string
          icon: string | null
          is_active: boolean
          article_count: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          color?: string
          icon?: string | null
          is_active?: boolean
          article_count?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          color?: string
          icon?: string | null
          is_active?: boolean
          article_count?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_documents: {
        Args: {
          query_embedding: string
          match_threshold: number
          match_count: number
        }
        Returns: {
          id: string
          title: string
          content: string
          similarity: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Extended types for the application
export type Student = Database['public']['Tables']['students']['Row']
export type StudentInsert = Database['public']['Tables']['students']['Insert']
export type StudentUpdate = Database['public']['Tables']['students']['Update']

export type Document = Database['public']['Tables']['documents']['Row']
export type DocumentInsert = Database['public']['Tables']['documents']['Insert']
export type DocumentUpdate = Database['public']['Tables']['documents']['Update']

export type KnowledgeBase = Database['public']['Tables']['knowledge_base']['Row']
export type KnowledgeBaseInsert = Database['public']['Tables']['knowledge_base']['Insert']

export type PipelineStage = Database['public']['Tables']['pipeline_stages']['Row']
export type AuditLog = Database['public']['Tables']['audit_logs']['Row']
export type KnowledgeCategory = Database['public']['Tables']['knowledge_categories']['Row']
export type KnowledgeCategoryInsert = Database['public']['Tables']['knowledge_categories']['Insert']
export type KnowledgeCategoryUpdate = Database['public']['Tables']['knowledge_categories']['Update']

// Dashboard types
export interface DashboardStats {
  totalStudents: number
  activeStudents: number
  visaApproved: number
  visaRejected: number
  totalDocuments: number
  pendingDocuments: number
  totalRevenue: number
  pendingRevenue: number
}

export interface PipelineData {
  id: string
  name: string
  count: number
  conversion_rate: number
}

export interface MonthlyData {
  month: string
  students: number
  revenue: number
}

export interface CounselorPerformance {
  counselor_name: string
  students_count: number
  approval_rate: number
}

export interface CountryDistribution {
  country: string
  count: number
}

// UI Types
export interface NavItem {
  title: string
  href: string
  icon: string
  group?: 'management' | 'ai-tools' | 'settings'
  badge?: string
}

export interface BreadcrumbItem {
  title: string
  href?: string
}
