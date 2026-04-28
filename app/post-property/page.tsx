'use client';
// rebuild fix

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    CheckCircle2, ArrowRight, ShieldCheck, ChevronLeft, ChevronRight,
    Wifi, Car, Shield, Waves, Zap, Utensils, Shirt, PersonStanding, MapPin, Navigation, ExternalLink, AlertTriangle,
    Droplets, Bath, Armchair, Monitor, BookOpen, Warehouse, Trees
} from 'lucide-react';

import { useAuth } from '@/lib/auth-context';
import { useLoader } from '@/context/loader-context';
import { getProducts, updateProduct, createProduct } from '@/lib/api';
import { toast } from 'sonner';
import { MultiImageUpload } from '@/components/ui/multi-image-upload';
import dynamic from 'next/dynamic';

// Amenities with icons
const AMENITIES_LIST = [
    { id: 'wifi', label: 'WiFi', icon: Wifi },
    { id: 'ac', label: 'AC', icon: Waves },
    { id: 'parking', label: 'Parking', icon: Car },
    { id: 'water', label: '24/7 Water', icon: Droplets },
    { id: 'power', label: 'Power Backup', icon: Zap },
    { id: 'cctv', label: 'CCTV / Security', icon: Shield },
    { id: 'laundry', label: 'Laundry', icon: Shirt },
    { id: 'kitchen', label: 'Kitchen', icon: Utensils },
    { id: 'lift', label: 'Lift', icon: PersonStanding },
    { id: 'ro_water', label: 'RO Water', icon: Droplets },
    { id: 'attached_washroom', label: 'Attach Washroom', icon: Bath },
    { id: 'geyser', label: 'Geyser', icon: Waves },
    { id: 'study_table', label: 'Study Table', icon: BookOpen },
    { id: 'wardrobe', label: 'Wardrobe', icon: Warehouse },
    { id: 'balcony', label: 'Balcony', icon: Trees },
];

const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
    "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
    "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu", "Lakshadweep", "Delhi", "Puducherry",
    "Ladakh", "Jammu and Kashmir"
];

const POPULAR_LOCATIONS = [
    // Mandsaur District
    'Mandsaur', 'Piplia Mandi', 'Daloda', 'Sita Mau', 'Bhanpura', 'Garoth', 'Shamgarh', 'Suwasra', 'Malhargarh',
    // Ratlam District
    'Ratlam', 'Jora', 'Alot', 'Sailana', 'Bajna', 'Piploda', 'Tal', 'Rawoti',
    // Neemuch District
    'Neemuch', 'Manasa', 'Singoli', 'Jeeran', 'Diken', 'Jawad',
    // Ujjain District
    'Ujjain', 'Nagda', 'Barnagar', 'Mahidpur', 'Tarana', 'Khachrod', 'Ghatiya', 'Unhel',
    // Nagda Specific Areas
    'Grasim Staff Colony', 'Jawahar Marg', 'MG Road', 'Mehatwas', 'Padaliya', 'Durgapura',
    // Kota District
    'Kota', 'Ladpura', 'Sangod', 'Ramganj Mandi', 'Pipalda', 'Digod'
];

import { useListingMode } from '@/lib/listing-mode-context';

// ── Sell Mode Category Config ──────────────────────────────────────────────
// Controls which fields are shown per property type in Sell mode
const SELL_CATEGORY_CONFIG: Record<string, Record<string, boolean>> = {
    House:  { bhk: true,  bathroom: true,  furnishing: true,  builtUpArea: true,  plotArea: false, dimensions: false, shutterWidth: false, roadWidth: false, amenities: true,  floor: true  },
    Villa:  { bhk: true,  bathroom: true,  furnishing: true,  builtUpArea: true,  plotArea: true,  dimensions: false, shutterWidth: false, roadWidth: false, amenities: true,  floor: false },
    Flat:   { bhk: true,  bathroom: true,  furnishing: true,  builtUpArea: true,  plotArea: false, dimensions: false, shutterWidth: false, roadWidth: false, amenities: true,  floor: true  },
    Plot:   { bhk: false, bathroom: false, furnishing: false, builtUpArea: false, plotArea: true,  dimensions: true,  shutterWidth: false, roadWidth: true,  amenities: false, floor: false },
    Shop:   { bhk: false, bathroom: false, furnishing: false, builtUpArea: true,  plotArea: true,  dimensions: true,  shutterWidth: true,  roadWidth: true,  amenities: false, floor: true  },
};

const shouldShow = (type: string, field: string): boolean => {
    if (!SELL_CATEGORY_CONFIG[type]) return true; // Default: show for unknown types
    return SELL_CATEGORY_CONFIG[type][field] ?? true;
};

function PostPropertyContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get('edit');
    const { user, session, profile, isLoading: authLoading } = useAuth();
    const { showLoader, hideLoader } = useLoader();
    const { mode } = useListingMode();

    // Form States
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [createdProduct, setCreatedProduct] = useState<any>(null); // To store product for sharing

    // Location States
    const [isDetectingLocation, setIsDetectingLocation] = useState(false);
    const [showLocationDialog, setShowLocationDialog] = useState(false);
    const [useManualLink, setUseManualLink] = useState(false);
    const [detectedCoords, setDetectedCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [detectedAddress, setDetectedAddress] = useState<string>('');
    const [isMapVerified, setIsMapVerified] = useState<boolean | null>(null);

    // Data States
    const [cities, setCities] = useState<string[]>([]);
    const [citySearch, setCitySearch] = useState('');
    const [showCityDropdown, setShowCityDropdown] = useState(false);

    // Interactive Map State
    const [showMapPicker, setShowMapPicker] = useState(false);
    
    // Custom Amenities State
    const [customAmenityInput, setCustomAmenityInput] = useState('');

    const LocationPicker = useMemo(() => dynamic(() => import('@/components/ui/location-picker'), {
        ssr: false,
        loading: () => <div className="h-[400px] w-full bg-neutral-100 animate-pulse rounded-xl flex items-center justify-center">Loading Map...</div>
    }), []);

    const [formData, setFormData] = useState({
        // Step 1: Essentials
        title: '',
        description: '',
        type: 'PG', // Will be 'House', 'Villa', 'Flat', 'Plot' for Sell
        state: '',
        city: '',
        locality: '',
        address: '',
        pincode: '',
        location: '', // Deprecated but kept for backward compatibility if needed, sync with city

        builtUpArea: '',
        floorNumber: '',
        totalFloors: '',
        furnishingStatus: 'Semi-Furnished',
        
        // Sell Specifics
        listing_type: mode,
        total_area: '',
        dimensions: '',
        facing: '',
        road_width: '',
        bhk: '',
        property_age: '',
        registry: false,
        diversion: false,
        mutation: false,
        negotiable: false,
        original_price: '',
        shutter_width: '',
        main_road_distance: '',

        // Location Data
        latitude: null as number | null,
        longitude: null as number | null,
        googleMapsLink: '',

        // Step 2: Features
        amenities: [] as string[],
        bathroomType: 'Common',
        tenantPreference: 'Any',
        electricityStatus: 'Separate',

        // Step 3: Financials & Media
        price: '',
        securityDeposit: '',
        contactNumber: '',
        images: [] as string[]
    });

    useEffect(() => {
        fetchIndianCities();
        if (editId) {
            setIsEditMode(true);
            loadProperty(editId);
        }
    }, [editId]);

    // --- AUTO-SAVE (DRAFT) LOGIC ---
    const DRAFT_KEY = 'nbf_property_draft';

    // 1. Load Draft on Mount (Only if NOT in edit mode)
    useEffect(() => {
        if (!editId) {
            const savedDraft = localStorage.getItem(DRAFT_KEY);
            if (savedDraft) {
                try {
                    const parsed = JSON.parse(savedDraft);
                    // Only restore if mode matches (rent vs sell)
                    if (parsed.mode === mode) {
                        // Prevent restoring if form is already heavily modified
                        setFormData(parsed.formData);
                        setStep(parsed.step);
                        if (parsed.detectedCoords) {
                            setDetectedCoords(parsed.detectedCoords);
                            setIsMapVerified(true);
                        }
                        toast.success('Restored your unsaved draft', { duration: 3000 });
                    }
                } catch (e) {
                    console.error('Failed to parse draft', e);
                    localStorage.removeItem(DRAFT_KEY);
                }
            }
        }
    }, [editId, mode]);

    // 2. Save Draft on Change (Only if NOT in edit mode and NOT success)
    useEffect(() => {
        if (!isEditMode && !isSuccess) {
            const timer = setTimeout(() => {
                const draftData = {
                    formData,
                    step,
                    mode,
                    detectedCoords
                };
                localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
            }, 500); // Debounce save by 500ms
            
            return () => clearTimeout(timer);
        }
    }, [formData, step, mode, isEditMode, isSuccess, detectedCoords]);

    // Pre-fill primary contact from user profile
    useEffect(() => {
        if (!isEditMode && profile?.contact_number && !formData.contactNumber) {
            setFormData(prev => ({ ...prev, contactNumber: profile.contact_number || '' }));
        }
    }, [profile, isEditMode]);

    const handleAddCustomAmenity = () => {
        if (!customAmenityInput.trim()) return;
        if (formData.amenities.length >= 10) {
            toast.error("You can add a maximum of 10 amenities.");
            return;
        }
        if (formData.amenities.includes(customAmenityInput.trim())) {
            toast.error("This amenity is already added.");
            return;
        }
        setFormData(prev => ({
            ...prev,
            amenities: [...prev.amenities, customAmenityInput.trim()]
        }));
        setCustomAmenityInput('');
    };

    const fetchIndianCities = async () => {
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
            setCities(['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad']);
        }
    };

    const loadProperty = async (id: string) => {
        showLoader();
        try {
            const properties = await getProducts();
            const property: any = properties.find(p => p.id === id);

            if (property) {
                const location = property.tags?.[1] || '';
                const existingImages = property.images?.map((img: any) => img.url) || [];

                setFormData({
                    title: property.title,
                    description: property.description ? property.description.split('\n\n--- About Property')[0].trim() : '',
                    type: property.tags?.[0] || 'PG',
                    address: property.address || property.tags?.[2] || '',
                    location: property.location || location,

                    state: property.state || '',
                    city: property.city || property.location || '',
                    locality: property.locality || '',
                    pincode: property.pincode || '',
                    builtUpArea: property.builtUpArea || property.built_up_area || '',
                    floorNumber: property.floorNumber || property.floor_number || '',
                    totalFloors: property.totalFloors || property.total_floors || '',
                    furnishingStatus: property.furnishingStatus || property.furnishing_status || 'Semi-Furnished',

                    latitude: property.latitude || null,
                    longitude: property.longitude || null,
                    googleMapsLink: property.googleMapsLink || '',

                    amenities: property.amenities || [],
                    bathroomType: property.bathroomType || property.bathroom_type || 'Common',
                    tenantPreference: property.tenant_preference || 'tenantPreference' in property ? property.tenantPreference : 'Any',
                    electricityStatus: property.electricity_status || 'electricityStatus' in property ? property.electricityStatus : 'Separate',

                    price: property.price || property.priceRange?.minVariantPrice?.amount || '',
                    original_price: property.original_price || '',
                    securityDeposit: property.security_deposit || property.securityDeposit || '',
                    contactNumber: property.contactNumber || '',
                    shutter_width: property.shutter_width || '',
                    main_road_distance: property.main_road_distance || '',

                    // Sell-specific fields
                    listing_type: property.listing_type || 'rent',
                    total_area: property.total_area || '',
                    dimensions: property.dimensions || '',
                    facing: property.facing || '',
                    road_width: property.road_width || '',
                    bhk: property.bhk || '',
                    property_age: property.property_age || '',
                    registry: property.registry || false,
                    diversion: property.diversion || false,
                    mutation: property.mutation || false,
                    negotiable: property.negotiable || false,

                    images: existingImages
                });
                setCitySearch(property.city || property.location || '');

                if (property.latitude && property.longitude) {
                    setDetectedCoords({ lat: property.latitude, lng: property.longitude });
                }
                if (property.googleMapsLink) {
                    setUseManualLink(true);
                }
            }
        } catch (error) {
            console.error('Error loading property:', error);
        } finally {
            hideLoader();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        // Pincode validation: restrict to 6 digits
        if (name === 'pincode') {
            if (value.length > 6) return;
            if (value && !/^\d*$/.test(value)) return;
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const toggleAmenity = (amenityId: string) => {
        setFormData(prev => {
            const current = prev.amenities;
            if (current.includes(amenityId)) {
                return { ...prev, amenities: current.filter(a => a !== amenityId) };
            } else {
                return { ...prev, amenities: [...current, amenityId] };
            }
        });
    };

    // Auto-Generated SEO Tags based on User Input
    const generatedSeoTags = useMemo(() => {
        if (!formData.city) return [];
        const city = formData.city;
        const address = formData.address || formData.locality || 'prime location';
        const type = formData.type || 'Property';

        return [
            `Best ${type.toLowerCase()} for rent in ${city}`,
            `Affordable ${type.toLowerCase()} in ${address}, ${city}`,
            `${city} mein sasta kiraye ka makan`,
            `Top rated ${type.toLowerCase()} near me in ${city}`,
            `Rooms for rent in ${city} without broker`,
            `Fully furnished ${type.toLowerCase()} in ${city}`,
            `Cheap rental properties in ${address}`,
            `Best Hostels and PGs in ${city}`,
            `Direct owner ${type.toLowerCase()} in ${city} rent`,
            `Budget friendly stays in ${city}`
        ];
    }, [formData.city, formData.address, formData.locality, formData.type]);

    const handleCitySelect = (city: string) => {
        setFormData(prev => ({ ...prev, city: city, location: city }));
        setCitySearch(city);
        setShowCityDropdown(false);
    };

    // Location Logic
    const [tempLocationData, setTempLocationData] = useState<any>(null);

    const handleDetectLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }

        setIsDetectingLocation(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setDetectedCoords({ lat: latitude, lng: longitude });

                // Fetch Address Immediately
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`);
                    const data = await response.json();
                    if (data && data.display_name) {
                        setDetectedAddress(data.display_name);
                        setTempLocationData(data);
                    } else {
                        setDetectedAddress("Address not found");
                    }
                } catch (error) {
                    console.error("Reverse geocoding error:", error);
                    setDetectedAddress("Error fetching address");
                }

                setIsDetectingLocation(false);
                setShowLocationDialog(true);
            },
            (error) => {
                console.warn("Geolocation warning:", error.message, error.code);
                setIsDetectingLocation(false);
                let errorMessage = "Could not detect location.";
                // ... error handling
                toast.error(`${errorMessage} using manual entry instead.`);
                setUseManualLink(true);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const confirmLocation = () => {
        if (detectedCoords && tempLocationData) {
            // Apply Data
            const data = tempLocationData;
            setFormData(prev => ({
                ...prev,
                latitude: detectedCoords.lat,
                longitude: detectedCoords.lng,
                address: data.display_name,
                city: data.address?.city || data.address?.town || data.address?.village || prev.city,
                state: data.address?.state || prev.state,
                locality: data.address?.suburb || data.address?.neighbourhood || prev.locality,
                pincode: data.address?.postcode || prev.pincode,
                googleMapsLink: ''
            }));

            setIsMapVerified(true);
            toast.success("Location confirmed & updated!");
            setUseManualLink(false);
            setShowLocationDialog(false);
        } else if (detectedCoords) {
            // Fallback if address fetch failed but coords exist
            setFormData(prev => ({
                ...prev,
                latitude: detectedCoords.lat,
                longitude: detectedCoords.lng
            }));
            setIsMapVerified(true);
            setShowLocationDialog(false);
        }
    };

    const rejectLocation = () => {
        setShowLocationDialog(false);
        setUseManualLink(true);
        setDetectedCoords(null);
        setFormData(prev => ({
            ...prev,
            latitude: null,
            longitude: null
        }));
    };

    // Extract coords from Google Maps Link (Simple heuristic)
    const handleMapLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const link = e.target.value;
        setFormData(prev => ({ ...prev, googleMapsLink: link }));

        // Try to parse basic lat/mg from valid google maps URLs logic (e.g. @28.123,77.123)
        // This is a basic regex, might not cover all cases but helps
        const coordsMatch = link.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (coordsMatch) {
            const lat = parseFloat(coordsMatch[1]);
            const lng = parseFloat(coordsMatch[2]);
            setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
            setDetectedCoords({ lat, lng });
        }
    };

    const validateStep = (currentStep: number) => {
        if (currentStep === 1) {
            if (!formData.title || !formData.state || !formData.city || !formData.address || !formData.pincode) {
                toast.error("Please fill in basic details including Pincode");
                return false;
            }
            if (formData.pincode.length !== 6) {
                toast.error("Please enter a valid 6-digit Pincode");
                return false;
            }
            // Mandatory Map Selection for 100% Location Accuracy
            if (!isMapVerified && !formData.googleMapsLink) {
                toast.error("Please select precise location on map / कृपया मैप पर अपनी सटीक लोकेशन चुनें");
                return false;
            }
        }

        if (currentStep === 2 && mode === 'sell') {
            const type = formData.type;
            // Plot: total_area + dimensions mandatory
            if (type === 'Plot') {
                if (!formData.total_area) { toast.error('Please enter Plot Area (total area)'); return false; }
                if (!formData.dimensions) { toast.error('Please enter Plot Dimensions (L×W)'); return false; }
            }
            // Shop: shutter_width + main_road_distance mandatory
            if (type === 'Shop') {
                if (!formData.shutter_width) { toast.error('Please enter Shutter Width'); return false; }
                if (!formData.main_road_distance) { toast.error('Please enter Distance from Main Road'); return false; }
            }
            // House/Villa/Flat: total_area mandatory
            if (['House', 'Villa', 'Flat'].includes(type)) {
                if (!formData.total_area) { toast.error('Please enter Total / Plot Area'); return false; }
            }
        }

        return true;
    };

    const nextStep = () => {
        if (validateStep(step)) {
            setStep(prev => Math.min(prev + 1, 3));
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const prevStep = () => {
        setStep(prev => Math.max(prev - 1, 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async () => {
        if (!formData.price || !formData.contactNumber) {
            toast.error("Please fill in price and contact details");
            return;
        }

        if (mode === 'sell' && !formData.total_area && formData.type !== 'Shop') {
            toast.error("Please fill in Total Area / Plot Area");
            return;
        }

        if (mode === 'sell' && formData.type === 'Shop' && !formData.total_area && !formData.builtUpArea) {
            toast.error("Please fill in Total Area or Built-up Area for the Shop");
            return;
        }

        if (!user) {
            toast.error("You must be logged in to post a property");
            return;
        }

        if (mode === 'rent' && !formData.bathroomType) {
            toast.error("Please select a bathroom type");
            return;
        }

        if (formData.images.length < 3) {
            toast.error("Photo upload is mandatory. Please add at least 3 photos (e.g. Front, Inside, Street view).");
            return;
        }

        setIsLoading(true);
        showLoader();

        try {
            let finalDescription = formData.description;
            if (generatedSeoTags.length > 0) {
                finalDescription += `\n\n--- About Property & Area ---\nFind the best and most affordable ${formData.type} for rent in ${formData.city}. Located near ${formData.address || formData.locality}, this property offers great amenities for tenants. Explore more top-rated stays locally without brokerage.\n\nSearch Tags: ${generatedSeoTags.join(', ')}`;
            }

            const payload = {
                ...formData,
                description: finalDescription,
                user_id: user.id
            };

            let result;
            if (isEditMode && editId) {
                result = await updateProduct(editId, payload, session?.access_token);
                toast.success('Property updated successfully');
                router.push('/profile');
            } else {
                result = await createProduct(payload, session?.access_token);
                setCreatedProduct({ ...formData, handle: result?.handle || 'new-property' }); // Mock handle if not returned immediately
                setIsSuccess(true);
                localStorage.removeItem(DRAFT_KEY); // Clear draft on successful submission
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (error: any) {
            console.error('Error saving property (Full):', JSON.stringify(error, null, 2));
            console.error('Error saving property (Message):', error?.message);
            toast.error(error.message || 'An error occurred');
            hideLoader();
        } finally {
            setIsLoading(false);
            // Only hide loader if NOT redirecting (i.e., if success message showing or error occurred)
            // But 'catch' already hid it.
            // And 'Create' success needs to hide it.
            if (!isEditMode) {
                hideLoader();
            }
        }
    };

    const handleWhatsAppShare = () => {
        if (!createdProduct) return;

        const title = createdProduct.title || 'New Property';
        const price = Number(createdProduct.price).toLocaleString('en-IN') || '0';
        const location = createdProduct.location || 'Mandsaur';
        // Note: The handle might need to be fetched properly if not returned by createProduct
        // Using a fallback or the returned handle if available
        const url = `${window.location.origin}/product/${createdProduct.handle}`;

        const isSell = createdProduct.listing_type === 'sell';
        const typeLabel = isSell ? 'Asking Price' : 'Rent';
        const priceSuffix = isSell ? '' : '/month';
        const type = createdProduct.type || 'Property';

        let message = `🏠 NBF HOMES - ${type} ${isSell ? 'For Sale' : 'For Rent'}

📝 Title: ${title}
💰 ${typeLabel}: ₹${price}${priceSuffix}
📍 Address: ${location}

Aur adhik jankari aur property ki photos dekhne ke liye niche di gayi link par click karein 👇

🔗 Link: ${url}`;
        const encodedText = encodeURIComponent(message);

        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile) {
            window.location.href = `whatsapp://send?text=${encodedText}`;
        } else {
            window.open(`https://web.whatsapp.com/send?text=${encodedText}`, '_blank');
        }
    };

    const filteredCities = cities.filter(city =>
        city.toLowerCase().includes(citySearch.toLowerCase())
    ).slice(0, 50);

    // Mini Map Source
    const getMapSrc = () => {
        if (detectedCoords) {
            return `https://maps.google.com/maps?q=${detectedCoords.lat},${detectedCoords.lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
        }
        const city = formData.city || formData.location;
        if (formData.address && city) {
            let queryStr = `${formData.address}, ${city}`;
            if (formData.state) queryStr += `, ${formData.state}`;
            const query = encodeURIComponent(queryStr);
            return `https://maps.google.com/maps?q=${query}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
        }
        return '';
    };

    // Success View
    if (isSuccess) {
        return (
            <div className="max-w-xl mx-auto px-4 py-12">
                <div className="bg-white p-8 md:p-12 rounded-2xl border border-neutral-100 shadow-xl text-center animate-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldCheck className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-serif font-medium text-neutral-900 mb-4">
                        Thank you!
                    </h2>
                    <p className="text-neutral-600 text-base md:text-lg mb-8 leading-relaxed">
                        Your property has been received on <strong>NBFHOMES.IN™</strong>.
                        <br />
                        Our team is checking it and it will be live in the next 30 minutes.
                    </p>

                    {/* WhatsApp Share Button */}
                    <div className="mb-8 p-6 bg-[#E7FCE3] rounded-xl border border-[#25D366]/30">
                        <p className="text-sm font-medium text-neutral-800 mb-4">
                            Do you want to share your property with friends?
                        </p>
                        <button
                            onClick={handleWhatsAppShare}
                            className="w-full py-3 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-lg font-bold shadow-md transition-all flex items-center justify-center gap-2"
                        >
                            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                            Share to WhatsApp
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <button onClick={() => router.push('/')} className="px-8 py-3 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-all font-medium text-neutral-600 w-full sm:w-auto">
                            Return Home
                        </button>
                        <button onClick={() => router.push('/profile')} className="px-8 py-3 bg-black text-white rounded-xl hover:bg-neutral-800 transition-all font-medium flex items-center justify-center gap-2 w-full sm:w-auto">
                            View My Profile <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-neutral-50">
                <ShieldCheck className="w-16 h-16 text-neutral-300 mb-4" />
                <h2 className="text-2xl font-serif font-medium mb-2">Authentication Required</h2>
                <p className="text-neutral-500 mb-6 max-w-md">
                    Please log in to list your property. This helps us maintain a verified and safe community.
                </p>
                <div className="px-6 py-3 bg-white rounded-lg border border-neutral-200 text-sm text-neutral-600 shadow-sm">
                    Please click the <strong>Login</strong> button in the top menu to continue.
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-12">

            {/* Header */}
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-serif font-medium text-neutral-900 mb-2">
                    {isEditMode ? 'Edit Property' : 'List Your Property'}
                </h1>
                <p className="text-neutral-500">Step {step} of 3</p>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-neutral-100 rounded-full mt-4 overflow-hidden">
                    <div
                        className="h-full bg-black transition-all duration-500 ease-out"
                        style={{ width: `${(step / 3) * 100}%` }}
                    />
                </div>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm min-h-[500px] flex flex-col relative">

                {/* Location Confirmation Popup */}
                {showLocationDialog && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 rounded-2xl backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full mx-4 text-center">
                            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                                <MapPin className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-neutral-900 mb-2">Location Detected</h3>

                            <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-100 mb-4 text-left">
                                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Detailed Address</p>
                                <p className="text-sm font-medium text-neutral-800 line-clamp-3">
                                    {detectedAddress || "Fetching address details..."}
                                </p>
                            </div>

                            <p className="text-sm text-neutral-600 mb-6">
                                Is this correct? If not, you can set the correct location by dragging the pin on the map.
                            </p>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={confirmLocation}
                                    className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                                >
                                    Yes, Correct
                                </button>
                                <button
                                    onClick={() => {
                                        setShowLocationDialog(false);
                                        setShowMapPicker(true);
                                    }}
                                    className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                                >
                                    Edit on Map
                                </button>
                                <button
                                    onClick={rejectLocation}
                                    className="w-full py-3 bg-white border border-neutral-200 text-neutral-700 rounded-lg font-medium hover:bg-neutral-50 transition-colors"
                                >
                                    No, Enter Manually
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex-1">
                    {/* STEP 1: ESSENTIALS */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <h2 className="text-xl font-semibold mb-6">Property Details</h2>

                            {/* Category Selection */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-3">Select Category / कैटेगरी चुनें</label>
                                {mode === 'rent' ? (
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { id: 'PG', label: 'PG' },
                                            { id: 'Hostel', label: 'Hostel' },
                                            { id: 'Apartment', label: 'Room / Flat' }
                                        ].map(cat => (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, type: cat.id }))}
                                                className={`py-3 px-2 rounded-xl border-2 transition-all font-bold text-sm ${formData.type === cat.id
                                                    ? 'bg-neutral-900 text-white border-neutral-900 shadow-md'
                                                    : 'bg-white text-neutral-500 border-neutral-100 hover:border-neutral-300'
                                                    }`}
                                            >
                                                {cat.label}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-3">
                                        {[
                                            { id: 'House', label: 'House / मकान' },
                                            { id: 'Villa', label: 'Villa / विला' },
                                            { id: 'Flat', label: 'Flat / फ्लैट' },
                                            { id: 'Plot', label: 'Plot / जमीन' },
                                            { id: 'Shop', label: 'Shop / दुकान' }
                                        ].map(cat => (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, type: cat.id }))}
                                                className={`flex-1 min-w-[100px] py-3 px-2 rounded-xl border-2 transition-all font-bold text-sm ${formData.type === cat.id
                                                    ? 'bg-[#e8202a] text-white border-[#e8202a] shadow-md'
                                                    : 'bg-white text-neutral-500 border-neutral-100 hover:border-neutral-300'
                                                    }`}
                                            >
                                                {cat.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Property Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Luxury PG in HSR Layout"
                                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                                />
                            </div>

                            {/* Location Section */}
                            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 mb-6">
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Address / Area</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Near Forum Mall, Koramangala 6th Block"
                                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none bg-white mb-3"
                                />

                                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button
                                            onClick={handleDetectLocation}
                                            disabled={isDetectingLocation}
                                            type="button"
                                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                                        >
                                            {isDetectingLocation ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    Detecting...
                                                </>
                                            ) : (
                                                <>
                                                    <Navigation className="w-4 h-4" />
                                                    Current Location
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => setShowMapPicker(true)}
                                            type="button"
                                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-neutral-300 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-all shadow-sm"
                                        >
                                            <MapPin className="w-4 h-4" />
                                            Pick on Map
                                        </button>
                                    </div>

                                    {detectedCoords && !useManualLink && (
                                        <div className="flex items-center gap-2 text-green-600 text-xs font-bold bg-green-50 px-3 py-1 rounded-full">
                                            <CheckCircle2 className="w-3 h-3" />
                                            Location Pinned
                                        </div>
                                    )}
                                </div>

                                {/* Map Picker Modal */}
                                {showMapPicker && (
                                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                                        <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden relative">
                                            <div className="p-4 border-b bg-neutral-50 flex justify-between items-center">
                                                <h3 className="font-bold text-lg">Pick Precise Location / सटीक लोकेशन चुनें</h3>
                                                <button onClick={() => setShowMapPicker(false)} className="text-neutral-500 hover:text-black text-2xl">&times;</button>
                                            </div>
                                            <div className="p-0">
                                                <LocationPicker
                                                    initialLat={detectedCoords?.lat || 24.07} // Default Mandsaur
                                                    initialLng={detectedCoords?.lng || 75.07}
                                                    initialQuery={formData.city ? `${formData.city}, ${formData.pincode ? formData.pincode + ',' : ''} ${formData.state || ''}` : undefined}
                                                    selectedCity={formData.city}
                                                    selectedState={formData.state} // Added for cascading search
                                                    onLocationSelect={(data) => {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            latitude: data.lat,
                                                            longitude: data.lng,
                                                            address: data.address || prev.address,
                                                            city: data.city || prev.city,
                                                            state: data.state || prev.state,
                                                            locality: data.locality || prev.locality,
                                                            pincode: data.pincode || prev.pincode
                                                        }));
                                                        setDetectedCoords({ lat: data.lat, lng: data.lng });
                                                        setIsMapVerified(true); // Mark as verified
                                                        setUseManualLink(false);
                                                        // LocationPicker calls onClose internally for Confirm, we handle state updates here
                                                    }}
                                                    onClose={() => setShowMapPicker(false)}
                                                />
                                            </div>
                                            <div className="p-3 bg-blue-50 border-t text-center">
                                                <p className="text-xs text-blue-800 font-medium leading-relaxed">
                                                    We have set the map according to the city you selected. Now please place the pin on your exact building. <br />
                                                    Map has been centered based on your city. Now please drag the pin to your exact building.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Manual Link Option */}
                                {useManualLink && (
                                    <div className="animate-in slide-in-from-top-2 duration-300">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
                                            Paste Google Maps Link
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={formData.googleMapsLink}
                                                onChange={handleMapLinkChange}
                                                placeholder="https://maps.google.com/..."
                                                className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-black outline-none"
                                            />
                                        </div>
                                        <p className="text-[10px] text-neutral-400 mt-1 flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3" />
                                            Pin your property on Google Maps, click Share & copy the link.
                                        </p>
                                    </div>
                                )}

                                {/* Map Verification & Display */}
                                {(detectedCoords || (formData.address && (formData.city || formData.location))) && getMapSrc() !== '' && (
                                    <div className="mt-4 animate-in fade-in duration-500">
                                        {/* Verification Question */}
                                        {isMapVerified === null && (
                                            <div className="mb-3 p-3 bg-blue-50 border border-blue-100 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                                <div className="text-sm text-blue-800 font-medium">
                                                    Is the location shown on the map correct?
                                                </div>
                                                <div className="flex gap-2 shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsMapVerified(true)}
                                                        className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 transition-colors"
                                                    >
                                                        Yes, it's correct
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsMapVerified(false)}
                                                        className="px-3 py-1 bg-white border border-blue-200 text-blue-600 text-xs font-bold rounded hover:bg-blue-50 transition-colors"
                                                    >
                                                        No, hide map
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Map View (Only if not explicitly rejected) */}
                                        {isMapVerified !== false && (
                                            <div className="h-32 w-full bg-neutral-200 rounded-lg overflow-hidden border border-neutral-300 relative">
                                                <iframe
                                                    width="100%"
                                                    height="100%"
                                                    src={getMapSrc()}
                                                    style={{ border: 0 }}
                                                    loading="lazy"
                                                    className="opacity-75 hover:opacity-100 transition-opacity"
                                                />
                                                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold shadow-sm pointer-events-none">
                                                    Preview
                                                </div>
                                            </div>
                                        )}

                                        {/* Manual Entry Fallback Message */}
                                        {isMapVerified === false && (
                                            <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-500 italic text-center">
                                                Map hidden. Please ensure Address, City, and State fields are accurate.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">State</label>
                                    <select
                                        name="state"
                                        value={formData.state}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                                    >
                                        <option value="">Select State</option>
                                        {INDIAN_STATES.map(state => (
                                            <option key={state} value={state}>{state}</option>
                                        ))}
                                    </select>
                                </div>
                                {/* City & Suggestions */}
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">City</label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        list="city-suggestions"
                                        placeholder="Enter city or select from list"
                                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                                    />
                                    <datalist id="city-suggestions">
                                        {POPULAR_LOCATIONS.map((loc) => (
                                            <option key={loc} value={loc} />
                                        ))}
                                    </datalist>
                                </div>

                                {/* Pincode - Mandatory for Map Precision */}
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Pincode *</label>
                                    <input
                                        type="text"
                                        name="pincode"
                                        value={formData.pincode}
                                        onChange={handleInputChange}
                                        maxLength={6}
                                        placeholder="e.g. 458001"
                                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                                    />
                                    <p className="text-[10px] text-neutral-400 mt-1">Required for map location</p>
                                </div>

                                {/* Built-up Area (Hide for Sell mode, asked in Step 2) */}
                                {mode === 'rent' && (
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1">Built-up Area (sq.ft)</label>
                                        <input
                                            type="number"
                                            name="builtUpArea"
                                            value={formData.builtUpArea}
                                            onChange={handleInputChange}
                                            placeholder="e.g. 1200"
                                            className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Floor Info */}
                            {formData.type !== 'Plot' && formData.type !== 'House' && formData.type !== 'Villa' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1">Floor No.</label>
                                        <input
                                            type="number"
                                            name="floorNumber"
                                            value={formData.floorNumber}
                                            onChange={handleInputChange}
                                            placeholder="e.g. 2"
                                            className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1">Total Floors</label>
                                        <input
                                            type="number"
                                            name="totalFloors"
                                            value={formData.totalFloors}
                                            onChange={handleInputChange}
                                            placeholder="e.g. 5"
                                            className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                                        />
                                    </div>
                                </div>
                            )}



                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={4}
                                    placeholder="Describe the property, nearby landmarks, and rules..."
                                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none resize-none"
                                />
                                {generatedSeoTags.length > 0 && (
                                    <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200 animate-in fade-in duration-300">
                                        <p className="text-[10px] font-bold text-green-800 uppercase mb-2 flex items-center gap-1">
                                            <Zap className="w-3 h-3 text-green-600" /> Auto-Generated SEO Keywords
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {generatedSeoTags.map((tag, idx) => (
                                                <span key={idx} className="bg-white px-2 py-1 text-xs text-green-700 font-medium border border-green-200 rounded-md shadow-sm select-none">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                        <p className="text-[10px] text-green-600 mt-2 font-medium">
                                            ये कीवर्ड्स आपकी प्रॉपर्टी के साथ अपने आप जुड़ जाएंगे ताकि Google Search में आपकी लिस्टिंग सबसे ऊपर आ सके।
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* STEP 2: FEATURES */}
                    {step === 2 && (
                        mode === 'sell' ? (
                            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                                <h2 className="text-xl font-semibold mb-6">Property Specifics</h2>
                                {formData.type === 'Plot' ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Total Plot Area (sq.ft / Gaj) *</label>
                                            <input type="text" name="total_area" value={formData.total_area} onChange={handleInputChange} placeholder="e.g. 1000 sq.ft or 120 Gaj" className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Dimensions L×W *</label>
                                            <input type="text" name="dimensions" value={formData.dimensions} onChange={handleInputChange} placeholder="e.g. 25x40 or 30x60" className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Facing (Vastu)</label>
                                            <select name="facing" value={formData.facing} onChange={handleInputChange} className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none">
                                                <option value="">Select Facing</option>
                                                <option value="East">East (पूर्व)</option>
                                                <option value="West">West (पश्चिम)</option>
                                                <option value="North">North (उत्तर)</option>
                                                <option value="South">South (दक्षिण)</option>
                                                <option value="North-East">North-East (ईशान)</option>
                                                <option value="North-West">North-West (वायव्य)</option>
                                                <option value="South-East">South-East (आग्नेय)</option>
                                                <option value="South-West">South-West (नैऋत्य)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Road Width</label>
                                            <input type="text" name="road_width" value={formData.road_width} onChange={handleInputChange} placeholder="e.g. 30 ft, 40 ft" className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Boundary Wall</label>
                                            <select name="shutter_width" value={formData.shutter_width} onChange={handleInputChange} className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none">
                                                <option value="">Select</option>
                                                <option value="Yes - Complete">Yes – Complete</option>
                                                <option value="Yes - Partial">Yes – Partial</option>
                                                <option value="No">No</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Development Status</label>
                                            <select name="main_road_distance" value={formData.main_road_distance} onChange={handleInputChange} className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none">
                                                <option value="">Select</option>
                                                <option value="Diverted">Diverted (डायवर्टेड)</option>
                                                <option value="RERA Approved">RERA Approved</option>
                                                <option value="NA / Residential">NA / Residential</option>
                                                <option value="Agricultural">Agricultural (खेती)</option>
                                                <option value="Unfinished Colony">Unfinished Colony</option>
                                            </select>
                                        </div>
                                    </div>
                                ) : formData.type === 'Shop' ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Total Area (sq.ft) *</label>
                                            <input type="text" name="total_area" value={formData.total_area} onChange={handleInputChange} placeholder="e.g. 500 sq.ft" className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Built-up Area (sq.ft)</label>
                                            <input type="text" name="builtUpArea" value={formData.builtUpArea} onChange={handleInputChange} placeholder="e.g. 450 sq.ft" className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Dimensions</label>
                                            <input type="text" name="dimensions" value={formData.dimensions} onChange={handleInputChange} placeholder="e.g. 10x50" className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Shutter Width (ft) *</label>
                                            <input type="text" name="shutter_width" value={formData.shutter_width} onChange={handleInputChange} placeholder="e.g. 10 ft" className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Distance from Main Road *</label>
                                            <input type="text" name="main_road_distance" value={formData.main_road_distance} onChange={handleInputChange} placeholder="e.g. On main road / 50m away" className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Property Age</label>
                                            <select name="property_age" value={formData.property_age} onChange={handleInputChange} className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none">
                                                <option value="">Select Age</option>
                                                <option value="New (0-1 years)">New (0-1 years)</option>
                                                <option value="1-5 years">1-5 years</option>
                                                <option value="5-10 years">5-10 years</option>
                                                <option value="10+ years">10+ years</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Suitable For</label>
                                            <select name="facing" value={formData.facing} onChange={handleInputChange} className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none">
                                                <option value="">Select Business Type</option>
                                                <option value="General Store">General Store / Kirana</option>
                                                <option value="Office">Office / Agency</option>
                                                <option value="Clinic">Clinic / Medical</option>
                                                <option value="Salon">Salon / Parlour</option>
                                                <option value="Restaurant">Restaurant / Dhaba</option>
                                                <option value="Showroom">Showroom</option>
                                                <option value="Any">Any Business</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Road Width</label>
                                            <input type="text" name="road_width" value={formData.road_width} onChange={handleInputChange} placeholder="e.g. 30 ft" className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none" />
                                        </div>
                                    </div>
                                ) : (
                                    // House / Villa / Flat — Conditional Fields via SELL_CATEGORY_CONFIG
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        {/* Total Area — mandatory for all */}
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Total / Plot Area *</label>
                                            <input type="text" name="total_area" value={formData.total_area} onChange={handleInputChange} placeholder="e.g. 1000 sq.ft" className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none" />
                                        </div>

                                        {/* Built-up Area — House, Villa, Flat, Shop */}
                                        {shouldShow(formData.type, 'builtUpArea') && (
                                            <div>
                                                <label className="block text-sm font-medium text-neutral-700 mb-1">Built-up Area (sq.ft)</label>
                                                <input type="text" name="builtUpArea" value={formData.builtUpArea} onChange={handleInputChange} placeholder="e.g. 800 sq.ft" className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none" />
                                            </div>
                                        )}

                                        {/* BHK — House, Villa, Flat only */}
                                        {shouldShow(formData.type, 'bhk') && (
                                            <div>
                                                <label className="block text-sm font-medium text-neutral-700 mb-1">BHK</label>
                                                <select name="bhk" value={formData.bhk} onChange={handleInputChange} className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none">
                                                    <option value="">Select BHK</option>
                                                    <option value="1 BHK">1 BHK</option>
                                                    <option value="2 BHK">2 BHK</option>
                                                    <option value="3 BHK">3 BHK</option>
                                                    <option value="4+ BHK">4+ BHK</option>
                                                </select>
                                            </div>
                                        )}

                                        {/* Bathrooms — House, Villa, Flat only */}
                                        {shouldShow(formData.type, 'bathroom') && (
                                            <div>
                                                <label className="block text-sm font-medium text-neutral-700 mb-1">Bathrooms</label>
                                                <select name="bathroomType" value={formData.bathroomType} onChange={handleInputChange} className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none">
                                                    <option value="">Select</option>
                                                    <option value="1">1 Bathroom</option>
                                                    <option value="2">2 Bathrooms</option>
                                                    <option value="3">3 Bathrooms</option>
                                                    <option value="4+">4+ Bathrooms</option>
                                                </select>
                                            </div>
                                        )}

                                        {/* Floor No. — House, Flat, Shop (not Villa, Plot) */}
                                        {shouldShow(formData.type, 'floor') && (
                                            <div>
                                                <label className="block text-sm font-medium text-neutral-700 mb-1">Floor No.</label>
                                                <input type="number" name="floorNumber" value={formData.floorNumber} onChange={handleInputChange} placeholder="e.g. 2" className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none" />
                                            </div>
                                        )}

                                        {/* Facing */}
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Facing</label>
                                            <select name="facing" value={formData.facing} onChange={handleInputChange} className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none">
                                                <option value="">Select Facing</option>
                                                <option value="East">East</option>
                                                <option value="West">West</option>
                                                <option value="North">North</option>
                                                <option value="South">South</option>
                                                <option value="North-East">North-East</option>
                                                <option value="North-West">North-West</option>
                                                <option value="South-East">South-East</option>
                                                <option value="South-West">South-West</option>
                                            </select>
                                        </div>

                                        {/* Property Age */}
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Property Age</label>
                                            <select name="property_age" value={formData.property_age} onChange={handleInputChange} className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none">
                                                <option value="">Select Age</option>
                                                <option value="New (0-1 years)">New (0-1 years)</option>
                                                <option value="1-5 years">1-5 years</option>
                                                <option value="5-10 years">5-10 years</option>
                                                <option value="10+ years">10+ years</option>
                                            </select>
                                        </div>

                                        {/* Furnishing Status — House, Villa, Flat only (full-width) */}
                                        {shouldShow(formData.type, 'furnishing') && (
                                            <div className="col-span-1 sm:col-span-2">
                                                <label className="block text-sm font-medium text-neutral-700 mb-3">Furnishing Status</label>
                                                <div className="flex flex-wrap gap-3">
                                                    {['Fully Furnished', 'Semi-Furnished', 'Unfurnished'].map(status => (
                                                        <button
                                                            key={status}
                                                            type="button"
                                                            onClick={() => setFormData(prev => ({ ...prev, furnishingStatus: status }))}
                                                            className={`px-4 py-2 rounded-full border transition-all ${formData.furnishingStatus === status
                                                                ? 'bg-black text-white border-black'
                                                                : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'
                                                            }`}
                                                        >
                                                            {status}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                            <h2 className="text-xl font-semibold mb-6">Features & Amenities</h2>

                            {/* Tenant Preference */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-3">Preferred Tenants</label>
                                <div className="flex flex-wrap gap-3">
                                    {['Girls Only', 'Boys Only', 'Family', 'Students', 'Any'].map(pref => (
                                        <button
                                            key={pref}
                                            onClick={() => setFormData(prev => ({ ...prev, tenantPreference: pref }))}
                                            className={`px-4 py-2 rounded-full border transition-all ${formData.tenantPreference === pref
                                                ? 'bg-black text-white border-black'
                                                : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'
                                                }`}
                                        >
                                            {pref}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Furnishing Status */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-3">Furnishing Status</label>
                                <div className="flex flex-wrap gap-3">
                                    {['Fully Furnished', 'Semi-Furnished', 'Unfurnished'].map(status => (
                                        <button
                                            key={status}
                                            onClick={() => setFormData(prev => ({ ...prev, furnishingStatus: status }))}
                                            className={`px-4 py-2 rounded-full border transition-all ${formData.furnishingStatus === status
                                                ? 'bg-black text-white border-black'
                                                : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'
                                                }`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Bathroom & Electricity */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Bathroom Type</label>
                                    <select
                                        name="bathroomType"
                                        value={formData.bathroomType}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                                    >
                                        <option value="Attached">Attached</option>
                                        <option value="Common">Common</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Electricity Bill</label>
                                    <div className="flex gap-4 mt-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="electricityStatus"
                                                value="Included"
                                                checked={formData.electricityStatus === 'Included'}
                                                onChange={handleInputChange}
                                                className="accent-black"
                                            />
                                            <span>Included</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="electricityStatus"
                                                value="Separate"
                                                checked={formData.electricityStatus === 'Separate'}
                                                onChange={handleInputChange}
                                                className="accent-black"
                                            />
                                            <span>Separate</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Amenities */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-3">Amenities</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {AMENITIES_LIST.map(({ id, label, icon: Icon }) => (
                                        <button
                                            key={id}
                                            onClick={() => toggleAmenity(id)}
                                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-sm ${formData.amenities.includes(id)
                                                ? 'bg-neutral-900 text-white border-neutral-900 ring-2 ring-neutral-900 ring-offset-2'
                                                : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
                                                }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            {label}
                                        </button>
                                    ))}
                                    {/* Render Custom Amenities */}
                                    {formData.amenities.filter(a => !AMENITIES_LIST.some( predefined => predefined.id === a)).map((customAmenity) => (
                                        <button
                                            key={customAmenity}
                                            type="button"
                                            onClick={() => toggleAmenity(customAmenity)}
                                            className="flex items-center gap-3 p-3 rounded-xl border transition-all text-sm bg-neutral-900 text-white border-neutral-900 ring-2 ring-neutral-900 ring-offset-2"
                                            title="Click to remove"
                                        >
                                            <span className="w-4 h-4 flex items-center justify-center font-bold">✓</span>
                                            {customAmenity}
                                        </button>
                                    ))}
                                </div>

                                {/* Custom Amenity Input */}
                                <div className="mt-4 flex flex-col sm:flex-row gap-2 w-full sm:w-2/3">
                                    <input
                                        type="text"
                                        value={customAmenityInput}
                                        onChange={(e) => setCustomAmenityInput(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomAmenity(); } }}
                                        placeholder="Add custom amenity (e.g. GYM)"
                                        className="flex-1 px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                                        maxLength={30}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddCustomAmenity}
                                        className="px-6 py-3 bg-neutral-100 border border-neutral-300 text-neutral-700 font-medium rounded-lg hover:bg-neutral-200 transition-colors whitespace-nowrap"
                                    >
                                        + Add
                                    </button>
                                </div>
                                <p className="text-[10px] text-neutral-400 mt-2">Maximum 10 amenities allowed. Click an active amenity to remove it.</p>
                            </div>
                        </div>
                        )
                    )}

                    {/* STEP 3: FINANCIALS & MEDIA */}
                    {step === 3 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <h2 className="text-xl font-semibold mb-6">Legal, Pricing & Photos</h2>
                            {mode === 'sell' ? (
                                <>
                                    {/* Legal Status */}
                                    <div className="bg-neutral-50 p-5 rounded-xl border border-neutral-200">
                                        <h3 className="text-sm font-bold text-neutral-800 mb-4">Legal Status / कानूनी जानकारी</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-neutral-100 transition-colors">
                                                <input type="checkbox" name="registry" checked={formData.registry} onChange={(e) => setFormData(prev => ({ ...prev, registry: e.target.checked }))} className="w-5 h-5 accent-black rounded" />
                                                <div>
                                                    <span className="text-sm font-semibold block">Registry (रजिस्ट्री)</span>
                                                    <span className="text-xs text-neutral-500">Property registered in owner's name</span>
                                                </div>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-neutral-100 transition-colors">
                                                <input type="checkbox" name="diversion" checked={formData.diversion} onChange={(e) => setFormData(prev => ({ ...prev, diversion: e.target.checked }))} className="w-5 h-5 accent-black rounded" />
                                                <div>
                                                    <span className="text-sm font-semibold block">Diversion (डायवर्सन)</span>
                                                    <span className="text-xs text-neutral-500">Land converted for residential use</span>
                                                </div>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-neutral-100 transition-colors">
                                                <input type="checkbox" name="mutation" checked={formData.mutation} onChange={(e) => setFormData(prev => ({ ...prev, mutation: e.target.checked }))} className="w-5 h-5 accent-black rounded" />
                                                <div>
                                                    <span className="text-sm font-semibold block">Mutation / नामांतरण</span>
                                                    <span className="text-xs text-neutral-500">Revenue records updated in owner's name</span>
                                                </div>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-neutral-100 transition-colors">
                                                <input type="checkbox" name="negotiable" checked={formData.negotiable} onChange={(e) => setFormData(prev => ({ ...prev, negotiable: e.target.checked }))} className="w-5 h-5 accent-black rounded" />
                                                <div>
                                                    <span className="text-sm font-semibold block">Loan Available (लोन सुविधा)</span>
                                                    <span className="text-xs text-neutral-500">Bank loan possible on this property</span>
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Pricing */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Asking Price (₹) *</label>
                                            <input
                                                type="number"
                                                name="price"
                                                value={formData.price}
                                                onChange={handleInputChange}
                                                placeholder="e.g. 5000000"
                                                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Original Price (₹) (Optional)</label>
                                            <input
                                                type="number"
                                                name="original_price"
                                                value={formData.original_price}
                                                onChange={handleInputChange}
                                                placeholder="e.g. 6000000"
                                                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                                            />
                                        </div>
                                        <div className="pb-3 sm:col-span-2">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    name="negotiable"
                                                    checked={formData.negotiable}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, negotiable: e.target.checked }))}
                                                    className="w-5 h-5 accent-black rounded"
                                                />
                                                <span className="text-sm font-medium text-neutral-700">Price Negotiable / मोल-भाव हो सकता है</span>
                                            </label>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1">Contact Number</label>
                                        <input
                                            type="tel"
                                            name="contactNumber"
                                            value={formData.contactNumber}
                                            onChange={handleInputChange}
                                            placeholder="+91 98765 43210"
                                            className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Monthly Rent (₹)</label>
                                            <input
                                                type="number"
                                                name="price"
                                                value={formData.price}
                                                onChange={handleInputChange}
                                                placeholder="e.g. 12000"
                                                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Security Deposit (₹)</label>
                                            <input
                                                type="number"
                                                name="securityDeposit"
                                                value={formData.securityDeposit}
                                                onChange={handleInputChange}
                                                placeholder="e.g. 50000 (Optional)"
                                                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1">Contact Number</label>
                                        <input
                                            type="tel"
                                            name="contactNumber"
                                            value={formData.contactNumber}
                                            onChange={handleInputChange}
                                            placeholder="+91 98765 43210"
                                            className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                                        />
                                    </div>
                                </>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">Property Images (Min 3 required) *</label>
                                <MultiImageUpload
                                    images={formData.images}
                                    onImagesChange={(images) => {
                                        if (images.length > 6) {
                                            toast.error("You can only upload a maximum of 6 photos.");
                                            setFormData(prev => ({ ...prev, images: images.slice(0, 6) }));
                                        } else {
                                            setFormData(prev => ({ ...prev, images }));
                                        }
                                    }}
                                    maxImages={6}
                                />
                                <p className="text-xs text-neutral-500 mt-2 flex items-center gap-1">
                                    <span role="img" aria-label="info">ℹ️</span>
                                    Minimum 3 photos required for a good listing (Front view, Inside view, Street view).
                                </p>
                                {formData.images.length === 0 && (
                                    <p className="text-red-500 text-xs mt-2 font-medium">
                                        * Photo upload is mandatory. Please upload at least one image.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-between items-center mt-12 pt-6 border-t border-neutral-100">
                    <button
                        onClick={prevStep}
                        disabled={step === 1}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${step === 1 ? 'text-neutral-300 cursor-not-allowed' : 'text-neutral-600 hover:text-black hover:bg-neutral-50'
                            }`}
                    >
                        <ChevronLeft className="w-4 h-4" /> Back
                    </button>

                    {step < 3 ? (
                        <button
                            onClick={nextStep}
                            className="flex items-center gap-2 px-8 py-3 bg-black text-white rounded-xl hover:bg-neutral-800 transition-all font-medium"
                        >
                            Next Step <ChevronRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading || formData.images.length === 0}
                            title={formData.images.length === 0 ? "Please upload at least one photo" : ""}
                            className={`flex items-center gap-2 px-8 py-3 rounded-xl transition-all font-medium
                                ${isLoading || formData.images.length === 0
                                    ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                                    : 'bg-black text-white hover:bg-neutral-800 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
                                }`}
                        >
                            {isLoading ? 'Submitting...' : (isEditMode ? 'Update Property' : 'Post Property')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}


export default function PostPropertyPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div></div>}>
            <PostPropertyContent />
        </Suspense>
    );
}
