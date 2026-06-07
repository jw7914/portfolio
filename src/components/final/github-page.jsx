import {
  useCallback,
  useEffect,
  useLayoutEffect,
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
  new Intl.NumberFormat("en", { notation: "compact" }).format(value || 0);

const jsonLines = (data) => JSON.stringify(data, null, 2).split("\n");
const VIEW_LABEL = "hover to preview component";
const VIEW_LINE = `  "view": "${VIEW_LABEL}"`;
const TOP_LEVEL_JSON_FILES = [
  "profile.json",
  "repos.json",
  "languages.json",
  "activity.json",
  "home.json",
];

const responseLines = (data) => jsonLines({ data, view: VIEW_LABEL });

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

export const GithubPage = () => {
  const terminalRef = useRef(null);
  const contentAreaRef = useRef(null);
  const terminalPanelRef = useRef(null);
  const keyboardPanelRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [repos, setRepos] = useState([]);
  const [terminalPath, setTerminalPath] = useState("~");
  const [componentPath, setComponentPath] = useState(null);
  const [showComponent, setShowComponent] = useState(false);
  const [dockKeyboard, setDockKeyboard] = useState(false);

  const showPreview = () => {
    setShowComponent(true);
  };

  const handleVirtualKeyboardKey = useCallback((key) => {
    terminalRef.current?.sendKey(key);
  }, []);

  useLayoutEffect(() => {
    const updateKeyboardPlacement = () => {
      const terminalPanel = terminalPanelRef.current;
      const keyboardPanel = keyboardPanelRef.current;
      const contentArea = contentAreaRef.current;

      if (!terminalPanel || !keyboardPanel || !contentArea) return;

      const contentAreaRect = contentArea.getBoundingClientRect();
      const terminalHeight = terminalPanel.offsetHeight;
      const keyboardHeight = keyboardPanel.offsetHeight;
      const bottomPadding = window.innerWidth >= 768 ? 32 : 24;
      const gap = 20;
      const availableHeight =
        window.innerHeight - contentAreaRect.top - bottomPadding;
      const neededHeight = terminalHeight + gap + keyboardHeight;

      setDockKeyboard(neededHeight > availableHeight);
    };

    updateKeyboardPlacement();

    const resizeObserver = new ResizeObserver(updateKeyboardPlacement);
    if (contentAreaRef.current) {
      resizeObserver.observe(contentAreaRef.current);
    }
    if (terminalPanelRef.current) {
      resizeObserver.observe(terminalPanelRef.current);
    }
    if (keyboardPanelRef.current) {
      resizeObserver.observe(keyboardPanelRef.current);
    }

    window.addEventListener("resize", updateKeyboardPlacement);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateKeyboardPlacement);
    };
  }, []);

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
      } catch (error) {
        if (error.name !== "AbortError") setRepos([]);
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
        acc.stars += repo.stargazers_count;
        acc.forks += repo.forks_count;

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
        title: profile?.name || "Jason Wu",
        description: profile?.bio || "No GitHub bio set.",
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
        description: "A compact readout of stars, forks, followers, and repos.",
        files: TOP_LEVEL_JSON_FILES,
        commands: ["cat activity.json", "cat home.json"],
      },
      ...repoDirectories,
    }),
    [profile, repoDirectories, repoStats.recentRepos],
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
        login: GITHUB_USERNAME,
        id: profile?.id || null,
        html_url: GITHUB_PROFILE_URL,
        name: profile?.name || "Jason Wu",
        bio: profile?.bio || null,
        public_repos: profile?.public_repos || 0,
        followers: profile?.followers || 0,
        following: profile?.following || 0,
      });
    }

    if (fileName === "repos.json") {
      return responseLines(
        repoStats.recentRepos.map((repo) => ({
          id: repo.id,
          name: repo.name,
          full_name: repo.full_name,
          html_url: repo.html_url,
          description: repo.description,
          language: repo.language,
          stargazers_count: repo.stargazers_count,
          forks_count: repo.forks_count,
          updated_at: repo.updated_at,
        })),
      );
    }

    if (fileName === "languages.json") {
      return responseLines({
        total: languageTotal,
        languages: repoStats.topLanguages.map(([language, count]) => ({
          language,
          repositories: count,
        })),
      });
    }

    if (fileName === "activity.json") {
      return responseLines({
        public_repos: profile?.public_repos || 0,
        repository_stars: repoStats.stars,
        repository_forks: repoStats.forks,
        followers: profile?.followers || 0,
      });
    }

    if (currentDirectory?.type === "repo") {
      if (fileName === "repository.json") {
        return responseLines({
          id: currentDirectory.repo.id,
          name: currentDirectory.repo.name,
          full_name: currentDirectory.repo.full_name,
          html_url: currentDirectory.repo.html_url,
          description: currentDirectory.repo.description,
          language: currentDirectory.repo.language,
          stargazers_count: currentDirectory.repo.stargazers_count,
          forks_count: currentDirectory.repo.forks_count,
          open_issues_count: currentDirectory.repo.open_issues_count,
          created_at: currentDirectory.repo.created_at,
          updated_at: currentDirectory.repo.updated_at,
          pushed_at: currentDirectory.repo.pushed_at,
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
              id: directories[targetPath].repo.id,
              name: directories[targetPath].repo.name,
              full_name: directories[targetPath].repo.full_name,
              html_url: directories[targetPath].repo.html_url,
              description: directories[targetPath].repo.description,
              language: directories[targetPath].repo.language,
              stargazers_count: directories[targetPath].repo.stargazers_count,
              forks_count: directories[targetPath].repo.forks_count,
              open_issues_count: directories[targetPath].repo.open_issues_count,
              created_at: directories[targetPath].repo.created_at,
              updated_at: directories[targetPath].repo.updated_at,
              pushed_at: directories[targetPath].repo.pushed_at,
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

      {activeDirectory.files?.length > 0 && (
        <div className="mb-5 grid gap-3 sm:grid-cols-2">
          {activeDirectory.files.map((file) => (
            <div
              key={file}
              className="flex items-center gap-3 rounded-lg border border-white/10 bg-gray-950/40 p-3"
            >
              <FileText size={16} className="text-purple-300" />
              <span className="text-sm font-medium text-gray-200">{file}</span>
            </div>
          ))}
        </div>
      )}

      {activeDirectory.type === "profile" && (
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
      )}

      {activeDirectory.type === "repos" && (
        <div className="space-y-3">
          {repoStats.recentRepos.slice(0, 4).map((repo) => (
            <div
              key={repo.id}
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
          ))}
        </div>
      )}

      {activeDirectory.type === "languages" && (
        <div className="space-y-4">
          {repoStats.topLanguages.map(([language, count], index) => (
            <LanguageBar
              key={language}
              language={language}
              count={count}
              rank={index + 1}
              total={languageTotal}
            />
          ))}
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
      className={`min-h-screen bg-gray-950 px-4 pt-6 text-gray-300 antialiased md:px-6 md:pt-8 ${
        dockKeyboard ? "pb-44 md:pb-56 lg:pb-64" : "pb-6 md:pb-8"
      }`}
    >
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col">
        <header className="mb-5 flex h-11 items-center justify-between gap-3 rounded-lg border border-white/10 bg-gray-900/55 px-3 shadow-lg shadow-black/20">
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

        <div ref={contentAreaRef} className="flex flex-1 items-center">
        <section className="w-full space-y-5">
          <div ref={terminalPanelRef}>
            <Terminal
              ref={terminalRef}
              username={`${GITHUB_USERNAME}@portfolio`}
              className="max-w-none px-0"
              currentPath={terminalPath}
              enableSound={false}
              initialLines={terminalIntro}
              inputPlaceholder="ls"
              interactive
              autocompleteOptions={currentTerminalDirectory.files || []}
              onCommand={handleTerminalCommand}
            />
          </div>

          <div
            ref={keyboardPanelRef}
            className={
              dockKeyboard
                ? "fixed right-0 bottom-0 left-0 z-40 border-t border-purple-500/20 bg-gray-950/95 px-2 pt-3 pb-4 shadow-2xl shadow-black/50 backdrop-blur"
                : "px-2 pt-1 pb-0"
            }
          >
            <div className="mx-auto max-w-[360px] overflow-x-auto md:max-w-[580px] lg:max-w-[760px]">
              <Keyboard
                capturePhysicalKeys
                className="![zoom:0.82] sm:![zoom:0.9] md:![zoom:1.2] lg:![zoom:1.55]"
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
