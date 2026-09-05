"use strict";

// Generates every SVG for the Makkuro theme from one shared body definition,
// so all states stay on-model. Run: node build-assets.js
//
// Design: a plain black ball with two small white eyes. No arms, no legs.
// Everything expressive happens in the eyes, the squash/stretch, and the props.

const fs = require("node:fs");
const path = require("node:path");

const OUT = path.join(__dirname, "assets");

const INK = "#101010";
const WHITE = "#ffffff";
const RED = "#e5484d";
const GOLD = "#ffcf4a";

const VIEWBOX = "-15 -25 45 45";
const CX = 7.5;
const CY = 6.5;
const R = 8.0;
const GROUND = CY + R; // 14.5

const n = (v) => Number(v.toFixed(2));

/* ---------- body ---------- */

// flat solid ball — no gradient, no sheen
function ball(cx = CX, cy = CY, r = R) {
  return `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${INK}"/>`;
}

function shadow(rx = 5.6, y = GROUND + 1.4, op = 0.16) {
  return `<g id="shadow-js"><ellipse cx="${CX}" cy="${n(y)}" rx="${n(rx)}" ry="1" fill="#000" opacity="${op}"/></g>`;
}

/* ---------- eyes ---------- */

const EYE_DX = 2.1;
const EYE_Y = 5.8;
const EYE_W = 1.9;
const EYE_H = 3.8;
const EYE_ROUND = 3.3; // diameter when the eyes pop round — wider than the slit
const EYE_TILT = 14; // both eyes lean the same way, like two soft slashes
const EYE_L = CX - EYE_DX;
const EYE_R = CX + EYE_DX;

// Each eye is a stadium (rx always half the width), so shrinking its height to
// match its width turns it into a true circle — that's how the eyes morph
// between the default slit and the occasional round look. The tilt lives on a
// static wrapper so CSS is free to animate the geometry underneath it.
function eyeRect(cx, cy, w, h, cls = "") {
  const c = cls ? ` class="${cls}"` : "";
  return `<g transform="rotate(${EYE_TILT} ${n(cx)} ${n(cy)})"><rect${c} x="${n(cx - w / 2)}" y="${n(cy - h / 2)}" width="${n(w)}" height="${n(h)}" rx="${n(w / 2)}" fill="${WHITE}"/></g>`;
}

function eyeCenters(spread = 0) {
  return [CX - EYE_DX - spread, CX + EYE_DX + spread];
}

function eyesOpen({ dx = 0, dy = 0, s = 1, squint = 1, spread = 0, round = false, classes = ["", ""] } = {}) {
  const w = (round ? EYE_ROUND : EYE_W) * s;
  const h = round ? w : EYE_H * s * squint;
  return eyeCenters(spread)
    .map((x, i) => eyeRect(x + dx, EYE_Y + dy, w, h, classes[i]))
    .join("");
}

// builds the keyframes that morph one eye through a list of poses
function eyeFrames(name, cx, poses) {
  const body = poses
    .map(({ at, s = 1, squint = 1, round = false }) => {
      const w = (round ? EYE_ROUND : EYE_W) * s;
      const h = round ? w : EYE_H * s * squint;
      return `      ${at} { x: ${n(cx - w / 2)}px; y: ${n(EYE_Y - h / 2)}px; width: ${n(w)}px; height: ${n(h)}px; rx: ${n(w / 2)}px; }`;
    })
    .join("\n");
  return `    @keyframes ${name} {\n${body}\n    }`;
}

// closed / sleepy — arcs curving down
function eyesClosed(dy = 0) {
  return [EYE_L, EYE_R]
    .map(
      (x) =>
        `<path d="M${n(x - 1.7)} ${n(EYE_Y + dy)} Q${n(x)} ${n(EYE_Y + dy + 1.5)} ${n(x + 1.7)} ${n(EYE_Y + dy)}" fill="none" stroke="${WHITE}" stroke-width="0.7" stroke-linecap="round"/>`
    )
    .join("");
}

