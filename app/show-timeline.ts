// ── The Rohey show timeline ──────────────────────────────────────────────
// Clips live in /public/rohey-clips/{1..24}.mp4 and map 1:1 to the numbered
// items in ROHEY_FULL_PRODUCTION_BREAKDOWN.md.
//
// Two kinds of clips:
//   • SCRIPT clip  → the avatar talking-head WITH audio (the part that matters).
//   • ACTION clip  → a silent generated action (entrance, map, writing, point,
//                    walk-out, idle loop). These are MUTED and layered on top
//                    of the script clip, then fade out to reveal it.
//
// The operator drives the show one Step at a time (the only button is "Next").
// Steps default to the idle loop when they finish, EXCEPT steps flagged
// autoAdvance — those flow straight into the next step with no idle gap.
// Steps flagged endAlign delay the shorter of (main, overlay) so both clips
// END together (e.g. the walk-out starts near the end of the break line).

export const CLIP = (n: number) => `https://storage.googleapis.com/virtual-teacher-project-501606.firebasestorage.app/rohey-clips/${n}.mp4`;

export const IDLE_CLIP = 10; // silent nodding / listening loop

export type StepKind = "play" | "walkout" | "return" | "question" | "options";

export interface StepOption {
  clip: number; // script clip with audio
  label: string; // short button label
  guidance: string; // "if the guest said … pick this"
  caption: string;
}

export interface Step {
  id: number;
  label: string; // operator-facing step name
  kind: StepKind;
  main?: number; // audio-bearing script clip
  overlay?: number; // silent action clip layered at the start
  audioDelayMs?: number; // delay before the script/audio starts (entrances)
  caption?: string; // subtitle shown on stage
  pointClip?: number; // question steps: the "point at someone" clip
  idleClip?: number; // question steps: which idle loop to hold
  options?: StepOption[];
  nextLabel?: string; // custom label for the Next button after this step
  autoAdvance?: boolean; // when this step's content ends, play the next step immediately (no idle)
  endAlign?: boolean; // delay the shorter of main/overlay so both clips end together
}

// The stage directive shape shared by the operator console and the stage.
export interface StepDirective {
  started: boolean;
  mode: "idle" | "segment" | "freeze";
  stepIndex: number;
  mainClip: number | null;
  overlayClip: number | null;
  audioDelayMs: number;
  endAlign: boolean;
  caption: string;
  token: number;
  paused: boolean;
}

// Build the directive for a step. Used by the operator's Next button AND by
// the auto-advance path on both screens — callers pass a deterministic token
// (previous token + 1) so simultaneous auto-advance posts are idempotent.
export function buildStepDirective(steps: Step[], i: number, token: number): StepDirective {
  const step = steps[i];
  const base = {
    started: true,
    stepIndex: i,
    token,
    caption: step.caption ?? "",
    paused: false,
    endAlign: !!step.endAlign,
  };
  if (step.kind === "walkout") {
    return { ...base, mode: "freeze", overlayClip: step.overlay ?? null, mainClip: step.main ?? null, audioDelayMs: 0 };
  }
  if (step.kind === "options") {
    // Idle; wait for the operator to pick a response.
    return { ...base, mode: "idle", overlayClip: null, mainClip: null, audioDelayMs: 0, caption: "" };
  }
  if (step.kind === "question") {
    return { ...base, mode: "idle", overlayClip: null, mainClip: null, audioDelayMs: 0 };
  }
  return {
    ...base,
    mode: "segment",
    overlayClip: step.overlay ?? null,
    mainClip: step.main ?? null,
    audioDelayMs: step.audioDelayMs ?? 0,
  };
}

export function getStepVideos(step: Step): string {
  if (!step) return "";
  const nums: number[] = [];
  if (step.overlay != null) nums.push(step.overlay);
  if (step.main != null) nums.push(step.main);
  if (step.pointClip != null) nums.push(step.pointClip);
  if (step.idleClip != null) nums.push(step.idleClip);
  if (step.options != null) {
    step.options.forEach(o => {
      if (o.clip != null) nums.push(o.clip);
    });
  }
  const uniqueNums = Array.from(new Set(nums)).sort((a, b) => a - b);
  if (uniqueNums.length === 0) return "No Video";
  if (uniqueNums.length === 1) return `Video ${uniqueNums[0]}`;
  return `Videos ${uniqueNums.join(" & ")}`;
}

