import React, { useState, useEffect } from 'react';
import type { KeyValue, RedirectData } from '../types';
import { useCopyToClipboard } from '../useCopyToClipboard';
import ParamsGrid from './ParamsGrid';
import DataBlock from './DataBlock';
import AiAnalysisResult from './AiAnalysisResult';
import { GoogleGenAI } from '@google/genai';
import { useAuth0 } from '@auth0/auth0-react';
import { analyzeRedirectOnBackend } from '../api';
import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Button,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Collapse,
  Box
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import DeleteIcon from '@mui/icons-material/Delete';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

const formatQueryParamsAsJson = (queryParams: KeyValue[]): string => {
  const jsonObj: { [key: string]: string } = {};
  queryParams.forEach(param => {
    jsonObj[param.key] = param.value;
  });
  return JSON.stringify(jsonObj, null, 2);
};

interface RedirectCardProps {
  data: RedirectData;
  onDelete?: (id: string) => void;
}

function RedirectCard({ data, onDelete }: RedirectCardProps) {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  const [isParamsCopied, copyParamsJson] = useCopyToClipboard();
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [modelUsed, setModelUsed] = useState<string>('gemini-2.5-flash');

  // Load existing analysis from local storage on mount
  useEffect(() => {
    const savedAnalysis = localStorage.getItem(`ai_analysis_${data.id}`);
    const savedModel = localStorage.getItem(`ai_model_${data.id}`) || 'gemini-2.5-flash';
    if (savedAnalysis) {
      setAnalysisResult(savedAnalysis);
      setModelUsed(savedModel);
    }
  }, [data.id]);

  const handleCopyParams = () => {
    copyParamsJson(formatQueryParamsAsJson(data.queryParams));
  };

  const handleAnalyzeWithAI = async () => {
    setIsAnalyzing(true);
    setErrorMsg(null);

    const isCloudMode = import.meta.env.VITE_SAVE_TO_CLOUD === 'true';

    try {
      let resultText = '';
      let usedModel = 'gemini-2.5-flash';

      // 1. Try server-side proxy if authenticated and in cloud mode
      if (isCloudMode && isAuthenticated) {
        try {
          const token = await getAccessTokenSilently();
          const backendResult = await analyzeRedirectOnBackend(data, token);
          resultText = backendResult.analysis;
          usedModel = backendResult.model;
        } catch (backendError: any) {
          console.warn('Backend proxy analysis failed or is unconfigured, trying client-side fallback:', backendError);
        }
      }

      // 2. Client-side fallback if backend call was skipped or failed
      if (!resultText) {
        const apiKey = localStorage.getItem('gemini_api_key');
        const clientModel = localStorage.getItem('gemini_model') || 'gemini-2.5-flash';
        usedModel = clientModel;

        if (!apiKey) {
          throw new Error('Please configure your Gemini API Key in the settings panel in the header first.');
        }

        const prompt = `
You are a senior security engineer and web developer. Analyze the following redirect URL:
URL: ${data.fullUrl}
Fragment: ${data.fragment || 'None'}
Parameters: ${JSON.stringify(data.queryParams, null, 2)}

Provide a professional, clear, and comprehensive analysis in Markdown format:
1. **Identified Protocol / Flow**: Analyze if this is OAuth 2.0 (e.g. Authorization Code, Implicit, etc.), OpenID Connect, SAML, standard marketing tracking redirect, or general parameters. Explain its purpose.
2. **Security Implications**: Check for risks like missing 'state' or 'nonce', exposing tokens in URL fragments, insecure transfer, or open redirect threats. Specifically mention if there is any parameter exposure risk in client logs or history.
3. **Parameter Significance**: Present a clear markdown table of each query parameter, explaining its purpose, typical values, and role.
`;

        try {
          // Initialize the official SDK
          const ai = new GoogleGenAI({ apiKey });
          const response = await ai.models.generateContent({
            model: clientModel,
            contents: prompt,
          });
          resultText = response.text || '';
        } catch (sdkError) {
          console.warn('SDK failed, attempting fallback to direct fetch:', sdkError);
          // Fallback direct HTTP call
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${clientModel}:generateContent?key=${apiKey}`;
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          });
          const resData = await response.json();
          if (resData.error) {
            throw new Error(resData.error.message || 'Gemini API call failed');
          }
          resultText = resData.candidates[0].content.parts[0].text || '';
        }
      }

      if (!resultText) {
        throw new Error('Received empty response from Gemini API.');
      }

      setAnalysisResult(resultText);
      setModelUsed(usedModel);
      localStorage.setItem(`ai_analysis_${data.id}`, resultText);
      localStorage.setItem(`ai_model_${data.id}`, usedModel);
    } catch (error: any) {
      console.error('Failed to perform Gemini analysis:', error);
      setErrorMsg(error.message || 'An error occurred during Gemini analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClearAnalysis = () => {
    localStorage.removeItem(`ai_analysis_${data.id}`);
    localStorage.removeItem(`ai_model_${data.id}`);
    setAnalysisResult(null);
    setErrorMsg(null);
  };

  const formattedTimestamp = new Date(data.timestamp).toLocaleString();

  return (
    <Card variant="outlined" component="article" aria-labelledby={`redirect-card-heading-${data.id}`}>
      <CardHeader
        id={`redirect-card-heading-${data.id}`}
        title={<Typography variant="h6" component="h3">Logged: {formattedTimestamp}</Typography>}
        action={
          onDelete && (
            <Tooltip title="Delete entry">
              <IconButton 
                aria-label="delete history entry" 
                onClick={() => {
                  handleClearAnalysis();
                  onDelete(data.id);
                }} 
                color="error"
                size="small"
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          )
        }
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      />
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <DataBlock
          title="Full URL"
          dataId={`full-url-${data.id}`}
          content={data.fullUrl}
          copyButtonLabel="Copy URL"
          copiedButtonLabel="URL Copied!"
        />
        <div>
          <Typography variant="h6" component="h4" id={`query-params-heading-${data.id}`} gutterBottom>
            Query Parameters
          </Typography>
          <ParamsGrid params={data.queryParams} />
        </div>
        <DataBlock
          title="URL Fragment (Hash)"
          dataId={`fragment-${data.id}`}
          content={data.fragment}
          emptyContentMessage="No fragment found for this entry."
          copyButtonLabel="Copy Fragment"
          copiedButtonLabel="Fragment Copied!"
        />

        {/* AI Analysis Result Rendering */}
        <Collapse in={!!analysisResult}>
          {analysisResult && (
            <AiAnalysisResult 
              analysisText={analysisResult} 
              modelUsed={modelUsed} 
              onReanalyze={handleAnalyzeWithAI}
            />
          )}
        </Collapse>

        {/* Collapsible Error Handling */}
        <Collapse in={!!errorMsg}>
          {errorMsg && (
            <Alert severity="error" onClose={() => setErrorMsg(null)} sx={{ mt: 1 }}>
              {errorMsg}
            </Alert>
          )}
        </Collapse>
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2, justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {data.queryParams.length > 0 && (
            <Button
              size="small"
              variant="outlined"
              onClick={handleCopyParams}
              aria-live="polite"
              aria-describedby={isParamsCopied ? `queryParams-${data.id}-copied-feedback` : undefined}
            >
              {isParamsCopied ? 'Params Copied! (JSON)' : 'Copy Params (JSON)'}
            </Button>
          )}
          {isParamsCopied && <span id={`queryParams-${data.id}-copied-feedback`} style={visuallyHidden}>Query parameters copied to clipboard as JSON.</span>}
          
          {analysisResult && (
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={handleClearAnalysis}
            >
              Clear AI Analysis
            </Button>
          )}
        </Box>

        <Button
          size="small"
          variant="contained"
          onClick={handleAnalyzeWithAI}
          disabled={isAnalyzing}
          startIcon={isAnalyzing ? <CircularProgress size={16} /> : <AutoAwesomeIcon />}
          sx={{
            background: 'linear-gradient(90deg, #007BFF 0%, #8A2BE2 100%)',
            '&:hover': {
              background: 'linear-gradient(90deg, #0056b3 0%, #6a1b9a 100%)'
            }
          }}
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze with AI'}
        </Button>
      </CardActions>
    </Card>
  );
}

export default RedirectCard;