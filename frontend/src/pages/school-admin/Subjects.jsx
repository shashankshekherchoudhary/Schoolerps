import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { BookOpen, Plus, Edit2, Trash2, X, AlertCircle, Search, Users } from 'lucide-react'

import { useAuth } from '../../contexts/AuthContext'

export default function Subjects() {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    const term = user?.account_type === 'tuition' ? 'Batch' : 'Class'
    const termPlural = user?.account_type === 'tuition' ? 'Batches' : 'Classes'

    const [showForm, setShowForm] = useState(false)
    const [editingSubject, setEditingSubject] = useState(null)
    const [formData, setFormData] = useState({ name: '', code: '', description: '', classes: [] })
    const [error, setError] = useState('')
    const [searchTerm, setSearchTerm] = useState('')

    const { data: subjects, isLoading } = useQuery({
        queryKey: ['subjects'],
        queryFn: () => api.get('/api/school/subjects/').then(res => res.data)
    })

    const { data: classes } = useQuery({
        queryKey: ['classes'],
        queryFn: () => api.get('/api/school/classes/').then(res => res.data)
    })

    const createMutation = useMutation({
        mutationFn: (data) => api.post('/api/school/subjects/', data),
        onSuccess: () => {
            queryClient.invalidateQueries(['subjects'])
            resetForm()
        },
        onError: (err) => setError(JSON.stringify(err.response?.data) || 'Failed to create')
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => api.patch(`/api/school/subjects/${id}/`, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['subjects'])
            resetForm()
        },
        onError: (err) => setError(JSON.stringify(err.response?.data) || 'Failed to update')
    })

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/api/school/subjects/${id}/`),
        onSuccess: () => queryClient.invalidateQueries(['subjects'])
    })

    const resetForm = () => {
        setShowForm(false)
        setEditingSubject(null)
        setFormData({ name: '', code: '', description: '', classes: [] })
        setError('')
    }

    const handleEdit = (subject) => {
        setEditingSubject(subject)
        setFormData({
            name: subject.name,
            code: subject.code || '',
            description: subject.description || '',
            classes: subject.classes || []
        })
        setShowForm(true)
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        setError('')
        if (editingSubject) {
            updateMutation.mutate({ id: editingSubject.id, data: formData })
        } else {
            createMutation.mutate(formData)
        }
    }

    const toggleClass = (classId) => {
        const current = formData.classes || []
        if (current.includes(classId)) {
            setFormData({ ...formData, classes: current.filter(id => id !== classId) })
        } else {
            setFormData({ ...formData, classes: [...current, classId] })
        }
    }

    const filteredSubjects = subjects?.results?.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.code && s.code.toLowerCase().includes(searchTerm.toLowerCase()))
    ) || []

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="spinner" />
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Subjects</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage subjects and assign them to {termPlural.toLowerCase()}
                    </p>
                </div>
                <button onClick={() => setShowForm(true)} className="btn btn-primary">
                    <Plus className="w-5 h-5" />
                    Add Subject
                </button>
            </div>

            {/* Add/Edit Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    {editingSubject ? 'Edit Subject' : 'Add Subject'}
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
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="label">Subject Name *</label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="e.g., Mathematics"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="label">Subject Code</label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="e.g., MATH"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="label">Description</label>
                                <textarea
                                    className="input"
                                    rows={2}
                                    placeholder="Brief description of the subject"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="label">Assign to {termPlural}</label>
                                <p className="text-xs text-gray-500 mb-2">Select the {termPlural.toLowerCase()} where this subject will be taught</p>
                                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-gray-50 rounded-lg">
                                    {classes?.results?.map(cls => {
                                        const isSelected = formData.classes?.includes(cls.id)
                                        return (
                                            <button
                                                key={cls.id}
                                                type="button"
                                                onClick={() => toggleClass(cls.id)}
                                                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${isSelected
                                                    ? 'bg-primary-50 text-primary-700 border-primary-200'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                {cls.name}
                                            </button>
                                        )
                                    })}
                                    {!classes?.results?.length && (
                                        <p className="text-sm text-gray-500 italic">No {termPlural.toLowerCase()} available</p>
                                    )}
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
                                    {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Subject'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Search & Stats */}
            <div className="card mb-6">
                <div className="p-4 flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                            type="text"
                            className="input pl-10"
                            placeholder="Search subjects..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="text-sm text-gray-500">
                        <span className="font-medium text-gray-900">{subjects?.results?.length || 0}</span> subjects total
                    </div>
                </div>
            </div>

            {/* Subjects Grid */}
            {filteredSubjects.length === 0 ? (
                <div className="card p-12 text-center">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {searchTerm ? 'No subjects found' : 'No Subjects Yet'}
                    </h3>
                    <p className="text-gray-500 mb-4">
                        {searchTerm ? 'Try a different search term' : 'Create subjects to build your curriculum'}
                    </p>
                    {!searchTerm && (
                        <button onClick={() => setShowForm(true)} className="btn btn-primary">
                            <Plus className="w-5 h-5" />
                            Add Subject
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredSubjects.map((subject) => (
                        <div key={subject.id} className="card p-5 hover:shadow-soft transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                                    <BookOpen className="w-5 h-5 text-primary-600" />
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleEdit(subject)}
                                        className="p-1.5 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (confirm('Delete this subject?')) {
                                                deleteMutation.mutate(subject.id)
                                            }
                                        }}
                                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-1">{subject.name}</h3>
                            {subject.code && (
                                <p className="text-xs text-gray-500 mb-2">Code: {subject.code}</p>
                            )}
                            {subject.description && (
                                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{subject.description}</p>
                            )}
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Users className="w-4 h-4" />
                                <span>
                                    {subject.classes_list?.length || 0} {termPlural.toLowerCase()}
                                </span>
                            </div>
                            {subject.classes_list?.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-1">
                                    {subject.classes_list.slice(0, 3).map(cls => (
                                        <span key={cls.id} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                            {cls.name}
                                        </span>
                                    ))}
                                    {subject.classes_list.length > 3 && (
                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                            +{subject.classes_list.length - 3} more
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
