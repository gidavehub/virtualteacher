// ── The Rohey show timeline (v2) ─────────────────────────────────────────
// Clips are the FINAL edited files 1–36 (audio already baked in by Dave).
// They live in GCS under rohey-clips-v2/ and locally in /public/rohey-clips-v2/.
//
// Step kinds:
//   • play    — one self-contained clip. autoAdvance chains straight into the
//               next step; freeze holds the last frame instead of idling.
//   • walkout — clip ends frozen on the empty classroom (break).
//   • live    — Fatou voices Rohey on the mic. The stage holds the idle-nod
//               loop; the operator has two tactile gestures: Invite (open
//               palm) and Speak (silent mouth movement). No response options.
//
// Photo steps (18–20) carry a photoSet — the app overlays the site-visit
// photos: each appears big in front of Rohey briefly, then docks to the
// background, one by one. This is the only overlay the app does.

export const CLIP = (n: number) =>
  `https://storage.googleapis.com/virtual-teacher-project-501606.firebasestorage.app/rohey-clips-v2/${n}.mp4`;

// Act idle loops (silent, slight nod, mouth still)
export const IDLE_CLASSROOM = 14; // run-down classroom, question on board
export const IDLE_CONNECTED = 29; // transformed classroom

export type StepKind = "play" | "walkout" | "live";

export interface PhotoSet {
  folder: string; // /public/photos/<folder>/1.jpeg..N.jpeg
  count: number;
}

export interface Step {
  id: number;
  label: string;
  kind: StepKind;
  clip?: number; // play / walkout
  autoAdvance?: boolean; // chain into the next step when the clip ends
  freeze?: boolean; // hold the last frame when the clip ends
  idleClip: number; // which idle loop covers this part of the show
  inviteClip?: number; // live: open-palm invitation
  speakClip?: number; // live: silent speak loop
  photoSet?: PhotoSet;
  caption?: string;
  nextLabel?: string;
}

// The stage directive shared by operator and stage.
export interface StepDirective {
  started: boolean;
  mode: "idle" | "segment" | "freeze";
  stepIndex: number;
  clip: number | null;
  idleClip: number;
  photoFolder: string | null;
  photoCount: number;
  caption: string;
  token: number;
  paused: boolean;
  updatedAt?: number;
}

export function buildStepDirective(steps: Step[], i: number, token: number): StepDirective {
  const step = steps[i];
  const base = {
    started: true,
    stepIndex: i,
    token,
    idleClip: step.idleClip,
    photoFolder: step.photoSet?.folder ?? null,
    photoCount: step.photoSet?.count ?? 0,
    caption: step.caption ?? "",
    paused: false,
  };
  if (step.kind === "live") {
    return { ...base, mode: "idle", clip: null };
  }
  return {
    ...base,
    mode: step.freeze || step.kind === "walkout" ? "freeze" : "segment",
    clip: step.clip ?? null,
  };
}

// What the NEXT scene will need — preloaded into the spare buffer while the
// current clip plays, so auto-advance starts instantly with zero stall.
export function getPreloadClip(steps: Step[], i: number): number | null {
  const nxt = steps[i + 1];
  if (!nxt) return null;
  if (nxt.kind === "live") return nxt.idleClip;
  return nxt.clip ?? null;
}

export function getStepVideos(step: Step): string {
  if (!step) return "";
  if (step.kind === "live") {
    return `Live — idle ${step.idleClip} · invite ${step.inviteClip} · speak ${step.speakClip}`;
  }
  return `Video ${step.clip}`;
}

