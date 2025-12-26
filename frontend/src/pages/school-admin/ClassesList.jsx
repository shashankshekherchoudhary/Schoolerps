import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { useNavigate } from 'react-router-dom'
import { Plus, BookOpen, Users, Edit2, Trash2, X, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react'

import { useAuth } from '../../contexts/AuthContext'

export default function ClassesList() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    // Terminology
    const term = user?.account_type === 'tuition' ? 'Batch' : 'Class'
    const termPlural = user?.account_type === 'tuition' ? 'Batches' : 'Classes'
    const sectionTerm = user?.account_type === 'tuition' ? 'Group' : 'Section'

    const [showClassForm, setShowClassForm] = useState(false)
    const [editingSection, setEditingSection] = useState(null)
    const [newClassName, setNewClassName] = useState('')
    const [newSectionName, setNewSectionName] = useState('')
    const [addingSectionTo, setAddingSectionTo] = useState(null)
    const [error, setError] = useState('')
    const [expandedClasses, setExpandedClasses] = useState({})

    const { data: classes, isLoading } = useQuery({
        queryKey: ['classes'],
        queryFn: () => api.get('/api/school/classes/').then(res => res.data)
    })

    const createClassMutation = useMutation({
        mutationFn: (data) => api.post('/api/school/classes/', data),
        onSuccess: () => {
            queryClient.invalidateQueries(['classes'])
            setShowClassForm(false)
            setNewClassName('')
            setError('')
        },
        onError: (err) => setError(err.response?.data?.name?.[0] || `Failed to create ${term.toLowerCase()}`)
    })

    const addSectionMutation = useMutation({
        mutationFn: ({ classId, name }) => api.post(`/api/school/classes/${classId}/add_section/`, { name }),
        onSuccess: () => {
            queryClient.invalidateQueries(['classes'])
            setAddingSectionTo(null)
            setNewSectionName('')
        },
        onError: (err) => setError(err.response?.data?.name?.[0] || `Failed to add ${sectionTerm.toLowerCase()}`)
    })

    const deleteClassMutation = useMutation({
        mutationFn: (id) => api.delete(`/api/school/classes/${id}/`),
        onSuccess: () => queryClient.invalidateQueries(['classes'])
    })

    const deleteSectionMutation = useMutation({
        mutationFn: (id) => api.delete(`/api/school/sections/${id}/`),
        onSuccess: () => queryClient.invalidateQueries(['classes'])
    })

    const handleCreateClass = (e) => {
        e.preventDefault()
        if (!newClassName.trim()) return
        setError('')
        createClassMutation.mutate({ name: newClassName })
    }

    const handleAddSection = (classId) => {
        if (!newSectionName.trim()) return
        setError('')
        addSectionMutation.mutate({ classId, name: newSectionName })
    }

    const toggleExpanded = (classId) => {
        setExpandedClasses(prev => ({
            ...prev,
            [classId]: !prev[classId]
        }))
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
                    <h1 className="text-2xl font-bold text-gray-900">{termPlural} & {sectionTerm}s</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage {termPlural.toLowerCase()} and their {sectionTerm.toLowerCase()}s
                    </p>
                </div>
                <button onClick={() => setShowClassForm(true)} className="btn btn-primary">
                    <Plus className="w-5 h-5" />
                    Add {term}
                </button>
            </div>

            {/* Add Class Modal */}
            {showClassForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">Add New {term}</h2>
                                <button onClick={() => { setShowClassForm(false); setError('') }} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <form onSubmit={handleCreateClass} className="p-6 space-y-4">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}
                            <div>
                                <label className="label text-gray-700">{term} Name</label>
                                <input
                                    type="text"
                                    className="input bg-white text-gray-900 border-gray-300"
                                    placeholder={`e.g., ${term} 1, ${term} A`}
                                    value={newClassName}
                                    onChange={(e) => setNewClassName(e.target.value)}
                                    autoFocus
                                    required
                                />
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => { setShowClassForm(false); setError('') }} className="btn btn-secondary flex-1">
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary flex-1" disabled={createClassMutation.isPending}>
                                    {createClassMutation.isPending ? 'Creating...' : `Create ${term}`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!classes?.results?.length && (
                <div className="card p-12 text-center">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No {termPlural} Yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">Create your first {term.toLowerCase()} to get started</p>
                    <button onClick={() => setShowClassForm(true)} className="btn btn-primary">
                        <Plus className="w-5 h-5" />
                        Add {term}
                    </button>
                </div>
            )}

            {/* Classes List */}
            <div className="space-y-3">
                {classes?.results?.map((cls) => (
                    <div key={cls.id} className="card overflow-hidden">
                        {/* Class Header */}
                        <div
                            className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                            onClick={() => toggleExpanded(cls.id)}
                        >
                            <div className="flex items-center gap-4">
                                <button className="text-gray-400">
                                    {expandedClasses[cls.id] ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                                </button>
                                <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                                    <BookOpen className="w-5 h-5 text-primary-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">{cls.name}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {cls.sections?.length || 0} section{cls.sections?.length !== 1 ? 's' : ''} • {cls.student_count || 0} students
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <button
                                    onClick={() => setAddingSectionTo(cls.id)}
                                    className="btn btn-sm btn-secondary"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Section
                                </button>
                                <button
                                    onClick={() => {
                                        if (confirm(`Delete "${cls.name}" and all its sections?`)) {
                                            deleteClassMutation.mutate(cls.id)
                                        }
                                    }}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Sections (expandable) */}
                        {expandedClasses[cls.id] && (
                            <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                                {cls.sections?.length > 0 ? (
                                    <div className="divide-y divide-gray-100">
                                        {cls.sections.map((section) => (
                                            <div
                                                key={section.id}
                                                className="px-6 py-3 flex items-center justify-between ml-14 cursor-pointer hover:bg-white dark:hover:bg-gray-800 transition-colors"
                                                onClick={() => navigate(`/school/classes/${cls.id}/sections/${section.id}`)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300">
                                                        {section.name}
                                                    </span>
                                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                                        Section {section.name}
                                                    </span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        • {section.student_count || 0} students
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        if (confirm(`Delete Section ${section.name}?`)) {
                                                            deleteSectionMutation.mutate(section.id)
                                                        }
                                                    }}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="px-6 py-4 ml-14 text-sm text-gray-500 italic">
                                        No sections yet. Add a section to this class.
                                    </div>
                                )}

                                {/* Add Section Form (inline) */}
                                {addingSectionTo === cls.id && (
                                    <div className="px-6 py-3 ml-14 flex items-center gap-2 border-t border-gray-200 bg-white">
                                        <input
                                            type="text"
                                            className="input flex-1"
                                            placeholder="Section name (e.g., A, B, C)"
                                            value={newSectionName}
                                            onChange={(e) => setNewSectionName(e.target.value)}
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => handleAddSection(cls.id)}
                                            className="btn btn-primary btn-sm"
                                            disabled={addSectionMutation.isPending}
                                        >
                                            Add
                                        </button>
                                        <button
                                            onClick={() => { setAddingSectionTo(null); setNewSectionName('') }}
                                            className="btn btn-secondary btn-sm"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
