import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import {
    Upload, FileText, Download, AlertCircle, CheckCircle,
    XCircle, ArrowLeft, Users, Loader2
} from 'lucide-react'

export default function TeacherImport() {
    const navigate = useNavigate()
    const fileInputRef = useRef(null)

    const [file, setFile] = useState(null)
    const [dragActive, setDragActive] = useState(false)
    const [loading, setLoading] = useState(false)
    const [importing, setImporting] = useState(false)
    const [error, setError] = useState('')
    const [preview, setPreview] = useState(null)
    const [importResult, setImportResult] = useState(null)

    const handleDrag = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }

    const handleDrop = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0])
        }
    }

    const handleFileInput = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0])
        }
    }

    const handleFile = async (selectedFile) => {
        setError('')
        setPreview(null)
        setImportResult(null)

        if (!selectedFile.name.endsWith('.csv')) {
            setError('Please upload a CSV file')
            return
        }

        setFile(selectedFile)
        setLoading(true)

        try {
            const formData = new FormData()
            formData.append('file', selectedFile)

            const response = await api.post('/api/school/teachers/preview_import/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            setPreview(response.data)
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to parse file')
            setFile(null)
        } finally {
            setLoading(false)
        }
    }

    const handleConfirmImport = async () => {
        if (!file) return
        setImporting(true)
        setError('')

        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await api.post('/api/school/teachers/confirm_import/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            setImportResult(response.data)
            setPreview(null)
            setFile(null)
        } catch (err) {
            setError(err.response?.data?.error || 'Import failed')
        } finally {
            setImporting(false)
        }
    }

    const handleDownloadTemplate = () => {
        window.open('/api/school/teachers/sample_csv/', '_blank')
    }

    const resetForm = () => {
        setFile(null)
        setPreview(null)
        setImportResult(null)
        setError('')
    }

    return (
        <div className="max-w-5xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
                <button
                    onClick={() => navigate('/school/teachers')}
                    className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Teachers
                </button>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Import Teachers</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Upload a CSV file to add multiple teachers at once
                        </p>
                    </div>
                    <button onClick={handleDownloadTemplate} className="btn btn-secondary">
                        <Download className="w-5 h-5" />
                        Download Template
                    </button>
                </div>
            </div>

            {/* Import Result */}
            {importResult && (
                <div className="card mb-6 p-6 bg-emerald-50 border-emerald-200">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-emerald-800">Import Complete!</h3>
                            <p className="text-emerald-700 mt-1">{importResult.message}</p>
                            <div className="flex gap-6 mt-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-emerald-700">{importResult.success_count}</p>
                                    <p className="text-sm text-emerald-600">Imported</p>
                                </div>
                                {importResult.error_count > 0 && (
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-red-600">{importResult.error_count}</p>
                                        <p className="text-sm text-red-500">Errors</p>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button onClick={() => navigate('/school/teachers')} className="btn btn-primary">
                                    View Teachers
                                </button>
                                <button onClick={resetForm} className="btn btn-secondary">
                                    Import More
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
            )}

            {/* Upload Area */}
            {!preview && !importResult && (
                <div className="card">
                    <div className="p-6">
                        <div
                            className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-colors ${dragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'
                                }`}
                            onDragEnter={handleDrag}
                            onDragOver={handleDrag}
                            onDragLeave={handleDrag}
                            onDrop={handleDrop}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                onChange={handleFileInput}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />

                            {loading ? (
                                <div className="flex flex-col items-center">
                                    <Loader2 className="w-12 h-12 text-primary-600 animate-spin mb-4" />
                                    <p className="text-lg font-medium text-gray-900">Processing file...</p>
                                </div>
                            ) : (
                                <>
                                    <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                                    <p className="text-lg font-medium text-gray-900 mb-2">Drop your CSV file here</p>
                                    <p className="text-sm text-gray-500 mb-4">or click to browse</p>
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="btn btn-secondary">
                                        <FileText className="w-5 h-5" />
                                        Select CSV File
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Instructions */}
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-medium text-gray-900 mb-2">CSV Format Requirements</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• <strong>Required:</strong> email, first_name, last_name, phone</li>
                                <li>• <strong>Optional:</strong> employee_id, qualification, date_of_joining, subjects</li>
                                <li>• Date format: YYYY-MM-DD</li>
                                <li>• Subjects: comma-separated list (must match existing subjects)</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview */}
            {preview && (
                <div className="space-y-6">
                    {/* Summary */}
                    <div className="card p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-emerald-700">{preview.valid_count}</p>
                                        <p className="text-sm text-gray-500">Valid</p>
                                    </div>
                                </div>
                                {preview.invalid_count > 0 && (
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                                            <XCircle className="w-5 h-5 text-red-600" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-red-700">{preview.invalid_count}</p>
                                            <p className="text-sm text-gray-500">Invalid</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button onClick={resetForm} className="btn btn-secondary">Cancel</button>
                                <button
                                    onClick={handleConfirmImport}
                                    className="btn btn-primary"
                                    disabled={importing || preview.valid_count === 0}
                                >
                                    {importing ? (
                                        <><Loader2 className="w-5 h-5 animate-spin" /> Importing...</>
                                    ) : (
                                        <><Users className="w-5 h-5" /> Import {preview.valid_count} Teachers</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Invalid Rows */}
                    {preview.invalid_rows?.length > 0 && (
                        <div className="card">
                            <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
                                <h3 className="font-semibold text-red-800 flex items-center gap-2">
                                    <XCircle className="w-5 h-5" /> Invalid Records ({preview.invalid_count})
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="table">
                                    <thead><tr><th>Row</th><th>Name</th><th>Email</th><th>Errors</th></tr></thead>
                                    <tbody>
                                        {preview.invalid_rows.map((row, idx) => (
                                            <tr key={idx} className="bg-red-50/50">
                                                <td>{row.row_number}</td>
                                                <td>{row.data.first_name} {row.data.last_name}</td>
                                                <td>{row.data.email}</td>
                                                <td>
                                                    <ul className="text-sm text-red-600">
                                                        {row.errors.map((err, i) => <li key={i}>• {err}</li>)}
                                                    </ul>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Valid Rows */}
                    {preview.valid_rows?.length > 0 && (
                        <div className="card">
                            <div className="px-6 py-4 border-b border-gray-200 bg-emerald-50">
                                <h3 className="font-semibold text-emerald-800 flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5" /> Valid Records ({preview.valid_count})
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="table">
                                    <thead><tr><th>Row</th><th>Name</th><th>Email</th><th>Phone</th><th>Subjects</th></tr></thead>
                                    <tbody>
                                        {preview.valid_rows.slice(0, 20).map((row, idx) => (
                                            <tr key={idx}>
                                                <td>{row.row_number}</td>
                                                <td className="font-medium">{row.data.first_name} {row.data.last_name}</td>
                                                <td>{row.data.email}</td>
                                                <td>{row.data.phone}</td>
                                                <td>{row.data.subjects || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