// ^ ^ — pleased
function eyesHappy(dy = 0) {
  return [EYE_L, EYE_R]
    .map(
      (x) =>
        `<path d="M${n(x - 1.7)} ${n(EYE_Y + dy + 0.9)} Q${n(x)} ${n(EYE_Y + dy - 1.3)} ${n(x + 1.7)} ${n(EYE_Y + dy + 0.9)}" fill="none" stroke="${WHITE}" stroke-width="0.7" stroke-linecap="round"/>`
    )
    .join("");
}

function eyesDead() {
  const w = 1.5;
  return [EYE_L, EYE_R]
    .map(
      (x) =>
        `<path d="M${n(x - w)} ${n(EYE_Y - w)} L${n(x + w)} ${n(EYE_Y + w)} M${n(x + w)} ${n(EYE_Y - w)} L${n(x - w)} ${n(EYE_Y + w)}" stroke="${WHITE}" stroke-width="0.62" stroke-linecap="round"/>`
    )
    .join("");
}

function heart(x, y, s, fill) {
  return `<path d="M0 ${n(1.1 * s)} C${n(-1.5 * s)} ${n(-0.3 * s)} ${n(-0.9 * s)} ${n(-1.5 * s)} 0 ${n(-0.55 * s)} C${n(0.9 * s)} ${n(-1.5 * s)} ${n(1.5 * s)} ${n(-0.3 * s)} 0 ${n(1.1 * s)} Z" fill="${fill}" transform="translate(${n(x)} ${n(y)})"/>`;
}

function eyesHeart() {
  return heart(EYE_L, EYE_Y, 1.25, WHITE) + heart(EYE_R, EYE_Y, 1.25, WHITE);
}

/* ---------- props ---------- */

function note(x, y, s = 1, rot = -12) {
  return `<g transform="translate(${n(x)} ${n(y)}) scale(${s}) rotate(${rot})"><ellipse cx="0" cy="0" rx="1.15" ry="0.9" fill="${INK}"/><path d="M1.05 0.2 L1.05 -3.6 Q2.6 -3.2 2.9 -1.9" fill="none" stroke="${INK}" stroke-width="0.55" stroke-linecap="round"/></g>`;
}

function sparkle(x, y, s = 1) {
  return `<path d="M0 ${n(-1.5 * s)} Q${n(0.3 * s)} ${n(-0.3 * s)} ${n(1.5 * s)} 0 Q${n(0.3 * s)} ${n(0.3 * s)} 0 ${n(1.5 * s)} Q${n(-0.3 * s)} ${n(0.3 * s)} ${n(-1.5 * s)} 0 Q${n(-0.3 * s)} ${n(-0.3 * s)} 0 ${n(-1.5 * s)} Z" fill="${INK}" transform="translate(${n(x)} ${n(y)})"/>`;
}

function laptop(x, y) {
  return `<g transform="translate(${n(x)} ${n(y)})"><path d="M-4.6 0 L4.6 0 L5.6 1.5 L-5.6 1.5 Z" fill="${INK}"/><rect x="-4.2" y="-5.4" width="8.4" height="5.4" rx="0.5" fill="${INK}"/><rect x="-3.5" y="-4.8" width="7" height="4.2" rx="0.3" fill="${WHITE}" opacity="0.92"/><g stroke="${INK}" stroke-width="0.42" stroke-linecap="round" opacity="0.75"><path d="M-2.7 -3.9 H1.2"/><path d="M-2.7 -2.9 H2.3"/><path d="M-2.7 -1.9 H0.2"/></g></g>`;
}

function zzz(x, y) {
  const z = (dx, dy, s, delay) =>
    `<text x="${n(x + dx)}" y="${n(y + dy)}" font-family="Helvetica, Arial, sans-serif" font-size="${n(3.4 * s)}" font-weight="700" fill="${INK}" class="zzz" style="animation-delay:${delay}s">z</text>`;
  return z(0, 0, 1, 0) + z(2.6, -2.8, 1.3, 0.6) + z(5.8, -5.6, 1.6, 1.2);
}

/* ---------- document shell ---------- */

function svg(inner, style = "") {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEWBOX}" width="500" height="500">
  <defs><style>
    * { transform-box: view-box; }
${style}
  </style></defs>
