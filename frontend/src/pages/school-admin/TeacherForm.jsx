import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import { Save, ArrowLeft, User, Mail, Lock, Briefcase, GraduationCap, BookOpen, AlertCircle, Check } from 'lucide-react'

// Form Section Component
function FormSection({ icon: Icon, title, description, children }) {
    return (
        <div className="border-b border-gray-100 pb-8 last:border-0 last:pb-0">
            <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{description}</p>
                </div>
            </div>
            <div className="pl-14">
                {children}
            </div>
        </div>
    )
}

// Input Field Component
function FormField({ label, required, error, children }) {
    return (
        <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {children}
            {error && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </p>
            )}
        </div>
    )
}

export default function TeacherForm() {
    const { id } = useParams()
    const navigate = useNavigate()
    const isEdit = Boolean(id)

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        phone: '',
        employee_id: '',
        qualification: '',
        subjects: []
    })
    const [errors, setErrors] = useState({})
    const [isLoading, setIsLoading] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)

    // Fetch subjects for multi-select
    const { data: subjects } = useQuery({
        queryKey: ['subjects'],
        queryFn: () => api.get('/api/school/subjects/').then(res => res.data)
    })

    // Fetch teacher data for edit mode
    const { data: teacher } = useQuery({
        queryKey: ['teacher', id],
        queryFn: () => api.get(`/api/school/teachers/${id}/`).then(res => res.data),
        enabled: isEdit
    })

    useEffect(() => {
        if (teacher) {
            setFormData({
                email: teacher.email || '',
                first_name: teacher.first_name || '',
                last_name: teacher.last_name || '',
                phone: teacher.phone || '',
                employee_id: teacher.employee_id || '',
                qualification: teacher.qualification || '',
                subjects: teacher.subjects || []
            })
        }
    }, [teacher])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setErrors({})
        setIsLoading(true)

        try {
            if (isEdit) {
                await api.patch(`/api/school/teachers/${id}/`, formData)
            } else {
                await api.post('/api/school/teachers/', formData)
            }
            setShowSuccess(true)
            setTimeout(() => navigate('/school/teachers'), 1500)
        } catch (err) {
            const errorData = err.response?.data
            if (typeof errorData === 'object') {
                setErrors(errorData)
            } else {
                setErrors({ general: 'Failed to save teacher. Please try again.' })
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }))
        }
    }

    const handleSubjectToggle = (subjectId) => {
        const current = formData.subjects || []
        if (current.includes(subjectId)) {
            setFormData(prev => ({ ...prev, subjects: current.filter(id => id !== subjectId) }))
        } else {
            setFormData(prev => ({ ...prev, subjects: [...current, subjectId] }))
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Page Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Teachers
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {isEdit ? 'Edit Teacher' : 'Add New Teacher'}
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            {isEdit
                                ? 'Update teacher information and account settings'
                                : 'Create and manage teacher accounts securely'
                            }
                        </p>
                    </div>
                </div>

                {/* Success Message */}
                {showSuccess && (
                    <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                            <Check className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="font-medium text-emerald-800">Teacher saved successfully!</p>
                            <p className="text-sm text-emerald-600">Redirecting to teachers list...</p>
                        </div>
                    </div>
                )}

                {/* General Error */}
                {errors.general && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <p className="text-sm font-medium text-red-800">{errors.general}</p>
                    </div>
                )}

                {/* Main Form Card */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-card border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <form onSubmit={handleSubmit}>
                        <div className="p-8 space-y-8">
                            {/* Section 1: Account Details */}
                            <FormSection
                                icon={Lock}
                                title="Account Details"
                                description="Login credentials for the teacher's account"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField label="Email Address" required error={errors.email}>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                disabled={isEdit}
                                                required
                                                placeholder="teacher@school.com"
                                                className={`input pl-10 ${isEdit ? 'bg-gray-50 cursor-not-allowed' : ''} ${errors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                                            />
                                        </div>
                                    </FormField>

                                    {!isEdit && (
                                        <FormField label="Password" required error={errors.password}>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                                <input
                                                    type="password"
                                                    name="password"
                                                    value={formData.password}
                                                    onChange={handleChange}
                                                    required
                                                    minLength={8}
                                                    placeholder="Minimum 8 characters"
                                                    className={`input pl-10 ${errors.password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Must be at least 8 characters long
                                            </p>
                                        </FormField>
                                    )}
                                </div>
                            </FormSection>

                            {/* Section 2: Personal Information */}
                            <FormSection
                                icon={User}
                                title="Personal Information"
                                description="Basic details about the teacher"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField label="First Name" required error={errors.first_name}>
                                        <input
                                            type="text"
                                            name="first_name"
                                            value={formData.first_name}
                                            onChange={handleChange}
                                            required
                                            placeholder="John"
                                            className={`input ${errors.first_name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                                        />
                                    </FormField>

                                    <FormField label="Last Name" required error={errors.last_name}>
                                        <input
                                            type="text"
                                            name="last_name"
                                            value={formData.last_name}
                                            onChange={handleChange}
                                            required
                                            placeholder="Doe"
                                            className={`input ${errors.last_name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                                        />
                                    </FormField>

                                    <FormField label="Employee ID" error={errors.employee_id}>
                                        <div className="relative">
                                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                            <input
                                                type="text"
                                                name="employee_id"
                                                value={formData.employee_id}
                                                onChange={handleChange}
                                                placeholder="EMP-001"
                                                className={`input pl-10 ${errors.employee_id ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                                            />
                                        </div>
                                    </FormField>

                                    <FormField label="Phone Number (10 digits)" error={errors.phone}>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                                                setFormData(prev => ({ ...prev, phone: value }))
                                                if (errors.phone) setErrors(prev => ({ ...prev, phone: null }))
                                            }}
                                            placeholder="9876543210"
                                            maxLength={10}
                                            pattern="[0-9]{10}"
                                            className={`input ${errors.phone ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                                        />
                                        {formData.phone && formData.phone.length !== 10 && (
                                            <p className="text-xs text-amber-600 mt-1">{formData.phone.length}/10 digits</p>
                                        )}
                                    </FormField>
                                </div>
                            </FormSection>

                            {/* Section 3: Professional Details */}
                            <FormSection
                                icon={GraduationCap}
                                title="Professional Details"
                                description="Qualifications and teaching subjects"
                            >
                                <div className="space-y-6">
                                    <FormField label="Qualification" error={errors.qualification}>
                                        <div className="relative">
                                            <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                            <input
                                                type="text"
                                                name="qualification"
                                                value={formData.qualification}
                                                onChange={handleChange}
                                                placeholder="M.Sc. Mathematics, B.Ed."
                                                className={`input pl-10 ${errors.qualification ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                                            />
                                        </div>
                                    </FormField>

                                    <FormField label="Teaching Subjects" error={errors.subjects}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <BookOpen className="w-5 h-5 text-gray-500" />
                                            <span className="text-sm text-gray-500">
                                                Select the subjects this teacher will teach
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {subjects?.results?.length > 0 ? (
                                                subjects.results.map(subject => {
                                                    const isSelected = formData.subjects?.includes(subject.id)
                                                    return (
                                                        <button
                                                            key={subject.id}
                                                            type="button"
                                                            onClick={() => handleSubjectToggle(subject.id)}
                                                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${isSelected
                                                                ? 'bg-primary-50 text-primary-700 border-primary-200 ring-2 ring-primary-100'
                                                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                                                                }`}
                                                        >
                                                            {isSelected && <Check className="w-4 h-4" />}
                                                            {subject.name}
                                                        </button>
                                                    )
                                                })
                                            ) : (
                                                <p className="text-sm text-gray-500 italic">
                                                    No subjects available. Add subjects first.
                                                </p>
                                            )}
                                        </div>
                                    </FormField>
                                </div>
                            </FormSection>
                        </div>

                        {/* Action Footer */}
                        <div className="px-8 py-5 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="btn btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn btn-primary btn-lg"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="spinner" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        {isEdit ? 'Update Teacher' : 'Save Teacher'}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Help Text */}
                <p className="mt-6 text-center text-sm text-gray-500">
                    Need help? Contact your administrator for assistance.
                </p>
            </div>
        </div>
    )
}
