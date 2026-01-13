import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Product } from "@/lib/types";
import { getOptimizedImageUrl } from "@/lib/cloudinary-utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, Clock, ShieldAlert, CheckCircle, XCircle } from "lucide-react";

interface UserPropertiesModalProps {
    isOpen: boolean;
    onClose: () => void;
    userName: string;
    properties: Product[];
    loading: boolean;
}

export function UserPropertiesModal({
    isOpen,
    onClose,
    userName,
    properties,
    loading,
}: UserPropertiesModalProps) {

    const activeCount = properties.filter(p => p.availableForSale).length;
    const pendingCount = properties.filter(p => !p.availableForSale).length;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center justify-between">
                        <span>{userName}'s Properties</span>
                        <div className="flex gap-2 text-sm font-normal mr-8">
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                {activeCount} Active
                            </Badge>
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                {pendingCount} Pending/Inactive
                            </Badge>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="flex-1 mt-4 pr-4">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                        </div>
                    ) : properties.length === 0 ? (
                        <div className="text-center py-12 text-neutral-500">
                            No properties found for this user.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {properties.map((property) => (
                                <div
                                    key={property.id}
                                    className="flex items-start gap-4 p-4 rounded-lg border border-neutral-100 bg-neutral-50/50 hover:bg-neutral-100 transition-colors"
                                >
                                    {/* Thumbnail */}
                                    <div className="h-20 w-20 flex-shrink-0 rounded-md overflow-hidden bg-neutral-200 border border-neutral-200">
                                        {property.featuredImage?.url ? (
                                            <img
                                                src={getOptimizedImageUrl(property.featuredImage.url, 150, 150, 'fill')}
                                                alt={property.featuredImage.altText || property.title}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-neutral-400">
                                                <Eye className="w-8 h-8 opacity-20" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-medium text-neutral-900 truncate pr-4" title={property.title}>
                                                {property.title}
                                            </h4>
                                            <Badge
                                                variant="secondary"
                                                className={property.availableForSale ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                                            >
                                                {property.availableForSale ? "Active" : "Inactive"}
                                            </Badge>
                                        </div>

                                        <div className="mt-1 flex items-center gap-4 text-xs text-neutral-500">
                                            <span className="flex items-center gap-1">
                                                Status: {property.status || 'Pending'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                Price: ₹{Number(property.priceRange?.minVariantPrice?.amount || 0).toLocaleString('en-IN')}
                                            </span>
                                        </div>

                                        <div className="mt-2 text-xs text-neutral-400">
                                            ID: {property.id}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
