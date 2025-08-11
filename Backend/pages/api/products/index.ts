import { NextApiRequest, NextApiResponse } from 'next';
import { withCORS } from '@/middleware/cors';
import { supabase, supabaseAdmin } from '@/lib/supabase';

interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  available?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getProducts(req, res);
      case 'POST':
        return await createProduct(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Products API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/products - Fetch products with advanced filtering
async function getProducts(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      category,
      minPrice,
      maxPrice,
      location,
      available = 'true',
      search,
      page = '1',
      limit = '20',
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query as Record<string, string>;

    let query = supabase
      .from('products')
      .select(`
        *,
        reviews:reviews(rating, comment, created_at, user_id)
      `);

    // Apply filters
    if (available === 'true') {
      query = query.eq('is_available', true);
    }

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (minPrice && !isNaN(parseFloat(minPrice))) {
      query = query.gte('price_per_day', parseFloat(minPrice));
    }

    if (maxPrice && !isNaN(parseFloat(maxPrice))) {
      query = query.lte('price_per_day', parseFloat(maxPrice));
    }

    if (location) {
      query = query.ilike('location', `%${location}%`);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%`);
    }

    // Apply sorting
    const validSortFields = ['created_at', 'price_per_day', 'rating', 'name', 'total_reviews'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder === 'asc';
    
    query = query.order(sortField, { ascending: order });

    // Apply pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    query = query.range(offset, offset + limitNum - 1);

    const { data: products, error } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      return res.status(500).json({ error: 'Failed to fetch products' });
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('products')
      .select('id', { count: 'exact', head: true });

    if (available === 'true') {
      countQuery = countQuery.eq('is_available', true);
    }
    
    if (category && category !== 'all') {
      countQuery = countQuery.eq('category', category);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Error getting count:', countError);
    }

    // Get categories for filter options
    const { data: categories } = await supabase
      .from('products')
      .select('category')
      .eq('is_available', true);

    const categorySet = new Set(categories?.map(p => p.category) || []);
    const uniqueCategories = Array.from(categorySet);

    return res.status(200).json({
      success: true,
      data: products || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitNum)
      },
      filters: {
        categories: uniqueCategories
      }
    });

  } catch (error) {
    console.error('Error in getProducts:', error);
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
}

// POST /api/products - Create new product
async function createProduct(req: NextApiRequest, res: NextApiResponse) {
  try {
    const productData = req.body;

    // Validation
    if (!productData.name || !productData.category || !productData.price_per_day) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, category, price_per_day' 
      });
    }

    if (productData.price_per_day <= 0) {
      return res.status(400).json({ 
        error: 'Price per day must be greater than 0' 
      });
    }

    const newProduct = {
      ...productData,
      is_available: true,
      stock_quantity: productData.stock_quantity || 1,
      minimum_rental_days: productData.minimum_rental_days || 1,
      maximum_rental_days: productData.maximum_rental_days || 365,
      deposit_amount: productData.deposit_amount || 0,
      rating: 0,
      total_reviews: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .insert([newProduct])
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      return res.status(500).json({ error: 'Failed to create product' });
    }

    return res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully'
    });

  } catch (error) {
    console.error('Error in createProduct:', error);
    return res.status(500).json({ error: 'Failed to create product' });
  }
}

export default withCORS(handler);
