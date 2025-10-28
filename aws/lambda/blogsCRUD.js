/**
 * AWS Lambda Function: Blogs CRUD Operations
 * 
 * This function handles blog post operations:
 * - GET: Fetch all published blog posts (with pagination)
 * - GET /{id}: Fetch a single blog post by ID
 * - POST: Create a new blog post (requires auth)
 * - PUT /{id}: Update a blog post (requires auth)
 * - DELETE /{id}: Delete a blog post (requires auth)
 * 
 * Environment Variables Required:
 * - DYNAMODB_BLOGS_TABLE: Name of the DynamoDB table for blog posts
 * - AWS_REGION: AWS region (e.g., us-east-1)
 * - API_KEY: Simple API key for write operations (optional, for basic security)
 */

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  ScanCommand, 
  UpdateCommand, 
  DeleteCommand 
} = require("@aws-sdk/lib-dynamodb");
const crypto = require("crypto");

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*", // Update with your domain in production
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: ""
    };
  }

  const method = event.httpMethod;
  const pathParameters = event.pathParameters || {};
  const blogId = pathParameters.id;

  try {
    // Route based on HTTP method
    switch (method) {
      case "GET":
        if (blogId) {
          return await getBlogById(blogId, headers);
        }
        return await getAllBlogs(event.queryStringParameters, headers);
      
      case "POST":
        return await createBlog(event, headers);
      
      case "PUT":
        return await updateBlog(event, blogId, headers);
      
      case "DELETE":
        return await deleteBlog(event, blogId, headers);
      
      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: "Method not allowed" })
        };
    }
  } catch (error) {
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

// Check authentication for write operations
function checkAuth(event) {
  const SESSION_EXPIRY_HOURS = 24;
  const secret = process.env.SESSION_SECRET || 'default-secret-change-me';
  
  // First try session token (from admin panel)
  const authHeader = event.headers?.Authorization || event.headers?.authorization;
  if (!authHeader) {
    return false;
  }

  const token = authHeader.replace('Bearer ', '');

  // Verify session token
  try {
    const [data, signature] = token.split('.');
    if (!data || !signature) {
      return false;
    }

    const expectedSignature = crypto.createHmac('sha256', secret).update(data).digest('hex');
    
    if (signature !== expectedSignature) {
      return false;
    }

    const [timestamp] = data.split('-');
    const expiryTime = SESSION_EXPIRY_HOURS * 60 * 60 * 1000;
    const isValid = (Date.now() - parseInt(timestamp)) < expiryTime;
    
    return isValid;
  } catch (error) {
    console.error('Auth error:', error);
    return false;
  }
}

// GET all blogs (with pagination and filtering)
async function getAllBlogs(queryParams, headers) {
  const limit = parseInt(queryParams?.limit) || 50;
  const lastKey = queryParams?.lastKey ? JSON.parse(decodeURIComponent(queryParams.lastKey)) : undefined;

  const params = {
    TableName: process.env.DYNAMODB_BLOGS_TABLE,
    Limit: limit,
    ExclusiveStartKey: lastKey,
    FilterExpression: "#status = :status",
    ExpressionAttributeNames: {
      "#status": "status"
    },
    ExpressionAttributeValues: {
      ":status": "published"
    }
  };

  const result = await docClient.send(new ScanCommand(params));

  // Sort by date (newest first)
  const sortedItems = (result.Items || []).sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      blogs: sortedItems,
      lastKey: result.LastEvaluatedKey ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey)) : null,
      count: sortedItems.length
    })
  };
}

// GET single blog by ID
async function getBlogById(blogId, headers) {
  const result = await docClient.send(
    new GetCommand({
      TableName: process.env.DYNAMODB_BLOGS_TABLE,
      Key: { id: blogId }
    })
  );

  if (!result.Item) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: "Blog post not found" })
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(result.Item)
  };
}

// POST - Create new blog
async function createBlog(event, headers) {
  if (!checkAuth(event)) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: "Unauthorized" })
    };
  }

  const body = JSON.parse(event.body);
  const { title, excerpt, content, tags, readingTime } = body;

  if (!title || !excerpt || !content) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: "Missing required fields",
        required: ["title", "excerpt", "content"]
      })
    };
  }

  const blogId = `blog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();

  const item = {
    id: blogId,
    title,
    excerpt,
    content,
    tags: tags || [],
    readingTime: readingTime || "5 min",
    date: timestamp,
    updatedAt: timestamp,
    status: "published",
    views: 0
  };

  await docClient.send(
    new PutCommand({
      TableName: process.env.DYNAMODB_BLOGS_TABLE,
      Item: item
    })
  );

  return {
    statusCode: 201,
    headers,
    body: JSON.stringify({
      success: true,
      blog: item
    })
  };
}

// PUT - Update blog
async function updateBlog(event, blogId, headers) {
  if (!checkAuth(event)) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: "Unauthorized" })
    };
  }

  if (!blogId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Blog ID is required" })
    };
  }

  const body = JSON.parse(event.body);
  const updateFields = [];
  const expressionAttributeValues = {};
  const expressionAttributeNames = {};

  // Build update expression dynamically
  const allowedFields = ["title", "excerpt", "content", "tags", "readingTime", "status"];
  allowedFields.forEach(field => {
    if (body[field] !== undefined) {
      updateFields.push(`#${field} = :${field}`);
      expressionAttributeNames[`#${field}`] = field;
      expressionAttributeValues[`:${field}`] = body[field];
    }
  });

  // Always update the updatedAt timestamp
  updateFields.push("#updatedAt = :updatedAt");
  expressionAttributeNames["#updatedAt"] = "updatedAt";
  expressionAttributeValues[":updatedAt"] = new Date().toISOString();

  if (updateFields.length === 1) { // Only updatedAt
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "No fields to update" })
    };
  }

  const result = await docClient.send(
    new UpdateCommand({
      TableName: process.env.DYNAMODB_BLOGS_TABLE,
      Key: { id: blogId },
      UpdateExpression: `SET ${updateFields.join(", ")}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW"
    })
  );

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      blog: result.Attributes
    })
  };
}

// DELETE - Delete blog
async function deleteBlog(event, blogId, headers) {
  if (!checkAuth(event)) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: "Unauthorized" })
    };
  }

  if (!blogId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Blog ID is required" })
    };
  }

  await docClient.send(
    new DeleteCommand({
      TableName: process.env.DYNAMODB_BLOGS_TABLE,
      Key: { id: blogId }
    })
  );

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      message: "Blog post deleted successfully"
    })
  };
}
