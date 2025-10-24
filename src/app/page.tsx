import { Hero, About, Projects, Contact } from "@/components";

export default function Home() {
  return (
    <main>
      <Hero 
        name="Kirtan Thummar"
        title="Cloud-Native / DevOps Engineer"
        description="Cloud engineer who turns ideas into reliable, low-cost AWS platforms, built 10 production repos, codified EKS clusters, and cut spend 70 % through spot + caching. Three years designing secure, scalable infrastructure, now ready to ship resilient systems that save money and recover in seconds."
      />
      <About />
      <Projects />
      <Contact />
    </main>
  );
}
