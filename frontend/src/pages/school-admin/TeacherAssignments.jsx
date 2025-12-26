import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { Users, BookOpen, Plus, X, AlertCircle, Trash2, Search } from 'lucide-react'

export default function TeacherAssignments() {
    const queryClient = useQueryClient()
    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState({
        teacher: '',
        subject: '',
        section: '',
        academic_year: ''
    })
    const [selectedClass, setSelectedClass] = useState('')
    const [error, setError] = useState('')
    const [searchTerm, setSearchTerm] = useState('')

    const { data: assignments, isLoading } = useQuery({
        queryKey: ['subject-teachers'],
        queryFn: () => api.get('/api/school/subject-teachers/').then(res => res.data)
    })

    const { data: teachers } = useQuery({
        queryKey: ['teachers'],
        queryFn: () => api.get('/api/school/teachers/').then(res => res.data)
    })

    const { data: subjects } = useQuery({
        queryKey: ['subjects'],
        queryFn: () => api.get('/api/school/subjects/').then(res => res.data)
    })

    const { data: classes } = useQuery({
        queryKey: ['classes'],
        queryFn: () => api.get('/api/school/classes/').then(res => res.data)
    })

    const { data: academicYears } = useQuery({
        queryKey: ['academic-years'],
        queryFn: () => api.get('/api/school/academic-years/').then(res => res.data)
    })

    // Get sections for selected class
    const selectedClassData = classes?.results?.find(c => c.id === parseInt(selectedClass))
    const sections = selectedClassData?.sections || []

    // Get current academic year
    const currentAcademicYear = academicYears?.results?.find(y => y.is_current)

    const createMutation = useMutation({
        mutationFn: (data) => api.post('/api/school/subject-teachers/', data),
        onSuccess: () => {
            queryClient.invalidateQueries(['subject-teachers'])
            resetForm()
        },
        onError: (err) => {
            const errorData = err.response?.data
            if (typeof errorData === 'object') {
                const messages = Object.entries(errorData)
                    .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
                    .join('; ')
                setError(messages)
            } else {
                setError('Failed to create assignment')
            }
        }
    })

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/api/school/subject-teachers/${id}/`),
        onSuccess: () => queryClient.invalidateQueries(['subject-teachers'])
    })

    const resetForm = () => {
        setShowForm(false)
        setFormData({ teacher: '', subject: '', section: '', academic_year: '' })
        setSelectedClass('')
        setError('')
    }

    const openForm = () => {
        // Pre-select current academic year
        setFormData(prev => ({
            ...prev,
            academic_year: currentAcademicYear?.id || ''
        }))
        setShowForm(true)
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        setError('')

        // Validate
        if (!formData.section) {
            setError('Please select a section')
            return
        }
        if (!formData.academic_year) {
            setError('Please select an academic year')
            return
        }

        createMutation.mutate(formData)
    }

    // Group assignments by teacher
    const groupedByTeacher = {}
    assignments?.results?.forEach(a => {
        const teacherId = a.teacher
        if (!groupedByTeacher[teacherId]) {
            groupedByTeacher[teacherId] = {
                teacher: a.teacher_name,
                assignments: []
            }
        }
        groupedByTeacher[teacherId].assignments.push(a)
    })

    const filteredTeachers = Object.values(groupedByTeacher).filter(t =>
        t.teacher?.toLowerCase().includes(searchTerm.toLowerCase())
    )

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
                    <h1 className="text-2xl font-bold text-gray-900">Teacher Assignments</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Assign teachers to subjects and sections
                    </p>
                </div>
                <button onClick={openForm} className="btn btn-primary">
                    <Plus className="w-5 h-5" />
                    New Assignment
                </button>
            </div>

            {/* Add Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Assign Teacher to Subject
                                </h2>
                                <button onClick={resetForm} className="text-gray-500 hover:text-gray-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm text-red-700">
                                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Academic Year */}
                            <div>
                                <label className="label">Academic Year *</label>
                                <select
                                    className="select"
                                    value={formData.academic_year}
                                    onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                                    required
                                >
                                    <option value="">Select academic year</option>
                                    {academicYears?.results?.map(y => (
                                        <option key={y.id} value={y.id}>
                                            {y.name} {y.is_current ? '(Current)' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Teacher */}
                            <div>
                                <label className="label">Teacher *</label>
                                <select
                                    className="select"
                                    value={formData.teacher}
                                    onChange={(e) => setFormData({ ...formData, teacher: e.target.value, subject: '' })}
                                    required
                                >
                                    <option value="">Select a teacher</option>
                                    {teachers?.results?.map(t => (
                                        <option key={t.id} value={t.id}>{t.full_name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Subject */}
                            <div>
                                <label className="label">Subject *</label>
                                <select
                                    className="select"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    required
                                    disabled={!formData.teacher}
                                >
                                    <option value="">Select a subject</option>
                                    {(() => {
                                        // Find selected teacher's subjects
                                        const selectedTeacher = teachers?.results?.find(t => t.id === parseInt(formData.teacher))
                                        const teacherSubjects = selectedTeacher?.subjects_list || []

                                        if (teacherSubjects.length === 0 && formData.teacher) {
                                            return <option disabled>No subjects assigned to this teacher</option>
                                        }

                                        return teacherSubjects.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))
                                    })()}
                                </select>
                                {!formData.teacher && (
                                    <p className="text-xs text-gray-500 mt-1">Select a teacher first</p>
                                )}
                            </div>

                            {/* Class (for section selection) */}
                            <div>
                                <label className="label">Class *</label>
                                <select
                                    className="select"
                                    value={selectedClass}
                                    onChange={(e) => {
                                        setSelectedClass(e.target.value)
                                        setFormData({ ...formData, section: '' })
                                    }}
                                    required
                                >
                                    <option value="">Select a class</option>
                                    {classes?.results?.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Section */}
                            <div>
                                <label className="label">Section *</label>
                                <select
                                    className="select"
                                    value={formData.section}
                                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                                    required
                                    disabled={!selectedClass}
                                >
                                    <option value="">Select a section</option>
                                    {sections.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                                {!selectedClass && (
                                    <p className="text-xs text-gray-500 mt-1">Select a class first</p>
                                )}
                                {selectedClass && sections.length === 0 && (
                                    <p className="text-xs text-amber-600 mt-1">No sections in this class. Add sections first.</p>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={resetForm} className="btn btn-secondary flex-1">
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary flex-1"
                                    disabled={createMutation.isPending}
                                >
                                    {createMutation.isPending ? 'Assigning...' : 'Assign'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Info Banner */}
            {!currentAcademicYear && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <p className="text-sm text-amber-800">
                        No active academic year set. Please go to <strong>Academic Years</strong> and set one as current.
                    </p>
                </div>
            )}

            {/* Search */}
            <div className="card mb-6">
                <div className="p-4 flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                            type="text"
                            className="input pl-10"
                            placeholder="Search by teacher name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="text-sm text-gray-500">
                        <span className="font-medium text-gray-900">{assignments?.results?.length || 0}</span> assignments
                    </div>
                </div>
            </div>

            {/* Empty State */}
            {Object.keys(groupedByTeacher).length === 0 && (
                <div className="card p-12 text-center">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Assignments Yet</h3>
                    <p className="text-gray-500 mb-4">Assign teachers to subjects and sections</p>
                    <button onClick={openForm} className="btn btn-primary">
                        <Plus className="w-5 h-5" />
                        New Assignment
                    </button>
                </div>
            )}

            {/* Assignments by Teacher */}
            <div className="space-y-4">
                {filteredTeachers.map((group, idx) => (
                    <div key={idx} className="card overflow-hidden">
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                                <Users className="w-5 h-5 text-primary-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">{group.teacher}</h3>
                                <p className="text-xs text-gray-500">{group.assignments.length} subject{group.assignments.length !== 1 ? 's' : ''} assigned</p>
                            </div>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {group.assignments.map(a => (
                                <div key={a.id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50">
                                    <div className="flex items-center gap-3">
                                        <BookOpen className="w-4 h-4 text-gray-500" />
                                        <span className="text-sm font-medium text-gray-900">{a.subject_name}</span>
                                        <span className="text-xs text-gray-500">→</span>
                                        <span className="px-2 py-0.5 bg-primary-50 text-primary-700 text-xs rounded font-medium">
                                            {a.section_name}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (confirm('Remove this assignment?')) {
                                                deleteMutation.mutate(a.id)
                                            }
                                        }}
                                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
