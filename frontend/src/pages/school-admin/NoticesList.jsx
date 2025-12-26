import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { Plus, Bell, Edit, Trash2, Calendar, Users } from 'lucide-react'

export default function NoticesList() {
    const queryClient = useQueryClient()
    const [showForm, setShowForm] = useState(false)
    const [editingNotice, setEditingNotice] = useState(null)
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        target_audience: 'all',
        is_active: true
    })

    const { data: notices, isLoading } = useQuery({
        queryKey: ['notices'],
        queryFn: () => api.get('/api/school/notices/').then(res => res.data)
    })

    const createMutation = useMutation({
        mutationFn: (data) => api.post('/api/school/notices/', data),
        onSuccess: () => {
            queryClient.invalidateQueries(['notices'])
            resetForm()
        }
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => api.patch(`/api/school/notices/${id}/`, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['notices'])
            resetForm()
        }
    })

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/api/school/notices/${id}/`),
        onSuccess: () => queryClient.invalidateQueries(['notices'])
    })

    const resetForm = () => {
        setShowForm(false)
        setEditingNotice(null)
        setFormData({ title: '', content: '', target_audience: 'all', is_active: true })
    }

    const handleEdit = (notice) => {
        setEditingNotice(notice)
        setFormData({
            title: notice.title,
            content: notice.content,
            target_audience: notice.target_audience || 'all',
            is_active: notice.is_active
        })
        setShowForm(true)
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (editingNotice) {
            updateMutation.mutate({ id: editingNotice.id, data: formData })
        } else {
            createMutation.mutate(formData)
        }
    }

    if (isLoading) {
        return <div className="loading-container"><div className="spinner"></div></div>
    }

    return (
        <div>
            <div className="page-header flex justify-between items-center">
                <div>
                    <h1 className="page-title">Notices</h1>
                    <p className="page-subtitle">Manage school announcements</p>
                </div>
                <button onClick={() => setShowForm(true)} className="btn btn-primary">
                    <Plus size={20} /> New Notice
                </button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">
                            {editingNotice ? 'Edit Notice' : 'New Notice'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content</label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    className="input"
                                    rows={4}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Audience</label>
                                <select
                                    value={formData.target_audience}
                                    onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                                    className="select"
                                >
                                    <option value="all">All</option>
                                    <option value="teachers">Teachers Only</option>
                                    <option value="students">Students Only</option>
                                    <option value="parents">Parents Only</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                />
                                <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-gray-300">Active</label>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={resetForm} className="btn btn-secondary flex-1">
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary flex-1">
                                    {editingNotice ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Notices List */}
            <div className="space-y-4">
                {notices?.results?.length === 0 && (
                    <div className="card p-12 text-center">
                        <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Notices Yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">Create your first notice to get started</p>
                        <button onClick={() => setShowForm(true)} className="btn btn-primary">
                            <Plus size={20} /> Create Notice
                        </button>
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
                                        {notice.target_audience || 'All'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEdit(notice)}
                                    className="btn btn-sm btn-secondary"
                                >
                                    <Edit size={16} />
                                </button>
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
