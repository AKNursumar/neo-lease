import { z } from 'zod';

// Common validation schemas
export const uuidSchema = z.string().uuid('Invalid UUID format');
export const emailSchema = z.string().email('Invalid email format');
export const phoneSchema = z.string().min(10, 'Phone number must be at least 10 digits');
export const positiveNumberSchema = z.number().positive('Must be a positive number');
export const nonNegativeNumberSchema = z.number().min(0, 'Must be non-negative');

// User validation schemas
export const userRoleSchema = z.enum(['user', 'owner', 'admin']);

// Authentication schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(1, 'Full name is required').max(100, 'Full name too long'),
  phone: phoneSchema.optional(),
});

export const createUserSchema = z.object({
  id: uuidSchema,
  full_name: z.string().min(1, 'Full name is required').max(100, 'Full name too long'),
  phone: phoneSchema.optional(),
  role: userRoleSchema.default('user'),
  avatar_url: z.string().url('Invalid avatar URL').optional(),
});

export const updateUserSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(100, 'Full name too long').optional(),
  phone: phoneSchema.optional(),
  role: userRoleSchema.optional(),
  avatar_url: z.string().url('Invalid avatar URL').optional().nullable(),
});

// Facility validation schemas
export const operatingHoursSchema = z.object({
  monday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }).optional(),
  tuesday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }).optional(),
  wednesday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }).optional(),
  thursday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }).optional(),
  friday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }).optional(),
  saturday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }).optional(),
  sunday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }).optional(),
});

export const createFacilitySchema = z.object({
  name: z.string().min(1, 'Facility name is required').max(200, 'Name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  address: z.string().min(1, 'Address is required').max(500, 'Address too long'),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  images: z.array(z.string().url('Invalid image URL')).optional(),
  amenities: z.array(z.string()).optional(),
  contact_phone: phoneSchema.optional(),
  contact_email: emailSchema.optional(),
  operating_hours: operatingHoursSchema.optional(),
  is_active: z.boolean().default(true),
});

export const updateFacilitySchema = createFacilitySchema.partial();

// Court validation schemas
export const createCourtSchema = z.object({
  facility_id: uuidSchema,
  name: z.string().min(1, 'Court name is required').max(100, 'Name too long'),
  sport_type: z.string().min(1, 'Sport type is required').max(50, 'Sport type too long'),
  capacity: z.number().int().positive('Capacity must be a positive integer'),
  price_per_hour: positiveNumberSchema,
  price_per_day: positiveNumberSchema.optional(),
  availability_config: z.object({
    advance_booking_days: z.number().int().min(0).max(365),
    min_booking_duration: z.number().int().positive(),
    max_booking_duration: z.number().int().positive(),
    blackout_dates: z.array(z.string().datetime()).optional(),
  }).optional(),
  images: z.array(z.string().url('Invalid image URL')).optional(),
  is_active: z.boolean().default(true),
});

export const updateCourtSchema = createCourtSchema.partial().omit({ facility_id: true });

// Product validation schemas
export const pricingSchema = z.object({
  hour: positiveNumberSchema.optional(),
  day: positiveNumberSchema.optional(),
  week: positiveNumberSchema.optional(),
  month: positiveNumberSchema.optional(),
});

export const createProductSchema = z.object({
  facility_id: uuidSchema,
  name: z.string().min(1, 'Product name is required').max(200, 'Name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  pricing: pricingSchema,
  deposit_amount: nonNegativeNumberSchema,
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  images: z.array(z.string().url('Invalid image URL')).optional(),
  category: z.string().max(100, 'Category too long').optional(),
  specifications: z.record(z.any()).optional(),
  is_active: z.boolean().default(true),
});

export const updateProductSchema = createProductSchema.partial().omit({ facility_id: true });

// Booking validation schemas
export const createBookingSchema = z.object({
  court_id: uuidSchema,
  start_datetime: z.string().datetime('Invalid start datetime'),
  end_datetime: z.string().datetime('Invalid end datetime'),
  notes: z.string().max(500, 'Notes too long').optional(),
}).refine(
  (data) => new Date(data.end_datetime) > new Date(data.start_datetime),
  {
    message: 'End datetime must be after start datetime',
    path: ['end_datetime'],
  }
);

export const updateBookingSchema = z.object({
  status: z.enum(['draft', 'confirmed', 'cancelled', 'completed']).optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
});

// Rental order validation schemas
export const rentalItemSchema = z.object({
  product_id: uuidSchema,
  quantity: z.number().int().positive('Quantity must be positive'),
});

export const createRentalOrderSchema = z.object({
  start_date: z.string().datetime('Invalid start date'),
  end_date: z.string().datetime('Invalid end date'),
  items: z.array(rentalItemSchema).min(1, 'At least one item is required'),
  notes: z.string().max(500, 'Notes too long').optional(),
}).refine(
  (data) => new Date(data.end_date) > new Date(data.start_date),
  {
    message: 'End date must be after start date',
    path: ['end_date'],
  }
);

export const updateRentalOrderSchema = z.object({
  status: z.enum(['draft', 'confirmed', 'active', 'returned', 'cancelled', 'overdue']).optional(),
  return_condition: z.string().max(500, 'Return condition too long').optional(),
  late_fees: nonNegativeNumberSchema.optional(),
  damage_fees: nonNegativeNumberSchema.optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
});

// Payment validation schemas
export const createPaymentSchema = z.object({
  amount: positiveNumberSchema,
  currency: z.string().length(3, 'Currency must be 3 characters').default('INR'),
  provider: z.string().default('razorpay'),
  metadata: z.record(z.any()).optional(),
});

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1, 'Order ID is required'),
  razorpay_payment_id: z.string().min(1, 'Payment ID is required'),
  razorpay_signature: z.string().min(1, 'Signature is required'),
});

