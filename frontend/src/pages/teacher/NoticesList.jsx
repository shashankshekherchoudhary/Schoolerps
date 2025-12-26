import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { Plus, Bell, Edit, Trash2, Calendar, Users, Eye } from 'lucide-react'

export default function TeacherNoticesList() {
    const queryClient = useQueryClient()

    // Using the same endpoint as School Admin but permissions filtered on backend
    const { data: notices, isLoading } = useQuery({
        queryKey: ['teacher-notices'],
        queryFn: () => api.get('/api/school/notices/').then(res => res.data)
    })

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/api/school/notices/${id}/`),
        onSuccess: () => queryClient.invalidateQueries(['teacher-notices'])
    })

    if (isLoading) {
        return <div className="loading-container"><div className="spinner"></div></div>
    }

    return (
        <div>
            <div className="page-header flex justify-between items-center">
                <div>
                    <h1 className="page-title">My Notices</h1>
                    <p className="page-subtitle">Announcements created by you</p>
                </div>
                <div className="flex gap-2">
                    <Link to="/teacher/notices/create?scope=class" className="btn btn-secondary">
                        <Plus size={20} /> Class Notice
                    </Link>
                    <Link to="/teacher/notices/create?scope=subject" className="btn btn-primary">
                        <Plus size={20} /> Subject Notice
                    </Link>
                </div>
            </div>

            <div className="space-y-4">
                {notices?.results?.length === 0 && (
                    <div className="card p-12 text-center">
                        <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Notices Yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">Create your first notice to communicate with students.</p>
                    </div>
                )}

                {notices?.results?.map((notice) => (
                    <div key={notice.id} className="card p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{notice.title}</h3>
                                    <span className={`badge ${notice.is_active ? 'badge-success' : 'badge-danger'}`}>
                                        {notice.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <p className="text-gray-600 dark:text-gray-300 mb-3">{notice.content}</p>
                                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <Calendar size={14} />
                                        {new Date(notice.created_at).toLocaleDateString()}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Users size={14} />
                                        {notice.target_audience}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        if (confirm('Delete this notice?')) {
                                            deleteMutation.mutate(notice.id)
                                        }
                                    }}
                                    className="btn btn-sm btn-secondary text-red-600 hover:bg-red-50"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
