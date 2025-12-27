import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Users, BookOpen, User, Search, Mail, Phone, GraduationCap, Edit2, X, AlertCircle } from 'lucide-react'
import api from '../../services/api'

export default function ClassSectionDetails() {
    const { classId, sectionId } = useParams()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [activeTab, setActiveTab] = useState('students')
    const [searchTerm, setSearchTerm] = useState('')
    const [showTeacherModal, setShowTeacherModal] = useState(false)
    const [selectedTeacher, setSelectedTeacher] = useState('')
    const [error, setError] = useState('')

    // Fetch Section Details
    const { data: section, isLoading: sectionLoading } = useQuery({
        queryKey: ['section', sectionId],
        queryFn: () => api.get(`/api/school/sections/${sectionId}/`).then(res => res.data)
    })

    // Fetch Class Teacher
    const { data: classTeacher, refetch: refetchClassTeacher } = useQuery({
        queryKey: ['class-teacher', sectionId],
        queryFn: () => api.get('/api/school/class-teachers/', { params: { section: sectionId } }).then(res => res.data[0])
    })

    // Fetch Teachers
    const { data: teachers } = useQuery({
        queryKey: ['teachers'],
        queryFn: () => api.get('/api/school/teachers/').then(res => res.data)
    })

    // Fetch Academic Years
    const { data: academicYears } = useQuery({
        queryKey: ['academic-years'],
        queryFn: () => api.get('/api/school/academic-years/').then(res => res.data)
    })

    // Fetch Students
    const { data: students, isLoading: studentsLoading } = useQuery({
        queryKey: ['students', { section: sectionId }],
        queryFn: () => api.get('/api/school/students/', { params: { section: sectionId, status: 'active' } }).then(res => res.data)
    })

    // Fetch Subject Allocations
    const { data: subjectTeachers, isLoading: subjectsLoading } = useQuery({
        queryKey: ['subject-teachers', { section: sectionId }],
        queryFn: () => api.get('/api/school/subject-teachers/', { params: { section: sectionId } }).then(res => res.data)
    })

    const currentAcademicYear = academicYears?.results?.find(y => y.is_current)

    // Assign Class Teacher Mutation
    const assignMutation = useMutation({
        mutationFn: (data) => {
            if (classTeacher?.id) {
                // Update existing
                return api.patch(`/api/school/class-teachers/${classTeacher.id}/`, data)
            }
            // Create new
            return api.post('/api/school/class-teachers/', data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['class-teacher', sectionId])
            setShowTeacherModal(false)
            setSelectedTeacher('')
            setError('')
        },
        onError: (err) => {
            setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Failed to assign class teacher')
        }
    })

    // Remove Class Teacher Mutation
    const removeMutation = useMutation({
        mutationFn: () => api.delete(`/api/school/class-teachers/${classTeacher.id}/`),
        onSuccess: () => {
            queryClient.invalidateQueries(['class-teacher', sectionId])
        }
    })

    const handleAssignClassTeacher = (e) => {
        e.preventDefault()
        if (!selectedTeacher) {
            setError('Please select a teacher')
            return
        }
        if (!currentAcademicYear) {
            setError('No active academic year. Please set one first.')
            return
        }
        assignMutation.mutate({
            section: parseInt(sectionId),
            teacher: parseInt(selectedTeacher),
            academic_year: currentAcademicYear.id
        })
    }

    const openAssignModal = () => {
        setSelectedTeacher(classTeacher?.teacher || '')
        setError('')
        setShowTeacherModal(true)
    }

    const filteredStudents = students?.results?.filter(student =>
        student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.admission_number.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (sectionLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="spinner" />
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <button
                    onClick={() => navigate('/school/classes')}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Classes
                </button>
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            {section?.class_name} <span className="text-gray-400">•</span> Section {section?.name}
                        </h1>
                        <p className="mt-1 text-gray-500 dark:text-gray-400">
                            Manage students and subject teachers for this section
                        </p>
                    </div>
                </div>
            </div>

            {/* Class Teacher Assignment Modal */}
            {showTeacherModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {classTeacher ? 'Change Class Teacher' : 'Assign Class Teacher'}
                                </h2>
                                <button onClick={() => setShowTeacherModal(false)} className="text-gray-500 hover:text-gray-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <form onSubmit={handleAssignClassTeacher} className="p-6 space-y-4">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="label">Section</label>
                                <p className="text-lg font-medium text-gray-900 dark:text-white">
                                    {section?.class_name} - {section?.name}
                                </p>
                            </div>

                            <div>
                                <label className="label">Select Teacher *</label>
                                <select
                                    className="select"
                                    value={selectedTeacher}
                                    onChange={(e) => setSelectedTeacher(e.target.value)}
                                    required
                                >
                                    <option value="">Select a teacher</option>
                                    {teachers?.results?.map(t => (
                                        <option key={t.id} value={t.id}>{t.full_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="label">Academic Year</label>
                                <p className="text-gray-600 dark:text-gray-400">
                                    {currentAcademicYear?.name || 'No active academic year'}
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowTeacherModal(false)} className="btn btn-secondary flex-1">
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary flex-1"
                                    disabled={assignMutation.isPending}
                                >
                                    {assignMutation.isPending ? 'Saving...' : 'Assign Teacher'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Class Teacher Card */}
            <div className="card p-6 bg-gradient-to-br from-primary-50 to-white dark:from-gray-800 dark:to-gray-900 border-primary-100 dark:border-gray-700">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400">
                            <GraduationCap className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-1">Class Teacher</h3>
                            {classTeacher ? (
                                <p className="text-lg font-semibold text-gray-900 dark:text-white">{classTeacher.teacher_name}</p>
                            ) : (
                                <p className="text-gray-500 italic">No class teacher assigned</p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={openAssignModal}
                        className="btn btn-sm btn-secondary"
                    >
                        <Edit2 className="w-4 h-4" />
                        {classTeacher ? 'Change' : 'Assign'}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('students')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'students'
                        ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                >
                    Students ({students?.count || 0})
                </button>
                <button
                    onClick={() => setActiveTab('subjects')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'subjects'
                        ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                >
                    Subject Teachers ({subjectTeachers?.results?.length || 0})
                </button>
            </div>

            {/* Content */}
            <div className="space-y-6">
                {activeTab === 'students' && (
                    <div className="card">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between gap-4">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search students..."
                                    className="input pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={() => navigate('/school/students/new', { state: { classId: section.school_class, sectionId: section.id } })}
                                className="btn btn-primary"
                            >
                                <Users className="w-4 h-4" />
                                Add Student
                            </button>
                        </div>

                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Admission No</th>
                                        <th>Roll No</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {studentsLoading ? (
                                        <tr>
                                            <td colSpan="5" className="text-center py-8">
                                                <div className="spinner mx-auto" />
                                            </td>
                                        </tr>
                                    ) : filteredStudents?.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="text-center py-8 text-gray-500">
                                                No students found in this section
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStudents?.map((student) => (
                                            <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                <td>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 text-xs font-bold">
                                                            {student.full_name[0]}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-gray-900 dark:text-white">{student.full_name}</div>
                                                            <div className="text-xs text-gray-500">{student.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="font-mono text-gray-600 dark:text-gray-400">{student.admission_number}</td>
                                                <td className="text-gray-600 dark:text-gray-400">{student.roll_number || '-'}</td>
                                                <td>
                                                    <span className={`badge ${student.is_active ? 'badge-success' : 'badge-danger'}`}>
                                                        {student.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        onClick={() => navigate(`/school/students/${student.id}`)}
                                                        className="btn btn-sm btn-secondary"
                                                    >
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'subjects' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {subjectsLoading ? (
                            <div className="col-span-full flex justify-center py-12">
                                <div className="spinner" />
                            </div>
                        ) : subjectTeachers?.results?.length === 0 ? (
                            <div className="col-span-full card p-12 text-center text-gray-500">
                                <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                <p>No subjects assigned yet.</p>
                                <button
                                    onClick={() => navigate('/school/teacher-assignments')}
                                    className="btn btn-primary mt-4"
                                >
                                    Assign Subjects
                                </button>
                            </div>
                        ) : (
                            subjectTeachers?.results?.map((subject) => (
                                <div key={subject.id} className="card p-5 hover:shadow-lg transition-all dark:bg-gray-800">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                            <BookOpen className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                                        {subject.subject_name}
                                    </h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                        <User className="w-4 h-4" />
                                        <span>{subject.teacher_name}</span>
                                    </div>
                                </div>
                            ))
                        )}

                        <button
                            onClick={() => navigate('/school/teacher-assignments')}
                            className="card p-5 border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-gray-800 transition-all flex flex-col items-center justify-center gap-3 text-gray-500 hover:text-primary-600 h-full min-h-[160px]"
                        >
                            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                <Plus className="w-5 h-5" />
                            </div>
                            <span className="font-medium">Assign New Subject</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

function Plus({ className }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    )
}
