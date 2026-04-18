import React, { useSyncExternalStore } from 'react';
import {
    subscribeToFeedback,
    getFeedbackVersion,
    getFeedbackState,
    removeToast,
    notify,
    confirmDialog,
    promptDialog,
    resolveConfirm,
    resolvePrompt,
    setPromptValue,
} from './feedbackStore';

function FeedbackLayers() {
    useSyncExternalStore(subscribeToFeedback, getFeedbackVersion, getFeedbackVersion);
    const { toasts, confirmCfg, promptCfg, promptValue } = getFeedbackState();

    return (
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
    );
}

/**
 * Só monta a camada visual; estado em feedbackStore não re-renderiza {children}.
 */
export function FeedbackProvider({ children }) {
    return (
        <>
            {children}
            <FeedbackLayers />
        </>
    );
}

export function useFeedback() {
    return {
        notify,
        confirmDialog,
        promptDialog,
    };
}
