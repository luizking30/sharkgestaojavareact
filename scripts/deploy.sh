#!/usr/bin/env bash
# Deploy Shark Gestão: API na VPS (Docker). Front na Vercel — sem arquivos estáticos locais.
set -euo pipefail

# Definição de caminhos
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${PROJECT_ROOT}"

echo "==> 🦈 Shark Deploy | Iniciando atualização da API..."

# 1. GIT
echo "==> Buscando atualizações no GitHub..."
git pull origin master

# 2. LIMPEZA DE RAM (ESSENCIAL PARA 1GB)
echo "==> Liberando memória para o novo build..."
# O builder prune limpa restos de builds antigos que entulham o disco
docker builder prune -f || true

# 3. BUILD E RESTART DA API (DOCKER)
if [[ "${SKIP_DOCKER:-0}" != "1" ]]; then
    echo "==> API: Reconstruindo imagem e reiniciando container..."

    if ! command -v docker >/dev/null 2>&1; then
        echo "Erro: docker não encontrado." >&2
        exit 1
    fi

    # Build focado apenas no serviço da API para ser mais rápido
    # Removido o --no-cache para ganhar velocidade, use apenas se der erro
    docker compose up -d --build api

    echo "    ✅ API Shark atualizada e rodando!"
else
    echo "==> Docker: Ignorado (SKIP_DOCKER=1)"
fi

# 4. NOTA SOBRE O FRONT
echo "--------------------------------------------------------"
echo "💡 NOTA: O Front-end agora é gerenciado pela Vercel."
echo "   Verifique o status em: sharkgestaojavareact.vercel.app"
echo "--------------------------------------------------------"

echo "==> 🌊 Deploy concluído. O Shark está online!"
