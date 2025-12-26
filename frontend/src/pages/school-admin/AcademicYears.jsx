import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { Calendar, Plus, Check, Edit2, Trash2, X, AlertCircle } from 'lucide-react'

export default function AcademicYears() {
    const queryClient = useQueryClient()
    const [showForm, setShowForm] = useState(false)
    const [editingYear, setEditingYear] = useState(null)
    const [formData, setFormData] = useState({ name: '', start_date: '', end_date: '' })
    const [error, setError] = useState('')

    const { data: years, isLoading } = useQuery({
        queryKey: ['academic-years'],
        queryFn: () => api.get('/api/school/academic-years/').then(res => res.data)
    })

    const createMutation = useMutation({
        mutationFn: (data) => api.post('/api/school/academic-years/', data),
        onSuccess: () => {
            queryClient.invalidateQueries(['academic-years'])
            resetForm()
        },
        onError: (err) => setError(JSON.stringify(err.response?.data) || 'Failed to create')
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => api.patch(`/api/school/academic-years/${id}/`, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['academic-years'])
            resetForm()
        },
        onError: (err) => setError(JSON.stringify(err.response?.data) || 'Failed to update')
    })

    const setActiveMutation = useMutation({
        mutationFn: (id) => api.post(`/api/school/academic-years/${id}/set_current/`),
        onSuccess: () => queryClient.invalidateQueries(['academic-years'])
    })

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/api/school/academic-years/${id}/`),
        onSuccess: () => queryClient.invalidateQueries(['academic-years'])
    })

    const resetForm = () => {
        setShowForm(false)
        setEditingYear(null)
        setFormData({ name: '', start_date: '', end_date: '' })
        setError('')
    }

    const handleEdit = (year) => {
        setEditingYear(year)
        setFormData({
            name: year.name,
            start_date: year.start_date,
            end_date: year.end_date
        })
        setShowForm(true)
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        setError('')
        if (editingYear) {
            updateMutation.mutate({ id: editingYear.id, data: formData })
        } else {
            createMutation.mutate(formData)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="spinner" />
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Academic Years</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage academic year periods for your school
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="btn btn-primary"
                >
                    <Plus className="w-5 h-5" />
                    Add Academic Year
                </button>
            </div>

            {/* Add/Edit Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    {editingYear ? 'Edit Academic Year' : 'Add Academic Year'}
                                </h2>
                                <button onClick={resetForm} className="text-gray-500 hover:text-gray-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}
                            <div>
                                <label className="label">Year Name</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="e.g., 2024-25"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Start Date</label>
                                    <input
                                        type="date"
                                        className="input"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">End Date</label>
                                    <input
                                        type="date"
                                        className="input"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={resetForm} className="btn btn-secondary flex-1">
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary flex-1"
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                >
                                    {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Academic Years List */}
            <div className="space-y-4">
                {years?.results?.length === 0 && (
                    <div className="card p-12 text-center">
                        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Academic Years</h3>
                        <p className="text-gray-500 mb-4">Get started by creating your first academic year</p>
                        <button onClick={() => setShowForm(true)} className="btn btn-primary">
                            <Plus className="w-5 h-5" />
                            Add Academic Year
                        </button>
                    </div>
                )}

                {years?.results?.map((year) => (
                    <div
                        key={year.id}
                        className={`card p-6 transition-all ${year.is_active ? 'ring-2 ring-primary-500 bg-primary-50/30' : ''}`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${year.is_active ? 'bg-primary-100' : 'bg-gray-100'}`}>
                                    <Calendar className={`w-6 h-6 ${year.is_active ? 'text-primary-600' : 'text-gray-500'}`} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-semibold text-gray-900">{year.name}</h3>
                                        {year.is_active && (
                                            <span className="badge badge-success">
                                                <Check className="w-3 h-3 mr-1" />
                                                Active
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        {new Date(year.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        {' — '}
                                        {new Date(year.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {!year.is_active && (
                                    <button
                                        onClick={() => setActiveMutation.mutate(year.id)}
                                        className="btn btn-sm btn-secondary"
                                        disabled={setActiveMutation.isPending}
                                    >
                                        Set Active
                                    </button>
                                )}
                                <button
                                    onClick={() => handleEdit(year)}
                                    className="p-2 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => {
                                        if (confirm('Are you sure you want to delete this academic year?')) {
                                            deleteMutation.mutate(year.id)
                                        }
                                    }}
                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    disabled={year.is_active}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
