'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
    MessageCircle, Phone, ArrowLeft, Building, 
    Search, Plus, Home, ShoppingBag, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getUserEnquiries } from '@/lib/api';
import { toast } from 'sonner';
import { supabase } from '@/lib/db';

export default function UserEnquiriesPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [enquiries, setEnquiries] = useState<any[]>([]);
    const [propertiesCount, setPropertiesCount] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'rent' | 'sell'>('all');

    useEffect(() => {
        if (!isLoading && !user) router.push('/');
    }, [user, isLoading, router]);

    useEffect(() => {
        const fetchEnquiries = async () => {
            if (user) {
                try {
                    const data = await getUserEnquiries(user.id);
                    setEnquiries(data.enquiries || []);
                    setPropertiesCount(data.propertiesCount || 0);
                } catch (error) {
                    console.error('Error fetching enquiries:', error);
                    toast.error('Failed to load enquiries');
                } finally {
                    setLoading(false);
                }
            }
        };

        if (user) {
            fetchEnquiries();

            const channel = supabase
                .channel('leads-realtime')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads_activity' },
                    () => {
                        fetchEnquiries();
                        toast.info('New enquiry received!', { icon: '🔔' });
                    }
                )
                .subscribe();

            return () => { supabase.removeChannel(channel); };
        }
    }, [user]);

    function timeAgo(dateStr: string) {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        if (days < 30) return `${days}d ago`;
        return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    }

    const handleShareProfile = async () => {
        const profileUrl = `${window.location.origin}/view-profile/${user?.id}`;
        if (navigator.share) {
            try { await navigator.share({ title: 'My properties on NBF Homes', url: profileUrl }); }
            catch (err) { console.error(err); }
        } else {
            navigator.clipboard.writeText(profileUrl);
            toast.success('Profile link copied!');
        }
    };

    // Apply search + tab filter
    const filteredEnquiries = enquiries.filter(e => {
        const matchesSearch =
            e.lead_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.property_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.lead_phone?.includes(searchTerm);

        const listingType = e.listing_type || e.property_listing_type || 'rent';
        const matchesTab =
            activeTab === 'all' ||
            (activeTab === 'rent' && listingType === 'rent') ||
            (activeTab === 'sell' && listingType === 'sell');

        return matchesSearch && matchesTab;
    });

    const rentCount = enquiries.filter(e => (e.listing_type || e.property_listing_type || 'rent') === 'rent').length;
    const sellCount = enquiries.filter(e => (e.listing_type || e.property_listing_type || 'rent') === 'sell').length;

    if (isLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="w-10 h-10 rounded-full border-[3px] border-neutral-100 border-t-black animate-spin" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-neutral-50/50 pb-24">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-neutral-200 sticky top-0 z-40">
                <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => router.back()}
                            className="p-2.5 bg-neutral-50 hover:bg-neutral-100 rounded-2xl border border-neutral-200/50 shadow-sm shrink-0">
                            <ArrowLeft className="w-5 h-5 text-neutral-900" />
                        </motion.button>
                        <div>
                            <h1 className="text-xl font-black text-neutral-900 tracking-tight">Enquiries</h1>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Real-time Dashboard</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-black text-white px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-2 shadow-lg">
                        <CheckCircle2 className="w-3 h-3 text-green-400" />
                        {enquiries.length} Total
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 pt-6">

                {/* Search */}
                <div className="relative mb-4">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search by name, phone or property..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-white border border-neutral-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-neutral-900 shadow-sm"
                    />
                </div>

                {/* Rent / Sell Tabs */}
                <div className="flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar pb-1">
                    {[
                        { key: 'all', label: 'All', count: enquiries.length },
                        { key: 'rent', label: '🏠 Rent', count: rentCount },
                        { key: 'sell', label: '🏷️ Buy/Sell', count: sellCount },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as any)}
                            className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                                activeTab === tab.key
                                    ? 'bg-black text-white shadow-lg'
                                    : 'bg-white text-neutral-500 border border-neutral-200 hover:border-neutral-400'
                            }`}
                        >
                            {tab.label}
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                                activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-500'
                            }`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Enquiries List */}
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout" initial={false}>
                        {filteredEnquiries.length > 0 ? (
                            filteredEnquiries.map((enquiry, idx) => {
                                const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
                                const propertyUrl = `${siteUrl}/product/${enquiry.property_handle}`;
                                const listingType = enquiry.listing_type || enquiry.property_listing_type || 'rent';
                                const isSell = listingType === 'sell';
                                const isWhatsApp = enquiry.action_type === 'whatsapp';

                                const typeText = isSell ? 'For Sale' : 'For Rent';
                                const priceText = enquiry.property_price ? `💰 ${isSell ? 'Budget/Price' : 'Rent'}: ₹${Number(enquiry.property_price).toLocaleString('en-IN')}${isSell ? '' : '/month'}` : '';
                                const areaText = enquiry.property_area ? `📏 Area: ${enquiry.property_area}` : '';
                                const bhkText = enquiry.property_bhk ? `🏡 BHK: ${enquiry.property_bhk} BHK` : '';
                                const pType = enquiry.property_type || 'Property';

                                const detailsText = [priceText, bhkText, areaText].filter(Boolean).join('\n');

                                const waMessage = encodeURIComponent(
                                    `Hello ${enquiry.lead_name}, aapne NBF Homes par hamari property dekhi thi. Kya aap ismein interested hain?\n\n🏠 NBF HOMES - ${pType} ${typeText}\n\n📝 Title: ${enquiry.property_title}\n${detailsText ? detailsText + '\n' : ''}\nAur adhik jankari aur property ki photos dekhne ke liye niche di gayi link par click karein 👇\n\n🔗 Link: ${propertyUrl}`
                                );

                                return (
                                    <motion.div
                                        key={enquiry.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.3, delay: idx * 0.04 }}
                                        className="bg-white rounded-[2rem] p-5 sm:p-6 border border-neutral-200/80 shadow-sm hover:shadow-xl hover:shadow-neutral-900/5 transition-all relative overflow-hidden"
                                    >
                                        {/* Color stripe — green for rent, red for sell */}
                                        <div className={`absolute top-0 left-0 w-1.5 h-full ${isSell ? 'bg-[#e8202a]' : 'bg-green-500'}`} />

                                        <div className="flex flex-col gap-5">
                                            {/* Listing Type Badge */}
                                            <div className="flex items-center justify-between">
                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                    isSell
                                                        ? 'bg-red-50 text-[#e8202a] border border-red-100'
                                                        : 'bg-green-50 text-green-700 border border-green-100'
                                                }`}>
                                                    {isSell ? <ShoppingBag className="w-3 h-3" /> : <Home className="w-3 h-3" />}
                                                    {isSell ? 'Buy / Sell Property' : 'Rent Property'}
                                                </div>
                                                <span className="text-[10px] text-neutral-400 font-bold">
                                                    {timeAgo(enquiry.created_at)}
                                                </span>
                                            </div>

                                            {/* Lead Info */}
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                                                    isWhatsApp ? 'bg-green-50 border-green-100 text-green-600' : 'bg-blue-50 border-blue-100 text-blue-600'
                                                }`}>
                                                    {isWhatsApp ? <MessageCircle className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="font-black text-lg text-neutral-900 tracking-tight">{enquiry.lead_name}</h3>
                                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                            isWhatsApp ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                                        }`}>
                                                            {isWhatsApp ? 'WhatsApp' : 'Call'}
                                                        </span>
                                                    </div>
                                                    <a href={`tel:+91${enquiry.lead_phone?.replace(/\D/g, '')}`}
                                                        className="text-sm font-bold text-neutral-500 hover:text-black transition-colors font-mono">
                                                        +91 {enquiry.lead_phone}
                                                    </a>
                                                </div>
                                            </div>

                                            {/* Property Box */}
                                            <div className="bg-neutral-50 border border-neutral-100 p-3.5 rounded-2xl hover:bg-neutral-100 transition-colors">
                                                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Property Enquired</p>
                                                <a href={propertyUrl} target="_blank" rel="noopener noreferrer"
                                                    className="flex items-center justify-between gap-3 group">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className="w-8 h-8 rounded-lg bg-white border border-neutral-200 flex items-center justify-center shrink-0 shadow-sm">
                                                            <Building className="w-4 h-4 text-neutral-500" />
                                                        </div>
                                                        <span className="text-sm font-black text-neutral-900 truncate group-hover:text-blue-600 transition-colors">
                                                            {enquiry.property_title}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-blue-500 font-bold shrink-0 group-hover:underline">View →</span>
                                                </a>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <motion.a whileTap={{ scale: 0.97 }}
                                                    href={`tel:+91${enquiry.lead_phone?.replace(/\D/g, '')}`}
                                                    className="flex items-center justify-center gap-2 py-3.5 bg-white text-black border-2 border-neutral-100 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-neutral-50 hover:border-neutral-200 transition-all shadow-sm">
                                                    <Phone className="w-4 h-4 text-blue-500" />
                                                    Call
                                                </motion.a>
                                                <motion.a whileTap={{ scale: 0.97 }}
                                                    href={`https://wa.me/91${enquiry.lead_phone?.replace(/\D/g, '')}?text=${waMessage}`}
                                                    target="_blank" rel="noopener noreferrer"
                                                    className="flex items-center justify-center gap-2 py-3.5 bg-[#25D366] text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#128C7E] transition-all shadow-lg shadow-green-500/20">
                                                    <MessageCircle className="w-4 h-4" />
                                                    WhatsApp
                                                </motion.a>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-neutral-100 px-6"
                            >
                                <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-5">
                                    <MessageCircle className="w-9 h-9 text-neutral-200" />
                                </div>

                                {propertiesCount === 0 ? (
                                    <>
                                        <h3 className="text-xl font-black text-neutral-900">Post your first property</h3>
                                        <p className="text-sm text-neutral-400 mt-2 max-w-xs mx-auto">List your property to start receiving enquiries!</p>
                                        <motion.button whileTap={{ scale: 0.95 }}
                                            onClick={() => router.push('/post-property')}
                                            className="mt-6 inline-flex items-center gap-2 bg-black text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl">
                                            <Plus className="w-4 h-4" /> Post Property
                                        </motion.button>
                                    </>
                                ) : (
                                    <>
                                        <h3 className="text-xl font-black text-neutral-900">
                                            {searchTerm
                                                ? 'No matching enquiries'
                                                : activeTab === 'rent'
                                                ? 'No rent enquiries yet'
                                                : activeTab === 'sell'
                                                ? 'No buy/sell enquiries yet'
                                                : 'No enquiries yet'}
                                        </h3>
                                        <p className="text-sm text-neutral-400 mt-2 max-w-xs mx-auto">
                                            {searchTerm
                                                ? 'Try a different search term.'
                                                : 'Share your listings to start getting leads!'}
                                        </p>
                                        {searchTerm ? (
                                            <button onClick={() => setSearchTerm('')}
                                                className="mt-6 text-sm font-black text-black border-b-2 border-black/10 hover:border-black transition-all">
                                                Clear Search
                                            </button>
                                        ) : (
                                            <motion.button whileTap={{ scale: 0.95 }} onClick={handleShareProfile}
                                                className="mt-6 inline-flex items-center gap-2 bg-[#25D366] text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-green-500/20">
                                                <MessageCircle className="w-4 h-4" />
                                                Share on WhatsApp
                                            </motion.button>
                                        )}
                                    </>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
