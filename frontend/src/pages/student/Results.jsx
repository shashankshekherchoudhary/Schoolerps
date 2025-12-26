import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import { Download } from 'lucide-react'

export default function StudentResults() {
    const { data, isLoading } = useQuery({
        queryKey: ['student-results'],
        queryFn: () => api.get('/api/exams/student/results/').then(res => res.data)
    })

    const handleDownload = async (reportCardId) => {
        window.open(`/api/exams/student/report-card/${reportCardId}/download/`, '_blank')
    }

    if (isLoading) return <div className="loading-container"><div className="spinner"></div></div>

    return (
        <div>
            <div className="page-header"><h1 className="page-title">My Results</h1></div>

            {data?.map((exam) => (
                <div key={exam.exam_id} className="card" style={{ marginBottom: 'var(--space-6)' }}>
                    <div className="card-header flex justify-between items-center">
                        <div>
                            <h3 className="font-semibold">{exam.exam_name}</h3>
                            <span className="text-muted text-sm">{exam.exam_type}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold">{exam.percentage}%</div>
                                <div className="text-sm text-muted">Grade: {exam.grade}</div>
                            </div>
                            {exam.report_card_id && (
                                <button onClick={() => handleDownload(exam.report_card_id)} className="btn btn-primary">
                                    <Download size={20} /> Download PDF
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        <table className="table">
                            <thead><tr><th>Subject</th><th>Max Marks</th><th>Obtained</th><th>Grade</th></tr></thead>
                            <tbody>
                                {exam.results?.map((result) => (
                                    <tr key={result.id}>
                                        <td>{result.subject_name}</td>
                                        <td>{result.max_marks}</td>
                                        <td className={result.is_passed ? 'text-success' : 'text-danger'}>{result.is_absent ? 'Absent' : result.marks_obtained}</td>
                                        <td>{result.grade}</td>
                                    </tr>
                                ))}
                                <tr className="font-semibold" style={{ background: 'var(--bg-secondary)' }}>
                                    <td>Total</td>
                                    <td>{exam.total_marks}</td>
                                    <td>{exam.obtained_marks}</td>
                                    <td>{exam.grade}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}

            {!data?.length && <div className="empty-state"><p>No exam results available yet.</p></div>}
        </div>
    )
}
