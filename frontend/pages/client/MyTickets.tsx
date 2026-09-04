import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EventSeatIcon from '@mui/icons-material/EventSeat';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Snackbar from '@mui/material/Snackbar';
import Typography from '@mui/material/Typography';
import { getAccessToken } from '../../contexts/authContext';
import './myTickets.css';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export type TicketItem = {
  id: number;
  ticket_code: string;
  qr_code_hash: string;
  status: string;
  event_id: number;
  user_id: number;
  seat_id: number | null;
  seat_number?: string | null;
  created_at: string;
  used_at: string | null;
  event_title?: string;
  event_date?: string;
  event_location?: string;
};

export default function MyTicketsPage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTicketQr, setSelectedTicketQr] = useState<TicketItem | null>(null);
  const [copiedNotification, setCopiedNotification] = useState(false);

  useEffect(() => {
    void fetchUserTickets();
  }, []);

  async function fetchUserTickets() {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/tickets/me`, {
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
        },
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.detail ?? 'Não foi possível carregar seus ingressos.');
      }

      const data = (await response.json()) as TicketItem[];
      setTickets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao consultar ingressos.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleCopyCode(ticketCode: string) {
    void navigator.clipboard.writeText(ticketCode);
    setCopiedNotification(true);
  }

  function formatDateTime(dateIso: string): string {
    try {
      const date = new Date(dateIso);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date).replace('.', '');
    } catch {
      return dateIso;
    }
  }

  function renderStatusBadge(status: string) {
    const s = status.toLowerCase();
    if (s === 'used' || s === 'utilizado') {
      return (
        <span className="ticket-status-badge status-used">
          <CheckCircleIcon sx={{ fontSize: 13 }} />
          Utilizado
        </span>
      );
    }
    if (s === 'cancelled' || s === 'cancelado') {
      return (
        <span className="ticket-status-badge status-cancelled">
          <HighlightOffIcon sx={{ fontSize: 13 }} />
          Cancelado
        </span>
      );
    }
    return (
      <span className="ticket-status-badge status-active">
        <ConfirmationNumberIcon sx={{ fontSize: 13 }} />
        Válido
      </span>
    );
  }

  function getQrCodeUrl(value: string, size = 160): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
      value
    )}`;
  }

  return (
    <section className="tickets-container">
      {/* ── CABEÇALHO ── */}
      <div className="tickets-header">
        <div>
          <Typography component="h1" className="tickets-title">
            Meus Ingressos
          </Typography>
          <p className="tickets-subtitle">
            Apresente o QR Code na entrada da sessão para validação
          </p>
        </div>
        <span className="tickets-count-badge">
          {tickets.length} {tickets.length === 1 ? 'INGRESSO' : 'INGRESSOS'}
        </span>
      </div>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* ── ESTADOS DA LISTAGEM ── */}
      {isLoading ? (
        <div className="tickets-loading">
          <CircularProgress />
        </div>
      ) : tickets.length === 0 ? (
        /* Estado Vazio */
        <div className="tickets-empty-state">
          <div className="tickets-empty-icon">
            <ConfirmationNumberIcon />
          </div>
          <Typography sx={{ fontFamily: 'Playfair Display', fontSize: '1.4rem', fontWeight: 600 }}>
            Você ainda não possui ingressos
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.6)', mt: 1, maxWidth: 420 }}>
            Explore o catálogo de sessões e garanta seus lugares nos melhores eventos cinematográficos.
          </Typography>
          <Button
            variant="contained"
            className="tickets-empty-btn"
            onClick={() => navigate('/catalog')}
          >
            Explorar Catálogo
          </Button>
        </div>
      ) : (
        /* Lista de Ingressos */
        <div className="tickets-grid">
          {tickets.map((ticket) => (
            <div className="ticket-card" key={ticket.id}>
              {/* Lado Esquerdo: Dados do Evento e Poltrona */}
              <div className="ticket-main">
                <div className="ticket-top-row">
                  <span className="ticket-code-tag">#{ticket.ticket_code}</span>
                  {renderStatusBadge(ticket.status)}
                </div>

                <Typography className="ticket-event-name">
                  {ticket.event_title || `Sessão #${ticket.event_id}`}
                </Typography>

                <div className="ticket-details-grid">
                  <div className="ticket-meta-block">
                    <span className="ticket-meta-label">Assento</span>
                    <span className="ticket-meta-value">
                      <EventSeatIcon />
                      {ticket.seat_number ? `Poltrona ${ticket.seat_number}` : 'Livre'}
                    </span>
                  </div>

                  <div className="ticket-meta-block">
                    <span className="ticket-meta-label">Data da Compra</span>
                    <span className="ticket-meta-value">
                      <CalendarMonthIcon />
                      {formatDateTime(ticket.created_at)}
                    </span>
                  </div>

                  {ticket.used_at && (
                    <div className="ticket-meta-block">
                      <span className="ticket-meta-label">Utilizado Em</span>
                      <span className="ticket-meta-value">
                        {formatDateTime(ticket.used_at)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="ticket-perforation" />

              {/* Lado Direito: Canhoto com QR Code */}
              <div className="ticket-stub">
                <div className="ticket-qr-wrapper" title="Clique para ampliar o QR Code" onClick={() => setSelectedTicketQr(ticket)}>
                  <img src={getQrCodeUrl(ticket.qr_code_hash || ticket.ticket_code, 120)} alt={`QR Code do ingresso ${ticket.ticket_code}`}
                       className="ticket-qr-img"/>
                </div>

                <span className="ticket-stub-instruction">Toque para ampliar</span>

                <Button size="small" variant="outlined" className="ticket-copy-btn" startIcon={<ContentCopyIcon sx={{ fontSize: 13 }} />}
                        onClick={() => handleCopyCode(ticket.ticket_code)}>
                  Copiar Código
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MODAL PARA EXIBIÇÃO AMPLIADA DO QR CODE ── */}
      <Dialog open={selectedTicketQr !== null} onClose={() => setSelectedTicketQr(null)} maxWidth="xs" 
              fullWidth slotProps={{ paper: { className: 'qr-dialog-paper' } }}>
        {selectedTicketQr && (
          <>
            <DialogTitle className="qr-dialog-header">
              <IconButton onClick={() => setSelectedTicketQr(null)} aria-label="Fechar">
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent className="qr-dialog-content">
              <div className="qr-big-box">
                <img src={getQrCodeUrl(selectedTicketQr.qr_code_hash || selectedTicketQr.ticket_code, 240)} alt="QR Code ampliado"
                />
              </div>

              <Typography className="qr-dialog-title">
                {selectedTicketQr.event_title || `Sessão #${selectedTicketQr.event_id}`}
              </Typography>
              <div className="qr-dialog-code">#{selectedTicketQr.ticket_code}</div>
              <p className="qr-dialog-hint">
                Aproxime o leitor óptico do organizador para autorizar sua entrada.
              </p>
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* Feedback de código copiado */}
      <Snackbar open={copiedNotification} autoHideDuration={2500} onClose={() => setCopiedNotification(false)}
        message="Código do ingresso copiado para a área de transferência!"/>
    </section>
  );
}