/* One mark per chip, drawn to match the word it sits on.
   All 12x12, stroked in currentColor, so they gray out with the chip.
   Add a new chip: add its key here, reference it as m:"key" in bio.data.js. */

export const G = {
  sun:'<circle cx="6" cy="6" r="2.2"/><path d="M6 .8v1.6M6 9.6v1.6M.8 6h1.6M9.6 6h1.6M2.3 2.3l1.1 1.1M8.6 8.6l1.1 1.1M9.7 2.3L8.6 3.4M3.4 8.6l-1.1 1.1"/>',
  skyline:'<path d="M1.6 11V4.5h2.6V11M4.2 11V1.6h3.1V11M7.3 11V6h3.1V11"/>',
  node:'<circle cx="6" cy="6" r="1.6"/><path d="M6 1v3.4M6 7.6V11M1 6h3.4M7.6 6H11"/>',
  funnel:'<path d="M1.4 1.6h9.2L7 6.2V10L5 11V6.2z"/>',
  sheet:'<path d="M2.4 1.4h4.6L9.6 4v6.6H2.4z"/><path d="M7 1.4V4h2.6"/>',
  swap:'<path d="M1.6 4.2h8.8M8.4 2.2l2 2-2 2M10.4 7.8H1.6M3.6 5.8l-2 2 2 2"/>',
  branch:'<path d="M6 11V6M6 6L2.4 2.6M6 6l3.6-3.4M6 8.2l3-2.6"/>',
  quote:'<path d="M3.4 7.6c-1.2 0-1.9-.8-1.9-1.9 0-1.6 1.2-3 2.8-3.4M8.6 7.6c-1.2 0-1.9-.8-1.9-1.9 0-1.6 1.2-3 2.8-3.4"/>',
  pediment:'<path d="M6 1.2l4.6 2.6H1.4z"/><path d="M2.8 3.8v5.4M6 3.8v5.4M9.2 3.8v5.4M1.2 10.6h9.6"/>',
  shelf:'<path d="M1.4 10.4h9.2"/><path d="M2.8 10.4V4h1.8v6.4M5.4 10.4V2.6h1.6v7.8M7.8 10.4V4.8h1.6v5.6"/>',
  book:'<path d="M6 3.2C4.6 2 3.2 1.7 1.4 1.9v7c1.8-.2 3.2.1 4.6 1.3 1.4-1.2 2.8-1.5 4.6-1.3v-7c-1.8-.2-3.2.1-4.6 1.3zM6 3.2v7"/>',
  frame:'<rect x="1.4" y="1.9" width="9.2" height="8.2" rx=".5"/><path d="M3.2 8.2l2.1-2.6 1.5 1.7 1.1-1.2 1.9 2.1z"/>',
  printer:'<path d="M3.4 4.6V1.4h5.2v3.2"/><rect x="1.4" y="4.6" width="9.2" height="3.8" rx=".6"/><path d="M3.4 8.4v2.2h5.2V8.4"/>',
  asterisk:'<path d="M6 1.4v9.2M2 3.4l8 5.2M10 3.4L2 8.6"/>',
  easel:'<path d="M2 1.6h8v5.6H2z"/><path d="M6 7.2v3.2M6 10.4l-2.4 0M6 10.4l2.4 0"/>',
  compass:'<circle cx="6" cy="6" r="4.8"/><path d="M7.8 4.2L5 5l-.8 2.8L7 7z"/>',
  door:'<path d="M2.6 10.8V1.6h6.8v9.2"/><path d="M1.4 10.8h9.2"/><circle cx="7.7" cy="6.4" r=".7"/>',
  flock:'<circle cx="2.6" cy="8.4" r="1.7"/><circle cx="6" cy="4.6" r="1.7"/><circle cx="9.4" cy="8.4" r="1.7" fill="currentColor"/>',
  case:'<rect x="1.3" y="3.7" width="9.4" height="6.6" rx=".8"/><path d="M4.4 3.7V2.4c0-.5.4-.8.9-.8h1.4c.5 0 .9.3.9.8v1.3M1.3 6.6h9.4"/>',
  screen:'<rect x="1.3" y="2" width="9.4" height="6.2" rx=".7"/><path d="M4.4 10.4h3.2M6 8.2v2.2"/>',
  tag:'<path d="M5.6 1.5H10v4.4l-4.6 4.6-4.4-4.4z"/><circle cx="8" cy="3.6" r=".85"/>',
  sprout:'<path d="M6 10.8V5.4"/><path d="M6 6.2C4.6 6.2 3 5.4 2.6 3.4c2 0 3.4.9 3.4 2.8zM6 6.6c1.4 0 3-.8 3.4-2.8-2 0-3.4.9-3.4 2.8z"/>',
  team:'<circle cx="6" cy="3.1" r="1.5"/><circle cx="2.4" cy="8.6" r="1.5"/><circle cx="9.6" cy="8.6" r="1.5"/><path d="M5 4.4L3.4 7.3M7 4.4l1.6 2.9M3.9 8.6h4.2"/>',
  stack:'<path d="M1.4 9.6h9.2M2.2 9.6V7.2h7.6v2.4M3.1 7.2V4.9h5.8v2.3M4.1 4.9V2.5h3.8v2.4"/>',
  code:'<path d="M4.2 3.4L1.3 6l2.9 2.6M7.8 3.4L10.7 6 7.8 8.6M6.6 2.2L5.4 9.8"/>',
  pen:'<path d="M1.5 10.5l.7-2.4 6-6a1.2 1.2 0 011.7 1.7l-6 6z"/><path d="M7.4 2.9l1.7 1.7"/>',
  window:'<rect x="1.4" y="1.9" width="9.2" height="8.2" rx=".6"/><path d="M1.4 4.3h9.2M6 4.3v5.8"/>',
  envelope:'<rect x="1.3" y="2.6" width="9.4" height="6.8" rx=".7"/><path d="M1.6 3.2L6 6.9l4.4-3.7"/>',
  film:'<rect x="1.3" y="2.2" width="9.4" height="7.6" rx=".7"/><path d="M3.7 2.2v7.6M8.3 2.2v7.6M1.3 6h9.4"/>',
  lens:'<circle cx="5.2" cy="5.2" r="3.6"/><path d="M7.9 7.9l2.7 2.7"/>',
  plus:'<circle cx="6" cy="6" r="5.2"/><path d="M3.5 6h5M6 3.5v5"/>'
};

export const mark = key =>
  `<span class="mark" aria-hidden="true"><svg viewBox="0 0 12 12" fill="none" `
  + `stroke="currentColor" stroke-width="1.05" stroke-linecap="round" stroke-linejoin="round">`
  + (G[key] || G.plus) + `</svg></span>`;
