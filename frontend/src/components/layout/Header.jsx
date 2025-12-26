import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { Menu, Bell, ChevronDown, LogOut, User, Sun, Moon } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Header({ onMenuClick }) {
    const { user, logout } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const navigate = useNavigate()
    const [showUserMenu, setShowUserMenu] = useState(false)
    const menuRef = useRef(null)

    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowUserMenu(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    const roleLabels = {
        platform_admin: 'Platform Admin',
        school_admin: 'School Admin',
        account_admin: 'Account Admin',
        teacher: 'Teacher',
        student: 'Student',
    }

    return (
        <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-slate-800">
            <div className="h-full px-4 lg:px-6 flex items-center justify-between">
                {/* Left side */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-2 -ml-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    {/* Page title - shown on desktop */}
                    <div className="hidden lg:block">
                        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {user?.school_name || 'Campusorbit'}
                        </h1>
                    </div>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-2">
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>

                    {/* Notifications */}
                    <button className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                    </button>

                    {/* User menu */}
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <div className="hidden sm:block text-right">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {user?.first_name} {user?.last_name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {roleLabels[user?.role] || user?.role}
                                </p>
                            </div>
                            <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                                {user?.first_name?.[0]}{user?.last_name?.[0]}
                            </div>
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        </button>

                        {/* Dropdown */}
                        {showUserMenu && (
                            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 py-1 animate-fadeIn">
                                <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.email}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{roleLabels[user?.role]}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        navigate('/student/profile')
                                        setShowUserMenu(false)
                                    }}
                                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg mx-1 w-[calc(100%-8px)]"
                                >
                                    <User className="w-4 h-4" />
                                    View Profile
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
}
