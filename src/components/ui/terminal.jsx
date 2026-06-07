"use client";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import { BackgroundGradient } from "@/components/ui/background-gradient";

const KEY_SOUNDS_DOWN = {
  A: [31542, 85],
  B: [40621, 107],
  C: [39632, 95],
  D: [32492, 85],
  E: [23317, 83],
  F: [32973, 87],
  G: [33453, 94],
  H: [33986, 93],
  I: [25795, 91],
  J: [34425, 88],
  K: [34932, 90],
  L: [35410, 95],
  M: [41610, 93],
  N: [41103, 90],
  O: [26309, 84],
  P: [26804, 83],
  Q: [22245, 95],
  R: [23817, 92],
  S: [32031, 88],
  T: [24297, 92],
  U: [25313, 95],
  V: [40136, 94],
  W: [22790, 89],
  X: [39148, 76],
  Y: [24811, 93],
  Z: [38694, 80],
  " ": [51541, 144],
  "-": [42594, 90],
  "@": [23317, 83],
  "/": [42594, 90],
  ".": [42594, 90],
  ":": [42594, 90],
  0: [26309, 84],
  1: [25313, 95],
  2: [23317, 83],
  3: [23817, 92],
  4: [24297, 92],
  5: [24811, 93],
  6: [25313, 95],
  7: [25795, 91],
  8: [26309, 84],
  9: [26804, 83],
  Enter: [19065, 110],
};

const KEY_SOUNDS_UP = {
  A: [31632, 80],
  B: [40736, 95],
  C: [39732, 85],
  D: [32577, 80],
  E: [23402, 80],
  F: [33063, 80],
  G: [33553, 85],
  H: [34081, 85],
  I: [25890, 85],
  J: [34515, 85],
  K: [35027, 85],
  L: [35510, 85],
  M: [41710, 85],
  N: [41198, 85],
  O: [26394, 80],
  P: [26889, 80],
  Q: [22345, 85],
  R: [23912, 85],
  S: [32121, 80],
  T: [24392, 85],
  U: [25413, 85],
  V: [40236, 85],
  W: [22880, 85],
  X: [39228, 70],
  Y: [24911, 85],
  Z: [38779, 75],
  " ": [51691, 130],
  "-": [42689, 85],
  "@": [23402, 80],
  "/": [42689, 85],
  ".": [42689, 85],
  ":": [42689, 85],
  0: [26394, 80],
  1: [25413, 85],
  2: [23402, 80],
  3: [23912, 85],
  4: [24392, 85],
  5: [24911, 85],
  6: [25413, 85],
  7: [25890, 85],
  8: [26394, 80],
  9: [26889, 80],
  Enter: [19180, 100],
};

function useAudio(enabled) {
  const ctxRef = useRef(null);
  const bufferRef = useRef(null);
  const readyRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    const init = async () => {
      try {
        ctxRef.current = new AudioContext();
        const res = await fetch("/sounds/sound.ogg");
        if (!res.ok) return;
        bufferRef.current = await ctxRef.current.decodeAudioData(
          await res.arrayBuffer(),
        );
        readyRef.current = true;
      } catch {
        readyRef.current = false;
      }
    };
    init();
    return () => {
      ctxRef.current?.close();
    };
  }, [enabled]);

  const playSound = (sound) => {
    if (!readyRef.current || !ctxRef.current || !bufferRef.current || !sound)
      return;
    if (ctxRef.current.state === "suspended") ctxRef.current.resume();
    const src = ctxRef.current.createBufferSource();
    src.buffer = bufferRef.current;
    src.connect(ctxRef.current.destination);
    src.start(0, sound[0] / 1000, sound[1] / 1000);
  };

  const down = (key) =>
    playSound(KEY_SOUNDS_DOWN[key.toUpperCase()] || KEY_SOUNDS_DOWN[key]);
  const up = (key) =>
    playSound(KEY_SOUNDS_UP[key.toUpperCase()] || KEY_SOUNDS_UP[key]);

  return { down, up };
}

function useInView(ref, once = true) {
  const [inView, setInView] = useState(false);
  const triggered = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || (once && triggered.current)) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered.current) {
          setInView(true);
          if (once) {
            triggered.current = true;
            observer.disconnect();
          }
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, once]);

  return inView;
}

