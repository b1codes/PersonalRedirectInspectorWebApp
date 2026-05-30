/**
 * @license
 * SPDX-License-Identifier: MIT
 */
import React from 'react';
import type { KeyValue, RedirectData } from '../types';
import { useCopyToClipboard } from '../useCopyToClipboard';
import ParamsGrid from './ParamsGrid';
import DataBlock from './DataBlock';
import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Button,
  Typography,
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';

const formatQueryParamsAsJson = (queryParams: KeyValue[]): string => {
  const jsonObj: { [key: string]: string } = {};
  queryParams.forEach(param => {
    jsonObj[param.key] = param.value;
  });
  return JSON.stringify(jsonObj, null, 2);
};

interface RedirectCardProps {
  data: RedirectData;
}

function RedirectCard({ data }: RedirectCardProps) {
  const [isParamsCopied, copyParamsJson] = useCopyToClipboard();

  const handleCopyParams = () => {
    copyParamsJson(formatQueryParamsAsJson(data.queryParams));
  };

  const formattedTimestamp = new Date(data.timestamp).toLocaleString();

  return (
    <Card variant="outlined" component="article" aria-labelledby={`redirect-card-heading-${data.id}`}>
      <CardHeader
        id={`redirect-card-heading-${data.id}`}
        title={<Typography variant="h6" component="h3">Logged: {formattedTimestamp}</Typography>}
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
      </CardContent>
      {data.queryParams.length > 0 && (
        <CardActions sx={{ px: 2, pb: 2 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={handleCopyParams}
            aria-live="polite"
            aria-describedby={isParamsCopied ? `queryParams-${data.id}-copied-feedback` : undefined}
          >
            {isParamsCopied ? 'Params Copied! (JSON)' : 'Copy Params (JSON)'}
          </Button>
          {isParamsCopied && <span id={`queryParams-${data.id}-copied-feedback`} style={visuallyHidden}>Query parameters copied to clipboard as JSON.</span>}
        </CardActions>
      )}
    </Card>
  );
}

export default RedirectCard;