import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { BookOpen, Users, UserCheck, ClipboardList, Clock, FileText, ChevronRight, Megaphone, Plus } from 'lucide-react'

export default function TeacherDashboard() {
    const { data, isLoading } = useQuery({
        queryKey: ['teacher-dashboard'],
        queryFn: () => api.get('/api/school/teacher/dashboard/').then(res => res.data)
    })

    if (isLoading) return <div className="loading-container"><div className="spinner"></div></div>

    const isTuitionOwner = !!data?.tuition_stats

    return (
        <div className="space-y-8">
            <div className="page-header">
                <h1 className="page-title">{isTuitionOwner ? 'Tuition Dashboard' : 'Teacher Dashboard'}</h1>
                <p className="page-subtitle">Welcome back, {data?.teacher?.full_name}</p>
            </div>

            {/* TUITION STATS */}
            {isTuitionOwner && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="card p-5 border-l-4 border-l-blue-500">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                <Users size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Students</p>
                                <h3 className="text-2xl font-bold text-gray-900">{data.tuition_stats.total_students}</h3>
                            </div>
                        </div>
                    </div>
                    <div className="card p-5 border-l-4 border-l-emerald-500">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                                <BookOpen size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Batches</p>
                                <h3 className="text-2xl font-bold text-gray-900">{data.tuition_stats.total_batches}</h3>
                            </div>
                        </div>
                    </div>
                    <div className="card p-5 border-l-4 border-l-purple-500">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                                <FileText size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Subjects</p>
                                <h3 className="text-2xl font-bold text-gray-900">{data.tuition_stats.total_subjects}</h3>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CLASS TEACHER SECTION */}
            {data?.class_teacher_of && (
                <div className="card border-t-4 border-t-emerald-500">
                    <div className="card-header flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Users className="text-emerald-600" size={20} />
                                {isTuitionOwner ? 'Assigned Batch' : 'Class Teacher'} - {data.class_teacher_of.section}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Class In-Charge • {data.class_teacher_of.student_count} Students</p>
                        </div>
                        <div className="flex gap-2">
                            <Link
                                to={`/teacher/notices/create?scope=class&section=${data.class_teacher_of.id}`}
                                className="btn btn-sm btn-secondary"
                            >
                                <Megaphone size={16} /> Batch Notice
                            </Link>
                            <Link to="/teacher/attendance" className="btn btn-sm btn-primary">
                                <Clock size={16} /> Mark Attendance
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* SUBJECT TEACHER SECTION */}
            <div className="card border-t-4 border-t-blue-500">
                <div className="card-header">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <BookOpen className="text-blue-600" size={20} />
                        My Subjects
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage marks and notices for your assigned {isTuitionOwner ? 'batches' : 'classes'}</p>
                </div>
                <div className="card-body p-0">
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>{isTuitionOwner ? 'Batch' : 'Class & Section'}</th>
                                    <th>Subject</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data?.subject_assignments?.map((a, idx) => (
                                    <tr key={idx}>
                                        <td className="font-medium text-gray-900 dark:text-white">{a.section}</td>
                                        <td className="text-gray-600 dark:text-gray-300">{a.subject}</td>
                                        <td className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link
                                                    to={`/teacher/notices/create?scope=subject&section=${a.section_id}&subject=${a.subject_id}`}
                                                    className="btn btn-sm btn-secondary"
                                                    title="Send Subject Notice"
                                                >
                                                    <Megaphone size={14} /> Notice
                                                </Link>
                                                <Link
                                                    to={`/teacher/marks?section=${a.section_id}&subject=${a.subject_id}`}
                                                    className="btn btn-sm btn-secondary"
                                                    title="Enter Marks"
                                                >
                                                    <FileText size={14} /> Marks
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!data?.subject_assignments?.length && (
                                    <tr>
                                        <td colSpan={3} className="text-center py-8 text-gray-500 dark:text-gray-400">
                                            No subjects assigned yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
