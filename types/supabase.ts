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
      users: {
        Row: {
          id: string
          name: string
          role: 'requester' | 'manager'
          zone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          role: 'requester' | 'manager'
          zone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          role?: 'requester' | 'manager'
          zone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          icon: string | null
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          icon?: string | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          icon?: string | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      zones: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          images: string[]
          category_id: string | null
          options: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          images?: string[]
          category_id?: string | null
          options?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          images?: string[]
          category_id?: string | null
          options?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      variants: {
        Row: {
          id: string
          product_id: string
          attributes: Json
          stock: number
          defective_stock: number
          repairing_stock: number
          price: number | null
          images: string[] | null
          unit: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          attributes?: Json
          stock?: number
          defective_stock?: number
          repairing_stock?: number
          price?: number | null
          images?: string[] | null
          unit?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          attributes?: Json
          stock?: number
          defective_stock?: number
          repairing_stock?: number
          price?: number | null
          images?: string[] | null
          unit?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      variant_components: {
        Row: {
          id: string
          parent_variant_id: string
          child_variant_id: string
          quantity: number
          created_at: string
        }
        Insert: {
          id?: string
          parent_variant_id: string
          child_variant_id: string
          quantity?: number
          created_at?: string
        }
        Update: {
          id?: string
          parent_variant_id?: string
          child_variant_id?: string
          quantity?: number
          created_at?: string
        }
      }
      requisition_forms: {
        Row: {
          id: string
          requester_name: string
          zone: string
          purpose: string
          status: 'Đang chờ xử lý' | 'Đã hoàn thành'
          fulfilled_by: string | null
          fulfilled_at: string | null
          fulfillment_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          requester_name: string
          zone: string
          purpose: string
          status?: 'Đang chờ xử lý' | 'Đã hoàn thành'
          fulfilled_by?: string | null
          fulfilled_at?: string | null
          fulfillment_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          requester_name?: string
          zone?: string
          purpose?: string
          status?: 'Đang chờ xử lý' | 'Đã hoàn thành'
          fulfilled_by?: string | null
          fulfilled_at?: string | null
          fulfillment_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      requisition_groups: {
        Row: {
          id: string
          requisition_id: string
          name: string
          purpose_type: 'regular_use' | 'exchange' | 'farm_repair' | 'supplement' | 'other'
          notes: string | null
          needed_by: string | null
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          requisition_id: string
          name: string
          purpose_type?: 'regular_use' | 'exchange' | 'farm_repair' | 'supplement' | 'other'
          notes?: string | null
          needed_by?: string | null
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          requisition_id?: string
          name?: string
          purpose_type?: 'regular_use' | 'exchange' | 'farm_repair' | 'supplement' | 'other'
          notes?: string | null
          needed_by?: string | null
          display_order?: number
          created_at?: string
        }
      }
      requisition_items: {
        Row: {
          id: string
          requisition_id: string
          group_id: string | null
          product_id: string
          variant_id: string
          quantity: number
          is_exchange: boolean
          defect_notes: string | null
          defect_description: string | null
          repair_needs: string | null
          defect_exchanged_at: string | null
          defect_images: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          requisition_id: string
          group_id?: string | null
          product_id: string
          variant_id: string
          quantity: number
          is_exchange?: boolean
          defect_notes?: string | null
          defect_description?: string | null
          repair_needs?: string | null
          defect_exchanged_at?: string | null
          defect_images?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          requisition_id?: string
          group_id?: string | null
          product_id?: string
          variant_id?: string
          quantity?: number
          is_exchange?: boolean
          defect_notes?: string | null
          defect_description?: string | null
          repair_needs?: string | null
          defect_exchanged_at?: string | null
          defect_images?: Json | null
          created_at?: string
        }
      }
      goods_receipt_notes: {
        Row: {
          id: string
          supplier: string
          notes: string | null
          created_by: string
          linked_requisition_ids: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          supplier: string
          notes?: string | null
          created_by: string
          linked_requisition_ids?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          supplier?: string
          notes?: string | null
          created_by?: string
          linked_requisition_ids?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      receipt_items: {
        Row: {
          id: string
          receipt_id: string
          product_id: string
          variant_id: string
          quantity: number
          created_at: string
        }
        Insert: {
          id?: string
          receipt_id: string
          product_id: string
          variant_id: string
          quantity: number
          created_at?: string
        }
        Update: {
          id?: string
          receipt_id?: string
          product_id?: string
          variant_id?: string
          quantity?: number
          created_at?: string
        }
      }
      delivery_notes: {
        Row: {
          id: string
          receipt_id: string
          shipper_id: string
          status: 'pending' | 'verified' | 'rejected'
          created_by: string
          verified_by: string | null
          verified_at: string | null
          verification_notes: string | null
          rejection_reason: string | null
          has_issues: boolean
          tags: string[] | null
          priority: 'low' | 'medium' | 'high' | null
          expected_delivery_date: string | null
          last_modified: string
          batch_id: string | null
          processing_duration: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          receipt_id: string
          shipper_id: string
          status?: 'pending' | 'verified' | 'rejected'
          created_by: string
          verified_by?: string | null
          verified_at?: string | null
          verification_notes?: string | null
          rejection_reason?: string | null
          has_issues?: boolean
          tags?: string[] | null
          priority?: 'low' | 'medium' | 'high' | null
          expected_delivery_date?: string | null
          last_modified?: string
          batch_id?: string | null
          processing_duration?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          receipt_id?: string
          shipper_id?: string
          status?: 'pending' | 'verified' | 'rejected'
          created_by?: string
          verified_by?: string | null
          verified_at?: string | null
          verification_notes?: string | null
          rejection_reason?: string | null
          has_issues?: boolean
          tags?: string[] | null
          priority?: 'low' | 'medium' | 'high' | null
          expected_delivery_date?: string | null
          last_modified?: string
          batch_id?: string | null
          processing_duration?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      delivery_items: {
        Row: {
          id: string
          delivery_note_id: string
          product_id: string
          variant_id: string
          quantity: number
          actual_quantity: number | null
          quality_issue: boolean
          issue_notes: string | null
          expected_delivery_date: string | null
          received_date: string | null
          condition: 'good' | 'damaged' | 'partial' | null
          damage_description: string | null
          replacement_needed: boolean
          quality_checks: Json | null
          tracking_info: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          delivery_note_id: string
          product_id: string
          variant_id: string
          quantity: number
          actual_quantity?: number | null
          quality_issue?: boolean
          issue_notes?: string | null
          expected_delivery_date?: string | null
          received_date?: string | null
          condition?: 'good' | 'damaged' | 'partial' | null
          damage_description?: string | null
          replacement_needed?: boolean
          quality_checks?: Json | null
          tracking_info?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          delivery_note_id?: string
          product_id?: string
          variant_id?: string
          quantity?: number
          actual_quantity?: number | null
          quality_issue?: boolean
          issue_notes?: string | null
          expected_delivery_date?: string | null
          received_date?: string | null
          condition?: 'good' | 'damaged' | 'partial' | null
          damage_description?: string | null
          replacement_needed?: boolean
          quality_checks?: Json | null
          tracking_info?: Json | null
          created_at?: string
        }
      }
      delivery_history: {
        Row: {
          id: string
          delivery_note_id: string
          timestamp: string
          action: string
          user_name: string
          notes: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          delivery_note_id: string
          timestamp?: string
          action: string
          user_name: string
          notes?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          delivery_note_id?: string
          timestamp?: string
          action?: string
          user_name?: string
          notes?: string | null
          metadata?: Json | null
        }
      }
      delivery_verification: {
        Row: {
          id: string
          delivery_note_id: string
          verified_by: string
          verified_at: string
          notes: string | null
          item_checks: Json
          created_at: string
        }
        Insert: {
          id?: string
          delivery_note_id: string
          verified_by: string
          verified_at?: string
          notes?: string | null
          item_checks: Json
          created_at?: string
        }
        Update: {
          id?: string
          delivery_note_id?: string
          verified_by?: string
          verified_at?: string
          notes?: string | null
          item_checks?: Json
          created_at?: string
        }
      }
      delivery_quality: {
        Row: {
          id: string
          delivery_note_id: string
          rating: number
          comments: string | null
          reviewed_by: string | null
          reviewed_at: string
          created_at: string
        }
        Insert: {
          id?: string
          delivery_note_id: string
          rating: number
          comments?: string | null
          reviewed_by?: string | null
          reviewed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          delivery_note_id?: string
          rating?: number
          comments?: string | null
          reviewed_by?: string | null
          reviewed_at?: string
          created_at?: string
        }
      }
      inventory_transactions: {
        Row: {
          id: string
          type: 'RETURN' | 'RETURN_DEFECTIVE' | 'REPAIR_EXPORT' | 'REPAIR_IMPORT' | 'DISPOSAL'
          status: string
          items: Json
          created_by: string
          created_at: string
          notes: string | null
          reference_id: string | null
        }
        Insert: {
          id?: string
          type: 'RETURN' | 'RETURN_DEFECTIVE' | 'REPAIR_EXPORT' | 'REPAIR_IMPORT' | 'DISPOSAL'
          status?: string
          items: Json
          created_by: string
          created_at?: string
          notes?: string | null
          reference_id?: string | null
        }
        Update: {
          id?: string
          type?: 'RETURN' | 'RETURN_DEFECTIVE' | 'REPAIR_EXPORT' | 'REPAIR_IMPORT' | 'DISPOSAL'
          status?: string
          items?: Json
          created_by?: string
          created_at?: string
          notes?: string | null
          reference_id?: string | null
        }
      }
      defective_items: {
        Row: {
          id: string
          source_requisition_id: string | null
          source_requisition_item_id: string | null
          product_id: string
          variant_id: string
          quantity: number
          exchanged_at: string | null
          defect_status: string
          defect_description: string | null
          repair_needs: string | null
          images: Json
          current_state: 'waiting_repair' | 'sent_to_repair' | 'repaired' | 'disposed'
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          source_requisition_id?: string | null
          source_requisition_item_id?: string | null
          product_id: string
          variant_id: string
          quantity: number
          exchanged_at?: string | null
          defect_status: string
          defect_description?: string | null
          repair_needs?: string | null
          images?: Json
          current_state?: 'waiting_repair' | 'sent_to_repair' | 'repaired' | 'disposed'
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          source_requisition_id?: string | null
          source_requisition_item_id?: string | null
          product_id?: string
          variant_id?: string
          quantity?: number
          exchanged_at?: string | null
          defect_status?: string
          defect_description?: string | null
          repair_needs?: string | null
          images?: Json
          current_state?: 'waiting_repair' | 'sent_to_repair' | 'repaired' | 'disposed'
          created_by?: string
          created_at?: string
        }
      }
      repair_batches: {
        Row: {
          id: string
          code: string
          repair_vendor: string | null
          sent_at: string
          expected_return_at: string | null
          status: 'draft' | 'sent' | 'partially_returned' | 'completed' | 'cancelled'
          notes: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          repair_vendor?: string | null
          sent_at: string
          expected_return_at?: string | null
          status?: 'draft' | 'sent' | 'partially_returned' | 'completed' | 'cancelled'
          notes?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          repair_vendor?: string | null
          sent_at?: string
          expected_return_at?: string | null
          status?: 'draft' | 'sent' | 'partially_returned' | 'completed' | 'cancelled'
          notes?: string | null
          created_by?: string
          created_at?: string
        }
      }
      repair_batch_items: {
        Row: {
          id: string
          repair_batch_id: string
          defective_item_id: string
          variant_id: string
          quantity_sent: number
          quantity_returned: number
          quantity_disposed: number
          return_notes: string | null
          returned_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          repair_batch_id: string
          defective_item_id: string
          variant_id: string
          quantity_sent: number
          quantity_returned?: number
          quantity_disposed?: number
          return_notes?: string | null
          returned_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          repair_batch_id?: string
          defective_item_id?: string
          variant_id?: string
          quantity_sent?: number
          quantity_returned?: number
          quantity_disposed?: number
          return_notes?: string | null
          returned_at?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
