import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function BusPassengerLogin() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { login, register, user } = useAuth();

    // If already logged in, redirect to route selection
    useEffect(() => {
        if (user) {
            navigate('/bus/select-route');
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (isLogin) {
                await login({ email, password });
            } else {
                // Register as USER role (passengers use USER role)
                await register({ email, password, role: 'USER' });
            }
            navigate('/bus/select-route');
        } catch (err) {
            setError(err.message || 'Authentication failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto py-8">
            {/* Back Button */}
            <button
                onClick={() => navigate('/bus')}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium mb-6 transition-all duration-150"
            >
                ← Back
            </button>

            {/* Header */}
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">🚌</div>
                <h1 className="text-2xl font-bold text-gray-900">Bus Passenger</h1>
                <p className="mt-1 text-sm text-gray-500">
                    {isLogin ? 'Login to track buses on your route' : 'Create an account to get started'}
                </p>
            </div>

            {/* Toggle Login/Register */}
            <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
                <button
                    type="button"
                    onClick={() => setIsLogin(true)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${isLogin
                            ? 'bg-white text-emerald-700 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Login
                </button>
                <button
                    type="button"
                    onClick={() => setIsLogin(false)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${!isLogin
                            ? 'bg-white text-emerald-700 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Register
                </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                {error && (
                    <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl p-3 text-sm">
                        ⚠️ {error}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Email Address
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all duration-150"
                        placeholder="your@email.com"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Password
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all duration-150"
                        placeholder="••••••••"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 px-6 rounded-xl font-semibold text-sm hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow-md disabled:bg-gray-200 disabled:text-gray-400 disabled:from-gray-200 disabled:to-gray-200 flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            {isLogin ? 'Logging in...' : 'Creating account...'}
                        </>
                    ) : (
                        isLogin ? 'Login' : 'Create Account'
                    )}
                </button>
            </form>

            {/* Info */}
            <div className="mt-6 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h3 className="font-semibold text-gray-900 text-sm mb-3">Why login?</h3>
                <ul className="text-sm text-gray-500 space-y-2">
                    <li>✅ Select your travel route</li>
                    <li>✅ Track only buses on your route</li>
                    <li>✅ Get accurate ETA for your stop</li>
                    <li>✅ Save your preferred routes</li>
                </ul>
            </div>
        </div>
    );
}

export default BusPassengerLogin;
