import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import MuiLink from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { ThemeProvider } from '@mui/material/styles';
import { useAuth } from '../../contexts/AuthContext';
import { authTheme } from './authTheme';
import './auth.css';

const HERO_SLIDES = [
  { url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1200&auto=format&fit=crop' },
  { url: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=1200&auto=format&fit=crop' },
  { url: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=1200&auto=format&fit=crop' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeSlide, setActiveSlide] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const destination = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/catalog';

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      navigate(destination, { replace: true });
    } catch (requestError) {
      setError(
        requestError instanceof TypeError ? 'Não foi possível conectar ao servidor.' : requestError instanceof Error ? requestError.message : 'Não foi possível entrar.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ThemeProvider theme={authTheme}>
      <main className="auth-page">
        <div className="auth-layout">
          <section className="auth-hero">
            <div className="hero-slides-wrapper" aria-hidden="true">
              {HERO_SLIDES.map((slide, index) => (
                <img key={slide.url} src={slide.url} className={`hero-slide-img ${index === activeSlide ? 'active' : ''}`} />
              ))}
              <div className="hero-backdrop-overlay" />
            </div>

            <div className="auth-brand">
              cine<span>.</span>pass
            </div>

            <div className="auth-hero-copy">
              <h1>Viva o cinema,<br /><em>evento a evento.</em></h1>
              <p>Descubra experiências únicas e acompanhe tudo que está por vir.</p>

              <div className="hero-indicators">
                {HERO_SLIDES.map((_, index) => (
                  <span key={index} className={`hero-indicator-dot ${index === activeSlide ? 'active' : ''}`} />
                ))}
              </div>
            </div>
          </section>

          <section className="auth-form-panel">
            <div className="auth-form-content">
              <p className="auth-kicker">Acesso ao sistema</p>
              <h2>Boas-vindas<br /><em>de volta.</em></h2>
              <p className="auth-subtitle">Entre com suas credenciais para acessar o catálogo.</p>

              <Stack component="form" className="auth-form" onSubmit={handleSubmit}>
                <TextField label="E-mail" type="email" value={email} onChange={(event) => { setEmail(event.target.value); setError(''); }} 
						   placeholder="seu@email.com" required autoComplete="email" />
                <TextField label="Senha" type={showPassword ? 'text' : 'password'} value={password}
						   onChange={(event) => { setPassword(event.target.value); setError(''); }} placeholder="••••••••" 
						   required autoComplete="current-password" 
						   slotProps={{ htmlInput: { minLength: 6 }, input: { endAdornment: (<InputAdornment position="end"><IconButton 
						   aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setShowPassword((current) => !current)} 
						   edge="end">{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>) } }} />
                {error && <Alert className="auth-error" severity="error">{error}</Alert>}
                <Button variant="contained" color="primary" type="submit" disabled={isLoading}>
                  {isLoading ? 'Entrando...' : 'Entrar'} <span aria-hidden="true"></span>
                </Button>
              </Stack>

              <p className="auth-footer">
                Ainda não tem uma conta? <MuiLink component={Link} to="/register">Criar conta</MuiLink>
              </p>
            </div>
          </section>
        </div>
      </main>
    </ThemeProvider>
  );
}