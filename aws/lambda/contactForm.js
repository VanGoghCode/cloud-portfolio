/**
 * AWS Lambda Function: Contact Form Handler
 * 
 * This function handles contact form submissions with security features:
 * 1. Rate limiting (IP-based and email-based)
 * 2. Validates incoming data
 * 3. Stores message in DynamoDB
 * 4. Sends email notification via SES
 * 
 * Rate Limiting:
 * - IP-based: Max 5 requests per hour per IP address
 * - Email-based: Max 3 requests per hour per email address
 * - Violations result in 2-hour temporary blocks
 * 
 * Environment Variables Required:
 * - DYNAMODB_TABLE_NAME: Name of the DynamoDB table for contact messages
 * - SES_FROM_EMAIL: Verified SES email address to send from
 * - SES_TO_EMAIL: Your email address to receive notifications
 * - AWS_REGION: AWS region (e.g., us-east-1)
 */

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

// AWS_REGION is automatically provided by Lambda runtime
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const sesClient = new SESClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  maxRequestsPerIP: 5,        // Max requests per IP per time window
  maxRequestsPerEmail: 3,     // Max requests per email per time window
  timeWindowMinutes: 60,      // Time window in minutes
  blockDurationMinutes: 120   // How long to block after exceeding limit
};

/**
 * Extract client IP address from the event
 */
function getClientIP(event) {
  // Check various headers and sources for the real IP
  const ip = 
    event.requestContext?.identity?.sourceIp ||
    event.headers?.['X-Forwarded-For']?.split(',')[0].trim() ||
    event.headers?.['x-forwarded-for']?.split(',')[0].trim() ||
    'unknown';
  
  return ip;
}

/**
 * Check rate limit for a given identifier (IP or email)
 */
