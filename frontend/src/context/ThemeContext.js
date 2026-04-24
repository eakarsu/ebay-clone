import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';

const ThemeModeContext = createContext({ mode: 'light', toggleMode: () => {} });

const STORAGE_KEY = 'ebay_theme_mode';

export const ThemeModeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'light';
    } catch (_) {
      return 'light';
    }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, mode); } catch (_) {}
  }, [mode]);

  const toggleMode = () => setMode((m) => (m === 'light' ? 'dark' : 'light'));

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: '#3665f3',
            light: '#6b8ff7',
            dark: '#2a4dc4',
          },
          secondary: { main: '#e53238' },
          success: { main: '#86b817' },
          warning: { main: '#f5af02' },
          ...(mode === 'light'
            ? {
                background: { default: '#ffffff', paper: '#ffffff' },
              }
            : {
                background: { default: '#0f1216', paper: '#1a1f26' },
              }),
        },
        typography: {
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
          h1: { fontWeight: 700 },
          h2: { fontWeight: 700 },
          h3: { fontWeight: 600 },
          h4: { fontWeight: 600 },
          h5: { fontWeight: 600 },
          h6: { fontWeight: 600 },
        },
        shape: { borderRadius: 8 },
        components: {
          MuiButton: {
            styleOverrides: {
              root: { textTransform: 'none', fontWeight: 600 },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                boxShadow:
                  mode === 'light'
                    ? '0 1px 3px rgba(0,0,0,0.12)'
                    : '0 1px 3px rgba(0,0,0,0.6)',
                '&:hover': {
                  boxShadow:
                    mode === 'light'
                      ? '0 4px 12px rgba(0,0,0,0.15)'
                      : '0 4px 12px rgba(0,0,0,0.7)',
                },
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                boxShadow:
                  mode === 'light'
                    ? '0 1px 3px rgba(0,0,0,0.08)'
                    : '0 1px 3px rgba(0,0,0,0.5)',
              },
            },
          },
        },
      }),
    [mode]
  );

  return (
    <ThemeModeContext.Provider value={{ mode, toggleMode }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeModeContext.Provider>
  );
};

export const useThemeMode = () => useContext(ThemeModeContext);
