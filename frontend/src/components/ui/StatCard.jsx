import clsx from 'clsx'

const colorStyles = {
    blue: {
        bg: 'bg-blue-50',
        icon: 'bg-blue-100 text-blue-600',
        text: 'text-blue-600',
    },
    green: {
        bg: 'bg-emerald-50',
        icon: 'bg-emerald-100 text-emerald-600',
        text: 'text-emerald-600',
    },
    purple: {
        bg: 'bg-purple-50',
        icon: 'bg-purple-100 text-purple-600',
        text: 'text-purple-600',
    },
    orange: {
        bg: 'bg-orange-50',
        icon: 'bg-orange-100 text-orange-600',
        text: 'text-orange-600',
    },
    red: {
        bg: 'bg-red-50',
        icon: 'bg-red-100 text-red-600',
        text: 'text-red-600',
    },
}

export default function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    color = 'blue',
    trend,
    className
}) {
    const styles = colorStyles[color] || colorStyles.blue

    return (
        <div
            className={clsx(
                'bg-white rounded-2xl border border-gray-100 p-6',
                'shadow-sm transition-all duration-200',
                'hover:shadow-lg hover:-translate-y-1 hover:border-gray-200',
                className
            )}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                    <p className="text-3xl font-bold text-gray-900">{value}</p>
                    {subtitle && (
                        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
                    )}
                    {trend && (
                        <div className={clsx('flex items-center gap-1 mt-2 text-sm font-medium', styles.text)}>
                            {trend.direction === 'up' ? (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            )}
                            {trend.value}
                        </div>
                    )}
                </div>
                {Icon && (
                    <div className={clsx('p-3 rounded-xl', styles.icon)}>
                        <Icon className="w-6 h-6" />
                    </div>
                )}
            </div>
        </div>
    )
}
