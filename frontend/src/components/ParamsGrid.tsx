import React, { useState } from 'react';
import type { KeyValue } from '../types';
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Typography,
  Box,
  Chip,
  Button,
  Collapse,
  Tooltip,
} from '@mui/material';
import { tryDecodeBase64, formatDecodedContent } from '../utils/base64';
import { useCopyToClipboard } from '../useCopyToClipboard';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

interface ParamsGridProps {
  params: KeyValue[];
}

interface ParamValueCellProps {
  value: string;
}

function ParamValueCell({ value }: ParamValueCellProps) {
  const [showDecoded, setShowDecoded] = useState(false);
  const [isCopied, copyContent] = useCopyToClipboard();

  const decoded = tryDecodeBase64(value);
  if (!decoded) {
    return (
      <Box
        component="pre"
        sx={{
          fontFamily: 'monospace',
          m: 0,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}
      >
        {value}
      </Box>
    );
  }

  const formattedDecoded = formatDecodedContent(decoded);
  const isJson = formattedDecoded.startsWith('{') || formattedDecoded.startsWith('[');
  const isXml = formattedDecoded.startsWith('<');

  let typeLabel = 'Base64';
  if (isJson) typeLabel = 'Base64 (JSON)';
  else if (isXml) typeLabel = 'Base64 (XML)';

  const handleCopyDecoded = () => {
    copyContent(formattedDecoded);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {/* Original/Raw value block with Base64 badge */}
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, width: '100%' }}>
        <Box
          component="pre"
          sx={{
            fontFamily: 'monospace',
            m: 0,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            flexGrow: 1,
            maxHeight: showDecoded ? '60px' : 'none',
            overflow: 'auto',
            transition: 'max-height 0.3s ease',
          }}
        >
          {value}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0, ml: 'auto' }}>
          <Tooltip title={`Detected ${typeLabel} encoded content`}>
            <Chip
              icon={<AutoAwesomeIcon sx={{ fontSize: '14px !important', color: 'indigo' }} />}
              label={typeLabel}
              size="small"
              variant="outlined"
              color="secondary"
              sx={{
                fontSize: '0.75rem',
                fontWeight: 600,
                borderColor: 'secondary.main',
                background: 'rgba(156, 39, 176, 0.04)',
              }}
            />
          </Tooltip>
          <Button
            size="small"
            variant={showDecoded ? 'contained' : 'outlined'}
            color="secondary"
            onClick={() => setShowDecoded(!showDecoded)}
            startIcon={showDecoded ? <VisibilityOffIcon /> : <VisibilityIcon />}
            sx={{ py: 0.25, px: 1, minHeight: 0, textTransform: 'none' }}
          >
            {showDecoded ? 'Hide' : 'Decode'}
          </Button>
        </Box>
      </Box>

      {/* Decoded content collapse */}
      <Collapse in={showDecoded}>
        <Paper
          variant="outlined"
          sx={{
            p: 1.5,
            my: 0.5,
            bgcolor: 'secondary.light',
            backgroundImage: 'linear-gradient(135deg, rgba(156, 39, 176, 0.03) 0%, rgba(156, 39, 176, 0.08) 100%)',
            borderLeft: '4px solid',
            borderColor: 'secondary.main',
            borderRadius: '4px',
            position: 'relative',
          }}
        >
          <Typography
            variant="caption"
            component="div"
            sx={{ fontWeight: 'bold', color: 'secondary.dark', mb: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            Decoded Payload:
          </Typography>
          <Box
            component="pre"
            sx={{
              fontFamily: 'monospace',
              m: 0,
              p: 0,
              fontSize: '0.825rem',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
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
              onClick={handleCopyDecoded}
              startIcon={<ContentCopyIcon />}
              sx={{ textTransform: 'none', py: 0.2, fontSize: '0.75rem' }}
            >
              {isCopied ? 'Copied!' : 'Copy Decoded'}
            </Button>
          </Box>
        </Paper>
      </Collapse>
    </Box>
  );
}

function ParamsGrid({ params }: ParamsGridProps) {
  if (params.length === 0) {
    return <Typography color="text.secondary">No query parameters found for this entry.</Typography>;
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small" aria-label="Query Parameters">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold' }}>Key</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Value</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {params.map((param, index) => (
            <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
              <TableCell component="th" scope="row" sx={{ verticalAlign: 'top', pt: 1.5 }}>
                <Box
                  component="pre"
                  sx={{
                    fontFamily: 'monospace',
                    m: 0,
                    p: '2px 6px',
                    bgcolor: 'grey.200',
                    borderRadius: 1,
                    display: 'inline-block',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                  }}
                >
                  {param.key}
                </Box>
              </TableCell>
              <TableCell sx={{ verticalAlign: 'top', pt: 1.5 }}>
                <ParamValueCell value={param.value} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default ParamsGrid;

