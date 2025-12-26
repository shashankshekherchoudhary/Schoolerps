import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'

export default function StudentAttendanceView() {
    const { data, isLoading } = useQuery({
        queryKey: ['student-attendance-history'],
        queryFn: () => api.get('/api/attendance/student/history/').then(res => res.data)
    })

    if (isLoading) return <div className="loading-container"><div className="spinner"></div></div>

    return (
        <div>
            <div className="page-header"><h1 className="page-title">My Attendance</h1></div>

            <div className="grid grid-cols-4 gap-6" style={{ marginBottom: 'var(--space-6)' }}>
                <div className="stat-card"><div className="stat-value">{data?.summary?.total_days || 0}</div><div className="stat-label">Total Days</div></div>
                <div className="stat-card"><div className="stat-value text-success">{data?.summary?.present_days || 0}</div><div className="stat-label">Present</div></div>
                <div className="stat-card"><div className="stat-value text-danger">{data?.summary?.absent_days || 0}</div><div className="stat-label">Absent</div></div>
                <div className="stat-card"><div className="stat-value">{data?.summary?.percentage || 0}%</div><div className="stat-label">Attendance %</div></div>
            </div>

            <div className="card">
                <div className="card-header"><h3 className="font-semibold">Recent Attendance</h3></div>
                <div className="card-body" style={{ padding: 0 }}>
                    <table className="table">
                        <thead><tr><th>Date</th><th>Status</th></tr></thead>
                        <tbody>
                            {data?.records?.map((record) => (
                                <tr key={record.id}>
                                    <td>{new Date(record.date).toLocaleDateString()}</td>
                                    <td><span className={`badge badge-${record.status === 'present' ? 'success' : 'danger'}`}>{record.status_display}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
