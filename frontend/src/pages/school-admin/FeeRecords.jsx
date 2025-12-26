import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import { useState } from 'react'
import { DollarSign, AlertTriangle, CheckCircle, User, Search } from 'lucide-react'
import clsx from 'clsx'

export default function FeeRecords() {
    const [showPayment, setShowPayment] = useState(null)
    const [paymentAmount, setPaymentAmount] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)

    const { data: records, refetch } = useQuery({
        queryKey: ['fee-records-pending'],
        queryFn: () => api.get('/api/fees/records/pending/').then(res => res.data)
    })

    const handlePayment = async (studentId) => {
        setIsProcessing(true)
        await api.post('/api/fees/payments/record_payment/', {
            fee_record: studentId,
            amount: parseFloat(paymentAmount),
            payment_mode: 'cash',
            payment_date: new Date().toISOString().split('T')[0]
        })
        setShowPayment(null)
        setPaymentAmount('')
        setIsProcessing(false)
        refetch()
    }

    const filteredRecords = records?.filter(r =>
        r.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.admission_number.toLowerCase().includes(searchTerm.toLowerCase())
    ) || []

    const totalPending = filteredRecords.reduce((sum, r) => sum + (r.total_balance || 0), 0)

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Fee Records</h1>
                    <p className="text-gray-500 mt-1">Manage student fee payments and defaulters</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="stat-card">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-red-50">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">
                                ₹{totalPending.toLocaleString('en-IN')}
                            </p>
                            <p className="text-sm text-gray-500">Total Pending</p>
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-amber-50">
                            <User className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{filteredRecords.length}</p>
                            <p className="text-sm text-gray-500">Students with Dues</p>
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-emerald-50">
                            <CheckCircle className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">Today</p>
                            <p className="text-sm text-gray-500">Collect Fees</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="card">
                <div className="card-body">
                    <div className="relative max-w-md">
                        <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            className="input pl-10"
                            placeholder="Search by student name or admission number..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Fee Records Table */}
            <div className="card">
                <div className="card-header">
                    <h3 className="font-semibold text-gray-900">Pending Fee Collections</h3>
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Class</th>
                                <th className="text-right">Total Fees</th>
                                <th className="text-right">Paid</th>
                                <th className="text-right">Balance</th>
                                <th className="w-48 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecords.map((record) => (
                                <tr key={record.student_id}>
                                    <td>
                                        <div>
                                            <p className="font-medium text-gray-900">{record.student_name}</p>
                                            <p className="text-xs text-gray-500">{record.admission_number}</p>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge badge-info">{record.class_name}</span>
                                    </td>
                                    <td className="text-right font-medium text-gray-900">
                                        ₹{record.total_fees?.toLocaleString('en-IN')}
                                    </td>
                                    <td className="text-right text-emerald-600 font-medium">
                                        ₹{record.total_paid?.toLocaleString('en-IN')}
                                    </td>
                                    <td className="text-right">
                                        <span className="text-lg font-bold text-red-600">
                                            ₹{record.total_balance?.toLocaleString('en-IN')}
                                        </span>
                                    </td>
                                    <td>
                                        {showPayment === record.student_id ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    className="input py-1.5 w-24"
                                                    placeholder="Amount"
                                                    value={paymentAmount}
                                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={() => handlePayment(record.student_id)}
                                                    className="btn btn-success btn-sm"
                                                    disabled={isProcessing || !paymentAmount}
                                                >
                                                    {isProcessing ? <span className="spinner"></span> : 'Pay'}
                                                </button>
                                                <button
                                                    onClick={() => setShowPayment(null)}
                                                    className="btn btn-secondary btn-sm"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setShowPayment(record.student_id)}
                                                className="btn btn-primary btn-sm"
                                            >
                                                <DollarSign size={16} />
                                                Record Payment
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredRecords.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center py-8">
                                        <CheckCircle size={48} className="mx-auto text-emerald-300 mb-3" />
                                        <p className="text-gray-500">No pending fee records found</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
