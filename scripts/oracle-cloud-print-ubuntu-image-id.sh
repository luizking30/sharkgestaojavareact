#!/usr/bin/env bash
#
# Imprime o OCID da imagem mais recente do Ubuntu compatível com a shape (default Ampere Flex).
# Uso:
#   export OCI_COMPARTMENT_ID=ocid1.compartment...
#   ./scripts/oracle-cloud-print-ubuntu-image-id.sh
#
# Ou passe o compartment como 1º argumento:
#   ./scripts/oracle-cloud-print-ubuntu-image-id.sh ocid1.compartment...
#
# Depois:
#   export OCI_IMAGE_ID="<valor impresso>"
#

set -euo pipefail

COMP="${1:-${OCI_COMPARTMENT_ID:-}}"
SHAPE="${OCI_SHAPE:-VM.Standard.A1.Flex}"

[[ -n "$COMP" ]] || { echo "Uso: OCI_COMPARTMENT_ID=... $0   ou   $0 <compartment_ocid>" >&2; exit 1; }

command -v oci >/dev/null 2>&1 || { echo "OCI CLI não encontrado." >&2; exit 1; }

# Lista imagens Canonical Ubuntu filtradas pela shape; pega a mais recente (primeira do sort OCI).
id=$(oci compute image list \
  --compartment-id "$COMP" \
  --operating-system "Canonical Ubuntu" \
  --shape "$SHAPE" \
  --lifecycle-state AVAILABLE \
  --sort-by TIMECREATED \
  --query 'data[0].id' \
  --raw-output)

[[ -n "$id" && "$id" != "null" ]] || { echo "Nenhuma imagem Ubuntu encontrada para shape $SHAPE neste compartment." >&2; exit 1; }

echo "$id"
echo "" >&2
echo "export OCI_IMAGE_ID=\"$id\"" >&2
