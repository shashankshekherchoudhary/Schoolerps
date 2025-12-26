import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Eye, EyeOff, ArrowRight, BookOpen, Users, BarChart3, Shield } from 'lucide-react'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        try {
            const user = await login(email, password)

            switch (user.role) {
                case 'platform_admin':
                    navigate('/platform/dashboard')
                    break
                case 'school_admin':
                    navigate('/school/dashboard')
                    break
                case 'account_admin':
                    navigate('/school/fees/records')
                    break
                case 'teacher':
                    navigate('/teacher/dashboard')
                    break
                case 'student':
                    navigate('/student/dashboard')
                    break
                default:
                    navigate('/')
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Login failed. Please check your credentials.')
        } finally {
            setIsLoading(false)
        }
    }

    const features = [
        { icon: BookOpen, title: 'Academic Management', desc: 'Streamline classes, subjects & curriculum' },
        { icon: Users, title: 'Student & Staff Portal', desc: 'Complete attendance & profile management' },
        { icon: BarChart3, title: 'Fee & Finance', desc: 'Automated billing & payment tracking' },
        { icon: Shield, title: 'Secure & Reliable', desc: 'Enterprise-grade data protection' },
    ]

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Decorative (Hidden on Mobile) */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
                {/* Decorative Circles */}
                <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-white">
                    {/* Logo */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold tracking-tight">
                            Campus<span className="text-blue-300">orbit</span>
                        </h1>
                        <p className="text-blue-200 mt-2 text-lg">Smart School Management Platform</p>
                    </div>

                    {/* Features */}
                    <div className="space-y-6 mt-8">
                        {features.map((feature, index) => (
                            <div key={index} className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                    <feature.icon className="w-6 h-6 text-blue-200" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">{feature.title}</h3>
                                    <p className="text-blue-200 text-sm">{feature.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Trust Badge */}
                    <div className="mt-12 pt-8 border-t border-white/20">
                        <p className="text-blue-200 text-sm">Trusted by 500+ schools across India</p>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-gradient-to-br from-slate-50 to-blue-50">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">
                            Campus<span className="text-blue-600">orbit</span>
                        </h1>
                        <p className="text-gray-500 mt-1">Smart School Management Platform</p>
                    </div>

                    {/* Login Card */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-blue-900/5 p-8 sm:p-10 border border-white/50">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
                            <p className="text-gray-500 mt-1">Sign in to your account</p>
                        </div>

                        {/* Error Alert */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl">
                                <p className="text-sm text-red-600 text-center">{error}</p>
                            </div>
                        )}

                        {/* Login Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                                    placeholder="you@school.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3.5 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-blue-700/40 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        Sign In
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </form>

                    </div>

                    {/* Footer */}
                    <p className="text-center text-gray-400 text-xs mt-8">
                        © 2024 Campusorbit. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    )
}
