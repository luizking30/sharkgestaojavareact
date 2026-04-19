import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from './api';
import './print-receipt.css';

function readEmpresaFromStorage() {
  try {
    const raw = localStorage.getItem('usuarioShark');
    if (!raw || raw === 'undefined') return null;
    return JSON.parse(raw)?.empresa ?? null;
  } catch {
    return null;
  }
}

function tituloComprovante(status) {
  if (!status) return 'Comprovante de ordem de serviço';
  const s = String(status);
  if (s === 'Em andamento') return 'Comprovante de serviço em andamento';
  if (s === 'Pronto') return 'Comprovante de serviço pronto';
  if (s === 'Entregue') return 'Comprovante de serviço entregue';
  return 'Comprovante de abertura de ordem';
}

function observacaoStatus(status) {
  if (!status) return '';
  const s = String(status);
  if (s === 'Em andamento') return 'Serviço em execução. Aguardando conclusão técnica.';
  if (s === 'Pronto') return 'Serviço concluído tecnicamente e aguardando retirada.';
  if (s === 'Entregue') return 'Serviço finalizado e equipamento entregue ao cliente.';
  return 'Ordem aberta e em análise inicial. Valor pode ser definido no início do atendimento.';
}

function rotuloBanner(status) {
  if (!status) return '—';
  const s = String(status);
  if (s === 'Em andamento') return 'Em execução';
  if (s === 'Pronto') return 'Pronto para retirada';
  if (s === 'Entregue') return 'Finalizado';
  return 'Aguardando aprovação';
}

