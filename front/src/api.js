import axios from 'axios';

const baseURL = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '');

const api = axios.create({
    baseURL,
    // Mantemos true se o seu Backend exigir para CORS,
    // mas o foco agora é o Header Authorization abaixo.
    withCredentials: true
});

// INTERCEPTOR DE REQUISIÇÃO: Envia o "crachá" (Token)
api.interceptors.request.use(
    (config) => {
        const dados = localStorage.getItem('usuarioShark');
        if (dados) {
            try {
                const usuario = JSON.parse(dados);
                if (usuario && usuario.token) {
                    config.headers.Authorization = `Bearer ${usuario.token}`;
                }
            } catch (e) {
                console.error("Erro ao ler token do localStorage", e);
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// INTERCEPTOR DE RESPOSTA: Monitora se o acesso foi negado (Token expirado)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Se o servidor retornar 401 (Não autorizado) ou 403 (Proibido)
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            console.warn("Sessão expirada ou acesso negado. Redirecionando...");

            // Limpa os dados para evitar loops de erro
            localStorage.removeItem('usuarioShark');

            // Redireciona para o login apenas se não estivermos na tela de login
            if (window.location.pathname !== '/') {
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

export default api;