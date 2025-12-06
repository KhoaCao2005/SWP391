import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from './useAuth';

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        if (savedToken && savedUser) {
            setToken(savedToken);
            setCurrentUser(JSON.parse(savedUser));
            setIsAuthenticated(true);
        }
        setLoading(false);
    }, []);

    // Login function - uses real backend API only
    const login = async (email, password) => {
        if (!API_URL || API_URL === 'undefined' || API_URL === '') {
            return {
                success: false,
                message: 'API URL is not configured. Please contact administrator.'
            };
        }

        try {
            const isNgrokUrl = API_URL?.includes('ngrok');
            const headers = {
                'Content-Type': 'application/json'
            };
            
            if (isNgrokUrl) {
                headers['ngrok-skip-browser-warning'] = 'true';
            }
            
            const res = await axios.post(
                `${API_URL}/login`,
                { email, password },
                { headers }
            );

            const token = res.data?.data?.token;
            const user = res.data?.data?.user;

            if (token && user) {
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                setToken(token);
                setCurrentUser(user);
                setIsAuthenticated(true);
                return {
                    success: true,
                    message: res.data.message || 'Login successful',
                    user
                };
            }

            return {
                success: false,
                message: 'Invalid response format from server'
            };
        } catch (error) {
            console.error('Login failed:', error);
            
            // Handle different error scenarios
            if (error.response) {
                // Server responded with error status
                return {
                    success: false,
                    message: error.response?.data?.message || 'Invalid email or password'
                };
            } else if (error.request) {
                // Request made but no response
                return {
                    success: false,
                    message: 'Cannot connect to server. Please check your connection.'
                };
            } else {
                // Something else happened
                return {
                    success: false,
                    message: 'An error occurred. Please try again later.'
                };
            }
        }
    };

    // Logout function
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setCurrentUser(null);
        setIsAuthenticated(false);
    };

    const value = {
        currentUser,
        login,
        token,
        loading,
        isAuthenticated,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
