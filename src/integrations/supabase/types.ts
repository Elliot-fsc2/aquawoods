export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      channels: {
        Row: {
          bookings_30d: number
          commission_rate: number
          id: string
          logo: string | null
          name: string
          revenue_30d: number
          sync_status: string
        }
        Insert: {
          bookings_30d?: number
          commission_rate?: number
          id: string
          logo?: string | null
          name: string
          revenue_30d?: number
          sync_status?: string
        }
        Update: {
          bookings_30d?: number
          commission_rate?: number
          id?: string
          logo?: string | null
          name?: string
          revenue_30d?: number
          sync_status?: string
        }
        Relationships: []
      }
      crm_guests: {
        Row: {
          country: string | null
          email: string | null
          id: string
          last_stay: string | null
          loyalty_tier: Database["public"]["Enums"]["loyalty_tier"]
          name: string
          phone: string | null
          points: number
          preferences: Json
          total_spent: number
          total_stays: number
        }
        Insert: {
          country?: string | null
          email?: string | null
          id: string
          last_stay?: string | null
          loyalty_tier?: Database["public"]["Enums"]["loyalty_tier"]
          name: string
          phone?: string | null
          points?: number
          preferences?: Json
          total_spent?: number
          total_stays?: number
        }
        Update: {
          country?: string | null
          email?: string | null
          id?: string
          last_stay?: string | null
          loyalty_tier?: Database["public"]["Enums"]["loyalty_tier"]
          name?: string
          phone?: string | null
          points?: number
          preferences?: Json
          total_spent?: number
          total_stays?: number
        }
        Relationships: []
      }
      emergency_alerts: {
        Row: {
          acknowledged: boolean
          created_at: string
          guest_name: string | null
          guest_user_id: string | null
          id: string
          message: string | null
          room_number: string | null
        }
        Insert: {
          acknowledged?: boolean
          created_at?: string
          guest_name?: string | null
          guest_user_id?: string | null
          id: string
          message?: string | null
          room_number?: string | null
        }
        Update: {
          acknowledged?: boolean
          created_at?: string
          guest_name?: string | null
          guest_user_id?: string | null
          id?: string
          message?: string | null
          room_number?: string | null
        }
        Relationships: []
      }
      erp_employees: {
        Row: {
          base_salary: number
          created_at: string
          department: string | null
          email: string | null
          employee_code: string
          full_name: string
          hire_date: string
          hourly_rate: number
          id: string
          pay_type: string
          phone: string | null
          position: string | null
          status: string
          updated_at: string
        }
        Insert: {
          base_salary?: number
          created_at?: string
          department?: string | null
          email?: string | null
          employee_code: string
          full_name: string
          hire_date?: string
          hourly_rate?: number
          id?: string
          pay_type?: string
          phone?: string | null
          position?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          base_salary?: number
          created_at?: string
          department?: string | null
          email?: string | null
          employee_code?: string
          full_name?: string
          hire_date?: string
          hourly_rate?: number
          id?: string
          pay_type?: string
          phone?: string | null
          position?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      erp_inventory_items: {
        Row: {
          active: boolean
          category: string | null
          created_at: string
          id: string
          location: string | null
          name: string
          quantity: number
          reorder_level: number
          sku: string
          unit: string | null
          unit_cost: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string | null
          created_at?: string
          id?: string
          location?: string | null
          name: string
          quantity?: number
          reorder_level?: number
          sku: string
          unit?: string | null
          unit_cost?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string | null
          created_at?: string
          id?: string
          location?: string | null
          name?: string
          quantity?: number
          reorder_level?: number
          sku?: string
          unit?: string | null
          unit_cost?: number
          updated_at?: string
        }
        Relationships: []
      }
      erp_payroll_runs: {
        Row: {
          created_at: string
          deductions: number
          employee_id: string | null
          gross_pay: number
          hours_worked: number
          id: string
          net_pay: number
          notes: string | null
          paid_at: string | null
          period_end: string
          period_start: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deductions?: number
          employee_id?: string | null
          gross_pay?: number
          hours_worked?: number
          id?: string
          net_pay?: number
          notes?: string | null
          paid_at?: string | null
          period_end: string
          period_start: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deductions?: number
          employee_id?: string | null
          gross_pay?: number
          hours_worked?: number
          id?: string
          net_pay?: number
          notes?: string | null
          paid_at?: string | null
          period_end?: string
          period_start?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_payroll_runs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "erp_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_purchase_orders: {
        Row: {
          created_at: string
          expected_date: string | null
          id: string
          items: Json
          notes: string | null
          order_date: string
          po_number: string
          received_date: string | null
          status: string
          subtotal: number
          tax: number
          total: number
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          created_at?: string
          expected_date?: string | null
          id?: string
          items?: Json
          notes?: string | null
          order_date?: string
          po_number: string
          received_date?: string | null
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          created_at?: string
          expected_date?: string | null
          id?: string
          items?: Json
          notes?: string | null
          order_date?: string
          po_number?: string
          received_date?: string | null
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "erp_purchase_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "erp_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_vendors: {
        Row: {
          active: boolean
          address: string | null
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          payment_terms: string | null
          phone: string | null
          tax_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          tax_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          tax_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          av_requirements: Json
          beo: Json | null
          budget: number
          catering: string | null
          client: string | null
          date: string | null
          guests: number
          id: string
          status: Database["public"]["Enums"]["event_status"]
          title: string
          type: string | null
          venue: string | null
        }
        Insert: {
          av_requirements?: Json
          beo?: Json | null
          budget?: number
          catering?: string | null
          client?: string | null
          date?: string | null
          guests?: number
          id: string
          status?: Database["public"]["Enums"]["event_status"]
          title: string
          type?: string | null
          venue?: string | null
        }
        Update: {
          av_requirements?: Json
          beo?: Json | null
          budget?: number
          catering?: string | null
          client?: string | null
          date?: string | null
          guests?: number
          id?: string
          status?: Database["public"]["Enums"]["event_status"]
          title?: string
          type?: string | null
          venue?: string | null
        }
        Relationships: []
      }
      food_products: {
        Row: {
          available: boolean
          category: string
          created_at: string
          description: string
          id: string
          image: string | null
          name: string
          prep_time: number
          price: number
          updated_at: string
        }
        Insert: {
          available?: boolean
          category: string
          created_at?: string
          description?: string
          id: string
          image?: string | null
          name: string
          prep_time?: number
          price?: number
          updated_at?: string
        }
        Update: {
          available?: boolean
          category?: string
          created_at?: string
          description?: string
          id?: string
          image?: string | null
          name?: string
          prep_time?: number
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      guest_bookings: {
        Row: {
          addons: Json
          adults: number
          check_in: string
          check_out: string
          children: number
          created_at: string
          guest_user_id: string
          id: string
          nights: number
          payment_status: Database["public"]["Enums"]["payment_status"]
          room_number: string | null
          room_rate: number
          room_type: string
          special_requests: string | null
          status: Database["public"]["Enums"]["guest_booking_status"]
          subtotal: number
          tax: number
          total: number
        }
        Insert: {
          addons?: Json
          adults?: number
          check_in: string
          check_out: string
          children?: number
          created_at?: string
          guest_user_id: string
          id: string
          nights?: number
          payment_status?: Database["public"]["Enums"]["payment_status"]
          room_number?: string | null
          room_rate?: number
          room_type: string
          special_requests?: string | null
          status?: Database["public"]["Enums"]["guest_booking_status"]
          subtotal?: number
          tax?: number
          total?: number
        }
        Update: {
          addons?: Json
          adults?: number
          check_in?: string
          check_out?: string
          children?: number
          created_at?: string
          guest_user_id?: string
          id?: string
          nights?: number
          payment_status?: Database["public"]["Enums"]["payment_status"]
          room_number?: string | null
          room_rate?: number
          room_type?: string
          special_requests?: string | null
          status?: Database["public"]["Enums"]["guest_booking_status"]
          subtotal?: number
          tax?: number
          total?: number
        }
        Relationships: []
      }
      guest_food_orders: {
        Row: {
          booking_id: string | null
          created_at: string
          deliver_to: string | null
          guest_user_id: string
          id: string
          items: Json
          notes: string | null
          status: Database["public"]["Enums"]["food_order_status"]
          total: number
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          deliver_to?: string | null
          guest_user_id: string
          id: string
          items?: Json
          notes?: string | null
          status?: Database["public"]["Enums"]["food_order_status"]
          total?: number
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          deliver_to?: string | null
          guest_user_id?: string
          id?: string
          items?: Json
          notes?: string | null
          status?: Database["public"]["Enums"]["food_order_status"]
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "guest_food_orders_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "guest_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_requests: {
        Row: {
          assigned_room: string | null
          booking_id: string | null
          created_at: string
          details: string | null
          guest_user_id: string
          id: string
          priority: Database["public"]["Enums"]["request_priority"]
          resolved_at: string | null
          room_number: string | null
          status: Database["public"]["Enums"]["request_status"]
          title: string
          type: string
        }
        Insert: {
          assigned_room?: string | null
          booking_id?: string | null
          created_at?: string
          details?: string | null
          guest_user_id: string
          id: string
          priority?: Database["public"]["Enums"]["request_priority"]
          resolved_at?: string | null
          room_number?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          title: string
          type: string
        }
        Update: {
          assigned_room?: string | null
          booking_id?: string | null
          created_at?: string
          details?: string | null
          guest_user_id?: string
          id?: string
          priority?: Database["public"]["Enums"]["request_priority"]
          resolved_at?: string | null
          room_number?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "guest_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      housekeeping_tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          eta: string | null
          id: string
          priority: string
          room: string
          task: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          eta?: string | null
          id: string
          priority?: string
          room: string
          task: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          eta?: string | null
          id?: string
          priority?: string
          room?: string
          task?: string
        }
        Relationships: []
      }
      pos_orders: {
        Row: {
          created_at: string
          guest_name: string
          id: string
          items: Json
          notes: string | null
          payment: Database["public"]["Enums"]["pos_payment_method"]
          service: number
          status: Database["public"]["Enums"]["pos_order_status"]
          subtotal: number
          table_or_room: string
          tax: number
          total: number
          type: Database["public"]["Enums"]["pos_order_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          guest_name?: string
          id: string
          items?: Json
          notes?: string | null
          payment?: Database["public"]["Enums"]["pos_payment_method"]
          service?: number
          status?: Database["public"]["Enums"]["pos_order_status"]
          subtotal?: number
          table_or_room?: string
          tax?: number
          total?: number
          type?: Database["public"]["Enums"]["pos_order_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          guest_name?: string
          id?: string
          items?: Json
          notes?: string | null
          payment?: Database["public"]["Enums"]["pos_payment_method"]
          service?: number
          status?: Database["public"]["Enums"]["pos_order_status"]
          subtotal?: number
          table_or_room?: string
          tax?: number
          total?: number
          type?: Database["public"]["Enums"]["pos_order_type"]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          email: string
          full_name: string
          id: string
          joined_at: string
          loyalty_tier: Database["public"]["Enums"]["loyalty_tier"]
          phone: string | null
          points: number
          position: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email: string
          full_name?: string
          id: string
          joined_at?: string
          loyalty_tier?: Database["public"]["Enums"]["loyalty_tier"]
          phone?: string | null
          points?: number
          position?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string
          full_name?: string
          id?: string
          joined_at?: string
          loyalty_tier?: Database["public"]["Enums"]["loyalty_tier"]
          phone?: string | null
          points?: number
          position?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      property_profile: {
        Row: {
          data: Json
          id: number
          updated_at: string
        }
        Insert: {
          data?: Json
          id?: number
          updated_at?: string
        }
        Update: {
          data?: Json
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
      rate_codes: {
        Row: {
          active: boolean
          description: string | null
          discount: number
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          description?: string | null
          discount?: number
          id: string
          name: string
        }
        Update: {
          active?: boolean
          description?: string | null
          discount?: number
          id?: string
          name?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          adults: number
          check_in: string
          check_out: string
          children: number
          created_at: string
          deposit: number
          guest_id: string | null
          guest_name: string
          id: string
          notes: string | null
          rate_code: string | null
          room_id: string | null
          source: string | null
          status: Database["public"]["Enums"]["reservation_status"]
          total_amount: number
        }
        Insert: {
          adults?: number
          check_in: string
          check_out: string
          children?: number
          created_at?: string
          deposit?: number
          guest_id?: string | null
          guest_name: string
          id: string
          notes?: string | null
          rate_code?: string | null
          room_id?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["reservation_status"]
          total_amount?: number
        }
        Update: {
          adults?: number
          check_in?: string
          check_out?: string
          children?: number
          created_at?: string
          deposit?: number
          guest_id?: string | null
          guest_name?: string
          id?: string
          notes?: string | null
          rate_code?: string | null
          room_id?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["reservation_status"]
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "reservations_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "crm_guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          amenities: Json
          base_rate: number
          beds: string | null
          capacity: number
          floor: number
          id: string
          image: string | null
          number: string
          status: Database["public"]["Enums"]["room_status"]
          type: string
          updated_at: string
        }
        Insert: {
          amenities?: Json
          base_rate?: number
          beds?: string | null
          capacity?: number
          floor: number
          id: string
          image?: string | null
          number: string
          status?: Database["public"]["Enums"]["room_status"]
          type: string
          updated_at?: string
        }
        Update: {
          amenities?: Json
          base_rate?: number
          beds?: string | null
          capacity?: number
          floor?: number
          id?: string
          image?: string | null
          number?: string
          status?: Database["public"]["Enums"]["room_status"]
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      venues: {
        Row: {
          active: boolean
          area: string | null
          capacity: number
          created_at: string
          features: Json
          id: string
          image_url: string | null
          name: string
          rate: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          area?: string | null
          capacity?: number
          created_at?: string
          features?: Json
          id?: string
          image_url?: string | null
          name: string
          rate?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          area?: string | null
          capacity?: number
          created_at?: string
          features?: Json
          id?: string
          image_url?: string | null
          name?: string
          rate?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "employee" | "guest"
      event_status: "Proposal" | "Confirmed" | "In Progress" | "Completed"
      food_order_status:
        | "Placed"
        | "Preparing"
        | "On the way"
        | "Delivered"
        | "Cancelled"
      guest_booking_status:
        | "Pending"
        | "Confirmed"
        | "Checked-in"
        | "Checked-out"
        | "Cancelled"
      loyalty_tier: "Bronze" | "Silver" | "Gold" | "Platinum"
      payment_status: "Unpaid" | "Partial" | "Paid"
      pos_order_status:
        | "Pending"
        | "Preparing"
        | "Ready"
        | "Served"
        | "Cancelled"
      pos_order_type: "Dine-In" | "Room Service" | "Takeaway" | "Banquet"
      pos_payment_method: "Cash" | "Card" | "Room Charge" | "Mobile" | "Unpaid"
      request_priority: "Normal" | "Urgent"
      request_status: "Pending" | "Acknowledged" | "In Progress" | "Resolved"
      reservation_status:
        | "confirmed"
        | "checked-in"
        | "checked-out"
        | "cancelled"
        | "no-show"
      room_status:
        | "available"
        | "occupied"
        | "dirty"
        | "maintenance"
        | "reserved"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "employee", "guest"],
      event_status: ["Proposal", "Confirmed", "In Progress", "Completed"],
      food_order_status: [
        "Placed",
        "Preparing",
        "On the way",
        "Delivered",
        "Cancelled",
      ],
      guest_booking_status: [
        "Pending",
        "Confirmed",
        "Checked-in",
        "Checked-out",
        "Cancelled",
      ],
      loyalty_tier: ["Bronze", "Silver", "Gold", "Platinum"],
      payment_status: ["Unpaid", "Partial", "Paid"],
      pos_order_status: [
        "Pending",
        "Preparing",
        "Ready",
        "Served",
        "Cancelled",
      ],
      pos_order_type: ["Dine-In", "Room Service", "Takeaway", "Banquet"],
      pos_payment_method: ["Cash", "Card", "Room Charge", "Mobile", "Unpaid"],
      request_priority: ["Normal", "Urgent"],
      request_status: ["Pending", "Acknowledged", "In Progress", "Resolved"],
      reservation_status: [
        "confirmed",
        "checked-in",
        "checked-out",
        "cancelled",
        "no-show",
      ],
      room_status: [
        "available",
        "occupied",
        "dirty",
        "maintenance",
        "reserved",
      ],
    },
  },
} as const