${inner}
</svg>
`;
}

const BREATHE = `    .breathe { transform-origin: ${CX}px ${GROUND}px; animation: breathe 3.4s ease-in-out infinite; }
    @keyframes breathe { 0%,100% { transform: scale(1,1); } 50% { transform: scale(1.02,0.98); } }`;

// the blink — two quick closes, then a long pause
const BLINK = `    .blink { transform-origin: ${CX}px ${EYE_Y}px; animation: blink 4.2s infinite; }
    @keyframes blink {
      0%, 40%, 100% { transform: scaleY(1); }
      43% { transform: scaleY(0.06); }
      46% { transform: scaleY(1); }
      52% { transform: scaleY(1); }
      55% { transform: scaleY(0.06); }
      58% { transform: scaleY(1); }
    }`;

// Standing still: slits by default, dropping into round eyes now and then and
// narrowing to a squint in between.
const IDLE_SHAPE = `    .eye-l, .eye-r { animation-duration: 15s; animation-timing-function: ease-in-out; animation-iteration-count: infinite; }
    .eye-l { animation-name: eye-l; }
    .eye-r { animation-name: eye-r; }
${eyeFrames("eye-l", EYE_L, [
  { at: "0%, 36%" },
  { at: "44%, 56%", round: true },
  { at: "64%, 72%", squint: 0.55 },
  { at: "80%, 100%" },
])}
${eyeFrames("eye-r", EYE_R, [
  { at: "0%, 36%" },
  { at: "44%, 56%", round: true },
  { at: "64%, 72%", squint: 0.55 },
  { at: "80%, 100%" },
])}`;

// Looking around: the pair glides across the face and pauses on each pose, and
// the two eyes scale against each other so the one heading around the curve
// reads as further away. The round moment lands while the eyes are near centre.
const WANDER = `    .wander { transform-origin: ${CX}px ${EYE_Y}px; animation: wander 12s ease-in-out infinite; }
    @keyframes wander {
      0%, 8%    { transform: translate(0, 0); }
      18%, 30%  { transform: translate(-1.7px, 0.7px); }
      40%, 50%  { transform: translate(1.8px, -0.5px); }
      60%, 70%  { transform: translate(0.4px, 0.9px); }
      80%, 90%  { transform: translate(-1.2px, -0.8px); }
      100%      { transform: translate(0, 0); }
    }
    .eye-l, .eye-r { animation-duration: 12s; animation-timing-function: ease-in-out; animation-iteration-count: infinite; }
    .eye-l { animation-name: eye-l; }
    .eye-r { animation-name: eye-r; }
${eyeFrames("eye-l", EYE_L, [
  { at: "0%, 8%" },
  { at: "18%, 30%", s: 0.74 },
  { at: "40%, 50%", s: 1.1 },
  { at: "60%, 70%", round: true },
  { at: "80%, 90%", s: 0.85 },
  { at: "100%" },
])}
${eyeFrames("eye-r", EYE_R, [
  { at: "0%, 8%" },
  { at: "18%, 30%", s: 1.1 },
  { at: "40%, 50%", s: 0.74 },
  { at: "60%, 70%", round: true },
  { at: "80%, 90%", s: 1.08 },
  { at: "100%" },
])}`;

// standard stack: ball + blinking eyes
function character(eyes, { blink = true } = {}) {
  const inner = blink ? `<g class="blink">${eyes}</g>` : eyes;
  return `<g class="breathe">${ball()}${inner}</g>`;
}

/* ---------- states ---------- */

const files = {};

// idle — the only file the renderer rewires for cursor tracking
files["makkuro-idle-follow.svg"] = svg(
  `${shadow()}
  <g id="body-js">
    <g class="breathe">
      ${ball()}
      <g id="eyes-js"><g class="blink">${eyesOpen({ classes: ["eye-l", "eye-r"] })}</g></g>
    </g>
  </g>`,
  `${BREATHE}
${BLINK}
${IDLE_SHAPE}
    #eyes-js, #body-js, #shadow-js { transition: transform 0.2s ease-out; }
    #shadow-js { transform-origin: ${CX}px ${GROUND}px; }`
);

