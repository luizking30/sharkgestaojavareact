import axios from 'axios';

const runtimeHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
const defaultBaseURL = `http://${runtimeHost}:4444`;
const envApi = import.meta.env.VITE_API_URL;
// "/" ou "" (build) = mesma origem — use com Nginx na porta 80 repassando /api para o backend.
const baseURLRaw =
  envApi === '/' || envApi === ''
    ? ''
    : envApi != null && envApi !== ''
      ? envApi
      : defaultBaseURL;
const baseURL = baseURLRaw.replace(/\/$/, '');

const api = axios.create({
    baseURL,
    withCredentials: true,
    // Evita requisições “pendentes” indefinidamente se a API estiver inacessível.
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

        // Login/recuperação exibem erro no próprio formulário.
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
