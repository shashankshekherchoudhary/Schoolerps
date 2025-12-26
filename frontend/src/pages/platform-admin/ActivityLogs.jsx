import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'

export default function ActivityLogs() {
    const { data: logs, isLoading } = useQuery({
        queryKey: ['activity-logs'],
        queryFn: () => api.get('/api/platform/activity-logs/').then(res => res.data)
    })

    if (isLoading) return <div className="loading-container"><div className="spinner"></div></div>

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Activity Logs</h1>
                <p className="page-subtitle">Track all platform activities</p>
            </div>

            <div className="card">
                <div className="card-body" style={{ padding: 0 }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Action</th>
                                <th>School</th>
                                <th>Description</th>
                                <th>Performed By</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs?.results?.map((log) => (
                                <tr key={log.id}>
                                    <td><span className="badge badge-primary">{log.action_display}</span></td>
                                    <td>{log.school_name || 'N/A'}</td>
                                    <td>{log.description}</td>
                                    <td>{log.performed_by_name || 'System'}</td>
                                    <td className="text-muted text-sm">{new Date(log.created_at).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
