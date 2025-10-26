#!/bin/bash

# Seed Initial Blog Posts to DynamoDB

set -e

echo "📝 Seeding blog posts to DynamoDB..."
echo ""

read -p "Enter AWS Region (default: us-east-1): " AWS_REGION
AWS_REGION=${AWS_REGION:-us-east-1}

# Blog Post 1
echo "Adding: Designing Cloud-Native Frontends..."
aws dynamodb put-item \
    --table-name portfolio-blog-posts \
    --item '{
        "id": {"S": "blog_1727654400000"},
        "title": {"S": "Designing Cloud-Native Frontends"},
        "excerpt": {"S": "Principles and patterns for building resilient, scalable UIs that thrive on cloud infra."},
        "content": {"S": "Building cloud-native frontends requires a shift in thinking. Instead of treating the frontend as a monolith, we need to embrace distributed architectures, edge computing, and serverless paradigms. This article explores practical patterns for building resilient UIs that scale effortlessly.\n\n## Key Principles\n\n1. **Edge-First Architecture**: Deploy static assets and dynamic content close to users\n2. **Progressive Enhancement**: Build core functionality that works everywhere\n3. **Resilient State Management**: Handle network failures gracefully\n4. **Observable Systems**: Monitor real user metrics\n\nLearn how to implement these patterns using modern frameworks and cloud services."},
        "date": {"S": "2025-09-15T00:00:00.000Z"},
        "updatedAt": {"S": "2025-09-15T00:00:00.000Z"},
        "readingTime": {"S": "6 min"},
        "tags": {"L": [{"S": "Cloud"}, {"S": "Frontend"}, {"S": "Architecture"}]},
        "status": {"S": "published"},
        "views": {"N": "0"}
    }' \
    --region $AWS_REGION \
    --no-cli-pager

echo "✅ Blog post 1 added"

# Blog Post 2
echo "Adding: Next.js + Edge: A Practical Guide..."
aws dynamodb put-item \
    --table-name portfolio-blog-posts \
    --item '{
        "id": {"S": "blog_1721606400000"},
        "title": {"S": "Next.js + Edge: A Practical Guide"},
        "excerpt": {"S": "When to choose edge functions, caching strategies that matter, and pitfalls to avoid."},
        "content": {"S": "Edge computing with Next.js opens up new possibilities for performance and scalability. But when should you actually use edge functions? This guide cuts through the hype and gives you practical advice.\n\n## When to Use Edge Functions\n\n- **Personalization**: Customize content based on geo-location or headers\n- **A/B Testing**: Route users to different experiences\n- **Authentication**: Validate tokens before hitting your API\n- **Redirects**: Handle complex routing logic\n\n## Caching Strategies\n\nThe key to edge performance is understanding ISR (Incremental Static Regeneration) and how to leverage it effectively. We will dive deep into cache headers, revalidation strategies, and common pitfalls.\n\n## Common Pitfalls\n\nAvoid these mistakes that can hurt performance or increase costs."},
        "date": {"S": "2025-07-22T00:00:00.000Z"},
        "updatedAt": {"S": "2025-07-22T00:00:00.000Z"},
        "readingTime": {"S": "8 min"},
        "tags": {"L": [{"S": "Next.js"}, {"S": "Edge"}, {"S": "Performance"}]},
        "status": {"S": "published"},
        "views": {"N": "0"}
    }' \
    --region $AWS_REGION \
    --no-cli-pager

echo "✅ Blog post 2 added"

# Blog Post 3
echo "Adding: Minimalist UI: Doing More with Less..."
aws dynamodb put-item \
    --table-name portfolio-blog-posts \
    --item '{
        "id": {"S": "blog_1714608000000"},
        "title": {"S": "Minimalist UI: Doing More with Less"},
        "excerpt": {"S": "The aesthetics and ergonomics of minimalist design, with practical Tailwind tips."},
        "content": {"S": "Minimalist design is not about removing features—it is about removing distractions. This article explores how to create beautiful, functional interfaces that let content shine.\n\n## Core Principles\n\n1. **Hierarchy Through Typography**: Use size and weight, not color\n2. **Whitespace is Content**: Give elements room to breathe\n3. **Purposeful Color**: Every color should have meaning\n4. **Subtle Interactions**: Micro-animations that guide without overwhelming\n\n## Practical Tailwind Patterns\n\nLearn composable utility patterns for building minimalist components:\n\n```jsx\n// Clean card design\n<div className=\"rounded-3xl bg-white/40 backdrop-blur-lg p-8\">\n  <h2 className=\"text-2xl font-bold mb-4\">Title</h2>\n  <p className=\"text-foreground/70\">Content</p>\n</div>\n```\n\n## Case Studies\n\nExamples from real projects showing how minimalism improves usability and conversion."},
        "date": {"S": "2025-05-02T00:00:00.000Z"},
        "updatedAt": {"S": "2025-05-02T00:00:00.000Z"},
        "readingTime": {"S": "5 min"},
        "tags": {"L": [{"S": "Design"}, {"S": "UX"}, {"S": "Tailwind"}]},
        "status": {"S": "published"},
        "views": {"N": "0"}
    }' \
    --region $AWS_REGION \
    --no-cli-pager

echo "✅ Blog post 3 added"
echo ""
echo "🎉 Successfully seeded 3 blog posts!"
echo ""
echo "To view them:"
echo "  aws dynamodb scan --table-name portfolio-blog-posts --region $AWS_REGION"
