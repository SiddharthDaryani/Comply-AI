// content.js
let currentInput = null;
let overlayBox = null;
let debounceTimer = null;

const DEBOUNCE_DELAY = 800; // ms

const SELECTORS = [
  'textarea',
  '[contenteditable="true"]',
  '[data-testid="ocfTextarea"]',
  '[aria-label*="post"], [aria-label*="tweet"]'
].join(', ');

function createOverlay() {
  if (overlayBox) return overlayBox;
  overlayBox = document.createElement('div');
  overlayBox.style.position = 'absolute';
  overlayBox.style.pointerEvents = 'none';
  overlayBox.style.border = '3px solid transparent';
  overlayBox.style.borderRadius = '8px';
  overlayBox.style.zIndex = '99999';
  overlayBox.style.transition = 'border-color 0.3s ease';
  document.body.appendChild(overlayBox);
  return overlayBox;
}

function updateOverlay(element, color) {
  const box = createOverlay();
  const rect = element.getBoundingClientRect();
  box.style.top = `${window.scrollY + rect.top - 3}px`;
  box.style.left = `${window.scrollX + rect.left - 3}px`;
  box.style.width = `${rect.width + 6}px`;
  box.style.height = `${rect.height + 6}px`;
  box.style.borderColor = color;
}

function removeOverlay() {
  if (overlayBox && overlayBox.parentNode) {
    overlayBox.style.borderColor = 'transparent';
    setTimeout(() => {
      if (overlayBox && overlayBox.parentNode) {
        overlayBox.remove();
        overlayBox = null;
      }
    }, 300);
  }
}

async function checkCompliance(text) {
  if (!text.trim()) {
    removeOverlay();
    return;
  }
  try {
    const response = await fetch('http://localhost:8000/check-compliance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    console.log('Fetch status:', response.status);

    if (!response.ok) throw new Error('API error: status ' + response.status);

    const data = await response.json();
    console.log('API response:', data);

    // Show the structure in logs
    if (typeof data !== 'object' || !('compliant' in data)) {
      console.error('API response missing expected fields:', data);
    }

    const color = data.compliant ? '#4ade80' : '#f87171'; // green / red
    updateOverlay(currentInput, color);
    showToast(data.compliant ? 'Compliant' : 'Non-Compliant', data.compliant);
  } catch (err) {
    console.warn('Comply AI: API unreachable or error', err);
    updateOverlay(currentInput, '#fbbf24'); // amber warning
    showToast('API Offline', false);
  }
}

function showToast(message, success) {
  // Remove existing
  document.querySelectorAll('.comply-toast').forEach(t => t.remove());

  const toast = document.createElement('div');
  toast.className = 'comply-toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 20px;
    background: ${success ? '#166534' : '#991b1b'};
    color: white;
    border-radius: 8px;
    font-family: system-ui;
    font-size: 14px;
    z-index: 100000;
    animation: slideIn 0.3s ease;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `;

  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Add CSS for animation
const style = document.createElement('style');
style.textContent = `
@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
`;
document.head.appendChild(style);

function startMonitoring(input) {
  if (currentInput === input) return;

  // Remove listeners for previous input if different
  if (currentInput && currentInput !== input) {
    currentInput.removeEventListener('input', inputHandler);
    currentInput.removeEventListener('paste', inputHandler);
  }

  currentInput = input;

  function getText() {
    if (input.tagName === 'TEXTAREA') return input.value;
    if (input.isContentEditable) return input.innerText || input.textContent;
    return '';
  }

  function inputHandler() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const text = getText();
      checkCompliance(text);
    }, DEBOUNCE_DELAY);
  }

  input.addEventListener('input', inputHandler);
  input.addEventListener('paste', inputHandler);
  input.addEventListener('focus', () => startMonitoring(input));

  setTimeout(() => {
    if (getText().trim()) inputHandler();
  }, 500);
}

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== 1) continue;
      if (node.matches && node.matches(SELECTORS)) {
        startMonitoring(node);
      }
      const inputs = node.querySelectorAll ? node.querySelectorAll(SELECTORS) : [];
      inputs.forEach(startMonitoring);
    }
    for (const node of mutation.removedNodes) {
      if (node.nodeType !== 1) continue;
      if (node === currentInput || (node.contains && currentInput && node.contains(currentInput))) {
        removeOverlay();
        currentInput = null;
      }
    }
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

document.querySelectorAll(SELECTORS).forEach(startMonitoring);

window.addEventListener('beforeunload', () => {
  observer.disconnect();
  removeOverlay();
});
