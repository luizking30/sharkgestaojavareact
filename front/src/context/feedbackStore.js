/**
 * Estado de toasts/modais fora do React tree principal.
 * Atualizações aqui só re-renderizam FeedbackLayers (useSyncExternalStore),
 * não o Router nem as páginas — evita travamentos ao exibir notificações.
 */
let toastSeq = 0;
let version = 0;
const listeners = new Set();

let state = {
    toasts: [],
    confirmCfg: null,
    promptCfg: null,
    promptValue: '',
};

function emit() {
    version += 1;
    listeners.forEach((l) => l());
}

export function subscribeToFeedback(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
}

/** Retorno numérico para useSyncExternalStore (comparação por Object.is). */
export function getFeedbackVersion() {
    return version;
}

export function getFeedbackState() {
    return state;
}

export function removeToast(id) {
    if (!state.toasts.some((t) => t.id === id)) return;
    state = { ...state, toasts: state.toasts.filter((t) => t.id !== id) };
    emit();
}

function pushToast(type, message, title) {
    const id = ++toastSeq;
    state = {
        ...state,
        toasts: [...state.toasts, { id, type, message, title: title || '' }],
    };
    emit();
    window.setTimeout(() => removeToast(id), 6500);
}

export const notify = {
    success: (message, title) => pushToast('success', message, title),
    error: (message, title) => pushToast('error', message, title),
    warning: (message, title) => pushToast('warning', message, title),
    info: (message, title) => pushToast('info', message, title),
};

export function confirmDialog(message, title = 'Confirmar') {
    return new Promise((resolve) => {
        state = { ...state, confirmCfg: { title, message, resolve } };
        emit();
    });
}

export function resolveConfirm(value) {
    const cfg = state.confirmCfg;
    if (!cfg) return;
    cfg.resolve(value);
    state = { ...state, confirmCfg: null };
    emit();
}

export function promptDialog(message, title = 'Informar valor', defaultValue = '') {
    return new Promise((resolve) => {
        const dv = defaultValue ?? '';
        state = {
            ...state,
            promptCfg: { title, message, defaultValue: dv, resolve },
            promptValue: dv,
        };
        emit();
    });
}

export function setPromptValue(v) {
    state = { ...state, promptValue: v };
    emit();
}

export function resolvePrompt(value) {
    const cfg = state.promptCfg;
    if (!cfg) return;
    cfg.resolve(value);
    state = { ...state, promptCfg: null, promptValue: '' };
    emit();
}
