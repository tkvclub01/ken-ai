export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'admin' | 'manager' | 'counselor' | 'processor'
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'admin' | 'manager' | 'counselor' | 'processor'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'admin' | 'manager' | 'counselor' | 'processor'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      students: {
        Row: {
          id: string
          full_name: string
          date_of_birth: string | null
          passport_number: string | null
          counselor_id: string | null
          status: string
          gpa: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name: string
          date_of_birth?: string | null
          passport_number?: string | null
          counselor_id?: string | null
          status?: string
          gpa?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          date_of_birth?: string | null
          passport_number?: string | null
          counselor_id?: string | null
          status?: string
          gpa?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          student_id: string
          file_path: string
          file_type: string
          upload_status: string
          ocr_status: string
          extracted_data: Json | null
          verified_by: string | null
          verified_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          file_path: string
          file_type: string
          upload_status?: string
          ocr_status?: string
          extracted_data?: Json | null
          verified_by?: string | null
          verified_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          file_path?: string
          file_type?: string
          upload_status?: string
          ocr_status?: string
          extracted_data?: Json | null
          verified_by?: string | null
          verified_at?: string | null
          created_at?: string
        }
      }
      knowledge_base: {
        Row: {
          id: string
          title: string
          content: string
          embedding: number[] | null
          category: string | null
          tags: string[] | null
          verified: boolean
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          embedding?: number[] | null
          category?: string | null
          tags?: string[] | null
          verified?: boolean
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          embedding?: number[] | null
          category?: string | null
          tags?: string[] | null
          verified?: boolean
          created_by?: string | null
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          table_name: string
          record_id: string
          action: string
          changes: Json
          performed_by: string | null
          performed_at: string
        }
        Insert: {
          id?: string
          table_name: string
          record_id: string
          action: string
          changes: Json
          performed_by?: string | null
          performed_at?: string
        }
        Update: {
          id?: string
          table_name?: string
          record_id?: string
          action?: string
          changes?: Json
          performed_by?: string | null
          performed_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_documents: {
        Args: {
          query_embedding: number[]
          match_count?: number
          filter?: Record<string, any>
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
      user_role: 'admin' | 'manager' | 'counselor' | 'processor'
    }
  }
}
