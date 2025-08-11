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
          full_name: string | null
          phone: string | null
          role: 'user' | 'owner' | 'admin'
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          phone?: string | null
          role?: 'user' | 'owner' | 'admin'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          phone?: string | null
          role?: 'user' | 'owner' | 'admin'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      facilities: {
        Row: {
          id: string
          owner_id: string
          name: string
          description: string | null
          address: string
          lat: number | null
          lng: number | null
          images: string[] | null
          amenities: string[] | null
          contact_phone: string | null
          contact_email: string | null
          operating_hours: Json | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          description?: string | null
          address: string
          lat?: number | null
          lng?: number | null
          images?: string[] | null
          amenities?: string[] | null
          contact_phone?: string | null
          contact_email?: string | null
          operating_hours?: Json | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          description?: string | null
          address?: string
          lat?: number | null
          lng?: number | null
          images?: string[] | null
          amenities?: string[] | null
          contact_phone?: string | null
          contact_email?: string | null
          operating_hours?: Json | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      courts: {
        Row: {
          id: string
          facility_id: string
          name: string
          sport_type: string
          capacity: number
          price_per_hour: number
          price_per_day: number | null
          availability_config: Json | null
          images: string[] | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          facility_id: string
          name: string
          sport_type: string
          capacity: number
          price_per_hour: number
          price_per_day?: number | null
          availability_config?: Json | null
          images?: string[] | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          facility_id?: string
          name?: string
          sport_type?: string
          capacity?: number
          price_per_hour?: number
          price_per_day?: number | null
          availability_config?: Json | null
          images?: string[] | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          facility_id: string
          name: string
          description: string | null
          pricing: Json
          deposit_amount: number
          quantity: number
          available_quantity: number
          images: string[] | null
          category: string | null
          specifications: Json | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          facility_id: string
          name: string
          description?: string | null
          pricing: Json
          deposit_amount: number
          quantity: number
          available_quantity?: number
          images?: string[] | null
          category?: string | null
          specifications?: Json | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          facility_id?: string
          name?: string
          description?: string | null
          pricing?: Json
          deposit_amount?: number
          quantity?: number
          available_quantity?: number
          images?: string[] | null
          category?: string | null
          specifications?: Json | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          user_id: string
          court_id: string
          start_datetime: string
          end_datetime: string
          status: 'draft' | 'confirmed' | 'cancelled' | 'completed'
          total_price: number
          payment_id: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          court_id: string
          start_datetime: string
          end_datetime: string
          status?: 'draft' | 'confirmed' | 'cancelled' | 'completed'
          total_price: number
          payment_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          court_id?: string
          start_datetime?: string
          end_datetime?: string
          status?: 'draft' | 'confirmed' | 'cancelled' | 'completed'
          total_price?: number
          payment_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      rental_orders: {
        Row: {
          id: string
          user_id: string
          start_date: string
          end_date: string
          status: 'draft' | 'confirmed' | 'active' | 'returned' | 'cancelled' | 'overdue'
          total_amount: number
          deposit_amount: number
          payment_id: string | null
          return_condition: string | null
          late_fees: number | null
          damage_fees: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          start_date: string
          end_date: string
          status?: 'draft' | 'confirmed' | 'active' | 'returned' | 'cancelled' | 'overdue'
          total_amount: number
          deposit_amount: number
          payment_id?: string | null
          return_condition?: string | null
          late_fees?: number | null
          damage_fees?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          start_date?: string
          end_date?: string
          status?: 'draft' | 'confirmed' | 'active' | 'returned' | 'cancelled' | 'overdue'
          total_amount?: number
          deposit_amount?: number
          payment_id?: string | null
          return_condition?: string | null
          late_fees?: number | null
          damage_fees?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      rental_items: {
        Row: {
          id: string
          rental_order_id: string
          product_id: string
          quantity: number
          unit_price: number
          total_price: number
          created_at: string
        }
        Insert: {
          id?: string
          rental_order_id: string
          product_id: string
          quantity: number
          unit_price: number
          total_price: number
          created_at?: string
        }
        Update: {
          id?: string
          rental_order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
          total_price?: number
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          user_id: string
          amount: number
          currency: string
          provider: string
          provider_order_id: string | null
          provider_payment_id: string | null
          provider_signature: string | null
          status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled'
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          currency?: string
          provider: string
          provider_order_id?: string | null
          provider_payment_id?: string | null
          provider_signature?: string | null
          status?: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled'
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          currency?: string
          provider?: string
          provider_order_id?: string | null
          provider_payment_id?: string | null
          provider_signature?: string | null
          status?: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled'
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: string
          is_read: boolean
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: string
          is_read?: boolean
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: string
          is_read?: boolean
          metadata?: Json | null
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
      user_role: 'user' | 'owner' | 'admin'
      booking_status: 'draft' | 'confirmed' | 'cancelled' | 'completed'
      rental_status: 'draft' | 'confirmed' | 'active' | 'returned' | 'cancelled' | 'overdue'
      payment_status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for common operations
export type User = Database['public']['Tables']['users']['Row'];
export type NewUser = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

export type Facility = Database['public']['Tables']['facilities']['Row'];
export type NewFacility = Database['public']['Tables']['facilities']['Insert'];
export type FacilityUpdate = Database['public']['Tables']['facilities']['Update'];

export type Court = Database['public']['Tables']['courts']['Row'];
export type NewCourt = Database['public']['Tables']['courts']['Insert'];
export type CourtUpdate = Database['public']['Tables']['courts']['Update'];

export type Product = Database['public']['Tables']['products']['Row'];
export type NewProduct = Database['public']['Tables']['products']['Insert'];
export type ProductUpdate = Database['public']['Tables']['products']['Update'];

export type Booking = Database['public']['Tables']['bookings']['Row'];
export type NewBooking = Database['public']['Tables']['bookings']['Insert'];
export type BookingUpdate = Database['public']['Tables']['bookings']['Update'];

export type RentalOrder = Database['public']['Tables']['rental_orders']['Row'];
export type NewRentalOrder = Database['public']['Tables']['rental_orders']['Insert'];
export type RentalOrderUpdate = Database['public']['Tables']['rental_orders']['Update'];

export type Payment = Database['public']['Tables']['payments']['Row'];
export type NewPayment = Database['public']['Tables']['payments']['Insert'];
export type PaymentUpdate = Database['public']['Tables']['payments']['Update'];

export type Notification = Database['public']['Tables']['notifications']['Row'];
export type NewNotification = Database['public']['Tables']['notifications']['Insert'];

// Extended types with relations
export interface FacilityWithCourts extends Facility {
  courts: Court[];
}

export interface FacilityWithProducts extends Facility {
  products: Product[];
}

export interface BookingWithDetails extends Booking {
  court: Court & {
    facility: Facility;
  };
  user: User;
  payment?: Payment;
}

export interface RentalOrderWithDetails extends RentalOrder {
  rental_items: Array<{
    id: string;
    product: Product & { facility: Facility };
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  user: User;
  payment?: Payment;
}