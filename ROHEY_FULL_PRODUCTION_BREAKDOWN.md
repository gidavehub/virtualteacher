# ROHEY v2 — Regeneration Deliverables (UNICEF revision round)

Numbered in show order. Every entry is a **PROMPT** (generated video) or a **SCRIPT** (voice). When a scene needs both, it's split **NA = prompt · NB = script** — Dave combines them in the edit. Name files exactly by their number (`3A.mp4`, `3B.wav`, `9.mp4`, …).

The only overlays the app does are the **image displays** (photos front-then-background, per the client's layout) — everything else is combined by Dave in editing.

---

## GLOBAL VOICE INSTRUCTIONS (every SCRIPT)

- Tone: **upbeat, bright, warm, animated** — noticeably more energy than round one.
- **Slow the speech down.**
- **Pause at least 1 second between every sentence** — give this as a delivery instruction to the voice model, NOT as markers in the script text (the model reads written markers out loud).
- Where the client wants a LONG pause (after "You.", after "settle down please", before "Class dismissed"), cut the script there and generate the next part as a separate audio — the gap is added in the edit.
- Pronounce: **Stéphane = "stay-FAHN"** · **TVET = "TEE-vet"** — delivery instruction only, never written into the script.

## GLOBAL VIDEO RULES (every PROMPT)

- She is an avatar. Keep everything exactly as it is in the image.
- Camera fixed, no zoom-in, no zoom-out, angle and position never change — **EXCEPT the 360° scenes (3A, 24), where the camera stays in one spot and rotates slowly**.
- No audible speech, no voiceover, ever.
- **Whenever Rohey is on screen, her mouth moves naturally as if she is speaking** (silently). **ONLY exception: the idle-nod loops (14, 29) — mouth completely still and closed** (client requirement: she must never look like she's speaking while paused).
- Deliver LONG with a clear settle point (standing still, center) — Dave trims there in the edit so mouth and voice match from the first word.

## REFERENCE IMAGES

| Ref | What | Status |
|---|---|---|
| **REF-A** | Run-down classroom, Rohey center (current image) | ✅ have it |
| **REF-A-MAP** | REF-A with the Giga map composited to FILL the board behind her | 🔨 create once |
| **REF-A-Q** | Snapshot of the final frame of **9** — chalk question on the board | 📸 after generating 9 |
| **REF-B** | Transformed classroom: bright, lit up, colourful, devices on desks — Rohey center | 🔨 create |
| **REF-B-Q** | Snapshot of the final frame of **27** — commitment question on the whiteboard | 📸 after generating 27 |

Board writing is **baked into the prompts** — the video model handles legible text. After each writing clip, snapshot the final frame (REF-A-Q / REF-B-Q) as the reference for every later clip in that act.

---
---

# VIDEO 1 — Pre-Activity (target ≈ 10 min)

**1 — PROMPT — Walk-in** — REF-A — ~8s
She is an avatar. Keep everything exactly as it is in the image. She walks into frame carrying a folder, sets it on the desk, and settles standing still in the center facing the camera with a warm expression. Camera fixed, no zoom; angle and position never change. Her mouth moves naturally as if she is speaking, but there is no audible speech and no voiceover. She ends standing completely still at the center.

**2 — SCRIPT — Welcome & greetings**
Good evening, class. I wasn't expecting the class to be so full! Welcome, everyone. Seeing you here truly makes me happy. Nafisa – lovely to have you with us this evening! Stéphane, Turker – good evening. Ah! Franklin, and Karl too! Welcome! I'm so glad you came. And Imma – welcome, it's a pleasure to have you in the room. Everyone, thank you all so much for joining us. Welcome to my classroom.

**3A — PROMPT — Classroom 360** — REF-A — ~10s
Keep everything exactly as it is in the image. The camera stays in one single spot and rotates slowly, a full 360 degrees, showing the whole bare, run-down, unconnected classroom all the way around — simple wooden desks, hand-painted walls, worn floor — ending back where it started on Rohey. No speech, no voiceover. Slow, steady rotation only — no zoom, no walking.

**3B — SCRIPT**
I know it's not much to look at.

**4A — PROMPT — Classroom cutaways** — pass the classroom image — ~10s
Keep everything exactly as it is in the image. Three quiet shots of the run-down classroom, one cutting to the next. First: a calm shot of the simple blackboard at the front of the room. Then cut to: a simple wooden desk with only paper and a pencil on it, a student in uniform writing by hand. Then cut to: a small stack of old, slightly torn textbooks on a desk, students sharing them. Each shot is calm and still. Camera fixed in every shot, no zoom, no speech, no voiceover.

**4B — SCRIPT**
No projector. No tablet. No internet.

**5 — SCRIPT — Classroom story** *(back to the regular shot)*
Some days – not even enough chalk. But every morning, they come. Thirty-two children. Right on time. Because they believe that this classroom is a door. A door that could open opportunities to anywhere. You know what breaks my heart? Right now, that door doesn't open very far.

**6 — SCRIPT — Giga map talk** — REF-A-MAP behind her (Giga logo shows first)
There are 1,978 basic and secondary level schools in The Gambia. Every single one of them has now been mapped, thanks to the Giga Initiative, a global partnership led by UNICEF and the International Telecommunication Union. We can see every school on the map. We know where they are. We know how far they are from a fibre node, from a cell tower, or from other connectivity infrastructure. Class, can you spot the problem? Let me help. Look at all the red dots. They are schools that are not connected. Can you see them on the map? Seeing is a step forward. But seeing does not equal solving. More needs to be done.

**7 — SCRIPT — Our school is a red dot** *(map removed — normal board again)*
I mean, look at this classroom! Our school is one of those red dots. I know I should be preparing my students to achieve their full potential in this 21st century. But there's only so much we can do with limited connectivity and digital tools.

**8A — PROMPT — Chalk pickup** — REF-A — ~6s
She is an avatar. Keep everything exactly as it is in the image. She moves to her desk, picks up a piece of chalk, and holds it thoughtfully, then settles standing still at the center. Camera fixed, no zoom. Her mouth moves naturally as if she is speaking, but there is no audible speech and no voiceover.

**8B — SCRIPT**
So tonight, I am not going to lecture you. I am going to do what teachers do best.

**9 — PROMPT — Write the redesign question** — REF-A — ~10s ⭐ *snapshot final frame → REF-A-Q*
She is an avatar. Keep everything exactly as it is in the image. She turns to the chalkboard behind her and writes on the board in animated chalk lettering, one word at a time, so the words appear clearly on the board: "If every child in The Gambia had internet access at school, how would you re-design education?" By the end of the clip the full sentence is legibly written on the board. Keep this writing on the board in every following video. She turns back and settles standing still at the center. Camera fixed, no zoom. Her mouth moves naturally as if she is speaking, but there is no audible speech and no voiceover.

**10 — SCRIPT — Break announcement** *(glances at her watch as she starts)*
Ah, look at the time! It's time for a break. Think about the question. Sit with it. Discuss it with your classmates at your table during the break. I will be back.

**11 — PROMPT — Walk-out** — REF-A-Q — ~6s *(ends frozen on the empty classroom)*
She is an avatar. Keep everything exactly as it is in the image. She walks out of the frame completely, leaving the classroom empty. The empty classroom holds still for a few seconds at the end. Camera fixed, no zoom. Her mouth moves naturally as if she is speaking, but there is no audible speech and no voiceover.

---

# ACTIVITY A — Return + Live Discussion + Giga Story (pre-made ≈ 3–4 min, live up to 25 min)

*Every Activity A scene uses **REF-A-Q** (chalk question still on the board).*

**12 — PROMPT — Return from break** — REF-A-Q — ~6s
She is an avatar. Keep everything exactly as it is in the image. She walks back into the frame as if returning from a break and settles standing still at the center facing the camera. Camera fixed, no zoom. Her mouth moves naturally as if she is speaking, but there is no audible speech and no voiceover.

**13 — SCRIPT — Back in session**
Right class, settle down please. I hope you had enough time to think about my question, because class is back in session. So tell me class, what did you discuss? I saw some of you talking. I heard some interesting ideas from here. Tell me, how would you re-design education in The Gambia if every child had internet access? Let's hear it. Don't be shy. It's just a classroom discussion. It's not like you're talking in front of a room full of ministers and diplomats or anything. Please. Raise your hand, and share what you think.

### LIVE MODE — "Open Discussion" (Fatou voices live, Malick operates — no response-option clips)

**14 — PROMPT — Idle nod loop** — REF-A-Q — ~8s seamless loop
She is an avatar. Keep everything exactly as it is in the image. She stands still at the center, listening: only a slight, gentle nod now and then, blinking naturally. Her mouth is completely still and closed — she is NOT speaking. Camera fixed, no zoom. No speech, no voiceover. Identical start and end pose for a seamless loop.

**15 — PROMPT — Invite gesture** — REF-A-Q — ~5s
She is an avatar. Keep everything exactly as it is in the image. She stands at the center and gently extends an open palm toward the camera — a soft, warm, welcoming invitation for someone to speak. NOT pointing with a finger. She must not gesture at anything outside the camera; the person she is inviting is on the other side of the lens. Then her hand returns to rest and she settles still. Camera fixed, no zoom. Her mouth moves naturally as if she is speaking, but there is no audible speech and no voiceover.

**16 — PROMPT — Speak loop** — REF-A-Q — ~6s seamless loop *(plays while Fatou talks live)*
She is an avatar. Keep everything exactly as it is in the image. She stands at the center facing the camera and moves her mouth naturally as if speaking warmly to the class, with small natural head and hand movements. There is NO audible speech and NO voiceover — the mouth movement is silent. Camera fixed, no zoom. Identical start and end pose for a seamless loop.

*(Fatou closes live: "These are wonderful ideas. Thank you for sharing." → NEXT.)*

### Pre-made Giga story (≈ 5 min)

**17 — SCRIPT — Clever class**
You have given me a lot to work with. This is a case of students giving their teacher homework. What a clever class you are! And to you, my clever class, I want to show something. What you have imagined and discussed is already being accomplished around the globe.

**18 — SCRIPT — Sierra Leone** · *app shows Sierra Leone photos: big in front of Rohey briefly, then one by one in the background*
The Giga Initiative by UNICEF and International Telecommunications Union has connected schools around the world. In other countries, students who once studied by candlelight now code, create, and compete globally. For example, in Sierra Leone, just a few years ago, connecting a single school to the internet could cost as much as 12,000 dollars per year. Twelve thousand dollars… for one school. That meant most schools simply could not afford to stay connected. But with the support of Giga, things have changed. By working with governments and the private sector, by improving procurement, increasing competition, and using new technologies, the cost dropped – from 12,000 to just 1,500 dollars per school, per year. It dropped nearly 90%! This changed everything. The connectivity became affordable and sustainable. Schools that were once offline, started to come online. It shows it's not just about connecting a school. It's about making sure that connections last.

**19 — SCRIPT — Kenya** · *app shows Kenya photos, same pattern*
In Kakuma refugee camp in Kenya, a place where over 250,000 people are building their lives after fleeing conflict, in one classroom, a girl named Darlene is learning to code. She wants to become a software engineer. And she is not alone. Her classmates are building websites, solving problems, imagining a future far beyond the camp. This became possible because their school is connected. Across Kenya, Giga has helped connect 659 schools, reaching more than 425,000 students and teachers. When connectivity is done right, it becomes inclusive and transformative. It becomes hope.

**20 — SCRIPT — The Gambia** · *app shows UNICEF Gambia photos until "…is now on the map", then back to regular view*
And here in The Gambia? The Vice President signed our letter of interest in May, this year. That kicked off a nationwide mapping exercise and now every single one of the 1,978 schools is now on the map. And in The Gambia, Giga will reach beyond schools. The connectivity will reach other services that protect children and adolescents, and help them thrive. Data from health facilities and TVET institutions is being reviewed to also add to the map. Discussions are underway to connect the unconnected facilities that would reduce both upfront and ongoing costs. Analysis is underway to determine the financial return on investment of connecting schools and health facilities, and the cost savings that can be achieved from doing this at the same time. The national ICT infrastructure is being assessed. The policies are being reviewed. The National Steering Committee is coming together.

**21 — SCRIPT — Mapping done, break** *(smiles warmly)*
There you go class. We have done the mapping. We have done the planning. What we need now is the doing. Think about that. Oh, it's time for another break. Enjoy your meal. When you come back to me, we are going to talk about something a little more serious. But it is very important.

**22 — PROMPT — Walk-out 2** — REF-A-Q — same spec as 11 (regenerate against REF-A-Q so the question stays on the board)

---

# ACTIVITY C — Connected Classroom (pre-made ≈ 8 min, live 15 min)

*Everything from here uses **REF-B** (transformed classroom — create it first), then **REF-B-Q** after scene 27.*

**23 — SCRIPT — Settle & imagine** — REF-B *(she walks back in first — reuse the 12 spec against REF-B)*
Ok class. Settle down please. *(cut — long gap in edit)* Tonight, you were asked to imagine something. Maybe you imagined that, with internet, a girl in rural Gambia could learn from the world's best scientists. Maybe you imagined teachers finally getting the training they deserve anywhere, anytime. And maybe, somewhere in tonight's conversation, you imagined that no child should be left behind simply because of where they were born. And look! I want you to see what you described.

**24 — PROMPT — Connected classroom 360** — REF-B — ~10–12s *(hardest generation — do best-of-N takes)*
Keep everything exactly as it is in the image. The camera stays in one single spot and rotates slowly, a full 360 degrees, showing the transformed, brightly lit, connected classroom all the way around. As the camera turns it reveals: a projected screen with equations on it and one student in school uniform standing in front of it pointing at the equations; laptops on desks at the side of the classroom with girls in school uniforms sitting and coding, one of them in a wheelchair; a group of students in school uniform building and playing with a simple robotic structure; and a group of teachers using a laptop to prepare for a class. No speech, no voiceover. Slow, steady rotation only — no zoom, no walking.

**25 — SCRIPT — This is connectivity** *(keep the whiteboard/projected screen in the background from here on)*
This is what connectivity looks like. This is what it feels like. Not a statistic. Not a cost model. This. I hope that felt real. Because it is. Or it can be. We are at a turning point. The schools are mapped. The plan to connect schools, health facilities, and TVET facilities exists. The partners are ready. The Government is committed. UNICEF is here. What is missing is the final ingredient. *(cut — long gap in edit)* You. *(cut — long gap in edit)* Not because this is charity. But because this is an investment. In a country where over 60 percent of the population is under 25, a young, fast-growing population, with a government committed to digital transformation. And 1,978 schools and 157 health facilities ready to come online, the return is not just financial. The return is the next generation of Gambian engineers, entrepreneurs, scientists, doctors, and leaders, ready to form a strong workforce within the country, to build leading sectors in the Gambian economy and to find their future here, at home, rather than risking everything on a dangerous journey abroad.

**26 — SCRIPT — Final question**
So, I have one final question. The question is:

**27 — PROMPT — Write the commitment question** — REF-B — ~10s ⭐ *snapshot final frame → REF-B-Q*
She is an avatar. Keep everything exactly as it is in the image. She turns to the whiteboard and writes on it slowly, in animated digital pen lettering, the words appearing clearly as she writes: "What can you and your organization do to help connect every school, health facility and TVET facility in The Gambia?" By the end of the clip the full question is legibly on the whiteboard. Keep this writing on the board in every following video. She turns back and settles standing still at the center. Camera fixed, no zoom. Her mouth moves naturally as if she is speaking, but there is no audible speech and no voiceover.

**28 — SCRIPT — Cards & share**
The UNICEF team in blue shirts will come to each of your tables in a moment. They have cards. They want to hear your answer, not in a survey, not in a follow-up email, tonight. Please write down ideas how you or your organization could help. I'd love to also hear from some of you. Please raise your hand and share what your organization could do.

### LIVE MODE — "Commitment Discussion" (same buttons)

**29 — PROMPT — Idle nod loop (connected)** — REF-B-Q — same spec as 14
**30 — PROMPT — Invite gesture (connected)** — REF-B-Q — same spec as 15
**31 — PROMPT — Speak loop (connected)** — REF-B-Q — same spec as 16

*(Fatou closes live: "These are wonderful ideas. Thank you for sharing." → NEXT.)*

**32 — SCRIPT — Not just talk + treats**
Please do not let this be just a talk. Our children are counting on you. UNICEF team will collect the cards at the end of the evening, and be in touch to take the conversation further in the coming days. Now, we have some sweet treats for you. Continue discussing with your classmate at your table over the treats. Enjoy.

**33 — PROMPT — Walk-out 3** — REF-B-Q — same spec as 11, against the transformed room

---

# ACTIVITY D — Closing (≈ 2 min)

**34 — PROMPT — Return for closing** — REF-B-Q — same spec as 12

**35 — SCRIPT — Closing**
Hello again class. *(cut — long gap in edit)* You know, when I started teaching, someone told me: the best teachers don't give students answers. They give them the right question and the courage to act on it. You have had the question all evening. My students are counting on your courage. I had a great evening being your teacher today. Thank you so much for being here. For now, this is the end of today's session with me. I hope you have a great rest of the evening. *(cut — long gap in edit)* Class dismissed.

**36 — GRAPHIC — UNICEF logo card**
UNICEF logo + tagline: **"For Every Child, affordable, sustainable, safe and resilient connectivity"**. "For Every Child" must NEVER leave the screen — when the logo animates or moves up, the whole logo including "For Every Child" stays visible at all times.

---
---

# PRODUCTION CHECKLIST (order of work)

1. **References:** composite REF-A-MAP · generate REF-B.
2. **All SCRIPTS** recorded with the global voice instructions (slow, ≥1s sentence gaps, upbeat) — durations drive the segment targets (V1 ≈10 min, A ≈3–4 min pre-made, Giga ≈5 min, C ≈8 min, D ≈2 min).
3. **PROMPTS in dependency order:** 1, 3A, 4A, 8A (REF-A) → **9** ⭐ → snapshot **REF-A-Q** → 11, 12, 14, 15, 16, 22 (REF-A-Q) · 24 (REF-B) → **27** ⭐ → snapshot **REF-B-Q** → 29, 30, 31, 33, 34 (REF-B-Q).
4. **Dave's edit pass:** combine every NA+NB pair; trim walk/gesture clips at the settle point and attach the voice there; add the long gaps at the marked cuts.
5. **Photo sets** into folders: `sierra-leone/`, `kenya/`, `gambia/` — the app displays them front-then-background, one by one (scenes 18–20). This is the only overlay the app does.
6. **App work (separate):** photo overlay player · Speak + Invite buttons · remove response options · pause = idle nod · move Restart button down · new tagline card (36).

## REUSED vs NEW vs GONE

- **Regenerate better:** walk-in/walk-out/return, idle (mouth now fully still), write-on-board (legible text baked in, persisted via REF-A-Q / REF-B-Q).
- **Brand new:** classroom 360 (3A) · cutaways (4A) · connected 360 (24) · open-palm invite (15/30) · speak loop (16/31) · REF-B world · logo card with locked "For Every Child".
- **Gone:** the map dots animation clip · response-option clips — Fatou answers live · telehealth insert · "not letting you answer over dinner" · "thirty-two students" (now "My students") · "class monitors" (now "The UNICEF team in blue shirts").
