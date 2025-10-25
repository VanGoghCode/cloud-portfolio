"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Section, Button } from '@/components';
import { FaExternalLinkAlt, FaGithub } from 'react-icons/fa';
import { useInView } from '@/hooks/useInView';
import { 
  SiReact, SiNextdotjs, SiTypescript, SiTailwindcss, 
  SiNodedotjs, SiMongodb, SiPostgresql, SiDocker,
  SiKubernetes, SiPython, SiTensorflow, SiTerraform
} from 'react-icons/si';
import { FaAws } from 'react-icons/fa';

interface Project {
  title: string;
  description: string;
  longDescription: string;
  image?: string;
  tags: string[];
  category: string;
  link?: string;
  github?: string;
  gradient: string;
  featured?: boolean;
}

interface ProjectsProps {
  projects?: Project[];
}

const techIcons: Record<string, React.ReactNode> = {
  'React': <SiReact />,
  'Next.js': <SiNextdotjs />,
  'TypeScript': <SiTypescript />,
  'Tailwind': <SiTailwindcss />,
  'Node.js': <SiNodedotjs />,
  'MongoDB': <SiMongodb />,
  'PostgreSQL': <SiPostgresql />,
  'Docker': <SiDocker />,
  'Kubernetes': <SiKubernetes />,
  'AWS': <FaAws />,
  'Python': <SiPython />,
  'TensorFlow': <SiTensorflow />,
  'Terraform': <SiTerraform />,
};

