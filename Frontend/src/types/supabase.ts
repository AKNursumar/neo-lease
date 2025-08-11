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
          email: string
          full_name: string | null
          phone: string | null
          role: 'user' | 'owner' | 'admin'
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone?: string | null
          role?: 'user' | 'owner' | 'admin'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          role?: 'user' | 'owner' | 'admin'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          category: string
          price_per_day: number
          image_url: string | null
          is_available: boolean
          stock_quantity: number
          minimum_rental_days: number
          maximum_rental_days: number
          deposit_amount: number
          specifications: Json | null
          tags: string[] | null
          rating: number
          total_reviews: number
          owner_id: string | null
          location: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category: string
          price_per_day: number
          image_url?: string | null
          is_available?: boolean
          stock_quantity?: number
          minimum_rental_days?: number
          maximum_rental_days?: number
          deposit_amount?: number
          specifications?: Json | null
          tags?: string[] | null
          rating?: number
          total_reviews?: number
          owner_id?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: string
          price_per_day?: number
          image_url?: string | null
          is_available?: boolean
          stock_quantity?: number
          minimum_rental_days?: number
          maximum_rental_days?: number
          deposit_amount?: number
          specifications?: Json | null
          tags?: string[] | null
          rating?: number
          total_reviews?: number
          owner_id?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      rentals: {
        Row: {
          id: string
          user_id: string
          product_id: string
          start_date: string
          end_date: string
          duration_days: number
          price_per_day: number
          base_amount: number
          deposit_amount: number
          total_amount: number
          status: 'pending' | 'confirmed' | 'active' | 'returned' | 'cancelled' | 'overdue'
          delivery_address: string | null
          special_instructions: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          start_date: string
          end_date: string
          duration_days: number
          price_per_day: number
          base_amount: number
          deposit_amount: number
          total_amount: number
          status?: 'pending' | 'confirmed' | 'active' | 'returned' | 'cancelled' | 'overdue'
          delivery_address?: string | null
          special_instructions?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          start_date?: string
          end_date?: string
          duration_days?: number
          price_per_day?: number
          base_amount?: number
          deposit_amount?: number
          total_amount?: number
          status?: 'pending' | 'confirmed' | 'active' | 'returned' | 'cancelled' | 'overdue'
          delivery_address?: string | null
          special_instructions?: string | null
          created_at?: string
          updated_at?: string
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
          status: 'pending' | 'completed' | 'failed' | 'refunded'
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
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
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
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      cart_items: {
        Row: {
          id: string
          user_id: string
          product_id: string
          quantity: number
          start_date: string
          end_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          quantity: number
          start_date: string
          end_date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          quantity?: number
          start_date?: string
          end_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          product_id: string
          user_id: string
          rating: number
          comment: string | null
          rental_order_id: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          product_id: string
          user_id: string
          rating: number
          comment?: string | null
          rental_order_id?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          product_id?: string
          user_id?: string
          rating?: number
          comment?: string | null
          rental_order_id?: string | null
          created_at?: string
          updated_at?: string | null
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
      rental_status: 'pending' | 'confirmed' | 'active' | 'returned' | 'cancelled' | 'overdue'
      payment_status: 'pending' | 'completed' | 'failed' | 'refunded'
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

export type Product = Database['public']['Tables']['products']['Row'];
export type NewProduct = Database['public']['Tables']['products']['Insert'];
export type ProductUpdate = Database['public']['Tables']['products']['Update'];

export type Rental = Database['public']['Tables']['rentals']['Row'];
export type NewRental = Database['public']['Tables']['rentals']['Insert'];
export type RentalUpdate = Database['public']['Tables']['rentals']['Update'];

export type Payment = Database['public']['Tables']['payments']['Row'];
export type NewPayment = Database['public']['Tables']['payments']['Insert'];
export type PaymentUpdate = Database['public']['Tables']['payments']['Update'];

export type CartItem = Database['public']['Tables']['cart_items']['Row'];
export type NewCartItem = Database['public']['Tables']['cart_items']['Insert'];
export type CartItemUpdate = Database['public']['Tables']['cart_items']['Update'];

export type Review = Database['public']['Tables']['reviews']['Row'];
export type NewReview = Database['public']['Tables']['reviews']['Insert'];
export type ReviewUpdate = Database['public']['Tables']['reviews']['Update'];

// Extended types with relations
export interface ProductWithReviews extends Product {
  reviews: Review[];
}

export interface RentalWithDetails extends Rental {
  product: Product;
  payment?: Payment;
}

export interface CartItemWithProduct extends CartItem {
  product: Product;
}
