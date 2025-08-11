import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  Share2, 
  Eye, 
  ShoppingCart, 
  Star, 
  MapPin, 
  Calendar,
  Clock,
  Zap,
  Award,
  TrendingUp,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface Product {
  id: string;
  title: string;
  description: string;
  images: string[];
  price: number;
  originalPrice?: number;
  category: string;
  location: string;
  rating: number;
  reviewCount: number;
  owner: {
    name: string;
    avatar: string;
    verified: boolean;
    responseRate: number;
  };
  features: string[];
  availability: 'available' | 'unavailable' | 'limited';
  trending?: boolean;
  featured?: boolean;
  discount?: number;
  tags: string[];
  rentedCount: number;
  lastRented?: Date;
  createdAt: Date;
}

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
  onProductClick: (productId: string) => void;
  onAddToCart: (productId: string) => void;
  onToggleFavorite: (productId: string) => void;
  onShare: (productId: string) => void;
  favorites: string[];
  viewMode: 'grid' | 'list';
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  loading = false,
  onProductClick,
  onAddToCart,
  onToggleFavorite,
  onShare,
  favorites,
  viewMode = 'grid',
}) => {
  const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({});
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);

  const handleImageLoad = (productId: string) => {
    setImageLoading(prev => ({ ...prev, [productId]: false }));
  };

  const handleImageError = (productId: string) => {
    setImageLoading(prev => ({ ...prev, [productId]: false }));
  };

  const ProductCard: React.FC<{ product: Product; index: number }> = ({ product, index }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const isFavorite = favorites.includes(product.id);

    const imageVariants = {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
      exit: { opacity: 0 }
    };

    useEffect(() => {
      if (product.images.length > 1 && hoveredProduct === product.id) {
        const interval = setInterval(() => {
          setCurrentImageIndex(prev => 
            prev === product.images.length - 1 ? 0 : prev + 1
          );
        }, 2000);
        return () => clearInterval(interval);
      } else {
        setCurrentImageIndex(0);
      }
    }, [hoveredProduct, product.id, product.images.length]);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -8 }}
        transition={{ 
          delay: index * 0.1,
          duration: 0.5 
        }}
        className={cn(
          "group cursor-pointer",
          viewMode === 'list' && "flex gap-4"
        )}
        onMouseEnter={() => setHoveredProduct(product.id)}
        onMouseLeave={() => setHoveredProduct(null)}
        onClick={() => onProductClick(product.id)}
      >
        <Card className={cn(
          "neu-card overflow-hidden relative transition-all duration-300",
          viewMode === 'grid' && "h-full",
          viewMode === 'list' && "flex-1"
        )}>
          {/* Badges */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
            {product.featured && (
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold">
                <Award className="w-3 h-3 mr-1" />
                Featured
              </Badge>
            )}
            {product.trending && (
              <Badge className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                <TrendingUp className="w-3 h-3 mr-1" />
                Trending
              </Badge>
            )}
            {product.discount && (
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                {product.discount}% OFF
              </Badge>
            )}
            {product.availability === 'limited' && (
              <Badge variant="destructive">
                <Zap className="w-3 h-3 mr-1" />
                Limited
              </Badge>
            )}
          </div>

          {/* Action Buttons */}
          <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
            <Button
              size="sm"
              variant="secondary"
              className={cn(
                "neu-button w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200",
                isFavorite && "opacity-100 text-red-500"
              )}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(product.id);
              }}
            >
              <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="neu-button w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200"
              onClick={(e) => {
                e.stopPropagation();
                onShare(product.id);
              }}
            >
              <Share2 className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="neu-button w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200"
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>

          <div className={cn(
            viewMode === 'grid' && "flex flex-col h-full",
            viewMode === 'list' && "flex gap-4"
          )}>
            {/* Image Section */}
            <div className={cn(
              "relative overflow-hidden",
              viewMode === 'grid' && "aspect-[4/3]",
              viewMode === 'list' && "w-48 h-32 flex-shrink-0"
            )}>
              <AnimatePresence mode="wait">
                <motion.img
                  key={`${product.id}-${currentImageIndex}`}
                  variants={imageVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  src={product.images[currentImageIndex] || '/placeholder.svg'}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onLoad={() => handleImageLoad(product.id)}
                  onError={() => handleImageError(product.id)}
                />
              </AnimatePresence>

              {/* Image Indicators */}
              {product.images.length > 1 && hoveredProduct === product.id && (
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                  {product.images.map((_, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all duration-200",
                        idx === currentImageIndex ? "bg-white" : "bg-white/50"
                      )}
                    />
                  ))}
                </div>
              )}

              {/* Availability Overlay */}
              {product.availability === 'unavailable' && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Badge variant="secondary" className="text-lg">
                    Unavailable
                  </Badge>
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className={cn(
              "p-4",
              viewMode === 'grid' && "flex-1 flex flex-col",
              viewMode === 'list' && "flex-1"
            )}>
              {/* Title and Category */}
              <div className="mb-2">
                <h3 className="font-semibold text-lg text-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                  {product.title}
                </h3>
                <Badge variant="outline" className="text-xs">
                  {product.category}
                </Badge>
              </div>

              {/* Description */}
              <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                {product.description}
              </p>

              {/* Features */}
              <div className="flex flex-wrap gap-1 mb-3">
                {product.features.slice(0, 3).map((feature, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {feature}
                  </Badge>
                ))}
                {product.features.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{product.features.length - 3}
                  </Badge>
                )}
              </div>

              {/* Rating and Reviews */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{product.rating.toFixed(1)}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  ({product.reviewCount} reviews)
                </span>
                <div className="flex items-center gap-1 ml-auto">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {product.rentedCount} rented
                  </span>
                </div>
              </div>

              {/* Location and Time */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{product.location}</span>
                </div>
                {product.lastRented && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Last rented {new Date(product.lastRented).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {/* Owner Info */}
              <div className="flex items-center gap-2 mb-4">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={product.owner.avatar} alt={product.owner.name} />
                  <AvatarFallback className="text-xs">{product.owner.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">{product.owner.name}</span>
                {product.owner.verified && (
                  <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                    Verified
                  </Badge>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-xs text-muted-foreground ml-auto">
                      {product.owner.responseRate}% response
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Response rate within 24 hours</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Price and Action */}
              <div className={cn(
                "flex items-center justify-between",
                viewMode === 'grid' && "mt-auto"
              )}>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-primary">
                    ₹{product.price}
                  </span>
                  <span className="text-sm text-muted-foreground">/day</span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-sm text-muted-foreground line-through">
                      ₹{product.originalPrice}
                    </span>
                  )}
                </div>

                <Button
                  size="sm"
                  className="neu-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToCart(product.id);
                  }}
                  disabled={product.availability === 'unavailable'}
                >
                  <ShoppingCart className="w-4 h-4 mr-1" />
                  {product.availability === 'limited' ? 'Quick Add' : 'Add to Cart'}
                </Button>
              </div>

              {/* Tags */}
              {product.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {product.tags.slice(0, 4).map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className={cn(
        "grid gap-6",
        viewMode === 'grid' && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        viewMode === 'list' && "grid-cols-1"
      )}>
        {Array.from({ length: 8 }).map((_, idx) => (
          <Card key={idx} className="neu-card animate-pulse">
            <div className={cn(
              "bg-muted",
              viewMode === 'grid' && "aspect-[4/3]",
              viewMode === 'list' && "h-32"
            )} />
            <div className="p-4 space-y-3">
              <div className="h-5 bg-muted rounded" />
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-8 bg-muted rounded" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="neu-card p-8 max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
            <ShoppingCart className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No products found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search criteria or browse our categories.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "grid gap-6",
      viewMode === 'grid' && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
      viewMode === 'list' && "grid-cols-1"
    )}>
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} index={index} />
      ))}
    </div>
  );
};

export default ProductGrid;
