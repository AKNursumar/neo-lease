import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, X, MapPin, Calendar, DollarSign, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface SearchFilters {
  query: string;
  category: string;
  location: string;
  minPrice: number;
  maxPrice: number;
  rating: number;
  availability: 'all' | 'available' | 'unavailable';
  startDate?: Date;
  endDate?: Date;
  sortBy: 'relevance' | 'price_low' | 'price_high' | 'rating' | 'newest';
}

interface SearchAndFilterProps {
  onFiltersChange: (filters: SearchFilters) => void;
  categories: string[];
  locations: string[];
  priceRange: [number, number];
}

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  onFiltersChange,
  categories,
  locations,
  priceRange,
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: '',
    location: '',
    minPrice: priceRange[0],
    maxPrice: priceRange[1],
    rating: 0,
    availability: 'available',
    sortBy: 'relevance',
  });

  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  useEffect(() => {
    onFiltersChange(filters);
    updateActiveFilters();
  }, [filters, onFiltersChange]);

  const updateActiveFilters = () => {
    const active: string[] = [];
    
    if (filters.query) active.push(`Search: "${filters.query}"`);
    if (filters.category) active.push(`Category: ${filters.category}`);
    if (filters.location) active.push(`Location: ${filters.location}`);
    if (filters.minPrice > priceRange[0] || filters.maxPrice < priceRange[1]) {
      active.push(`Price: ₹${filters.minPrice} - ₹${filters.maxPrice}`);
    }
    if (filters.rating > 0) active.push(`Rating: ${filters.rating}+ stars`);
    if (filters.availability !== 'available') active.push(`Availability: ${filters.availability}`);
    if (filters.startDate) active.push(`From: ${filters.startDate.toLocaleDateString()}`);
    if (filters.endDate) active.push(`Until: ${filters.endDate.toLocaleDateString()}`);
    
    setActiveFilters(active);
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      query: '',
      category: '',
      location: '',
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      rating: 0,
      availability: 'available',
      sortBy: 'relevance',
    });
  };

  const removeFilter = (filterText: string) => {
    if (filterText.startsWith('Search:')) {
      handleFilterChange('query', '');
    } else if (filterText.startsWith('Category:')) {
      handleFilterChange('category', '');
    } else if (filterText.startsWith('Location:')) {
      handleFilterChange('location', '');
    } else if (filterText.startsWith('Price:')) {
      handleFilterChange('minPrice', priceRange[0]);
      handleFilterChange('maxPrice', priceRange[1]);
    } else if (filterText.startsWith('Rating:')) {
      handleFilterChange('rating', 0);
    } else if (filterText.startsWith('Availability:')) {
      handleFilterChange('availability', 'available');
    } else if (filterText.startsWith('From:')) {
      handleFilterChange('startDate', undefined);
    } else if (filterText.startsWith('Until:')) {
      handleFilterChange('endDate', undefined);
    }
  };

  return (
    <div className="w-full">
      {/* Search Bar */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search products, categories, locations..."
            value={filters.query}
            onChange={(e) => handleFilterChange('query', e.target.value)}
            className="neu-input pl-10 pr-4 py-3"
          />
        </div>
        
        <Button
          variant="outline"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className={cn(
            "neu-button px-4 py-3 text-foreground",
            isFilterOpen && "neu-inset"
          )}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
          {activeFilters.length > 0 && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {activeFilters.length}
            </Badge>
          )}
        </Button>

        <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value as any)}>
          <SelectTrigger className="neu-input w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">Most Relevant</SelectItem>
            <SelectItem value="price_low">Price: Low to High</SelectItem>
            <SelectItem value="price_high">Price: High to Low</SelectItem>
            <SelectItem value="rating">Highest Rated</SelectItem>
            <SelectItem value="newest">Newest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {activeFilters.map((filter, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="neu-inset px-3 py-1 text-xs cursor-pointer hover:bg-destructive/10 hover:text-destructive"
              onClick={() => removeFilter(filter)}
            >
              {filter}
              <X className="w-3 h-3 ml-1" />
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            Clear All
          </Button>
        </div>
      )}

      {/* Advanced Filters Panel */}
      {isFilterOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="neu-card p-6 mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Category Filter */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Category</label>
              <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
                <SelectTrigger className="neu-input">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location Filter */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location
              </label>
              <Select value={filters.location} onValueChange={(value) => handleFilterChange('location', value)}>
                <SelectTrigger className="neu-input">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Locations</SelectItem>
                  {locations.map(location => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Availability Filter */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Availability</label>
              <Select value={filters.availability} onValueChange={(value) => handleFilterChange('availability', value as any)}>
                <SelectTrigger className="neu-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="available">Available Only</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price Range */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Price Range
              </label>
              <div className="px-4 py-2">
                <Slider
                  min={priceRange[0]}
                  max={priceRange[1]}
                  step={100}
                  value={[filters.minPrice, filters.maxPrice]}
                  onValueChange={([min, max]) => {
                    handleFilterChange('minPrice', min);
                    handleFilterChange('maxPrice', max);
                  }}
                  className="w-full"
                />
                <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                  <span>₹{filters.minPrice}</span>
                  <span>₹{filters.maxPrice}</span>
                </div>
              </div>
            </div>

            {/* Minimum Rating */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <Star className="w-4 h-4" />
                Minimum Rating
              </label>
              <Select value={filters.rating.toString()} onValueChange={(value) => handleFilterChange('rating', parseInt(value))}>
                <SelectTrigger className="neu-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Any Rating</SelectItem>
                  <SelectItem value="1">1+ Stars</SelectItem>
                  <SelectItem value="2">2+ Stars</SelectItem>
                  <SelectItem value="3">3+ Stars</SelectItem>
                  <SelectItem value="4">4+ Stars</SelectItem>
                  <SelectItem value="5">5 Stars Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Rental Period
              </label>
              <div className="flex gap-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="neu-input justify-start text-left font-normal">
                      {filters.startDate ? filters.startDate.toLocaleDateString() : "Start Date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={filters.startDate}
                      onSelect={(date) => handleFilterChange('startDate', date)}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="neu-input justify-start text-left font-normal">
                      {filters.endDate ? filters.endDate.toLocaleDateString() : "End Date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={filters.endDate}
                      onSelect={(date) => handleFilterChange('endDate', date)}
                      disabled={(date) => date < (filters.startDate || new Date())}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-border/20">
            <Button
              variant="ghost"
              onClick={clearAllFilters}
              className="text-muted-foreground hover:text-destructive"
            >
              Clear All Filters
            </Button>
            <Button
              onClick={() => setIsFilterOpen(false)}
              className="neu-button"
            >
              Apply Filters
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SearchAndFilter;
