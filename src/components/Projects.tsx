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
    {
      title: 'eks-argo-gitops',
      description: 'Production EKS with Karpenter & ArgoCD',
      longDescription: 'Production-grade EKS with Karpenter, 60% cheaper nodes, ArgoCD bootstrap in 7 min. Full GitOps workflow.',
      tags: ['Kubernetes', 'AWS', 'Terraform', 'ArgoCD'],
      category: 'Cloud',
      github: 'https://github.com',
      gradient: 'from-blue-500 to-cyan-500',
      featured: true,
    },
    {
      title: 'url-shortener-go',
      description: 'Go REST API with Helm & Docker',
      longDescription: 'Go REST API, ≤50ms p99, 80% test coverage, Helm + Docker multi-stage. Production-ready microservice.',
      tags: ['Kubernetes', 'Docker', 'Terraform'],
      category: 'DevOps',
      github: 'https://github.com',
      gradient: 'from-orange-500 to-red-500',
      featured: true,
    },
    {
      title: 'resume-parser-api',
      description: 'Async PDF→JSON on Fargate Spot',
      longDescription: 'Async PDF→JSON, Fargate-Spot deployment, $0.50/day active cost. Cost-optimized serverless workload.',
      tags: ['AWS', 'Python', 'Terraform'],
      category: 'Cloud',
      github: 'https://github.com',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      title: 'cost-optimization-dashboard',
      description: 'Lambda + Grafana cost tracking',
      longDescription: 'Lambda scrapes CostExplorer, Grafana alerts, saved 40% sandbox spend. Real-time FinOps monitoring.',
      tags: ['AWS', 'Python', 'Terraform'],
      category: 'FinOps',
      github: 'https://github.com',
      gradient: 'from-green-500 to-emerald-500',
      featured: true,
    },
    {
      title: 'multi-account-aws-org',
      description: 'Landing zone with SSO & SCPs',
      longDescription: 'Landing-zone, SSO, SCPs, Budget alerts → 0 security audit findings. Enterprise AWS foundation.',
      tags: ['AWS', 'Terraform'],
      category: 'Cloud',
      github: 'https://github.com',
      gradient: 'from-yellow-500 to-amber-500',
    },
    {
      title: 'ai-prompt-caching-layer',
      description: 'ElastiCache + KIMI AI integration',
      longDescription: 'ElastiCache + KIMI AI, 70% cost reduction, 1200+ AI calls/day. Smart caching for AI workloads.',
      tags: ['AWS', 'Python', 'Terraform'],
      category: 'AI/ML',
      github: 'https://github.com',
      gradient: 'from-indigo-500 to-violet-500',
    },
    {
      title: 's3-cloudfront-static-site',
      description: 'Terraform module for static sites',
      longDescription: 'Terraform module, CI invalidation, Lighthouse 100% performance. Fast, secure static hosting.',
      tags: ['AWS', 'Terraform'],
      category: 'Cloud',
      github: 'https://github.com',
      gradient: 'from-blue-400 to-blue-600',
    },
    {
      title: 'github-actions-reusable-workflows',
      description: 'OIDC to AWS + security scans',
      longDescription: 'OIDC to AWS, tflint, security-scan, used by 5 external repos. Reusable CI/CD patterns.',
      tags: ['Terraform', 'AWS'],
      category: 'DevOps',
      github: 'https://github.com',
      gradient: 'from-teal-500 to-cyan-500',
    },
    {
      title: 'latex-resume-generator',
      description: 'JSON → LaTeX → PDF microservice',
      longDescription: 'JSON → LaTeX → PDF microservice; 2k unique downloads. Serverless document generation.',
      tags: ['Python', 'AWS'],
      category: 'Cloud',
      github: 'https://github.com',
      gradient: 'from-pink-500 to-rose-500',
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
