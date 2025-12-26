import { Inbox, Plus } from 'lucide-react'

// Context-specific empty state configurations
const emptyStateConfigs = {
    students: {
        title: 'No students yet',
        description: 'Start by adding your first student or import students from a spreadsheet.',
        icon: 'graduation',
        actionLabel: 'Add Student',
        actionHref: '/school/students/add'
    },
    teachers: {
        title: 'No teachers yet',
        description: 'Add teachers to manage your school staff and assign them to classes.',
        icon: 'users',
        actionLabel: 'Add Teacher',
        actionHref: '/school/teachers/add'
    },
    classes: {
        title: 'No classes yet',
        description: 'Create classes and sections to organize your students.',
        icon: 'layout',
        actionLabel: 'Add Class',
        actionHref: '/school/classes/add'
    },
    notices: {
        title: 'No notices yet',
        description: 'Create announcements to keep students, parents, and staff informed.',
        icon: 'megaphone',
        actionLabel: 'Create Notice',
        actionHref: '/school/notices/add'
    },
    fees: {
        title: 'No fee structures yet',
        description: 'Set up fee structures to manage tuition and other school fees.',
        icon: 'wallet',
        actionLabel: 'Add Fee Structure',
        actionHref: '/school/fees/structures/add'
    },
    exams: {
        title: 'No exams scheduled',
        description: 'Create exams and assign subjects to track student performance.',
        icon: 'clipboard',
        actionLabel: 'Create Exam',
        actionHref: '/school/exams/add'
    },
    default: {
        title: 'No items found',
        description: 'There are no items to display at the moment.',
        icon: 'inbox',
        actionLabel: null,
        actionHref: null
    }
}

const EmptyStateIllustration = ({ type }) => {
    const baseClasses = "empty-state-icon"

    // Simple, elegant icon-based illustrations
    switch (type) {
        case 'graduation':
            return (
                <div className={baseClasses}>
                    <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
                        <circle cx="50" cy="50" r="45" className="fill-primary-50 dark:fill-primary-900/20" />
                        <path
                            d="M50 20L20 35L50 50L80 35L50 20Z"
                            className="fill-primary-500"
                        />
                        <path
                            d="M30 42V60C30 60 40 70 50 70C60 70 70 60 70 60V42"
                            className="stroke-primary-500 fill-none"
                            strokeWidth="3"
                            strokeLinecap="round"
                        />
                        <circle cx="80" cy="35" r="4" className="fill-primary-400" />
                        <path d="M80 35V65" className="stroke-primary-400" strokeWidth="2" />
                    </svg>
                </div>
            )
        case 'users':
            return (
                <div className={baseClasses}>
                    <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
                        <circle cx="50" cy="50" r="45" className="fill-emerald-50 dark:fill-emerald-900/20" />
                        <circle cx="50" cy="35" r="12" className="fill-emerald-500" />
                        <path
                            d="M30 70C30 55 40 48 50 48C60 48 70 55 70 70"
                            className="fill-emerald-500"
                        />
                        <circle cx="25" cy="40" r="8" className="fill-emerald-300" />
                        <path d="M12 62C12 52 18 48 25 48" className="fill-emerald-300" />
                        <circle cx="75" cy="40" r="8" className="fill-emerald-300" />
                        <path d="M88 62C88 52 82 48 75 48" className="fill-emerald-300" />
                    </svg>
                </div>
            )
        case 'megaphone':
            return (
                <div className={baseClasses}>
                    <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
                        <circle cx="50" cy="50" r="45" className="fill-amber-50 dark:fill-amber-900/20" />
                        <path
                            d="M25 42C25 38 28 35 32 35H40L65 22V78L40 65H32C28 65 25 62 25 58V42Z"
                            className="fill-amber-500"
                        />
                        <rect x="70" y="44" width="12" height="4" rx="2" className="fill-amber-400" />
                        <rect x="70" y="52" width="12" height="4" rx="2" className="fill-amber-400" />
                        <path d="M32 65V80C32 82 34 84 36 84H42C44 84 46 82 46 80V65" className="fill-amber-600" />
                    </svg>
                </div>
            )
        case 'wallet':
            return (
                <div className={baseClasses}>
                    <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
                        <circle cx="50" cy="50" r="45" className="fill-blue-50 dark:fill-blue-900/20" />
                        <rect x="20" y="30" width="60" height="45" rx="6" className="fill-blue-500" />
                        <rect x="20" y="30" width="60" height="12" rx="6" className="fill-blue-600" />
                        <circle cx="65" cy="55" r="8" className="fill-white" />
                        <circle cx="65" cy="55" r="4" className="fill-blue-500" />
                    </svg>
                </div>
            )
        default:
            return (
                <div className={baseClasses}>
                    <Inbox className="w-full h-full text-gray-300 dark:text-gray-600" strokeWidth={1} />
                </div>
            )
    }
}

export default function EmptyState({
    context = 'default',
    title,
    description,
    actionLabel,
    onAction,
    showAction = true
}) {
    const config = emptyStateConfigs[context] || emptyStateConfigs.default

    const displayTitle = title || config.title
    const displayDescription = description || config.description
    const displayActionLabel = actionLabel || config.actionLabel

    return (
        <div className="empty-state">
            <EmptyStateIllustration type={config.icon} />

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {displayTitle}
            </h3>

            <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-6">
                {displayDescription}
            </p>

            {showAction && displayActionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="btn btn-primary"
                >
                    <Plus size={18} />
                    {displayActionLabel}
                </button>
            )}
        </div>
    )
}
