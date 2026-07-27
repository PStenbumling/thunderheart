# G — Website Integration

> 10 concrete improvements for the GitHub Pages static site (HTML/CSS/JS only).  
> Three of these sync the scrolling legend with changing background scenes.  
> All improvements build on the existing codebase without breaking what works.

---

## Current Site Assessment

The site already has excellent bones:
- CSS variables for the color system ✅
- The five-frame background sequence (currently only frame-1 is loaded) — **biggest opportunity**
- A scrolling legend box with the canon text ✅
- A working audio player with playlist ✅
- Backdrop blur glass panels for readability ✅
- Lightning flash animation (`bgFlash`) that is triggered but underused ✅

The improvements below are ordered by impact. None require a backend, database, or framework.

---

## Improvement 1 — Frame Cycling: Scroll-to-Storm

**Reason:** The five frames form a cinematic sequence (dormant → full power). Currently only frame-1 loads. Cycling through all five as the user reads the legend makes the visual narrative match the text narrative.

**Expected impact:** The single biggest visual improvement possible. Transforms a static background into a living story.

**Implementation:**

```javascript
// Add to your script block
const frames = [
  'assets/frames/frame-1.png',
  'assets/frames/frame-2.png',
  'assets/frames/frame-3.png',
  'assets/frames/frame-4.png',
  'assets/frames/frame-5.png'
];

// Preload all frames on page load
frames.forEach(src => { const img = new Image(); img.src = src; });

// Swap frame based on scroll position
const bgFrame = document.getElementById('bgFrame');
const totalHeight = document.documentElement.scrollHeight - window.innerHeight;

window.addEventListener('scroll', () => {
  const progress = window.scrollY / Math.max(totalHeight, 1);
  const frameIndex = Math.min(Math.floor(progress * frames.length), frames.length - 1);
  const newSrc = frames[frameIndex];
  if (bgFrame.src !== newSrc && !bgFrame.src.endsWith(newSrc)) {
    bgFrame.style.opacity = '0';
    setTimeout(() => {
      bgFrame.src = newSrc;
      bgFrame.style.opacity = '1';
    }, 200);
  }
}, { passive: true });
```

```css
/* Add transition to the existing .bg-frame rule */
.bg-frame {
  transition: opacity 0.4s ease;
}
```

**Lore connection:** Frame 1 = Before / The Last Stormkeeper intro. Frame 5 = Legacy / Stand and Fight. The user literally rides the storm by scrolling.

---

## Improvement 2 — Legend Text: Scroll-Sync Scene Labels

**Reason:** The scrolling legend text has no visual cue for which "age" of the story it is currently in. Adding a subtle label that updates as the scroll progresses ties the text to the timeline.

**Expected impact:** Gives readers a sense of narrative structure without requiring them to have read the Story Bible.

**Implementation:**

```html
<!-- Add inside .legend-box, above .legend-viewport -->
<div class="legend-era" id="legendEra">THE BEFORE</div>
```

```css
.legend-era {
  font-size: 0.48rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--gold);
  text-align: center;
  margin-bottom: 6px;
  opacity: 0.7;
  transition: opacity 0.5s ease;
}
```

```javascript
// Era labels synced to legend scroll animation progress
const eras = [
  { threshold: 0,    label: 'THE BEFORE' },
  { threshold: 0.20, label: 'THE RISE' },
  { threshold: 0.45, label: 'THE FALL' },
  { threshold: 0.65, label: 'THE RETURN' },
  { threshold: 0.85, label: 'THE LEGACY' }
];

// Observe the legend-scroll animation and update era label
// Since it's a CSS animation, use a timer to estimate progress
const legendScroll = document.querySelector('.legend-scroll');
const legendEra = document.getElementById('legendEra');
const DURATION = 100000; // matches 100s animation
let startTime = null;

function updateEra(ts) {
  if (!startTime) startTime = ts;
  const elapsed = (ts - startTime) % DURATION;
  const progress = elapsed / DURATION;
  let currentEra = eras[0].label;
  for (const era of eras) {
    if (progress >= era.threshold) currentEra = era.label;
  }
  if (legendEra.textContent !== currentEra) legendEra.textContent = currentEra;
  requestAnimationFrame(updateEra);
}
requestAnimationFrame(updateEra);
```

---

## Improvement 3 — Background Scene Change on Legend Era (Scroll-Sync 1 of 3)

**Reason:** When the legend era label changes (Improvement 2), the background frame should also change — making the visual, text, and narrative progress in unison.

**Expected impact:** Creates a unified storytelling experience. The site feels like it knows it's telling a story.

**Implementation:**

```javascript
// Map each era to a specific frame
const eraFrames = {
  'THE BEFORE':  'assets/frames/frame-1.png',
  'THE RISE':    'assets/frames/frame-2.png',
  'THE FALL':    'assets/frames/frame-1.png', // Darker — use frame 1 again (no lightning)
  'THE RETURN':  'assets/frames/frame-3.png',
  'THE LEGACY':  'assets/frames/frame-5.png'
};

// Modify the updateEra function above — after updating the label, also swap the frame:
if (legendEra.textContent !== currentEra) {
  legendEra.textContent = currentEra;
  const targetFrame = eraFrames[currentEra];
  if (targetFrame && !bgFrame.src.endsWith(targetFrame)) {
    bgFrame.style.opacity = '0';
    setTimeout(() => { bgFrame.src = targetFrame; bgFrame.style.opacity = '1'; }, 250);
  }
}
```

