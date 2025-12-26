import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Eye, EyeOff, LogIn, GraduationCap } from 'lucide-react'

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

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center p-4">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.05%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>

            <div className="relative w-full max-w-md">
                {/* Login Card */}
                <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10" style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                    {/* Logo & Brand */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-4">
                            <GraduationCap className="w-8 h-8 text-primary-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Campus<span className="text-primary-600">orbit</span>
                        </h1>
                        <p className="text-gray-500 mt-1">School ERP System</p>
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="email" className="label">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                className="input"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="label">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="input pr-12"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg w-full"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className="spinner"></span>
                            ) : (
                                <>
                                    <LogIn size={20} />
                                    Sign In
                                </>
                            )}
                        </button>
                    </form>

                    {/* Demo Credentials */}
                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <p className="text-xs text-center text-gray-500 mb-3">Demo Credentials</p>
                        <div className="bg-gray-50 rounded-xl p-3 text-center">
                            <p className="text-xs text-gray-600">
                                <span className="font-medium">Platform Admin:</span> admin@campusorbit.com
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-primary-200 text-sm mt-6">
                    © 2024 Campusorbit. All rights reserved.
                </p>
            </div>
        </div>
    )
}