async function checkRateLimit(identifier, type) {
  const now = Date.now();
  const timeWindowMs = RATE_LIMIT_CONFIG.timeWindowMinutes * 60 * 1000;
  const blockDurationMs = RATE_LIMIT_CONFIG.blockDurationMinutes * 60 * 1000;
  
  const rateLimitKey = `ratelimit_${type}_${identifier}`;
  
  try {
    // Get existing rate limit record
    const result = await docClient.send(
      new GetCommand({
        TableName: process.env.DYNAMODB_TABLE_NAME,
        Key: { id: rateLimitKey }
      })
    );
    
    const record = result.Item;
    
    // If record exists, check if still blocked
    if (record) {
      const { attempts = [], blockedUntil } = record;
      
      // Check if currently blocked
      if (blockedUntil && blockedUntil > now) {
        const minutesRemaining = Math.ceil((blockedUntil - now) / 60000);
        return {
          allowed: false,
          reason: `Too many requests. Please try again in ${minutesRemaining} minutes.`,
          retryAfter: blockedUntil
        };
      }
      
      // Filter out old attempts outside the time window
      const recentAttempts = attempts.filter(timestamp => 
        timestamp > now - timeWindowMs
      );
      
      // Determine max requests based on type
      const maxRequests = type === 'ip' 
        ? RATE_LIMIT_CONFIG.maxRequestsPerIP 
        : RATE_LIMIT_CONFIG.maxRequestsPerEmail;
      
      // Check if limit exceeded
      if (recentAttempts.length >= maxRequests) {
        // Block this identifier
        const blockedUntil = now + blockDurationMs;
        
        await docClient.send(
          new PutCommand({
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Item: {
              id: rateLimitKey,
              attempts: recentAttempts,
              blockedUntil,
              lastUpdated: now
            }
          })
        );
        
        const minutesBlocked = RATE_LIMIT_CONFIG.blockDurationMinutes;
        return {
          allowed: false,
          reason: `Rate limit exceeded. You have been temporarily blocked for ${minutesBlocked} minutes.`,
          retryAfter: blockedUntil
        };
      }
      
      // Update with new attempt
      recentAttempts.push(now);
      await docClient.send(
        new PutCommand({
          TableName: process.env.DYNAMODB_TABLE_NAME,
          Item: {
            id: rateLimitKey,
            attempts: recentAttempts,
            lastUpdated: now
          }
        })
      );
      
      return {
        allowed: true,
        remaining: maxRequests - recentAttempts.length
      };
    }
    
    // First attempt, create new record
    await docClient.send(
      new PutCommand({
        TableName: process.env.DYNAMODB_TABLE_NAME,
        Item: {
          id: rateLimitKey,
          attempts: [now],
          lastUpdated: now
        }
      })
    );
    
    const maxRequests = type === 'ip' 
      ? RATE_LIMIT_CONFIG.maxRequestsPerIP 
      : RATE_LIMIT_CONFIG.maxRequestsPerEmail;
    
    return {
      allowed: true,
      remaining: maxRequests - 1
    };
    
  } catch (error) {
    console.error('Rate limit check error:', error);
    // On error, allow the request (fail open)
    return { allowed: true };
  }
}

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*", // Update with your domain in production
    "Access-Control-Allow-Headers": "Content-Type",
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
    // Parse request body
    const body = JSON.parse(event.body);
    const { name, email, subject, message } = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Missing required fields",
          required: ["name", "email", "subject", "message"]
        })
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid email format" })
      };
    }

    // Rate limiting checks
    const clientIP = getClientIP(event);
    
    // Check IP-based rate limit
    const ipRateLimit = await checkRateLimit(clientIP, 'ip');
    if (!ipRateLimit.allowed) {
      return {
        statusCode: 429, // Too Many Requests
        headers: {
          ...headers,
          'Retry-After': Math.ceil((ipRateLimit.retryAfter - Date.now()) / 1000) // seconds
        },
        body: JSON.stringify({
          error: "Rate limit exceeded",
          message: ipRateLimit.reason
        })
      };
    }
    
    // Check email-based rate limit
    const emailRateLimit = await checkRateLimit(email.toLowerCase(), 'email');
    if (!emailRateLimit.allowed) {
      return {
        statusCode: 429, // Too Many Requests
        headers: {
          ...headers,
          'Retry-After': Math.ceil((emailRateLimit.retryAfter - Date.now()) / 1000) // seconds
        },
        body: JSON.stringify({
          error: "Rate limit exceeded",
          message: emailRateLimit.reason
        })
      };
    }

    // Create message record
    const timestamp = new Date().toISOString();
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const item = {
      id: messageId,
      name,
      email,
      subject,
      message,
      timestamp,
      read: false
    };

    // Store in DynamoDB
    await docClient.send(
      new PutCommand({
        TableName: process.env.DYNAMODB_TABLE_NAME,
        Item: item
      })
    );

    // Send email notification via SES
    const emailParams = {
      Source: process.env.SES_FROM_EMAIL,
      Destination: {
        ToAddresses: [process.env.SES_TO_EMAIL]
      },
      Message: {
        Subject: {
          Data: `Portfolio Contact: ${subject}`
        },
        Body: {
          Html: {
            Data: `
              <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                  <h2 style="color: #2563eb;">New Contact Form Submission</h2>
                  <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>From:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Subject:</strong> ${subject}</p>
                    <p><strong>Time:</strong> ${new Date(timestamp).toLocaleString()}</p>
                  </div>
                  <div style="background: #fff; padding: 20px; border-left: 4px solid #2563eb; margin: 20px 0;">
                    <h3>Message:</h3>
                    <p>${message.replace(/\n/g, '<br>')}</p>
                  </div>
                  <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; font-size: 12px;">
                    Message ID: ${messageId}<br>
                    This is an automated notification from your portfolio contact form.
                  </p>
                </body>
              </html>
            `
          },
          Text: {
            Data: `
New Contact Form Submission

From: ${name}
Email: ${email}
Subject: ${subject}
Time: ${new Date(timestamp).toLocaleString()}

Message:
${message}

---
Message ID: ${messageId}
            `
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
        messageId,
        message: "Your message has been sent successfully!"
      })
    };

  } catch (error) {
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Failed to process your request",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      })
    };
  }
};
