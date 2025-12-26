import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import api from '../../services/api'
import { Save, ArrowLeft, AlertCircle } from 'lucide-react'

export default function CreateNotice() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()

    const scope = searchParams.get('scope') // 'class' or 'subject'
    const sectionId = searchParams.get('section')
    const subjectId = searchParams.get('subject')

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        priority: 'normal',
    })

    const createMutation = useMutation({
        mutationFn: (data) => api.post('/api/notices/', data),
        onSuccess: () => {
            navigate('/teacher/dashboard')
        }
    })

    const handleSubmit = (e) => {
        e.preventDefault()

        const payload = {
            ...formData,
            target_audience: 'students', // Always students for teacher notices
            target_sections: [parseInt(sectionId)],
            target_subject: subjectId ? parseInt(subjectId) : null,
            is_published: true
        }

        createMutation.mutate(payload)
    }

    const getScopeDisplay = () => {
        if (scope === 'class') return 'Class Notice'
        if (scope === 'subject') return 'Subject Notice'
        return 'Notice'
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <Link to="/teacher/dashboard" className="text-gray-500 hover:text-gray-700 flex items-center gap-2 mb-2">
                    <ArrowLeft size={16} /> Back to Dashboard
                </Link>
                <h1 className="page-title">Create {getScopeDisplay()}</h1>
                <p className="page-subtitle">
                    {scope === 'class'
                        ? 'This notice will be visible to all students in your class.'
                        : 'This notice will be visible to students of this subject only.'}
                </p>
            </div>

            <div className="card">
                <div className="card-body">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Target Info (Read Only) */}
                        <div className="p-4 bg-primary-50 dark:bg-primary-900/20 text-primary-800 dark:text-primary-300 rounded-lg flex items-start gap-3">
                            <AlertCircle size={20} className="mt-0.5" />
                            <div className="text-sm">
                                <p className="font-medium">Targeting:</p>
                                <ul className="list-disc list-inside mt-1 opacity-90">
                                    <li>Audience: Students Only</li>
                                    <li>Scope: {scope === 'class' ? 'Entire Class' : 'Subject Students'}</li>
                                </ul>
                            </div>
                        </div>

                        <div>
                            <label className="label">Title</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="e.g. History Test on Friday"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="label">Content</label>
                            <textarea
                                className="input min-h-[150px]"
                                placeholder="Write your notice details here..."
                                value={formData.content}
                                onChange={e => setFormData({ ...formData, content: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="label">Priority</label>
                            <select
                                className="select"
                                value={formData.priority}
                                onChange={e => setFormData({ ...formData, priority: e.target.value })}
                            >
                                <option value="low">Low</option>
                                <option value="normal">Normal</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>

                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={createMutation.isPending}
                            >
                                <Save size={20} />
                                {createMutation.isPending ? 'Publishing...' : 'Publish Notice'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