**Lore connection:** THE FALL deliberately uses frame-1 (no lightning) — darkness has returned, the Heart sleeps. The visual regression reinforces the narrative.

---

## Improvement 4 — Song Sections: Navigate Legend to Era (Scroll-Sync 2 of 3)

**Reason:** Clicking a song in the playlist should jump the legend to the corresponding era of the story and trigger the correct background frame.

**Expected impact:** Makes the player interactive beyond just audio. The playlist becomes a story navigation tool.

**Implementation:**

```javascript
// Map each playlist track to a legend position and background frame
const trackLore = {
  0: { frame: 'assets/frames/frame-2.png', era: 'THE RISE',   legendNote: 'Age II — The Last Stormkeeper walks the broken world.' },
  1: { frame: 'assets/frames/frame-3.png', era: 'THE RETURN', legendNote: 'Age IV — The new bearer rides to battle.' },
  2: { frame: 'assets/frames/frame-1.png', era: 'THE RETURN', legendNote: 'Age IV — Alone, following the Northern Star.' },
  3: { frame: 'assets/frames/frame-5.png', era: 'THE LEGACY', legendNote: 'Age V — The eternal battle cry of all Stormkeepers.' }
};

// Add a track-note element below the track-sub div in the player
// Then on track change, update it:
function onTrackChange(trackIndex) {
  const lore = trackLore[trackIndex];
  if (!lore) return;
  bgFrame.style.opacity = '0';
  setTimeout(() => { bgFrame.src = lore.frame; bgFrame.style.opacity = '1'; }, 250);
  document.getElementById('trackNote').textContent = lore.legendNote;
  legendEra.textContent = lore.era;
}
```

```html
<!-- Add below .track-sub in the player HTML -->
<div class="track-note" id="trackNote"></div>
```

```css
.track-note {
  font-size: 0.58rem;
  color: var(--gold);
  opacity: 0.6;
  text-align: center;
  letter-spacing: 0.08em;
  margin-bottom: 12px;
  font-style: italic;
}
```

---

## Improvement 5 — Lightning Flash on Page Load

**Reason:** The `bgFlash` element exists but the flash is not triggered on page load. A flash at load time creates a dramatic first impression consistent with the "the storm has returned" narrative.

**Expected impact:** Immediately communicates the band's energy from the first second.

**Implementation:**

```javascript
// Add to DOMContentLoaded or window.onload
window.addEventListener('load', () => {
  setTimeout(() => {
    const flash = document.getElementById('bgFlash');
    flash.classList.add('active');
    flash.addEventListener('animationend', () => flash.classList.remove('active'), { once: true });
  }, 800); // Short delay so the page renders first
});
```

---

## Improvement 6 — Song-Triggered Lightning Flash (Scroll-Sync 3 of 3)

**Reason:** When the chorus hits in any song, trigger the `bgFlash` animation. This syncs the visual to the music's emotional peak — especially powerful for "Ride the Storm" and "Stand and Fight."

**Expected impact:** Creates a live-show feel without any video. The most viscerally exciting improvement for music listeners.

**Implementation:**

```javascript
// These timestamps are placeholders — replace with actual chorus timestamps
// for each track once final audio files are available.
const chorusCues = {
  0: [45, 95, 140, 175],  // The Last Stormkeeper — chorus timestamps (seconds)
  1: [38, 82, 126, 160],  // Ride the Storm
  2: [42, 90, 138, 170],  // Northern Star
  3: [35, 78, 120, 155]   // Stand and Fight
};

const audio = document.getElementById('audio'); // or whatever your audio element id is
const flash = document.getElementById('bgFlash');
let lastFlash = -1;

audio.addEventListener('timeupdate', () => {
  const cues = chorusCues[currentTrack] || [];
  const t = Math.floor(audio.currentTime);
  if (cues.includes(t) && t !== lastFlash) {
    lastFlash = t;
    flash.classList.remove('active');
    void flash.offsetWidth; // force reflow to restart animation
    flash.classList.add('active');
    flash.addEventListener('animationend', () => flash.classList.remove('active'), { once: true });
  }
});
```

---

## Improvement 7 — Age Timeline Section

**Reason:** The site currently has no visual representation of the narrative timeline. A minimal, elegant "Ages" section between the legend box and the player gives first-time visitors story context.

**Expected impact:** Readers who don't read the full legend still understand the scope of the saga.

**Implementation (pure HTML/CSS, no JS needed):**

