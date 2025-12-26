import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import clsx from 'clsx'
import {
    LayoutDashboard, Users, GraduationCap, UserCheck, CalendarCheck,
    DollarSign, FileText, Bell, BookOpen, ClipboardList
} from 'lucide-react'

const navigation = {
    school_admin: [
        { name: 'Dashboard', path: '/school/dashboard', icon: LayoutDashboard },
        { name: 'Academic Years', path: '/school/academic-years', icon: CalendarCheck },
        { name: 'Students', path: '/school/students', icon: GraduationCap },
        { name: 'Teachers', path: '/school/teachers', icon: Users },
        { name: 'Attendance', path: '/school/attendance/students', icon: ClipboardList },
    ],
    teacher: [
        { name: 'Dashboard', path: '/teacher/dashboard', icon: LayoutDashboard },
        { name: 'Attendance', path: '/teacher/attendance', icon: UserCheck },
        { name: 'Marks', path: '/teacher/marks', icon: ClipboardList },
    ],
    student: [
        { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
        { name: 'Profile', path: '/student/profile', icon: Users },
        { name: 'Fees', path: '/student/fees', icon: DollarSign },
        { name: 'Notices', path: '/student/notices', icon: Bell },
    ],
}

export default function MobileNav() {
    const { user } = useAuth()
    const items = navigation[user?.role] || []

    // Show max 5 items
    const visibleItems = items.slice(0, 5)

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 safe-area-bottom md:hidden">
            <div className="flex items-center justify-around h-16">
                {visibleItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            clsx(
                                'flex flex-col items-center justify-center flex-1 h-full px-2',
                                'transition-colors duration-200',
                                isActive
                                    ? 'text-primary-600 dark:text-primary-400'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            )
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon className={clsx('w-5 h-5 mb-1', isActive && 'scale-110')} />
                                <span className="text-[10px] font-medium truncate">{item.name}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    )
}
