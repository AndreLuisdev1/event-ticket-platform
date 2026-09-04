import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { getAccessToken, useAuth } from '../../contexts/authContext';
import './validadeTickets.css';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

type ValidationResult = {
  status: 'valid' | 'invalid';
  message: string;
  ticketCode: string;
  event?: string;
  attendee?: string;
  seat?: string | null;
  timestamp: string;
};

export default function ValidateTicketsPage() {
  const { user } = useAuth();
  const [ticketInput, setTicketInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [latestResult, setLatestResult] = useState<ValidationResult | null>(null);
  const [history, setHistory] = useState<ValidationResult[]>([]);
  async function submitValidation(code: string) {
    const cleanCode = code.trim().replace(/^#/, '');
    if (!cleanCode || isValidating) return;

    setIsValidating(true);
    const nowTime = new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date());

    try {
      const response = await fetch(`${API_URL}/tickets/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify({ ticket_code: cleanCode }),
      });

      const body = await response.json().catch(() => null);

      if (response.ok) {
        const result: ValidationResult = {
          status: 'valid',
          message: body?.message ?? 'Entrada autorizada com sucesso!',
          ticketCode: cleanCode,
          event: body?.event,
          attendee: body?.attendee,
          seat: body?.seat ?? null,
          timestamp: nowTime,
        };
        setLatestResult(result);
        setHistory((prev) => [result, ...prev]);
        setTicketInput('');
      } else {
        const errorMsg = body?.detail ?? 'Ingresso inválido ou já utilizado.';
        const result: ValidationResult = {
          status: 'invalid',
          message: errorMsg,
          ticketCode: cleanCode,
          timestamp: nowTime,
        };
        setLatestResult(result);
        setHistory((prev) => [result, ...prev]);
      }
    } catch {
      const result: ValidationResult = {
        status: 'invalid',
        message: 'Erro de conexão com o servidor.',
        ticketCode: cleanCode,
        timestamp: nowTime,
      };
      setLatestResult(result);
      setHistory((prev) => [result, ...prev]);
    } finally {
      setIsValidating(false);
    }
  }

  function handleManualSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void submitValidation(ticketInput);
  }

  if (user?.role !== 'ORGANIZER') return <Navigate to="/" replace />;

  return (
    <section className="validate-container">
      {/* ── CABEÇALHO ── */}
      <div className="validate-header">
        <div>
          <Typography component="h1" className="validate-title">
            Portaria & Validação
          </Typography>
          <p className="validate-subtitle">
            Escaneie o QR Code dos ingressos ou insira o código manual para autorizar a entrada
          </p>
        </div>
      </div>

      <div className="validate-layout">
        {/* ── SCANNER E INPUT ── */}
        <div className="scanner-card">
          <div className="scanner-viewport">
            <div className="scanner-off-placeholder">
              <QrCodeScannerIcon />
              <span>Câmera desligada</span>
            </div>
          </div>

          <div className="scanner-controls">
            <Button variant="outlined" className="btn-camera-toggle" disabled>
              Ativar Câmera (Soon)
            </Button>
          </div>

          <form className="manual-input-form" onSubmit={handleManualSubmit}>
            <TextField
              fullWidth
              size="small"
              placeholder="Código do ingresso (ex: TCK-84729)"
              value={ticketInput}
              onChange={(e) => setTicketInput(e.target.value)}
              disabled={isValidating}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <QrCode2Icon sx={{ color: '#c084fc' }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Button type="submit" variant="contained" className="btn-validate-submit" disabled={isValidating || !ticketInput.trim()}>
              {isValidating ? <CircularProgress size={20} color="inherit" /> : 'Validar'}
            </Button>
          </form>
        </div>

        {/* ── PAINEL DE FEEDBACK E HISTÓRICO ── */}
        <div className="validate-side">
          {latestResult ? (
            <div className={`result-card ${latestResult.status === 'valid' ? 'result-valid' : 'result-invalid'}`}>
              <div className="result-icon">
                {latestResult.status === 'valid' ? <CheckCircleIcon /> : <ErrorIcon />}
              </div>

              <Typography className="result-status-title">
                {latestResult.status === 'valid' ? 'Acesso Permitido' : 'Acesso Negado'}
              </Typography>

              <p className="result-message">{latestResult.message}</p>

              <div className="result-details-box">
                <div className="result-detail-item">
                  <span className="result-detail-label">Código</span>
                  <span className="result-detail-value">#{latestResult.ticketCode}</span>
                </div>
                {latestResult.seat && (
                  <div className="result-detail-item">
                    <span className="result-detail-label">Assento</span>
                    <span className="result-detail-value">Poltrona {latestResult.seat}</span>
                  </div>
                )}
                <div className="result-detail-item">
                  <span className="result-detail-label">Horário</span>
                  <span className="result-detail-value">{latestResult.timestamp}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="result-card result-idle">
              <QrCodeScannerIcon sx={{ fontSize: '3rem', color: 'rgba(255,255,255,0.25)', mb: 1.5 }} />
              <Typography sx={{ fontFamily: 'Playfair Display', fontSize: '1.25rem', color: 'rgba(255,255,255,0.7)' }}>
                Aguardando Leitura
              </Typography>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem', margin: '4px 0 0' }}>
                Aponte a câmera para o QR Code ou digite o código do ingresso para liberar o cliente.
              </p>
            </div>
          )}

          {/* Histórico da Sessão de Validações */}
          <div className="history-card">
            <Typography className="history-title">
              <span>Leituras Recentes</span>
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>
                {history.length} registradas
              </span>
            </Typography>

            <div className="history-list">
              {history.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', textAlign: 'center', margin: '14px 0' }}>
                  Nenhum ingresso lido nesta sessão ainda.
                </p>
              ) : (
                history.map((item, idx) => (
                  <div className="history-item" key={idx}>
                    <span className="history-code">#{item.ticketCode}</span>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>{item.timestamp}</span>
                    <span className={`history-badge ${item.status === 'valid' ? 'success' : 'error'}`}>
                      {item.status === 'valid' ? 'AUTORIZADO' : 'RECUSADO'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}