// idle glance — the eye pair drifts and tilts around the face
files["makkuro-idle-look.svg"] = svg(
  `${shadow()}
  <g class="breathe">
    ${ball()}
    <g class="wander"><g class="blink">${eyesOpen({ classes: ["eye-l", "eye-r"] })}</g></g>
  </g>`,
  `${BREATHE}
${BLINK}
${WANDER}`
);

// chill — sunglasses + drink
files["makkuro-chill.svg"] = svg(
  `${shadow()}
  <g class="breathe">
    ${ball()}
    <g>
      <rect x="${n(EYE_L - 1.85)}" y="${n(EYE_Y - 1.45)}" width="3.3" height="2.9" rx="0.75" fill="${INK}" stroke="${WHITE}" stroke-width="0.45"/>
      <rect x="${n(EYE_R - 1.45)}" y="${n(EYE_Y - 1.45)}" width="3.3" height="2.9" rx="0.75" fill="${INK}" stroke="${WHITE}" stroke-width="0.45"/>
      <path d="M${n(EYE_L + 1.45)} ${n(EYE_Y - 0.75)} H${n(EYE_R - 1.45)}" stroke="${WHITE}" stroke-width="0.45"/>
      <path d="M${n(EYE_L - 1.85)} ${n(EYE_Y - 1.1)} L${n(EYE_L - 3.3)} ${n(EYE_Y - 1.5)}" stroke="${WHITE}" stroke-width="0.45" stroke-linecap="round"/>
      <path d="M${n(EYE_R + 1.85)} ${n(EYE_Y - 1.1)} L${n(EYE_R + 3.3)} ${n(EYE_Y - 1.5)}" stroke="${WHITE}" stroke-width="0.45" stroke-linecap="round"/>
    </g>
  </g>
  <g transform="translate(17.4 10.5)" class="bob">
    <path d="M-1.7 -2.6 L1.7 -2.6 L1.25 2.6 L-1.25 2.6 Z" fill="${WHITE}" stroke="${INK}" stroke-width="0.5"/>
    <path d="M-1.75 -2.6 H1.75" stroke="${INK}" stroke-width="0.55" stroke-linecap="round"/>
    <path d="M0.7 -2.8 L2.2 -6.2" stroke="${INK}" stroke-width="0.5" stroke-linecap="round"/>
  </g>`,
  `${BREATHE}
    .bob { transform-origin: 17.4px 13px; animation: bob 3.4s ease-in-out infinite; }
    @keyframes bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-0.5px); } }`
);

// thinking — tangled scribbles overhead, eyes glancing up
files["makkuro-thinking.svg"] = svg(
  `${shadow()}
  <g class="tilt">
    <g class="breathe">
      ${ball()}
      <g class="blink">${eyesOpen({ dy: -0.5, squint: 0.85 })}</g>
    </g>
  </g>
  <g class="scribble" stroke="${INK}" stroke-width="0.5" fill="none" stroke-linecap="round">
    <path d="M1.2 -5.0 c1.6 -2.2 3.6 0.6 1.4 1.6 c-2 0.9 -0.4 3 1.4 1.7"/>
    <path d="M11.8 -6.3 c2.2 -1.4 3.2 1.8 0.9 2.2 c-2.1 0.4 -1.4 2.6 0.7 2"/>
    <path d="M6.4 -8.2 c1.8 -1.9 4 0.9 1.7 1.9 c-2.1 0.9 -0.6 2.8 1.2 1.6"/>
  </g>`,
  `${BREATHE}
${BLINK}
    .tilt { transform-origin: ${CX}px ${GROUND}px; animation: tilt 3.6s ease-in-out infinite; }
    @keyframes tilt { 0%,100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }
    .scribble { transform-origin: ${CX}px -6px; animation: scribble 2.2s ease-in-out infinite; }
    @keyframes scribble { 0%,100% { transform: rotate(-4deg) translateY(0); opacity: .85; } 50% { transform: rotate(4deg) translateY(-0.6px); opacity: 1; } }`
);

