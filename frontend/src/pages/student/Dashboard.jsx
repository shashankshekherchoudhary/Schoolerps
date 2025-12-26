import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { User, UserCheck, DollarSign, FileText, Bell } from 'lucide-react'

export default function StudentDashboard() {
    const { data: profile, isLoading } = useQuery({
        queryKey: ['student-profile'],
        queryFn: () => api.get('/api/school/student/profile/').then(res => res.data)
    })

    const { data: attendance } = useQuery({
        queryKey: ['student-attendance'],
        queryFn: () => api.get('/api/attendance/student/history/').then(res => res.data)
    })

    const { data: fees } = useQuery({
        queryKey: ['student-fees'],
        queryFn: () => api.get('/api/fees/student/').then(res => res.data)
    })

    if (isLoading) return <div className="loading-container"><div className="spinner"></div></div>

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Welcome, {profile?.student?.full_name}</h1>
                <p className="page-subtitle">{profile?.student?.class_name || 'Class not assigned'}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Link to="/student/profile" className="stat-card hover:shadow-md transition-shadow">
                    <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 w-fit mb-3">
                        <User size={24} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="font-medium text-gray-900 dark:text-white">My Profile</div>
                </Link>
                <Link to="/student/attendance" className="stat-card hover:shadow-md transition-shadow">
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 w-fit mb-3">
                        <UserCheck size={24} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{attendance?.summary?.percentage || 0}%</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Attendance</div>
                </Link>
                <Link to="/student/fees" className="stat-card hover:shadow-md transition-shadow">
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 w-fit mb-3">
                        <DollarSign size={24} className="text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">₹{fees?.summary?.total_balance || 0}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Pending Fees</div>
                </Link>
                <Link to="/student/results" className="stat-card hover:shadow-md transition-shadow">
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 w-fit mb-3">
                        <FileText size={24} className="text-red-600 dark:text-red-400" />
                    </div>
                    <div className="font-medium text-gray-900 dark:text-white">View Results</div>
                </Link>
            </div>

            {profile?.class_teacher && (
                <div className="card mb-6">
                    <div className="card-header border-b border-gray-100 dark:border-gray-700">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Class Teacher</h3>
                    </div>
                    <div className="card-body">
                        <p className="font-medium text-gray-900 dark:text-white">{profile.class_teacher.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{profile.class_teacher.email} | {profile.class_teacher.phone}</p>
                    </div>
                </div>
            )}

            {profile?.subject_teachers?.length > 0 && (
                <div className="card">
                    <div className="card-header border-b border-gray-100 dark:border-gray-700">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Subject Teachers</h3>
                    </div>
                    <div className="card-body p-0">
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Subject</th>
                                        <th>Teacher</th>
                                        <th>Contact</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {profile.subject_teachers.map((t, idx) => (
                                        <tr key={idx}>
                                            <td className="font-medium text-gray-900 dark:text-white">{t.subject}</td>
                                            <td className="text-gray-600 dark:text-gray-300">{t.teacher_name}</td>
                                            <td className="text-gray-600 dark:text-gray-300">{t.phone}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
