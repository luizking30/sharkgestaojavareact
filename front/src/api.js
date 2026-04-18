import axios from 'axios';

const runtimeHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
const devDefaultBase = `http://${runtimeHost}:8080`;
/**
 * Só o host da API (sem /api). Os paths do Axios já começam com /api/...
 * Se colocar /api aqui, vira /api/api/... e o Spring responde 404.
 */
const PRODUCTION_API_ORIGIN = 'https://api.sharkgestao.com';

const raw = import.meta.env.VITE_API_URL;
const trimmed = typeof raw === 'string' ? raw.trim() : raw;

function normalizeApiOrigin(url) {
    let u = url.replace(/\/$/, '');
    if (u.endsWith('/api')) {
        u = u.slice(0, -4);
    }
    return u;
}

function resolveBaseURL() {
    if (trimmed && trimmed !== '/') {
        return normalizeApiOrigin(trimmed);
    }
    const onVercelOrProdSite =
        typeof window !== 'undefined' &&
        (window.location.hostname.endsWith('.vercel.app') ||
            window.location.hostname === 'sharkgestao.com' ||
            window.location.hostname === 'www.sharkgestao.com');
    if (import.meta.env.PROD || onVercelOrProdSite) {
        return PRODUCTION_API_ORIGIN;
    }
    return devDefaultBase;
}

const baseURL = resolveBaseURL();

const api = axios.create({
    baseURL,
    withCredentials: true,
    timeout: 45_000,
});

// INTERCEPTOR DE REQUISIÇÃO: Envia o token automaticamente.
api.interceptors.request.use(
    (config) => {
        const dados = localStorage.getItem('usuarioShark');
        if (dados) {
            try {
                const usuario = JSON.parse(dados);
                if (usuario?.token) {
                    config.headers.Authorization = `Bearer ${usuario.token}`;
                }
            } catch (e) {
                console.error('Erro ao ler token do localStorage', e);
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// INTERCEPTOR DE RESPOSTA: trata expiração de sessão sem quebrar o fluxo de login.
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;
        const requestUrl = String(error?.config?.url || '');
        const isAuthFlow =
            requestUrl.includes('/api/auth/login') ||
            requestUrl.includes('/api/auth/esqueci-senha') ||
            requestUrl.includes('/api/auth/atualizar-senha') ||
            requestUrl.includes('/api/auth/empresas');

        if (isAuthFlow) {
            return Promise.reject(error);
        }

        if (status === 401 || status === 403) {
            localStorage.removeItem('usuarioShark');
            window.dispatchEvent(new Event('auth:logout'));
        }

        return Promise.reject(error);
    }
);

export default api;
