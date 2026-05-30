/**
 * @license
 * SPDX-License-Identifier: MIT
 */
import React, { useState, useEffect } from 'react';
import { 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Stack, 
  MenuItem, 
  Select, 
  FormControl, 
  InputLabel, 
  InputAdornment, 
  IconButton,
  Collapse,
  Alert
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import KeyIcon from '@mui/icons-material/Key';
import SaveIcon from '@mui/icons-material/Save';

export const GEMINI_API_KEY_STORAGE = 'gemini_api_key';
export const GEMINI_MODEL_STORAGE = 'gemini_model';
export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

export default function AiAssistantSettings() {
  const [apiKey, setApiKey] = useState<string>('');
  const [model, setModel] = useState<string>(DEFAULT_GEMINI_MODEL);
  const [showKey, setShowKey] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [showConfig, setShowConfig] = useState<boolean>(false);

  useEffect(() => {
    const savedKey = localStorage.getItem(GEMINI_API_KEY_STORAGE) || '';
    const savedModel = localStorage.getItem(GEMINI_MODEL_STORAGE) || DEFAULT_GEMINI_MODEL;
    setApiKey(savedKey);
    setModel(savedModel);
    // If no key is set, show configuration by default to welcome users
    if (!savedKey) {
      setShowConfig(true);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem(GEMINI_API_KEY_STORAGE, apiKey.trim());
    localStorage.setItem(GEMINI_MODEL_STORAGE, model);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
    // Trigger storage event so other components receive the update
    window.dispatchEvent(new Event('storage'));
  };

  const handleClear = () => {
    localStorage.removeItem(GEMINI_API_KEY_STORAGE);
    localStorage.removeItem(GEMINI_MODEL_STORAGE);
    setApiKey('');
    setModel(DEFAULT_GEMINI_MODEL);
    setIsSaved(false);
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <Paper 
      variant="outlined" 
      sx={{ 
        p: 2, 
        background: 'linear-gradient(135deg, rgba(230, 242, 255, 0.4) 0%, rgba(245, 235, 255, 0.4) 100%)',
        border: '1px solid',
        borderColor: 'primary.light',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
        <Typography 
          variant="h6" 
          component="h2" 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            fontWeight: 'bold',
            background: 'linear-gradient(90deg, #007BFF 0%, #8A2BE2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          <AutoAwesomeIcon sx={{ color: '#8A2BE2' }} /> Gemini Redirect Analyzer
        </Typography>
        <Button 
          size="small" 
          onClick={() => setShowConfig(!showConfig)}
          variant="text"
          sx={{ fontWeight: 'bold' }}
        >
          {showConfig ? 'Hide Settings' : 'Configure AI'}
        </Button>
      </Stack>

      <Collapse in={showConfig}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Enhance your redirect inspection with smart AI analysis! Provide your Gemini API key to identify protocols, explain parameters, and detect security vulnerabilities. Keys are stored strictly in your browser.
        </Typography>

        <Stack spacing={2}>
          <TextField
            fullWidth
            size="small"
            type={showKey ? 'text' : 'password'}
            label="Gemini API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIzaSy..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <KeyIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setShowKey(!showKey)}
                    edge="end"
                    aria-label={showKey ? 'Hide key' : 'Show key'}
                  >
                    {showKey ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <FormControl fullWidth size="small">
              <InputLabel id="gemini-model-label">Gemini Model</InputLabel>
              <Select
                labelId="gemini-model-label"
                label="Gemini Model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              >
                <MenuItem value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended)</MenuItem>
                <MenuItem value="gemini-2.5-pro">Gemini 2.5 Pro</MenuItem>
                <MenuItem value="gemini-1.5-flash">Gemini 1.5 Flash</MenuItem>
              </Select>
            </FormControl>

            <Stack direction="row" spacing={1} sx={{ width: { xs: '100%', sm: 'auto' }, justifyContent: 'flex-end' }}>
              {apiKey && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleClear}
                  size="medium"
                >
                  Clear
                </Button>
              )}
              <Button
                variant="contained"
                onClick={handleSave}
                startIcon={<SaveIcon />}
                disabled={!apiKey.trim()}
                sx={{ 
                  flexShrink: 0,
                  background: 'linear-gradient(90deg, #007BFF 0%, #8A2BE2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(90deg, #0056b3 0%, #6a1b9a 100%)'
                  }
                }}
              >
                Save Config
              </Button>
            </Stack>
          </Stack>

          {isSaved && (
            <Alert severity="success" sx={{ py: 0.5, px: 2 }}>
              Gemini configuration saved successfully!
            </Alert>
          )}
        </Stack>
      </Collapse>

      {!showConfig && (
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            Status:
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: 'bold', 
              color: apiKey ? 'success.main' : 'warning.main' 
            }}
          >
            {apiKey ? 'API Key Active (Ready)' : 'API Key Required'}
          </Typography>
        </Stack>
      )}
    </Paper>
  );
}
