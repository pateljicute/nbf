'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdSettingsAction, updateAdSettingsAction, deleteAdAction } from '@/app/actions'; // Import delete action
import { useAuth } from '@/lib/auth-context';
import { ImageUpload } from '@/components/ui/image-upload';
import { Loader2, Upload, Video, Image as ImageIcon, Trash2 } from 'lucide-react';
import { uploadMedia } from '@/lib/cloudinary-utils';

export function AdManager() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [adConfig, setAdConfig] = useState<{
        media_url: string;
        media_type: 'image' | 'video';
        cta_text: string;
        cta_link: string;
        is_active: boolean;
    }>({
        media_url: '',
        media_type: 'image',
        cta_text: '',
        cta_link: '',
        is_active: true
    });

    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {
        try {
            const result = await getAdSettingsAction();
            if (result.success && result.data) {
                setAdConfig(result.data);
            }
        } catch (error) {
            console.error('Failed to load ad settings:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        if (!user) return;
        setSaving(true);
        try {
            const result = await updateAdSettingsAction(adConfig, user.id);
            if (result.success) {
                alert('Ad settings updated successfully!');
            } else {
                alert('Failed to update settings: ' + result.error);
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('An error occurred while saving.');
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!user) return;
        if (!confirm('Are you sure you want to delete this ad? This action cannot be undone.')) return;

        setSaving(true);
        try {
            const result = await deleteAdAction(user.id);
            if (result.success) {
                // Reset state
                setAdConfig({
                    media_url: '',
                    media_type: 'image',
                    cta_text: '',
                    cta_link: '',
                    is_active: true
                });
                alert('Ad deleted successfully!');
            } else {
                alert('Failed to delete ad: ' + result.error);
            }
        } catch (error) {
            console.error('Error deleting ad:', error);
            alert('An error occurred during deletion.');
        } finally {
            setSaving(false);
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            // 2MB Limit check
            if (file.size > 2 * 1024 * 1024) {
                alert("File size exceeds 2MB limit.");
                return;
            }

            const url = await uploadMedia(file, 'nbfhomes/ads', type);
            setAdConfig(prev => ({
                ...prev,
                media_url: url,
                media_type: type
            }));
        } catch (error: any) {
            alert('Upload failed: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Manage Homepage Ad</CardTitle>
                <CardDescription>Upload a banner or video, set the link, and toggle visibility. (Max 2MB)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Active Toggle */}
                <div className="flex items-center space-x-2">
                    <Switch
                        id="ad-active"
                        checked={adConfig.is_active}
                        onCheckedChange={(checked) => setAdConfig(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label htmlFor="ad-active">Ad Section Visible</Label>
                </div>

                {/* Media Upload */}
                <div className="space-y-4 border p-4 rounded-lg bg-neutral-50/50">
                    <Label>Ad Media (Image or Video)</Label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Image Upload Button */}
                        <div className="relative">
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                id="upload-ad-image"
                                onChange={(e) => handleFileUpload(e, 'image')}
                                disabled={uploading}
                            />
                            <Button variant="outline" className="w-full h-24 flex flex-col gap-2" asChild disabled={uploading}>
                                <label htmlFor="upload-ad-image" className="cursor-pointer">
                                    <ImageIcon className="h-6 w-6" />
                                    <span>Upload Image (PNG/JPG)</span>
                                </label>
                            </Button>
                        </div>

                        {/* Video Upload Button */}
                        <div className="relative">
                            <input
                                type="file"
                                accept="video/mp4,video/webm"
                                className="hidden"
                                id="upload-ad-video"
                                onChange={(e) => handleFileUpload(e, 'video')}
                                disabled={uploading}
                            />
                            <Button variant="outline" className="w-full h-24 flex flex-col gap-2" asChild disabled={uploading}>
                                <label htmlFor="upload-ad-video" className="cursor-pointer">
                                    <Video className="h-6 w-6" />
                                    <span>Upload Video (MP4)</span>
                                </label>
                            </Button>
                        </div>
                    </div>
                    {uploading && <p className="text-sm text-neutral-500 animate-pulse">Uploading media...</p>}
                </div>

                {/* Preview with Delete */}
                {adConfig.media_url && (
                    <div className="rounded-lg overflow-hidden border bg-neutral-100 aspect-[16/9] relative group">
                        {adConfig.media_type === 'video' ? (
                            <video src={adConfig.media_url} controls className="w-full h-full object-contain" />
                        ) : (
                            <img src={adConfig.media_url} alt="Ad Preview" className="w-full h-full object-contain" />
                        )}
                        <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 opacity-100 shadow-md transform hover:scale-105 transition-all"
                            onClick={handleDelete}
                            disabled={saving}
                        >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Ad
                        </Button>
                    </div>
                )}

                {/* Text Fields */}
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="cta-text">CTA Button Text (e.g. 'Book Now')</Label>
                        <Input
                            id="cta-text"
                            value={adConfig.cta_text}
                            onChange={(e) => setAdConfig(prev => ({ ...prev, cta_text: e.target.value }))}
                            placeholder="Learn More"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="cta-link">CTA Link (URL)</Label>
                        <Input
                            id="cta-link"
                            value={adConfig.cta_link}
                            onChange={(e) => setAdConfig(prev => ({ ...prev, cta_link: e.target.value }))}
                            placeholder="/shop or https://..."
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={saving || uploading} className="min-w-[120px]">
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
