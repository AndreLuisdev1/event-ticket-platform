import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import MuiLink from '@mui/material/Link';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { ThemeProvider } from '@mui/material/styles';
import { useAuth, type UserRole } from '../../contexts/AuthContext';
import { authTheme } from './authTheme';
import './auth.css';

const HERO_SLIDES = [
  { url: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=1200&auto=format&fit=crop' },
  { url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1200&auto=format&fit=crop' },
  { url: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=1200&auto=format&fit=crop' },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [activeSlide, setActiveSlide] = useState(0);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmation: '', role: 'CLIENT' as UserRole });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (form.password !== form.confirmation) {
      setError('As senhas precisam ser iguais.');
      return;
    }

    setIsLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password, role: form.role });
      navigate('/login', { replace: true });
    } catch (requestError) {
      setError(
        requestError instanceof TypeError ? 'Não foi possível conectar ao servidor.' : requestError instanceof Error ? requestError.message : 'Não foi possível criar sua conta.'
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
              <h1>Seu próximo<br /><em>grande momento.</em></h1>
              <p>Faça parte da curadoria de experiências cinematográficas.</p>

              <div className="hero-indicators">
                {HERO_SLIDES.map((_, index) => (
                  <span key={index} className={`hero-indicator-dot ${index === activeSlide ? 'active' : ''}`} />
                ))}
              </div>
            </div>
          </section>

          <section className="auth-form-panel">
            <div className="auth-form-content">
              <p className="auth-kicker">Comece agora</p>
              <h2>Crie sua<br /><em>conta.</em></h2>
              <p className="auth-subtitle">Escolha seu perfil e descubra o que vem por aí.</p>

              <Stack component="form" className="auth-form" onSubmit={handleSubmit}>
                <TextField label="Nome completo" value={form.name} onChange={(event) => updateField('name', event.target.value)} 
						   required autoComplete="name" />
                <TextField label="E-mail" type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} 
						   required autoComplete="email" />
                
                <FormControl fullWidth>
                  <InputLabel id="role-label" className="auth-role-label">Tipo de conta</InputLabel>
                  <Select labelId="role-label" value={form.role} label="Tipo de conta" onChange={(event) => updateField('role', event.target.value)}>
                    <MenuItem value="CLIENT">Cliente</MenuItem>
                    <MenuItem value="ORGANIZER">Organizador</MenuItem>
                  </Select>
                </FormControl>

                <div className="auth-register-fields">
                  <TextField label="Senha" type="password" value={form.password} onChange={(event) => updateField('password', event.target.value)} 
				  			 required autoComplete="new-password" slotProps={{ htmlInput: { minLength: 6 } }} />
                  <TextField label="Confirmar senha" type="password" value={form.confirmation} 
				  			 onChange={(event) => updateField('confirmation', event.target.value)} required autoComplete="new-password" 
							 slotProps={{ htmlInput: { minLength: 6 } }} />
                </div>

                {error && <Alert className="auth-error" severity="error">{error}</Alert>}
                <Button variant="contained" color="primary" type="submit" disabled={isLoading}>
                  {isLoading ? 'Criando...' : 'Criar conta'} <span aria-hidden="true">-&gt;</span>
                </Button>
              </Stack>

              <p className="auth-footer">
                Já tem uma conta? <MuiLink component={Link} to="/login">Entrar</MuiLink>
              </p>
            </div>
          </section>
        </div>
      </main>
    </ThemeProvider>
  );
}