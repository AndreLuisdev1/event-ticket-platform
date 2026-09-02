import { createTheme } from '@mui/material/styles';

export const authTheme = createTheme({
  palette: {
    mode: 'dark',

    primary: {
      main: '#8154ad',
    },

    secondary: {
      main: '#f472b6',
    },

    background: {
      default: '#07030d',
      paper: '#1b1430',
    },

    text: {
      primary: '#faf5ff',
      secondary: '#c4b5d4',
    },
  },

  typography: {
    fontFamily: 'Outfit, sans-serif',

    button: {
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
    },
  },

  components: {
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        fullWidth: true,
      },
    },

    MuiOutlinedInput: {
    styleOverrides: {
        root: {
        borderRadius: 12,

        backgroundColor: 'rgba(255, 255, 255, 0.055)',

        '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.18)',
        },

        '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(216, 180, 254, 0.7)',
        },

        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#f0abfc',
            borderWidth: 2,
        },

        /* ============================================================
            AUTOFILL - Chrome / Edge
            ============================================================ */

        '& input:-webkit-autofill': {
            WebkitBoxShadow:
            '0 0 0 1000px rgba(255, 255, 255, 0.055) inset',

            WebkitTextFillColor: '#faf5ff',

            caretColor: '#faf5ff',

            borderRadius: 'inherit',

            transition:
            'background-color 9999s ease-out 0s',
        },

        '& input:-webkit-autofill:hover': {
            WebkitBoxShadow:
            '0 0 0 1000px rgba(255, 255, 255, 0.075) inset',

            WebkitTextFillColor: '#faf5ff',
        },

        '& input:-webkit-autofill:focus': {
            WebkitBoxShadow:
            '0 0 0 1000px rgba(255, 255, 255, 0.075) inset',

            WebkitTextFillColor: '#faf5ff',

            caretColor: '#faf5ff',
        },

        '& input:-webkit-autofill:active': {
            WebkitBoxShadow:
            '0 0 0 1000px rgba(255, 255, 255, 0.075) inset',

            WebkitTextFillColor: '#faf5ff',
        },
        },
    },
    },

    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: '#c4b5d4',

          '&.Mui-focused': {
            color: '#f0abfc',
          },
        },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,

          minHeight: 52,

          boxShadow: 'none',
        }
      },
    },
  },
});