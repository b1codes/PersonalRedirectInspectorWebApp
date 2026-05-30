/**
 * @license
 * SPDX-License-Identifier: MIT
 */
import React from 'react';
import { 
  Box, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Button, 
  Stack, 
  Chip,
  Divider
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useCopyToClipboard } from '../useCopyToClipboard';

interface AiAnalysisResultProps {
  analysisText: string;
  modelUsed: string;
  onReanalyze?: () => void;
}

export default function AiAnalysisResult({ analysisText, modelUsed, onReanalyze }: AiAnalysisResultProps) {
  const [copied, copy] = useCopyToClipboard();

  const handleCopy = () => {
    copy(analysisText);
  };

  return (
    <Paper 
      variant="outlined" 
      sx={{ 
        p: 2.5, 
        mt: 2, 
        bgcolor: 'grey.50', 
        borderLeft: '4px solid', 
        borderLeftColor: 'purple.main',
        borderColor: 'grey.300',
        borderRadius: 2
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <AutoAwesomeIcon sx={{ color: '#8A2BE2' }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'grey.800' }}>
            Gemini Deep Analysis
          </Typography>
          <Chip 
            label={modelUsed} 
            size="small" 
            sx={{ 
              fontSize: '0.75rem', 
              bgcolor: 'rgba(138, 43, 226, 0.1)', 
              color: '#8A2BE2', 
              fontWeight: 500 
            }} 
          />
        </Stack>
        <Stack direction="row" spacing={1}>
          {onReanalyze && (
            <Button size="small" variant="text" onClick={onReanalyze}>
              Re-Analyze
            </Button>
          )}
          <Button 
            size="small" 
            variant="outlined" 
            startIcon={<ContentCopyIcon />}
            onClick={handleCopy}
          >
            {copied ? 'Copied!' : 'Copy Analysis'}
          </Button>
        </Stack>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      <Box sx={{ color: 'text.primary' }}>
        {parseMarkdownToJsx(analysisText)}
      </Box>
    </Paper>
  );
}

/**
 * Robust line-by-line custom markdown parser to convert standard markdown into beautiful MUI JSX elements.
 */
function parseMarkdownToJsx(text: string) {
  const lines = text.split('\n');
  const jsxElements: React.ReactNode[] = [];
  
  let inTable = false;
  let tableHeaders: string[] = [];
  let tableRows: string[][] = [];

  const flushTable = (key: number) => {
    if (tableRows.length > 0 || tableHeaders.length > 0) {
      jsxElements.push(
        <TableContainer 
          component={Paper} 
          variant="outlined" 
          key={`table-${key}`} 
          sx={{ 
            my: 2, 
            overflowX: 'auto',
            borderRadius: 1.5,
            borderColor: 'grey.300'
          }}
        >
          <Table size="small">
            {tableHeaders.length > 0 && (
              <TableHead sx={{ bgcolor: 'rgba(0, 0, 0, 0.03)' }}>
                <TableRow>
                  {tableHeaders.map((h, i) => (
                    <TableCell key={i} sx={{ fontWeight: 'bold', color: 'grey.700', py: 1 }}>
                      {h.trim()}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
            )}
            <TableBody>
              {tableRows.map((row, i) => (
                <TableRow key={i} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  {row.map((cell, j) => (
                    <TableCell key={j} sx={{ py: 1 }}>
                      {parseInlineStyles(cell.trim())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      );
      inTable = false;
      tableHeaders = [];
      tableRows = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Handle Tables
    if (trimmed.startsWith('|')) {
      inTable = true;
      const cells = trimmed.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      
      // Skip alignment rows e.g. |---|---|
      if (cells.every(c => c.trim().match(/^-+$/))) {
        return;
      }

      if (tableHeaders.length === 0) {
        tableHeaders = cells;
      } else {
        tableRows.push(cells);
      }
      return;
    } else if (inTable) {
      flushTable(index);
    }

    // Handle Headers
    if (trimmed.startsWith('###')) {
      jsxElements.push(
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 2.5, mb: 1, color: '#8A2BE2' }} key={index}>
          {trimmed.replace(/^###\s*/, '')}
        </Typography>
      );
    } else if (trimmed.startsWith('##')) {
      jsxElements.push(
        <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 2.5, mb: 1, color: 'primary.main' }} key={index}>
          {trimmed.replace(/^##\s*/, '')}
        </Typography>
      );
    } else if (trimmed.startsWith('#')) {
      jsxElements.push(
        <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 2.5, mb: 1.5 }} key={index}>
          {trimmed.replace(/^#\s*/, '')}
        </Typography>
      );
    }
    // Handle Bullet lists
    else if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
      const content = trimmed.replace(/^[-*]\s*/, '');
      jsxElements.push(
        <Box key={index} sx={{ display: 'flex', gap: 1.5, ml: 2, mb: 0.75, alignItems: 'flex-start' }}>
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#8A2BE2', mt: 1, flexShrink: 0 }} />
          <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
            {parseInlineStyles(content)}
          </Typography>
        </Box>
      );
    }
    // Handle plain paragraphs
    else if (trimmed) {
      jsxElements.push(
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.6 }} key={index}>
          {parseInlineStyles(trimmed)}
        </Typography>
      );
    }
  });

  // Flush any remaining tables at the end
  flushTable(lines.length);

  return jsxElements;
}

function parseInlineStyles(text: string): React.ReactNode {
  // First split by bold segments
  const boldParts = text.split(/(\*\*.*?\*\*)/g);
  
  return boldParts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldContent = part.slice(2, -2);
      return <strong key={`bold-${idx}`} style={{ color: '#333' }}>{parseCodeTicks(boldContent)}</strong>;
    }
    return parseCodeTicks(part);
  });
}

/**
 * Helper to parse inline backticks e.g. `code`
 */
function parseCodeTicks(text: string): React.ReactNode {
  const parts = text.split(/(`.*?`)/g);
  if (parts.length === 1) return text;
  
  return parts.map((part, idx) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code 
          key={`code-${idx}`} 
          style={{ 
            backgroundColor: '#eaeaea', 
            padding: '2px 4px', 
            borderRadius: '4px',
            fontFamily: 'monospace',
            color: '#d63384',
            fontSize: '0.85em'
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
