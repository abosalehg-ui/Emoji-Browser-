const wired = new WeakSet();

export function setupRovingTabindex(gridSelector) {
  const grid = document.querySelector(gridSelector);
  if (!grid) return;
  // Grid containers persist across re-renders; only attach the handler once
  // to avoid stacking duplicate listeners on every render.
  if (wired.has(grid)) return;
  wired.add(grid);
  grid.addEventListener('keydown', (e) => {
    if (!['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key))
      return;
    const cards = [...grid.querySelectorAll('.emoji-card')];
    if (!cards.length) return;
    const focused = document.activeElement;
    const idx = cards.indexOf(focused);
    if (idx < 0) return;
    e.preventDefault();
    const cols = computeColumns(grid);
    let next = idx;
    switch (e.key) {
      case 'ArrowRight':
        next = Math.min(cards.length - 1, idx + 1);
        break;
      case 'ArrowLeft':
        next = Math.max(0, idx - 1);
        break;
      case 'ArrowDown':
        next = Math.min(cards.length - 1, idx + cols);
        break;
      case 'ArrowUp':
        next = Math.max(0, idx - cols);
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = cards.length - 1;
        break;
    }
    if (next === idx) return;
    // Move the single tab stop along with focus — that is what makes this a
    // roving tabindex rather than 1358 individually tabbable cards.
    cards[idx].setAttribute('tabindex', '-1');
    cards[next].setAttribute('tabindex', '0');
    cards[next].focus();
  });
}

function computeColumns(grid) {
  const style = window.getComputedStyle(grid);
  const cols = style.gridTemplateColumns.split(' ').length;
  return Math.max(1, cols);
}
