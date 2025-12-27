import { useQuery } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import api from '../../services/api'
import { Save, Check, X, Users, AlertCircle } from 'lucide-react'

export default function MarkAttendance() {
    const [selectedSection, setSelectedSection] = useState('')
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [attendances, setAttendances] = useState({})
    const [isSaving, setIsSaving] = useState(false)
    const [saveError, setSaveError] = useState('')

    const { data: dashboard } = useQuery({ queryKey: ['teacher-dashboard'], queryFn: () => api.get('/api/school/teacher/dashboard/').then(res => res.data) })

    const { data: attendanceData, refetch } = useQuery({
        queryKey: ['teacher-student-attendance', selectedSection, selectedDate],
        queryFn: () => api.get('/api/attendance/students/by_section/', { params: { section: selectedSection, date: selectedDate } }).then(res => res.data),
        enabled: !!selectedSection
    })

    // Calculate unmarked students count
    const { unmarkedCount, allMarked, totalStudents } = useMemo(() => {
        const students = attendanceData?.students || []
        const total = students.length
        let unmarked = 0

        for (const student of students) {
            // Check: local state first, then API status, else null (unmarked)
            const status = attendances[student.student_id] ?? student.status ?? null
            if (status === null) {
                unmarked++
            }
        }

        return {
            unmarkedCount: unmarked,
            allMarked: unmarked === 0 && total > 0,
            totalStudents: total
        }
    }, [attendanceData?.students, attendances])

    const handleSave = async () => {
        // Validate: all students must be marked
        if (!allMarked) {
            setSaveError(`${unmarkedCount} student(s) not marked. Please mark all students before saving.`)
            return
        }

        setSaveError('')
        setIsSaving(true)

        try {
            const students = attendanceData?.students || []
            const data = {
                section: parseInt(selectedSection),
                date: selectedDate,
                attendances: students.map(student => ({
                    student_id: student.student_id,
                    status: attendances[student.student_id] ?? student.status
                }))
            }
            await api.post('/api/attendance/students/bulk_mark/', data)
            refetch()
        } catch (err) {
            setSaveError(err.response?.data?.error || 'Failed to save attendance')
        }

        setIsSaving(false)
    }

    // Mark all students present/absent at once
    const markAll = (status) => {
        const students = attendanceData?.students || []
        const newAttendances = { ...attendances }
        for (const student of students) {
            newAttendances[student.student_id] = status
        }
        setAttendances(newAttendances)
    }

    // Get sections from class teacher assignment
    const sections = dashboard?.class_teacher_of ? [{ id: dashboard.class_teacher_of.id, name: dashboard.class_teacher_of.section }] : []

    // Get status for a student (null = not marked)
    const getStatus = (student) => {
        return attendances[student.student_id] ?? student.status ?? null
    }

    // Get badge class based on status
    const getBadgeClass = (status) => {
        if (status === 'present') return 'badge-success'
        if (status === 'absent') return 'badge-danger'
        return 'bg-gray-200 text-gray-600' // Neutral/Not marked
    }

    // Get badge text
    const getBadgeText = (status) => {
        if (status === 'present') return 'Present'
        if (status === 'absent') return 'Absent'
        return 'Not Marked'
    }

    return (
        <div className="space-y-6">
            <div className="page-header"><h1 className="page-title">Mark Attendance</h1></div>

            <div className="card">
                <div className="card-body flex flex-col sm:flex-row gap-4 items-center">
                    <select
                        className="form-select w-full sm:w-64"
                        value={selectedSection}
                        onChange={(e) => {
                            setSelectedSection(e.target.value)
                            setAttendances({}) // Reset when section changes
                            setSaveError('')
                        }}
                    >
                        <option value="">Select Your Class</option>
                        {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <input
                        type="date"
                        className="form-input w-full sm:w-auto"
                        value={selectedDate}
                        onChange={(e) => {
                            setSelectedDate(e.target.value)
                            setAttendances({}) // Reset when date changes
                            setSaveError('')
                        }}
                    />
                    {selectedSection && attendanceData?.students?.length > 0 && (
                        <div className="flex gap-2 sm:ml-auto">
                            <button
                                onClick={() => markAll('present')}
                                className="btn btn-sm btn-secondary"
                                title="Mark All Present"
                            >
                                <Check size={16} /> All Present
                            </button>
                            <button
                                onClick={() => markAll('absent')}
                                className="btn btn-sm btn-secondary"
                                title="Mark All Absent"
                            >
                                <X size={16} /> All Absent
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Validation Error */}
            {saveError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{saveError}</span>
                </div>
            )}

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
                        {/* Summary bar */}
                        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-medium text-gray-900 dark:text-white">{totalStudents}</span> students
                                {unmarkedCount > 0 && (
                                    <span className="ml-2 text-amber-600 dark:text-amber-400">
                                        • <span className="font-medium">{unmarkedCount}</span> not marked
                                    </span>
                                )}
                                {allMarked && (
                                    <span className="ml-2 text-emerald-600 dark:text-emerald-400">
                                        • All marked ✓
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={handleSave}
                                className={`btn ${allMarked ? 'btn-primary' : 'btn-secondary opacity-70'}`}
                                disabled={isSaving || !allMarked}
                                title={!allMarked ? 'Mark all students first' : 'Save Attendance'}
                            >
                                <Save size={18} /> {isSaving ? 'Saving...' : 'Save Attendance'}
                            </button>
                        </div>

                        <div className="card-body p-0">
                            <div className="overflow-x-auto">
                                <table className="table">
                                    <thead><tr><th>Roll No</th><th>Name</th><th>Status</th><th>Actions</th></tr></thead>
                                    <tbody>
                                        {attendanceData.students.map((student) => {
                                            const status = getStatus(student)
                                            return (
                                                <tr key={student.student_id}>
                                                    <td className="text-gray-600 dark:text-gray-300">{student.roll_number || '-'}</td>
                                                    <td className="font-medium text-gray-900 dark:text-white">{student.student_name}</td>
                                                    <td>
                                                        <span className={`badge ${getBadgeClass(status)}`}>
                                                            {getBadgeText(status)}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => setAttendances({ ...attendances, [student.student_id]: 'present' })}
                                                                className={`btn btn-sm ${status === 'present' ? 'btn-success' : 'btn-secondary'}`}
                                                                title="Mark Present"
                                                            >
                                                                <Check size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => setAttendances({ ...attendances, [student.student_id]: 'absent' })}
                                                                className={`btn btn-sm ${status === 'absent' ? 'btn-danger' : 'btn-secondary'}`}
                                                                title="Mark Absent"
                                                            >
                                                                <X size={16} />
                                                            </button>
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