function tokenizeBash(text) {
  const tokens = [];
  const words = text.split(/(\s+)/);

  let isFirstWord = true;

  for (const word of words) {
    if (/^\s+$/.test(word)) {
      tokens.push({ type: "default", value: word });
      continue;
    }

    if (word.startsWith("#")) {
      tokens.push({ type: "comment", value: word });
      continue;
    }

    if (word.startsWith("$")) {
      tokens.push({ type: "variable", value: word });
      isFirstWord = false;
      continue;
    }

    if (word.startsWith("--") || word.startsWith("-")) {
      tokens.push({ type: "flag", value: word });
      isFirstWord = false;
      continue;
    }

    if (/^["'].*["']$/.test(word)) {
      tokens.push({ type: "string", value: word });
      isFirstWord = false;
      continue;
    }

    if (/^\d+$/.test(word)) {
      tokens.push({ type: "number", value: word });
      isFirstWord = false;
      continue;
    }

    if (/^[|>&<]+$/.test(word)) {
      tokens.push({ type: "operator", value: word });
      isFirstWord = true;
      continue;
    }

    if (word.includes("/") || word.startsWith(".") || word.startsWith("~")) {
      tokens.push({ type: "path", value: word });
      isFirstWord = false;
      continue;
    }

    if (isFirstWord) {
      tokens.push({ type: "command", value: word });
      isFirstWord = false;
      continue;
    }

    tokens.push({ type: "default", value: word });
  }

  return tokens;
}

const tokenColors = {
  command: "text-violet-300",
  flag: "text-fuchsia-300",
  string: "text-amber-300",
  number: "text-purple-300",
  operator: "text-rose-400",
  path: "text-indigo-300",
  variable: "text-pink-300",
  comment: "text-neutral-500",
  default: "text-neutral-300",
};

function SyntaxHighlightedText({ text }) {
  const tokens = tokenizeBash(text);

  return (
    <>
      {tokens.map((token, i) => (
        <span key={i} className={tokenColors[token.type]}>
          {token.value}
        </span>
      ))}
    </>
  );
}

export const Terminal = forwardRef(function Terminal(
  {
  commands = ["npx shadcn@latest init"],
  outputs = {},
  username = "Manus-Macbook",
  className,
  interactive = false,
  initialLines = [],
  currentPath = "~",
  inputPlaceholder = "type a command",
  onCommand,
  terminalSlot,
  contentClassName,
  autocompleteOptions = [],
  typingSpeed = 50,
  delayBetweenCommands = 800,
  initialDelay = 500,
  enableSound = true,
  },
  ref,
) {
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const inputRef = useRef(null);
  const inView = useInView(containerRef);
  const { down, up } = useAudio(enableSound);

  const [lines, setLines] = useState([]);
  const [currentText, setCurrentText] = useState("");
  const [commandIdx, setCommandIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [outputIdx, setOutputIdx] = useState(-1);
  const [phase, setPhase] = useState("idle");
  const [cursorVisible, setCursorVisible] = useState(true);
  const [inputValue, setInputValue] = useState("");

  const currentCommand = commands[commandIdx] || "";
  const currentOutputs = useMemo(
    () => outputs[commandIdx] || [],
    [outputs, commandIdx],
  );
  const isLastCommand = commandIdx === commands.length - 1;

  useEffect(() => {
    if (interactive) return;
    if (!inView || phase !== "idle") return;
    const t = setTimeout(() => setPhase("typing"), initialDelay);
    return () => clearTimeout(t);
  }, [interactive, inView, phase, initialDelay]);

  useEffect(() => {
    if (interactive) return;
    if (phase !== "typing") return;

    if (charIdx < currentCommand.length) {
      const char = currentCommand[charIdx];
      down(char);
      const t = setTimeout(
        () => {
          up(char);
          setCurrentText(currentCommand.slice(0, charIdx + 1));
          setCharIdx((c) => c + 1);
        },
        typingSpeed + Math.random() * 30,
      );
      return () => clearTimeout(t);
    } else {
      down("Enter");
      const t = setTimeout(() => {
        up("Enter");
        setPhase("executing");
      }, 80);
      return () => clearTimeout(t);
    }
  }, [interactive, phase, charIdx, currentCommand, typingSpeed, down, up]);

  useEffect(() => {
    if (interactive) return;
    if (phase !== "executing") return;

    setLines((prev) => [...prev, { type: "command", content: currentCommand }]);
    setCurrentText("");

    if (currentOutputs.length > 0) {
      setOutputIdx(0);
      setPhase("outputting");
    } else if (isLastCommand) {
      setPhase("done");
    } else {
      setPhase("pausing");
    }
  }, [interactive, phase, currentCommand, currentOutputs.length, isLastCommand]);

  useEffect(() => {
    if (interactive) return;
    if (phase !== "outputting") return;

    if (outputIdx >= 0 && outputIdx < currentOutputs.length) {
      const t = setTimeout(() => {
        setLines((prev) => [
          ...prev,
          { type: "output", content: currentOutputs[outputIdx] },
        ]);
        setOutputIdx((i) => i + 1);
      }, 150);
      return () => clearTimeout(t);
    } else if (outputIdx >= currentOutputs.length) {
      const t = setTimeout(() => {
        if (isLastCommand) {
          setPhase("done");
        } else {
          setPhase("pausing");
        }
      }, 300);
      return () => clearTimeout(t);
    }
  }, [interactive, phase, outputIdx, currentOutputs, isLastCommand]);

  useEffect(() => {
    if (interactive) return;
    if (phase !== "pausing") return;
    const t = setTimeout(() => {
      setCharIdx(0);
      setOutputIdx(-1);
      setCommandIdx((c) => c + 1);
      setPhase("typing");
    }, delayBetweenCommands);
    return () => clearTimeout(t);
  }, [interactive, phase, delayBetweenCommands]);

  useEffect(() => {
    if (!interactive) return;
    setLines(initialLines);
  }, [interactive, initialLines]);

  useEffect(() => {
    const interval = setInterval(() => setCursorVisible((v) => !v), 530);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [lines, phase, inputValue]);

  const submitInteractiveCommand = useCallback(() => {
    const command = inputValue.trim();
    if (!command) return;

    down("Enter");
    window.setTimeout(() => up("Enter"), 70);

    const result = onCommand?.(command) || {};
    const nextOutput = Array.isArray(result.output)
      ? result.output
      : [String(result.output || "")].filter(Boolean);
    const nextLines = nextOutput.map((content) => ({ type: "output", content }));

    if (result.view) {
      const viewLineIndex = nextLines.findIndex(
        (line) => line.content === result.view.matchLine,
      );

      if (viewLineIndex >= 0) {
        nextLines[viewLineIndex] = {
          type: "view",
          content: result.view.matchLine,
          onMouseEnter: result.view.onMouseEnter,
          onMouseLeave: result.view.onMouseLeave,
        };
      }
    }

    const previousLines = result.clear ? [] : lines;

    setLines([
      ...previousLines,
      { type: "command", content: command, path: currentPath },
      ...nextLines,
    ]);
    setInputValue("");
  }, [currentPath, down, inputValue, lines, onCommand, up]);

  const commitInteractiveCommand = (event) => {
    event.preventDefault();
    submitInteractiveCommand();
  };

  const getLongestCommonPrefix = useCallback((values) => {
    if (values.length === 0) return "";

    return values.reduce((prefix, value) => {
      let index = 0;
      while (index < prefix.length && prefix[index] === value[index]) {
        index += 1;
      }
      return prefix.slice(0, index);
    });
  }, []);

  const completeInteractiveInput = useCallback(() => {
    const rawValue = inputValue;
    const leadingWhitespace = rawValue.match(/^\s*/)?.[0] || "";
    const value = rawValue.trimStart();
    const hasTrailingSpace = /\s$/.test(value);
    const [command = "", ...rest] = value.split(/\s+/);
    const commandOptions = ["cat", "clear", "help", "ls"];

    if (!value || (!value.includes(" ") && !hasTrailingSpace)) {
      if (!value) {
        setInputValue("ls");
        return;
      }

      const matches = commandOptions.filter((option) =>
        option.startsWith(command),
      );

      if (matches.length === 1) {
        setInputValue(`${leadingWhitespace}${matches[0]}`);
        return;
      }

      const prefix = getLongestCommonPrefix(matches);
      if (prefix && prefix.length > command.length) {
        setInputValue(`${leadingWhitespace}${prefix}`);
        return;
      }

      if (matches.length > 1) {
        setLines((prev) => [
          ...prev,
          { type: "output", content: matches.join("    ") },
        ]);
      }
      return;
    }

    if (command !== "cat") return;

    const partial = hasTrailingSpace ? "" : rest.join(" ");
    const matches = autocompleteOptions.filter((option) =>
      option.startsWith(partial),
    );

    if (matches.length === 1) {
      setInputValue(`${leadingWhitespace}cat ${matches[0]}`);
      return;
    }

    const prefix = getLongestCommonPrefix(matches);
    if (prefix && prefix.length > partial.length) {
      setInputValue(`${leadingWhitespace}cat ${prefix}`);
      return;
    }

    if (matches.length > 1) {
      setLines((prev) => [
        ...prev,
        { type: "output", content: matches.join("    ") },
      ]);
    }
  }, [autocompleteOptions, getLongestCommonPrefix, inputValue]);

  const focusInteractiveInput = useCallback(() => {
    if (interactive) inputRef.current?.focus();
  }, [interactive]);

  useImperativeHandle(
    ref,
    () => ({
      sendKey(key) {
        if (!interactive) return;

        if (key === "Enter") {
          submitInteractiveCommand();
          return;
        }

        if (key === "Backspace") {
          down("Backspace");
          window.setTimeout(() => up("Backspace"), 45);
          setInputValue((value) => value.slice(0, -1));
          return;
        }

        if (key === "Tab") {
          down("Tab");
          window.setTimeout(() => up("Tab"), 45);
          completeInteractiveInput();
          return;
        }

        if (key === "Escape") {
          setInputValue("");
          return;
        }

        if (key.length === 1) {
          down(key);
          window.setTimeout(() => up(key), 45);
          setInputValue((value) => `${value}${key}`);
        }
      },
      focus() {
        focusInteractiveInput();
      },
    }),
    [
      completeInteractiveInput,
      down,
      focusInteractiveInput,
      interactive,
      submitInteractiveCommand,
      up,
    ],
  );

  const handleInteractiveKeyDown = (event) => {
    if (event.key === "Tab") {
      event.preventDefault();
      completeInteractiveInput();
      return;
    }

    if (event.key.length === 1) {
      down(event.key);
      window.setTimeout(() => up(event.key), 45);
    }
  };

  const makePrompt = (path = "~") => (
    <span className="text-neutral-500">
      <span className="text-violet-300">{username}</span>
      <span className="text-fuchsia-500">:</span>
      <span className="text-purple-300">{path}</span>
      <span className="text-neutral-500">$</span>{" "}
    </span>
  );

  const prompt = makePrompt(interactive ? currentPath : "~");

  return (
    <div
      ref={containerRef}
      className={cn(
        "mx-auto w-full max-w-xl px-4 font-mono text-xs",
        className,
      )}
    >
      <div className="overflow-hidden rounded-lg border border-purple-500/20 bg-neutral-900 shadow-2xl shadow-purple-950/30">
        {/* Title Bar */}
        <div className="flex items-center gap-2 border-b border-purple-500/10 bg-neutral-900 px-4 py-3">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500 transition-colors hover:bg-red-600" />
            <div className="h-3 w-3 rounded-full bg-yellow-500 transition-colors hover:bg-yellow-600" />
            <div className="h-3 w-3 rounded-full bg-green-500 transition-colors hover:bg-green-600" />
          </div>
          <div className="flex-1 text-center">
            <span className="truncate text-xs text-neutral-400">
              {username} — bash
            </span>
          </div>
          <div className="w-[52px]" />
        </div>

        {/* Terminal Content */}
        <div
          ref={contentRef}
          className={cn(
            "no-visible-scrollbar h-80 overflow-y-auto p-4 font-mono",
            interactive && "cursor-text",
            contentClassName,
          )}
          onClick={focusInteractiveInput}
        >
          {lines.map((line, i) => (
            <div key={i} className="leading-relaxed whitespace-pre-wrap">
              {line.type === "command" ? (
                <span>
                  {makePrompt(line.path || "~")}
                  <SyntaxHighlightedText text={line.content} />
                </span>
              ) : line.type === "view" ? (
                <BackgroundGradient
                  containerClassName="inline-block rounded-lg align-middle"
                  className="rounded-[7px] bg-neutral-900 px-4 py-2 text-purple-100"
                  glowClassName="opacity-30 blur-md"
                  gradientClassName="opacity-80"
                  onMouseEnter={line.onMouseEnter}
                  onMouseLeave={line.onMouseLeave}
                >
                  {line.content}
                </BackgroundGradient>
              ) : (
                <span className="text-neutral-400">{line.content}</span>
              )}
            </div>
          ))}

          {terminalSlot && <div className="my-4">{terminalSlot}</div>}

          {interactive && (
            <form
              className="flex min-w-0 items-center leading-relaxed"
              onClick={focusInteractiveInput}
              onSubmit={commitInteractiveCommand}
            >
              {prompt}
              <input
                ref={inputRef}
                aria-label="Terminal command"
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect="off"
                className="ml-1 min-w-[1ch] bg-transparent text-neutral-200 caret-transparent outline-none placeholder:text-neutral-600"
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={handleInteractiveKeyDown}
                placeholder={inputPlaceholder}
                spellCheck="false"
                style={{
                  width: `${Math.max(
                    inputValue.length,
                    inputPlaceholder.length,
                    1,
                  )}ch`,
                }}
                value={inputValue}
              />
              <span
                className={cn(
                  "inline-block h-4 w-2 bg-neutral-300 align-middle transition-opacity duration-100",
                  !cursorVisible && "opacity-0",
                )}
              />
            </form>
          )}

          {!interactive && phase === "typing" && (
            <div className="leading-relaxed whitespace-pre-wrap">
              {prompt}
              <SyntaxHighlightedText text={currentText} />
              <span className="ml-0.5 inline-block h-4 w-2 bg-neutral-300 align-middle" />
            </div>
          )}

          {!interactive &&
            (phase === "done" ||
            phase === "pausing" ||
            phase === "outputting") && (
              <div className="leading-relaxed whitespace-pre-wrap">
                {prompt}
                <span
                  className={cn(
                    "inline-block h-4 w-2 bg-neutral-300 align-middle transition-opacity duration-100",
                    !cursorVisible && "opacity-0",
                  )}
                />
              </div>
            )}
        </div>
      </div>
    </div>
  );
});
