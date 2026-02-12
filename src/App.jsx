import React, { useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import {
  ArrowUpRight,
  Code,
  Folder,
  Mail,
  User,
  Github,
  Linkedin,
  Briefcase,
} from "lucide-react";
import { TypeWriterName } from "./components/final/typewriter-text";
import {
  GithubButton,
  LinkedInButton,
} from "./components/final/animated-buttons";
import { WavyBackground } from "./components/ui/wavy-background";
import { ContainerScroll } from "./components/ui/container-scroll-animation";
import ProjectScroll from "./components/final/project-scroll";
import ExperienceTimeline from "./components/final/experience-timeline";
import { SkillsSection } from "./components/final/skills-section";

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC;

const App = () => {
  const form = useRef();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);

  const sendEmail = (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(false);
    emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, form.current, PUBLIC_KEY).then(
      (result) => {
        setLoading(false);
        setSuccess(true);
        form.current.reset();
      },
      (error) => {
        setLoading(false);
        setError(true);
      }
    );
  };
  const navigation = [
    { name: "About", href: "#about", icon: <User size={16} /> },
    { name: "Experience", href: "#experience", icon: <Briefcase size={16} /> },
    { name: "Projects", href: "#projects", icon: <Folder size={16} /> },
  ];

  const SectionTitle = ({ children, className = "" }) => (
    <h2
      className={`text-3xl font-bold tracking-tight text-white mb-2 ${className}`}
    >
      {children}
    </h2>
  );

  const FloatingNav = () => (
    <nav className="fixed inset-x-0 top-6 z-[9999] mx-auto w-fit">
      <div className="flex items-center space-x-4 rounded-full border border-gray-700 bg-gray-900/50 px-4 py-2 backdrop-blur-md">
        {navigation.map((item) => (
          <a
            key={item.name}
            href={item.href}
            className="flex items-center space-x-2 rounded-full px-4 py-2 text-sm font-medium text-gray-300 transition-colors duration-200 hover:bg-gray-800 hover:text-white"
          >
            {item.icon}
            <span>{item.name}</span>
          </a>
        ))}
      </div>
    </nav>
  );

  return (
    <div
      className="min-h-screen bg-gray-950 text-gray-300 antialiased font-inter"
      style={{ colorScheme: "dark" }}
    >
      <FloatingNav />

      {/* Hero Section */}
      <section
        id="about"
        className="relative flex min-h-screen flex-col items-center justify-center p-8 text-center overflow-hidden py-42 md:py-60"
      >
        <div className="absolute inset-0 z-0 opacity-10 [mask-image:radial-gradient(100%_100%_at_top,transparent,black)]">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCI+PHBhdGggZD0iTTAgMGgwYzI3LjYxNCAwIDUwIDIyLjM4NiA1MCA1MHYwYzAtMjcuNjE0LTIyLjM4Ni01MC01MC01MHoiIGZpbGw9IiM2YmY3YmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PC9wYXRoPjwvc3ZnPg==')] bg-[size:30px_30px] opacity-10" />
        </div>

        <div className="relative z-10 max-w-3xl">
          <div className="flex w-full justify-center">
            <TypeWriterName className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-tight" />
          </div>

          <p className="mt-4 text-base sm:text-lg md:text-xl text-gray-400 max-w-xs sm:max-w-md md:max-w-2xl mx-auto px-2 sm:px-4 text-center">
            A student at New York University's Tandon School of Engineering
            pursuing a Bachelor of Science in Computer Science with a minor in
            Cybersecurity.
          </p>
          <div className="mt-8 flex justify-center space-x-4">
            <a
              href="https://github.com/jw7914"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
            >
              <GithubButton></GithubButton>
            </a>

            <a
              href="https://www.linkedin.com/in/jason-wu-jw7914/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
            >
              <LinkedInButton></LinkedInButton>
            </a>
          </div>
          <div className="mt-4 flex justify-center">
            <a
              href="#contact"
              className="group inline-flex items-center space-x-2 rounded-full border border-purple-500 bg-purple-600 px-6 py-3 text-sm font-medium text-white shadow-lg transition-colors duration-200 hover:bg-purple-700 hover:border-purple-400"
            >
              <Mail size={18} />
              <span>Contact Me</span>
            </a>
          </div>
        </div>
      </section>

      {/* Experiences Section */}
      <section
        id="experience"
        className="relative py-20 px-4 md:px-8 max-w-7xl mx-auto flex flex-col items-center justify-center overflow-visible"
      >
        <ExperienceTimeline />
      </section>

      {/* Projects Section */}
      <WavyBackground>
        <section id="projects" className="py-20 md:py-40 relative z-10 w-full flex flex-col items-center justify-center overflow-hidden">
          <ContainerScroll
            titleComponent={
              <>
                <h1 className="text-4xl font-semibold text-white dark:text-white mb-10">
                  Projects
                </h1>
              </>
            }
          >
            <ProjectScroll />
          </ContainerScroll>
        </section>
      </WavyBackground>

      {/* Skills Section */}
      <SkillsSection />

      {/* Contact Section */}
      <section id="contact" className="py-42 md:py-60 p-8 max-w-2xl mx-auto">
        <SectionTitle>Contact Me</SectionTitle>
        <p className="mt-4 text-gray-400">
          Feel free to reach out to me with any inquiries or just to say hello!
        </p>
        <form ref={form} className="mt-8 space-y-4" onSubmit={sendEmail}>
          <input
            type="text"
            name="name"
            id="name"
            placeholder="Your Name"
            className="w-full rounded-md border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
            required
          />
          <input
            type="email"
            name="email"
            id="email"
            placeholder="Your Email"
            className="w-full rounded-md border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
            required
          />
          <textarea
            name="Message"
            id="Message"
            placeholder="Your Message"
            rows="5"
            className="w-full rounded-md border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
            required
          />
          <button
            type="submit"
            className="group inline-flex w-full items-center justify-center rounded-full border border-gray-700 bg-gray-900 px-6 py-3 text-white transition-colors duration-200 hover:bg-gray-800"
            disabled={loading}
          >
            <Mail size={16} className="mr-2" />
            <span>{loading ? "Sending..." : "Send Message"}</span>
          </button>
          {success && (
            <p className="text-green-400">Message sent successfully!</p>
          )}
          {error && (
            <p className="text-red-400">
              Failed to send message. Please try again.
            </p>
          )}
        </form>
      </section>

      <footer className="py-8 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Jason Wu. All rights reserved.
      </footer>
    </div>
  );
};

export default App;
