'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container } from '@/components';

export default function AdminLoginPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [codeRequested, setCodeRequested] = useState(false);

  const handleRequestCode = async () => {
    setIsRequesting(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/admin/request-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(data.error || 'Rate limit exceeded. Please wait before requesting another code.');
        }
        throw new Error(data.error || 'Failed to send authentication code');
      }

      setMessage(data.message);
      setCodeRequested(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request code');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/admin/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(data.error || 'Too many verification attempts. Please wait before trying again.');
        }
        throw new Error(data.error || 'Invalid authentication code');
      }

      setMessage(data.message);
      // Redirect to blog creation page after successful authentication
      setTimeout(() => {
        router.push('/admin/create-blog');
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify code');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Container>
        <div className="flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                Admin Access
              </h2>
              <p className="mt-2 text-center text-sm text-gray-300">
                Request authentication code to manage blog posts
              </p>
            </div>

            <div className="mt-8 space-y-6">
              {!codeRequested ? (
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 space-y-6">
                  <p className="text-gray-200 text-center">
                    Click the button below to receive a 20-character authentication code via email.
                  </p>
                  
                  <button
                    onClick={handleRequestCode}
                    disabled={isRequesting}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {isRequesting ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending Code...
                      </span>
                    ) : (
                      'Request Authentication Code'
                    )}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleVerifyCode} className="bg-white/10 backdrop-blur-lg rounded-xl p-8 space-y-6">
                  <div>
                    <label htmlFor="code" className="block text-sm font-medium text-gray-200 mb-2">
                      Enter Authentication Code
                    </label>
                    <input
                      id="code"
                      name="code"
                      type="text"
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      className="appearance-none relative block w-full px-3 py-3 border border-gray-600 placeholder-gray-400 text-white bg-gray-800/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent sm:text-sm tracking-wider"
                      placeholder="XXXX-XXXX-XXXX-XXXX-XXXX"
                      maxLength={24} // 20 chars + 4 dashes
                      autoComplete="off"
                    />
                    <p className="mt-2 text-xs text-gray-300">
                      Code expires in 5 minutes
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isVerifying || code.trim().length < 12}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {isVerifying ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Verifying...
                      </span>
                    ) : (
                      'Verify & Continue'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCodeRequested(false);
                      setCode('');
                      setError('');
                      setMessage('');
                    }}
                    className="w-full text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    Request a new code
                  </button>
                </form>
              )}

              {/* Success Message */}
              {message && (
                <div className="rounded-lg bg-green-500/20 p-4 border border-green-500/30">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-300">{message}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="rounded-lg bg-red-500/20 p-4 border border-red-500/30">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-300">{error}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
