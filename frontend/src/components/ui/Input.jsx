import { forwardRef } from 'react'
import clsx from 'clsx'

const Input = forwardRef(({
    label,
    error,
    icon: Icon,
    className,
    ...props
}, ref) => {
    return (
        <div className="space-y-1.5">
            {label && (
                <label className="block text-sm font-medium text-gray-700">
                    {label}
                    {props.required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                )}
                <input
                    ref={ref}
                    className={clsx(
                        'w-full px-4 py-3 text-sm border rounded-xl bg-white',
                        'placeholder-gray-400 text-gray-900',
                        'transition-all duration-200',
                        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                        'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
                        Icon && 'pl-11',
                        error
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-200 hover:border-gray-300',
                        className
                    )}
                    {...props}
                />
            </div>
            {error && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                </p>
            )}
        </div>
    )
})

Input.displayName = 'Input'
export default Input
