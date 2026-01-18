'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    CheckCircle2, ArrowRight, ShieldCheck, ChevronLeft, ChevronRight,
    Wifi, Car, Shield, Waves, Zap, Utensils, Shirt, PersonStanding, MapPin, Navigation, ExternalLink, AlertTriangle,
    Droplets, Bath, Armchair, Monitor, BookOpen, Warehouse, Trees
} from 'lucide-react';

import { useAuth } from '@/lib/auth-context';
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

export default function PostPropertyPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get('edit');
    const { user, session, isLoading: authLoading } = useAuth();

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

    const LocationPicker = useMemo(() => dynamic(() => import('@/components/ui/location-picker'), {
        ssr: false,
        loading: () => <div className="h-[400px] w-full bg-neutral-100 animate-pulse rounded-xl flex items-center justify-center">Loading Map...</div>
    }), []);

    const [formData, setFormData] = useState({
        // Step 1: Essentials
        title: '',
        description: '',
        type: 'PG',
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
        try {
            const properties = await getProducts();
            const property: any = properties.find(p => p.id === id);
            if (property) {
                const location = property.tags?.[1] || '';
                const existingImages = property.images?.map((img: any) => img.url) || [];

                setFormData({
                    title: property.title,
                    description: property.description,
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
                    securityDeposit: property.security_deposit || property.securityDeposit || '',
                    contactNumber: property.contactNumber || '',
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

        if (!user) {
            toast.error("You must be logged in to post a property");
            return;
        }

        if (!formData.bathroomType) {
            toast.error("Please select a bathroom type");
            return;
        }

        if (formData.images.length === 0) {
            toast.error("Photo upload is mandatory. Please add at least one photo.");
            return;
        }

        setIsLoading(true);

        try {
            const payload = {
                ...formData,
                userId: user?.id
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
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (error: any) {
            console.error('Error saving property:', error);
            toast.error(error.message || 'An error occurred');
        } finally {
            setIsLoading(false);
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

        const message = `Check out this property on NBF Homes! 🏡\n\nProperty: ${title}\nRent: ₹${price}/month\nLocation: ${location}\n\nView all details and photos here: ${url}`;
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
                            <h2 className="text-xl font-semibold mb-6">Basic Details</h2>

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

                                {/* Built-up Area */}
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
                            </div>

                            {/* Floor Info */}
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

                            {/* Location Section */}
                            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200">
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
                                                            locality: data.locality || prev.locality
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
                            </div>
                        </div>
                    )}

                    {/* STEP 2: FEATURES */}
                    {step === 2 && (
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
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: FINANCIALS & MEDIA */}
                    {step === 3 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <h2 className="text-xl font-semibold mb-6">Financials & Photos</h2>

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
                                // Make field read-only if desired, or let users edit their pre-filled number
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">Property Images</label>
                                <MultiImageUpload
                                    images={formData.images}
                                    onImagesChange={(images) => {
                                        if (images.length > 5) {
                                            toast.error("You can only upload a maximum of 5 photos.");
                                            setFormData(prev => ({ ...prev, images: images.slice(0, 5) }));
                                        } else {
                                            setFormData(prev => ({ ...prev, images }));
                                        }
                                    }}
                                    maxImages={5}
                                />
                                <p className="text-xs text-neutral-500 mt-2 flex items-center gap-1">
                                    <span role="img" aria-label="info">ℹ️</span>
                                    For a better experience, please upload clear photos of your property.
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
