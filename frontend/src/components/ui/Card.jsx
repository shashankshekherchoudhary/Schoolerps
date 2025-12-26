import clsx from 'clsx'

export default function Card({
    children,
    className,
    hover = true,
    padding = true,
    ...props
}) {
    return (
        <div
            className={clsx(
                'bg-white rounded-2xl border border-gray-100',
                'shadow-sm',
                hover && 'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5',
                padding && 'p-6',
                className
            )}
            {...props}
        >
            {children}
        </div>
    )
}

export function CardHeader({ children, className }) {
    return (
        <div className={clsx('pb-4 border-b border-gray-100 mb-4', className)}>
            {children}
        </div>
    )
}

export function CardTitle({ children, className }) {
    return (
        <h3 className={clsx('text-lg font-semibold text-gray-900', className)}>
            {children}
        </h3>
    )
}

export function CardDescription({ children, className }) {
    return (
        <p className={clsx('text-sm text-gray-500 mt-1', className)}>
            {children}
        </p>
    )
}