// Individual Project Card Component with Intersection Observer
function ProjectCard({ project, index }: { project: Project; index: number }) {
  const { ref, isInView } = useInView({ threshold: 0.1, triggerOnce: true });

  return (
    <div
      ref={ref}
      className="group relative overflow-hidden rounded-3xl transition-all duration-500 hover:scale-[1.03]"
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? 'translateY(0)' : 'translateY(30px)',
        transition: `opacity 0.6s ease-out ${index * 0.1}s, transform 0.6s ease-out ${index * 0.1}s`,
        background: 'rgba(255, 255, 255, 0.4)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      }}
    >
      {/* Gradient Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${project.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-500`}></div>
      
      <div className="relative z-10 p-8 h-full flex flex-col">
        <div className="inline-flex items-center gap-2 w-fit px-3 py-1 rounded-full bg-foreground/10 text-xs font-semibold mb-4">
          <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${project.gradient}`}></div>
          {project.category}
        </div>

        <h4 className="text-xl font-bold mb-3">{project.title}</h4>
        <p className="text-sm text-foreground/60 mb-4">{project.description}</p>
        <p className="text-foreground/70 leading-relaxed mb-6 flex-grow text-sm">
          {project.longDescription}
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          {project.tags.slice(0, 4).map((tag, tagIndex) => (
            <span
              key={tagIndex}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-foreground/5 text-xs font-medium"
            >
              {techIcons[tag] && <span className="text-sm">{techIcons[tag]}</span>}
              {tag}
            </span>
          ))}
        </div>

        <div className="flex gap-3">
          {(() => {
            const demoUrl = project.link ?? project.github;
            return (
              <Button
                onClick={() => demoUrl && window.open(demoUrl, '_blank')}
                size="sm"
                className="flex-1 rounded-xl gap-2"
                disabled={!demoUrl}
                title={demoUrl ? 'Open Demo' : 'No demo available'}
              >
                <FaExternalLinkAlt className="text-xs" />
                Demo
              </Button>
            );
          })()}
          {project.github && (
            <Button
              onClick={() => window.open(project.github!, '_blank')}
              size="sm"
              className="flex-1 rounded-xl gap-2 border border-foreground/20 hover:scale-105"
            >
              <FaGithub />
              Code
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Projects({
  projects = [
    // 🏗️ Infrastructure & Platform Engineering
    {
      title: 'eks-argo-gitops',
      description: 'Production-Grade EKS Cluster with GitOps Automation',
      longDescription:
        'Enterprise Kubernetes platform featuring Karpenter autoscaling (achieving 60% cost reduction vs standard node groups), ArgoCD for declarative GitOps workflows, and automated bootstrap pipeline completing in under 7 minutes. Implements production-grade patterns including IRSA for pod-level IAM, cluster autoscaling, and infrastructure-as-code best practices. Key Metrics: 60% node cost reduction, <7min deployment time, zero-touch GitOps workflow.',
      tags: ['Kubernetes', 'AWS', 'Terraform', 'ArgoCD', 'Karpenter', 'Helm'],
      category: 'Infrastructure & Platform Engineering',
      github: 'https://github.com',
      gradient: 'from-blue-500 to-cyan-500',
      featured: true,
    },
    {
      title: 'multi-account-aws-org',
      description: 'Enterprise AWS Landing Zone with Security Controls',
      longDescription:
        'Multi-account AWS Organization implementing Control Tower best practices, SSO integration, Service Control Policies (SCPs), and automated budget alerts. Architected for compliance and governance, resulting in zero security findings during audit reviews. Foundation for enterprise-scale cloud operations. Key Metrics: 0 security audit findings, multi-account isolation, automated compliance.',
      tags: ['AWS', 'Terraform', 'AWS Organizations', 'AWS SSO', 'Control Tower'],
      category: 'Infrastructure & Platform Engineering',
      github: 'https://github.com',
      gradient: 'from-yellow-500 to-amber-500',
    },
    {
      title: 's3-cloudfront-static-site',
      description: 'High-Performance Static Site Infrastructure Module',
      longDescription:
        'Reusable Terraform module delivering globally distributed static sites with CloudFront CDN, automated SSL/TLS, and CI/CD-integrated cache invalidation. Achieves Lighthouse 100% performance scores through optimized caching strategies and edge delivery. Key Metrics: Lighthouse 100/100, <100ms global latency, automated deployments.',
      tags: ['AWS', 'Terraform', 'CloudFront', 'Route53', 'ACM', 'S3'],
      category: 'Infrastructure & Platform Engineering',
      github: 'https://github.com',
      gradient: 'from-blue-400 to-blue-600',
    },

    // 🚀 Microservices & Backend Engineering
    {
      title: 'url-shortener-go',
      description: 'High-Performance Go REST API with Observability',
      longDescription:
        'Production-ready URL shortening microservice written in Go, achieving sub-50ms p99 latency with 80%+ test coverage. Containerized with multi-stage Docker builds, deployed via Helm charts on Kubernetes. Demonstrates clean architecture, comprehensive testing strategies, and production-grade observability. Key Metrics: ≤50ms p99 latency, 80% test coverage, production-ready monitoring.',
      tags: ['Go', 'Kubernetes', 'Docker', 'Helm', 'PostgreSQL', 'Prometheus'],
      category: 'Microservices & Backend Engineering',
      github: 'https://github.com',
      gradient: 'from-orange-500 to-red-500',
      featured: true,
    },
    {
      title: 'resume-parser-api',
      description: 'Cost-Optimized Serverless Document Processing Pipeline',
      longDescription:
        'Asynchronous PDF-to-JSON parsing service running on AWS Fargate Spot instances, achieving $0.50/day operational costs during active usage. Implements event-driven architecture with SQS queuing, S3 storage integration, and graceful Spot interruption handling for cost-effective document processing at scale. Key Metrics: $0.50/day active cost, async processing, 90%+ Spot cost savings.',
      tags: ['Python', 'AWS', 'Fargate', 'SQS', 'S3', 'Terraform', 'Docker'],
      category: 'Microservices & Backend Engineering',
      github: 'https://github.com',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      title: 'latex-resume-generator',
      description: 'Serverless Document Generation Microservice',
      longDescription:
        'JSON-driven LaTeX compilation service generating professional PDFs via serverless architecture. Processed 2,000+ unique document downloads, demonstrating scalable serverless patterns for compute-intensive workloads. Features API Gateway integration, Lambda execution, and S3 storage delivery. Key Metrics: 2,000+ downloads, serverless scalability, sub-3s generation time.',
      tags: ['Python', 'AWS Lambda', 'API Gateway', 'S3'],
      category: 'Microservices & Backend Engineering',
      github: 'https://github.com',
      gradient: 'from-pink-500 to-rose-500',
    },

    // 💰 FinOps & Cost Optimization
    {
      title: 'cost-optimization-dashboard',
      description: 'Real-Time AWS Cost Monitoring & Alerting System',
      longDescription:
        'Automated FinOps platform using Lambda functions to scrape AWS Cost Explorer data, visualize spending patterns in Grafana, and trigger budget alerts. Identified optimization opportunities resulting in 40% reduction in sandbox environment costs through automated anomaly detection and cost allocation tracking. Key Metrics: 40% cost reduction, real-time alerts, automated recommendations.',
      tags: ['Python', 'AWS', 'Lambda', 'Cost Explorer', 'Grafana', 'CloudWatch', 'Terraform'],
      category: 'FinOps & Cost Optimization',
      github: 'https://github.com',
      gradient: 'from-green-500 to-emerald-500',
      featured: true,
    },

    // 🤖 AI/ML Integration
    {
      title: 'ai-prompt-caching-layer',
      description: 'Intelligent Caching for AI Workload Optimization',
      longDescription:
        'ElastiCache-powered semantic caching layer for KIMI AI API integration, achieving 70% cost reduction through intelligent prompt caching. Handles 1,200+ daily AI API calls with cache hit rate optimization, reducing latency and API costs while maintaining response quality. Demonstrates cost-effective AI operations at scale. Key Metrics: 70% cost reduction, 1,200+ daily calls, sub-100ms cache hits.',
      tags: ['Python', 'AWS', 'ElastiCache', 'Lambda', 'KIMI AI', 'Terraform'],
      category: 'AI/ML Integration',
      github: 'https://github.com',
      gradient: 'from-indigo-500 to-violet-500',
    },

    // 🔧 DevOps & Automation
    {
      title: 'github-actions-reusable-workflows',
      description: 'Enterprise CI/CD Pipeline Templates with Security',
      longDescription:
        'Reusable GitHub Actions workflows implementing OIDC authentication to AWS (eliminating static credentials), Terraform validation with tflint, and automated security scanning. Adopted by 5+ external repositories, demonstrating shareable CI/CD patterns and secure deployment practices for cloud infrastructure. Key Metrics: Used by 5+ repos, zero credential exposure, automated security gates.',
      tags: ['GitHub Actions', 'OIDC', 'AWS', 'Terraform', 'tflint', 'Security Scanning'],
      category: 'DevOps & Automation',
      github: 'https://github.com',
      gradient: 'from-teal-500 to-cyan-500',
    },
  ],
}: ProjectsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [visibleCount, setVisibleCount] = useState<number>(6);
  const [initialVisibleCount, setInitialVisibleCount] = useState<number>(6);

  // Determine initial counts based on viewport: 6 on md+ (>=768px), 3 on small screens
  useEffect(() => {
    const compute = () => {
      if (typeof window === 'undefined') return 6;
      const isMdUp = window.matchMedia('(min-width: 768px)').matches;
      return isMdUp ? 6 : 3;
    };
    const update = () => {
      setInitialVisibleCount(() => {
        const next = compute();
        // Reset visible count when screen size changes
        return next;
      });
    };
    // set on mount
    setInitialVisibleCount(compute());
    setVisibleCount(compute());
    // update on resize
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const categories = ['All', ...Array.from(new Set(projects.map((p) => p.category)))];

  const filteredProjects =
    selectedCategory === 'All'
      ? projects
      : projects.filter((p) => p.category === selectedCategory);

  const visibleProjects = useMemo(() => {
    return filteredProjects.slice(0, visibleCount);
  }, [visibleCount, filteredProjects]);

  // Reset visible count when category changes
  useEffect(() => {
    setVisibleCount(initialVisibleCount);
  }, [selectedCategory, initialVisibleCount]);

  return (
    <Section id="projects" spacing="lg" containerSize="lg">
      <div className="space-y-16">
        {/* Header */}
        <div className="text-center space-y-6">
          <div className="inline-block">
            <h2 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-foreground" style={{ color: 'var(--foreground)' }}>
              Featured Work
            </h2>
            <div className="h-1.5 bg-gradient-to-r from-transparent via-foreground to-transparent rounded-full mt-4"></div>
          </div>
          <p className="text-xl sm:text-2xl text-foreground/60 max-w-3xl mx-auto leading-relaxed">
            A curated selection of projects showcasing innovation, design excellence, and technical expertise
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3">
          {categories.map((category) => (
            <Button
              key={category}
              size="sm"
              variant={selectedCategory === category ? 'primary' : 'ghost'}
              className={`rounded-full ${selectedCategory === category ? 'shadow-lg scale-105' : 'text-foreground/70 hover:text-foreground hover:scale-105'}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Projects Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleProjects.map((project, index) => {
            return <ProjectCard key={index} project={project} index={index} />;
          })}
        </div>

        {/* Empty State */}
        {filteredProjects.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-xl text-foreground/50">
              No projects found in this category
            </p>
          </div>
        )}

        {/* More Button */}
        {visibleCount < filteredProjects.length && (
          <div className="flex justify-center gap-4">
            <Button 
              onClick={() => setVisibleCount(prev => Math.min(prev + 6, filteredProjects.length))} 
              className="rounded-xl"
            >
              Show More
            </Button>
          </div>
        )}

        {/* Show Less Button */}
        {visibleCount > initialVisibleCount && (
          <div className="flex justify-center gap-4">
            <Button 
              onClick={() => setVisibleCount(initialVisibleCount)} 
              className="rounded-xl"
            >
              Show Less
            </Button>
          </div>
        )}
      </div>
    </Section>
  );
}
