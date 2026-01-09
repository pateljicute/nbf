'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    CheckCircle2, ArrowRight, ShieldCheck, ChevronLeft, ChevronRight,
    Wifi, Car, Shield, Waves, Zap, Utensils, Shirt, PersonStanding, MapPin, Navigation, ExternalLink, AlertTriangle
} from 'lucide-react';

import { useAuth } from '@/lib/auth-context';
import { getProducts, updateProduct, createProduct } from '@/lib/api';
import { toast } from 'sonner';
import { MultiImageUpload } from '@/components/ui/multi-image-upload';

// Amenities with icons
const AMENITIES_LIST = [
    { id: 'wifi', label: 'WiFi', icon: Wifi },
    { id: 'ac', label: 'AC', icon: Waves },
    { id: 'parking', label: 'Parking', icon: Car },
    { id: 'water', label: '24/7 Water', icon: Waves },
    { id: 'power', label: 'Power Backup', icon: Zap },
    { id: 'cctv', label: 'CCTV / Security', icon: Shield },
    { id: 'laundry', label: 'Laundry', icon: Shirt },
    { id: 'kitchen', label: 'Kitchen', icon: Utensils },
    { id: 'lift', label: 'Lift', icon: PersonStanding },
];

export default function PostPropertyPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get('edit');
    const { user, session } = useAuth();

    // Form States
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Location States
    const [isDetectingLocation, setIsDetectingLocation] = useState(false);
    const [showLocationDialog, setShowLocationDialog] = useState(false);
    const [useManualLink, setUseManualLink] = useState(false);
    const [detectedCoords, setDetectedCoords] = useState<{ lat: number; lng: number } | null>(null);

    // Data States
    const [cities, setCities] = useState<string[]>([]);
    const [citySearch, setCitySearch] = useState('');
    const [showCityDropdown, setShowCityDropdown] = useState(false);

    const [formData, setFormData] = useState({
        // Step 1: Essentials
        title: '',
        description: '',
        type: 'PG',
        address: '',
        location: '',

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
                    address: property.tags?.[2] || '',
                    location: location,

                    latitude: property.latitude || null,
                    longitude: property.longitude || null,
                    googleMapsLink: property.googleMapsLink || '',

                    amenities: property.amenities || [],
                    bathroomType: property.bathroomType || property.bathroom_type || 'Common',
                    tenantPreference: property.tenant_preference || 'Any',
                    electricityStatus: property.electricity_status || 'Separate',

                    price: property.price || property.priceRange?.minVariantPrice?.amount || '',
                    securityDeposit: property.security_deposit || '',
                    contactNumber: property.contactNumber || '',
                    images: existingImages
                });
                setCitySearch(location);

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
        setFormData(prev => ({ ...prev, location: city }));
        setCitySearch(city);
        setShowCityDropdown(false);
    };

    // Location Logic
    const handleDetectLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }

        setIsDetectingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setDetectedCoords({ lat: latitude, lng: longitude });
                setIsDetectingLocation(false);
                setShowLocationDialog(true);
            },
            (error) => {
                console.warn("Geolocation warning:", error.message, error.code);
                setIsDetectingLocation(false);
                let errorMessage = "Could not detect location.";

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        if (error.message.toLowerCase().includes("policy")) {
                            errorMessage = "Location blocked by browser policy.";
                        } else {
                            errorMessage = "Location permission denied.";
                        }
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "Location information is unavailable.";
                        break;
                    case error.TIMEOUT:
                        errorMessage = "Location detection timed out.";
                        break;
                    default:
                        errorMessage = "An unknown error occurred.";
                }

                toast.error(`${errorMessage} using manual entry instead.`);
                // Fallback to manual
                setUseManualLink(true);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    const confirmLocation = async () => {
        if (detectedCoords) {
            // Update Coordinates
            setFormData(prev => ({
                ...prev,
                latitude: detectedCoords.lat,
                longitude: detectedCoords.lng,
                googleMapsLink: ''
            }));

            // Reverse Geocoding
            try {
                toast.loading("Fetching address details...");
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${detectedCoords.lat}&lon=${detectedCoords.lng}`);
                const data = await response.json();

                if (data && data.display_name) {
                    setFormData(prev => ({
                        ...prev,
                        address: data.display_name,
                        // Try to extract city if possible, or just keep what user selected
                        // location: data.address.city || prev.location 
                    }));
                    toast.dismiss();
                    toast.success("Location confirmed & address updated!");
                } else {
                    toast.dismiss();
                    toast.success("Location confirmed!");
                }
            } catch (error) {
                console.error("Reverse geocoding error:", error);
                toast.dismiss();
                toast.success("Location confirmed!");
            }

            setUseManualLink(false);
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
            if (!formData.title || !formData.description || !formData.address || !formData.location) {
                toast.error("Please fill in basic details");
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

        if (!formData.bathroomType) {
            toast.error("Please select a bathroom type");
            return;
        }

        setIsLoading(true);

        try {
            const payload = {
                ...formData,
                userId: user?.id
            };

            if (isEditMode && editId) {
                await updateProduct(editId, payload, session?.access_token);
                toast.success('Property updated successfully');
                router.push('/profile');
            } else {
                await createProduct(payload, session?.access_token);
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

    const filteredCities = cities.filter(city =>
        city.toLowerCase().includes(citySearch.toLowerCase())
    ).slice(0, 50);

    // Mini Map Source
    const getMapSrc = () => {
        if (detectedCoords) {
            return `https://maps.google.com/maps?q=${detectedCoords.lat},${detectedCoords.lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
        }
        if (formData.location && formData.address) {
            const query = encodeURIComponent(`${formData.address}, ${formData.location}`);
            return `https://maps.google.com/maps?q=${query}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
        }
        return '';
    };

    // Success View
    if (isSuccess) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-12">
                <div className="bg-white p-12 rounded-2xl border border-neutral-100 shadow-xl text-center">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 animate-in zoom-in duration-300">
                        <ShieldCheck className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-serif font-medium text-neutral-900 mb-4">Submission Received</h2>
                    <p className="text-neutral-600 text-lg mb-8">Your property has been successfully submitted, it will go live after admin approval.</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <button onClick={() => router.push('/')} className="px-8 py-3 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-all font-medium text-neutral-600">
                            Return Home
                        </button>
                        <button onClick={() => router.push('/profile')} className="px-8 py-3 bg-black text-white rounded-xl hover:bg-neutral-800 transition-all font-medium flex items-center gap-2">
                            View My Profile <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
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
                            <h3 className="text-lg font-bold text-neutral-900 mb-2">Confirm Location</h3>
                            <p className="text-sm text-neutral-600 mb-6">
                                Are you currently present at the exact property location?
                            </p>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={confirmLocation}
                                    className="w-full py-3 bg-neutral-900 text-white rounded-lg font-medium hover:bg-black transition-colors"
                                >
                                    Yes, I am at the property
                                </button>
                                <button
                                    onClick={rejectLocation}
                                    className="w-full py-3 bg-white border border-neutral-200 text-neutral-700 rounded-lg font-medium hover:bg-neutral-50 transition-colors"
                                >
                                    No, I am somewhere else
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
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Property Type</label>
                                    <select
                                        name="type"
                                        value={formData.type}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                                    >
                                        <option value="PG">PG / Hostel</option>
                                        <option value="Flat">Flat / Apartment</option>
                                        <option value="Room">Private Room</option>
                                    </select>
                                </div>
                                <div className="relative">
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">City</label>
                                    <input
                                        type="text"
                                        value={citySearch}
                                        onChange={(e) => {
                                            setCitySearch(e.target.value);
                                            setShowCityDropdown(true);
                                        }}
                                        placeholder="Search city..."
                                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                                    />
                                    {showCityDropdown && filteredCities.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border shadow-lg max-h-48 overflow-y-auto rounded-lg">
                                            {filteredCities.map(city => (
                                                <button
                                                    key={city}
                                                    onClick={() => handleCitySelect(city)}
                                                    className="w-full text-left px-4 py-2 hover:bg-neutral-50 text-sm"
                                                >
                                                    {city}
                                                </button>
                                            ))}
                                        </div>
                                    )}
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
                                    placeholder="e.g., Near Forum Mall, Koramangala"
                                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none bg-white mb-3"
                                />

                                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
                                    <button
                                        onClick={handleDetectLocation}
                                        disabled={isDetectingLocation}
                                        type="button"
                                        className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isDetectingLocation ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Detecting...
                                            </>
                                        ) : (
                                            <>
                                                <MapPin className="w-4 h-4" />
                                                Detect My Current Location
                                            </>
                                        )}
                                    </button>
                                    {detectedCoords && !useManualLink && (
                                        <div className="flex items-center gap-2 text-green-600 text-xs font-bold bg-green-50 px-3 py-1 rounded-full">
                                            <CheckCircle2 className="w-3 h-3" />
                                            Location Pinned
                                        </div>
                                    )}
                                </div>

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

                                {/* Mini Map Widget */}
                                {(detectedCoords || (formData.address && formData.location)) && getMapSrc() !== '' && (
                                    <div className="mt-4 h-32 w-full bg-neutral-200 rounded-lg overflow-hidden border border-neutral-300 relative">
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
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">Property Images</label>
                                <MultiImageUpload
                                    images={formData.images}
                                    onImagesChange={(images) => setFormData(prev => ({ ...prev, images }))}
                                    maxImages={8}
                                />
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
                            disabled={isLoading}
                            className="flex items-center gap-2 px-8 py-3 bg-black text-white rounded-xl hover:bg-neutral-800 transition-all font-medium disabled:opacity-50"
                        >
                            {isLoading ? 'Submitting...' : (isEditMode ? 'Update Property' : 'Post Property')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
