import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import EventIcon from '@mui/icons-material/Event';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import LogoutIcon from '@mui/icons-material/Logout';
import AddIcon from '@mui/icons-material/Add';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import { useAuth } from '../contexts/authContext';
import './layout.css';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigation = user?.role === 'ORGANIZER'? 
    [
        { label: 'Catálogo de Filmes', path: '/catalog', icon: <EventIcon /> },
        { label: 'Gerenciar Eventos', path: '/manage-events', icon: <AddIcon /> },
        { label: 'Validar Ingressos', path: '/validate-tickets', icon: <QrCodeScannerIcon /> },
    ]
    : 
    [
        { label: 'Catálogo', path: '/catalog', icon: <EventIcon /> },
        { label: 'Meus Ingressos', path: '/tickets', icon: <ConfirmationNumberIcon /> },
    ];

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  const drawer = (
    <Box className="app-sidebar-content">
      <Box className="app-logo">CINE<span>.</span>PASS</Box>
      <Divider />
      <List className="app-navigation">
        {navigation.map((item) => (
          <ListItemButton className="app-navigation-item" key={item.path} selected={location.pathname === item.path} 
                          onClick={() => { navigate(item.path); setMobileOpen(false); }}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
      <Box className="app-user-area">
        <Divider />
        <Box className="app-user">
          <Avatar>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</Avatar>
          <Box className="app-user-info">
            <Typography noWrap>{user?.name || 'Usuário'}</Typography>
            <Typography>{user?.role === 'ORGANIZER' ? 'Organizador' : 'Cliente'}</Typography>
          </Box>
        </Box>
        <ListItemButton className="app-logout" onClick={handleLogout}>
          <ListItemIcon><LogoutIcon /></ListItemIcon>
            <ListItemText primary="Sair" />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box className="app-layout">
      <Box component="nav" className="app-nav">
        <Drawer className="app-drawer app-drawer-mobile" variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} 
                ModalProps={{ keepMounted: true }}>{drawer}</Drawer>
        <Drawer className="app-drawer app-drawer-desktop" variant="permanent" open>{drawer}</Drawer>
      </Box>
      <Box component="main" className="app-main"><Outlet /></Box>
    </Box>
  );
}