// working — parked at the laptop, eyes down on the screen
files["makkuro-working-typing.svg"] = svg(
  `${shadow(5.2)}
  <g class="lean">
    <g class="breathe">
      ${ball()}
      <g class="blink">${eyesOpen({ dx: 0.45, dy: 0.7, squint: 0.6 })}</g>
    </g>
  </g>
  <g class="clack">${laptop(18.6, 11.6)}</g>`,
  `${BREATHE}
${BLINK}
    .lean { transform-origin: ${CX}px ${GROUND}px; animation: lean 0.9s ease-in-out infinite; }
    @keyframes lean { 0%,100% { transform: rotate(2deg) translateY(0); } 50% { transform: rotate(4deg) translateY(-0.35px); } }
    .clack { transform-origin: 18.6px 13px; animation: clack 0.42s ease-in-out infinite; }
    @keyframes clack { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-0.3px); } }`
);

// juggling — 2 sessions: bouncing to the beat
files["makkuro-working-juggling.svg"] = svg(
  `${shadow(5.0)}
  <g class="dance">${character(eyesHappy(), { blink: false })}</g>
  <g class="float-a">${note(-2.4, -2.6, 0.85)}</g>
  <g class="float-b">${note(17.0, -4.6, 0.95, 10)}</g>`,
  `${BREATHE}
${BLINK}
    .dance { transform-origin: ${CX}px ${GROUND}px; animation: dance 0.9s ease-in-out infinite; }
    @keyframes dance { 0%,100% { transform: rotate(-6deg) translateY(0); } 50% { transform: rotate(6deg) translateY(-0.9px); } }
    .float-a { animation: floaty 2.6s ease-in-out infinite; }
    .float-b { animation: floaty 2.6s ease-in-out infinite 1.3s; }
    @keyframes floaty { 0% { transform: translateY(1.5px); opacity: 0; } 30%,70% { opacity: 1; } 100% { transform: translateY(-3.5px); opacity: 0; } }`,
  );

// building — 3+ sessions: full disco
files["makkuro-working-building.svg"] = svg(
  `${shadow(4.8)}
  <g class="dance-hard">${character(eyesHappy(), { blink: false })}</g>
  <g class="float-a">${note(-3.0, -3.2, 0.9)}</g>
  <g class="float-b">${note(17.6, -5.0, 1.0, 12)}</g>
  <g class="float-c">${note(7.2, -8.6, 0.8, -18)}</g>`,
  `${BREATHE}
${BLINK}
    .dance-hard { transform-origin: ${CX}px ${GROUND}px; animation: dance-hard 0.62s ease-in-out infinite; }
    @keyframes dance-hard { 0%,100% { transform: rotate(-9deg) translateY(0) scale(1,1); } 50% { transform: rotate(9deg) translateY(-1.5px) scale(0.97,1.03); } }
    .float-a { animation: floaty 2.1s ease-in-out infinite; }
    .float-b { animation: floaty 2.1s ease-in-out infinite 0.7s; }
    .float-c { animation: floaty 2.1s ease-in-out infinite 1.4s; }
    @keyframes floaty { 0% { transform: translateY(2px); opacity: 0; } 30%,70% { opacity: 1; } 100% { transform: translateY(-4.5px); opacity: 0; } }`
);

// conducting — subagents: slow sway, more notes
files["makkuro-working-conducting.svg"] = svg(
  `${shadow(5.2)}
  <g class="sway">${character(eyesHappy(-0.2), { blink: false })}</g>
  <g class="float-a">${note(-2.8, -3.6, 0.85)}</g>
  <g class="float-b">${note(17.4, -3.2, 0.85, 14)}</g>`,
  `${BREATHE}
${BLINK}
    .sway { transform-origin: ${CX}px ${GROUND}px; animation: sway 1.1s ease-in-out infinite; }
    @keyframes sway { 0%,100% { transform: rotate(-7deg); } 50% { transform: rotate(7deg); } }
    .float-a { animation: floaty 2.4s ease-in-out infinite; }
    .float-b { animation: floaty 2.4s ease-in-out infinite 1.2s; }
    @keyframes floaty { 0% { transform: translateY(1.5px); opacity: 0; } 30%,70% { opacity: 1; } 100% { transform: translateY(-3.8px); opacity: 0; } }`
);

