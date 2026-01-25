export default function BannedPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 font-sans text-center">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-100">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Suspended</h1>

                <p className="text-gray-600 mb-6 leading-relaxed">
                    Your account has been restricted due to a violation of our terms of service or suspicious activity.
                </p>

                <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm mb-6 border border-red-100">
                    <strong>Status:</strong> Banned Permanently
                </div>

                <p className="text-xs text-gray-400">
                    If you believe this is a mistake, please contact support at <a href="mailto:support@nbfhomes.in" className="text-blue-600 hover:underline">support@nbfhomes.in</a>.
                </p>

                {/* Optional: Sign Out Button? The AuthContext handles auto sign out, but good to have manual opt */}
            </div>
        </div>
    );
}
