'use strict';
import React from 'react';
import { X, Mail, Phone, Calendar, User } from 'lucide-react';

interface Inquiry {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    subject: string;
    message: string;
    phone_number?: string;
    created_at: string;
    status: string;
}

interface InquiryModalProps {
    isOpen: boolean;
    onClose: () => void;
    inquiry: Inquiry | null;
}

export function InquiryModal({ isOpen, onClose, inquiry }: InquiryModalProps) {
    if (!isOpen || !inquiry) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-neutral-100">
                    <h2 className="text-xl font-bold text-neutral-900">Inquiry Details</h2>
                    <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-neutral-500" />
                    </button>
                </div>

                <div className="p-6 md:p-8 space-y-8 max-h-[80vh] overflow-y-auto">
                    {/* Header Info */}
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                                <User className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-neutral-900">
                                    {inquiry.first_name} {inquiry.last_name}
                                </h3>
                                <div className="flex items-center gap-2 text-neutral-500 mt-1">
                                    <Mail className="w-4 h-4" />
                                    <a href={`mailto:${inquiry.email}`} className="hover:text-blue-600 hover:underline">
                                        {inquiry.email}
                                    </a>
                                </div>
                                {inquiry.phone_number && (
                                    <div className="flex items-center gap-2 text-neutral-500 mt-1">
                                        <Phone className="w-4 h-4" />
                                        <span>{inquiry.phone_number}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-neutral-500 text-sm bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-100 self-start">
                            <Calendar className="w-4 h-4" />
                            {new Date(inquiry.created_at).toLocaleString('en-IN', {
                                dateStyle: 'medium',
                                timeStyle: 'short'
                            })}
                        </div>
                    </div>

                    {/* Subject & Message */}
                    <div className="bg-neutral-50 rounded-xl p-6 border border-neutral-100 space-y-4">
                        <div>
                            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Subject</span>
                            <p className="text-lg font-medium text-neutral-900 mt-1">{inquiry.subject}</p>
                        </div>
                        <div className="pt-4 border-t border-neutral-200">
                            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Message</span>
                            <p className="text-neutral-700 mt-2 leading-relaxed whitespace-pre-wrap">
                                {inquiry.message}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-neutral-50 border-t border-neutral-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-white border border-neutral-300 text-neutral-700 font-medium rounded-xl hover:bg-neutral-50 transition-colors shadow-sm"
                    >
                        Close
                    </button>
                    {/* Could add Reply button here later */}
                </div>
            </div>
        </div>
    );
}
