import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import SearchIcon from '@mui/icons-material/Search';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { getAccessToken, useAuth } from '../../contexts/authContext';
import './manageEvents.css';

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
  organizer_id: number;
};

export default function ManageEventsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState('');

  // Estados para Edição
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    price: '',
    capacity: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // Estados para Remoção
  const [deletingEvent, setDeletingEvent] = useState<EventItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    const organizerId = user.id;

    void fetchOrganizerEvents();

    async function fetchOrganizerEvents() {
      setIsLoading(true);
      setError('');
      try {
        const response = await fetch(`${API_URL}/events/organizer/${organizerId}`, {
          headers: { Authorization: `Bearer ${getAccessToken()}` },
        });
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.detail ?? 'Não foi possível carregar seus eventos.');
        }
        const data = (await response.json()) as EventItem[];
        setEvents(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao buscar eventos.');
      } finally {
        setIsLoading(false);
      }
    }
  }, [user?.id]);

  // Prepara o formato ISO para o input datetime-local (YYYY-MM-DDTHH:mm)
  function formatIsoForInput(isoString: string): string {
    try {
      const d = new Date(isoString);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      return d.toISOString().slice(0, 16);
    } catch {
      return '';
    }
  }

  function handleOpenEdit(event: EventItem) {
    setEditingEvent(event);
    setEditForm({
      title: event.title,
      description: event.description || '',
      date: formatIsoForInput(event.date),
      location: event.location,
      price: String(event.price),
      capacity: String(event.capacity),
    });
    setEditError('');
  }

  function handleCloseEdit() {
    if (!isSaving) {
      setEditingEvent(null);
      setEditError('');
    }
  }

  async function handleUpdateEvent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingEvent) return;

    setIsSaving(true);
    setEditError('');
    try {
      const payload = {
        title: editForm.title,
        description: editForm.description || null,
        date: new Date(editForm.date).toISOString(),
        location: editForm.location,
        price: Number(editForm.price),
        capacity: Number(editForm.capacity),
      };

      const response = await fetch(`${API_URL}/events/${editingEvent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.detail ?? 'Erro ao atualizar o evento.');
      }

      const updated = (await response.json()) as EventItem;
      setEvents((prev) => prev.map((ev) => (ev.id === updated.id ? updated : ev)));
      setFeedbackSuccess('Evento atualizado com sucesso!');
      setEditingEvent(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Erro ao atualizar evento.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteEvent() {
    if (!deletingEvent) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`${API_URL}/events/${deletingEvent.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getAccessToken()}` },
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.detail ?? 'Não foi possível excluir o evento.');
      }

      setEvents((prev) => prev.filter((ev) => ev.id !== deletingEvent.id));
      setFeedbackSuccess('Evento removido com sucesso!');
      setDeletingEvent(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir evento.');
    } finally {
      setIsDeleting(false);
    }
  }

  function formatDateTime(iso: string): string {
    try {
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(iso)).replace('.', '');
    } catch {
      return iso;
    }
  }

  function formatPrice(val: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  }

  const filteredEvents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return events;
    return events.filter(
      (ev) =>
        ev.title.toLowerCase().includes(q) ||
        ev.location.toLowerCase().includes(q)
    );
  }, [events, searchQuery]);

  if (user?.role !== 'ORGANIZER') return <Navigate to="/" replace />;

  return (
    <section className="manage-events-container">
      {/* ── BARRA SUPERIOR ── */}
      <div className="manage-header">
        <div>
          <Typography component="h1" className="manage-title">
            Gerenciar Sessões
          </Typography>
          <p className="manage-subtitle">
            Acompanhe, altere detalhes ou encerre suas sessões ativas
          </p>
        </div>

        <div className="manage-toolbar">
          <TextField size="small" placeholder="Filtrar sessões..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                     className="manage-search-input"
                     slotProps={{
                         input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: 'rgba(255,255,255,0.4)' }} />
                                </InputAdornment>
                            ),
                         },
                     }}/>

          <Button variant="contained" className="btn-new-session" startIcon={<AddIcon />} onClick={() => navigate('/catalog')}>
            Nova Sessão
          </Button>
        </div>
      </div>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}
      {feedbackSuccess && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setFeedbackSuccess('')}>
          {feedbackSuccess}
        </Alert>
      )}

      {/* ── CORPO DA LISTAGEM ── */}
      {isLoading ? (
        <div className="manage-loading">
          <CircularProgress />
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="manage-empty-state">
          <div className="manage-empty-icon">
            <EventBusyIcon />
          </div>
          <Typography sx={{ fontFamily: 'Playfair Display', fontSize: '1.4rem', fontWeight: 600 }}>
            Nenhum evento encontrado
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.6)', mt: 1, maxWidth: 440 }}>
            {searchQuery
              ? `Nenhum resultado corresponde à busca "${searchQuery}".`
              : 'Você ainda não cadastrou nenhuma sessão. Escolha um filme no catálogo para criar um novo evento.'}
          </Typography>
          {!searchQuery && (
            <Button
              variant="contained"
              sx={{ mt: 2.5 }}
              className="btn-new-session"
              startIcon={<AddIcon />}
              onClick={() => navigate('/catalog')}
            >
              Ir ao Catálogo
            </Button>
          )}
        </div>
      ) : (
        <div className="manage-grid">
          {filteredEvents.map((event) => (
            <Card className="manage-card" key={event.id}>
              <div className="manage-card-top">
                <img
                  src={event.poster_url ?? '/placeholder-poster.svg'}
                  alt={event.title}
                  className="manage-poster"
                />
                <div className="manage-card-header-info">
                  <span className="manage-card-id">ID #{event.id}</span>
                  <Typography className="manage-card-title" title={event.title}>
                    {event.title}
                  </Typography>
                  <span className="manage-card-price">{formatPrice(event.price)}</span>
                </div>
              </div>

              <CardContent className="manage-card-body">
                <div className="manage-info-row">
                  <CalendarMonthIcon />
                  <span>{formatDateTime(event.date)}</span>
                </div>
                <div className="manage-info-row">
                  <LocationOnIcon />
                  <span title={event.location}>{event.location}</span>
                </div>
                <div className="manage-info-row">
                  <PeopleAltIcon />
                  <span>Capacidade: {event.capacity} lugares</span>
                </div>
                {event.description && (
                  <Typography className="manage-card-desc">
                    {event.description}
                  </Typography>
                )}
              </CardContent>

              <div className="manage-card-actions">
                <Button variant="outlined" className="btn-card-edit" startIcon={<EditIcon />} onClick={() => handleOpenEdit(event)}>
                  Editar
                </Button>
                <Button variant="outlined" className="btn-card-delete" startIcon={<DeleteIcon />} onClick={() => setDeletingEvent(event)}>
                  Excluir
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── DIALOG DE EDIÇÃO ── */}
      <Dialog open={editingEvent !== null} onClose={handleCloseEdit} fullWidth maxWidth="sm" slotProps={{ paper: { className: 'manage-dialog-paper' } }}>
        {editingEvent && (
          <form onSubmit={handleUpdateEvent}>
            <DialogTitle className="manage-dialog-title">
              <span>Editar Sessão</span>
              <IconButton onClick={handleCloseEdit} disabled={isSaving}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent className="manage-dialog-content">
              <Stack className="manage-dialog-fields" spacing={2.2} sx={{ mt: 1 }}>
                <TextField label="Título do Evento" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  required/>

                <TextField label="Data e Hora" type="datetime-local" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  required slotProps={{ inputLabel: { shrink: true } }}/>

                <TextField label="Local da Sessão" value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  required/>

                <div className="manage-dialog-row">
                  <TextField label="Preço (R$)" type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                    required slotProps={{ htmlInput: { min: 0.01, step: 0.01 } }}/>
                  <TextField label="Capacidade" type="number" value={editForm.capacity}
                             onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })} required
                             slotProps={{ htmlInput: { min: 1, max: 10000, step: 1 } }}/>
                </div>

                <TextField label="Descrição / Sinopse" multiline rows={3} value={editForm.description}
                           onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}/>
              </Stack>

              {editError && (
                <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                  {editError}
                </Alert>
              )}
            </DialogContent>

            <DialogActions className="manage-dialog-actions">
              <Button onClick={handleCloseEdit} disabled={isSaving} className="btn-dialog-cancel">
                Cancelar
              </Button>
              <Button type="submit" variant="contained" disabled={isSaving} className="btn-dialog-save">
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </DialogActions>
          </form>
        )}
      </Dialog>

      {/* ── DIALOG DE CONFIRMAÇÃO DE EXCLUSÃO ── */}
      <Dialog open={deletingEvent !== null} onClose={() => !isDeleting && setDeletingEvent(null)} maxWidth="xs"
              slotProps={{ paper: { className: 'manage-dialog-paper' } }}>
        <DialogTitle className="manage-dialog-title">
          <span>Remover Sessão?</span>
        </DialogTitle>
        <DialogContent className="manage-dialog-content">
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
            Tem certeza de que deseja apagar o evento{' '}
            <strong style={{ color: '#fff' }}>"{deletingEvent?.title}"</strong>? Esta ação
            não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions className="manage-dialog-actions">
          <Button
            onClick={() => setDeletingEvent(null)}
            disabled={isDeleting}
            className="btn-dialog-cancel"
          >
            Voltar
          </Button>
          <Button onClick={handleDeleteEvent} disabled={isDeleting} sx={{ background: '#ef4444 !important', color: '#fff !important',
                                                                          textTransform: 'none', fontWeight: 600, borderRadius: '9px', padding: '6px 18px'}}>
            {isDeleting ? 'Excluindo...' : 'Sim, Excluir'}
          </Button>
        </DialogActions>
      </Dialog>
    </section>
  );
}