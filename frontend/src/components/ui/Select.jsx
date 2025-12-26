import { forwardRef } from 'react'
import clsx from 'clsx'

const Select = forwardRef(({
    label,
    error,
    options = [],
    placeholder = 'Select...',
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
            <select
                ref={ref}
                className={clsx(
                    'w-full px-4 py-3 text-sm border rounded-xl bg-white',
                    'text-gray-900 cursor-pointer',
                    'transition-all duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                    'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
                    error
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-200 hover:border-gray-300',
                    className
                )}
                {...props}
            >
                <option value="">{placeholder}</option>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            {error && (
                <p className="text-sm text-red-600">{error}</p>
            )}
        </div>
    )
})

Select.displayName = 'Select'
export default Select
