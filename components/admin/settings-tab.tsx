'use client';

import { useState, useEffect } from 'react';
import { getSiteSettings } from '@/lib/api';
import { updateSiteSettingsAction } from '@/app/actions';

interface SettingsTabProps {
    user: any;
    pushSubscription: PushSubscription | null;
    subscribeToPush: () => Promise<void>;
    unsubscribeFromPush: () => Promise<void>;
}

export function SettingsTab({ user, pushSubscription, subscribeToPush, unsubscribeFromPush }: SettingsTabProps) {
    const [settings, setSettings] = useState({
        homepage_title: '',
        homepage_description: '',
        whatsapp_number: ''
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            try {
                const data = await getSiteSettings();
                setSettings({
                    homepage_title: data.homepage_title || '',
                    homepage_description: data.homepage_description || '',
                    whatsapp_number: data.whatsapp_number || ''
                });
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSettingsSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        const res = await updateSiteSettingsAction(settings, user.id);
        if (res.success) alert('Settings saved successfully');
        else alert('Failed to save settings');
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">Website Settings</h2>
                <form onSubmit={handleSettingsSave} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Homepage Title (SEO)</label>
                        <input
                            type="text"
                            value={settings.homepage_title}
                            onChange={(e) => setSettings({ ...settings, homepage_title: e.target.value })}
                            className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                            placeholder="e.g. Find Your Perfect Home"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Homepage Description (SEO)</label>
                        <textarea
                            value={settings.homepage_description}
                            onChange={(e) => setSettings({ ...settings, homepage_description: e.target.value })}
                            className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 h-24"
                            placeholder="e.g. Discover verified rooms and flats..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Global WhatsApp Number</label>
                        <input
                            type="text"
                            value={settings.whatsapp_number}
                            onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                            className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                            placeholder="e.g. 917470724553"
                        />
                        <p className="text-xs text-neutral-500 mt-1">Used for 'Contact Us' and Application buttons. Format: CountryCode+Number (no symbols).</p>
                    </div>
                    <div className="pt-4">
                        <button
                            type="submit"
                            className="w-full px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors font-medium"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>

            {/* Notification Settings */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">Device Notifications</h2>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium text-neutral-900">Admin Push Alerts</p>
                        <p className="text-sm text-neutral-500">Receive system-level notifications for new properties.</p>
                    </div>
                    <div>
                        {pushSubscription ? (
                            <button onClick={unsubscribeFromPush} className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm">
                                Disable
                            </button>
                        ) : (
                            <button onClick={subscribeToPush} className="px-4 py-2 bg-green-50 text-green-600 border border-green-200 rounded-lg hover:bg-green-100 transition-colors font-medium text-sm">
                                Enable This Device
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
