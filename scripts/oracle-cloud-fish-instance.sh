#!/usr/bin/env bash
#
# "Pesca" de capacidade na Oracle Cloud Infrastructure (OCI):
# tenta criar uma VM Flex com 4 OCPU e 24 GiB RAM até conseguir ou esgotar tentativas.
#
# --- Availability Domain (segredo: um AD pode estar lotado e outro não) ---
# Cada subnet fica em UM AD. Para pescar em vários ADs, você precisa de uma subnet por AD
# (ex.: subnet em AD-1 e outra em AD-2 na mesma VCN).
#
# Modos:
#   A) Arquivo OCI_FISH_TARGETS_FILE: uma linha por alvo, formato:
#        <availability-domain>|<subnet_ocid>
#      Linhas vazias ou começando com # são ignoradas.
#      Em falta de capacidade, o script ROTACIONA para o próximo alvo (próximo AD/subnet).
#
#   B) OCI_AVAILABILITY_DOMAIN + OCI_SUBNET_ID: força um AD específico (troque o AD manualmente
#      se ficar muito tempo sem vaga no AD atual).
#
#   C) Só OCI_SUBNET_ID: o AD é obtido automaticamente dessa subnet (um único AD).
#
# Pré-requisitos: OCI CLI + jq
#
# Imagem Ubuntu (Ampere): use scripts/oracle-cloud-print-ubuntu-image-id.sh
#
# Rodar em background (recomendado em VPS fraca ou SSH instável):
#   chmod +x scripts/oracle-cloud-fish-instance.sh
#   nohup ./scripts/oracle-cloud-fish-instance.sh > pesca_log.txt 2>&1 &
# Monitorar:
#   tail -f pesca_log.txt
#
# Variáveis principais:
#   OCI_COMPARTMENT_ID, OCI_IMAGE_ID, OCI_SUBNET_ID (ou arquivo de alvos)
#   OCI_SHAPE (default VM.Standard.A1.Flex), OCI_OCPUS (4), OCI_MEMORY_GB (24)
#   SLEEP_SECS (90), MAX_ATTEMPTS (0=infinito)
#

set -u

COMPARTMENT_ID="${OCI_COMPARTMENT_ID:-}"
SUBNET_ID="${OCI_SUBNET_ID:-}"
IMAGE_ID="${OCI_IMAGE_ID:-}"
SSH_KEY_FILE="${OCI_SSH_PUBLIC_KEY:-$HOME/.ssh/id_rsa.pub}"
SHAPE="${OCI_SHAPE:-VM.Standard.A1.Flex}"
OCPUS="${OCI_OCPUS:-4}"
MEMORY_GB="${OCI_MEMORY_GB:-24}"
DISPLAY_NAME="${OCI_DISPLAY_NAME:-shark-fished-$(date +%s)}"
ASSIGN_PUBLIC="${OCI_ASSIGN_PUBLIC_IP:-true}"
SLEEP_SECS="${SLEEP_SECS:-90}"
MAX_ATTEMPTS="${MAX_ATTEMPTS:-0}"
TARGETS_FILE="${OCI_FISH_TARGETS_FILE:-}"
AD_OVERRIDE="${OCI_AVAILABILITY_DOMAIN:-}"

die() {
  echo "Erro: $*" >&2
  exit 1
}

command -v oci >/dev/null 2>&1 || die "OCI CLI não encontrado."
command -v jq >/dev/null 2>&1 || die "jq não encontrado. Ex.: sudo apt install -y jq"

[[ -n "$COMPARTMENT_ID" ]] || die "Defina OCI_COMPARTMENT_ID"
[[ -n "$IMAGE_ID" ]] || die "Defina OCI_IMAGE_ID (rode scripts/oracle-cloud-print-ubuntu-image-id.sh)"
[[ -f "$SSH_KEY_FILE" ]] || die "Chave SSH não encontrada: $SSH_KEY_FILE"

declare -a TARGET_ADS=()
declare -a TARGET_SUBNETS=()

