import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import ReactImg from '../../assets/car2.jpg';
import { useAuth } from './useAuth';

export default function LoginPage() {
    const { login, currentUser } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);
        setError('');

        try {
            const res = await login(email, password);
            if (res.success) {
                // Get user role and redirect to appropriate dashboard
                const userRole = res.user?.roles?.[0]?.roleName || currentUser?.roles?.[0]?.roleName;

                // Normalize for matching
                const upper = userRole ? userRole.toUpperCase() : userRole;

                // Backend returns "Dealer Manager" and "Dealer Staff" (from database role_name column)
                // Support both backend format and short format for flexibility
                if (userRole === 'Dealer Manager' || upper === 'MANAGER') {
                    navigate('/manager/dashboard');
                } else if (userRole === 'Dealer Staff' || upper === 'STAFF') {
                    navigate('/staff/dashboard');
                } else if (upper === 'EVM' || upper === 'ADMIN') {
                    navigate('/evm');
                } else {
                    // Default fallback - go to login and show message in console
                    console.warn('Unknown role:', userRole);
                    navigate('/login');
                }
            } else {
                setError(res.message || 'Login failed. Please check your credentials.');
            }
        } catch (err) {
            console.error('Login failed:', err);
            setError('An error occurred. Please try again later.');
        }
        setLoading(false);
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-gray-100 to-gray-200">
            <div className="flex w-[1400px] h-[700px] bg-white shadow-2xl rounded-2xl overflow-hidden">
                {/* Left - Sign In */}
                <div className="flex-1 flex flex-col justify-center items-center p-10 bg-gradient-to-r from-gray-400 to-gray-200">
                    <h2 className="text-3xl font-bold mb-6">Sign In</h2>
                    <p className="text-gray-500 mb-6">Enter your credentials to access your account</p>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="w-full max-w-md">
                        <div className="mb-4">
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="Email"
                                required
                                disabled={loading}
                                className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                        </div>
                        <div className="mb-4">
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Password"
                                required
                                disabled={loading}
                                className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                        </div>
                        <div className="mb-4">
                            <a href="#" className="text-sm font-medium text-black hover:underline">
                                Forget Your Password?
                            </a>
                        </div>
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                                {error}
                            </div>
                        )}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full px-4 py-2 text-white font-medium rounded-lg ${
                                loading
                                    ? 'bg-gray-300 cursor-not-allowed'
                                    : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-xl transition duration-300'
                            }`}
                        >
                            {loading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>
                </div>

                {/* Right - Sign Up Info */}
                <div
                    className="flex-2 text-white flex flex-col justify-center items-center p-10"
                    style={{
                        backgroundImage: `url(${ReactImg})`,
                        backgroundSize: 'cover',
                        backgroundPosition: '45% 85%'
                    }}
                >
                    <div className="flex-2 text-white flex flex-col justify-end items-end pl-100 pb-[-100px]">
                        <h2 className="text-3xl text-neutral-200 font-extrabold mb-4">Porsche TayCan</h2>
                        <p className="mb-12 text-center">
                            Register with your personal details to use all site features
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