```html
<div class="ages-bar">
  <div class="age-item">
    <span class="age-glyph">⚡</span>
    <span class="age-label">The Before</span>
  </div>
  <div class="age-sep">—</div>
  <div class="age-item age-active">
    <span class="age-glyph">🜂</span>
    <span class="age-label">The Rise</span>
  </div>
  <div class="age-sep">—</div>
  <div class="age-item">
    <span class="age-glyph">☽</span>
    <span class="age-label">The Fall</span>
  </div>
  <div class="age-sep">—</div>
  <div class="age-item">
    <span class="age-glyph">✦</span>
    <span class="age-label">The Return</span>
  </div>
  <div class="age-sep">—</div>
  <div class="age-item">
    <span class="age-glyph">⚔</span>
    <span class="age-label">The Legacy</span>
  </div>
</div>
```

```css
.ages-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
  width: 100%;
  max-width: 570px;
  padding: 10px 0;
}
.age-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  opacity: 0.4;
}
.age-item.age-active { opacity: 1; }
.age-glyph { font-size: 1rem; color: var(--blue); }
.age-label { font-size: 0.46rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--text); }
.age-sep { color: var(--blue-dim); opacity: 0.3; font-size: 0.7rem; }
```

---

## Improvement 8 — Tagline Rotation

**Reason:** The site currently shows one static tagline ("Thunderheart — An Epic Saga"). Rotating through the four tagline options from A — Core Narrative adds narrative depth without changing the layout.

**Expected impact:** Repeat visitors get a different first impression each time. Taglines hint at the depth of the lore.

**Implementation:**

```javascript
const taglines = [
  'Thunderheart &mdash; An Epic Saga',
  'When the world forgets to fight &mdash; the storm remembers.',
  'Not the strongest. Not the richest. Only those willing to stand alone.',
  'Every age, a new Stormkeeper. Every age, the same thunder.'
];

const taglineEl = document.querySelector('.tagline');
let taglineIndex = 0;

setInterval(() => {
  taglineIndex = (taglineIndex + 1) % taglines.length;
  taglineEl.style.opacity = '0';
  setTimeout(() => {
    taglineEl.innerHTML = taglines[taglineIndex];
    taglineEl.style.opacity = '0.85';
  }, 500);
}, 8000);
```

```css
/* Add transition to .tagline */
.tagline { transition: opacity 0.5s ease; }
```

---

## Improvement 9 — Song Page / Lyrics Modal

**Reason:** The lyrics exist as .md files but are not accessible from the site. Adding a lyrics overlay for each track makes the site a destination, not just a player.

**Expected impact:** Listeners can read the lyrics while the song plays — deepening story engagement.

**Implementation:**

```html
<!-- Add a modal container to the body -->
<div class="lyrics-modal" id="lyricsModal" aria-hidden="true">
  <div class="lyrics-panel">
    <button class="lyrics-close" id="lyricsClose" aria-label="Close">&times;</button>
    <div class="lyrics-title" id="lyricsTitle"></div>
    <div class="lyrics-era" id="lyricsEra"></div>
    <div class="lyrics-body" id="lyricsBody"></div>
  </div>
</div>
```

```css
.lyrics-modal {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(5,6,8,0.88);
  backdrop-filter: blur(12px);
  align-items: center;
  justify-content: center;
}
.lyrics-modal.open { display: flex; }
.lyrics-panel {
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  background: rgba(26,34,48,0.95);
  border: 1px solid rgba(79,214,255,0.2);
  border-radius: 18px;
  padding: 32px 28px;
  position: relative;
}
.lyrics-close {
  position: absolute;
  top: 16px;
  right: 20px;
  background: none;
  border: none;
  color: var(--blue-dim);
  font-size: 1.4rem;
  cursor: pointer;
}
.lyrics-title { font-size: 1rem; font-weight: 700; color: var(--text); margin-bottom: 2px; }
.lyrics-era { font-size: 0.52rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); opacity: 0.7; margin-bottom: 20px; }
.lyrics-body { font-size: 0.78rem; line-height: 1.7; color: var(--text); opacity: 0.88; white-space: pre-wrap; }
```

Store lyrics as inline JS strings in a `const lyrics = { 0: "...", 1: "..." }` object. No fetch needed.

---

## Improvement 10 — Heartbeat Ambient Pulse on Logo

**Reason:** The existing logo mark has a radial glow. Adding a subtle, slow heartbeat pulse animation makes the logo feel alive — consistent with the "the heart beats with thunder" lore.

**Expected impact:** Subliminal brand reinforcement. Visitors sense the logo is alive without being able to say why.

**Implementation:**

```css
/* Replace or extend the existing .logo-mark::before rule */
@keyframes heartbeat {
  0%   { transform: scale(1);   opacity: 0.16; }
  14%  { transform: scale(1.08); opacity: 0.28; }
  28%  { transform: scale(1);   opacity: 0.16; }
  42%  { transform: scale(1.04); opacity: 0.22; }
  56%  { transform: scale(1);   opacity: 0.16; }
  100% { transform: scale(1);   opacity: 0.16; }
}

.logo-mark::before {
  content: "";
  position: absolute;
  inset: -26px;
  background: radial-gradient(ellipse at 50% 50%, rgba(79,214,255,0.16), transparent 70%);
  z-index: -1;
  animation: heartbeat 2.4s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .logo-mark::before { animation: none; }
}
```

The `2.4s` timing is a realistic resting heartbeat cadence — slow enough to be subliminal, fast enough to feel alive.
