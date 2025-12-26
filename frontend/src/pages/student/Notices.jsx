import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import { Bell } from 'lucide-react'

export default function StudentNotices() {
    const { data, isLoading } = useQuery({
        queryKey: ['student-notices'],
        queryFn: () => api.get('/api/notices/student/').then(res => res.data)
    })

    if (isLoading) return <div className="loading-container"><div className="spinner"></div></div>

    return (
        <div>
            <div className="page-header"><h1 className="page-title">Notices</h1></div>

            <div className="grid gap-4">
                {data?.map((notice) => (
                    <div key={notice.id} className="card">
                        <div className="card-body">
                            <div className="flex justify-between items-start">
                                <div className="flex gap-4">
                                    <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'var(--primary-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Bell size={24} style={{ color: 'var(--primary-600)' }} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{notice.title}</h3>
                                        <p className="text-muted text-sm" style={{ marginTop: 'var(--space-2)' }}>{notice.content}</p>
                                        <p className="text-muted text-sm" style={{ marginTop: 'var(--space-4)' }}>Posted on {new Date(notice.publish_date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <span className={`badge badge-${notice.priority === 'urgent' ? 'danger' : notice.priority === 'high' ? 'warning' : 'info'}`}>{notice.priority_display}</span>
                            </div>
                        </div>
                    </div>
                ))}

                {!data?.length && <div className="empty-state"><p>No notices available.</p></div>}
            </div>
        </div>
    )
}
