import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Code2,
  FileText,
  FolderOpen,
  GitFork,
  Star,
  Users,
  X,
} from "lucide-react";
import { Terminal } from "../ui/terminal";
import { Keyboard } from "../ui/keyboard";

const GITHUB_USERNAME = "jw7914";
const GITHUB_PROFILE_URL = `https://github.com/${GITHUB_USERNAME}`;
const GITHUB_API_URL = `https://api.github.com/users/${GITHUB_USERNAME}`;

const formatNumber = (value) =>
  Number.isFinite(value)
    ? new Intl.NumberFormat("en", { notation: "compact" }).format(value)
    : "—";

const jsonLines = (data) => JSON.stringify(data, null, 2).split("\n");
const VIEW_LABEL = "hover to preview component";
const VIEW_LINE = `  "view": "${VIEW_LABEL}"`;
const FALLBACK_PROFILE = {
  login: GITHUB_USERNAME,
  html_url: GITHUB_PROFILE_URL,
  name: "Jason Wu",
  bio: "GitHub profile data is unavailable right now.",
};
const TOP_LEVEL_JSON_FILES = [
  "profile.json",
  "repos.json",
  "languages.json",
  "activity.json",
  "home.json",
];

const responseLines = (data) => jsonLines({ data, view: VIEW_LABEL });
const toNumber = (value) => (Number.isFinite(value) ? value : null);
const toStringOrNull = (value) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const normalizeProfile = (data) => ({
  login: toStringOrNull(data?.login) || GITHUB_USERNAME,
  id: toNumber(data?.id),
  html_url: toStringOrNull(data?.html_url) || GITHUB_PROFILE_URL,
  name: toStringOrNull(data?.name) || "Jason Wu",
  bio: toStringOrNull(data?.bio),
  company: toStringOrNull(data?.company),
  location: toStringOrNull(data?.location),
  blog: toStringOrNull(data?.blog),
  public_repos: toNumber(data?.public_repos),
  followers: toNumber(data?.followers),
  following: toNumber(data?.following),
  created_at: toStringOrNull(data?.created_at),
  updated_at: toStringOrNull(data?.updated_at),
});

const normalizeRepo = (repo) => ({
  id: toNumber(repo?.id),
  name: toStringOrNull(repo?.name) || "untitled-repo",
  full_name: toStringOrNull(repo?.full_name),
  html_url: toStringOrNull(repo?.html_url),
  description: toStringOrNull(repo?.description),
  language: toStringOrNull(repo?.language),
  stargazers_count: toNumber(repo?.stargazers_count) ?? 0,
  forks_count: toNumber(repo?.forks_count) ?? 0,
  open_issues_count: toNumber(repo?.open_issues_count) ?? 0,
  created_at: toStringOrNull(repo?.created_at),
  updated_at: toStringOrNull(repo?.updated_at),
  pushed_at: toStringOrNull(repo?.pushed_at),
  archived: Boolean(repo?.archived),
  fork: Boolean(repo?.fork),
});

const getDateKey = (date) => date.toISOString().slice(0, 10);

const buildCommitActivity = (events) => {
  const today = new Date();
  const days = Array.from({ length: 28 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (27 - index));

    return {
      count: 0,
      date: getDateKey(date),
    };
  });

  const countsByDate = days.reduce((acc, day) => {
    acc[day.date] = 0;
    return acc;
  }, {});

  events.forEach((event) => {
    if (event?.type !== "PushEvent") return;

    const date = new Date(event.created_at);
    if (Number.isNaN(date.getTime())) return;

    const dateKey = getDateKey(date);
    if (!Object.prototype.hasOwnProperty.call(countsByDate, dateKey)) return;

    countsByDate[dateKey] += Array.isArray(event.payload?.commits)
      ? event.payload.commits.length
      : 0;
  });

  return days.map((day) => ({
    ...day,
    count: countsByDate[day.date],
  }));
};

const fetchGithubJson = async (url, signal) => {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    signal,
  });

  if (!response.ok) {
    let message = "GitHub API request failed";
    try {
      const body = await response.json();
      message = body?.message || message;
    } catch {
      // Keep the generic message when GitHub returns a non-JSON error body.
    }
    throw new Error(`HTTP ${response.status}: ${message}`);
  }

  return response.json();
};

