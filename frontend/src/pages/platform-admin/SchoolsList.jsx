import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { Plus, Search, CheckCircle, XCircle, Eye } from 'lucide-react'
import { useState } from 'react'

export default function SchoolsList() {
    const [searchTerm, setSearchTerm] = useState('')

    const { data: schools, isLoading, refetch } = useQuery({
        queryKey: ['schools'],
        queryFn: () => api.get('/api/platform/schools/').then(res => res.data)
    })

    const handleToggleStatus = async (schoolId, currentStatus) => {
        const action = currentStatus === 'active' ? 'suspend' : 'activate'
        await api.post(`/api/platform/schools/${schoolId}/${action}/`)
        refetch()
    }

    const filteredSchools = schools?.results?.filter(school =>
        school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        school.code.toLowerCase().includes(searchTerm.toLowerCase())
    ) || []

    if (isLoading) {
        return <div className="loading-container"><div className="spinner"></div></div>
    }

    return (
        <div>
            <div className="page-header flex justify-between items-center">
                <div>
                    <h1 className="page-title">Schools</h1>
                    <p className="page-subtitle">Manage all schools on the platform</p>
                </div>
                <Link to="/platform/schools/new" className="btn btn-primary">
                    <Plus size={20} /> Add School
                </Link>
            </div>

            <div className="card">
                <div className="card-header">
                    <div className="relative max-w-xs">
                        <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            className="form-input pl-10 w-full"
                            placeholder="Search schools..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="card-body p-0">
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>School</th>
                                    <th>Code</th>
                                    <th>Status</th>
                                    <th>Plan</th>
                                    <th>Expiry</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSchools.map((school) => (
                                    <tr key={school.id}>
                                        <td className="font-medium text-gray-900 dark:text-white">{school.name}</td>
                                        <td className="text-gray-600 dark:text-gray-300">{school.code}</td>
                                        <td>
                                            <span className={`badge badge-${school.status === 'active' ? 'success' : 'danger'}`}>
                                                {school.status_display}
                                            </span>
                                        </td>
                                        <td className="text-gray-600 dark:text-gray-300">{school.plan_display}</td>
                                        <td className="text-sm text-gray-500 dark:text-gray-400">
                                            {school.plan_expiry_date || 'No expiry'}
                                        </td>
                                        <td className="text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(school.created_at).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <div className="flex gap-2">
                                                <Link
                                                    to={`/platform/schools/${school.id}`}
                                                    className="btn btn-sm btn-secondary"
                                                    title="View Details"
                                                >
                                                    <Eye size={16} />
                                                </Link>
                                                <button
                                                    onClick={() => handleToggleStatus(school.id, school.status)}
                                                    className={`btn btn-sm ${school.status === 'active' ? 'btn-danger' : 'btn-success'}`}
                                                    title={school.status === 'active' ? 'Suspend School' : 'Activate School'}
                                                >
                                                    {school.status === 'active' ? <XCircle size={16} /> : <CheckCircle size={16} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!filteredSchools.length && (
                                    <tr>
                                        <td colSpan={7} className="text-center py-8 text-gray-500 dark:text-gray-400">
                                            No schools found matching your search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
