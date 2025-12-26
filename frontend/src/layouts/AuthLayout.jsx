import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%)',
            padding: 'var(--space-4)'
        }}>
            <Outlet />
        </div>
    )
}
