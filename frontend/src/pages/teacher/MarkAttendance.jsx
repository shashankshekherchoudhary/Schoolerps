import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import api from '../../services/api'
import { Save, Check, X, Users } from 'lucide-react'

export default function MarkAttendance() {
    const [selectedSection, setSelectedSection] = useState('')
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [attendances, setAttendances] = useState({})
    const [isSaving, setIsSaving] = useState(false)

    const { data: dashboard } = useQuery({ queryKey: ['teacher-dashboard'], queryFn: () => api.get('/api/school/teacher/dashboard/').then(res => res.data) })

    const { data: attendanceData, refetch } = useQuery({
        queryKey: ['teacher-student-attendance', selectedSection, selectedDate],
        queryFn: () => api.get('/api/attendance/students/by_section/', { params: { section: selectedSection, date: selectedDate } }).then(res => res.data),
        enabled: !!selectedSection
    })

    const handleSave = async () => {
        setIsSaving(true)
        const data = {
            section: parseInt(selectedSection),
            date: selectedDate,
            attendances: Object.entries(attendances).map(([studentId, status]) => ({ student_id: parseInt(studentId), status }))
        }
        await api.post('/api/attendance/students/bulk_mark/', data)
        refetch()
        setIsSaving(false)
    }

    // Get sections from class teacher assignment
    const sections = dashboard?.class_teacher_of ? [{ id: dashboard.class_teacher_of.id, name: dashboard.class_teacher_of.section }] : []

    return (
        <div className="space-y-6">
            <div className="page-header"><h1 className="page-title">Mark Attendance</h1></div>

            <div className="card">
                <div className="card-body flex flex-col sm:flex-row gap-4 items-center">
                    <select
                        className="form-select w-full sm:w-64"
                        value={selectedSection}
                        onChange={(e) => setSelectedSection(e.target.value)}
                    >
                        <option value="">Select Your Class</option>
                        {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <input
                        type="date"
                        className="form-input w-full sm:w-auto"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                    />
                    {selectedSection && (
                        <button onClick={handleSave} className="btn btn-primary sm:ml-auto" disabled={isSaving}>
                            <Save size={20} /> {isSaving ? 'Saving...' : 'Save'}
                        </button>
                    )}
                </div>
            </div>

            {!selectedSection ? (
                <div className="card py-16 flex flex-col items-center justify-center text-center">
                    <div className="p-4 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 mb-4">
                        <Users size={48} />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Select a Class</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                        Choose your class to start marking today's attendance.
                        Attendance is marked once per day.
                    </p>
                </div>
            ) : (
                attendanceData?.students && (
                    <div className="card">
                        <div className="card-body p-0">
                            <div className="overflow-x-auto">
                                <table className="table">
                                    <thead><tr><th>Roll No</th><th>Name</th><th>Status</th><th>Actions</th></tr></thead>
                                    <tbody>
                                        {attendanceData.students.map((student) => {
                                            const status = attendances[student.student_id] ?? student.status ?? 'present'
                                            return (
                                                <tr key={student.student_id}>
                                                    <td className="text-gray-600 dark:text-gray-300">{student.roll_number || '-'}</td>
                                                    <td className="font-medium text-gray-900 dark:text-white">{student.student_name}</td>
                                                    <td><span className={`badge badge-${status === 'present' ? 'success' : 'danger'}`}>{status}</span></td>
                                                    <td>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => setAttendances({ ...attendances, [student.student_id]: 'present' })} className={`btn btn-sm ${status === 'present' ? 'btn-success' : 'btn-secondary'}`} title="Mark Present"><Check size={16} /></button>
                                                            <button onClick={() => setAttendances({ ...attendances, [student.student_id]: 'absent' })} className={`btn btn-sm ${status === 'absent' ? 'btn-danger' : 'btn-secondary'}`} title="Mark Absent"><X size={16} /></button>
                                                        </div>
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
            )}
        </div>
    )
}
