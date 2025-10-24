'use client';

import React from 'react';
import { Section } from '@/components';
import { 
  FaAws, FaMicrosoft, FaReact, FaNodeJs, FaPython, FaDocker 
} from 'react-icons/fa';
import { 
  SiGooglecloud, SiNextdotjs, SiTypescript, SiKubernetes, 
  SiTerraform, SiMongodb 
} from 'react-icons/si';
import { MdCode, MdCloud, MdSpeed, MdLightbulb } from 'react-icons/md';

interface Skill {
  name: string;
  icon: React.ReactNode;
  color: string;
}

interface AboutProps {
  bio?: string;
  skills?: Skill[];
}

export default function About({
  bio = "With three years of hands-on cloud experience, I design and operate AWS-native platforms, multi-account organizations, EKS clusters, serverless pipelines 100 % codified in Terraform, averaging ≤ $3 daily cost and cutting AI workloads 70 % via ElastiCache caching; AWS SAA (Nov 2025) and CKAD (Jan 2026), lots of GitHub commits, Go/Python micro-services ≤ 50 ms p99, full-stack Next.js when needed, and observability stacks that recover in seconds.",
  skills = [
    { name: 'AWS', icon: <FaAws />, color: '#FF9900' },
    { name: 'Azure', icon: <FaMicrosoft />, color: '#0078D4' },
    { name: 'Google Cloud', icon: <SiGooglecloud />, color: '#4285F4' },
    { name: 'Docker', icon: <FaDocker />, color: '#2496ED' },
    { name: 'Kubernetes', icon: <SiKubernetes />, color: '#326CE5' },
    { name: 'Terraform', icon: <SiTerraform />, color: '#7B42BC' },
    { name: 'Python', icon: <FaPython />, color: '#3776AB' },
    { name: 'Node.js', icon: <FaNodeJs />, color: '#339933' },
    { name: 'React', icon: <FaReact />, color: '#61DAFB' },
    { name: 'Next.js', icon: <SiNextdotjs />, color: '#000000' },
    { name: 'TypeScript', icon: <SiTypescript />, color: '#3178C6' },
    { name: 'MongoDB', icon: <SiMongodb />, color: '#47A248' },
  ],
}: AboutProps) {
  const stats = [
    { label: 'OSS Repos', value: '10', icon: <MdCode /> },
    { label: 'GitHub Contributions', value: '650+', icon: <MdLightbulb /> },
    { label: 'Cloud Spend Saved', value: '$3k+', icon: <MdCloud /> },
    { label: 'Certifications', value: '2', icon: <MdSpeed /> },
  ];

  return (
    <Section id="about" spacing="lg" containerSize="lg">
      <div className="space-y-20">
        {/* Header with animated gradient */}
        <div className="text-center space-y-6">
          <div className="inline-block">
            <h2 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-foreground" style={{ color: 'var(--foreground)' }}>
              About Me
            </h2>
            <div className="h-1.5 bg-gradient-to-r from-transparent via-foreground to-transparent rounded-full mt-4"></div>
          </div>
          <p className="text-xl sm:text-2xl text-foreground/60 max-w-3xl mx-auto leading-relaxed">
            {bio}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="group relative overflow-hidden bg-gradient-to-br from-foreground/5 to-foreground/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 transition-all duration-500 hover:scale-105 hover:shadow-lg"
              style={{
                background: 'rgba(255, 255, 255, 0.4)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-foreground/0 to-foreground/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10 text-center space-y-3">
                <div className="text-4xl sm:text-5xl mx-auto w-fit p-3 rounded-xl bg-foreground/10 text-foreground group-hover:scale-110 transition-transform duration-300">
                  {stat.icon}
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-foreground" style={{ color: 'var(--foreground)' }}>
                  {stat.value}
                </div>
                <div className="text-sm sm:text-base text-foreground/60 font-medium">
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Skills Bento Grid */}
        <div className="space-y-8">
          <div className="text-center">
            <h3 className="text-3xl sm:text-4xl font-bold mb-3">
              Tech Stack & Expertise
            </h3>
            <p className="text-foreground/60">Technologies I work with daily</p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {skills.map((skill, index) => (
              <div
                key={index}
                className="group relative overflow-hidden backdrop-blur-sm rounded-2xl p-6 transition-all duration-300 hover:scale-110 hover:shadow-lg cursor-pointer"
                style={{
                  animation: `fadeInUp 0.5s ease-out ${index * 0.05}s both`,
                  background: 'rgba(255, 255, 255, 0.4)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                }}
              >
                {/* Glow effect on hover */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-xl"
                  style={{ backgroundColor: skill.color }}
                ></div>
                
                <div className="relative z-10 flex flex-col items-center gap-3">
                  <div 
                    className="text-4xl sm:text-5xl transition-all duration-300 group-hover:scale-125 group-hover:rotate-12"
                    style={{ color: skill.color }}
                  >
                    {skill.icon}
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-center text-foreground/80 group-hover:text-foreground transition-colors">
                    {skill.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* What I Do Section */}
        <div className="space-y-8">
          <div className="text-center">
            <h3 className="text-3xl sm:text-4xl font-bold mb-3">
              What I Do
            </h3>
            <p className="text-foreground/60">My areas of expertise</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Cloud Architecture',
                description: 'Multi-account AWS, Well-Architected pillars, infra-cost ≤$5/day. Design scalable, secure infrastructure.',
                icon: '☁️',
                gradient: 'from-blue-500/10 to-cyan-500/10',
              },
              {
                title: 'DevOps & GitOps',
                description: 'Zero-click pipelines, PR→Prod in <10 min, 100% IaC. ArgoCD, GitHub Actions, Terraform automation.',
                icon: '⚙️',
                gradient: 'from-orange-500/10 to-red-500/10',
              },
              {
                title: 'Security & Compliance',
                description: 'IAM least-privilege, KMS, Secrets rotation, SCPs, Config rules. Zero security audit findings.',
                icon: '🔒',
                gradient: 'from-purple-500/10 to-pink-500/10',
              },
              {
                title: 'Observability & FinOps',
                description: 'Prometheus, Grafana, real-time cost dashboards, 70% waste cut. Monitor everything, optimize spend.',
                icon: '📊',
                gradient: 'from-green-500/10 to-emerald-500/10',
              },
              {
                title: 'Platform Engineering',
                description: 'Reusable TF modules, Helm charts, docs-as-code, developer portals. Build platforms teams love.',
                icon: '🚀',
                gradient: 'from-indigo-500/10 to-violet-500/10',
              },
              {
                title: 'UX Polish',
                description: 'Clean dashboards, dark-mode, 40% faster page loads (SSR + edge). Engineering that feels good.',
                icon: '🎨',
                gradient: 'from-yellow-500/10 to-amber-500/10',
              },
            ].map((item, index) => (
              <div
                key={index}
                className={`group relative overflow-hidden backdrop-blur-sm rounded-3xl p-8 transition-all duration-500 hover:scale-105 hover:shadow-lg`}
                style={{
                  background: 'rgba(255, 255, 255, 0.4)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-foreground/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10 space-y-4">
                  <div className="text-5xl group-hover:scale-110 transition-transform duration-300">
                    {item.icon}
                  </div>
                  <h4 className="text-xl font-bold text-foreground group-hover:text-foreground transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-foreground/70 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </Section>
  );
}
