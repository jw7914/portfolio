import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Code2,
  GitFork,
  Github,
  Star,
  Users,
} from "lucide-react";

const GITHUB_USERNAME = "jw7914";
const GITHUB_PROFILE_URL = `https://github.com/${GITHUB_USERNAME}`;
const GITHUB_API_URL = `https://api.github.com/users/${GITHUB_USERNAME}`;

const formatNumber = (value) =>
  new Intl.NumberFormat("en", { notation: "compact" }).format(value || 0);

const StatCard = ({ icon: Icon, label, value }) => (
  <div className="rounded-lg border border-white/10 bg-gray-900/60 p-5">
    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
      {React.createElement(Icon, { size: 20 })}
    </div>
    <p className="text-2xl font-bold text-white">{formatNumber(value)}</p>
    <p className="mt-1 text-sm text-gray-400">{label}</p>
  </div>
);

const LanguageBar = ({ language, count, total }) => {
  const width = total ? Math.max((count / total) * 100, 7) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-gray-200">{language}</span>
        <span className="text-gray-500">{count}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-800">
        <div
          className="h-full rounded-full bg-cyan-400"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
};

const RepoCard = ({ repo }) => (
  <a
    href={repo.html_url}
    target="_blank"
    rel="noopener noreferrer"
    className="group block rounded-lg border border-white/10 bg-gray-900/45 p-5 transition duration-200 hover:-translate-y-0.5 hover:border-cyan-400/40 hover:bg-cyan-400/10"
  >
    <div className="mb-3 flex items-start justify-between gap-4">
      <h3 className="font-semibold text-white group-hover:text-cyan-200">
        {repo.name}
      </h3>
      <ArrowUpRight
        size={18}
        className="shrink-0 text-gray-500 transition group-hover:text-cyan-300"
      />
    </div>
    <p className="line-clamp-2 min-h-10 text-sm leading-5 text-gray-400">
      {repo.description || "Public repository"}
    </p>
    <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-gray-500">
      {repo.language && (
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-cyan-300" />
          {repo.language}
        </span>
      )}
      <span className="inline-flex items-center gap-1.5">
        <Star size={14} />
        {repo.stargazers_count}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <GitFork size={14} />
        {repo.forks_count}
      </span>
    </div>
  </a>
);

export const GithubPage = () => {
  const [profile, setProfile] = useState(null);
  const [repos, setRepos] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const controller = new AbortController();

    const loadGithubStats = async () => {
      try {
        const [profileResponse, reposResponse] = await Promise.all([
          fetch(GITHUB_API_URL, { signal: controller.signal }),
          fetch(`${GITHUB_API_URL}/repos?per_page=100&sort=updated`, {
            signal: controller.signal,
          }),
        ]);

        if (!profileResponse.ok || !reposResponse.ok) {
          throw new Error("GitHub API request failed");
        }

        const [profileData, reposData] = await Promise.all([
          profileResponse.json(),
          reposResponse.json(),
        ]);

        setProfile(profileData);
        setRepos(reposData.filter((repo) => !repo.fork));
        setStatus("ready");
      } catch (error) {
        if (error.name !== "AbortError") {
          setStatus("error");
        }
      }
    };

    loadGithubStats();

    return () => controller.abort();
  }, []);

  const repoStats = useMemo(() => {
    const totals = repos.reduce(
      (acc, repo) => {
        acc.stars += repo.stargazers_count;
        acc.forks += repo.forks_count;

        if (repo.language) {
          acc.languages[repo.language] = (acc.languages[repo.language] || 0) + 1;
        }

        return acc;
      },
      { forks: 0, languages: {}, stars: 0 }
    );

    return {
      ...totals,
      topLanguages: Object.entries(totals.languages)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
      recentRepos: repos.slice(0, 6),
    };
  }, [repos]);

  const languageTotal = repoStats.topLanguages.reduce(
    (total, [, count]) => total + count,
    0
  );

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-8 text-gray-300 antialiased md:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-gray-900/70 px-4 py-2 text-sm font-medium text-gray-300 transition hover:border-cyan-400/40 hover:text-white"
          >
            <ArrowLeft size={16} />
            Portfolio
          </a>
          <a
            href={GITHUB_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/15"
          >
            Open GitHub
            <ArrowUpRight size={16} />
          </a>
        </div>

        <section className="mb-8 rounded-xl border border-white/10 bg-gradient-to-r from-gray-900 via-gray-900/90 to-cyan-950/30 p-6 shadow-2xl shadow-black/30 md:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <div className="mb-5 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/10 bg-gray-950 text-white">
                  <Github size={30} />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">
                    GitHub profile
                  </p>
                  <h1 className="mt-1 text-3xl font-bold tracking-tight text-white md:text-5xl">
                    {profile?.name || "Jason Wu"}
                  </h1>
                </div>
              </div>
              <p className="max-w-2xl text-base leading-7 text-gray-400 md:text-lg">
                {profile?.bio ||
                  "A native look at selected public GitHub activity, repositories, and languages."}
              </p>
            </div>

            <div className="rounded-lg border border-white/10 bg-gray-950/60 p-5">
              <p className="text-sm text-gray-500">GitHub handle</p>
              <p className="mt-1 text-2xl font-bold text-white">
                @{GITHUB_USERNAME}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-white/[0.04] p-3">
                  <p className="text-gray-500">Public repos</p>
                  <p className="mt-1 font-semibold text-white">
                    {formatNumber(profile?.public_repos)}
                  </p>
                </div>
                <div className="rounded-lg bg-white/[0.04] p-3">
                  <p className="text-gray-500">Followers</p>
                  <p className="mt-1 font-semibold text-white">
                    {formatNumber(profile?.followers)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {status === "error" && (
          <div className="mb-8 rounded-lg border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">
            GitHub stats could not be loaded right now. The external GitHub link
            still works.
          </div>
        )}

        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={BookOpen}
            label="Public repositories"
            value={profile?.public_repos}
          />
          <StatCard icon={Star} label="Repository stars" value={repoStats.stars} />
          <StatCard icon={GitFork} label="Repository forks" value={repoStats.forks} />
          <StatCard icon={Users} label="Followers" value={profile?.followers} />
        </section>

        <section className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-xl border border-white/10 bg-gray-900/45 p-6">
            <div className="mb-6 flex items-center gap-3">
              <Code2 size={20} className="text-cyan-300" />
              <h2 className="text-xl font-semibold text-white">
                Top languages
              </h2>
            </div>
            <div className="space-y-5">
              {status === "loading" && (
                <p className="text-sm text-gray-500">Loading languages...</p>
              )}
              {status !== "loading" &&
                repoStats.topLanguages.map(([language, count]) => (
                  <LanguageBar
                    key={language}
                    language={language}
                    count={count}
                    total={languageTotal}
                  />
                ))}
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-white">
                Recently updated repositories
              </h2>
              <span className="hidden h-px flex-1 bg-gradient-to-r from-white/10 to-transparent sm:block" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {status === "loading" &&
                Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-40 animate-pulse rounded-lg border border-white/10 bg-gray-900/45"
                  />
                ))}
              {status !== "loading" &&
                repoStats.recentRepos.map((repo) => (
                  <RepoCard key={repo.id} repo={repo} />
                ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};
