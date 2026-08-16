import * as state from './state.js';
import { t, getLang } from './i18n.js';
import { applyTone, supports } from './skinTone.js';
import { escapeHtml } from './utils.js';

export function createEmojiCard(emojiObj, { onClick, onFavorite, onSelect } = {}, index = 0) {
  const card = document.createElement('div');
  card.className = 'emoji-card';
  card.setAttribute('role', 'gridcell');
  // Roving tabindex: exactly one card is in the tab order and the arrow-key
  // handler in a11y.js moves it. Making every card tabbable would put 1358 tab
  // stops between the grid and the footer.
  card.setAttribute('tabindex', index === 0 ? '0' : '-1');
  // Base emoji char, independent of any skin-tone modifier shown to the user.
  card.dataset.emoji = emojiObj.emoji;

  const favorites = state.get('favorites');
  const selected = state.get('selected');
  const skinTone = state.get('skinTone');
  const lang = getLang();

  const isFav = favorites.includes(emojiObj.emoji);
  const isSel = selected.has(emojiObj.emoji);
  if (isSel) card.classList.add('selected');

  const displayEmoji = supports(emojiObj)
    ? applyTone(emojiObj.emoji, skinTone)
    : emojiObj.emoji;
  const name = lang === 'ar' ? emojiObj.arName : emojiObj.enName;

  card.setAttribute('aria-label', name || emojiObj.emoji);

  card.innerHTML = `
    <div class="select-checkbox" aria-hidden="true">${isSel ? '✓' : ''}</div>
    <button class="favorite-btn ${isFav ? 'active' : ''}" aria-pressed="${isFav}"
      aria-label="${escapeHtml(t(isFav ? 'ariaRemoveFav' : 'ariaAddFav'))}">
      ${isFav ? '⭐' : '☆'}
    </button>
    <div class="emoji-icon">${escapeHtml(displayEmoji)}</div>
    <div class="emoji-name">${escapeHtml(name || '')}</div>
  `;

  const favBtn = card.querySelector('.favorite-btn');
  favBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (onFavorite) onFavorite(emojiObj);
  });

  card.addEventListener('click', () => {
    if (state.get('selectMode')) {
      if (onSelect) onSelect(emojiObj);
    } else {
      if (onClick) onClick(emojiObj);
    }
  });

  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      card.click();
    }
  });

  return card;
}

export function renderGrid(container, emojiList, handlers) {
  container.innerHTML = '';
  if (!emojiList || emojiList.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    const icon = document.createElement('div');
    icon.className = 'empty-icon';
    icon.textContent = '🔍';
    const msg = document.createElement('div');
    msg.textContent = t('emptySearch');
    empty.append(icon, msg);
    container.appendChild(empty);
    return;
  }
  const frag = document.createDocumentFragment();
  emojiList.forEach((e, i) => {
    const card = createEmojiCard(e, handlers, i);
    card.style.animationDelay = `${Math.min(i * 12, 400)}ms`;
    frag.appendChild(card);
  });
  container.appendChild(frag);
}

// Rebuilding every grid to reflect one star press cost ~5,400 DOM nodes and
// threw away the user's scroll position and keyboard focus. Patch the cards
// that are already on the page instead.
export function updateFavoriteButtons(favorites) {
  const favSet = new Set(favorites);
  document.querySelectorAll('.emoji-card').forEach((card) => {
    const ch = card.dataset.emoji;
    if (!ch) return;
    const btn = card.querySelector('.favorite-btn');
    if (!btn) return;
    const isFav = favSet.has(ch);
    if (btn.classList.contains('active') === isFav) return;
    btn.classList.toggle('active', isFav);
    btn.setAttribute('aria-pressed', String(isFav));
    btn.setAttribute('aria-label', t(isFav ? 'ariaRemoveFav' : 'ariaAddFav'));
    btn.textContent = isFav ? '⭐' : '☆';
  });
}

// Placeholder shown while the dataset is in flight, and the error state if it
// never arrives — previously both were a silently empty grid.
export function renderGridStatus(container, messageKey, isError = false) {
  container.innerHTML = '';
  const el = document.createElement('div');
  el.className = 'grid-status' + (isError ? ' is-error' : '');
  el.textContent = t(messageKey);
  container.appendChild(el);
}
