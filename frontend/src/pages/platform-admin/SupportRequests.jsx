import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'

export default function SupportRequests() {
    const { data: tickets, isLoading, refetch } = useQuery({
        queryKey: ['support-requests'],
        queryFn: () => api.get('/api/platform/support-requests/').then(res => res.data)
    })

    const handleClose = async (id) => {
        await api.post(`/api/platform/support-requests/${id}/close/`, { resolution_notes: 'Resolved' })
        refetch()
    }

    if (isLoading) return <div className="loading-container"><div className="spinner"></div></div>

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Support Requests</h1>
                <p className="page-subtitle">Manage support tickets from schools</p>
            </div>

            <div className="card">
                <div className="card-body" style={{ padding: 0 }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Subject</th>
                                <th>School</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tickets?.results?.map((ticket) => (
                                <tr key={ticket.id}>
                                    <td className="font-medium">{ticket.subject}</td>
                                    <td>{ticket.school_name}</td>
                                    <td><span className={`badge badge-${ticket.status === 'open' ? 'warning' : 'success'}`}>{ticket.status_display}</span></td>
                                    <td className="text-muted text-sm">{new Date(ticket.created_at).toLocaleString()}</td>
                                    <td>
                                        {ticket.status === 'open' && (
                                            <button onClick={() => handleClose(ticket.id)} className="btn btn-sm btn-success">Close</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
