import React from "react";

const skillsData = [
  {
    category: "Languages",
    summary: "Comfortable across frontend, backend, scripting, and data work.",
    skills: [
      {
        name: "JavaScript",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg",
      },
      {
        name: "Python",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg",
      },
      {
        name: "Java",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg",
      },
      {
        name: "C++",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg",
      },
      {
        name: "HTML",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg",
      },
      {
        name: "CSS",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg",
      },
      {
        name: "Bash",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bash/bash-original.svg",
      },
      {
        name: "SQL",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azuresqldatabase/azuresqldatabase-original.svg",
      },
    ],
  },
  {
    category: "Frameworks",
    summary: "Tools I use to build fast, maintainable web and API experiences.",
    skills: [
      {
        name: "React",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
        featured: true,
      },
      {
        name: "Flask",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flask/flask-original.svg",
        iconClassName: "dark:invert",
      },
      {
        name: "Node.js",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg",
        featured: true,
      },
      {
        name: "FastAPI",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/fastapi/fastapi-original.svg",
      },
    ],
  },
  {
    category: "Tools & Platforms",
    summary: "Version control, databases, deployment tooling, and cloud services.",
    skills: [
      {
        name: "Git",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg",
        featured: true,
      },
      {
        name: "Linux",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg",
      },
      {
        name: "Vite",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vitejs/vitejs-original.svg",
      },
      {
        name: "MySQL",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg",
      },
      {
        name: "PostgreSQL",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg",
        featured: true,
      },
      {
        name: "Supabase",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/supabase/supabase-original.svg",
      },
      {
        name: "Firebase",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-plain.svg",
      },
    ],
  },
];

const featuredSkills = skillsData
  .flatMap((group) => group.skills)
  .filter((skill) => skill.featured);

const SkillPill = ({ name, icon, iconClassName }) => (
  <li className="group flex min-w-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-gray-200 transition duration-200 hover:-translate-y-0.5 hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-white">
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-950/80 ring-1 ring-white/10">
      <img
        src={icon}
        alt=""
        aria-hidden="true"
        className={`h-4.5 w-4.5 object-contain transition-transform duration-200 group-hover:scale-110 ${
          iconClassName || ""
        }`}
      />
    </span>
    <span className="truncate font-medium">{name}</span>
  </li>
);

const FeaturedSkill = ({ name, icon, iconClassName }) => (
  <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-gray-950/60 px-4 py-3">
    <img
      src={icon}
      alt=""
      aria-hidden="true"
      className={`h-8 w-8 object-contain ${iconClassName || ""}`}
    />
    <span className="text-sm font-semibold text-white">{name}</span>
  </div>
);

export const SkillsSection = () => {
  return (
    <section id="skills" className="relative w-full overflow-hidden px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col gap-4 md:mb-12 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">
              Technical toolkit
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
              Skills without the clutter.
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-gray-400 md:text-base">
            A focused snapshot of the languages, frameworks, databases, and
            tooling I reach for when building practical software.
          </p>
        </div>

        <div className="mb-8 rounded-xl border border-white/10 bg-gradient-to-r from-gray-900 via-gray-900/80 to-cyan-950/30 p-4 shadow-2xl shadow-black/30 md:p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-400">
              Core stack
            </h3>
            <span className="hidden h-px flex-1 bg-gradient-to-r from-white/10 to-transparent sm:block" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {featuredSkills.map((skill) => (
              <FeaturedSkill key={skill.name} {...skill} />
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {skillsData.map((group) => (
            <article
              key={group.category}
              className="rounded-xl border border-white/10 bg-gray-900/45 p-5 shadow-xl shadow-black/20"
            >
              <div className="mb-5">
                <h3 className="text-lg font-semibold text-white">
                  {group.category}
                </h3>
                <p className="mt-2 text-sm leading-6 text-gray-400">
                  {group.summary}
                </p>
              </div>
              <ul className="flex flex-wrap gap-2.5">
                {group.skills.map((skill) => (
                  <SkillPill key={skill.name} {...skill} />
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