load_targets() {
  TARGET_ADS=()
  TARGET_SUBNETS=()

  if [[ -n "$TARGETS_FILE" ]]; then
    [[ -f "$TARGETS_FILE" ]] || die "OCI_FISH_TARGETS_FILE não encontrado: $TARGETS_FILE"
    while IFS= read -r line || [[ -n "$line" ]]; do
      line="${line#"${line%%[![:space:]]*}"}"
      line="${line%"${line##*[![:space:]]}"}"
      [[ -z "$line" || "$line" == \#* ]] && continue
      [[ "$line" == *"|"* ]] || die "Linha inválida em $TARGETS_FILE (use AD|subnet_ocid): $line"
      ad="${line%%|*}"
      sn="${line#*|}"
      ad="${ad#"${ad%%[![:space:]]*}"}"; ad="${ad%"${ad##*[![:space:]]}"}"
      sn="${sn#"${sn%%[![:space:]]*}"}"; sn="${sn%"${sn##*[![:space:]]}"}"
      [[ -n "$ad" && -n "$sn" ]] || die "Linha incompleta em $TARGETS_FILE: $line"
      TARGET_ADS+=("$ad")
      TARGET_SUBNETS+=("$sn")
    done < "$TARGETS_FILE"
    ((${#TARGET_ADS[@]})) || die "Nenhum alvo válido em $TARGETS_FILE"
    return 0
  fi

  if [[ -n "$AD_OVERRIDE" ]]; then
    [[ -n "$SUBNET_ID" ]] || die "Com OCI_AVAILABILITY_DOMAIN defina OCI_SUBNET_ID da subnet nesse AD"
    TARGET_ADS+=("$AD_OVERRIDE")
    TARGET_SUBNETS+=("$SUBNET_ID")
    return 0
  fi

  [[ -n "$SUBNET_ID" ]] || die "Defina OCI_SUBNET_ID, ou OCI_FISH_TARGETS_FILE, ou OCI_AVAILABILITY_DOMAIN+OCI_SUBNET_ID"

  local ad
  ad="$(
    oci network subnet get --subnet-id "$SUBNET_ID" --query 'data."availability-domain"' --raw-output 2>/dev/null \
      || oci network subnet get --subnet-id "$SUBNET_ID" | jq -r '.data["availability-domain"] // empty'
  )"
  [[ -n "$ad" && "$ad" != "null" ]] || die "Não foi possível obter o AD da subnet $SUBNET_ID"
  TARGET_ADS+=("$ad")
  TARGET_SUBNETS+=("$SUBNET_ID")
}

load_targets

SHAPE_JSON=$(jq -nc --argjson ocpus "$OCPUS" --argjson mem "$MEMORY_GB" '{ocpus: $ocpus, memory_in_gbs: $mem}')

num_targets=${#TARGET_ADS[@]}
cur_idx=0

echo "=== OCI fish instance ==="
echo "Shape: $SHAPE | OCPU: $OCPUS | RAM: ${MEMORY_GB} GiB | Alvos: $num_targets AD(s)"
for ((i = 0; i < num_targets; i++)); do
  echo "  [$i] AD=${TARGET_ADS[$i]} subnet=${TARGET_SUBNETS[$i]}"
done
echo "Intervalo: ${SLEEP_SECS}s | Max tentativas: ${MAX_ATTEMPTS:-0} (0=sem limite)"
echo ""

attempt=0
while true; do
  attempt=$((attempt + 1))
  if [[ "$MAX_ATTEMPTS" != "0" && "$attempt" -gt "$MAX_ATTEMPTS" ]]; then
    die "Limite de tentativas atingido ($MAX_ATTEMPTS)."
  fi

  AD="${TARGET_ADS[$cur_idx]}"
  SN="${TARGET_SUBNETS[$cur_idx]}"

  echo "[$(date -Iseconds)] Tentativa $attempt — AD=$AD (alvo $((cur_idx + 1))/${num_targets})"

  errf=$(mktemp)
  set +e
  instance_id=$(
    oci compute instance launch \
      --availability-domain "$AD" \
      --compartment-id "$COMPARTMENT_ID" \
      --display-name "$DISPLAY_NAME" \
      --subnet-id "$SN" \
      --image-id "$IMAGE_ID" \
      --shape "$SHAPE" \
      --shape-config "$SHAPE_JSON" \
      --assign-public-ip "$ASSIGN_PUBLIC" \
      --ssh-authorized-keys-file "$SSH_KEY_FILE" \
      --wait-for-state RUNNING \
      --query 'data.id' \
      --raw-output 2>"$errf"
  )
  code=$?
  err=$(cat "$errf" 2>/dev/null || true)
  rm -f "$errf"
  set -e

  if [[ "$code" -eq 0 && -n "$instance_id" ]]; then
    echo "Sucesso. Instância em RUNNING."
    echo "OCID: $instance_id"
    echo "Console: https://cloud.oracle.com/compute/instances/$instance_id"
    exit 0
  fi

  echo "$err" | sed 's/^/  | /'

  if echo "$err" | grep -qiE 'capacity|Capacity|InsufficientFree|Out of host|TooManyRequests|429|service limit'; then
    if ((num_targets > 1)); then
      cur_idx=$(( (cur_idx + 1) % num_targets ))
      echo "[$(date -Iseconds)] Sem capacidade — próximo alvo: índice $cur_idx; aguardando ${SLEEP_SECS}s…"
    else
      echo "[$(date -Iseconds)] Sem capacidade — único alvo; aguardando ${SLEEP_SECS}s…"
    fi
    sleep "$SLEEP_SECS"
    continue
  fi

  die "Falha não tratada como 'falta de capacidade'. Corrija o erro acima (AD/subnet/imagem/shape)."
done
