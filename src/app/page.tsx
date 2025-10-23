import { Hero, About, Projects, Contact } from "@/components";

export default function Home() {
  return (
    <main>
      {/* Hero Section */}
      <Hero 
        name="Kirtan Thummar"
        title="Cloud Developer & Designer"
        description="Passionate about creating beautiful and functional digital experiences. Specializing in cloud technologies and modern web development."
      />

      {/* About Section */}
      <About />

      {/* Projects Section */}
      <Projects />

      {/* Contact Section */}
      <Contact />

      {/* Footer */}
      {/* <Footer
        name="Kirtan thummar"
        links={[
          { label: "About", href: "#about" },
          { label: "Projects", href: "#work" },
          { label: "Contact", href: "#contact" },
        ]}
        socialLinks={[
          { label: "GitHub", href: "https://github.com" },
          { label: "LinkedIn", href: "https://linkedin.com" },
          { label: "Twitter", href: "https://twitter.com" },
        ]}
      /> */}
    </main>
  );
}
