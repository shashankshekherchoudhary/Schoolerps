import { useQuery } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import api from '../../services/api'
import { Save, Check, X, Users, Calendar, AlertCircle, Clock } from 'lucide-react'
import clsx from 'clsx'

export default function TeacherAttendance() {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [attendances, setAttendances] = useState({})
    const [isSaving, setIsSaving] = useState(false)
    const [saveSuccess, setSaveSuccess] = useState(false)
    const [saveError, setSaveError] = useState('')

    const { data: attendanceData, refetch, isLoading, error } = useQuery({
        queryKey: ['teacher-attendance', selectedDate],
        queryFn: () => api.get('/api/attendance/teachers/today/', { params: { date: selectedDate } }).then(res => res.data)
    })

    const handleStatusChange = (teacherId, status) => {
        setAttendances({ ...attendances, [teacherId]: status })
        setSaveSuccess(false)
        setSaveError('')
    }

    // Calculate unmarked teachers count
    const { unmarkedCount, allMarked, totalTeachers } = useMemo(() => {
        const teachers = attendanceData?.teachers || []
        const total = teachers.length
        let unmarked = 0

        for (const teacher of teachers) {
            // Check: local state first, then API status, else null (unmarked)
            const status = attendances[teacher.teacher_id] ?? teacher.status ?? null
            if (status === null) {
                unmarked++
            }
        }

        return {
            unmarkedCount: unmarked,
            allMarked: unmarked === 0 && total > 0,
            totalTeachers: total
        }
    }, [attendanceData?.teachers, attendances])

    const handleSave = async () => {
        // Validate: all teachers must be marked
        if (!allMarked) {
            setSaveError(`${unmarkedCount} teacher(s) not marked. Please mark all teachers before saving.`)
            return
        }

        setIsSaving(true)
        setSaveError('')

        try {
            const teachers = attendanceData?.teachers || []
            const data = {
                date: selectedDate,
                attendances: teachers.map(teacher => ({
                    teacher_id: teacher.teacher_id,
                    status: attendances[teacher.teacher_id] ?? teacher.status
                }))
            }
            await api.post('/api/attendance/teachers/bulk_mark/', data)
            refetch()
            setSaveSuccess(true)
            setAttendances({})
            setTimeout(() => setSaveSuccess(false), 3000)
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to save attendance. Please try again.'
            setSaveError(errorMsg)
        } finally {
            setIsSaving(false)
        }
    }

    // Mark all teachers with same status
    const markAll = (status) => {
        const teachers = attendanceData?.teachers || []
        const newAttendances = { ...attendances }
        for (const teacher of teachers) {
            newAttendances[teacher.teacher_id] = status
        }
        setAttendances(newAttendances)
    }

    // Get status for a teacher (null = not marked)
    const getStatus = (teacher) => {
        return attendances[teacher.teacher_id] ?? teacher.status ?? null
    }

    // Get badge class based on status
    const getBadgeClass = (status) => {
        if (status === 'present') return 'badge-success'
        if (status === 'absent') return 'badge-danger'
        if (status === 'late') return 'bg-amber-100 text-amber-700'
        if (status === 'half_day') return 'bg-orange-100 text-orange-700'
        if (status === 'on_leave' || status === 'leave') return 'bg-purple-100 text-purple-700'
        return 'bg-gray-200 text-gray-600' // Neutral/Not marked
    }

    // Get badge text
    const getBadgeText = (status) => {
        if (status === 'present') return 'Present'
        if (status === 'absent') return 'Absent'
        if (status === 'late') return 'Late'
        if (status === 'half_day') return 'Half Day'
        if (status === 'on_leave' || status === 'leave') return 'On Leave'
        return 'Not Marked'
    }

    const getStatusCounts = () => {
        const teachers = attendanceData?.teachers || []
        let present = 0, absent = 0, late = 0, leave = 0, notMarked = 0
        teachers.forEach(t => {
            const status = getStatus(t)
            if (status === 'present') present++
            else if (status === 'absent') absent++
            else if (status === 'late') late++
            else if (status === 'on_leave' || status === 'leave' || status === 'half_day') leave++
            else notMarked++
        })
        return { present, absent, late, leave, notMarked, total: teachers.length }
    }

    const counts = getStatusCounts()

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Teacher Attendance</h1>
                <p className="text-gray-500 mt-1">Mark daily attendance for teachers</p>
            </div>

            {/* Selection Card */}
            <div className="card">
                <div className="card-body">
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <div className="flex items-center gap-3">
                            <Calendar size={20} className="text-gray-500" />
                            <input
                                type="date"
                                className="input w-48"
                                value={selectedDate}
                                onChange={(e) => {
                                    setSelectedDate(e.target.value)
                                    setAttendances({}) // Reset when date changes
                                    setSaveError('')
                                }}
                            />
                        </div>
                        <div className="text-sm text-gray-500">
                            {attendanceData?.marked_count || 0} of {attendanceData?.total_count || 0} marked
                        </div>
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="card py-12 flex justify-center">
                    <div className="spinner"></div>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
                    <AlertCircle size={20} className="flex-shrink-0" />
                    <span>Failed to load teachers: {error.message}</span>
                </div>
            )}

            {/* Teacher Table */}
            {!isLoading && attendanceData?.teachers && (
                <>
                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
                            <p className="text-xl font-bold text-emerald-600">{counts.present}</p>
                            <p className="text-xs text-gray-500">Present</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
                            <p className="text-xl font-bold text-red-600">{counts.absent}</p>
                            <p className="text-xs text-gray-500">Absent</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
                            <p className="text-xl font-bold text-amber-600">{counts.late}</p>
                            <p className="text-xs text-gray-500">Late</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
                            <p className="text-xl font-bold text-purple-600">{counts.leave}</p>
                            <p className="text-xs text-gray-500">Leave</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
                            <p className="text-xl font-bold text-gray-500">{counts.notMarked}</p>
                            <p className="text-xs text-gray-500">Not Marked</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
                            <p className="text-xl font-bold text-gray-900">{counts.total}</p>
                            <p className="text-xs text-gray-500">Total</p>
                        </div>
                    </div>

                    {/* Validation Error */}
                    {saveError && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
                            <AlertCircle size={20} className="flex-shrink-0" />
                            <span>{saveError}</span>
                            <button onClick={() => setSaveError('')} className="ml-auto text-red-500 hover:text-red-700">
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    {/* Empty State */}
                    {attendanceData.teachers.length === 0 ? (
                        <div className="card py-16 text-center">
                            <Users size={48} className="mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">No Teachers Found</h3>
                            <p className="text-gray-500 mt-1">Add teachers first to mark attendance</p>
                        </div>
                    ) : (
                        <div className="card">
                            <div className="card-header flex items-center justify-between flex-wrap gap-4">
                                <div className="flex items-center gap-4">
                                    <h3 className="font-semibold text-gray-900">
                                        {attendanceData.teachers.length} Teachers
                                    </h3>
                                    {/* Mark All buttons */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => markAll('present')}
                                            className="btn btn-sm btn-secondary"
                                            title="Mark All Present"
                                        >
                                            <Check size={14} /> All Present
                                        </button>
                                        <button
                                            onClick={() => markAll('absent')}
                                            className="btn btn-sm btn-secondary"
                                            title="Mark All Absent"
                                        >
                                            <X size={14} /> All Absent
                                        </button>
                                    </div>
                                </div>
                                <button
                                    onClick={handleSave}
                                    className={clsx(
                                        "btn",
                                        saveSuccess ? "btn-success" : allMarked ? "btn-primary" : "btn-secondary opacity-70"
                                    )}
                                    disabled={isSaving || !allMarked}
                                    title={!allMarked ? 'Mark all teachers first' : 'Save Attendance'}
                                >
                                    {isSaving ? (
                                        <span className="spinner"></span>
                                    ) : saveSuccess ? (
                                        <>
                                            <Check size={18} />
                                            Saved!
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            Save Attendance
                                        </>
                                    )}
                                </button>
                            </div>
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Teacher Name</th>
                                            <th>Employee ID</th>
                                            <th className="w-32 text-center">Status</th>
                                            <th className="w-52">Mark Attendance</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {attendanceData.teachers.map((teacher) => {
                                            const status = getStatus(teacher)
                                            return (
                                                <tr key={teacher.teacher_id}>
                                                    <td className="font-medium text-gray-900">
                                                        {teacher.teacher_name}
                                                    </td>
                                                    <td className="text-gray-600">
                                                        {teacher.employee_id || '-'}
                                                    </td>
                                                    <td className="text-center">
                                                        <span className={clsx("badge", getBadgeClass(status))}>
                                                            {getBadgeText(status)}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <select
                                                            className="select w-full"
                                                            value={status || ''}
                                                            onChange={(e) => handleStatusChange(teacher.teacher_id, e.target.value)}
                                                        >
                                                            <option value="">-- Select --</option>
                                                            <option value="present">✓ Present</option>
                                                            <option value="absent">✕ Absent</option>
                                                            <option value="late">⏰ Late</option>
                                                            <option value="half_day">◐ Half Day</option>
                                                            <option value="on_leave">📅 On Leave</option>
                                                        </select>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