// File upload validation schemas
export const uploadFileSchema = z.object({
  bucket: z.string().min(1, 'Bucket name is required'),
  filename: z.string().min(1, 'Filename is required'),
  contentType: z.string().min(1, 'Content type is required'),
});

// Query parameter validation schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const dateRangeSchema = z.object({
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
}).refine(
  (data) => {
    if (data.start_date && data.end_date) {
      return new Date(data.end_date) >= new Date(data.start_date);
    }
    return true;
  },
  {
    message: 'End date must be after or equal to start date',
    path: ['end_date'],
  }
);

// Availability check schema
export const checkAvailabilitySchema = z.object({
  court_id: uuidSchema.optional(),
  product_id: uuidSchema.optional(),
  start_datetime: z.string().datetime('Invalid start datetime'),
  end_datetime: z.string().datetime('Invalid end datetime'),
  exclude_booking_id: uuidSchema.optional(),
  exclude_rental_id: uuidSchema.optional(),
}).refine(
  (data) => data.court_id || data.product_id,
  {
    message: 'Either court_id or product_id is required',
    path: ['court_id'],
  }
).refine(
  (data) => new Date(data.end_datetime) > new Date(data.start_datetime),
  {
    message: 'End datetime must be after start datetime',
    path: ['end_datetime'],
  }
);

// Notification schemas
export const createNotificationSchema = z.object({
  user_id: uuidSchema,
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  message: z.string().min(1, 'Message is required').max(1000, 'Message too long'),
  type: z.string().max(50, 'Type too long'),
  metadata: z.record(z.any()).optional(),
});

// Helper function to validate request body
export function validateRequestBody<T>(schema: z.ZodSchema<T>, body: unknown): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(body);
  
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error };
  }
}

// Helper function to validate query parameters
export function validateQuery<T>(schema: z.ZodSchema<T>, query: unknown): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(query);
  
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error };
  }
}

// Helper function to format validation errors
export function formatValidationErrors(errors: z.ZodError): Array<{ field: string; message: string }> {
  return errors.errors.map((error) => ({
    field: error.path.join('.'),
    message: error.message,
  }));
}