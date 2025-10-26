import React from "react";
import { Section } from "@/components";
import type { Metadata } from "next";
import { fetchBlogs } from "@/lib/api";

// Enhanced metadata for the blogs page
export const metadata: Metadata = {
  title: "Blogs",
  description:
    "Thoughts, notes, and write-ups on cloud, web, and developer experience. Explore articles about cloud-native architecture, Next.js, and modern web development.",
  openGraph: {
    title: "Blogs | Kirtankumar [K.K.]",
    description: "Technical articles on cloud architecture, frontend development, and DevOps best practices.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Blogs | Kirtankumar [K.K.]",
    description: "Technical articles on cloud architecture and web development.",
  },
};

// Enable ISR (Incremental Static Regeneration)
export const revalidate = 3600; // Revalidate every hour

// Note: This is a Server Component by default in Next.js 15
export default async function BlogPage() {
  // Fallback posts in case API is not configured or fails
  const fallbackPosts = [
    {
      id: "fallback-1",
      title: "Designing Cloud-Native Frontends",
      excerpt:
        "Principles and patterns for building resilient, scalable UIs that thrive on cloud infra.",
      date: "2025-09-15T00:00:00.000Z",
      readingTime: "6 min",
      tags: ["Cloud", "Frontend", "Architecture"],
    },
    {
      id: "fallback-2",
      title: "Next.js + Edge: A Practical Guide",
      excerpt:
        "When to choose edge functions, caching strategies that matter, and pitfalls to avoid.",
      date: "2025-07-22T00:00:00.000Z",
      readingTime: "8 min",
      tags: ["Next.js", "Edge", "Performance"],
    },
    {
      id: "fallback-3",
      title: "Minimalist UI: Doing More with Less",
      excerpt:
        "The aesthetics and ergonomics of minimalist design, with practical Tailwind tips.",
      date: "2025-05-02T00:00:00.000Z",
      readingTime: "5 min",
      tags: ["Design", "UX", "Tailwind"],
    },
  ];

  let posts = fallbackPosts;

  // Try to fetch from API if configured
  if (process.env.NEXT_PUBLIC_API_ENDPOINT) {
    try {
      const response = await fetchBlogs(50);
      if (response.blogs && response.blogs.length > 0) {
        posts = response.blogs;
      }
    } catch (error) {
      console.error("Failed to fetch blogs from API:", error);
      // Falls back to fallback posts
    }
  }

  return (
    <main>
      <Section id="blogs" spacing="xl" containerSize="lg">
        <div className="space-y-16">
          {/* Header */}
          <div className="text-center space-y-6">
            <div className="inline-block">
              <h1
                className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-foreground"
                style={{ color: "var(--foreground)" }}
              >
                Blogs
              </h1>
              <div className="h-1.5 bg-gradient-to-r from-transparent via-foreground to-transparent rounded-full mt-4" />
            </div>
            <p className="text-xl sm:text-2xl text-foreground/60 max-w-3xl mx-auto leading-relaxed">
              Notes on building for the cloud, crafting clean UIs, and shipping
              fast.
            </p>
          </div>

          {/* Posts */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <article
                key={post.id}
                className="group relative overflow-hidden rounded-3xl transition-all duration-300 hover:scale-[1.02]"
                style={{
                  background: "rgba(255,255,255,0.4)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                }}
              >
                <div className="relative z-10 p-8 h-full flex flex-col">
                  <div className="flex items-center gap-3 text-xs text-foreground/60 mb-4">
                    <span>{new Date(post.date).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{post.readingTime}</span>
                  </div>

                  <h2 className="text-xl font-bold mb-3">{post.title}</h2>
                  <p className="text-sm text-foreground/70 leading-relaxed mb-6 flex-grow">
                    {post.excerpt}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {post.tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-foreground/5 text-xs font-medium"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="flex">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/80 group-hover:translate-x-0.5 transition-transform">
                      Read more
                      <span aria-hidden>→</span>
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Empty state example (kept for future) */}
          {posts.length === 0 && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-xl text-foreground/50">No posts yet</p>
            </div>
          )}
        </div>
      </Section>
    </main>
  );
}
