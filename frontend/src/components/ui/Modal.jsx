import { Fragment } from 'react'
import { X } from 'lucide-react'
import clsx from 'clsx'

export default function Modal({
    isOpen,
    onClose,
    title,
    description,
    children,
    size = 'md',
    className
}) {
    if (!isOpen) return null

    const sizes = {
        sm: 'max-w-sm',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
    }

    return (
        <Fragment>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fadeIn"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                    className={clsx(
                        'bg-white rounded-2xl shadow-2xl w-full',
                        'animate-slideUp',
                        sizes[size],
                        className
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    {(title || onClose) && (
                        <div className="flex items-start justify-between p-6 border-b border-gray-100">
                            <div>
                                {title && (
                                    <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
                                )}
                                {description && (
                                    <p className="text-sm text-gray-500 mt-1">{description}</p>
                                )}
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 -m-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {/* Body */}
                    <div className="p-6">
                        {children}
                    </div>
                </div>
            </div>
        </Fragment>
    )
}
