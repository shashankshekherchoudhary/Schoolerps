import clsx from 'clsx'

export default function Table({
    columns,
    data,
    onRowClick,
    emptyMessage = 'No data available',
    className
}) {
    if (!data?.length) {
        return (
            <div className="text-center py-12 text-gray-500">
                {emptyMessage}
            </div>
        )
    }

    return (
        <div className={clsx('overflow-x-auto', className)}>
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-gray-200">
                        {columns.map((col, i) => (
                            <th
                                key={i}
                                className={clsx(
                                    'px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider',
                                    col.className
                                )}
                            >
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {data.map((row, rowIndex) => (
                        <tr
                            key={row.id || rowIndex}
                            onClick={() => onRowClick?.(row)}
                            className={clsx(
                                'transition-colors',
                                onRowClick && 'cursor-pointer hover:bg-gray-50'
                            )}
                        >
                            {columns.map((col, colIndex) => (
                                <td
                                    key={colIndex}
                                    className={clsx(
                                        'px-4 py-4 text-gray-700',
                                        col.cellClassName
                                    )}
                                >
                                    {col.render ? col.render(row) : row[col.accessor]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

// Mobile-friendly card list alternative
export function TableCards({ data, renderCard, emptyMessage = 'No data available' }) {
    if (!data?.length) {
        return (
            <div className="text-center py-12 text-gray-500">
                {emptyMessage}
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {data.map((item, index) => (
                <div key={item.id || index}>
                    {renderCard(item)}
                </div>
            ))}
        </div>
    )
}
