import { forwardRef } from 'react'
import clsx from 'clsx'

const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-sm',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-400',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-400',
}

const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
}

const Button = forwardRef(({
    children,
    variant = 'primary',
    size = 'md',
    className,
    disabled,
    loading,
    icon: Icon,
    ...props
}, ref) => {
    return (
        <button
            ref={ref}
            disabled={disabled || loading}
            className={clsx(
                'inline-flex items-center justify-center font-medium rounded-lg',
                'transition-all duration-200 ease-out',
                'focus:outline-none focus:ring-2 focus:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'active:scale-[0.98]',
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {loading ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            ) : Icon ? (
                <Icon className={clsx(size === 'sm' ? 'w-4 h-4' : 'w-5 h-5')} />
            ) : null}
            {children}
        </button>
    )
})

Button.displayName = 'Button'
export default Button