export const STEPS: Step[] = [
  // ── Video 1 ──────────────────────────────────────────────
  {
    id: 0,
    label: "Walk In & Welcome",
    kind: "play",
    overlay: 1, // entrance (silent)
    main: 2, // welcome script
    audioDelayMs: 2500, // let her walk in and set down her folder first
    autoAdvance: true, // no idle — straight into the Giga Map step
    caption:
      "Good evening, class. Welcome, everyone — it truly makes me happy to see you here.",
  },
  {
    id: 1,
    label: "The 1,978 Schools · Giga Map",
    kind: "play",
    overlay: 3,
    main: 4,
    autoAdvance: true, // no idle — straight into the Redesign Question
    caption:
      "1,978 schools in The Gambia — every one now mapped. Look at the red dots: the unconnected ones.",
  },
  {
    id: 2,
    label: "Redesign Question",
    kind: "play",
    overlay: 5, // writes the question on the board (silent)
    main: 5.5, // question audio plays under the board-writing clip
    endAlign: true, // audio starts late so it finishes as she steps back from the board
    autoAdvance: true, // no idle — straight into the break announcement
    caption:
      "If every child in The Gambia had internet access at school, how would you re-design education?",
  },
  {
    id: 3,
    label: "Break Announcement & Walk Out",
    kind: "walkout",
    main: 6, // "Ah, look at the time!" script
    overlay: 7, // walk-out starts near the end of the line; freeze on the empty room
    endAlign: true, // both clips end together — she walks out as the line lands
    caption:
      "Ah, look at the time! It's time for a break. Think about the question. Sit with it. Discuss it with your classmates at your table during the break. I will be back.",
    nextLabel: "Return from break",
  },

  // ── Video 2 ──────────────────────────────────────────────
  {
    id: 4,
    label: "Return from Break",
    kind: "return",
    overlay: 8, // walks back in (silent)
    main: 9,
    audioDelayMs: 2500, // let her settle before the audio starts
    caption: "Right, class — settle down please. Class is back in session.",
  },
  {
    id: 5,
    label: "Open Discussion",
    kind: "question",
    idleClip: 10,
    pointClip: 11,
    caption: "(Listening — press Point Out when a guest raises a hand.)",
  },
  {
    id: 6,
    label: "Respond to the Answer",
    kind: "options",
    options: [
      {
        clip: 13,
        label: "Remote learning",
        guidance: "Guest talked about online / remote classrooms, learning from afar.",
        caption: "Yes! A classroom without walls — Basse learning with Banjul, Dakar, Lagos.",
      },
      {
        clip: 14,
        label: "Teachers",
        guidance: "Guest talked about teachers or teacher training.",
        caption: "Teachers are the backbone. Train the teachers, connect the schools.",
      },
      {
        clip: 15,
        label: "AI / technology",
        guidance: "Guest talked about AI or technology tools.",
        caption: "AI is only as useful as the connection it runs on. No internet, no AI.",
      },
    ],
  },
  {
    id: 7,
    label: "Clever Class Pivot",
    kind: "play",
    main: 16,
    caption: "You've given me homework — what a clever class you are!",
  },
  {
    id: 8,
    label: "The Global Giga Story",
    kind: "play",
    main: 17,
    caption:
      "Sierra Leone dropped 90%. In Kenya, Darlene is learning to code. And here in The Gambia…",
  },

  // ── Video 3 ──────────────────────────────────────────────
  {
    id: 9,
    label: "Imagine · Turning Point",
    kind: "play",
    main: 18,
    caption: "We are at a turning point. What is missing is the final ingredient. You.",
  },
  {
    id: 10,
    label: "Write Commitment Question",
    kind: "play",
    overlay: 19, // walks to the board and writes it (silent)
    caption:
      "What can you and your organization do to help connect every school, health facility and TVET facility in The Gambia?",
  },
  {
    id: 11,
    label: "Monitors & Cards",
    kind: "play",
    main: 20,
    caption: "My monitors in blue shirts will bring cards to your tables. Write your ideas.",
  },
  {
    id: 12,
    label: "Commitment Discussion",
    kind: "question",
    idleClip: 21,
    pointClip: 22,
    caption: "(Listening — press Point Out when a guest raises a hand.)",
  },
  {
    id: 13,
    label: "Share What You Wrote",
    kind: "play",
    main: 23,
    caption: "These are fantastic ideas. My heart is warm.",
  },

  // ── Video 4 ──────────────────────────────────────────────
  {
    id: 14,
    label: "Closing & Dismissal",
    kind: "play",
    main: 24,
    caption: "My thirty-two students are counting on your courage. Class dismissed.",
    nextLabel: "Show Closing Graphic",
  },
  {
    id: 15,
    label: "UNICEF Closing Graphic",
    kind: "play",
    main: 25,
    caption: "Access to affordable, sustainable, safe and resilient connectivity for every child — empowering them through information, opportunity, choice and dignity.",
    nextLabel: "End",
  },
];