function fmtData(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function dataPorStatus(os) {
  const s = os?.status;
  if (s === 'Em andamento') return os?.dataAndamento;
  if (s === 'Pronto') return os?.dataPronto;
  if (s === 'Entregue') return os?.dataEntrega;
  return os?.data;
}

function funcPorStatus(os) {
  const s = os?.status;
  if (s === 'Em andamento') return os?.funcionarioAndamento;
  if (s === 'Pronto') return os?.funcionarioPronto;
  if (s === 'Entregue') return os?.funcionarioEntrega;
  return os?.funcionarioAbertura;
}

function fmtMoney(v) {
  if (v == null || Number.isNaN(Number(v))) return 'Em análise';
  const n = Number(v);
  if (n <= 0) return 'Em análise';
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const ImprimirOrdemServico = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const empresa = useMemo(() => readEmpresaFromStorage(), []);

  const osId = Number(id);
  const idValido = Number.isFinite(osId) && osId > 0;

  const { data: os, isLoading, isError, error } = useQuery({
    queryKey: ['imprimir-os', osId],
    queryFn: async () => {
      try {
        const res = await api.get(`/api/ordens/${osId}`);
        return res.data;
      } catch (e) {
        if (e.response?.status === 404) {
          const res2 = await api.get('/api/ordens', {
            params: { id: osId, page: 0, size: 1, sort: 'id,desc' },
          });
          const content = res2.data?.content ?? [];
          if (content.length > 0) return content[0];
        }
        throw e;
      }
    },
    enabled: idValido,
  });

  const handlePrint = () => window.print();

  if (!idValido) {
    return (
      <div className="print-receipt-root p-4 text-center text-white">
        <p>ID de O.S. inválido.</p>
        <button type="button" className="btn btn-outline-light mt-2" onClick={() => navigate(-1)}>
          Voltar
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="print-receipt-root d-flex align-items-center justify-content-center min-vh-100">
        <div className="text-info">
          <div className="spinner-border mb-2" role="status" />
          <div className="small">Carregando O.S.…</div>
        </div>
      </div>
    );
  }

  if (isError || !os) {
    const msg =
      error?.response?.status === 404
        ? 'Ordem de serviço não encontrada ou sem permissão.'
        : 'Não foi possível carregar a O.S.';
    return (
      <div className="print-receipt-root p-4 text-center text-white">
        <p>{msg}</p>
        <button type="button" className="btn btn-outline-light mt-2" onClick={() => navigate('/servicos')}>
          Ir para O.S.
        </button>
      </div>
    );
  }

  const statusAtual = os.status;
  const dataStatus = fmtData(dataPorStatus(os));
  const respStatus = funcPorStatus(os) || '—';
  const valorTexto = fmtMoney(os.valorTotal);
  const aberturaPor = os.funcionarioAbertura || '—';

  let liqLinha = null;
  if (String(statusAtual).toLowerCase() === 'entregue' && os.custoPeca != null && os.custoPeca > 0) {
    const total = os.valorTotal != null ? os.valorTotal : 0;
    const liq = total - os.custoPeca;
    liqLinha = (
      <>
        <div className="print-receipt-kv">
          <dt>Peças</dt>
          <dd>
            −{' '}
            {os.custoPeca.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </dd>
          <dt>Líquido</dt>
          <dd>{liq.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</dd>
        </div>
      </>
    );
  }

  return (
    <div className="print-receipt-root">
      <div className="print-receipt-toolbar d-print-none">
        <button type="button" className="btn btn-outline-light" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left me-1" />
          Voltar
        </button>
        <div className="d-flex gap-2">
          <button type="button" className="btn btn-info fw-bold" onClick={handlePrint}>
            <i className="bi bi-printer me-1" />
            Imprimir
          </button>
        </div>
      </div>

      <div className="print-receipt-sheet">
        <h1>{empresa?.nome ? String(empresa.nome).toUpperCase() : 'SHARK'}</h1>
        <div className="print-sub">Assistência técnica</div>
        <div className="print-sub">
          {empresa?.cnpj && (
            <div>
              CNPJ: {empresa.cnpj}
            </div>
          )}
          {empresa?.whatsapp && (
            <div>
              WhatsApp: {empresa.whatsapp}
            </div>
          )}
        </div>

        <div className="print-receipt-banner">{rotuloBanner(statusAtual)}</div>
        <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '0.85rem' }}>{tituloComprovante(statusAtual)}</div>

        <div className="print-receipt-section-title">IDENTIFICAÇÃO</div>
        <hr className="print-receipt-divider" />
        <div style={{ textAlign: 'center', fontWeight: 800, fontSize: '1rem' }}>Ordem de serviço #{os.id}</div>
        <div className="print-sub">Aberto em: {fmtData(os.data)}</div>
        <div className="print-sub">Aberto por: {aberturaPor}</div>

        <div className="print-receipt-section-title">CLIENTE</div>
        <hr className="print-receipt-divider" />
        <dl className="print-receipt-kv">
          <dt>Nome</dt>
          <dd>{os.clienteNome || '—'}</dd>
          <dt>CPF</dt>
          <dd>{os.clienteCpf || 'Não informado'}</dd>
          <dt>WhatsApp</dt>
          <dd>{os.clienteWhatsapp || 'Não informado'}</dd>
        </dl>

        <div className="print-receipt-section-title">EQUIPAMENTO E DEFEITO</div>
        <hr className="print-receipt-divider" />
        <dl className="print-receipt-kv">
          <dt>Produto</dt>
          <dd>{os.produto || '—'}</dd>
          <dt>Defeito</dt>
          <dd style={{ fontStyle: 'italic' }}>{os.defeito || '—'}</dd>
        </dl>

        <div className="print-receipt-section-title">LINHA DO TEMPO</div>
        <hr className="print-receipt-divider" />
        <ul className="print-receipt-timeline list-unstyled mb-0">
          <li className="print-receipt-timeline-item">
            <div className="print-receipt-timeline-label">Aberto</div>
            <div className="print-receipt-timeline-body">
              <div className="print-receipt-timeline-who">{os.funcionarioAbertura || '—'}</div>
              <div className="print-receipt-timeline-when">{fmtData(os.data)}</div>
            </div>
          </li>
          {os.dataAndamento && (
            <li className="print-receipt-timeline-item">
              <div className="print-receipt-timeline-label">Andamento</div>
              <div className="print-receipt-timeline-body">
                <div className="print-receipt-timeline-who">{os.funcionarioAndamento || '—'}</div>
                <div className="print-receipt-timeline-when">{fmtData(os.dataAndamento)}</div>
              </div>
            </li>
          )}
          {os.dataPronto && (
            <li className="print-receipt-timeline-item">
              <div className="print-receipt-timeline-label">Pronto</div>
              <div className="print-receipt-timeline-body">
                <div className="print-receipt-timeline-who">{os.funcionarioPronto || '—'}</div>
                <div className="print-receipt-timeline-when">{fmtData(os.dataPronto)}</div>
              </div>
            </li>
          )}
          {os.dataEntrega && (
            <li className="print-receipt-timeline-item">
              <div className="print-receipt-timeline-label">Entregue</div>
              <div className="print-receipt-timeline-body">
                <div className="print-receipt-timeline-who">{os.funcionarioEntrega || '—'}</div>
                <div className="print-receipt-timeline-when">{fmtData(os.dataEntrega)}</div>
              </div>
            </li>
          )}
        </ul>

        <div className="print-receipt-section-title">STATUS ATUAL (COMPROVANTE)</div>
        <hr className="print-receipt-divider" />
        <div style={{ textAlign: 'center', fontWeight: 800 }}>{String(statusAtual || '').toUpperCase()}</div>
        <div className="print-sub">Data/hora: {dataStatus}</div>
        <div className="print-sub">Responsável: {respStatus}</div>

        <div className="print-receipt-section-title">FINANCEIRO</div>
        <hr className="print-receipt-divider" />
        <div className="print-receipt-total">Valor O.S.: {valorTexto}</div>
        {liqLinha}

        <p className="print-receipt-muted">{observacaoStatus(statusAtual)}</p>
      </div>
    </div>
  );
};

export default ImprimirOrdemServico;
