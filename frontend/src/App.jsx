import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'

// Layouts
import AuthLayout from './layouts/AuthLayout'

import { AppShell } from './components/layout'

// Auth Pages
import Login from './pages/auth/Login'

// Platform Admin Pages
import PlatformDashboard from './pages/platform-admin/Dashboard'
import SchoolsList from './pages/platform-admin/SchoolsList'
import SchoolForm from './pages/platform-admin/SchoolForm'
import ActivityLogs from './pages/platform-admin/ActivityLogs'
import SupportRequests from './pages/platform-admin/SupportRequests'

// School Admin Pages
import SchoolDashboard from './pages/school-admin/Dashboard'
import StudentsList from './pages/school-admin/StudentsList'
import StudentForm from './pages/school-admin/StudentForm'
import StudentImport from './pages/school-admin/StudentImport'
import TeachersList from './pages/school-admin/TeachersList'
import TeacherForm from './pages/school-admin/TeacherForm'
import TeacherImport from './pages/school-admin/TeacherImport'
import ClassesList from './pages/school-admin/ClassesList'
import ClassSectionDetails from './pages/school-admin/ClassSectionDetails'
import StudentAttendance from './pages/school-admin/StudentAttendance'
import TeacherAttendance from './pages/school-admin/TeacherAttendance'
import FeeStructures from './pages/school-admin/FeeStructures'
import FeeRecords from './pages/school-admin/FeeRecords'
import ExamsList from './pages/school-admin/ExamsList'
import NoticesList from './pages/school-admin/NoticesList'
import AcademicYears from './pages/school-admin/AcademicYears'
import Subjects from './pages/school-admin/Subjects'
import TeacherAssignments from './pages/school-admin/TeacherAssignments'

// Teacher Pages
import TeacherDashboard from './pages/teacher/Dashboard'
import MarkAttendance from './pages/teacher/MarkAttendance'
import EnterMarks from './pages/teacher/EnterMarks'
import CreateNotice from './pages/teacher/CreateNotice'
import TeacherNoticesList from './pages/teacher/NoticesList'
import StudyMaterials from './pages/teacher/StudyMaterials'

// Student Pages
import StudentDashboard from './pages/student/Dashboard'
import StudentProfile from './pages/student/Profile'
import StudentAttendanceView from './pages/student/Attendance'
import StudentFees from './pages/student/Fees'
import StudentResults from './pages/student/Results'
import StudentNotices from './pages/student/Notices'

// Loaders
function ProtectedRoute({ children, allowedRoles }) {
    const { user, isLoading } = useAuth()

    if (isLoading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/login" replace />
    }

    // Special logic: If allowedRoles includes 'tuition_owner'
    // This allows teachers who are owners to access the route
    const hasPermission = allowedRoles?.some(role => {
        if (role === 'tuition_owner') {
            return user.role === 'teacher' && user.is_owner
        }
        return user.role === role
    })

    if (allowedRoles && !hasPermission) {
        return <Navigate to="/" replace />
    }

    return children
}

function RoleBasedRedirect() {
    const { user, isLoading } = useAuth()

    if (isLoading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/login" replace />
    }

    switch (user.role) {
        case 'platform_admin':
            return <Navigate to="/platform/dashboard" replace />
        case 'school_admin':
            return <Navigate to="/school/dashboard" replace />
        case 'account_admin':
            return <Navigate to="/school/fees" replace />
        case 'teacher':
            return <Navigate to="/teacher/dashboard" replace />
        case 'student':
            return <Navigate to="/student/dashboard" replace />
        default:
            return <Navigate to="/login" replace />
    }
}

function App() {
    return (
        <Routes>
            {/* Public Routes */}
            <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
            </Route>

            {/* Home - Redirect based on role */}
            <Route path="/" element={<RoleBasedRedirect />} />

            {/* Platform Admin Routes */}
            <Route
                path="/platform/*"
                element={
                    <ProtectedRoute allowedRoles={['platform_admin']}>
                        <AppShell />
                    </ProtectedRoute>
                }
            >
                <Route path="dashboard" element={<PlatformDashboard />} />
                <Route path="schools" element={<SchoolsList />} />
                <Route path="schools/new" element={<SchoolForm />} />
                <Route path="schools/:id" element={<SchoolForm />} />
                <Route path="activity-logs" element={<ActivityLogs />} />
                <Route path="support" element={<SupportRequests />} />
            </Route>

            {/* School Admin Routes & Tuition Owner Access */}
            <Route
                path="/school/*"
                element={
                    <ProtectedRoute allowedRoles={['school_admin', 'account_admin', 'tuition_owner']}>
                        <AppShell />
                    </ProtectedRoute>
                }
            >
                <Route path="dashboard" element={<SchoolDashboard />} />
                <Route path="academic-years" element={<AcademicYears />} />
                <Route path="classes" element={<ClassesList />} />
                <Route path="classes/:classId/sections/:sectionId" element={<ClassSectionDetails />} />
                <Route path="subjects" element={<Subjects />} />
                <Route path="teacher-assignments" element={<TeacherAssignments />} />
                <Route path="students" element={<StudentsList />} />
                <Route path="students/new" element={<StudentForm />} />
                <Route path="students/import" element={<StudentImport />} />
                <Route path="students/:id" element={<StudentForm />} />
                <Route path="teachers" element={<TeachersList />} />
                <Route path="teachers/new" element={<TeacherForm />} />
                <Route path="teachers/import" element={<TeacherImport />} />
                <Route path="teachers/:id" element={<TeacherForm />} />
                <Route path="attendance/students" element={<StudentAttendance />} />
                <Route path="attendance/teachers" element={<TeacherAttendance />} />
                <Route path="fees/structures" element={<FeeStructures />} />
                <Route path="fees/records" element={<FeeRecords />} />
                <Route path="exams" element={<ExamsList />} />
                <Route path="notices" element={<NoticesList />} />
            </Route>

            {/* Teacher Routes */}
            <Route
                path="/teacher/*"
                element={
                    <ProtectedRoute allowedRoles={['teacher']}>
                        <AppShell />
                    </ProtectedRoute>
                }
            >
                <Route path="dashboard" element={<TeacherDashboard />} />
                <Route path="attendance" element={<MarkAttendance />} />
                <Route path="marks" element={<EnterMarks />} />
                <Route path="notices/create" element={<CreateNotice />} />
                <Route path="notices" element={<TeacherNoticesList />} />
                <Route path="materials" element={<StudyMaterials />} />
            </Route>

            {/* Student Routes */}
            <Route
                path="/student/*"
                element={
                    <ProtectedRoute allowedRoles={['student']}>
                        <AppShell />
                    </ProtectedRoute>
                }
            >
                <Route path="dashboard" element={<StudentDashboard />} />
                <Route path="profile" element={<StudentProfile />} />
                <Route path="attendance" element={<StudentAttendanceView />} />
                <Route path="fees" element={<StudentFees />} />
                <Route path="results" element={<StudentResults />} />
                <Route path="notices" element={<StudentNotices />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}

export default App
