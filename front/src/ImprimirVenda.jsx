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

async function fetchVendaDetalhe(vendaId) {
  try {
    const res = await api.get(`/api/vendas/${vendaId}`);
    return res.data;
  } catch (e) {
    if (e.response?.status === 404) {
      const res2 = await api.get('/api/vendas/filtrar', { params: { id: vendaId } });
      const arr = res2.data;
      if (Array.isArray(arr) && arr.length > 0) return arr[0];
    }
    throw e;
  }
}

const ImprimirVenda = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const empresa = useMemo(() => readEmpresaFromStorage(), []);

  const vendaId = Number(id);
  const idValido = Number.isFinite(vendaId) && vendaId > 0;

  const { data: v, isLoading, isError, error } = useQuery({
    queryKey: ['imprimir-venda', vendaId],
    queryFn: () => fetchVendaDetalhe(vendaId),
    enabled: idValido,
  });

  const handlePrint = () => window.print();

  const temDesconto =
    v?.itens?.some((it) => Number(it.desconto) > 0) ?? false;

  if (!idValido) {
    return (
      <div className="print-receipt-root p-4 text-center text-white">
        <p>ID de venda inválido.</p>
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
          <div className="small">Carregando venda…</div>
        </div>
      </div>
    );
  }

  if (isError || !v) {
    const msg =
      error?.response?.status === 404
        ? 'Venda não encontrada ou sem permissão.'
        : 'Não foi possível carregar a venda.';
    return (
      <div className="print-receipt-root p-4 text-center text-white">
        <p>{msg}</p>
        <button type="button" className="btn btn-outline-light mt-2" onClick={() => navigate('/vendas')}>
          Ir para vendas
        </button>
      </div>
    );
  }

  const nomeVendedor = v.nomeVendedorNoAto || v.vendedor?.nome || '—';
  const dataStr = v.dataHora ? new Date(v.dataHora).toLocaleString('pt-BR') : '—';

  return (
    <div className="print-receipt-root">
      <div className="print-receipt-toolbar d-print-none">
        <button type="button" className="btn btn-outline-light" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left me-1" />
          Voltar
        </button>
        <button type="button" className="btn btn-info fw-bold" onClick={handlePrint}>
          <i className="bi bi-printer me-1" />
          Imprimir
        </button>
      </div>

      <div className="print-receipt-sheet">
        <h1>{empresa?.nome ? String(empresa.nome).toUpperCase() : 'SHARK'}</h1>
        <div className="print-sub">Cupom de venda</div>
        <div className="print-receipt-banner" style={{ marginTop: '0.35rem' }}>
          VENDA #{v.id}
        </div>
        <p className="print-sub mb-1">
          <strong>Data:</strong> {dataStr}
        </p>

        {temDesconto && v.clienteNome && (
          <>
            <div className="print-receipt-section-title">CLIENTE (DESCONTO)</div>
            <hr className="print-receipt-divider" />
            <p className="mb-2" style={{ textAlign: 'center', fontWeight: 700 }}>
              {v.clienteNome}
            </p>
          </>
        )}

        <div className="print-receipt-section-title">ITENS</div>
        <hr className="print-receipt-divider" />

        <div className="small" style={{ marginBottom: '0.5rem' }}>
          {(v.itens || []).map((item, idx) => (
            <div
              key={idx}
              className="d-flex justify-content-between gap-2 py-1 border-bottom border-light-subtle align-items-start"
            >
              <span>
                <strong>{item.quantidade}×</strong> {item.produto?.nome || 'Item'}
                {Number(item.desconto) > 0 && (
                  <span className="text-danger d-block small">Desc. {item.desconto}%</span>
                )}
              </span>
              <span className="text-nowrap">
                {Number(item.precoUnitario || 0).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </span>
            </div>
          ))}
        </div>

        <hr className="print-receipt-divider" />
        <div className="print-receipt-total">
          <strong>TOTAL:</strong>{' '}
          {Number(v.valorTotal || 0).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          })}
        </div>

        <p className="print-receipt-muted mb-0">
          <strong>Vendedor:</strong> {nomeVendedor}
        </p>
      </div>
    </div>
  );
};

export default ImprimirVenda;
