import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { Plus, Search, Edit, Eye, Upload } from 'lucide-react'
import { useState } from 'react'

import { useAuth } from '../../contexts/AuthContext'

export default function StudentsList() {
    const { user } = useAuth()
    const [searchTerm, setSearchTerm] = useState('')
    const [classFilter, setClassFilter] = useState('')

    const term = user?.account_type === 'tuition' ? 'Batch' : 'Class'
    const termPlural = user?.account_type === 'tuition' ? 'Batches' : 'Classes'

    const { data: students, isLoading } = useQuery({
        queryKey: ['students', classFilter],
        queryFn: () => api.get('/api/school/students/', { params: { class: classFilter || undefined } }).then(res => res.data)
    })

    const { data: classes } = useQuery({
        queryKey: ['classes'],
        queryFn: () => api.get('/api/school/classes/').then(res => res.data)
    })

    const filteredStudents = students?.results?.filter(s =>
        s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.admission_number?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || []

    if (isLoading) return <div className="loading-container"><div className="spinner"></div></div>

    return (
        <div>
            <div className="page-header flex justify-between items-center">
                <div>
                    <h1 className="page-title">Students</h1>
                    <p className="page-subtitle">Manage student records</p>
                </div>
                <div className="flex gap-3">
                    <Link to="/school/students/import" className="btn btn-secondary"><Upload size={20} /> Import</Link>
                    <Link to="/school/students/new" className="btn btn-primary"><Plus size={20} /> Add Student</Link>
                </div>
            </div>

            <div className="card">
                <div className="card-header flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1 max-w-xs">
                        <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            className="form-input pl-10 w-full"
                            placeholder="Search students..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="form-select w-full sm:w-48"
                        value={classFilter}
                        onChange={(e) => setClassFilter(e.target.value)}
                    >
                        <option value="">All {termPlural}</option>
                        {classes?.results?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div className="card-body p-0">
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Admission No.</th>
                                    <th>{term}</th>
                                    <th>Parent Contact</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map((student) => (
                                    <tr key={student.id}>
                                        <td className="font-medium text-gray-900 dark:text-white">{student.full_name}</td>
                                        <td className="text-gray-600 dark:text-gray-300">{student.admission_number}</td>
                                        <td className="text-gray-600 dark:text-gray-300">
                                            {student.class_name || <span className="text-amber-600 italic">Class not assigned</span>}
                                        </td>
                                        <td className="text-gray-600 dark:text-gray-300">{student.parent_phone || 'N/A'}</td>
                                        <td>
                                            <span className={`badge badge-${student.status === 'active' ? 'success' : 'danger'}`}>
                                                {student.status}
                                            </span>
                                        </td>
                                        <td>
                                            <Link
                                                to={`/school/students/${student.id}`}
                                                className="btn btn-sm btn-secondary"
                                                title="Edit Student"
                                            >
                                                <Edit size={16} />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {!filteredStudents.length && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-12 text-gray-500 dark:text-gray-400">
                                            <div className="flex flex-col items-center justify-center">
                                                <p className="text-lg font-medium text-gray-900 dark:text-white mb-1">No students found</p>
                                                <p className="text-sm">Try adjusting your search or filters</p>
                                            </div>
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
