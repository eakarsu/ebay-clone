import React from 'react';
import { Select, MenuItem, FormControl } from '@mui/material';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'de', label: 'Deutsch' },
  { code: 'tr', label: 'Türkçe' },
];

const LanguageSwitcher = ({ size = 'small' }) => {
  const { i18n } = useTranslation();
  return (
    <FormControl size={size} sx={{ minWidth: 100 }}>
      <Select
        value={i18n.language?.slice(0, 2) || 'en'}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        variant="outlined"
      >
        {LANGUAGES.map(l => (
          <MenuItem key={l.code} value={l.code}>{l.label}</MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default LanguageSwitcher;
