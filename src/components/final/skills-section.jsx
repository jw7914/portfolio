import React from "react";
import { motion } from "motion/react";

const skillsData = [
  {
    category: "Languages",
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
    ],
  },
  {
    category: "Frameworks & Libraries",
    skills: [
      {
        name: "React",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
      },
      {
        name: "Flask",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flask/flask-original.svg",
        iconClassName: "dark:invert",
      },
      {
        name: "Node.js",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg",
      },
    ],
  },
  {
      category: "Tools & Others",
      skills: [
           {
            name: "Git",
            icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg"
           },
           {
            name: "Linux",
             icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg"
           }
      ]
  }
];

import { CometCard } from "../ui/comet-card";

const SkillCard = ({ name, icon, iconClassName }) => {
  return (
    <CometCard className="w-full h-full cursor-pointer">
      <div className="group relative flex items-center justify-between p-6 rounded-xl bg-gray-900 border border-gray-800 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 w-full h-full">
        <div className="relative z-10">
          <span className="text-xl font-bold text-gray-100 group-hover:text-purple-400 transition-colors">
            {name}
          </span>
        </div>
        <div className="relative z-10 w-12 h-12">
          <img
            src={icon}
            alt={name}
            className={`w-full h-full object-contain filter drop-shadow-lg transition-transform duration-300 group-hover:scale-110 ${
              iconClassName || ""
            }`}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-300" />
      </div>
    </CometCard>
  );
};

export const SkillsSection = () => {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-20">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-400">
          Technical Skills
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {skillsData.map((category, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="space-y-4"
          >
            <h3 className="text-xl font-semibold text-purple-400 border-b border-gray-800 pb-2 mb-4">
              {category.category}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-items-center">
              {category.skills.map((skill, skillIdx) => (
                <SkillCard key={skillIdx} {...skill} />
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
