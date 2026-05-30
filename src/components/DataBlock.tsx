import React, { useState } from 'react';
import { useCopyToClipboard } from '../useCopyToClipboard';
import { Box, Typography, Paper, Button, Chip, Collapse } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { tryDecodeBase64, formatDecodedContent } from '../utils/base64';

interface DataBlockProps {
  title: string;
  dataId: string;
  content: string | null | undefined;
  emptyContentMessage?: string;
  copyButtonLabel?: string;
  copiedButtonLabel?: string;
}

function DataBlock({
  title,
  dataId,
  content,
  emptyContentMessage = "No data available.",
  copyButtonLabel = "Copy",
  copiedButtonLabel = "Copied!"
}: DataBlockProps) {
  const [isCopied, copyContent] = useCopyToClipboard();
  const [showDecoded, setShowDecoded] = useState(false);
  const [isDecodedCopied, copyDecoded] = useCopyToClipboard();

  const handleCopy = () => {
    if (content) {
      copyContent(content);
    }
  };

  const decoded = tryDecodeBase64(content);
  const formattedDecoded = decoded ? formatDecodedContent(decoded) : '';
  const isJson = decoded && (formattedDecoded.startsWith('{') || formattedDecoded.startsWith('['));
  const isXml = decoded && formattedDecoded.startsWith('<');

  let typeLabel = 'Base64';
  if (isJson) typeLabel = 'Base64 (JSON)';
  else if (isXml) typeLabel = 'Base64 (XML)';

  return (
    <Box component="section" aria-labelledby={`${dataId}-heading`}>
      <Typography variant="h6" component="h4" id={`${dataId}-heading`} gutterBottom>
        {title}
      </Typography>
      {content ? (
        <>
          <Paper component="pre" variant="outlined" sx={{ p: 1.5, bgcolor: 'grey.100', overflowX: 'auto', whiteSpace: 'pre-wrap', wordWrap: 'break-word', my: 1 }}>
            {content}
          </Paper>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, flexWrap: 'wrap' }}>
            <Button
              size="small"
              variant="outlined"
              onClick={handleCopy}
              startIcon={<ContentCopyIcon />}
              aria-live="polite"
              aria-describedby={isCopied ? `${dataId}-copied-feedback` : undefined}
            >
              {isCopied ? copiedButtonLabel : copyButtonLabel}
            </Button>
            {isCopied && <span id={`${dataId}-copied-feedback`} className="visually-hidden">Content copied to clipboard.</span>}
            
            {decoded && (
              <>
                <Chip
                  icon={<AutoAwesomeIcon sx={{ fontSize: '14px !important', color: 'indigo' }} />}
                  label={`Base64 Encoded`}
                  size="small"
                  variant="outlined"
                  color="secondary"
                  sx={{
                    ml: 'auto',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    borderColor: 'secondary.main',
                    background: 'rgba(156, 39, 176, 0.04)',
                  }}
                />
                <Button
                  size="small"
                  variant={showDecoded ? 'contained' : 'outlined'}
                  color="secondary"
                  onClick={() => setShowDecoded(!showDecoded)}
                  startIcon={showDecoded ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  sx={{ textTransform: 'none' }}
                >
                  {showDecoded ? 'Hide Decoded' : 'Decode Base64'}
                </Button>
              </>
            )}
          </Box>

          {decoded && (
            <Collapse in={showDecoded}>
              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  mt: 1.5,
                  bgcolor: 'secondary.light',
                  backgroundImage: 'linear-gradient(135deg, rgba(156, 39, 176, 0.03) 0%, rgba(156, 39, 176, 0.08) 100%)',
                  borderLeft: '4px solid',
                  borderColor: 'secondary.main',
                  borderRadius: '4px',
                }}
              >
                <Typography
                  variant="caption"
                  component="div"
                  sx={{ fontWeight: 'bold', color: 'secondary.dark', mb: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}
                >
                  Decoded Payload ({typeLabel}):
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    fontFamily: 'monospace',
                    m: 0,
                    p: 0,
                    fontSize: '0.875rem',
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    color: 'grey.900',
                  }}
                >
                  {formattedDecoded}
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    color="secondary"
                    onClick={() => copyDecoded(formattedDecoded)}
                    startIcon={<ContentCopyIcon />}
                    sx={{ textTransform: 'none', py: 0.2, fontSize: '0.75rem' }}
                  >
                    {isDecodedCopied ? 'Copied!' : 'Copy Decoded'}
                  </Button>
                </Box>
              </Paper>
            </Collapse>
          )}
        </>
      ) : (
        <Typography color="text.secondary">{emptyContentMessage}</Typography>
      )}
    </Box>
  );
}

export default DataBlock;