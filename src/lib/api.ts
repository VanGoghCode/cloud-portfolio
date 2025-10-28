/**
 * API Client for Portfolio Backend
 * 
 * Handles communication with AWS Lambda functions via API Gateway
 */

const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT || '';

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface ContactFormResponse {
  success: boolean;
  messageId: string;
  message: string;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  tags: string[];
  readingTime: string;
  date: string;
  updatedAt?: string;
  status: 'published' | 'draft';
  views: number;
  reactions?: Record<string, number>;
  comments?: Array<{
    id: string;
    name: string;
    content: string;
    createdAt: string;
  }>;
}

export interface BlogsResponse {
  blogs: BlogPost[];
  lastKey: string | null;
  count: number;
}

/**
 * Submit contact form
 */
export async function submitContactForm(
  data: ContactFormData
): Promise<ContactFormResponse> {
  // Validate API endpoint is configured
  if (!API_ENDPOINT) {
    throw new Error('API endpoint is not configured. Please contact the administrator.');
  }

  try {
    
    const response = await fetch(`${API_ENDPOINT}/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to submit form';
      try {
        const error = await response.json();
        errorMessage = error.error || error.message || errorMessage;
        
        // Handle rate limiting with specific message
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          if (retryAfter) {
            const minutes = Math.ceil(parseInt(retryAfter) / 60);
            errorMessage = `Rate limit exceeded. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`;
          }
        }
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    
    // Provide more helpful error messages
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your internet connection and try again.');
    }
    
    throw error;
  }
}

/**
 * Fetch all published blog posts
 */
export async function fetchBlogs(
  limit: number = 50,
  lastKey?: string,
  opts?: { q?: string; tag?: string }
): Promise<BlogsResponse> {
  // Validate API endpoint is configured
  if (!API_ENDPOINT) {
    throw new Error('API endpoint is not configured. Please set NEXT_PUBLIC_API_ENDPOINT in your environment variables.');
  }

  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      ...(lastKey && { lastKey }),
      ...(opts?.q ? { q: opts.q } : {}),
      ...(opts?.tag ? { tag: opts.tag } : {}),
    });

    const response = await fetch(`${API_ENDPOINT}/blogs?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      let errorMessage = 'Failed to fetch blogs';
      try {
        const error = await response.json();
        errorMessage = error.error || error.message || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your internet connection and try again.');
    }
    throw error;
  }
}

/**
 * Increment view count for a blog
 */
export async function incrementBlogView(id: string): Promise<{ success: boolean; views: number }> {
  if (!API_ENDPOINT) throw new Error('API endpoint is not configured.');
  const response = await fetch(`${API_ENDPOINT}/blogs/${id}?action=view`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error('Failed to increment view');
  return response.json();
}

/**
 * React to a blog with an emoji
 */
export async function reactToBlog(id: string, emoji: string): Promise<{ success: boolean; reactions: Record<string, number> }> {
  if (!API_ENDPOINT) throw new Error('API endpoint is not configured.');
  const response = await fetch(`${API_ENDPOINT}/blogs/${id}?action=react`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emoji }),
  });
  if (!response.ok) throw new Error('Failed to add reaction');
  return response.json();
}

/**
 * Add a comment to a blog
 */
export async function addComment(
  id: string,
  comment: { name: string; content: string; website?: string }
): Promise<{ success: boolean; comments: BlogPost['comments'] }> {
  if (!API_ENDPOINT) throw new Error('API endpoint is not configured.');
  const response = await fetch(`${API_ENDPOINT}/blogs/${id}?action=comment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(comment),
  });
  if (!response.ok) throw new Error('Failed to add comment');
  return response.json();
}

/**
 * Fetch a single blog post by ID
 */
export async function fetchBlogById(id: string): Promise<BlogPost> {
  // Validate API endpoint is configured
  if (!API_ENDPOINT) {
    throw new Error('API endpoint is not configured. Please set NEXT_PUBLIC_API_ENDPOINT in your environment variables.');
  }

  try {
    const response = await fetch(`${API_ENDPOINT}/blogs/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      let errorMessage = 'Failed to fetch blog';
      try {
        const error = await response.json();
        errorMessage = error.error || error.message || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your internet connection and try again.');
    }
    throw error;
  }
}

/**
 * Create a new blog post (requires authentication)
 */
export async function createBlog(
  data: Partial<BlogPost>,
  apiKey: string
): Promise<BlogPost> {
  try {
    const response = await fetch(`${API_ENDPOINT}/blogs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create blog');
    }

    const result = await response.json();
    return result.blog;
  } catch (error) {
    throw error;
  }
}

/**
 * Update an existing blog post (requires authentication)
 */
export async function updateBlog(
  id: string,
  data: Partial<BlogPost>,
  apiKey: string
): Promise<BlogPost> {
  try {
    const response = await fetch(`${API_ENDPOINT}/blogs/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update blog');
    }

    const result = await response.json();
    return result.blog;
  } catch (error) {
    throw error;
  }
}

/**
 * Delete a blog post (requires authentication)
 */
export async function deleteBlog(id: string, apiKey: string): Promise<void> {
  try {
    const response = await fetch(`${API_ENDPOINT}/blogs/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete blog');
    }
  } catch (error) {
    throw error;
  }
}
