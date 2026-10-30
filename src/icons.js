// Helpers for SVG icons
export const svg = (paths) => `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    ${paths}
  </svg>
`;

export const icons = {
  lista: svg('<rect x="5" y="4" width="14" height="17" rx="3"/><path d="M9 3h6v3H9zM9 11h6M9 16h6"/>'),
  historico: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  precos: svg('<path d="M4 19h16M6 15l5-5 4 3 5-8M16 5h4v4"/>'),
  despensa: svg('<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M4 12h16M12 4v16M8 8h0M16 16h0"/>'),
  camera: svg('<path d="M8 6l2-3h4l2 3h3a2 2 0 0 1 2 2v11H3V8a2 2 0 0 1 2-2z"/><circle cx="12" cy="12" r="4"/>')
};
