'use client';

import Link from 'next/link';
import { Section } from '@/components';

export default function ComingSoon() {
  return (
    <main className="min-h-screen">
      <Section id="coming-soon" spacing="xl" containerSize="md" className='min-h-[100vh] flex items-center justify-center'>
        <div className="text-center animate-fade-in">

          {/* Floating Icon */}
          <div className="mb-12 animate-float">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full backdrop-blur-sm border-2 border-foreground/10 bg-foreground/5 shadow-lg">
              <svg
                className="w-12 h-12 text-foreground/60"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
          </div>

          {/* Heading */}
          <div className="inline-block mb-8">
            <h1
              className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight animate-fade-in-up"
              style={{ color: 'var(--foreground)' }}
            >
              Coming Soon
            </h1>
            <div className="h-1.5 bg-gradient-to-r from-transparent via-foreground to-transparent rounded-full mt-4 animate-expand" />
          </div>

          {/* Back to Home Button */}
          <div className="animate-fade-in-up animation-delay-300">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-foreground text-white font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg"
              style={{
                backgroundColor: 'var(--foreground)',
              }}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Home
            </Link>
          </div>

          {/* Animated dots */}
          <div className="mt-16 flex justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-full animate-pulse"
                style={{
                  backgroundColor: 'var(--foreground)',
                  opacity: 0.3,
                  animationDelay: `${i * 200}ms`,
                }}
              />
            ))}
          </div>
        </div>
      </Section>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes expand {
          from {
            transform: scaleX(0);
            opacity: 0;
          }
          to {
            transform: scaleX(1);
            opacity: 1;
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out backwards;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-expand {
          animation: expand 0.8s ease-out 0.3s backwards;
        }

        .animation-delay-200 {
          animation-delay: 0.2s;
        }

        .animation-delay-300 {
          animation-delay: 0.3s;
        }

        .animation-delay-400 {
          animation-delay: 0.4s;
        }

        /* Subtle shimmer effect on hover for button */
        a:hover {
          background-image: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.1),
            transparent
          );
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
      `}</style>
    </main>
  );
}
