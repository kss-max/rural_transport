import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { registerDriver } from '../../services/busService';

function Buslogin() {
    const [step, setStep] = useState('login'); // 'login' or 'register'
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        vehicleNumber: '',
        licenseNumber: '',
        phoneNumber: ''
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login, register, user } = useAuth();

    // Redirect to dashboard if already logged in as driver
    useEffect(() => {
        if (user && user.role === 'DRIVER') {
            navigate('/bus/driver-dashboard');
        }
    }, [user, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await login({
                email: formData.email,
                password: formData.password
            });

            // Navigate to driver dashboard after successful login
            navigate('/bus/driver-dashboard');
        } catch (err) {
            setError(err.message || 'Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterDriver = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // First, try to create user account (if doesn't exist)
            try {
                await register({
                    email: formData.email,
                    password: formData.password,
                    role: 'USER' // Will be updated to DRIVER after driver registration
                });
            } catch (signupErr) {
                // If user already exists, that's fine - continue to login
                if (!signupErr.message?.includes('already')) {
                    throw signupErr;
                }
            }

            // Login to get authenticated
            await login({
                email: formData.email,
                password: formData.password
            });

            // Then register as driver (this updates role to DRIVER in backend)
            await registerDriver({
                email: formData.email,
                vehicleNumber: formData.vehicleNumber,
                licenseNumber: formData.licenseNumber,
                phoneNumber: formData.phoneNumber
            });

            // Re-login to get fresh token with DRIVER role
            await login({
                email: formData.email,
                password: formData.password
            });

            // Navigate to driver dashboard after successful registration
            navigate('/bus/driver-dashboard');
        } catch (err) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all duration-150";

    return (
        <div className="max-w-md mx-auto py-8">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">🚐</div>
                <h1 className="text-2xl font-bold text-gray-900">
                    {step === 'login' && 'Driver Login'}
                    {step === 'register' && 'Driver Registration'}
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                    {step === 'login' && 'Login to access your driver dashboard'}
                    {step === 'register' && 'Register as a bus driver'}
                </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">
                        {error}
                    </div>
                )}

                {/* Login Form */}
                {step === 'login' && (
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Email Address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="driver@example.com"
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="••••••••"
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2 pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 px-4 rounded-xl font-semibold text-sm hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow-md disabled:bg-gray-200 disabled:text-gray-400 disabled:from-gray-200 disabled:to-gray-200"
                            >
                                {loading ? 'Logging in...' : 'Login'}
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep('register')}
                                className="w-full bg-white text-emerald-700 py-3 px-4 rounded-xl font-semibold text-sm border border-emerald-200 hover:bg-emerald-50 active:scale-[0.98] transition-all duration-150"
                            >
                                Register as New Driver
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate('/bus')}
                                className="w-full text-gray-500 py-2.5 px-4 rounded-xl text-sm font-medium hover:text-gray-700 transition-all duration-150"
                            >
                                ← Back
                            </button>
                        </div>
                    </form>
                )}

                {/* Registration Form */}
                {step === 'register' && (
                    <form onSubmit={handleRegisterDriver} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Email Address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="driver@example.com"
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="••••••••"
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Phone Number
                            </label>
                            <input
                                id="phoneNumber"
                                name="phoneNumber"
                                type="tel"
                                required
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="+91 9876543210"
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label htmlFor="vehicleNumber" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Vehicle Number
                            </label>
                            <input
                                id="vehicleNumber"
                                name="vehicleNumber"
                                type="text"
                                required
                                value={formData.vehicleNumber}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="KA-01-AB-1234"
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700 mb-1.5">
                                License Number
                            </label>
                            <input
                                id="licenseNumber"
                                name="licenseNumber"
                                type="text"
                                required
                                value={formData.licenseNumber}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="DL-1234567890"
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2 pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-emerald-600 text-white py-3 px-4 rounded-xl font-semibold text-sm hover:bg-emerald-700 active:scale-[0.98] transition-all duration-150 disabled:bg-gray-200 disabled:text-gray-400"
                            >
                                {loading ? 'Registering...' : 'Register as Driver'}
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep('login')}
                                className="w-full text-gray-500 py-2.5 px-4 rounded-xl text-sm font-medium hover:text-gray-700 transition-all duration-150"
                            >
                                ← Back to Login
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

export default Buslogin;