const LanguageBar = ({ language, count, rank, total }) => {
  const width = total ? Math.max((count / total) * 100, 7) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-gray-200">{language}</span>
        <span className="text-gray-500">{rank}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
};

const getCommitCellClass = (count, max) => {
  if (!count) return "bg-gray-800";

  const level = max > 0 ? count / max : 0;
  if (level >= 0.75) return "bg-fuchsia-400";
  if (level >= 0.5) return "bg-purple-500";
  if (level >= 0.25) return "bg-violet-600";
  return "bg-violet-900";
};

export const GithubPage = () => {
  const terminalRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [repos, setRepos] = useState([]);
  const [commitActivity, setCommitActivity] = useState([]);
  const [githubStatus, setGithubStatus] = useState({
    error: null,
    fetchedAt: null,
    state: "loading",
  });
  const [terminalPath, setTerminalPath] = useState("~");
  const [componentPath, setComponentPath] = useState(null);
  const [showComponent, setShowComponent] = useState(false);

  const showPreview = () => {
    setShowComponent(true);
  };

  const handleVirtualKeyboardKey = useCallback((key) => {
    terminalRef.current?.sendKey(key);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadGithubStats = async () => {
      setGithubStatus({ error: null, fetchedAt: null, state: "loading" });

      try {
        const [profileResult, reposResult, eventsResult] =
          await Promise.allSettled([
            fetchGithubJson(GITHUB_API_URL, controller.signal),
            fetchGithubJson(
              `${GITHUB_API_URL}/repos?per_page=100&sort=updated&type=owner`,
              controller.signal,
            ),
            fetchGithubJson(
              `${GITHUB_API_URL}/events/public?per_page=100`,
              controller.signal,
            ),
          ]);

        if (profileResult.status === "fulfilled") {
          setProfile(normalizeProfile(profileResult.value));
        } else {
          setProfile(null);
        }

        if (
          reposResult.status === "fulfilled" &&
          Array.isArray(reposResult.value)
        ) {
          setRepos(
            reposResult.value
              .map(normalizeRepo)
              .filter((repo) => !repo.fork),
          );
        } else {
          setRepos([]);
        }

        if (
          eventsResult?.status === "fulfilled" &&
          Array.isArray(eventsResult.value)
        ) {
          setCommitActivity(buildCommitActivity(eventsResult.value));
        } else {
          setCommitActivity([]);
        }

        const errors = [profileResult, reposResult, eventsResult]
          .filter((result) => result.status === "rejected")
          .map((result) => result.reason?.message || "Unknown GitHub API error");

        setGithubStatus({
          error: errors.join(" | ") || null,
          fetchedAt: new Date().toISOString(),
          state: errors.length > 0 ? "partial" : "ready",
        });
      } catch (error) {
        if (error.name !== "AbortError") {
          setProfile(null);
          setRepos([]);
          setCommitActivity([]);
          setGithubStatus({
            error: error.message || "Unable to load GitHub data.",
            fetchedAt: null,
            state: "error",
          });
        }
      }
    };

    loadGithubStats();

    return () => {
      controller.abort();
    };
  }, []);

  const repoStats = useMemo(() => {
    const totals = repos.reduce(
      (acc, repo) => {
        acc.stars += repo.stargazers_count ?? 0;
        acc.forks += repo.forks_count ?? 0;

        if (repo.language) {
          acc.languages[repo.language] =
            (acc.languages[repo.language] || 0) + 1;
        }

        return acc;
      },
      { forks: 0, languages: {}, stars: 0 },
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
    0,
  );
  const displayProfile = profile || FALLBACK_PROFILE;
  const githubMeta = {
    source: "GitHub REST API",
    status: githubStatus.state,
    fetched_at: githubStatus.fetchedAt,
    error: githubStatus.error,
  };
  const commitTotal = commitActivity.reduce((total, day) => total + day.count, 0);
  const commitMax = Math.max(...commitActivity.map((day) => day.count), 0);

  const repoDirectories = useMemo(
    () =>
      repoStats.recentRepos.reduce((acc, repo) => {
        acc[`~/repos/${repo.name}`] = {
          type: "repo",
          title: repo.name,
          description: repo.description || "Public repository",
          repo,
          files: ["repository.json", ...TOP_LEVEL_JSON_FILES],
          commands: ["cat repository.json", "cat repos.json"],
        };
        return acc;
      }, {}),
    [repoStats.recentRepos],
  );

  const directories = useMemo(
    () => ({
      "~": {
        type: "home",
        title: "GitHub workspace",
        description:
          "A terminal-first map of Jason's GitHub profile. Start with ls, then cat a JSON file.",
        files: TOP_LEVEL_JSON_FILES,
        commands: ["ls", "cat repos.json", "cat profile.json", "help"],
      },
      "~/profile": {
        type: "profile",
        title: displayProfile.name,
        description: displayProfile.bio || "No GitHub bio set.",
        files: TOP_LEVEL_JSON_FILES,
        commands: ["cat profile.json", "cat home.json"],
      },
      "~/repos": {
        type: "repos",
        title: "Recently updated repositories",
        description: "Each repository is mocked as a readable JSON response.",
        files: [
          ...TOP_LEVEL_JSON_FILES,
          ...repoStats.recentRepos.map((repo) => `${repo.name}.json`),
        ],
        commands: ["ls", "cat <repo-name>.json", "cat repos.json"],
      },
      "~/languages": {
        type: "languages",
        title: "Language mix",
        description: "Repository counts grouped by primary language.",
        files: TOP_LEVEL_JSON_FILES,
        commands: ["cat languages.json", "cat home.json"],
      },
      "~/activity": {
        type: "activity",
        title: "Project signal",
        description:
          githubStatus.state === "loading"
            ? "Loading GitHub signals..."
            : "A compact readout of stars, forks, followers, and repos.",
        files: TOP_LEVEL_JSON_FILES,
        commands: ["cat activity.json", "cat home.json"],
      },
      ...repoDirectories,
    }),
    [displayProfile, githubStatus.state, repoDirectories, repoStats.recentRepos],
  );

  const terminalIntro = useMemo(
    () => [
      {
        type: "output",
        content: `Welcome to github://${GITHUB_USERNAME}. Run ls to inspect files.`,
      },
      {
        type: "output",
        content: "Try: ls, cat repos.json, cat profile.json, cat home.json, help",
      },
    ],
    [],
  );

  const getFileTarget = (fileName) => {
    if (fileName === "home.json") return "~";
    if (fileName === "profile.json") return "~/profile";
    if (fileName === "repos.json") return "~/repos";
    if (fileName === "languages.json") return "~/languages";
    if (fileName === "activity.json") return "~/activity";

    const repo = repoStats.recentRepos.find(
      (recentRepo) => `${recentRepo.name}.json` === fileName,
    );

    return repo ? `~/repos/${repo.name}` : null;
  };

  const readFile = (fileName) => {
    const currentDirectory = directories[terminalPath];

    if (fileName === "home.json") {
      return responseLines({
        meta: githubMeta,
        login: GITHUB_USERNAME,
        url: GITHUB_API_URL,
        html_url: GITHUB_PROFILE_URL,
        files: [
          "profile.json",
          "repos.json",
          "languages.json",
          "activity.json",
        ],
      });
    }

    if (fileName === "profile.json") {
      return responseLines({
        meta: githubMeta,
        login: GITHUB_USERNAME,
        id: profile?.id ?? null,
        html_url: displayProfile.html_url,
        name: displayProfile.name,
        bio: displayProfile.bio || null,
        company: profile?.company ?? null,
        location: profile?.location ?? null,
        blog: profile?.blog ?? null,
        public_repos: profile?.public_repos ?? null,
        followers: profile?.followers ?? null,
        following: profile?.following ?? null,
        created_at: profile?.created_at ?? null,
        updated_at: profile?.updated_at ?? null,
        recent_commit_activity: {
          days: commitActivity,
          total: commitTotal,
        },
      });
    }

    if (fileName === "repos.json") {
      return responseLines({
        meta: githubMeta,
        repositories: repoStats.recentRepos.map((repo) => ({
          id: repo.id ?? null,
          name: repo.name,
          full_name: repo.full_name ?? null,
          html_url: repo.html_url ?? null,
          description: repo.description ?? null,
          language: repo.language ?? null,
          stargazers_count: repo.stargazers_count,
          forks_count: repo.forks_count,
          open_issues_count: repo.open_issues_count,
          archived: repo.archived,
          updated_at: repo.updated_at ?? null,
          pushed_at: repo.pushed_at ?? null,
        })),
      });
    }

    if (fileName === "languages.json") {
      return responseLines({
        meta: githubMeta,
        total: languageTotal,
        languages: repoStats.topLanguages.map(([language, count]) => ({
          language,
          repositories: count,
        })),
      });
    }

    if (fileName === "activity.json") {
      return responseLines({
        meta: githubMeta,
        public_repos: profile?.public_repos ?? null,
        repository_stars: repoStats.stars,
        repository_forks: repoStats.forks,
        followers: profile?.followers ?? null,
      });
    }

    if (currentDirectory?.type === "repo") {
      if (fileName === "repository.json") {
        return responseLines({
          meta: githubMeta,
          id: currentDirectory.repo.id ?? null,
          name: currentDirectory.repo.name,
          full_name: currentDirectory.repo.full_name ?? null,
          html_url: currentDirectory.repo.html_url ?? null,
          description: currentDirectory.repo.description ?? null,
          language: currentDirectory.repo.language ?? null,
          stargazers_count: currentDirectory.repo.stargazers_count,
          forks_count: currentDirectory.repo.forks_count,
          open_issues_count: currentDirectory.repo.open_issues_count,
          archived: currentDirectory.repo.archived,
          created_at: currentDirectory.repo.created_at ?? null,
          updated_at: currentDirectory.repo.updated_at ?? null,
          pushed_at: currentDirectory.repo.pushed_at ?? null,
        });
      }
    }

    return [`cat: ${fileName}: No such .json file`];
  };

  const handleTerminalCommand = (rawCommand) => {
    const [command, ...args] = rawCommand.trim().split(/\s+/);
    const currentDirectory = directories[terminalPath];

    if (command === "help") {
      return {
        output: [
          "Commands: ls, cat <file>.json, clear, help",
          "Mock files like repos.json and profile.json return curl-style JSON.",
        ],
      };
    }

    if (command === "clear") {
      setComponentPath(null);
      setShowComponent(false);
      return {
        clear: true,
        output: ["Terminal cleared. Run ls to keep exploring."],
      };
    }

    if (command === "ls") {
      const fileLines = (currentDirectory?.files || []).map(
        (file) => `-rw-r--r--  ${file}`,
      );
      return {
        output: fileLines.length > 0 ? fileLines : ["No JSON files found."],
      };
    }

    if (command === "cd") {
      return { output: ["cd: disabled. Use cat <file>.json instead."] };
    }

    if (command === "cat") {
      const target = args.join(" ");
      const targetPath = getFileTarget(target);

      if (directories[targetPath]) {
        setTerminalPath(targetPath);
        setComponentPath(targetPath);
        setShowComponent(false);
        const view = {
          matchLine: VIEW_LINE,
          onMouseEnter: showPreview,
        };

        if (directories[targetPath].type === "repo") {
          return {
            output: responseLines({
              meta: githubMeta,
              id: directories[targetPath].repo.id ?? null,
              name: directories[targetPath].repo.name,
              full_name: directories[targetPath].repo.full_name ?? null,
              html_url: directories[targetPath].repo.html_url ?? null,
              description: directories[targetPath].repo.description ?? null,
              language: directories[targetPath].repo.language ?? null,
              stargazers_count: directories[targetPath].repo.stargazers_count,
              forks_count: directories[targetPath].repo.forks_count,
              open_issues_count: directories[targetPath].repo.open_issues_count,
              archived: directories[targetPath].repo.archived,
              created_at: directories[targetPath].repo.created_at ?? null,
              updated_at: directories[targetPath].repo.updated_at ?? null,
              pushed_at: directories[targetPath].repo.pushed_at ?? null,
            }),
            view,
          };
        }
        return { output: readFile(target), view };
      }

      if (
        target === "repository.json" &&
        currentDirectory?.type === "repo"
      ) {
        setComponentPath(terminalPath);
        setShowComponent(false);
        return {
          output: readFile(target),
          view: {
            matchLine: VIEW_LINE,
            onMouseEnter: showPreview,
          },
        };
      }

      return { output: readFile(target) };
    }

    return { output: [`${command}: command not found. Try help.`] };
  };

  const currentTerminalDirectory = directories[terminalPath] || directories["~"];
  const activeDirectory =
    directories[componentPath] || currentTerminalDirectory;
  const activeFileName =
    componentPath === "~"
      ? "home.json"
      : componentPath === "~/profile"
        ? "profile.json"
        : componentPath === "~/repos"
          ? "repos.json"
          : componentPath === "~/languages"
            ? "languages.json"
            : componentPath === "~/activity"
              ? "activity.json"
              : `${activeDirectory.title}.json`;

  const componentView = componentPath && showComponent ? (
    <div
      className="pointer-events-auto h-[80vh] w-[80vw] max-w-6xl overscroll-contain overflow-y-auto rounded-lg border border-white/10 bg-gray-900/95 p-6 font-sans shadow-2xl shadow-black/50 backdrop-blur"
      onTouchMove={(event) => event.stopPropagation()}
      onWheel={(event) => event.stopPropagation()}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-300">
            {activeFileName}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            {activeDirectory.title}
          </h2>
        </div>
        <div className="flex shrink-0 items-start gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-purple-400/20 bg-purple-400/10 text-purple-200">
            {activeDirectory.type === "repo" ? (
              <BookOpen size={20} />
            ) : activeDirectory.type === "languages" ? (
              <Code2 size={20} />
            ) : (
              <FolderOpen size={20} />
            )}
          </div>
          <button
            type="button"
            aria-label="Close preview"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-gray-400 transition hover:border-purple-400/40 hover:text-white"
            onClick={() => setShowComponent(false)}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {githubStatus.state !== "ready" && (
        <div className="mb-4 rounded-lg border border-purple-400/20 bg-purple-400/10 px-3 py-2 text-xs text-purple-100">
          {githubStatus.state === "loading"
            ? "Loading fresh GitHub data..."
            : githubStatus.error || "Some GitHub data is unavailable right now."}
        </div>
      )}

      {activeDirectory.type === "profile" && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-white/[0.04] p-3">
              <p className="text-xs text-gray-500">Repos</p>
              <p className="mt-1 text-lg font-semibold text-white">
                {formatNumber(profile?.public_repos)}
              </p>
            </div>
            <div className="rounded-lg bg-white/[0.04] p-3">
              <p className="text-xs text-gray-500">Followers</p>
              <p className="mt-1 text-lg font-semibold text-white">
                {formatNumber(profile?.followers)}
              </p>
            </div>
            <div className="rounded-lg bg-white/[0.04] p-3">
              <p className="text-xs text-gray-500">Following</p>
              <p className="mt-1 text-lg font-semibold text-white">
                {formatNumber(profile?.following)}
              </p>
            </div>
          </div>

          <section className="rounded-lg border border-white/10 bg-gray-950/40 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Recent commits
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  Public push activity from the last 28 days
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-purple-200">
                {formatNumber(commitTotal)}
              </p>
            </div>

            {commitActivity.length > 0 ? (
              <div
                className="grid gap-1"
                style={{ gridTemplateColumns: "repeat(14, minmax(0, 1fr))" }}
              >
                {commitActivity.map((day) => (
                  <div
                    key={day.date}
                    className={`aspect-square rounded-[3px] ${getCommitCellClass(
                      day.count,
                      commitMax,
                    )}`}
                    title={`${day.date}: ${day.count} commit${
                      day.count === 1 ? "" : "s"
                    }`}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-gray-400">
                Commit activity is unavailable right now.
              </div>
            )}
          </section>
        </div>
      )}

      {activeDirectory.type === "repos" && (
        <div className="space-y-3">
          {repoStats.recentRepos.length > 0 ? (
            repoStats.recentRepos.slice(0, 4).map((repo) => (
              <div
                key={repo.id ?? repo.name}
                className="rounded-lg border border-white/10 bg-gray-950/40 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-semibold text-white">
                    {repo.name}.json
                  </span>
                  <span className="shrink-0 text-xs text-gray-500">
                    {repo.language || "Code"}
                  </span>
                </div>
                <p className="mt-1 line-clamp-1 text-xs text-gray-500">
                  {repo.description || "Public repository"}
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-white/10 bg-gray-950/40 p-3 text-sm text-gray-400">
              Repository data is unavailable right now.
            </div>
          )}
        </div>
      )}

      {activeDirectory.type === "languages" && (
        <div className="space-y-4">
          {repoStats.topLanguages.length > 0 ? (
            repoStats.topLanguages.map(([language, count], index) => (
              <LanguageBar
                key={language}
                language={language}
                count={count}
                rank={index + 1}
                total={languageTotal}
              />
            ))
          ) : (
            <div className="rounded-lg border border-white/10 bg-gray-950/40 p-3 text-sm text-gray-400">
              Language data is unavailable right now.
            </div>
          )}
        </div>
      )}

      {activeDirectory.type === "activity" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-white/[0.04] p-3">
            <Star size={16} className="mb-2 text-purple-300" />
            <p className="text-lg font-semibold text-white">
              {formatNumber(repoStats.stars)}
            </p>
            <p className="text-xs text-gray-500">Stars</p>
          </div>
          <div className="rounded-lg bg-white/[0.04] p-3">
            <GitFork size={16} className="mb-2 text-purple-300" />
            <p className="text-lg font-semibold text-white">
              {formatNumber(repoStats.forks)}
            </p>
            <p className="text-xs text-gray-500">Forks</p>
          </div>
          <div className="rounded-lg bg-white/[0.04] p-3">
            <BookOpen size={16} className="mb-2 text-purple-300" />
            <p className="text-lg font-semibold text-white">
              {formatNumber(profile?.public_repos)}
            </p>
            <p className="text-xs text-gray-500">Repos</p>
          </div>
          <div className="rounded-lg bg-white/[0.04] p-3">
            <Users size={16} className="mb-2 text-purple-300" />
            <p className="text-lg font-semibold text-white">
              {formatNumber(profile?.followers)}
            </p>
            <p className="text-xs text-gray-500">Followers</p>
          </div>
        </div>
      )}

      {activeDirectory.type === "repo" && (
        <div>
          <div className="mb-4 flex items-center gap-3 rounded-lg border border-white/10 bg-gray-950/40 p-3">
            <FileText size={16} className="text-purple-300" />
            <span className="text-sm text-gray-300">
              repository.json returns this repo's mocked API payload.
            </span>
          </div>
          <a
            href={activeDirectory.repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-purple-400/40 bg-purple-500/10 px-3 py-2 text-sm font-semibold text-purple-200 transition hover:bg-purple-500/15"
          >
            Open repository
            <ArrowUpRight size={15} />
          </a>
        </div>
      )}
    </div>
  ) : null;

  return (
    <main
      className="h-screen overflow-hidden bg-gray-950 px-4 py-5 text-gray-300 antialiased max-h-[560px]:py-3 sm:py-6 md:px-6 md:py-8"
    >
      <div className="mx-auto flex h-full max-w-6xl flex-col">
        <header className="mb-4 flex h-11 shrink-0 items-center justify-between gap-3 rounded-lg border border-white/10 bg-gray-900/55 px-3 shadow-lg shadow-black/20 max-h-[560px]:mb-3 md:mb-5">
          <a
            href="/"
            className="inline-flex shrink-0 items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium text-gray-300 transition hover:bg-white/[0.04] hover:text-white"
          >
            <ArrowLeft size={14} />
            Portfolio
          </a>

          <p className="min-w-0 truncate text-center font-mono text-xs font-semibold text-purple-200">
            @{GITHUB_USERNAME}
          </p>

          <a
            href={GITHUB_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium text-gray-300 transition hover:bg-white/[0.04] hover:text-white"
          >
            GitHub
            <ArrowUpRight size={14} />
          </a>
        </header>

        <div className="flex min-h-0 flex-1 items-center">
        <section className="flex max-h-full w-full flex-col justify-center gap-5 sm:gap-6 md:gap-7">
          <div className="min-h-0">
            <Terminal
              ref={terminalRef}
              username={`${GITHUB_USERNAME}@portfolio`}
              className="max-w-none px-0"
              contentClassName="h-[clamp(8rem,38vh,20rem)] sm:h-[clamp(10rem,40vh,20rem)]"
              currentPath={terminalPath}
              enableSound={false}
              initialLines={terminalIntro}
              inputPlaceholder="ls"
              interactive
              autocompleteOptions={currentTerminalDirectory.files || []}
              onCommand={handleTerminalCommand}
            />
          </div>

          <div className="flex shrink-0 justify-center px-0 pb-1">
            <div className="w-fit max-w-full">
              <Keyboard
                capturePhysicalKeys
                className="![zoom:0.74] min-[380px]:![zoom:0.84] sm:![zoom:0.95] md:![zoom:1.2] lg:![zoom:1.5]"
                enableSound
                onKeyPress={handleVirtualKeyboardKey}
              />
            </div>
          </div>

          {componentView && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-6">
              {componentView}
            </div>
          )}
        </section>
        </div>
      </div>
    </main>
  );
};
