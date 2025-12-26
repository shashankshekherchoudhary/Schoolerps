import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import {
    Users, GraduationCap, UserCheck, DollarSign,
    TrendingUp, AlertCircle, CheckCircle, Clock
} from 'lucide-react'

export default function SchoolDashboard() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['school-dashboard'],
        queryFn: () => api.get('/api/school/dashboard/').then(res => res.data)
    })

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="spinner spinner-lg"></div>
            </div>
        )
    }

    const metrics = [
        {
            label: 'Total Students',
            value: stats?.total_students || 0,
            icon: GraduationCap,
            color: 'blue',
            bgColor: 'bg-blue-50',
            iconColor: 'text-blue-600',
            trend: 'Enrolled students'
        },
        {
            label: 'Total Teachers',
            value: stats?.total_teachers || 0,
            icon: Users,
            color: 'emerald',
            bgColor: 'bg-emerald-50',
            iconColor: 'text-emerald-600',
            trend: 'Active staff'
        },
        {
            label: 'Present Today',
            value: `${stats?.student_attendance_today?.percentage || 0}%`,
            icon: UserCheck,
            color: 'amber',
            bgColor: 'bg-amber-50',
            iconColor: 'text-amber-600',
            trend: `${stats?.student_attendance_today?.present || 0} of ${stats?.student_attendance_today?.total || 0}`
        },
        {
            label: 'Pending Fees',
            value: `₹${(stats?.pending_fees || 0).toLocaleString('en-IN')}`,
            icon: DollarSign,
            color: 'red',
            bgColor: 'bg-red-50',
            iconColor: 'text-red-600',
            trend: 'Collect today'
        },
    ]

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome back! Here's today's overview.</p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {metrics.map((metric, index) => {
                    const Icon = metric.icon
                    return (
                        <div key={index} className="stat-card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                            <div className="flex items-start justify-between">
                                <div className={`p-3 rounded-xl ${metric.bgColor} dark:bg-opacity-20`}>
                                    <Icon className={`w-6 h-6 ${metric.iconColor}`} />
                                </div>
                            </div>
                            <div className="mt-4">
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">{metric.value}</p>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">{metric.label}</p>
                            </div>
                            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                <p className="text-xs text-gray-500 dark:text-gray-400">{metric.trend}</p>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Student Attendance Card */}
                <div className="card bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700">
                    <div className="card-header flex items-center justify-between border-gray-100 dark:border-gray-700">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Student Attendance Today</h3>
                        <span className="badge badge-success">
                            <CheckCircle size={14} className="mr-1" />
                            Updated
                        </span>
                    </div>
                    <div className="card-body">
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-center flex-1">
                                <p className="text-3xl font-bold text-emerald-600">
                                    {stats?.student_attendance_today?.present || 0}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Present</p>
                            </div>
                            <div className="w-px h-12 bg-gray-200 dark:bg-gray-700"></div>
                            <div className="text-center flex-1">
                                <p className="text-3xl font-bold text-red-600">
                                    {stats?.student_attendance_today?.absent || 0}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Absent</p>
                            </div>
                            <div className="w-px h-12 bg-gray-200 dark:bg-gray-700"></div>
                            <div className="text-center flex-1">
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {stats?.student_attendance_today?.total || 0}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                            </div>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                            <div
                                className="progress-gradient h-2.5 rounded-full transition-all duration-700 ease-out"
                                style={{ width: `${stats?.student_attendance_today?.percentage || 0}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                            {stats?.student_attendance_today?.percentage || 0}% attendance rate
                        </p>
                    </div>
                </div>

                {/* Teacher Attendance Card */}
                <div className="card bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700">
                    <div className="card-header flex items-center justify-between border-gray-100 dark:border-gray-700">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Teacher Attendance Today</h3>
                        <span className="badge badge-info">
                            <Clock size={14} className="mr-1" />
                            Live
                        </span>
                    </div>
                    <div className="card-body">
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-center flex-1">
                                <p className="text-3xl font-bold text-emerald-600">
                                    {stats?.teacher_attendance_today?.present || 0}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Present</p>
                            </div>
                            <div className="w-px h-12 bg-gray-200 dark:bg-gray-700"></div>
                            <div className="text-center flex-1">
                                <p className="text-3xl font-bold text-red-600">
                                    {stats?.teacher_attendance_today?.absent || 0}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Absent</p>
                            </div>
                            <div className="w-px h-12 bg-gray-200 dark:bg-gray-700"></div>
                            <div className="text-center flex-1">
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {stats?.teacher_attendance_today?.total || 0}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                            </div>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                            <div
                                className="progress-gradient-blue h-2.5 rounded-full transition-all duration-700 ease-out"
                                style={{ width: `${stats?.teacher_attendance_today?.percentage || 0}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                            {stats?.teacher_attendance_today?.percentage || 0}% attendance rate
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
