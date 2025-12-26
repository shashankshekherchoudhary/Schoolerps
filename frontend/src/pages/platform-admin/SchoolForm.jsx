import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import { Save, ArrowLeft } from 'lucide-react'

export default function SchoolForm() {
    const { id } = useParams()
    const navigate = useNavigate()
    const isEdit = Boolean(id)

    const [formData, setFormData] = useState({
        name: '', code: '', address: '', city: '', state: '', pincode: '',
        phone: '', email: '', principal_name: '',
        plan_name: 'trial', plan_expiry_date: '',
        account_type: 'school'
    })
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const { data: school } = useQuery({
        queryKey: ['school', id],
        queryFn: () => api.get(`/api/platform/schools/${id}/`).then(res => res.data),
        enabled: isEdit
    })

    useEffect(() => {
        if (school) {
            setFormData({
                name: school.name || '',
                code: school.code || '',
                address: school.address || '',
                city: school.city || '',
                state: school.state || '',
                pincode: school.pincode || '',
                phone: school.phone || '',
                email: school.email || '',
                principal_name: school.principal_name || '',
                plan_name: school.plan_name || 'trial',
                plan_expiry_date: school.plan_expiry_date || '',
                account_type: school.account_type || 'school'
            })
        }
    }, [school])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        try {
            if (isEdit) {
                await api.patch(`/api/platform/schools/${id}/`, formData)
            } else {
                await api.post('/api/platform/schools/', formData)
            }
            navigate('/platform/schools')
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to save school')
        } finally {
            setIsLoading(false)
        }
    }

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    return (
        <div>
            <div className="page-header">
                <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ marginBottom: 'var(--space-4)' }}>
                    <ArrowLeft size={20} /> Back
                </button>
                <h1 className="page-title">{isEdit ? 'Edit School' : 'Add New School'}</h1>
            </div>

            <div className="card" style={{ maxWidth: 800 }}>
                <div className="card-body">
                    {error && <div className="alert alert-danger">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="form-group">
                                <label className="form-label">School Name *</label>
                                <input type="text" name="name" className="form-input" value={formData.name} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">School Code *</label>
                                <input type="text" name="code" className="form-input" value={formData.code} onChange={handleChange} required disabled={isEdit} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Account Type</label>
                                <select name="account_type" className="form-select" value={formData.account_type} onChange={handleChange}>
                                    <option value="school">School</option>
                                    <option value="tuition">Tuition Center</option>
                                </select>
                            </div>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="form-label">Address</label>
                                <input type="text" name="address" className="form-input" value={formData.address} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">City</label>
                                <input type="text" name="city" className="form-input" value={formData.city} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">State</label>
                                <input type="text" name="state" className="form-input" value={formData.state} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Phone</label>
                                <input type="text" name="phone" className="form-input" value={formData.phone} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input type="email" name="email" className="form-input" value={formData.email} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Principal Name</label>
                                <input type="text" name="principal_name" className="form-input" value={formData.principal_name} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Plan</label>
                                <select name="plan_name" className="form-select" value={formData.plan_name} onChange={handleChange}>
                                    <option value="trial">Trial</option>
                                    <option value="basic">Basic</option>
                                    <option value="custom">Custom</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Plan Expiry Date</label>
                                <input type="date" name="plan_expiry_date" className="form-input" value={formData.plan_expiry_date} onChange={handleChange} />
                            </div>
                        </div>

                        <div style={{ marginTop: 'var(--space-6)' }}>
                            <button type="submit" className="btn btn-primary btn-lg" disabled={isLoading}>
                                <Save size={20} /> {isLoading ? 'Saving...' : 'Save School'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
