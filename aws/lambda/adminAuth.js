/**
 * AWS Lambda Function: Admin Authentication
 * 
 * This function handles admin authentication for blog management:
 * - POST /admin/request-code: Generate and send authentication code via email
 * - POST /admin/verify-code: Verify code and create session token
 * 
 * Environment Variables Required:
 * - DYNAMODB_AUTH_TABLE: Name of the DynamoDB table for auth codes
 * - SES_FROM_EMAIL: Verified SES email address to send from
 * - SES_FROM_EMAIL: Admin email address to receive codes
 * - AWS_REGION: AWS region (e.g., us-east-1)
 * - SESSION_SECRET: Secret key for signing session tokens
 */

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");
const crypto = require("crypto");

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const sesClient = new SESClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Configuration
const CODE_EXPIRY_MINUTES = 5;
const SESSION_EXPIRY_HOURS = 24;
const CODE_LENGTH = 20;

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: ""
    };
  }

  try {
    const path = event.path || event.resource;
    const method = event.httpMethod;

    if (method !== "POST") {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: "Method not allowed" })
      };
    }

    // Route based on path
    if (path.includes('/request-code')) {
      return await handleRequestCode(headers);
    } else if (path.includes('/verify-code')) {
      return await handleVerifyCode(event, headers);
    } else {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: "Not found" })
      };
    }
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      })
    };
  }
};

/**
 * Generate random authentication code
 */
function generateAuthCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
    // Add hyphen every 4 characters for readability
    if ((i + 1) % 4 === 0 && i < CODE_LENGTH - 1) {
      code += '-';
    }
  }
  return code;
}

/**
 * Generate session token
 */
function generateSessionToken() {
  const secret = process.env.SESSION_SECRET || 'default-secret-change-me';
  const timestamp = Date.now();
  const random = crypto.randomBytes(32).toString('hex');
  const data = `${timestamp}-${random}`;
  const signature = crypto.createHmac('sha256', secret).update(data).digest('hex');
  return `${data}.${signature}`;
}

/**
 * Verify session token
 */
function verifySessionToken(token) {
  try {
    const secret = process.env.SESSION_SECRET || 'default-secret-change-me';
    const [data, signature] = token.split('.');
    const expectedSignature = crypto.createHmac('sha256', secret).update(data).digest('hex');
    
    if (signature !== expectedSignature) {
      return false;
    }

    const [timestamp] = data.split('-');
    const expiryTime = SESSION_EXPIRY_HOURS * 60 * 60 * 1000;
    return (Date.now() - parseInt(timestamp)) < expiryTime;
  } catch (error) {
    return false;
  }
}

/**
 * Handle request code endpoint
 */
async function handleRequestCode(headers) {
  const adminEmail = process.env.SES_FROM_EMAIL;
  if (!adminEmail) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Admin email not configured" })
    };
  }

  // Generate authentication code
  const code = generateAuthCode();
  const expiryTime = Date.now() + (CODE_EXPIRY_MINUTES * 60 * 1000);

  // Store code in DynamoDB
  const tableName = process.env.DYNAMODB_AUTH_TABLE || 'PortfolioAuthCodes';
  
  try {
    await docClient.send(new PutCommand({
      TableName: tableName,
      Item: {
        code: code.replace(/-/g, ''), // Store without hyphens
        expiresAt: expiryTime,
        createdAt: Date.now(),
        used: false
      }
    }));

    // Send email with code
    const emailParams = {
      Source: process.env.SES_FROM_EMAIL,
      Destination: {
        ToAddresses: [adminEmail]
      },
      Message: {
        Subject: {
          Data: "Admin Authentication Code - Blog Management",
          Charset: "UTF-8"
        },
        Body: {
          Html: {
            Data: `
              <!DOCTYPE html>
              <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                  .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                  .code-box { background: white; border: 2px solid #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
                  .code { font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #667eea; font-family: monospace; }
                  .warning { color: #e74c3c; font-weight: bold; margin-top: 20px; }
                  .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>🔐 Admin Authentication Code</h1>
                  </div>
                  <div class="content">
                    <p>Hello Admin,</p>
                    <p>You've requested access to the blog management system. Use the code below to authenticate:</p>
                    
                    <div class="code-box">
                      <div class="code">${code}</div>
                    </div>
                    
                    <p><strong>Important:</strong></p>
                    <ul>
                      <li>This code expires in ${CODE_EXPIRY_MINUTES} minutes</li>
                      <li>The code is case-sensitive</li>
                      <li>It can only be used once</li>
                      <li>If you didn't request this code, please ignore this email</li>
                    </ul>
                    
                    <div class="warning">
                      ⚠️ Never share this code with anyone!
                    </div>
                  </div>
                  <div class="footer">
                    <p>This is an automated message from your portfolio admin system.</p>
                  </div>
                </div>
              </body>
              </html>
            `,
            Charset: "UTF-8"
          },
          Text: {
            Data: `Admin Authentication Code\n\nYour authentication code is: ${code}\n\nThis code expires in ${CODE_EXPIRY_MINUTES} minutes and can only be used once.\n\nIf you didn't request this code, please ignore this email.`,
            Charset: "UTF-8"
          }
        }
      }
    };

    await sesClient.send(new SendEmailCommand(emailParams));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "Authentication code sent to your email",
        expiresIn: CODE_EXPIRY_MINUTES * 60 // in seconds
      })
    };

  } catch (error) {
    console.error("Error sending authentication code:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to send authentication code" })
    };
  }
}

/**
 * Handle verify code endpoint
 */
async function handleVerifyCode(event, headers) {
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Invalid request body" })
    };
  }

  const { code } = body;
  
  if (!code) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Code is required" })
    };
  }

  // Normalize code (remove hyphens and convert to uppercase)
  const normalizedCode = code.replace(/-/g, '').toUpperCase();

  if (normalizedCode.length !== CODE_LENGTH) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Invalid code format" })
    };
  }

  const tableName = process.env.DYNAMODB_AUTH_TABLE || 'PortfolioAuthCodes';

  try {
    // Get code from DynamoDB
    const result = await docClient.send(new GetCommand({
      TableName: tableName,
      Key: { code: normalizedCode }
    }));

    if (!result.Item) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: "Invalid authentication code" })
      };
    }

    const codeData = result.Item;

    // Check if code has been used
    if (codeData.used) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: "Code has already been used" })
      };
    }

    // Check if code has expired
    if (Date.now() > codeData.expiresAt) {
      // Delete expired code
      await docClient.send(new DeleteCommand({
        TableName: tableName,
        Key: { code: normalizedCode }
      }));

      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: "Code has expired" })
      };
    }

    // Mark code as used and delete it
    await docClient.send(new DeleteCommand({
      TableName: tableName,
      Key: { code: normalizedCode }
    }));

    // Generate session token
    const sessionToken = generateSessionToken();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "Authentication successful",
        sessionToken,
        expiresIn: SESSION_EXPIRY_HOURS * 60 * 60 // in seconds
      })
    };

  } catch (error) {
    console.error("Error verifying code:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to verify code" })
    };
  }
}

// Export token verification for use by other Lambda functions
exports.verifySessionToken = verifySessionToken;
