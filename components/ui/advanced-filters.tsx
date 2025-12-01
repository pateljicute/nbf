'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  SlidersHorizontal, 
  X, 
  Filter,
  IndianRupee,
  IndianRupeeIcon
} from 'lucide-react';

const PROPERTY_TYPES = [
  { value: 'PG', label: 'PG / Hostel' },
  { value: 'Flat', label: 'Flat / Apartment' },
  { value: 'Room', label: 'Private Room' },
  { value: '1BHK', label: '1 BHK' },
  { value: '2BHK', label: '2 BHK' },
  { value: '3BHK', label: '3 BHK' },
];

const AMENITIES = [
  { value: 'ac', label: 'AC' },
  { value: 'wifi', label: 'WiFi' },
  { value: 'food', label: 'Food Included' },
  { value: 'laundry', label: 'Laundry' },
  { value: 'parking', label: 'Parking' },
  { value: 'powersupply', label: 'Power Supply' },
  { value: 'furnished', label: 'Furnished' },
  { value: 'attached-bathroom', label: 'Attached Bathroom' },
];

interface AdvancedFiltersProps {
  initialMinPrice?: number;
  initialMaxPrice?: number;
  initialLocation?: string;
  initialPropertyType?: string;
  initialAmenities?: string[];
}

export function AdvancedFilters({
  initialMinPrice = 0,
  initialMaxPrice = 50000,
  initialLocation = '',
  initialPropertyType = '',
  initialAmenities = [],
}: AdvancedFiltersProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [selectedPropertyType, setSelectedPropertyType] = useState(initialPropertyType);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(initialAmenities);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [cities, setCities] = useState<string[]>([]);

  // Fetch Indian cities
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch('https://countriesnow.space/api/v0.1/countries/cities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ country: 'india' })
        });
        const data = await response.json();
        if (data.data) {
          setCities(data.data.sort());
        }
      } catch (error) {
        console.error('Error fetching cities:', error);
        // Fallback cities
        setCities(['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad']);
      }
    };

    fetchCities();
  }, []);

  // Filter cities based on input
  const filteredCities = useMemo(() => {
    if (!selectedLocation) return cities.slice(0, 20); // Show top 20 cities if no input
    return cities
      .filter(city => city.toLowerCase().includes(selectedLocation.toLowerCase()))
      .slice(0, 20);
  }, [selectedLocation, cities]);

  // Handle form submission
  const applyFilters = () => {
    const params = new URLSearchParams(searchParams);
    
    // Add price filters
    if (minPrice > 0) params.set('minPrice', minPrice.toString());
    else params.delete('minPrice');
    
    if (maxPrice < 50000) params.set('maxPrice', maxPrice.toString());
    else params.delete('maxPrice');
    
    // Add location filter
    if (selectedLocation) params.set('location', selectedLocation);
    else params.delete('location');
    
    // Add property type filter
    if (selectedPropertyType) params.set('propertyType', selectedPropertyType);
    else params.delete('propertyType');
    
    // Add amenities filter
    if (selectedAmenities.length > 0) params.set('amenities', selectedAmenities.join(','));
    else params.delete('amenities');
    
    // Always go to root collection for filtered results
    params.set('collection', 'joyco-root');
    
    router.push(`${pathname}?${params.toString()}`);
    setIsFilterOpen(false);
  };

  // Handle clear filters
  const clearFilters = () => {
    setMinPrice(0);
    setMaxPrice(50000);
    setSelectedLocation('');
    setSelectedPropertyType('');
    setSelectedAmenities([]);
    
    const params = new URLSearchParams(searchParams);
    params.delete('minPrice');
    params.delete('maxPrice');
    params.delete('location');
    params.delete('propertyType');
    params.delete('amenities');
    
    router.push(`${pathname}?${params.toString()}`);
  };

  // Toggle amenity selection
  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity) 
        ? prev.filter(a => a !== amenity) 
        : [...prev, amenity]
    );
  };

  // Check if any filters are active
  const hasActiveFilters = 
    minPrice > 0 || 
    maxPrice < 50000 || 
    selectedLocation || 
    selectedPropertyType || 
    selectedAmenities.length > 0;

  return (
    <div className="w-full">
      {/* Desktop Filters */}
      <div className="hidden md:block border rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Filters</h2>
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters}
              className="text-sm"
            >
              Clear all
            </Button>
          )}
        </div>

        {/* Price Range */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Price Range</h3>
            <div className="flex items-center gap-2 text-sm">
              <IndianRupeeIcon className="h-4 w-4" />
              <span>{minPrice.toLocaleString()}</span>
              <span>-</span>
              <IndianRupeeIcon className="h-4 w-4" />
              <span>{maxPrice.toLocaleString()}</span>
            </div>
          </div>
          <Slider
            value={[minPrice, maxPrice]}
            onValueChange={([newMin, newMax]) => {
              setMinPrice(newMin);
              setMaxPrice(newMax);
            }}
            max={50000}
            min={0}
            step={500}
            className="w-full"
          />
        </div>

        {/* Location */}
        <div className="mb-8">
          <Label htmlFor="location" className="mb-2 block font-medium">Location</Label>
          <Input
            id="location"
            placeholder="Search city or location..."
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="mb-2"
          />
          {selectedLocation && (
            <div className="max-h-40 overflow-y-auto border rounded-md">
              {filteredCities.map(city => (
                <button
                  key={city}
                  className="w-full text-left px-3 py-2 hover:bg-accent text-sm"
                  onClick={() => {
                    setSelectedLocation(city);
                  }}
                >
                  {city}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Property Type */}
        <div className="mb-8">
          <Label className="mb-2 block font-medium">Property Type</Label>
          <Select value={selectedPropertyType} onValueChange={setSelectedPropertyType}>
            <SelectTrigger>
              <SelectValue placeholder="Select property type" />
            </SelectTrigger>
            <SelectContent>
              {PROPERTY_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Amenities */}
        <div>
          <Label className="mb-2 block font-medium">Amenities</Label>
          <div className="grid grid-cols-2 gap-2">
            {AMENITIES.map(amenity => (
              <div key={amenity.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`amenity-${amenity.value}`}
                  checked={selectedAmenities.includes(amenity.value)}
                  onCheckedChange={() => toggleAmenity(amenity.value)}
                />
                <Label 
                  htmlFor={`amenity-${amenity.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {amenity.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Button 
          onClick={applyFilters} 
          className="w-full mt-6 bg-black hover:bg-neutral-800"
        >
          Apply Filters
        </Button>
      </div>

      {/* Mobile Filters */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Filters</h2>
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters}
            >
              Clear
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => setIsFilterOpen(true)}
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Mobile Filter Dialog */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsFilterOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Filters</h2>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsFilterOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Price Range */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Price Range</h3>
                <div className="flex items-center gap-2 text-sm">
                  <IndianRupeeIcon className="h-4 w-4" />
                  <span>{minPrice.toLocaleString()}</span>
                  <span>-</span>
                  <IndianRupeeIcon className="h-4 w-4" />
                  <span>{maxPrice.toLocaleString()}</span>
                </div>
              </div>
              <Slider
                value={[minPrice, maxPrice]}
                onValueChange={([newMin, newMax]) => {
                  setMinPrice(newMin);
                  setMaxPrice(newMax);
                }}
                max={50000}
                min={0}
                step={500}
                className="w-full"
              />
            </div>

            {/* Location */}
            <div className="mb-6">
              <Label htmlFor="mobile-location" className="mb-2 block font-medium">Location</Label>
              <Input
                id="mobile-location"
                placeholder="Search city or location..."
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="mb-2"
              />
              {selectedLocation && (
                <div className="max-h-40 overflow-y-auto border rounded-md">
                  {filteredCities.map(city => (
                    <button
                      key={city}
                      className="w-full text-left px-3 py-2 hover:bg-accent text-sm"
                      onClick={() => {
                        setSelectedLocation(city);
                        setIsFilterOpen(false); // Close after selection on mobile
                      }}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Property Type */}
            <div className="mb-6">
              <Label className="mb-2 block font-medium">Property Type</Label>
              <Select value={selectedPropertyType} onValueChange={(value) => {
                setSelectedPropertyType(value);
                setIsFilterOpen(false); // Close after selection on mobile
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select property type" />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amenities */}
            <div className="mb-8">
              <Label className="mb-2 block font-medium">Amenities</Label>
              <div className="grid grid-cols-2 gap-2">
                {AMENITIES.map(amenity => (
                  <div key={amenity.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`mobile-amenity-${amenity.value}`}
                      checked={selectedAmenities.includes(amenity.value)}
                      onCheckedChange={() => toggleAmenity(amenity.value)}
                    />
                    <Label 
                      htmlFor={`mobile-amenity-${amenity.value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {amenity.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={clearFilters}
              >
                Clear
              </Button>
              <Button 
                onClick={applyFilters} 
                className="flex-1 bg-black hover:bg-neutral-800"
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Tags */}
      {(hasActiveFilters) && (
        <div className="flex flex-wrap gap-2 mt-4">
          {minPrice > 0 && (
            <Badge variant="secondary">
              Min: ₹{minPrice.toLocaleString()}
              <button 
                onClick={() => setMinPrice(0)}
                className="ml-2"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {maxPrice < 50000 && (
            <Badge variant="secondary">
              Max: ₹{maxPrice.toLocaleString()}
              <button 
                onClick={() => setMaxPrice(50000)}
                className="ml-2"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedLocation && (
            <Badge variant="secondary">
              {selectedLocation}
              <button 
                onClick={() => setSelectedLocation('')}
                className="ml-2"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedPropertyType && (
            <Badge variant="secondary">
              {PROPERTY_TYPES.find(t => t.value === selectedPropertyType)?.label}
              <button 
                onClick={() => setSelectedPropertyType('')}
                className="ml-2"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedAmenities.map(amenity => (
            <Badge key={amenity} variant="secondary">
              {AMENITIES.find(a => a.value === amenity)?.label}
              <button 
                onClick={() => toggleAmenity(amenity)}
                className="ml-2"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}