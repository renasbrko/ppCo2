// ===== Safe DOM Utilities =====
// Prevents XSS and DOM injection attacks

// Escape HTML content safely
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Create element with safe content
function createElementWithText(tag, text, className = '') {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

// Set element content safely
function setElementContent(element, content) {
  if (typeof content === 'string') {
    element.textContent = content;
  } else if (content instanceof Node) {
    element.appendChild(content);
  } else {
    element.textContent = String(content || '');
  }
}

// Create safe link
function createSafeLink(href, text, target = '_self') {
  const a = document.createElement('a');
  a.href = href;
  a.textContent = text;
  if (target === '_blank') {
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  }
  return a;
}

// Validate YouTube URL securely
function validateYouTubeUrl(url) {
  try {
    if (!url || typeof url !== 'string') return null;
    
    const cleanUrl = url.trim();
    
    // Reject dangerous protocols
    if (cleanUrl.toLowerCase().startsWith('javascript:') || 
        cleanUrl.toLowerCase().startsWith('data:') ||
        cleanUrl.toLowerCase().startsWith('vbscript:')) {
      return null;
    }
    
    const urlObj = new URL(cleanUrl);
    
    // Only allow HTTPS
    if (urlObj.protocol !== 'https:') return null;
    
    // Strict hostname validation
    const allowedHosts = ['youtube.com', 'www.youtube.com', 'youtu.be'];
    if (!allowedHosts.includes(urlObj.hostname)) return null;
    
    return urlObj.toString();
  } catch (error) {
    return null;
  }
}

// Convert YouTube URL to safe embed
function toSafeYoutubeEmbed(url) {
  const validUrl = validateYouTubeUrl(url);
  if (!validUrl) return null;
  
  try {
    const urlObj = new URL(validUrl);
    
    if (urlObj.hostname === 'youtu.be') {
      const videoId = urlObj.pathname.substring(1);
      return `https://www.youtube-nocookie.com/embed/${videoId}`;
    }
    
    if (urlObj.hostname === 'youtube.com' || urlObj.hostname === 'www.youtube.com') {
      const videoId = urlObj.searchParams.get('v');
      if (videoId) {
        return `https://www.youtube-nocookie.com/embed/${videoId}`;
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

// Create safe table row
function createSafeTableRow(cells, className = '') {
  const tr = document.createElement('tr');
  if (className) tr.className = className;
  
  cells.forEach(cellContent => {
    const td = document.createElement('td');
    if (typeof cellContent === 'string') {
      td.innerHTML = cellContent; // Only for trusted HTML like badges
    } else if (cellContent instanceof Node) {
      td.appendChild(cellContent);
    } else {
      td.textContent = String(cellContent || '');
    }
    tr.appendChild(td);
  });
  
  return tr;
}

// Create safe option element
function createSafeOption(value, text, selected = false) {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = text;
  option.selected = selected;
  return option;
}

// Clear element content safely
function clearElementContent(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

// Export utilities
window.SafeDOM = {
  escapeHtml,
  createElementWithText,
  setElementContent,
  createSafeLink,
  validateYouTubeUrl,
  toSafeYoutubeEmbed,
  createSafeTableRow,
  createSafeOption,
  clearElementContent
};
