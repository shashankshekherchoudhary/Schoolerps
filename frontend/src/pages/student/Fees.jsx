import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'

export default function StudentFees() {
    const { data, isLoading } = useQuery({
        queryKey: ['student-fees'],
        queryFn: () => api.get('/api/fees/student/').then(res => res.data)
    })

    if (isLoading) return <div className="loading-container"><div className="spinner"></div></div>

    return (
        <div>
            <div className="page-header"><h1 className="page-title">My Fees</h1></div>

            <div className="grid grid-cols-3 gap-6" style={{ marginBottom: 'var(--space-6)' }}>
                <div className="stat-card"><div className="stat-value">₹{data?.summary?.total_fees || 0}</div><div className="stat-label">Total Fees</div></div>
                <div className="stat-card"><div className="stat-value text-success">₹{data?.summary?.total_paid || 0}</div><div className="stat-label">Paid</div></div>
                <div className="stat-card"><div className="stat-value text-danger">₹{data?.summary?.total_balance || 0}</div><div className="stat-label">Balance Due</div></div>
            </div>

            {data?.pending_records?.length > 0 && (
                <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                    <div className="card-header"><h3 className="font-semibold text-danger">Pending Payments</h3></div>
                    <div className="card-body" style={{ padding: 0 }}>
                        <table className="table">
                            <thead><tr><th>Fee</th><th>Month</th><th>Amount</th><th>Due Date</th><th>Balance</th></tr></thead>
                            <tbody>
                                {data.pending_records.map((record) => (
                                    <tr key={record.id}>
                                        <td>{record.fee_name}</td>
                                        <td>{record.month}/{record.year}</td>
                                        <td>₹{record.total_amount}</td>
                                        <td>{new Date(record.due_date).toLocaleDateString()}</td>
                                        <td className="text-danger font-semibold">₹{record.balance}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="card">
                <div className="card-header"><h3 className="font-semibold">Payment History</h3></div>
                <div className="card-body" style={{ padding: 0 }}>
                    <table className="table">
                        <thead><tr><th>Fee</th><th>Month</th><th>Total</th><th>Paid</th><th>Status</th></tr></thead>
                        <tbody>
                            {data?.all_records?.map((record) => (
                                <tr key={record.id}>
                                    <td>{record.fee_name}</td>
                                    <td>{record.month}/{record.year}</td>
                                    <td>₹{record.total_amount}</td>
                                    <td>₹{record.paid_amount}</td>
                                    <td><span className={`badge badge-${record.status === 'paid' ? 'success' : 'warning'}`}>{record.status_display}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
