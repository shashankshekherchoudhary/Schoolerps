import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import clsx from 'clsx'
import {
    LayoutDashboard, Users, GraduationCap, UserCheck, CalendarCheck,
    DollarSign, FileText, Bell, School, Activity, LogOut,
    HelpCircle, BookOpen, ClipboardList, ChevronLeft, X
} from 'lucide-react'

const navigation = {
    platform_admin: [
        { name: 'Dashboard', path: '/platform/dashboard', icon: LayoutDashboard },
        { name: 'Schools', path: '/platform/schools', icon: School },
        { name: 'Activity Logs', path: '/platform/activity-logs', icon: Activity },
    ],
    school_admin: [
        { section: 'Overview' },
        { name: 'Dashboard', path: '/school/dashboard', icon: LayoutDashboard },
        { section: 'Academic Setup' },
        { name: 'Academic Years', path: '/school/academic-years', icon: CalendarCheck },
        { name: 'Classes & Sections', path: '/school/classes', icon: BookOpen },
        { name: 'Subjects', path: '/school/subjects', icon: FileText },
        { name: 'Assignments', path: '/school/teacher-assignments', icon: UserCheck },
        { section: 'People' },
        { name: 'Teachers', path: '/school/teachers', icon: Users },
        { name: 'Students', path: '/school/students', icon: GraduationCap },
        { section: 'Operations' },
        { name: 'Student Attendance', path: '/school/attendance/students', icon: ClipboardList, checkFeature: 'attendance' },
        { name: 'Teacher Attendance', path: '/school/attendance/teachers', icon: ClipboardList, checkFeature: 'attendance' },
        { section: 'Finance' },
        { name: 'Fee Structures', path: '/school/fees/structures', icon: DollarSign, checkFeature: 'fees' },
        { name: 'Fee Records', path: '/school/fees/records', icon: DollarSign, checkFeature: 'fees' },
        { section: 'Other' },
        { name: 'Exams', path: '/school/exams', icon: FileText, checkFeature: 'exams' },
        { name: 'Notices', path: '/school/notices', icon: Bell },
    ],
    teacher: [
        { name: 'Dashboard', path: '/teacher/dashboard', icon: LayoutDashboard },
        { name: 'Mark Attendance', path: '/teacher/attendance', icon: UserCheck },
        { name: 'Enter Marks', path: '/teacher/marks', icon: ClipboardList },
        { name: 'Notices', path: '/teacher/notices', icon: Bell },
        { name: 'Study Materials', path: '/teacher/materials', icon: BookOpen, checkFeature: 'notes' },
    ],
    tuition_owner: [
        { name: 'Dashboard', path: '/teacher/dashboard', icon: LayoutDashboard },
        { section: 'Academic' },
        { name: 'Batches (Classes)', path: '/school/classes', icon: BookOpen },
        { name: 'Subjects', path: '/school/subjects', icon: FileText },
        { section: 'People' },
        { name: 'Students', path: '/school/students', icon: GraduationCap },
        { section: 'Operations' },
        { name: 'Attendance', path: '/teacher/attendance', icon: UserCheck },
        { name: 'Fees', path: '/school/fees/records', icon: DollarSign },
        { name: 'Notices', path: '/teacher/notices', icon: Bell },
        { name: 'Enter Marks', path: '/teacher/marks', icon: ClipboardList },
        { name: 'Study Materials', path: '/teacher/materials', icon: BookOpen, checkFeature: 'notes' },
    ],
    student: [
        { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
        { name: 'My Profile', path: '/student/profile', icon: Users },
        { name: 'Attendance', path: '/student/attendance', icon: UserCheck },
        { name: 'Fees', path: '/student/fees', icon: DollarSign },
        { name: 'Results', path: '/student/results', icon: FileText },
        { name: 'Notices', path: '/student/notices', icon: Bell },
        { name: 'Study Materials', path: '/student/materials', icon: BookOpen, checkFeature: 'notes' },
    ],
    account_admin: [
        { name: 'Dashboard', path: '/school/dashboard', icon: LayoutDashboard },
        { name: 'Students', path: '/school/students', icon: GraduationCap },
        { name: 'Fee Records', path: '/school/fees/records', icon: FileText },
    ],
}

export default function Sidebar({ isOpen, onClose }) {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    // Determine Navigation Items
    let items = []
    if (user?.role === 'platform_admin') items = navigation.platform_admin
    else if (user?.role === 'school_admin') items = navigation.school_admin
    else if (user?.role === 'account_admin') items = navigation.account_admin
    else if (user?.role === 'student') items = navigation.student
    else if (user?.role === 'teacher') {
        if (user?.account_type === 'tuition' && user?.is_owner) {
            items = navigation.tuition_owner
        } else {
            items = navigation.teacher
        }
    }

    const isPlatformAdmin = user?.role === 'platform_admin'
    const brandName = isPlatformAdmin ? 'Campusorbit' : (user?.school_name || 'School Portal')

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    return (
        <>
            {/* Overlay - mobile only */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={clsx(
                    'fixed top-0 left-0 z-50 h-screen w-72 flex flex-col',
                    'bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800',
                    'transform transition-transform duration-300 ease-out',
                    'lg:translate-x-0',
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                {/* Header */}
                <div className="h-16 flex items-center justify-between px-5 border-b border-gray-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30 shrink-0">
                            {isPlatformAdmin ? (
                                <GraduationCap className="w-5 h-5 text-white" />
                            ) : (
                                <School className="w-5 h-5 text-white" />
                            )}
                        </div>
                        <div className="overflow-hidden">
                            <span className={`text-lg font-bold text-gray-900 dark:text-white truncate block ${!isPlatformAdmin ? 'text-base' : ''}`}>
                                {isPlatformAdmin ? (
                                    <>Campus<span className="text-primary-600">orbit</span></>
                                ) : (
                                    brandName
                                )}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="lg:hidden p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation - explicit height for scrolling */}
                <nav className="h-[calc(100vh-136px)] overflow-y-auto py-4 px-3">
                    <div className="space-y-1">
                        {items.map((item, index) => {
                            // Feature Toggle Check
                            if (item.checkFeature) {
                                if (!user?.feature_toggles || !user.feature_toggles[item.checkFeature]) {
                                    return null
                                }
                            }

                            return item.section ? (
                                <div
                                    key={index}
                                    className="px-3 pt-5 pb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                >
                                    {item.section}
                                </div>
                            ) : (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    onClick={onClose}
                                    className={({ isActive }) =>
                                        clsx(
                                            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium',
                                            'transition-all duration-200',
                                            isActive
                                                ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30'
                                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                                        )
                                    }
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.name}
                                </NavLink>
                            )
                        })}
                    </div>
                </nav>

                {/* Footer */}
                <div className="p-3 border-t border-gray-100 dark:border-gray-800">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 rounded-xl transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </button>
                    {!isPlatformAdmin && (
                        <div className="mt-4 text-center">
                            <p className="text-[10px] text-gray-400 font-medium">Powered by Campusorbit</p>
                        </div>
                    )}
                </div>
            </aside>
        </>
    )
}
