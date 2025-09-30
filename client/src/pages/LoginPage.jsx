import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, TrendingUp } from 'lucide-react';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, error, loading } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        const success = await login(email, password);

        // --- THIS IS THE MISSING PIECE ---
        if (success) {
            // Navigate to the generic dashboard route.
            // The App.jsx router will handle the rest.
            navigate('/dashboard', { replace: true });
        }
    };

    return (
        <div className="w-full min-h-screen lg:grid lg:grid-cols-2 bg-white">
            {/* --- Left Panel: Branding & Visual --- */}
            <div className="hidden lg:flex flex-col items-center justify-center bg-gradient-to-br from-green-500 via-emerald-600 to-emerald-700 text-white p-12 text-center">
                <div className="max-w-md">
                    <TrendingUp className="mx-auto h-16 w-16 mb-6 opacity-90 [filter:drop-shadow(0_2px_4px_rgba(0,0,0,0.4))]" />
                    <h1 className="text-4xl font-bold tracking-tight [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">
                        Unlock Your Environmental Impact
                    </h1>
                    <p className="mt-4 text-lg text-green-100 [text-shadow:0_1px_1px_rgba(0,0,0,0.4)]">
                        The future of waste reporting is here. Turn compliance into an opportunity with powerful data and insights.
                    </p>
                </div>
            </div>

            {/* --- Right Panel: Login Form --- */}
            <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="mx-auto w-full max-w-sm space-y-6">
                    <div className="space-y-2 text-center">
                        <h1 className="text-3xl font-bold text-gray-900 [text-shadow:1px_1px_1px_rgba(0,0,0,0.05)]">Welcome Back</h1>
                        <p className="text-gray-600 [text-shadow:1px_1px_1px_rgba(0,0,0,0.05)]">
                            Enter your credentials to access your account.
                        </p>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="[text-shadow:1px_1px_1px_rgba(0,0,0,0.05)]">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                                className="bg-slate-50/70 border-slate-200"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center">
                                <Label htmlFor="password" className="[text-shadow:1px_1px_1px_rgba(0,0,0,0.05)]">Password</Label>
                                <a
                                    href="#"
                                    className="ml-auto inline-block text-sm text-green-600 hover:text-green-700 underline"
                                >
                                    Forgot your password?
                                </a>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                                className="bg-slate-50/70 border-slate-200"
                            />
                        </div>
                        {error && (
                            <p className="text-sm font-medium text-red-500">{error}</p>
                        )}
                        <Button
                            type="submit"
                            className="w-full text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 ease-in-out border border-green-600/50"
                            disabled={loading}
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Sign In
                        </Button>
                    </form>
                    <div className="mt-4 text-center text-sm">
                        Need support?{' '}
                        <a href="#" className="underline text-green-600 hover:text-green-700">
                            Contact Us
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;

