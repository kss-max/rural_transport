import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function Bus() {
    const navigate = useNavigate();
    const { user } = useAuth();

    // If user is already logged in as DRIVER, redirect to dashboard
    useEffect(() => {
        if (user && user.role === 'DRIVER') {
            navigate('/bus/driver-dashboard');
        }
    }, [user, navigate]);

    const handleDriverLogin = () => {
        navigate('/bus-login');
    };

    const handlePassengerLogin = () => {
        // If user is already logged in (not as driver), go to route selection
        if (user && user.role !== 'DRIVER') {
            navigate('/bus/select-route');
        } else {
            navigate('/bus/passenger-login');
        }
    };

    // Don't render while redirecting
    if (user && user.role === 'DRIVER') {
        return null;
    }

    return (
        <div className="max-w-md mx-auto py-8">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">🚌</div>
                <h1 className="text-2xl font-bold text-gray-900">Bus Service</h1>
                <p className="mt-1 text-sm text-gray-500">Track live buses or login as driver</p>
            </div>

            {/* Options */}
            <div className="space-y-3">
                <button
                    onClick={handlePassengerLogin}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 px-6 rounded-2xl font-semibold text-base hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow-md"
                >
                    🔍 Track Live Buses
                    <span className="block text-sm font-normal opacity-80 mt-0.5">
                        {user ? 'Select your route' : 'Login required'}
                    </span>
                </button>

                <button
                    onClick={handleDriverLogin}
                    className="w-full bg-white text-gray-900 py-4 px-6 rounded-2xl font-semibold text-base border border-gray-200 hover:border-emerald-200 hover:shadow-md active:scale-[0.98] transition-all duration-150"
                >
                    🚐 Driver Login
                </button>
            </div>

            {/* Info */}
            <div className="mt-8 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">For Passengers:</h3>
                <ul className="text-sm text-gray-500 space-y-2">
                    <li>✅ Login or create an account</li>
                    <li>✅ Select your travel route</li>
                    <li>✅ Track buses on your route only</li>
                    <li>✅ Get ETA based on your location</li>
                </ul>
            </div>
        </div>
    );
}

export default Bus;
