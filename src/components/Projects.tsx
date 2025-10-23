'use client';

import React, { useState } from 'react';
import { Section } from '@/components';
import { FaExternalLinkAlt, FaGithub } from 'react-icons/fa';
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

export default function Projects({
  projects = [
    {
      title: 'Cloud Infrastructure Platform',
      description: 'Enterprise-grade cloud management solution',
      longDescription: 'Built a scalable cloud infrastructure management platform using AWS, Terraform, and React. Reduced deployment time by 60% and improved system reliability.',
      tags: ['AWS', 'Terraform', 'React', 'Node.js', 'TypeScript'],
      category: 'Cloud',
      link: 'https://example.com',
      github: 'https://github.com',
      gradient: 'from-blue-500 to-cyan-500',
      featured: true,
    },
    {
      title: 'E-Commerce Dashboard',
      description: 'Real-time analytics & insights platform',
      longDescription: 'Developed a modern analytics dashboard for e-commerce platforms with real-time data visualization, customer insights, and revenue tracking.',
      tags: ['Next.js', 'TypeScript', 'MongoDB', 'Tailwind'],
      category: 'Web',
      link: 'https://example.com',
      github: 'https://github.com',
      gradient: 'from-purple-500 to-pink-500',
      featured: true,
    },
    {
      title: 'DevOps Automation Suite',
      description: 'CI/CD pipeline automation toolkit',
      longDescription: 'Created automated CI/CD pipelines and deployment workflows for microservices architecture, reducing deployment time by 80%.',
      tags: ['Docker', 'Kubernetes', 'Python', 'AWS'],
      category: 'DevOps',
      github: 'https://github.com',
      gradient: 'from-orange-500 to-red-500',
    },
    {
      title: 'AI-Powered Chatbot',
      description: 'Intelligent conversational AI assistant',
      longDescription: 'Designed and implemented an intelligent chatbot using natural language processing and machine learning for customer support automation.',
      tags: ['Python', 'TensorFlow', 'React', 'Node.js'],
      category: 'AI/ML',
      link: 'https://example.com',
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      title: 'Serverless API Gateway',
      description: 'High-performance serverless architecture',
      longDescription: 'Developed a serverless API gateway handling millions of requests with auto-scaling, monitoring, and cost optimization.',
      tags: ['AWS', 'Node.js', 'TypeScript', 'MongoDB'],
      category: 'Cloud',
      github: 'https://github.com',
      gradient: 'from-yellow-500 to-amber-500',
      featured: true,
    },
    {
      title: 'Design System Library',
      description: 'Reusable component library',
      longDescription: 'Built a comprehensive design system with 50+ reusable components, reducing development time by 40% across multiple projects.',
      tags: ['React', 'TypeScript', 'Tailwind'],
      category: 'Web',
      link: 'https://example.com',
      github: 'https://github.com',
      gradient: 'from-indigo-500 to-violet-500',
    },
  ],
}: ProjectsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(projects.map((p) => p.category)))];

  const filteredProjects =
    selectedCategory === 'All'
      ? projects
      : projects.filter((p) => p.category === selectedCategory);

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
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`relative px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 ${
                selectedCategory === category
                  ? 'bg-foreground text-background shadow-lg scale-105'
                  : 'bg-foreground/5 text-foreground/70 hover:bg-foreground/10 hover:text-foreground hover:scale-105'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Projects Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-3xl transition-all duration-500 hover:scale-[1.03]"
              style={{
                animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`,
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
                  {project.link && (
                    <button
                      onClick={() => window.open(project.link, '_blank')}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-foreground text-background hover:scale-105 transition-transform font-semibold text-sm"
                    >
                      <FaExternalLinkAlt className="text-xs" />
                      Demo
                    </button>
                  )}
                  {project.github && (
                    <button
                      onClick={() => window.open(project.github, '_blank')}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-foreground/20 hover:bg-foreground/5 hover:scale-105 transition-all font-semibold text-sm"
                    >
                      <FaGithub />
                      Code
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
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
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .group:hover {
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08) !important;
        }
      `}</style>
    </Section>
  );
}
