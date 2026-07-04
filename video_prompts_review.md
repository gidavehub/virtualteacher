# Video Prompts Review - Virtual Teacher Rohey

This document lists the detailed generation prompts designed for **Vertex AI Veo** to generate all 9 modular video loops/gestures for Virtual Teacher Rohey. 

Each prompt is carefully constructed to utilize `public/rohey-avatar.jpg` as the starting/reference frame, maintaining **100% visual consistency** in Rohey's face, clothes, hair, and her bare, dimly lit African classroom background, while introducing fluid, lifelike movements.

---

## 🎨 Core Design & Continuity Guidelines

To prevent jarring transitions or "popping" during double-buffered projector cross-fading, all prompts adhere to the following rigid rules:
1. **Tripod Lock:** The camera remains completely static (no panning, translation, zooming, or camera shake).
2. **Environmental Anchor:** The background classroom (faded green chalkboard, hand-painted walls, soft warm front-lighting) remains identical to the reference image.
3. **Actor Continuity:** Rohey's facial structure, hair style, and traditional Gambian yellow/blue dress are fully locked to the baseline frame.
4. **Natural Micro-movements:** All clips include subtle breathing, natural blinking, eye-darting, and shoulder movements for a premium, non-robotic feel.

---

## 🎬 Master Video Prompts Breakdown

### 1. `rohey-walk-in.mp4` (Chapter 1, Segment 1)
*   **Purpose:** Initial pre-activity intro scene where Rohey enters the classroom.
*   **Prompt:**
    ```text
    Based on the reference image, generate a photorealistic cinematic video. A friendly, warm young Gambian female teacher named Rohey walks gracefully into the frame of a bare, dimly lit classroom. She is carrying a school folder. She walks to her wooden desk, places the folder down gently, and stands facing the camera. She looks directly at the lens, smiles warmly, and raises her hand in a gentle, polite "quiet down" gesture. Camera remains completely static. The classroom background, her clothes, her face, and the soft warm lighting are 100% consistent with the reference image. Zero camera movement.
    ```

---

### 2. `rohey-breaks-heart.mp4` (Chapter 1, Segment 3)
*   **Purpose:** Speaking about Giga's mapping efforts and expressing concern about the unconnected red dots.
*   **Prompt:**
    ```text
    Based on the reference image, generate a photorealistic cinematic video. Rohey is speaking with deep emotion and a sincere, slightly saddened expression. She gestures slowly with both hands in front of her chest to show empathy, then gracefully extends her right arm to point towards the virtual map on the wall behind her. Her facial expression transitions from serious concern to warm hope. Camera is static. The classroom, her appearance, her dress, and the soft ambient lighting remain 100% consistent with the reference image.
    ```

---

### 3. `rohey-question.mp4` (Chapter 1, Segment 4)
*   **Purpose:** Asking the students how they would re-design education, then dismissing them for discussion.
*   **Prompt:**
    ```text
    Based on the reference image, generate a photorealistic cinematic video. Rohey turns slightly away from the camera to write a question on the faded chalkboard behind her. She then turns back around to face the camera with a bright, friendly smile. She raises her arm to look down at her wrist watch, then looks back up to the camera, gesturing with an open-palm invitation for the audience to start discussing. Camera remains completely stationary. Perfect continuity of her face, clothes, and the dimly lit classroom from the reference image.
    ```

---

### 4. `rohey-pointing-left.mp4` (Chapter 2, Segment 6)
*   **Purpose:** Gesture loop triggered when the operator clicks "Point Left" (focusing Tables 1 & 2).
*   **Prompt:**
    ```text
    Based on the reference image, generate a photorealistic cinematic video loop. Rohey is standing looking directly at the camera, smiling warmly. She raises her right arm and gestures gracefully pointing toward the left side of the frame, nodding her head in friendly encouragement. She maintains this gentle pointing pose, smiling and looking back and forth between the left side and the camera. Static camera. The classroom background, her clothing, and facial features must be identical to the reference image. Clean loop with natural blinking.
    ```

---

### 5. `rohey-looking-center.mp4` (Chapter 2, Segment 7)
*   **Purpose:** Gesture loop triggered when the operator clicks "Look Center" (focusing Tables 2 & 3 / center of the room).
*   **Prompt:**
    ```text
    Based on the reference image, generate a photorealistic cinematic video loop. Rohey stands facing the camera, looking directly at the viewer. She nods her head in gentle approval and respect, holding both hands open in front of her chest in a welcoming, active listening gesture. She smiles warmly and blinks naturally, appearing engaged and attentive. Camera is completely static. The classroom background, her clothes, and her face are identical to the reference image.
    ```

---

### 6. `rohey-pointing-right.mp4` (Chapter 2, Segment 8)
*   **Purpose:** Gesture loop triggered when the operator clicks "Point Right" (focusing Tables 3 & 4).
*   **Prompt:**
    ```text
    Based on the reference image, generate a photorealistic cinematic video loop. Rohey is standing looking directly at the camera, smiling warmly. She raises her left arm and gestures gracefully pointing toward the right side of the frame, nodding her head in encouraging approval. She maintains this friendly pointing pose, looking back and forth between the right side and the camera. Static camera. The classroom background, her clothing, and facial features are identical to the reference image. Clean loop with natural blinking.
    ```

---

### 7. `rohey-gambia.mp4` (Chapter 4, Segment 11)
*   **Purpose:** Expressing pride and detailing Gambia's completed mapping progress.
*   **Prompt:**
    ```text
    Based on the reference image, generate a photorealistic cinematic video. Rohey stands in front of the camera, her face beaming with pride and confidence. She speaks passionately, gesturing natural open-handed motions to emphasize success. She smiles warmly, her eyes sparkling with excitement, expressing the success of mapping all 1,978 schools in The Gambia. Camera remains completely static. The classroom background, her clothes, and lighting remain fully identical to the reference image.
    ```

---

### 8. `rohey-turning-point.mp4` (Chapter 5, Segment 14)
*   **Purpose:** Speaking with deep conviction, making an investment pitch to the high-level dinner guests.
*   **Prompt:**
    ```text
    Based on the reference image, generate a photorealistic cinematic video. Rohey is speaking with deep sincerity, hope, and quiet determination. She gestures with warm, open hands near her chest, leaning forward slightly towards the camera to convey a powerful message about investing in the next generation. Her facial expression is earnest, passionate, and inspiring. Camera remains completely static. The classroom background, her clothing, and soft lighting are identical to the reference image.
    ```

---

### 9. `rohey-commitment.mp4` (Chapter 5, Segment 15)
*   **Purpose:** Writing the final commitment question on the whiteboard and gesturing to blue-shirt class monitors.
*   **Prompt:**
    ```text
    Based on the reference image, generate a photorealistic cinematic video. Rohey is standing next to her whiteboard. She writes a question on the board, then turns back to the camera with a warm, open smile. She gestures with her arm toward the sides of the classroom as if introducing class monitors, holding her hands open in a welcoming, encouraging manner. Camera remains static. Perfect consistency of her face, clothing, and the dimly lit classroom from the reference image.
    ```

---

> [!TIP]
> **Double-Buffering Sync Note:** When the Operator Console transitions between these loops, the projector screen `/stage` will cross-fade active video elements. Having identical start/end frames (matching `public/rohey-avatar.jpg`) ensures transitions are completely seamless and feel like real-time physical gestures!
