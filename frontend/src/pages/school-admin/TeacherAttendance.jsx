import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import api from '../../services/api'
import { Save } from 'lucide-react'

export default function TeacherAttendance() {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [attendances, setAttendances] = useState({})
    const [isSaving, setIsSaving] = useState(false)

    const { data: attendanceData, refetch } = useQuery({
        queryKey: ['teacher-attendance', selectedDate],
        queryFn: () => api.get('/api/attendance/teachers/today/', { params: { date: selectedDate } }).then(res => res.data)
    })

    const handleSave = async () => {
        setIsSaving(true)
        const data = {
            date: selectedDate,
            attendances: Object.entries(attendances).map(([teacherId, status]) => ({ teacher_id: parseInt(teacherId), status }))
        }
        await api.post('/api/attendance/teachers/bulk_mark/', data)
        refetch()
        setIsSaving(false)
    }

    return (
        <div>
            <div className="page-header"><h1 className="page-title">Teacher Attendance</h1></div>

            <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                <div className="card-body flex gap-4 items-center">
                    <input type="date" className="form-input" style={{ width: 200 }} value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                    <button onClick={handleSave} className="btn btn-primary" disabled={isSaving}><Save size={20} /> {isSaving ? 'Saving...' : 'Save Attendance'}</button>
                </div>
            </div>

            <div className="card">
                <div className="card-body" style={{ padding: 0 }}>
                    <table className="table">
                        <thead><tr><th>Name</th><th>Employee ID</th><th>Status</th></tr></thead>
                        <tbody>
                            {attendanceData?.teachers?.map((teacher) => {
                                const status = attendances[teacher.teacher_id] ?? teacher.status ?? 'present'
                                return (
                                    <tr key={teacher.teacher_id}>
                                        <td className="font-medium">{teacher.teacher_name}</td>
                                        <td>{teacher.employee_id || 'N/A'}</td>
                                        <td>
                                            <select className="form-select" style={{ width: 150 }} value={status} onChange={(e) => setAttendances({ ...attendances, [teacher.teacher_id]: e.target.value })}>
                                                <option value="present">Present</option>
                                                <option value="absent">Absent</option>
                                                <option value="late">Late</option>
                                                <option value="half_day">Half Day</option>
                                                <option value="on_leave">On Leave</option>
                                            </select>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
