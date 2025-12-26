import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { Plus, CheckCircle, X, Calendar } from 'lucide-react'

export default function ExamsList() {
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        exam_type: 'unit',
        start_date: '',
        end_date: '',
        classes: []
    })
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const queryClient = useQueryClient()

    const { data: exams, refetch } = useQuery({
        queryKey: ['exams'],
        queryFn: () => api.get('/api/exams/exams/').then(res => res.data)
    })

    const { data: classes } = useQuery({
        queryKey: ['classes'],
        queryFn: () => api.get('/api/academic/classes/').then(res => res.data)
    })

    const handlePublish = async (examId) => {
        await api.post(`/api/exams/exams/${examId}/publish/`)
        refetch()
    }

    const createExamMutation = useMutation({
        mutationFn: (data) => api.post('/api/exams/exams/', data),
        onSuccess: () => {
            queryClient.invalidateQueries(['exams'])
            setShowModal(false)
            setFormData({ name: '', exam_type: 'unit', start_date: '', end_date: '', classes: [] })
            setError('')
            setSuccess(true)
            setTimeout(() => setSuccess(false), 3000)
        },
        onError: (err) => {
            const errorData = err.response?.data
            if (typeof errorData === 'object') {
                const firstError = Object.values(errorData)[0]
                setError(Array.isArray(firstError) ? firstError[0] : String(firstError))
            } else {
                setError('Failed to create exam. Please try again.')
            }
        }
    })

    const handleSubmit = (e) => {
        e.preventDefault()
        setError('')
        if (formData.classes.length === 0) {
            setError('Please select at least one class')
            return
        }
        createExamMutation.mutate(formData)
    }

    const handleClassToggle = (classId) => {
        setFormData(prev => ({
            ...prev,
            classes: prev.classes.includes(classId)
                ? prev.classes.filter(id => id !== classId)
                : [...prev.classes, classId]
        }))
    }

    return (
        <div>
            <div className="page-header flex justify-between items-center">
                <div><h1 className="page-title">Exams & Results</h1></div>
                <button onClick={() => setShowModal(true)} className="btn btn-primary"><Plus size={20} /> Create Exam</button>
            </div>

            {/* Success Message */}
            {success && (
                <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-700">
                    <CheckCircle size={20} />
                    <span>Exam created successfully!</span>
                </div>
            )}

            {/* Create Exam Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => { setShowModal(false); setError('') }}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Create New Exam</h2>
                            <button onClick={() => { setShowModal(false); setError('') }} className="btn-icon"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                {/* Error Message */}
                                {error && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
                                        <X size={16} className="flex-shrink-0" />
                                        {error}
                                    </div>
                                )}
                                <div className="form-group">
                                    <label className="form-label">Exam Name *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g., Mid-Term Examination 2024"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Exam Type *</label>
                                    <select
                                        className="form-select"
                                        value={formData.exam_type}
                                        onChange={e => setFormData({ ...formData, exam_type: e.target.value })}
                                    >
                                        <option value="unit">Unit Test</option>
                                        <option value="midterm">Mid-Term</option>
                                        <option value="final">Final</option>
                                        <option value="annual">Annual</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="form-group">
                                        <label className="form-label">Start Date *</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={formData.start_date}
                                            onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">End Date *</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={formData.end_date}
                                            onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Classes *</label>
                                    <div className="flex flex-wrap gap-2">
                                        {classes?.results?.map(cls => (
                                            <button
                                                key={cls.id}
                                                type="button"
                                                className={`px-3 py-1 rounded-full text-sm border transition-colors ${formData.classes.includes(cls.id)
                                                    ? 'bg-primary-600 text-white border-primary-600'
                                                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                                                    }`}
                                                onClick={() => handleClassToggle(cls.id)}
                                            >
                                                {cls.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={createExamMutation.isPending}>
                                    {createExamMutation.isPending ? 'Creating...' : 'Create Exam'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="card">
                <div className="card-body" style={{ padding: 0 }}>
                    <table className="table">
                        <thead><tr><th>Exam Name</th><th>Type</th><th>Classes</th><th>Start Date</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                            {exams?.results?.map((exam) => (
                                <tr key={exam.id}>
                                    <td className="font-medium">{exam.name}</td>
                                    <td>{exam.exam_type_display}</td>
                                    <td>{exam.class_names?.join(', ')}</td>
                                    <td>{new Date(exam.start_date).toLocaleDateString()}</td>
                                    <td><span className={`badge badge-${exam.is_published ? 'success' : 'warning'}`}>{exam.is_published ? 'Published' : 'Draft'}</span></td>
                                    <td>
                                        {!exam.is_published && (
                                            <button onClick={() => handlePublish(exam.id)} className="btn btn-sm btn-success"><CheckCircle size={16} /> Publish</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
