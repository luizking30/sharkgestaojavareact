import axios from 'axios';

const runtimeHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
const devDefaultBase = `http://${runtimeHost}:8080`;
/** Origem pública da API em produção (Nginx → 127.0.0.1:8080 na VPS). */
const PRODUCTION_API_ORIGIN = 'https://api.sharkgestao.com';

const raw = import.meta.env.VITE_API_URL;
const trimmed = typeof raw === 'string' ? raw.trim() : raw;

function resolveBaseURL() {
    // Valor explícito (Vercel Dashboard, .env.production, etc.)
    if (trimmed && trimmed !== '/') {
        return trimmed.replace(/\/$/, '');
    }
    // VITE_API_URL vazio ou "/" — em dev, backend local; em build de produção, nunca use
    // mesma origem da Vercel (as rotas /api/* não existem lá → 404).
    if (import.meta.env.PROD) {
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
