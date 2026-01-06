'use client';

import { AdvancedFilters } from '@/components/ui/advanced-filters';
import { useSearchParams } from 'next/navigation';

export function AdvancedFiltersWrapper() {
  const searchParams = useSearchParams();
  
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const location = searchParams.get('location');
  const propertyType = searchParams.get('propertyType');
  const amenitiesParam = searchParams.get('amenities');
  const amenities = amenitiesParam ? amenitiesParam.split(',') : [];

  return (
    <AdvancedFilters
      initialMinPrice={minPrice ? parseInt(minPrice) : 0}
      initialMaxPrice={maxPrice ? parseInt(maxPrice) : 50000}
      initialLocation={location || ''}
      initialPropertyType={propertyType || ''}
      initialAmenities={amenities}
    />
  );
}