import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { Plus, Check, AlertCircle, X } from 'lucide-react'
import { useState } from 'react'

export default function FeeStructures() {
    const queryClient = useQueryClient()
    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState({ school_class: '', fee_type: 'tuition', name: '', amount: '', due_day: 10 })
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const { data: structures } = useQuery({
        queryKey: ['fee-structures'],
        queryFn: () => api.get('/api/fees/structures/').then(res => res.data)
    })

    const { data: classes } = useQuery({
        queryKey: ['classes'],
        queryFn: () => api.get('/api/academic/classes/').then(res => res.data)
    })

    const createMutation = useMutation({
        mutationFn: (data) => api.post('/api/fees/structures/', data),
        onSuccess: () => {
            queryClient.invalidateQueries(['fee-structures'])
            setShowForm(false)
            setFormData({ school_class: '', fee_type: 'tuition', name: '', amount: '', due_day: 10 })
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
                setError('Failed to create fee structure. Please try again.')
            }
        }
    })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        createMutation.mutate(formData)
    }

    return (
        <div>
            <div className="page-header flex justify-between items-center">
                <div><h1 className="page-title">Fee Structures</h1></div>
                <button onClick={() => setShowForm(true)} className="btn btn-primary">
                    <Plus size={20} /> Add Fee Structure
                </button>
            </div>

            {/* Success Message */}
            {success && (
                <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-700">
                    <Check size={20} />
                    <span>Fee structure created successfully!</span>
                </div>
            )}

            {showForm && (
                <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                    <div className="card-body">
                        {/* Error Message */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
                                <AlertCircle size={16} />
                                {error}
                                <button onClick={() => setError('')} className="ml-auto">
                                    <X size={14} />
                                </button>
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-4">
                            <select
                                className="form-select"
                                value={formData.school_class}
                                onChange={(e) => setFormData({ ...formData, school_class: e.target.value })}
                                required
                            >
                                <option value="">Select Class</option>
                                {classes?.results?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <select
                                className="form-select"
                                value={formData.fee_type}
                                onChange={(e) => setFormData({ ...formData, fee_type: e.target.value })}
                            >
                                <option value="tuition">Tuition Fee</option>
                                <option value="admission">Admission Fee</option>
                                <option value="exam">Exam Fee</option>
                                <option value="lab">Lab Fee</option>
                                <option value="library">Library Fee</option>
                                <option value="transport">Transport Fee</option>
                                <option value="sports">Sports Fee</option>
                                <option value="other">Other</option>
                            </select>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Fee Name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            <input
                                type="number"
                                className="form-input"
                                placeholder="Amount"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                required
                            />
                            <input
                                type="number"
                                className="form-input"
                                placeholder="Due Day (1-31)"
                                value={formData.due_day}
                                onChange={(e) => setFormData({ ...formData, due_day: e.target.value })}
                                min="1"
                                max="31"
                            />
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={createMutation.isPending}
                                >
                                    {createMutation.isPending ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowForm(false); setError('') }}
                                    className="btn btn-secondary"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="card">
                <div className="card-body" style={{ padding: 0 }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Class</th>
                                <th>Type</th>
                                <th>Name</th>
                                <th>Amount</th>
                                <th>Due Day</th>
                            </tr>
                        </thead>
                        <tbody>
                            {structures?.results?.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="text-center text-gray-500 py-8">
                                        No fee structures found. Click "Add Fee Structure" to create one.
                                    </td>
                                </tr>
                            )}
                            {structures?.results?.map((s) => (
                                <tr key={s.id}>
                                    <td>{s.class_name}</td>
                                    <td>{s.fee_type_display}</td>
                                    <td>{s.name}</td>
                                    <td>₹{s.amount}</td>
                                    <td>{s.due_day}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
