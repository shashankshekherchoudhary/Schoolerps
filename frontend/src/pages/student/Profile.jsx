import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'

export default function StudentProfile() {
    const { data, isLoading } = useQuery({
        queryKey: ['student-profile'],
        queryFn: () => api.get('/api/school/student/profile/').then(res => res.data)
    })

    if (isLoading) return <div className="loading-container"><div className="spinner"></div></div>

    const student = data?.student

    return (
        <div>
            <div className="page-header"><h1 className="page-title">My Profile</h1></div>

            <div className="card" style={{ maxWidth: 800 }}>
                <div className="card-body">
                    <div className="grid grid-cols-2 gap-6">
                        <div><label className="text-muted text-sm">Full Name</label><p className="font-medium">{student?.full_name}</p></div>
                        <div><label className="text-muted text-sm">Admission Number</label><p className="font-medium">{student?.admission_number}</p></div>
                        <div><label className="text-muted text-sm">Class</label><p className="font-medium">{student?.class_name || 'N/A'}</p></div>
                        <div><label className="text-muted text-sm">Roll Number</label><p className="font-medium">{student?.roll_number || 'N/A'}</p></div>
                        <div><label className="text-muted text-sm">Date of Birth</label><p className="font-medium">{student?.date_of_birth || 'N/A'}</p></div>
                        <div><label className="text-muted text-sm">Gender</label><p className="font-medium">{student?.gender || 'N/A'}</p></div>
                        <div><label className="text-muted text-sm">Email</label><p className="font-medium">{student?.email}</p></div>
                        <div><label className="text-muted text-sm">Phone</label><p className="font-medium">{student?.phone || 'N/A'}</p></div>
                    </div>

                    <h3 className="font-semibold" style={{ marginTop: 'var(--space-8)', marginBottom: 'var(--space-4)' }}>Parent Information</h3>
                    <div className="grid grid-cols-2 gap-6">
                        <div><label className="text-muted text-sm">Parent Name</label><p className="font-medium">{student?.parent_name || 'N/A'}</p></div>
                        <div><label className="text-muted text-sm">Parent Phone</label><p className="font-medium">{student?.parent_phone || 'N/A'}</p></div>
                        <div><label className="text-muted text-sm">Parent Email</label><p className="font-medium">{student?.parent_email || 'N/A'}</p></div>
                    </div>
                </div>
            </div>
        </div>
    )
}
