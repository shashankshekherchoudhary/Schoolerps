import clsx from 'clsx'

export default function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    className
}) {
    return (
        <div className={clsx('text-center py-12 px-4', className)}>
            {Icon && (
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <Icon className="w-8 h-8 text-gray-400" />
                </div>
            )}
            {title && (
                <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
            )}
            {description && (
                <p className="text-gray-500 max-w-sm mx-auto mb-6">{description}</p>
            )}
            {action}
        </div>
    )
}
