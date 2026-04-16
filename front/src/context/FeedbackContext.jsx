import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const FeedbackContext = createContext(null);

let toastSeq = 0;

export function FeedbackProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const [confirmCfg, setConfirmCfg] = useState(null);
    const [promptCfg, setPromptCfg] = useState(null);
    const [promptValue, setPromptValue] = useState('');

    useEffect(() => {
        if (promptCfg) {
            setPromptValue(promptCfg.defaultValue ?? '');
        }
    }, [promptCfg]);

    const removeToast = useCallback((id) => {
        setToasts((t) => t.filter((x) => x.id !== id));
    }, []);

    const toast = useCallback((type, message, title) => {
        const id = ++toastSeq;
        setToasts((t) => [...t, { id, type, message, title: title || '' }]);
        window.setTimeout(() => removeToast(id), 6500);
    }, [removeToast]);

    const notify = useMemo(
        () => ({
            success: (message, title) => toast('success', message, title),
            error: (message, title) => toast('error', message, title),
            warning: (message, title) => toast('warning', message, title),
            info: (message, title) => toast('info', message, title),
        }),
        [toast]
    );

    const confirmDialog = useCallback((message, title = 'Confirmar') => {
        return new Promise((resolve) => {
            setConfirmCfg({ title, message, resolve });
        });
    }, []);

    const promptDialog = useCallback((message, title = 'Informar valor', defaultValue = '') => {
        return new Promise((resolve) => {
            setPromptValue(defaultValue);
            setPromptCfg({ title, message, defaultValue, resolve });
        });
    }, []);

    const resolveConfirm = useCallback(
        (v) => {
            confirmCfg?.resolve(v);
            setConfirmCfg(null);
        },
        [confirmCfg]
    );

    const resolvePrompt = useCallback(
        (v) => {
            promptCfg?.resolve(v);
            setPromptCfg(null);
        },
        [promptCfg]
    );

    const value = useMemo(
        () => ({
            toast,
            notify,
            confirmDialog,
            promptDialog,
        }),
        [toast, notify, confirmDialog, promptDialog]
    );

    return (
        <FeedbackContext.Provider value={value}>
            {children}

            <div className="shark-feedback-layer" aria-live="polite">
                <div className="shark-toast-stack">
                    {toasts.map((t) => (
                        <div key={t.id} className={`card shark-feedback-card shark-feedback-card--${t.type} shadow-lg border-0`}>
                            <div className="card-body py-3 px-3">
                                {t.title ? <h6 className="shark-feedback-card__title mb-1">{t.title}</h6> : null}
                                <p className="shark-feedback-card__msg mb-0 small">{t.message}</p>
                            </div>
                            <button
                                type="button"
                                className="btn btn-sm btn-link shark-feedback-card__close"
                                onClick={() => removeToast(t.id)}
                                aria-label="Fechar"
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>
                    ))}
                </div>

                {confirmCfg ? (
                    <div className="shark-modal-overlay" role="presentation" onClick={() => resolveConfirm(false)}>
                        <div
                            className="card shark-feedback-modal border-0 shadow-lg"
                            role="dialog"
                            aria-modal="true"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="card-body p-4">
                                <h5 className="text-white fw-bold mb-3">{confirmCfg.title}</h5>
                                <p className="text-white-50 mb-4">{confirmCfg.message}</p>
                                <div className="d-flex gap-2 justify-content-end">
                                    <button type="button" className="btn btn-outline-secondary" onClick={() => resolveConfirm(false)}>
                                        Cancelar
                                    </button>
                                    <button type="button" className="btn btn-info fw-bold text-dark" onClick={() => resolveConfirm(true)}>
                                        OK
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}

                {promptCfg ? (
                    <div className="shark-modal-overlay" role="presentation" onClick={() => resolvePrompt(null)}>
                        <div
                            className="card shark-feedback-modal border-0 shadow-lg"
                            role="dialog"
                            aria-modal="true"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="card-body p-4">
                                <h5 className="text-white fw-bold mb-2">{promptCfg.title}</h5>
                                <p className="text-white-50 small mb-3">{promptCfg.message}</p>
                                <input
                                    type="text"
                                    className="form-control bg-black text-white border-secondary mb-3"
                                    value={promptValue}
                                    onChange={(e) => setPromptValue(e.target.value)}
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            resolvePrompt(promptValue);
                                        }
                                    }}
                                />
                                <div className="d-flex gap-2 justify-content-end">
                                    <button type="button" className="btn btn-outline-secondary" onClick={() => resolvePrompt(null)}>
                                        Cancelar
                                    </button>
                                    <button type="button" className="btn btn-info fw-bold text-dark" onClick={() => resolvePrompt(promptValue)}>
                                        Confirmar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </FeedbackContext.Provider>
    );
}

export function useFeedback() {
    const ctx = useContext(FeedbackContext);
    if (!ctx) {
        throw new Error('useFeedback deve ser usado dentro de FeedbackProvider');
    }
    return ctx;
}
