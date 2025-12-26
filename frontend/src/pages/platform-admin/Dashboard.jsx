import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import { School, Activity, AlertCircle, CheckCircle } from 'lucide-react'

export default function PlatformDashboard() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['platform-dashboard'],
        queryFn: () => api.get('/api/platform/dashboard/').then(res => res.data)
    })

    if (isLoading) {
        return <div className="loading-container"><div className="spinner"></div></div>
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Platform Dashboard</h1>
                <p className="page-subtitle">Overview of all schools on the platform</p>
            </div>

            <div className="grid grid-cols-4 gap-6" style={{ marginBottom: 'var(--space-6)' }}>
                <div className="stat-card">
                    <div className="stat-icon primary"><School size={24} /></div>
                    <div className="stat-value">{stats?.total_schools || 0}</div>
                    <div className="stat-label">Total Schools</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon success"><CheckCircle size={24} /></div>
                    <div className="stat-value">{stats?.active_schools || 0}</div>
                    <div className="stat-label">Active Schools</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon danger"><AlertCircle size={24} /></div>
                    <div className="stat-value">{stats?.suspended_schools || 0}</div>
                    <div className="stat-label">Suspended</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon warning"><Activity size={24} /></div>
                    <div className="stat-value">{stats?.open_tickets || 0}</div>
                    <div className="stat-label">Open Tickets</div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 className="font-semibold">Recent Activity</h3>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Action</th>
                                <th>School</th>
                                <th>Description</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats?.recent_activity?.map((log) => (
                                <tr key={log.id}>
                                    <td><span className="badge badge-primary">{log.action_display}</span></td>
                                    <td>{log.school_name || 'N/A'}</td>
                                    <td>{log.description}</td>
                                    <td className="text-muted text-sm">
                                        {new Date(log.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                            {!stats?.recent_activity?.length && (
                                <tr>
                                    <td colSpan={4} className="text-center text-muted">No recent activity</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
