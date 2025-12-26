import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import { Save, ArrowLeft, User, Mail, Lock, GraduationCap, Phone, Calendar, AlertCircle, Check, BookOpen } from 'lucide-react'

// Form Section Component
function FormSection({ icon: Icon, title, description, children }) {
    return (
        <div className="border-b border-gray-100 pb-8 last:border-0 last:pb-0">
            <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
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

export default function StudentForm() {
    const { id } = useParams()
    const navigate = useNavigate()
    const isEdit = Boolean(id)

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        admission_number: '',
        current_class: '',
        current_section: '',
        date_of_birth: '',
        parent_name: '',
        parent_phone: '',
        parent_email: '',
        address: ''
    })
    const [errors, setErrors] = useState({})
    const [isLoading, setIsLoading] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)

    // Fetch classes
    const { data: classes } = useQuery({
        queryKey: ['classes'],
        queryFn: () => api.get('/api/school/classes/').then(res => res.data)
    })

    // Fetch student for edit
    const { data: student } = useQuery({
        queryKey: ['student', id],
        queryFn: () => api.get(`/api/school/students/${id}/`).then(res => res.data),
        enabled: isEdit
    })

    // Get sections for selected class
    const selectedClass = classes?.results?.find(c => c.id === parseInt(formData.current_class))
    const sections = selectedClass?.sections || []

    useEffect(() => {
        if (student) {
            setFormData({
                email: student.email || '',
                first_name: student.first_name || '',
                last_name: student.last_name || '',
                admission_number: student.admission_number || '',
                current_class: student.current_class || '',
                current_section: student.current_section || '',
                date_of_birth: student.date_of_birth || '',
                parent_name: student.parent_name || '',
                parent_phone: student.parent_phone || '',
                parent_email: student.parent_email || '',
                address: student.address || ''
            })
        }
    }, [student])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setErrors({})
        setIsLoading(true)

        try {
            if (isEdit) {
                await api.patch(`/api/school/students/${id}/`, formData)
            } else {
                await api.post('/api/school/students/', formData)
            }
            setShowSuccess(true)
            setTimeout(() => navigate('/school/students'), 1500)
        } catch (err) {
            const errorData = err.response?.data
            if (typeof errorData === 'object') {
                setErrors(errorData)
            } else {
                setErrors({ general: 'Failed to save student. Please try again.' })
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }))
        }
        // Reset section when class changes
        if (name === 'current_class') {
            setFormData(prev => ({ ...prev, current_section: '' }))
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
                        Back to Students
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {isEdit ? 'Edit Student' : 'Add New Student'}
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            {isEdit
                                ? 'Update student information and academic details'
                                : 'Create and manage student accounts securely'
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
                            <p className="font-medium text-emerald-800">Student saved successfully!</p>
                            <p className="text-sm text-emerald-600">Redirecting to students list...</p>
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
                                description="Login credentials for the student's account"
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
                                                placeholder="student@school.com"
                                                className={`input pl-10 ${isEdit ? 'bg-gray-50 cursor-not-allowed' : ''} ${errors.email ? 'border-red-300 focus:ring-red-500' : ''}`}
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
                                                    className={`input pl-10 ${errors.password ? 'border-red-300 focus:ring-red-500' : ''}`}
                                                />
                                            </div>
                                        </FormField>
                                    )}
                                </div>
                            </FormSection>

                            {/* Section 2: Personal Information */}
                            <FormSection
                                icon={User}
                                title="Personal Information"
                                description="Basic details about the student"
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
                                            className={`input ${errors.first_name ? 'border-red-300 focus:ring-red-500' : ''}`}
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
                                            className={`input ${errors.last_name ? 'border-red-300 focus:ring-red-500' : ''}`}
                                        />
                                    </FormField>

                                    <FormField label="Admission Number" required error={errors.admission_number}>
                                        <div className="relative">
                                            <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                            <input
                                                type="text"
                                                name="admission_number"
                                                value={formData.admission_number}
                                                onChange={handleChange}
                                                required
                                                placeholder="ADM-2024-001"
                                                className={`input pl-10 ${errors.admission_number ? 'border-red-300 focus:ring-red-500' : ''}`}
                                            />
                                        </div>
                                    </FormField>

                                    <FormField label="Date of Birth" error={errors.date_of_birth}>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                            <input
                                                type="date"
                                                name="date_of_birth"
                                                value={formData.date_of_birth}
                                                onChange={handleChange}
                                                className={`input pl-10 ${errors.date_of_birth ? 'border-red-300 focus:ring-red-500' : ''}`}
                                            />
                                        </div>
                                    </FormField>
                                </div>
                            </FormSection>

                            {/* Section 3: Academic Information */}
                            <FormSection
                                icon={BookOpen}
                                title="Academic Information"
                                description="Class and section assignment"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField label="Class" required error={errors.current_class}>
                                        <select
                                            name="current_class"
                                            value={formData.current_class}
                                            onChange={handleChange}
                                            required
                                            className={`select ${errors.current_class ? 'border-red-300 focus:ring-red-500' : ''}`}
                                        >
                                            <option value="">Select Class</option>
                                            {classes?.results?.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </FormField>

                                    <FormField label="Section" required error={errors.current_section}>
                                        <select
                                            name="current_section"
                                            value={formData.current_section}
                                            onChange={handleChange}
                                            required
                                            disabled={!formData.current_class}
                                            className={`select ${!formData.current_class ? 'bg-gray-50 cursor-not-allowed' : ''} ${errors.current_section ? 'border-red-300 focus:ring-red-500' : ''}`}
                                        >
                                            <option value="">Select Section</option>
                                            {sections.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                        {!formData.current_class && (
                                            <p className="text-xs text-gray-500 mt-1">Select a class first</p>
                                        )}
                                    </FormField>
                                </div>
                            </FormSection>

                            {/* Section 4: Parent/Guardian Information */}
                            <FormSection
                                icon={Phone}
                                title="Parent/Guardian Details"
                                description="Contact information for parents"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField label="Parent Name" error={errors.parent_name}>
                                        <input
                                            type="text"
                                            name="parent_name"
                                            value={formData.parent_name}
                                            onChange={handleChange}
                                            placeholder="Parent's full name"
                                            className={`input ${errors.parent_name ? 'border-red-300 focus:ring-red-500' : ''}`}
                                        />
                                    </FormField>

                                    <FormField label="Parent Phone (10 digits)" error={errors.parent_phone}>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                            <input
                                                type="tel"
                                                name="parent_phone"
                                                value={formData.parent_phone}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                                                    setFormData(prev => ({ ...prev, parent_phone: value }))
                                                    if (errors.parent_phone) setErrors(prev => ({ ...prev, parent_phone: null }))
                                                }}
                                                placeholder="9876543210"
                                                maxLength={10}
                                                pattern="[0-9]{10}"
                                                className={`input pl-10 ${errors.parent_phone ? 'border-red-300 focus:ring-red-500' : ''}`}
                                            />
                                        </div>
                                        {formData.parent_phone && formData.parent_phone.length !== 10 && (
                                            <p className="text-xs text-amber-600 mt-1">{formData.parent_phone.length}/10 digits</p>
                                        )}
                                    </FormField>

                                    <FormField label="Parent Email" error={errors.parent_email}>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                            <input
                                                type="email"
                                                name="parent_email"
                                                value={formData.parent_email}
                                                onChange={handleChange}
                                                placeholder="parent@email.com"
                                                className={`input pl-10 ${errors.parent_email ? 'border-red-300 focus:ring-red-500' : ''}`}
                                            />
                                        </div>
                                    </FormField>

                                    <FormField label="Address" error={errors.address}>
                                        <textarea
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            rows={2}
                                            placeholder="Student's address"
                                            className={`input ${errors.address ? 'border-red-300 focus:ring-red-500' : ''}`}
                                        />
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
                                        {isEdit ? 'Update Student' : 'Save Student'}
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
