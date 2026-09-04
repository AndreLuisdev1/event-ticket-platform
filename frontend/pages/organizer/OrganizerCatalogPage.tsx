import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import SearchIcon from '@mui/icons-material/Search';
import StarIcon from '@mui/icons-material/Star';
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
import InputAdornment from '@mui/material/InputAdornment';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { getAccessToken, useAuth } from '../../contexts/AuthContext';
import './organizerCatalog.css';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

type Movie = {
  tmdb_id: number;
  title: string;
  overview: string | null;
  release_date: string | null;
  vote_average: number | null;
  poster_url: string | null;
};

type NowPlayingResponse = { results: Movie[]; page: number; total_pages: number };

export default function OrganizerCatalogPage() {
  const { user } = useAuth();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [eventForm, setEventForm] = useState({ date: '', location: '', price: '', capacity: '' });
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [eventError, setEventError] = useState('');
  const [eventSuccess, setEventSuccess] = useState('');
  const featuredMovies = movies.slice(0, 5);
  const currentHero = featuredMovies[featuredIndex] ?? null;

  useEffect(() => { void loadNowPlaying(1); }, []);

  useEffect(() => {
    if (isSearching || featuredMovies.length === 0) return;
    const interval = setInterval(() => {
      setFeaturedIndex((prev) => (prev + 1) % featuredMovies.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isSearching, featuredMovies.length]);

  async function request<T>(path: string): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${getAccessToken()}` } });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.detail ?? 'Não foi possível carregar o catálogo.');
    }
    return await response.json() as T;
  }

  async function loadNowPlaying(nextPage: number) {
    setIsLoading(true); setError(''); setIsSearching(false);
    try {
      const data = await request<NowPlayingResponse>(`/tmdb/now-playing?page=${nextPage}`);
      setMovies(data.results); setPage(data.page); setTotalPages(Math.min(data.total_pages, 500));
      setFeaturedIndex(0);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Não foi possível carregar o catálogo.'); }
    finally { setIsLoading(false); }
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const searchQuery = query.trim();
    if (!searchQuery) { await loadNowPlaying(1); return; }
    setIsLoading(true); setError(''); setIsSearching(true);
    try {
      setMovies(await request<Movie[]>(`/tmdb/search?query=${encodeURIComponent(searchQuery)}`));
      setTotalPages(1);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Não foi possível buscar filmes.'); }
    finally { setIsLoading(false); }
  }

  function getMinDateTime(): string {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  }

  function openEventDialog(movie: Movie) {
    setSelectedMovie(movie);
    setEventForm({ date: '', location: '', price: '', capacity: '' });
    setEventError('');
    setEventSuccess('');
  }

  function closeEventDialog() {
    if (!isCreatingEvent) setSelectedMovie(null);
  }

  function updateEventField(field: keyof typeof eventForm, value: string) {
    setEventForm((current) => ({ ...current, [field]: value }));
  }

  async function handleCreateEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedMovie) return;
    setIsCreatingEvent(true);
    setEventError('');
    setEventSuccess('');
    try {
      const response = await fetch(`${API_URL}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAccessToken()}` },
        body: JSON.stringify({
          title: selectedMovie.title,
          description: selectedMovie.overview,
          date: eventForm.date,
          location: eventForm.location,
          price: Number(eventForm.price),
          capacity: Number(eventForm.capacity),
          tmdb_id: selectedMovie.tmdb_id,
          poster_url: selectedMovie.poster_url,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.detail ?? 'Não foi possível criar o evento.');
      }
      setEventSuccess('Evento criado com sucesso.');
      setEventForm({ date: '', location: '', price: '', capacity: '' });
    } catch (requestError) {
      setEventError(requestError instanceof Error ? requestError.message : 'Não foi possível criar o evento.');
    } finally {
      setIsCreatingEvent(false);
    }
  }

  if (user?.role !== 'ORGANIZER') return <Navigate to="/" replace />;

  return (
    <section className="organizer-catalog">
      {/* ── HERO BANNER EM DESTAQUE ── */}
      {!isSearching && currentHero && (
        <div className="catalog-hero">
          <div className="catalog-hero-bg">
            <img src={currentHero.poster_url ?? '/placeholder-poster.svg'} alt={currentHero.title} className="catalog-hero-img" />
            <div className="catalog-hero-overlay" />
          </div>

          <div className="catalog-hero-rating">
            <StarIcon className="rating-star" />
            <span>{currentHero.vote_average ? currentHero.vote_average.toFixed(1) : 'N/A'}</span>
            <small>/ 10</small>
          </div>

          <div className="catalog-hero-content">
            <div className="catalog-hero-tags">
              <span className="badge-highlight">EM DESTAQUE</span>
              <span className="badge-sub">{currentHero.release_date?.slice(0, 4) ?? 'ESTREIA'}</span>
            </div>

            <Typography component="h1" className="catalog-hero-title">{currentHero.title}</Typography>
            <p className="catalog-hero-overview">{currentHero.overview || 'Sinopse não informada para este filme no TMDB.'}</p>

            <div className="catalog-hero-actions">
                    <Button variant="contained" className="hero-btn-primary" startIcon={<AddIcon />} onClick={() => openEventDialog(currentHero)}>
                Criar Evento
              </Button>
            </div>

            <div className="catalog-hero-dots">
              {featuredMovies.map((item, idx) => (
                <button key={item.tmdb_id} type="button" aria-label={`Slide ${idx + 1}`} className={`hero-dot ${idx === featuredIndex ? 'active' : ''}`} 
                        onClick={() => setFeaturedIndex(idx)} />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="catalog-subhead">
        <div>
          <h2 className="catalog-grid-title">{isSearching ? 'Resultados da Busca' : 'Catálogo em Cartaz'}</h2>
          <span className="catalog-count">{movies.length} TÍTULOS DISPONÍVEIS</span>
        </div>

        <Stack component="form" className="catalog-search-form" direction="row" onSubmit={handleSearch}>
          <TextField value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar filme..." size="small" 
                     slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> } }} />
          <Button type="submit" variant="contained" className="catalog-search-btn">Buscar</Button>
        </Stack>
      </div>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {isLoading ? (
        <div className="catalog-loading"><CircularProgress /></div>
      ) : (
        <>
          <div className="movie-grid">
            {movies.map((movie) => (
              <Card className="movie-card" key={movie.tmdb_id}>
                <div className="movie-poster-wrap">
                  <CardMedia component="img" image={movie.poster_url ?? '/placeholder-poster.svg'} alt={`Pôster de ${movie.title}`} />
                  <div className="movie-card-overlay" />
                  <span className="movie-rating-badge">
                    <StarIcon className="movie-card-star" />
                    {movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}
                  </span>
                </div>

                <CardContent className="movie-card-body">
                  <span className="movie-year-tag">{movie.release_date?.slice(0, 4) ?? 'Ano não inf.'}</span>
                  <Typography className="movie-title" title={movie.title}>{movie.title}</Typography>
                  <Typography className="movie-overview">{movie.overview || 'Sinopse não informada pelo TMDB.'}</Typography>
                    <Button className="movie-action-btn" startIcon={<AddIcon />} variant="outlined" onClick={() => openEventDialog(movie)}>
                    Criar evento
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {!isSearching && totalPages > 1 && (
            <Pagination className="catalog-pagination" count={totalPages} page={page} onChange={(_, value) => void loadNowPlaying(value)} 
                        color="primary" />
          )}
        </>
      )}

      {/* ── DIALOG PERSONALIZADO DE CRIAR EVENTO ── */}
      <Dialog open={selectedMovie !== null} onClose={closeEventDialog} fullWidth maxWidth="sm" slotProps={{ paper: { className: 'event-dialog-paper' } }}>
        {selectedMovie && (
          <form onSubmit={handleCreateEvent}>
            <DialogTitle className="event-dialog-title">
              <div>
                <span className="event-dialog-kicker">Novo Evento</span>
                <h2>Configurar Sessão</h2>
              </div>
              <IconButton aria-label="Fechar" className="event-dialog-close" onClick={closeEventDialog} disabled={isCreatingEvent}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent className="event-dialog-content">
              {/* Miniatura do filme selecionado */}
              <div className="dialog-movie-preview">
                <img src={selectedMovie.poster_url ?? '/placeholder-poster.svg'} alt={selectedMovie.title} className="dialog-movie-thumb" />
                <div className="dialog-movie-details">
                  <Typography className="dialog-movie-name">{selectedMovie.title}</Typography>
                  <div className="dialog-movie-meta">
                    <span className="dialog-movie-year">{selectedMovie.release_date?.slice(0, 4) ?? 'N/A'}</span>
                    <span className="dialog-movie-rating">★ {selectedMovie.vote_average ? selectedMovie.vote_average.toFixed(1) : 'N/A'}</span>
                  </div>
                  <p className="dialog-movie-synopsis">{selectedMovie.overview || 'Sinopse não informada pelo TMDB.'}</p>
                </div>
              </div>

              {/* Campos do formulário */}
              <Stack className="event-dialog-fields" spacing={2.2}>
                <TextField label="Data e hora da sessão" type="datetime-local" value={eventForm.date} onChange={(e) => updateEventField('date', e.target.value)} required slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: getMinDateTime() }, input: { startAdornment: <InputAdornment position="start"><CalendarMonthIcon /></InputAdornment> } }} />
                
                <TextField label="Local do evento" value={eventForm.location} onChange={(e) => updateEventField('location', e.target.value)} 
                           placeholder="Ex.: Cine Roxy - Sala IMAX" 
                           required slotProps={{ input: { startAdornment: <InputAdornment position="start"><LocationOnIcon /></InputAdornment> } }} />

                <div className="event-dialog-row">
                  <TextField label="Preço do ingresso (R$)" type="number" value={eventForm.price} onChange={(e) => 
                             updateEventField('price', e.target.value)} placeholder="0.00" required slotProps={{ htmlInput: { min: 0.01, step: 0.01 }, input: { startAdornment: <InputAdornment position="start"><ConfirmationNumberIcon /></InputAdornment> } }} />
                  <TextField label="Capacidade (máx. 100)" type="number" value={eventForm.capacity} onChange={(e) => 
                             updateEventField('capacity', e.target.value)} placeholder="1 a 100" 
                             required slotProps={{ htmlInput: { min: 1, max: 100, step: 1 }, 
                             input: { startAdornment: <InputAdornment position="start"><PeopleAltIcon /></InputAdornment> } }} />
                </div>
              </Stack>

              {eventError && <Alert className="event-dialog-alert" severity="error">{eventError}</Alert>}
              {eventSuccess && <Alert className="event-dialog-alert" severity="success">{eventSuccess}</Alert>}
            </DialogContent>

            <DialogActions className="event-dialog-actions">
              <Button onClick={closeEventDialog} disabled={isCreatingEvent} className="dialog-btn-cancel">
                Cancelar
              </Button>
              <Button type="submit" variant="contained" disabled={isCreatingEvent} className="dialog-btn-submit">
                {isCreatingEvent ? 'Criando Sessão...' : 'Criar Evento'}
              </Button>
            </DialogActions>
          </form>
        )}
      </Dialog>
    </section>
  );
}