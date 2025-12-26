import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '../../services/api'
import { Save, ClipboardList, AlertCircle, Check } from 'lucide-react'

export default function EnterMarks() {
    const [searchParams] = useSearchParams()
    const [selectedExam, setSelectedExam] = useState('')
    const [selectedSection, setSelectedSection] = useState(searchParams.get('section') || '')
    const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subject') || '')
    const [marks, setMarks] = useState({})
    const [showSuccess, setShowSuccess] = useState(false)

    // Fetch teacher's assigned sections
    const { data: assignments } = useQuery({
        queryKey: ['my-assignments'],
        queryFn: () => api.get('/api/school/subject-teachers/my_assignments/').then(res => res.data)
    })

    // Fetch exams
    const { data: exams } = useQuery({
        queryKey: ['exams'],
        queryFn: () => api.get('/api/school/exams/').then(res => res.data)
    })

    // Fetch students when section is selected
    const { data: students, isLoading: loadingStudents } = useQuery({
        queryKey: ['section-students', selectedSection],
        queryFn: () => api.get('/api/school/students/', {
            params: { section: selectedSection }
        }).then(res => res.data),
        enabled: !!selectedSection
    })

    // Fetch existing marks
    const { data: existingMarks } = useQuery({
        queryKey: ['marks', selectedExam, selectedSection, selectedSubject],
        queryFn: () => api.get('/api/school/exam-results/', {
            params: { exam: selectedExam, section: selectedSection, subject: selectedSubject }
        }).then(res => res.data),
        enabled: !!(selectedExam && selectedSection && selectedSubject),
        onSuccess: (data) => {
            // Pre-fill marks
            const marksMap = {}
            data?.results?.forEach(result => {
                marksMap[result.student] = result.marks_obtained
            })
            setMarks(marksMap)
        }
    })

    const saveMutation = useMutation({
        mutationFn: (data) => api.post('/api/school/exam-results/bulk_save/', data),
        onSuccess: () => {
            setShowSuccess(true)
            setTimeout(() => setShowSuccess(false), 3000)
        }
    })

    const handleMarksChange = (studentId, value) => {
        setMarks(prev => ({
            ...prev,
            [studentId]: value
        }))
    }

    const handleSubmit = () => {
        const marksData = Object.entries(marks).map(([studentId, marksObtained]) => ({
            student: parseInt(studentId),
            exam: parseInt(selectedExam),
            subject: parseInt(selectedSubject),
            marks_obtained: parseFloat(marksObtained) || 0
        }))

        saveMutation.mutate({ results: marksData })
    }

    // Get unique sections from assignments
    const sections = assignments?.results?.map(a => ({
        id: a.section,
        name: a.section_name
    })).filter((s, i, arr) => arr.findIndex(x => x.id === s.id) === i) || []

    // Get subjects for selected section
    const subjectsForSection = assignments?.results?.filter(
        a => a.section === parseInt(selectedSection)
    ).map(a => ({
        id: a.subject,
        name: a.subject_name
    })) || []

    return (
        <div className="max-w-4xl mx-auto">
            <div className="page-header">
                <h1 className="page-title">Enter Marks</h1>
                <p className="page-subtitle">Record student exam scores</p>
            </div>

            {/* Success Message */}
            {showSuccess && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Check className="w-5 h-5 text-emerald-600" />
                    </div>
                    <p className="font-medium text-emerald-800">Marks saved successfully!</p>
                </div>
            )}

            {/* Filters */}
            <div className="card mb-6">
                <div className="card-header">
                    <h3 className="font-semibold">Select Class & Exam</h3>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Exam</label>
                        <select
                            value={selectedExam}
                            onChange={(e) => setSelectedExam(e.target.value)}
                            className="select"
                        >
                            <option value="">Select Exam</option>
                            {exams?.results?.map(exam => (
                                <option key={exam.id} value={exam.id}>{exam.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                        <select
                            value={selectedSection}
                            onChange={(e) => {
                                setSelectedSection(e.target.value)
                                setSelectedSubject('')
                            }}
                            className="select"
                        >
                            <option value="">Select Section</option>
                            {sections.map(section => (
                                <option key={section.id} value={section.id}>{section.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                        <select
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className="select"
                            disabled={!selectedSection}
                        >
                            <option value="">Select Subject</option>
                            {subjectsForSection.map(subject => (
                                <option key={subject.id} value={subject.id}>{subject.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Students & Marks Table */}
            {selectedExam && selectedSection && selectedSubject && (
                <div className="card">
                    <div className="card-header flex justify-between items-center">
                        <h3 className="font-semibold">Student Marks</h3>
                        <button
                            onClick={handleSubmit}
                            disabled={saveMutation.isLoading}
                            className="btn btn-primary"
                        >
                            <Save size={20} />
                            {saveMutation.isLoading ? 'Saving...' : 'Save Marks'}
                        </button>
                    </div>

                    {loadingStudents ? (
                        <div className="p-8 text-center">
                            <div className="spinner mx-auto"></div>
                        </div>
                    ) : students?.results?.length === 0 ? (
                        <div className="p-8 text-center">
                            <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">No students in this section</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Roll No.</th>
                                        <th>Student Name</th>
                                        <th>Admission No.</th>
                                        <th style={{ width: 150 }}>Marks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students?.results?.map((student) => (
                                        <tr key={student.id}>
                                            <td>{student.roll_number || '-'}</td>
                                            <td className="font-medium">{student.full_name}</td>
                                            <td>{student.admission_number}</td>
                                            <td>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={marks[student.id] || ''}
                                                    onChange={(e) => handleMarksChange(student.id, e.target.value)}
                                                    className="input"
                                                    placeholder="0-100"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Empty State */}
            {(!selectedExam || !selectedSection || !selectedSubject) && (
                <div className="card p-12 text-center">
                    <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select Exam & Class</h3>
                    <p className="text-gray-500">Choose an exam, section, and subject to enter marks</p>
                </div>
            )}
        </div>
    )
}