// error — X_X and an ERROR plate
files["makkuro-error.svg"] = svg(
  `${shadow(5.4, GROUND + 1.4, 0.13)}
  <g class="slump">
    ${ball()}
    ${eyesDead()}
  </g>
  <g class="plate">
    <rect x="14.6" y="-2.2" width="13.6" height="6.2" rx="0.9" fill="${WHITE}" stroke="${INK}" stroke-width="0.55"/>
    <text x="21.4" y="1.7" font-family="Helvetica, Arial, sans-serif" font-size="3.0" font-weight="700" fill="${RED}" text-anchor="middle">ERROR</text>
    <path d="M16.0 4.0 L16.0 9.5" stroke="${INK}" stroke-width="0.55" stroke-linecap="round"/>
  </g>
  <g class="drop"><path d="M-1.0 2.0 c1.5 1.9 1.5 2.7 0 3.3 c-1.5 -0.6 -1.5 -1.4 0 -3.3 Z" fill="#7fc7e8"/></g>`,
  `    .slump { transform-origin: ${CX}px ${GROUND}px; animation: slump 2.4s ease-in-out infinite; }
    @keyframes slump { 0%,100% { transform: rotate(-3deg) scale(1,1); } 50% { transform: rotate(-3deg) scale(1.02,0.97); } }
    .plate { transform-origin: 21px 4px; animation: plate 2.4s ease-in-out infinite; }
    @keyframes plate { 0%,100% { transform: rotate(-2deg); } 50% { transform: rotate(2deg); } }
    .drop { animation: drop 2.2s ease-in-out infinite; }
    @keyframes drop { 0% { transform: translateY(-1px); opacity: 0; } 35% { opacity: 1; } 100% { transform: translateY(3.5px); opacity: 0; } }`
);

// attention — lightbulb idea, heart eyes
files["makkuro-happy.svg"] = svg(
  `${shadow(5.2)}
  <g class="hop">${character(eyesHappy(-0.1), { blink: false })}</g>
  <g class="bulb">
    <circle cx="${CX}" cy="-7.6" r="2.5" fill="${GOLD}" stroke="${INK}" stroke-width="0.5"/>
    <path d="M${n(CX - 1.15)} ${-5.3} h2.3 M${n(CX - 0.85)} ${-4.4} h1.7" stroke="${INK}" stroke-width="0.5" stroke-linecap="round"/>
    <path d="M${n(CX - 0.9)} ${-8.4} q0.9 1.1 0 2.1 M${n(CX + 0.9)} ${-8.4} q-0.9 1.1 0 2.1" stroke="${INK}" stroke-width="0.4" fill="none" opacity="0.5"/>
    <g stroke="${INK}" stroke-width="0.5" stroke-linecap="round">
      <path d="M${n(CX - 4.4)} ${-9.6} l-1.2 -1.0"/>
      <path d="M${n(CX + 4.4)} ${-9.6} l1.2 -1.0"/>
      <path d="M${CX} ${-11.2} v-1.4"/>
    </g>
  </g>
  <g class="spark-a">${sparkle(-2.2, -2.2, 0.85)}</g>
  <g class="spark-b">${sparkle(17.2, -1.4, 0.85)}</g>`,
  `${BREATHE}
    .hop { transform-origin: ${CX}px ${GROUND}px; animation: hop 0.85s ease-in-out infinite; }
    @keyframes hop { 0%,100% { transform: translateY(0) scale(1,1); } 45% { transform: translateY(-1.8px) scale(0.97,1.03); } }
    .bulb { transform-origin: ${CX}px -7px; animation: glow 1.4s ease-in-out infinite; }
    @keyframes glow { 0%,100% { opacity: 0.75; transform: scale(0.97); } 50% { opacity: 1; transform: scale(1.04); } }
    .spark-a { transform-origin: -2.2px -2.2px; animation: twinkle 1.8s ease-in-out infinite; }
    .spark-b { transform-origin: 17.2px -1.4px; animation: twinkle 1.8s ease-in-out infinite 0.9s; }
    @keyframes twinkle { 0%,100% { transform: scale(0.3); opacity: 0; } 50% { transform: scale(1); opacity: 1; } }`
);

