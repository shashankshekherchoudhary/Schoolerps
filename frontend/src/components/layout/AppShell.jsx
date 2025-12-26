import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import MobileNav from './MobileNav'

export default function AppShell() {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {/* Sidebar - fixed on all screen sizes */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main content area - offset for fixed sidebar on desktop */}
            <div className="lg:ml-72 min-h-screen flex flex-col">
                {/* Header */}
                <Header onMenuClick={() => setSidebarOpen(true)} />

                {/* Page content */}
                <main className="flex-1 p-4 lg:p-6 pb-20 md:pb-6">
                    <Outlet />
                </main>
            </div>

            {/* Mobile bottom navigation */}
            <MobileNav />
        </div>
    )
}
