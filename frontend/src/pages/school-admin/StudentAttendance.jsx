import { useQuery } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import api from '../../services/api'
import { Save, Check, X, Users, Calendar, AlertCircle } from 'lucide-react'
import clsx from 'clsx'

export default function StudentAttendance() {
    const [selectedSection, setSelectedSection] = useState('')
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [attendances, setAttendances] = useState({})
    const [isSaving, setIsSaving] = useState(false)
    const [saveSuccess, setSaveSuccess] = useState(false)
    const [saveError, setSaveError] = useState('')

    const { data: classes } = useQuery({
        queryKey: ['classes'],
        queryFn: () => api.get('/api/school/classes/').then(res => res.data)
    })

    const { data: attendanceData, refetch } = useQuery({
        queryKey: ['student-attendance', selectedSection, selectedDate],
        queryFn: () => api.get('/api/attendance/students/by_section/', {
            params: { section: selectedSection, date: selectedDate }
        }).then(res => res.data),
        enabled: !!selectedSection
    })

    const handleStatusChange = (studentId, status) => {
        setAttendances({ ...attendances, [studentId]: status })
        setSaveSuccess(false)
        setSaveError('')
    }

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

        setIsSaving(true)
        setSaveError('')

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

    // Mark all students present/absent at once
    const markAll = (status) => {
        const students = attendanceData?.students || []
        const newAttendances = { ...attendances }
        for (const student of students) {
            newAttendances[student.student_id] = status
        }
        setAttendances(newAttendances)
    }

    const allSections = classes?.results?.flatMap(c =>
        c.sections?.map(s => ({ ...s, className: c.name }))
    ) || []

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

    const getStatusCounts = () => {
        const students = attendanceData?.students || []
        let present = 0, absent = 0, notMarked = 0
        students.forEach(s => {
            const status = getStatus(s)
            if (status === 'present') present++
            else if (status === 'absent') absent++
            else notMarked++
        })
        return { present, absent, notMarked, total: students.length }
    }

    const counts = getStatusCounts()

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Student Attendance</h1>
                <p className="text-gray-500 mt-1">Mark daily attendance for students</p>
            </div>

            {/* Selection Card */}
            <div className="card">
                <div className="card-body">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <label className="label">
                                <Users size={16} className="inline mr-2 text-gray-500" />
                                Select Class & Section
                            </label>
                            <select
                                className="select"
                                value={selectedSection}
                                onChange={(e) => {
                                    setSelectedSection(e.target.value)
                                    setAttendances({}) // Reset when section changes
                                    setSaveError('')
                                }}
                            >
                                <option value="">Choose a section...</option>
                                {allSections.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.className} - Section {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="sm:w-48">
                            <label className="label">
                                <Calendar size={16} className="inline mr-2 text-gray-500" />
                                Date
                            </label>
                            <input
                                type="date"
                                className="input"
                                value={selectedDate}
                                onChange={(e) => {
                                    setSelectedDate(e.target.value)
                                    setAttendances({}) // Reset when date changes
                                    setSaveError('')
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Attendance Table */}
            {selectedSection && attendanceData?.students && (
                <>
                    {/* Quick Stats */}
                    <div className="grid grid-cols-4 gap-4">
                        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                            <p className="text-2xl font-bold text-emerald-600">{counts.present}</p>
                            <p className="text-sm text-gray-500">Present</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                            <p className="text-2xl font-bold text-red-600">{counts.absent}</p>
                            <p className="text-sm text-gray-500">Absent</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                            <p className="text-2xl font-bold text-amber-600">{counts.notMarked}</p>
                            <p className="text-sm text-gray-500">Not Marked</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                            <p className="text-2xl font-bold text-gray-900">{counts.total}</p>
                            <p className="text-sm text-gray-500">Total</p>
                        </div>
                    </div>

                    {/* Error Message */}
                    {saveError && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
                            <AlertCircle size={20} className="flex-shrink-0" />
                            <span>{saveError}</span>
                            <button onClick={() => setSaveError('')} className="ml-auto text-red-500 hover:text-red-700">
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    {/* Student Table */}
                    <div className="card">
                        <div className="card-header flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <h3 className="font-semibold text-gray-900">
                                    {attendanceData.students.length} Students
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
                                title={!allMarked ? 'Mark all students first' : 'Save Attendance'}
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
                                        <th className="w-20">Roll No</th>
                                        <th>Student Name</th>
                                        <th className="w-32 text-center">Status</th>
                                        <th className="w-48 text-center">Mark Attendance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendanceData.students.map((student) => {
                                        const status = getStatus(student)
                                        return (
                                            <tr key={student.student_id}>
                                                <td className="font-medium text-gray-900">
                                                    {student.roll_number || '-'}
                                                </td>
                                                <td>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{student.student_name}</p>
                                                        <p className="text-xs text-gray-500">{student.admission_number}</p>
                                                    </div>
                                                </td>
                                                <td className="text-center">
                                                    <span className={clsx("badge", getBadgeClass(status))}>
                                                        {getBadgeText(status)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleStatusChange(student.student_id, 'present')}
                                                            className={clsx(
                                                                "p-2.5 rounded-lg border-2 transition-all",
                                                                status === 'present'
                                                                    ? "bg-emerald-50 border-emerald-500 text-emerald-600"
                                                                    : "bg-white border-gray-200 text-gray-500 hover:border-emerald-300 hover:text-emerald-500"
                                                            )}
                                                        >
                                                            <Check size={20} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusChange(student.student_id, 'absent')}
                                                            className={clsx(
                                                                "p-2.5 rounded-lg border-2 transition-all",
                                                                status === 'absent'
                                                                    ? "bg-red-50 border-red-500 text-red-600"
                                                                    : "bg-white border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500"
                                                            )}
                                                        >
                                                            <X size={20} />
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
                </>
            )}

            {/* Empty State */}
            {!selectedSection && (
                <div className="card">
                    <div className="card-body py-16 text-center">
                        <Users size={48} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">Select a Section</h3>
                        <p className="text-gray-500 mt-1">Choose a class and section to mark attendance</p>
                    </div>
                </div>
            )}
        </div>
    )
}
