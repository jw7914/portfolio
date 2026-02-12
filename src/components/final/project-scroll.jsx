import React from "react";
import { Code, ArrowUpRight } from "lucide-react";
import { Carousel } from "@/components/ui/cards-carousel";

// Project data moved from project-cards.jsx
const projects = [
  {
    title: "Game Search",
    description: "A web-app allowing users to search for their favorite games.",
    tags: ["React", "Flask", "Material-UI", "Bootstrap", "Firebase"],
    link: "https://gamesearching.vercel.app",
    src: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=3540&auto=format&fit=crop" // Placeholder image
  },
  {
    title: "Integrated Justice Records System",
    description:
      "A database course project allowing for querying of justice records.",
    tags: ["MySQL", "Flask", "HTML", "CSS", "Javascript"],
    link: "https://github.com/jw7914/jaildb",
    src: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=3540&auto=format&fit=crop" // Placeholder image
  },
  {
    title: "Open Quantum Safe",
    description:
      "Cryptography application to secure and verify retail and e-commerce transactions using an open quantum safe library to implement SPHINCS+ signature algorithm.",
    tags: ["Liboqs", "cryptography", "Python"],
    link: "https://github.com/jw7914/comp_sec-assignment3",
    src: "https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=3272&auto=format&fit=crop" // Placeholder image
  },
  {
    title: "ChowPal",
    description:
      "Web-app to allow diners to find socially connect with people who are interested in the same resturants.",
    tags: ["FastAPI", "React", "Firebase", "Google Places API"],
    link: "https://github.com/jw7914/ChowPal",
    src: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=3540&auto=format&fit=crop" // Placeholder image
  },
];

export default function ProjectScroll() {
  const cards = projects.map((project, index) => (
    <div 
      key={index} 
      className="group rounded-xl border border-gray-800 bg-gray-900/50 p-6 shadow-lg backdrop-blur-md transition-all duration-300 hover:border-gray-700 hover:bg-gray-900 w-[20rem] md:w-[30rem] h-[20rem] flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center space-x-3 mb-4">
          <Code size={24} className="text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">{project.title}</h3>
        </div>
        <p className="text-gray-400 mb-4">{project.description}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {project.tags.map((tag, i) => (
            <span
              key={i}
              className="rounded-full bg-gray-800 px-3 py-1 text-xs font-medium text-gray-400"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      <a
        href={project.link}
        className="inline-flex items-center text-sm font-medium text-white transition-colors duration-200 hover:text-cyan-400"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span>View Project</span>
        <ArrowUpRight size={14} className="ml-1" />
      </a>
    </div>
  ));

  return (
    <div className="w-full h-full py-20">
      <Carousel items={cards} />
    </div>
  );
}