export const STEPS: Step[] = [
  // ── VIDEO 1 — Pre-Activity (runs as one continuous chain) ──
  { id: 0, label: "Walk-in", kind: "play", clip: 1, autoAdvance: true, idleClip: IDLE_CLASSROOM },
  {
    id: 1, label: "Welcome & Greetings", kind: "play", clip: 2, autoAdvance: true, idleClip: IDLE_CLASSROOM,
    caption: "Good evening, class. Welcome, everyone — seeing you here truly makes me happy.",
  },
  {
    id: 2, label: "Classroom 360", kind: "play", clip: 3, autoAdvance: true, idleClip: IDLE_CLASSROOM,
    caption: "I know it's not much to look at.",
  },
  {
    id: 3, label: "No Projector · Tablet · Internet", kind: "play", clip: 4, autoAdvance: true, idleClip: IDLE_CLASSROOM,
    caption: "No projector. No tablet. No internet.",
  },
  {
    id: 4, label: "Classroom Story", kind: "play", clip: 5, autoAdvance: true, idleClip: IDLE_CLASSROOM,
    caption: "Thirty-two children. Right on time. Because this classroom is a door.",
  },
  {
    id: 5, label: "Giga Map Talk", kind: "play", clip: 6, autoAdvance: true, idleClip: IDLE_CLASSROOM,
    caption: "1,978 schools — every single one now mapped. Look at all the red dots.",
  },
  {
    id: 6, label: "Our School Is a Red Dot", kind: "play", clip: 7, autoAdvance: true, idleClip: IDLE_CLASSROOM,
    caption: "Our school is one of those red dots.",
  },
  {
    id: 7, label: "Chalk Pickup", kind: "play", clip: 8, autoAdvance: true, idleClip: IDLE_CLASSROOM,
    caption: "So tonight, I am not going to lecture you. I am going to do what teachers do best.",
  },
  {
    id: 8, label: "Write the Redesign Question", kind: "play", clip: 9, autoAdvance: true, idleClip: IDLE_CLASSROOM,
    caption: "If every child in The Gambia had internet access at school, how would you re-design education?",
  },
  {
    id: 9, label: "Break Announcement", kind: "play", clip: 10, autoAdvance: true, idleClip: IDLE_CLASSROOM,
    caption: "Ah, look at the time! It's time for a break. Think about the question. I will be back.",
  },
  {
    id: 10, label: "Walk-out · Break", kind: "walkout", clip: 11, idleClip: IDLE_CLASSROOM,
    caption: "", nextLabel: "Return from break",
  },

  // ── ACTIVITY A — Return + Live Discussion + Giga Story ──
  { id: 11, label: "Return from Break", kind: "play", clip: 12, autoAdvance: true, idleClip: IDLE_CLASSROOM },
  {
    id: 12, label: "Back in Session", kind: "play", clip: 13, autoAdvance: true, idleClip: IDLE_CLASSROOM,
    caption: "How would you re-design education in The Gambia if every child had internet access? Raise your hand and share what you think.",
  },
  {
    id: 13, label: "LIVE · Open Discussion", kind: "live", idleClip: IDLE_CLASSROOM,
    inviteClip: 15, speakClip: 16,
    caption: "", nextLabel: "Continue to Giga story",
  },
  {
    id: 14, label: "Clever Class", kind: "play", clip: 17, autoAdvance: true, idleClip: IDLE_CLASSROOM,
    caption: "Students giving their teacher homework — what a clever class you are!",
  },
  {
    id: 15, label: "Giga Story · Sierra Leone", kind: "play", clip: 18, autoAdvance: true, idleClip: IDLE_CLASSROOM,
    photoSet: { folder: "sierra_leone", count: 5 },
    caption: "In Sierra Leone the cost dropped from $12,000 to just $1,500 per school, per year — nearly 90%.",
  },
  {
    id: 16, label: "Giga Story · Kenya", kind: "play", clip: 19, autoAdvance: true, idleClip: IDLE_CLASSROOM,
    photoSet: { folder: "kenya", count: 5 },
    caption: "In Kakuma refugee camp, Darlene is learning to code. She wants to become a software engineer.",
  },
  {
    id: 17, label: "Giga Story · The Gambia", kind: "play", clip: 20, autoAdvance: true, idleClip: IDLE_CLASSROOM,
    photoSet: { folder: "the_gambia", count: 6 },
    caption: "Every single one of the 1,978 schools is now on the map. And Giga will reach beyond schools.",
  },
  {
    id: 18, label: "Mapping Done · Break", kind: "play", clip: 21, autoAdvance: true, idleClip: IDLE_CLASSROOM,
    caption: "We have done the mapping. We have done the planning. What we need now is the doing.",
  },
  {
    id: 19, label: "Walk-out · Meal Break", kind: "walkout", clip: 22, idleClip: IDLE_CLASSROOM,
    caption: "", nextLabel: "Begin Connected Classroom",
  },

  // ── ACTIVITY C — Connected Classroom ──
  {
    id: 20, label: "Settle & Imagine", kind: "play", clip: 23, autoAdvance: true, idleClip: IDLE_CONNECTED,
    caption: "Tonight, you were asked to imagine something. And look — I want you to see what you described.",
  },
  {
    id: 21, label: "Connected Classroom 360", kind: "play", clip: 24, autoAdvance: true, idleClip: IDLE_CONNECTED,
    caption: "",
  },
  {
    id: 22, label: "This Is Connectivity", kind: "play", clip: 25, autoAdvance: true, idleClip: IDLE_CONNECTED,
    caption: "This is what connectivity looks like. Not a statistic. Not a cost model. This.",
  },
  {
    id: 23, label: "Final Question", kind: "play", clip: 26, autoAdvance: true, idleClip: IDLE_CONNECTED,
    caption: "So, I have one final question. The question is:",
  },
  {
    id: 24, label: "Write the Commitment Question", kind: "play", clip: 27, autoAdvance: true, idleClip: IDLE_CONNECTED,
    caption: "What can you and your organization do to help connect every school, health facility and TVET facility in The Gambia?",
  },
  {
    id: 25, label: "Cards & Share", kind: "play", clip: 28, autoAdvance: true, idleClip: IDLE_CONNECTED,
    caption: "The UNICEF team in blue shirts will come to your tables. Write down your ideas — and raise your hand to share.",
  },
  {
    id: 26, label: "LIVE · Commitment Discussion", kind: "live", idleClip: IDLE_CONNECTED,
    inviteClip: 30, speakClip: 31,
    caption: "", nextLabel: "Continue to treats",
  },
  {
    id: 27, label: "Not Just Talk · Treats", kind: "play", clip: 32, autoAdvance: true, idleClip: IDLE_CONNECTED,
    caption: "Please do not let this be just a talk. Our children are counting on you.",
  },
  {
    id: 28, label: "Walk-out · Dessert", kind: "walkout", clip: 33, idleClip: IDLE_CONNECTED,
    caption: "", nextLabel: "Begin Closing",
  },

  // ── ACTIVITY D — Closing ──
  { id: 29, label: "Return for Closing", kind: "play", clip: 34, autoAdvance: true, idleClip: IDLE_CONNECTED },
  {
    id: 30, label: "Closing", kind: "play", clip: 35, autoAdvance: true, idleClip: IDLE_CONNECTED,
    caption: "My students are counting on your courage. Class dismissed.",
  },
  {
    id: 31, label: "UNICEF Logo Card", kind: "play", clip: 36, freeze: true, idleClip: IDLE_CONNECTED,
    caption: "", nextLabel: "End of show",
  },
];
