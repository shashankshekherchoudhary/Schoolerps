import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { Plus, Edit, Search, Users, Mail, BookOpen, MoreVertical, Upload, Trash2, Ban, CheckCircle } from 'lucide-react'

export default function TeachersList() {
    const [searchTerm, setSearchTerm] = useState('')

    const { data: teachers, isLoading, refetch } = useQuery({
        queryKey: ['teachers'],
        queryFn: () => api.get('/api/school/teachers/').then(res => res.data)
    })

    const handleToggleStatus = async (teacherId, currentStatus) => {
        try {
            await api.post(`/api/school/teachers/${teacherId}/toggle_active/`)
            refetch()
        } catch (error) {
            console.error('Failed to toggle status', error)
            alert('Failed to update teacher status')
        }
    }

    const handleDelete = async (teacherId) => {
        if (window.confirm('Are you sure you want to delete this teacher? This action cannot be undone.')) {
            try {
                await api.delete(`/api/school/teachers/${teacherId}/`)
                refetch()
            } catch (error) {
                console.error('Failed to delete teacher', error)
                alert('Failed to delete teacher')
            }
        }
    }

    const filteredTeachers = teachers?.results?.filter(t =>
        t.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || []

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="spinner" />
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Teachers</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Manage teacher accounts and profiles
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link to="/school/teachers/import" className="btn btn-secondary">
                        <Upload className="w-5 h-5" />
                        Import
                    </Link>
                    <Link to="/school/teachers/new" className="btn btn-primary">
                        <Plus className="w-5 h-5" />
                        Add Teacher
                    </Link>
                </div>
            </div>

            {/* Search & Stats */}
            <div className="card mb-6">
                <div className="p-4 flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                            type="text"
                            className="input pl-10"
                            placeholder="Search by name, email, or employee ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span><span className="font-medium text-gray-900 dark:text-white">{teachers?.results?.length || 0}</span> teachers</span>
                        <span><span className="font-medium text-emerald-600">{teachers?.results?.filter(t => t.is_active).length || 0}</span> active</span>
                    </div>
                </div>
            </div>

            {/* Empty State */}
            {teachers?.results?.length === 0 && (
                <div className="card p-12 text-center">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Teachers Yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">Add your first teacher to get started</p>
                    <Link to="/school/teachers/new" className="btn btn-primary">
                        <Plus className="w-5 h-5" />
                        Add Teacher
                    </Link>
                </div>
            )}

            {/* Teachers Table */}
            {filteredTeachers.length > 0 && (
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Teacher</th>
                                    <th>Employee ID</th>
                                    <th>Subjects</th>
                                    <th>Status</th>
                                    <th className="w-40">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTeachers.map((teacher) => (
                                    <tr key={teacher.id}>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                                                    {teacher.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">{teacher.full_name}</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                        <Mail className="w-3 h-3" />
                                                        {teacher.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="text-gray-600 dark:text-gray-300">{teacher.employee_id || '—'}</span>
                                        </td>
                                        <td>
                                            <div className="flex flex-wrap gap-1 max-w-xs">
                                                {teacher.subjects_list?.slice(0, 3).map((s, idx) => (
                                                    <span key={idx} className="px-2 py-0.5 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs rounded font-medium">
                                                        {s.name}
                                                    </span>
                                                ))}
                                                {teacher.subjects_list?.length > 3 && (
                                                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded">
                                                        +{teacher.subjects_list.length - 3}
                                                    </span>
                                                )}
                                                {!teacher.subjects_list?.length && (
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">No subjects</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${teacher.is_active ? 'badge-success' : 'badge-danger'}`}>
                                                {teacher.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleToggleStatus(teacher.id, teacher.is_active)}
                                                    className={`btn btn-sm ${teacher.is_active ? 'btn-danger' : 'btn-success'}`}
                                                    title={teacher.is_active ? 'Disable Teacher' : 'Activate Teacher'}
                                                >
                                                    {teacher.is_active ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                                </button>
                                                <Link
                                                    to={`/school/teachers/${teacher.id}`}
                                                    className="btn btn-sm btn-secondary"
                                                    title="Edit Teacher"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(teacher.id)}
                                                    className="btn btn-sm btn-danger"
                                                    title="Delete Teacher"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* No Results */}
            {searchTerm && filteredTeachers.length === 0 && teachers?.results?.length > 0 && (
                <div className="card p-8 text-center">
                    <Search className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No results found</h3>
                    <p className="text-gray-500 dark:text-gray-400">Try a different search term</p>
                </div>
            )}
        </div>
    )
}
