import { Hero } from "@/components";

export default function Home() {
  return (
    <main>
      {/* Hero Section */}
      <Hero 
        name="Kirtan Thummar"
        title="Cloud Developer & Designer"
        description="Passionate about creating beautiful and functional digital experiences. Specializing in cloud technologies and modern web development."
      />

      {/* About Section - Placeholder */}
      <section id="about" className="min-h-screen w-full flex items-center justify-center px-4 sm:px-6 md:px-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-4">About</h2>
          <p className="text-lg opacity-80">Coming soon...</p>
        </div>
      </section>

      {/* Projects Section - Placeholder */}
      <section id="projects" className="min-h-screen w-full flex items-center justify-center px-4 sm:px-6 md:px-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-4">Projects</h2>
          <p className="text-lg opacity-80">Coming soon...</p>
        </div>
      </section>

      {/* Contact Section - Placeholder */}
      <section id="contact" className="min-h-screen w-full flex items-center justify-center px-4 sm:px-6 md:px-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-4">Contact</h2>
          <p className="text-lg opacity-80">Coming soon...</p>
        </div>
      </section>

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
