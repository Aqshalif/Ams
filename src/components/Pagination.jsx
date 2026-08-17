import React from 'react';

export const Pagination = ({
    currentPage,
    totalPages,
    onPageChange,
    itemsPerPage,
    onItemsPerPageChange,
    totalItems,
    startIndex,
    endIndex
}) => {
    if (totalItems === 0) return null;

    return (
        <div style={{
            background: '#fff',
            borderTop: '1px solid #e2e8f0',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            borderRadius: '0 0 10px 10px'
        }}>
            {/* Left: Info Text & Page Size Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '13px', color: '#64748b' }}>
                <div>
                    Menampilkan <strong>{Math.min(startIndex + 1, totalItems)}</strong> - <strong>{Math.min(endIndex, totalItems)}</strong> dari <strong>{totalItems}</strong> data
                </div>
                {onItemsPerPageChange && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>Tampilkan:</span>
                        <select
                            value={itemsPerPage}
                            onChange={e => onItemsPerPageChange(Number(e.target.value))}
                            style={{
                                padding: '4px 8px',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                fontSize: '12px',
                                background: '#fff',
                                fontWeight: 700,
                                color: '#334155',
                                cursor: 'pointer'
                            }}
                        >
                            <option value={5}>5 per hal</option>
                            <option value={10}>10 per hal</option>
                            <option value={20}>20 per hal</option>
                            <option value={50}>50 per hal</option>
                        </select>
                    </div>
                )}
            </div>

            {/* Right: Page Navigation Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {/* First Page */}
                <button
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    title="Halaman Pertama"
                    style={{
                        padding: '6px 10px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        background: currentPage === 1 ? '#f1f5f9' : '#fff',
                        color: currentPage === 1 ? '#94a3b8' : '#334155',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                    }}
                >
                    <i className="fa-solid fa-angles-left"></i>
                </button>

                {/* Prev Page */}
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    title="Halaman Sebelumnya"
                    style={{
                        padding: '6px 12px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        background: currentPage === 1 ? '#f1f5f9' : '#fff',
                        color: currentPage === 1 ? '#94a3b8' : '#334155',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                >
                    <i className="fa-solid fa-angle-left"></i> Prev
                </button>

                {/* Page Indicator */}
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#00624F', padding: '0 8px' }}>
                    Halaman {currentPage} / {Math.max(1, totalPages)}
                </span>

                {/* Next Page */}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    title="Halaman Selanjutnya"
                    style={{
                        padding: '6px 12px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        background: currentPage >= totalPages ? '#f1f5f9' : '#fff',
                        color: currentPage >= totalPages ? '#94a3b8' : '#334155',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                >
                    Next <i className="fa-solid fa-angle-right"></i>
                </button>

                {/* Last Page */}
                <button
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage >= totalPages}
                    title="Halaman Terakhir"
                    style={{
                        padding: '6px 10px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        background: currentPage >= totalPages ? '#f1f5f9' : '#fff',
                        color: currentPage >= totalPages ? '#94a3b8' : '#334155',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer'
                    }}
                >
                    <i className="fa-solid fa-angles-right"></i>
                </button>
            </div>
        </div>
    );
};
