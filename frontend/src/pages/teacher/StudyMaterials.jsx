import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FileText, Plus, Download, Trash2, Search, Filter } from 'lucide-react'
import api from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { useForm } from 'react-hook-form'

export default function StudyMaterials() {
    const { user } = useAuth()
    const queryClient = useQueryClient()
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
    const [filterBatch, setFilterBatch] = useState('')
    const [filterSubject, setFilterSubject] = useState('')

    // Fetch Materials
    const { data: materials, isLoading } = useQuery({
        queryKey: ['study-materials'],
        queryFn: () => api.get('/api/school/materials/').then(res => res.data)
    })

    // Fetch Dropdown Data (Classes/Sections & Subjects) is needed for Upload Form
    // Using existing endpoints
    const { data: sections } = useQuery({
        queryKey: ['sections'],
        queryFn: () => api.get('/api/school/sections/').then(res => res.data.results)
    })

    const { data: subjects } = useQuery({
        queryKey: ['subjects'],
        queryFn: () => api.get('/api/school/subjects/').then(res => res.data.results)
    })

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/api/school/materials/${id}/`),
        onSuccess: () => {
            queryClient.invalidateQueries(['study-materials'])
        },
        onError: (err) => alert('Failed to delete material')
    })

    // Filter Logic
    const filteredMaterials = materials?.results?.filter(item => {
        if (filterBatch && item.section !== parseInt(filterBatch)) return false
        if (filterSubject && item.subject !== parseInt(filterSubject)) return false
        return true
    })

    if (isLoading) return <div className="loading-container"><div className="spinner"></div></div>

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="page-title">Study Materials</h1>
                    <p className="page-subtitle">Upload and manage notes for your batches.</p>
                </div>
                <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="btn btn-primary"
                >
                    <Plus size={20} /> Upload Notes
                </button>
            </div>

            {/* Filters */}
            <div className="card p-4 flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Filter by Batch</label>
                    <select
                        className="input"
                        value={filterBatch}
                        onChange={(e) => setFilterBatch(e.target.value)}
                    >
                        <option value="">All Batches</option>
                        {sections?.map(s => (
                            <option key={s.id} value={s.id}>{s.class_name} - {s.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex-1 w-full">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Filter by Subject</label>
                    <select
                        className="input"
                        value={filterSubject}
                        onChange={(e) => setFilterSubject(e.target.value)}
                    >
                        <option value="">All Subjects</option>
                        {subjects?.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>
                <button
                    className="btn btn-secondary md:w-auto w-full"
                    onClick={() => { setFilterBatch(''); setFilterSubject('') }}
                >
                    Clear
                </button>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMaterials?.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        No study materials found. Upload some notes to get started.
                    </div>
                )}

                {filteredMaterials?.map((item) => (
                    <div key={item.id} className="card hover:shadow-lg transition-shadow">
                        <div className="p-5">
                            <div className="flex items-start justify-between mb-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                                    <FileText size={24} />
                                </div>
                                <div className="dropdown dropdown-end">
                                    <button
                                        onClick={() => {
                                            if (confirm('Delete this file?')) deleteMutation.mutate(item.id)
                                        }}
                                        className="btn btn-sm btn-ghost text-red-500"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1 truncate" title={item.title}>
                                {item.title}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                                {item.description || 'No description provided.'}
                            </p>

                            <div className="flex flex-wrap gap-2 mb-4 text-xs">
                                {item.section_name && (
                                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md">
                                        Batch: {item.batch_name} - {item.section_name}
                                    </span>
                                )}
                                {item.subject_name && (
                                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md">
                                        Subject: {item.subject_name}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                                <span className="text-xs text-gray-400">
                                    {new Date(item.created_at).toLocaleDateString()}
                                </span>
                                <a
                                    href={item.file}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-sm btn-outline-primary flex items-center gap-2"
                                >
                                    <Download size={14} /> Download
                                </a>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {isUploadModalOpen && (
                <UploadModal
                    onClose={() => setIsUploadModalOpen(false)}
                    sections={sections}
                    subjects={subjects}
                    onSuccess={() => {
                        setIsUploadModalOpen(false)
                        queryClient.invalidateQueries(['study-materials'])
                    }}
                />
            )}
        </div>
    )
}

function UploadModal({ onClose, sections, subjects, onSuccess }) {
    const { register, handleSubmit, formState: { errors } } = useForm()

    const uploadMutation = useMutation({
        mutationFn: (data) => {
            const formData = new FormData()
            formData.append('title', data.title)
            formData.append('description', data.description)
            formData.append('file', data.file[0]) // FileList to File
            if (data.section) formData.append('section', data.section)
            if (data.subject) formData.append('subject', data.subject)

            return api.post('/api/school/materials/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
        },
        onSuccess: () => {
            onSuccess()
        },
        onError: (err) => {
            alert('Upload failed: ' + (err.response?.data?.detail || 'Unknown error'))
        }
    })

    const onSubmit = (data) => {
        uploadMutation.mutate(data)
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Upload Study Material</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                    <div>
                        <label className="label">Title</label>
                        <input
                            {...register('title', { required: 'Title is required' })}
                            className="input w-full"
                            placeholder="e.g. Physics Chapter 1 Notes"
                        />
                        {errors.title && <span className="text-red-500 text-xs">{errors.title.message}</span>}
                    </div>

                    <div>
                        <label className="label">Description</label>
                        <textarea
                            {...register('description')}
                            className="input w-full h-24 resize-none"
                            placeholder="Brief description of the content..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Target Batch (Optional)</label>
                            <select {...register('section')} className="input w-full">
                                <option value="">All Batches</option>
                                {sections?.map(s => (
                                    <option key={s.id} value={s.id}>{s.class_name} - {s.name}</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-400 mt-1">Leave empty to share with everyone.</p>
                        </div>
                        <div>
                            <label className="label">Subject (Optional)</label>
                            <select {...register('subject')} className="input w-full">
                                <option value="">Select Subject</option>
                                {subjects?.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="label">File</label>
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                            <input
                                type="file"
                                {...register('file', { required: 'File is required' })}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                            />
                            {errors.file && <span className="text-red-500 text-xs block mt-2">{errors.file.message}</span>}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={uploadMutation.isPending}
                        >
                            {uploadMutation.isPending ? 'Uploading...' : 'Upload Notes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
