'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';

import { useAuth } from '@/lib/auth-context';
import { getProducts, updateProduct, createProduct } from '@/lib/api';
import { toast } from 'sonner';
import { MultiImageUpload } from '@/components/ui/multi-image-upload';

export default function PostPropertyPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get('edit');
    const { user, session } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [cities, setCities] = useState<string[]>([]);
    const [citySearch, setCitySearch] = useState('');
    const [showCityDropdown, setShowCityDropdown] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        address: '',
        location: '',
        type: 'PG', // PG, Flat, Room
        images: [] as string[],
        contactNumber: ''
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
            // Fallback cities
            setCities(['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad']);
        }
    };

    const loadProperty = async (id: string) => {
        try {
            const properties = await getProducts();
            const property = properties.find(p => p.id === id);
            if (property) {
                const location = property.tags?.[1] || '';
                const existingImages = property.images?.map(img => img.url) || [];
                if (existingImages.length === 0 && property.featuredImage?.url) {
                    existingImages.push(property.featuredImage.url);
                }
                setFormData({
                    title: property.title,
                    description: property.description,
                    price: property.priceRange.minVariantPrice.amount,
                    address: property.tags?.[2] || '',
                    location: location,
                    type: property.tags?.[0] || 'PG',
                    images: existingImages,
                    contactNumber: property.contactNumber || ''
                });
                setCitySearch(location);
            }
        } catch (error) {
            console.error('Error loading property:', error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCitySelect = (city: string) => {
        setFormData(prev => ({ ...prev, location: city }));
        setCitySearch(city);
        setShowCityDropdown(false);
    };

    const filteredCities = cities.filter(city =>
        city.toLowerCase().includes(citySearch.toLowerCase())
    ).slice(0, 50);

    // ... inside component ...

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (isEditMode && editId) {
                // Update existing property
                await updateProduct(editId, formData, session?.access_token);
                toast.success('Property updated successfully');
                router.push('/profile');
            } else {
                // Create new property
                await createProduct({
                    ...formData,
                    userId: user?.id
                }, session?.access_token);

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

    const handleReturnHome = () => router.push('/');
    const handleViewProfile = () => router.push('/profile');

    if (isSuccess) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-12">
                <div className="bg-white p-12 rounded-2xl border border-neutral-100 shadow-xl text-center">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 animate-in zoom-in duration-300">
                        <ShieldCheck className="w-10 h-10 text-green-600" />
                    </div>

                    <h2 className="text-3xl font-serif font-medium text-neutral-900 mb-4">
                        Submission Received
                    </h2>

                    <div className="space-y-4 max-w-md mx-auto mb-10">
                        <p className="text-neutral-600 text-lg">
                            Your property has been successfully submitted for review.
                        </p>
                        <p className="text-neutral-500 text-sm leading-relaxed bg-neutral-50 p-4 rounded-lg border border-neutral-100">
                            To maintain our quality standards, our team reviews every listing.
                            Your property will be live on the platform within <span className="font-semibold text-neutral-900">24 hours</span>.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <button
                            onClick={handleReturnHome}
                            className="w-full sm:w-auto px-8 py-3 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-all font-medium text-neutral-600"
                        >
                            Return Home
                        </button>
                        <button
                            onClick={handleViewProfile}
                            className="w-full sm:w-auto px-8 py-3 bg-black text-white rounded-xl hover:bg-neutral-800 transition-all font-medium flex items-center justify-center gap-2 group"
                        >
                            View My Profile
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-12">
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-serif font-medium text-neutral-900 mb-4">
                    {isEditMode ? 'Edit Property' : 'Post Your Property'}
                </h1>
                <p className="text-neutral-500">
                    {isEditMode ? 'Update your property details' : 'List your PG, Flat, or Room for free and connect directly with tenants.'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-xl border border-neutral-200 shadow-sm">

                {/* Property Title */}
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-neutral-700 mb-1">Property Title</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        required
                        placeholder="e.g., Luxury PG in HSR Layout"
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                        value={formData.title}
                        onChange={handleChange}
                    />
                </div>

                {/* Property Type & Price */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="type" className="block text-sm font-medium text-neutral-700 mb-1">Property Type</label>
                        <select
                            id="type"
                            name="type"
                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                            value={formData.type}
                            onChange={handleChange}
                        >
                            <option value="PG">PG / Hostel</option>
                            <option value="Flat">Flat / Apartment</option>
                            <option value="Room">Private Room</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="price" className="block text-sm font-medium text-neutral-700 mb-1">Monthly Rent (₹)</label>
                        <input
                            type="number"
                            id="price"
                            name="price"
                            required
                            placeholder="e.g., 12000"
                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                            value={formData.price}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                {/* Address */}
                <div>
                    <label htmlFor="address" className="block text-sm font-medium text-neutral-700 mb-1">Address / Area</label>
                    <input
                        type="text"
                        id="address"
                        name="address"
                        required
                        placeholder="e.g., Koramangala 4th Block, Near Forum Mall"
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                        value={formData.address}
                        onChange={handleChange}
                    />
                </div>

                {/* Location */}
                <div className="relative">
                    <label htmlFor="location" className="block text-sm font-medium text-neutral-700 mb-1">City</label>
                    <input
                        type="text"
                        id="location"
                        name="location"
                        required
                        placeholder="Search city..."
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                        value={citySearch}
                        onChange={(e) => {
                            setCitySearch(e.target.value);
                            setShowCityDropdown(true);
                        }}
                        onFocus={() => setShowCityDropdown(true)}
                    />
                    {showCityDropdown && filteredCities.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {filteredCities.map(city => (
                                <button
                                    key={city}
                                    type="button"
                                    onClick={() => handleCitySelect(city)}
                                    className="w-full text-left px-4 py-2 hover:bg-neutral-100 transition-colors text-sm"
                                >
                                    {city}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Image Upload */}
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Property Images</label>
                    <MultiImageUpload
                        images={formData.images}
                        onImagesChange={(images) => setFormData(prev => ({ ...prev, images }))}
                        maxImages={5}
                    />
                </div>

                {/* Description */}
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
                    <textarea
                        id="description"
                        name="description"
                        rows={4}
                        required
                        placeholder="Describe the amenities, rules, and nearby landmarks..."
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all resize-none"
                        value={formData.description}
                        onChange={handleChange}
                    />
                </div>

                {/* Contact Number */}
                <div>
                    <label htmlFor="contactNumber" className="block text-sm font-medium text-neutral-700 mb-1">Contact Number</label>
                    <input
                        type="tel"
                        id="contactNumber"
                        name="contactNumber"
                        required
                        placeholder="e.g., +91 98765 43210"
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                        value={formData.contactNumber}
                        onChange={handleChange}
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-black text-white font-bold py-3 rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (isEditMode ? 'Updating...' : 'Posting...') : (isEditMode ? 'Update Property' : 'Post Property')}
                </button>
            </form>
        </div>
    );
}
