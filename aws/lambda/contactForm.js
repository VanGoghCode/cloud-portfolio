/**
 * AWS Lambda Function: Contact Form Handler
 * 
 * This function handles contact form submissions:
 * 1. Validates incoming data
 * 2. Stores message in DynamoDB
 * 3. Sends email notification via SES
 * 
 * Environment Variables Required:
 * - DYNAMODB_TABLE_NAME: Name of the DynamoDB table for contact messages
 * - SES_FROM_EMAIL: Verified SES email address to send from
 * - SES_TO_EMAIL: Your email address to receive notifications
 * - AWS_REGION: AWS region (e.g., us-east-1)
 */

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

// AWS_REGION is automatically provided by Lambda runtime
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const sesClient = new SESClient({ region: process.env.AWS_REGION || 'us-east-1' });

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
