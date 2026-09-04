import { useEffect, useMemo, useState } from 'react';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { getAccessToken } from '../../contexts/authContext';
import './clientCatalog.css';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export type EventItem = {
  id: number;
  title: string;
  description: string | null;
  date: string;
  location: string;
  price: number;
  capacity: number;
  tmdb_id: number | null;
  poster_url: string | null;
};

type Seat = {
  id: number;
  seat_number: string;
  status: 'AVAILABLE' | 'HELD' | 'SOLD';
};

export default function ClientCatalogPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState<number[]>([]);
  const [isLoadingSeats, setIsLoadingSeats] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [purchaseMessage, setPurchaseMessage] = useState('');
  const [purchaseError, setPurchaseError] = useState('');

  useEffect(() => {
    void fetchEvents();
  }, []);

  async function fetchEvents() {
    setIsLoading(true);
    setError('');
    try {
      const token = getAccessToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_URL}/events`, { headers });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.detail ?? 'Não foi possível carregar as sessões.');
      }
      const data = (await response.json()) as EventItem[];
      setEvents(data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Erro ao carregar catálogo de eventos.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  // Filtragem local por título ou local do evento
  const filteredEvents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return events;
    return events.filter(
      (ev) =>
        ev.title.toLowerCase().includes(q) ||
        ev.location.toLowerCase().includes(q)
    );
  }, [events, searchQuery]);

  // Carrossel no Banner Hero (primeiros 5 eventos)
  const featuredEvents = useMemo(() => events.slice(0, 5), [events]);
  const currentHero = featuredEvents[featuredIndex] ?? null;

  useEffect(() => {
    if (featuredEvents.length <= 1) return;
    const interval = setInterval(() => {
      setFeaturedIndex((prev) => (prev + 1) % featuredEvents.length);
    }, 6500);
    return () => clearInterval(interval);
  }, [featuredEvents.length]);

  // Formatação de data/hora amigável pt-BR (ex.: 15 de out., 20:30)
  function formatEventDate(isoDate: string): string {
    try {
      const parsed = new Date(isoDate);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).format(parsed).replace('.', '');
    } catch {
      return isoDate;
    }
  }

  function formatCurrency(val: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  }

  function handleSelectEvent(eventId: number) {
    const event = events.find((item) => item.id === eventId) ?? currentHero;
    if (!event || event.id !== eventId) return;
    setSelectedEvent(event);
    setSeats([]);
    setSelectedSeatIds([]);
    setPurchaseMessage('');
    setPurchaseError('');
    setIsLoadingSeats(true);
    void loadSeats(event.id);
  }

  async function loadSeats(eventId: number) {
    try {
      const token = getAccessToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const response = await fetch(`${API_URL}/events/${eventId}/seats`, { headers });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.detail ?? 'Não foi possível carregar os assentos.');
      }
      setSeats((await response.json()) as Seat[]);
    } catch (requestError) {
      setPurchaseError(requestError instanceof Error ? requestError.message : 'Não foi possível carregar os assentos.');
    } finally {
      setIsLoadingSeats(false);
    }
  }

  function closePurchaseDialog() {
    if (!isBuying) setSelectedEvent(null);
  }

  function toggleSeat(seat: Seat) {
    if (seat.status !== 'AVAILABLE' || isBuying) return;
    setSelectedSeatIds((current) => current.includes(seat.id)
      ? current.filter((seatId) => seatId !== seat.id)
      : [...current, seat.id]);
  }

  async function handlePurchase() {
    if (!selectedEvent || selectedSeatIds.length === 0) return;
    setIsBuying(true);
    setPurchaseError('');
    setPurchaseMessage('');
    const heldSeatIds: number[] = [];
    try {
      for (const seatId of selectedSeatIds) {
        const holdResponse = await fetch(`${API_URL}/seats/hold`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAccessToken()}` },
          body: JSON.stringify({ seat_id: seatId }),
        });
        if (!holdResponse.ok) {
          const body = await holdResponse.json().catch(() => null);
          throw new Error(body?.detail ?? 'Um dos assentos não está mais disponível.');
        }
        heldSeatIds.push(seatId);
      }

      for (const seatId of heldSeatIds) {
        const checkoutResponse = await fetch(`${API_URL}/tickets/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAccessToken()}` },
          body: JSON.stringify({ event_id: selectedEvent.id, seat_id: seatId }),
        });
        if (!checkoutResponse.ok) {
          const body = await checkoutResponse.json().catch(() => null);
          throw new Error(body?.detail ?? 'Não foi possível confirmar um dos ingressos.');
        }
      }

      setPurchaseMessage(`${heldSeatIds.length} ${heldSeatIds.length === 1 ? 'ingresso comprado' : 'ingressos comprados'} com sucesso!`);
      setSelectedSeatIds([]);
      await loadSeats(selectedEvent.id);
    } catch (requestError) {
      for (const seatId of heldSeatIds) {
        await fetch(`${API_URL}/seats/release`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAccessToken()}` },
          body: JSON.stringify({ seat_id: seatId }),
        }).catch(() => undefined);
      }
      setPurchaseError(requestError instanceof Error ? requestError.message : 'Não foi possível concluir a compra.');
    } finally {
      setIsBuying(false);
    }
  }

  return (
    <section className="client-catalog">
      {/* ── BANNER PRINCIPAL COM DESTAQUE DA SESSÃO ── */}
      {!isLoading && currentHero && (
        <div className="catalog-hero">
          <div className="catalog-hero-bg">
            <img
              src={currentHero.poster_url ?? '/placeholder-poster.svg'}
              alt={currentHero.title}
              className="catalog-hero-img"
            />
            <div className="catalog-hero-overlay" />
          </div>

          <div className="catalog-hero-content">
            <div className="catalog-hero-tags">
              <span className="badge-highlight">Evento em Destaque</span>
              <span className="badge-sub">
                <CalendarMonthIcon sx={{ fontSize: 15 }} />
                {formatEventDate(currentHero.date)}
              </span>
            </div>

            <Typography component="h1" className="catalog-hero-title">
              {currentHero.title}
            </Typography>

            <p className="catalog-hero-overview">
              {currentHero.description || 'Sinopse não cadastrada para este evento.'}
            </p>

            <div className="hero-meta-strip">
              <div className="hero-meta-item">
                <LocationOnIcon />
                <span>{currentHero.location}</span>
              </div>
              <div className="hero-meta-item">
                <PeopleAltIcon />
                <span>Capacidade: {currentHero.capacity} pessoas</span>
              </div>
            </div>

            <div className="catalog-hero-actions">
              <span className="hero-price-tag">{formatCurrency(currentHero.price)}</span>
              <Button
                variant="contained"
                className="hero-btn-primary"
                startIcon={<ConfirmationNumberIcon />}
                onClick={() => handleSelectEvent(currentHero.id)}
              >
                Garantir Ingresso
              </Button>
            </div>

            {featuredEvents.length > 1 && (
              <div className="catalog-hero-dots">
                {featuredEvents.map((item, idx) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-label={`Slide ${idx + 1}`}
                    className={`hero-dot ${idx === featuredIndex ? 'active' : ''}`}
                    onClick={() => setFeaturedIndex(idx)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SUB-CABEÇALHO COM BUSCA E CONTAGEM ── */}
      <div className="catalog-subhead">
        <div>
          <h2 className="catalog-grid-title">Sessões Disponíveis</h2>
          <span className="catalog-count">
            {filteredEvents.length}{' '}
            {filteredEvents.length === 1 ? 'EVENTO ENCONTRADO' : 'EVENTOS ENCONTRADOS'}
          </span>
        </div>

        <TextField
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por filme ou cinema..."
          size="small"
          className="catalog-search-form"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'rgba(255,255,255,0.45)' }} />
                </InputAdornment>
              ),
            },
          }}
        />
      </div>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {isLoading ? (
        <div className="catalog-loading">
          <CircularProgress />
        </div>
      ) : filteredEvents.length === 0 ? (
        /* ── ESTADO VAZIO: NENHUM EVENTO ENCONTRADO OU CADASTRADO ── */
        <div className="catalog-empty-state">
          <div className="empty-icon-wrap">
            <EventBusyIcon />
          </div>
          <Typography className="empty-title">Nenhuma sessão disponível</Typography>
          <p className="empty-desc">
            {searchQuery
              ? `Não encontramos nenhum resultado para "${searchQuery}". Tente buscar por outro termo.`
              : 'Nenhum evento foi criado pelos organizadores até o momento. Fique atento, novas sessões serão publicadas em breve!'}
          </p>
        </div>
      ) : (
        /* ── GRID DOS EVENTOS ── */
        <div className="event-grid">
          {filteredEvents.map((event) => (
            <Card className="event-card" key={event.id}>
              <div className="event-poster-wrap">
                <CardMedia
                  component="img"
                  image={event.poster_url ?? '/placeholder-poster.svg'}
                  alt={`Pôster de ${event.title}`}
                />
                <div className="event-card-overlay" />
                <span className="event-price-badge">{formatCurrency(event.price)}</span>
              </div>

              <CardContent className="event-card-body">
                <Typography className="event-title" title={event.title}>
                  {event.title}
                </Typography>

                <div className="event-info-list">
                  <div className="event-info-item">
                    <CalendarMonthIcon />
                    <span>{formatEventDate(event.date)}</span>
                  </div>

                  <div className="event-info-item">
                    <LocationOnIcon />
                    <span title={event.location}>{event.location}</span>
                  </div>

                  <div className="event-info-item">
                    <PeopleAltIcon />
                    <span>{event.capacity} lugares máx.</span>
                  </div>
                </div>

                {event.description && (
                  <Typography className="event-overview">
                    {event.description}
                  </Typography>
                )}

                <Button
                  className="event-buy-btn"
                  variant="contained"
                  startIcon={<ConfirmationNumberIcon />}
                  onClick={() => handleSelectEvent(event.id)}
                >
                  Garantir Ingresso
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={selectedEvent !== null}
        onClose={closePurchaseDialog}
        fullWidth
        maxWidth="sm"
        slotProps={{ paper: { className: 'purchase-dialog-paper' } }}
      >
        {selectedEvent && (
          <>
            <DialogTitle className="purchase-dialog-title">
              <div>
                <span className="purchase-dialog-kicker">Comprar ingresso</span>
                <h2>{selectedEvent.title}</h2>
              </div>
              <IconButton aria-label="Fechar" onClick={closePurchaseDialog} disabled={isBuying}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent className="purchase-dialog-content">
              <div className="purchase-dialog-summary">
                <span>{formatEventDate(selectedEvent.date)}</span>
                <span>{selectedEvent.location}</span>
                <strong>{formatCurrency(selectedEvent.price)} por assento</strong>
              </div>

              <Typography className="seat-selection-label">
                Escolha seus assentos
              </Typography>

              {isLoadingSeats ? (
                <div className="seat-grid-loading"><CircularProgress /></div>
              ) : seats.length === 0 ? (
                <Alert severity="info">Nenhum assento foi cadastrado para este evento.</Alert>
              ) : (
                <div className="seat-grid" aria-label="Grid de assentos">
                  {seats.map((seat) => {
                    const isSelected = selectedSeatIds.includes(seat.id);
                    return (
                      <button
                        key={seat.id}
                        type="button"
                        className={`seat-button seat-${seat.status.toLowerCase()}${isSelected ? ' seat-selected' : ''}`}
                        disabled={seat.status !== 'AVAILABLE' || isBuying}
                        aria-label={`Assento ${seat.seat_number}, ${isSelected ? 'selecionado' : seat.status.toLowerCase()}`}
                        aria-pressed={isSelected}
                        onClick={() => toggleSeat(seat)}
                      >
                        {seat.seat_number}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="seat-legend">
                <span><i className="legend-dot legend-available" />Disponível</span>
                <span><i className="legend-dot legend-selected" />Selecionado</span>
                <span><i className="legend-dot legend-unavailable" />Indisponível</span>
              </div>

              {selectedSeatIds.length > 0 && (
                <div className="purchase-total">
                  <span>{selectedSeatIds.length} {selectedSeatIds.length === 1 ? 'assento' : 'assentos'}</span>
                  <strong>{formatCurrency(selectedEvent.price * selectedSeatIds.length)}</strong>
                </div>
              )}

              {purchaseError && <Alert className="purchase-alert" severity="error">{purchaseError}</Alert>}
              {purchaseMessage && <Alert className="purchase-alert" severity="success">{purchaseMessage}</Alert>}
            </DialogContent>

            <DialogActions className="purchase-dialog-actions">
              <Button onClick={closePurchaseDialog} disabled={isBuying}>Fechar</Button>
              <Button
                variant="contained"
                startIcon={<ConfirmationNumberIcon />}
                onClick={() => void handlePurchase()}
                disabled={isBuying || selectedSeatIds.length === 0 || isLoadingSeats}
              >
                {isBuying ? 'Confirmando...' : 'Confirmar compra'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </section>
  );
}