// notification — wide eyes and a bouncing "!"
files["makkuro-notification.svg"] = svg(
  `${shadow(5.2)}
  <g class="alert">${character(eyesOpen({ s: 1.15, spread: 0.5, round: true }), { blink: false })}</g>
  <g class="bang">
    <path d="M${CX} -10.8 L${n(CX + 1.15)} -4.8 L${n(CX - 1.15)} -4.8 Z" fill="${RED}"/>
    <circle cx="${CX}" cy="-3.4" r="1.05" fill="${RED}"/>
  </g>`,
  `${BREATHE}
    .alert { transform-origin: ${CX}px ${GROUND}px; animation: alert 0.55s ease-in-out infinite; }
    @keyframes alert { 0%,100% { transform: translateX(-0.5px); } 50% { transform: translateX(0.5px); } }
    .bang { transform-origin: ${CX}px -7px; animation: bang 0.9s ease-in-out infinite; }
    @keyframes bang { 0%,100% { transform: scale(1) translateY(0); } 50% { transform: scale(1.12) translateY(-0.7px); } }`
);

// sleeping — settled into a puddle, zzz
files["makkuro-sleeping.svg"] = svg(
  `${shadow(6.0, GROUND + 1.4, 0.13)}
  <g class="snore">
    <ellipse cx="${CX}" cy="10.0" rx="8.0" ry="5.4" fill="${INK}"/>
    <g transform="translate(0 4.2)">${eyesClosed()}</g>
  </g>
  <g class="zzz-wrap">${zzz(16.2, 2.0)}</g>`,
  `    .snore { transform-origin: ${CX}px ${n(GROUND + 1)}px; animation: snore 4s ease-in-out infinite; }
    @keyframes snore { 0%,100% { transform: scale(1,1); } 50% { transform: scale(1.03,0.95); } }
    .zzz { opacity: 0; animation: zzz 3.6s ease-in-out infinite; }
    @keyframes zzz { 0% { opacity: 0; transform: translateY(1.5px); } 30% { opacity: 1; } 70% { opacity: 0.8; } 100% { opacity: 0; transform: translateY(-2.5px); } }`
);

// poke reaction — startled hop
files["makkuro-react-poke.svg"] = svg(
  `${shadow(5.0)}
  <g class="startle">${character(eyesOpen({ s: 1.3, spread: 0.7, round: true }), { blink: false })}</g>
  <g class="pop" stroke="${INK}" stroke-width="0.55" stroke-linecap="round">
    <path d="M-1.8 -3.6 l-1.6 -1.4"/>
    <path d="M16.8 -3.6 l1.6 -1.4"/>
    <path d="M${CX} -6.6 v-1.8"/>
  </g>`,
  `    .startle { transform-origin: ${CX}px ${GROUND}px; animation: startle 0.6s ease-out 3; }
    @keyframes startle { 0% { transform: translateY(0) scale(1,1); } 18% { transform: translateY(-2.6px) scale(0.92,1.1); } 45% { transform: translateY(0) scale(1.08,0.92); } 100% { transform: translateY(0) scale(1,1); } }
    .pop { transform-origin: ${CX}px -4px; animation: pop 0.6s ease-out 3; }
    @keyframes pop { 0% { opacity: 0; transform: scale(0.4); } 30% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(1.15); } }`
);

// drag reaction — swinging, eyes squished
files["makkuro-react-drag.svg"] = svg(
  `${shadow(4.0, GROUND + 1.4, 0.1)}
  <g class="dangle">
    <g class="breathe">
      ${ball()}
      ${eyesOpen({ dy: -0.4, squint: 0.45, spread: 0.2 })}
    </g>
  </g>`,
  `${BREATHE}
    .dangle { transform-origin: ${CX}px -2px; animation: dangle 1.1s ease-in-out infinite; }
    @keyframes dangle { 0%,100% { transform: rotate(-9deg); } 50% { transform: rotate(9deg); } }`
);

/* ---------- write ---------- */

fs.mkdirSync(OUT, { recursive: true });
for (const [name, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(OUT, name), content, "utf8");
}
console.log(`wrote ${Object.keys(files).length} svg files to ${OUT}`);
