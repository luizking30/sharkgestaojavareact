import React from 'react';

/**
 * Controles de página para respostas Spring Page (page 0-based).
 */
export default function SharkPagination({
    page,
    totalPages,
    totalElements,
    pageSize,
    onPageChange,
    disabled = false,
    className = '',
}) {
    const tp = Math.max(1, totalPages || 1);
    const te = totalElements ?? 0;
    const canPrev = page > 0;
    const canNext = page < tp - 1;
    const from = te === 0 ? 0 : page * pageSize + 1;
    const to = Math.min((page + 1) * pageSize, te);

    return (
        <div className={`d-flex flex-wrap align-items-center justify-content-between gap-2 py-3 ${className}`}>
            <span className="text-white-50 small">
                {te === 0 ? 'Nenhum registro' : `Mostrando ${from}–${to} de ${te}`}
            </span>
            <div className="btn-group" role="group" aria-label="Paginação">
                <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    disabled={disabled || !canPrev}
                    onClick={() => onPageChange(page - 1)}
                >
                    Anterior
                </button>
                <span className="btn btn-sm btn-outline-secondary disabled">
                    {page + 1} / {tp}
                </span>
                <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    disabled={disabled || !canNext}
                    onClick={() => onPageChange(page + 1)}
                >
                    Próxima
                </button>
            </div>
        </div>
    );
}
