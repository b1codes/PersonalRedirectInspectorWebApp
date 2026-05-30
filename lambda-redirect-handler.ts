// lambda-redirect-handler.ts
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

// Initialize the DynamoDB Document Client
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || 'RedirectHistory';

// Define the structure of the incoming request body
interface RedirectData {
  id: string;
  timestamp: number;
  fullUrl: string;
  queryParams: { key: string; value: string }[];
  fragment: string;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // Allow requests from any origin (for development)
  // For production, you should restrict this to your app's domain
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight CORS requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST' || !event.body) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: 'Invalid request. Must be a POST with a body.' }),
    };
  }

  try {
    const data: RedirectData = JSON.parse(event.body);

    // Basic validation
    if (!data.id || !data.fullUrl) {
       return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Invalid data. "id" and "fullUrl" are required.' }),
      };
    }

    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        id: data.id,
        timestamp: data.timestamp,
        fullUrl: data.fullUrl,
        queryParams: data.queryParams,
        fragment: data.fragment,
      },
    });

    await docClient.send(command);

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({ message: 'Redirect data saved successfully.', id: data.id }),
    };

  } catch (error) {
    console.error('Failed to process request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Internal Server Error', error: errorMessage }),
    };
  }
};