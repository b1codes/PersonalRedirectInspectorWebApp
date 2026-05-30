/**
 * @license
 * SPDX-License-Identifier: MIT
 */
import { useCopyToClipboard } from '../useCopyToClipboard';
import { Box, Paper, TextField, Button, Stack, Chip, Typography } from '@mui/material';
import HeaderBanner from './HeaderBanner';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import ContentPasteSearchIcon from '@mui/icons-material/ContentPasteSearch';
import SavedSearchIcon from '@mui/icons-material/SavedSearch';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';

interface AppHeaderProps {
  autoInspectedUri: string;
  historyLength: number;
  onClearHistory: () => void;
  manualUrlInput: string;
  onManualUrlInputChange: (value: string) => void;
  onInspectManualUrl: (url: string) => void;
  defaultCustomUrlInputValue: string;
  onDefaultCustomUrlInputChange: (value: string) => void;
  onSetDefaultCustomUrl: (url: string) => void;
  currentDefaultUrlSet: string;
}

function AppHeader({
  autoInspectedUri,
  historyLength,
  onClearHistory,
  manualUrlInput,
  onManualUrlInputChange,
  onInspectManualUrl,
  defaultCustomUrlInputValue,
  onDefaultCustomUrlInputChange,
  onSetDefaultCustomUrl,
  currentDefaultUrlSet
}: AppHeaderProps) {
  const [isUriCopied, copyUri] = useCopyToClipboard();

  const handleCopyUri = () => {
    if (autoInspectedUri) copyUri(autoInspectedUri);
  };

  const handleManualInspectClick = () => onInspectManualUrl(manualUrlInput);
  const handleSetDefaultUrlClick = () => onSetDefaultCustomUrl(defaultCustomUrlInputValue);

  return (
    <Box component="header">
      
      <Stack spacing={2}>
        <HeaderBanner />
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" component="h2" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <ManageSearchIcon /> Auto-Inspected URI
          </Typography>
          {autoInspectedUri ? (
            <>
              <Paper component="pre" variant="outlined" sx={{ p: 1.5, bgcolor: 'grey.100', overflowX: 'auto', whiteSpace: 'pre-wrap', wordWrap: 'break-word', my: 1 }}>
                {autoInspectedUri}
              </Paper>
              <Button
                size="small"
                variant="outlined"
                startIcon={<ContentCopyIcon />}
                onClick={handleCopyUri}
                aria-live="polite"
              >
                {isUriCopied ? 'Copied!' : 'Copy URI'}
              </Button>
              {isUriCopied && <span className="visually-hidden">URI copied to clipboard.</span>}
            </>
          ) : (
            <Typography color="text.secondary">No URI auto-inspected yet.</Typography>
          )}
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" component="h2" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <SavedSearchIcon /> Set Default Monitored URL
          </Typography>
          {currentDefaultUrlSet && (
            <Chip label={currentDefaultUrlSet} onDelete={() => onSetDefaultCustomUrl('')} sx={{ mb: 1.5 }} />
          )}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <TextField
              fullWidth
              size="small"
              type="url"
              label="Default URL to monitor"
              value={defaultCustomUrlInputValue}
              onChange={(e) => onDefaultCustomUrlInputChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSetDefaultUrlClick()}
              placeholder="e.g., https://my-default.ngrok.app"
            />
            <Button
              variant="contained"
              onClick={handleSetDefaultUrlClick}
              sx={{ flexShrink: 0 }}
            >
              Set Default
            </Button>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" component="h2" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <ContentPasteSearchIcon /> Manually Inspect URL
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <TextField
              fullWidth
              size="small"
              type="url"
              label="URL to inspect"
              value={manualUrlInput}
              onChange={(e) => onManualUrlInputChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualInspectClick()}
              placeholder="e.g., https://example.com/?param=value#hash"
            />
            <Button
              variant="contained"
              onClick={handleManualInspectClick}
              sx={{ flexShrink: 0 }}
            >
              Inspect URL
            </Button>
          </Stack>
        </Paper>
      </Stack>

      {historyLength > 0 && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="error"
            onClick={onClearHistory}
            startIcon={<DeleteIcon />}
            aria-label="Clear all redirect history"
          >
            Clear History ({historyLength})
          </Button>
        </Box>
      )}
    </Box>
  );
}

export default AppHeader;