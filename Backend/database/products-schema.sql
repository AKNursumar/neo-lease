-- Create products table with comprehensive fields
CREATE TABLE IF NOT EXISTS public.products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price_per_day DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  stock_quantity INTEGER DEFAULT 1,
  minimum_rental_days INTEGER DEFAULT 1,
  maximum_rental_days INTEGER DEFAULT 365,
  deposit_amount DECIMAL(10,2) DEFAULT 0,
  specifications JSONB,
  tags TEXT[],
  rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  owner_id UUID REFERENCES auth.users(id),
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies for products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read products
CREATE POLICY "Anyone can view products" ON public.products
  FOR SELECT USING (true);

-- Allow authenticated users to insert their own products
CREATE POLICY "Users can create their own products" ON public.products
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Allow users to update their own products
CREATE POLICY "Users can update their own products" ON public.products
  FOR UPDATE USING (auth.uid() = owner_id);

-- Allow users to delete their own products
CREATE POLICY "Users can delete their own products" ON public.products
  FOR DELETE USING (auth.uid() = owner_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_available ON public.products(is_available);
CREATE INDEX IF NOT EXISTS idx_products_owner ON public.products(owner_id);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert comprehensive demo data
INSERT INTO public.products (
  name, 
  description, 
  category, 
  price_per_day, 
  image_url, 
  is_available, 
  stock_quantity, 
  minimum_rental_days, 
  maximum_rental_days, 
  deposit_amount, 
  specifications, 
  tags, 
  rating, 
  total_reviews, 
  location
) VALUES 
-- Photography Equipment
(
  'Professional Camera Kit',
  'Complete professional camera setup with Canon EOS R5, multiple lenses (24-70mm f/2.8, 70-200mm f/4), tripod, flash, and accessories. Perfect for events, portraits, and commercial photography.',
  'Photography',
  6500.00,
  'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=300&fit=crop',
  true,
  3,
  1,
  30,
  25000.00,
  '{"brand": "Canon", "model": "EOS R5", "megapixels": 45, "video": "8K RAW", "lenses": ["24-70mm f/2.8", "70-200mm f/4"], "accessories": ["Tripod", "Flash", "Extra batteries", "Memory cards"]}',
  ARRAY['camera', 'photography', 'professional', 'canon', 'events'],
  4.8,
  156,
  'Mumbai, Maharashtra'
),
(
  'DSLR Camera with Prime Lens',
  'Nikon D850 DSLR with 85mm f/1.4 prime lens. Excellent for portrait photography and low-light situations. Includes camera bag and accessories.',
  'Photography',
  4800.00,
  'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400&h=300&fit=crop',
  true,
  2,
  1,
  21,
  18000.00,
  '{"brand": "Nikon", "model": "D850", "megapixels": 45.7, "lens": "85mm f/1.4", "iso_range": "64-25600", "accessories": ["Camera bag", "Extra battery", "Charger"]}',
  ARRAY['nikon', 'dslr', 'portrait', 'prime lens', 'professional'],
  4.7,
  89,
  'Delhi, Delhi'
),
(
  'Drone with 4K Camera',
  'DJI Mavic Air 2 drone with 4K camera, 3-axis gimbal stabilization. Perfect for aerial photography and videography. Includes controller, extra batteries, and carrying case.',
  'Photography',
  5200.00,
  'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400&h=300&fit=crop',
  true,
  4,
  1,
  14,
  22000.00,
  '{"brand": "DJI", "model": "Mavic Air 2", "camera": "4K/60fps", "flight_time": "34 minutes", "range": "10km", "features": ["Obstacle avoidance", "ActiveTrack", "QuickShots"]}',
  ARRAY['drone', 'aerial', '4k', 'dji', 'videography'],
  4.6,
  203,
  'Bangalore, Karnataka'
),

-- Tools & Construction
(
  'Power Drill Set',
  'Professional cordless drill set with 18V battery, multiple drill bits, screwdriver attachments, and carrying case. Perfect for construction and DIY projects.',
  'Tools',
  1800.00,
  'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&h=300&fit=crop',
  true,
  5,
  1,
  30,
  3000.00,
  '{"brand": "Bosch", "voltage": "18V", "battery_life": "2 hours", "torque": "60 Nm", "accessories": ["Drill bits set", "Screwdriver bits", "Carrying case", "Charger"]}',
  ARRAY['drill', 'cordless', 'construction', 'diy', 'bosch'],
  4.5,
  127,
  'Pune, Maharashtra'
),
(
  'Circular Saw',
  'Heavy-duty circular saw for wood cutting. 1400W motor with laser guide and dust extraction. Includes various saw blades for different materials.',
  'Tools',
  2500.00,
  'https://images.unsplash.com/photo-1589998059171-988d887df646?w=400&h=300&fit=crop',
  true,
  3,
  1,
  21,
  5000.00,
  '{"brand": "Makita", "power": "1400W", "blade_size": "190mm", "features": ["Laser guide", "Dust extraction", "Depth adjustment"], "blades_included": 3}',
  ARRAY['saw', 'circular', 'woodworking', 'construction', 'makita'],
  4.4,
  78,
  'Chennai, Tamil Nadu'
),
(
  'Welding Machine',
  'Professional MIG welding machine suitable for steel, stainless steel, and aluminum. Includes welding helmet, gloves, and wire spools.',
  'Tools',
  4200.00,
  'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&h=300&fit=crop',
  true,
  2,
  3,
  30,
  15000.00,
  '{"type": "MIG", "power": "200A", "materials": ["Steel", "Stainless steel", "Aluminum"], "accessories": ["Welding helmet", "Gloves", "Wire spools", "Gas regulator"]}',
  ARRAY['welding', 'mig', 'professional', 'metalwork', 'construction'],
  4.7,
  45,
  'Hyderabad, Telangana'
),

-- Electronics
(
  'Gaming Laptop',
  'High-performance gaming laptop with RTX 4070, Intel i7 processor, 32GB RAM, and 1TB SSD. Perfect for gaming, video editing, and intensive computing tasks.',
  'Electronics',
  8500.00,
  'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400&h=300&fit=crop',
  false,
  2,
  1,
  14,
  45000.00,
  '{"brand": "ASUS ROG", "gpu": "RTX 4070", "cpu": "Intel i7-13700H", "ram": "32GB DDR5", "storage": "1TB NVMe SSD", "display": "15.6inch 144Hz", "features": ["RGB keyboard", "Advanced cooling"]}',
  ARRAY['gaming', 'laptop', 'rtx', 'high-performance', 'asus'],
  4.9,
  267,
  'Mumbai, Maharashtra'
),
(
  'MacBook Pro M2',
  'Latest MacBook Pro with M2 chip, 16GB unified memory, 512GB SSD. Ideal for creative professionals, developers, and business use.',
  'Electronics',
  12000.00,
  'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&h=300&fit=crop',
  true,
  3,
  1,
  21,
  80000.00,
  '{"brand": "Apple", "chip": "M2", "ram": "16GB", "storage": "512GB SSD", "display": "13.3inch Retina", "battery": "Up to 20 hours", "features": ["Touch Bar", "Force Touch trackpad"]}',
  ARRAY['macbook', 'apple', 'm2', 'professional', 'creative'],
  4.8,
  189,
  'Bangalore, Karnataka'
),
(
  'iPad Pro with Apple Pencil',
  '12.9-inch iPad Pro with M2 chip, Apple Pencil, and Magic Keyboard. Perfect for digital art, note-taking, and professional presentations.',
  'Electronics',
  5500.00,
  'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop',
  true,
  4,
  1,
  30,
  55000.00,
  '{"brand": "Apple", "size": "12.9 inch", "chip": "M2", "storage": "256GB", "accessories": ["Apple Pencil 2nd gen", "Magic Keyboard", "Screen protector"]}',
  ARRAY['ipad', 'tablet', 'apple pencil', 'digital art', 'productivity'],
  4.7,
  143,
  'Delhi, Delhi'
),

-- Audio Equipment
(
  'Professional DJ Mixer',
  'Pioneer DJ DJM-900NXS2 professional mixer with 4 channels, built-in effects, and club-standard connectivity. Perfect for events and clubs.',
  'Audio',
  7200.00,
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
  true,
  2,
  1,
  7,
  35000.00,
  '{"brand": "Pioneer DJ", "model": "DJM-900NXS2", "channels": 4, "features": ["Built-in effects", "USB connectivity", "Club-standard audio", "Magvel faders"], "connectivity": ["XLR", "RCA", "USB", "Ethernet"]}',
  ARRAY['dj', 'mixer', 'pioneer', 'professional', 'club'],
  4.8,
  98,
  'Mumbai, Maharashtra'
),
(
  'Studio Monitor Speakers',
  'KRK Rokit 8 G4 studio monitors (pair) with professional audio accuracy. Perfect for music production, mixing, and mastering.',
  'Audio',
  3200.00,
  'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop',
  false,
  3,
  1,
  21,
  12000.00,
  '{"brand": "KRK", "model": "Rokit 8 G4", "size": "8 inch", "power": "203W", "frequency_response": "35Hz - 35kHz", "features": ["DSP-driven EQ", "Room tuning", "Isolation pads"]}',
  ARRAY['monitors', 'studio', 'krk', 'music production', 'mixing'],
  4.6,
  156,
  'Bangalore, Karnataka'
),
(
  'Audio Interface & Microphone Kit',
  'Focusrite Scarlett 2i2 audio interface with Shure SM7B microphone, boom arm, and pop filter. Complete setup for podcasting and recording.',
  'Audio',
  4800.00,
  'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&h=300&fit=crop',
  true,
  3,
  1,
  14,
  18000.00,
  '{"interface": "Focusrite Scarlett 2i2", "microphone": "Shure SM7B", "accessories": ["Boom arm", "Pop filter", "XLR cable", "Headphones"], "features": ["USB-C connectivity", "Zero-latency monitoring"]}',
  ARRAY['audio interface', 'microphone', 'podcasting', 'recording', 'focusrite', 'shure'],
  4.7,
  112,
  'Delhi, Delhi'
),

-- Sports Equipment
(
  'Tennis Racket Set',
  'Professional tennis racket set with 2 rackets, tennis balls, and carrying bag. Suitable for recreational and competitive play.',
  'Sports',
  1200.00,
  'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=300&fit=crop',
  true,
  6,
  1,
  14,
  2500.00,
  '{"brand": "Wilson", "rackets": 2, "weight": "300g each", "string_tension": "50-60 lbs", "accessories": ["Tennis balls (6)", "Carrying bag", "Grip tape"]}',
  ARRAY['tennis', 'racket', 'wilson', 'sports', 'recreational'],
  4.3,
  67,
  'Pune, Maharashtra'
),
(
  'Cricket Kit Complete',
  'Complete cricket kit with bat, pads, gloves, helmet, and ball. Perfect for casual games and practice sessions.',
  'Sports',
  2200.00,
  'https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=400&h=300&fit=crop',
  true,
  4,
  1,
  21,
  5000.00,
  '{"items": ["Cricket bat", "Leg pads", "Batting gloves", "Helmet", "Cricket ball", "Kit bag"], "brand": "MRF", "bat_weight": "1.2kg"}',
  ARRAY['cricket', 'bat', 'sports', 'complete kit', 'mrf'],
  4.4,
  89,
  'Mumbai, Maharashtra'
),
(
  'Bicycle Mountain Bike',
  '21-speed mountain bike suitable for off-road trails and city commuting. Includes helmet and basic repair kit.',
  'Sports',
  1800.00,
  'https://images.unsplash.com/photo-1544191696-15ca3ac01c34?w=400&h=300&fit=crop',
  true,
  5,
  1,
  30,
  8000.00,
  '{"brand": "Hero", "gears": 21, "wheel_size": "26 inch", "frame": "Steel", "accessories": ["Helmet", "Repair kit", "Water bottle holder"], "suitable_for": ["Trails", "City commuting"]}',
  ARRAY['bicycle', 'mountain bike', 'cycling', 'commuting', 'outdoor'],
  4.2,
  145,
  'Bangalore, Karnataka'
),

-- Home & Garden
(
  'Pressure Washer',
  'High-pressure washer for cleaning cars, driveways, and outdoor surfaces. Electric powered with multiple nozzle attachments.',
  'Home',
  2800.00,
  'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop',
  true,
  4,
  1,
  14,
  6000.00,
  '{"brand": "Bosch", "pressure": "130 bar", "power": "1400W", "flow_rate": "360 L/h", "attachments": ["Turbo nozzle", "Foam lance", "Surface cleaner", "Extension lance"]}',
  ARRAY['pressure washer', 'cleaning', 'car wash', 'outdoor', 'bosch'],
  4.5,
  178,
  'Chennai, Tamil Nadu'
),
(
  'Lawn Mower Electric',
  'Cordless electric lawn mower with 40V battery. Perfect for small to medium-sized gardens. Quiet operation and eco-friendly.',
  'Home',
  3200.00,
  'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop',
  true,
  3,
  1,
  21,
  8500.00,
  '{"brand": "Greenworks", "power": "40V battery", "cutting_width": "35cm", "height_adjustment": "7 positions", "features": ["Mulching", "Side discharge", "Grass collection"], "runtime": "45 minutes"}',
  ARRAY['lawn mower', 'electric', 'gardening', 'cordless', 'eco-friendly'],
  4.6,
  92,
  'Hyderabad, Telangana'
),
(
  'Projector Home Theater',
  '4K home theater projector with 3000 lumens brightness. Perfect for movie nights and presentations. Includes screen and mounting accessories.',
  'Home',
  5800.00,
  'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&h=300&fit=crop',
  true,
  2,
  1,
  30,
  25000.00,
  '{"resolution": "4K UHD", "brightness": "3000 lumens", "connectivity": ["HDMI", "USB", "WiFi", "Bluetooth"], "accessories": ["100-inch screen", "Mounting kit", "HDMI cable"], "lamp_life": "15000 hours"}',
  ARRAY['projector', '4k', 'home theater', 'movies', 'presentation'],
  4.7,
  134,
  'Mumbai, Maharashtra'
),

-- Musical Instruments
(
  'Electric Guitar with Amplifier',
  'Fender Stratocaster electric guitar with Marshall amplifier, cables, and picks. Perfect for practice, recording, and small gigs.',
  'Music',
  4500.00,
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
  true,
  3,
  1,
  21,
  20000.00,
  '{"guitar": "Fender Stratocaster", "amplifier": "Marshall MG30FX", "accessories": ["Guitar cable", "Picks", "Strap", "Tuner"], "amp_power": "30W", "effects": ["Reverb", "Delay", "Chorus"]}',
  ARRAY['guitar', 'electric', 'fender', 'marshall', 'music', 'instrument'],
  4.8,
  87,
  'Delhi, Delhi'
),
(
  'Digital Piano Keyboard',
  '88-key digital piano with weighted keys, built-in speakers, and multiple instrument sounds. Includes sustain pedal and music stand.',
  'Music',
  6200.00,
  'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=400&h=300&fit=crop',
  true,
  2,
  1,
  30,
  35000.00,
  '{"brand": "Yamaha", "keys": 88, "key_action": "Weighted", "voices": 400, "features": ["Recording", "Metronome", "Lesson mode"], "connectivity": ["USB", "Audio output", "Headphones"]}',
  ARRAY['piano', 'keyboard', 'yamaha', 'digital', 'music', '88-key'],
  4.6,
  156,
  'Bangalore, Karnataka'
),

-- Camping & Outdoor
(
  'Camping Tent 4-Person',
  'Waterproof 4-person camping tent with easy setup. Includes ground sheet, guy ropes, and pegs. Perfect for weekend camping trips.',
  'Outdoor',
  1500.00,
  'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&h=300&fit=crop',
  true,
  6,
  2,
  21,
  3000.00,
  '{"capacity": "4 person", "setup_time": "10 minutes", "features": ["Waterproof", "UV resistant", "Ventilation windows"], "dimensions": "300x200x130cm", "accessories": ["Ground sheet", "Guy ropes", "Pegs", "Carry bag"]}',
  ARRAY['tent', 'camping', 'outdoor', 'waterproof', '4-person'],
  4.4,
  203,
  'Pune, Maharashtra'
),
(
  'Portable BBQ Grill',
  'Portable charcoal BBQ grill perfect for outdoor cooking, camping, and picnics. Includes cooking utensils and charcoal starter.',
  'Outdoor',
  2200.00,
  'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop',
  true,
  4,
  1,
  14,
  4000.00,
  '{"type": "Charcoal", "cooking_area": "45x30cm", "features": ["Adjustable height", "Ash catcher", "Temperature gauge"], "accessories": ["Cooking utensils", "Charcoal starter", "Cleaning brush", "Cover"]}',
  ARRAY['bbq', 'grill', 'portable', 'outdoor', 'camping', 'cooking'],
  4.3,
  98,
  'Mumbai, Maharashtra'
);

-- Grant access to service role for backend operations
GRANT ALL ON public.products TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
