// Tab Search - Popup Script

let allTabs = [];
let filteredTabs = [];
let selectedIndex = -1;
let windowsMap = new Map();

// DOM Elements
const searchInput = document.getElementById('searchInput');
const tabList = document.getElementById('tabList');
const stats = document.getElementById('stats');

// Initialize
async function init() {
  await loadAllTabs();
  setupEventListeners();
  searchInput.focus();
}

// Load all tabs from all windows
async function loadAllTabs() {
  try {
    // Use chrome.tabs.query() instead of chrome.windows.getAll()
    // This returns all tabs from all windows with just 'tabs' permission!
    const tabs = await chrome.tabs.query({});
    console.log('Loaded tabs:', tabs.length);
    
    allTabs = [];
    windowsMap.clear();
    
    // Build windows map from tab data
    const windowIds = [...new Set(tabs.map(t => t.windowId))];
    console.log('Found windows:', windowIds.length, '- IDs:', windowIds);
    
    // Get current window for sorting
    const currentWindow = await chrome.windows.getCurrent();
    
    windowIds.forEach((windowId, index) => {
      const windowTabs = tabs.filter(t => t.windowId === windowId);
      const isFocused = windowId === currentWindow.id;
      
      windowsMap.set(windowId, {
        index: index + 1,
        focused: isFocused,
        tabCount: windowTabs.length
      });
      
      windowTabs.forEach(tab => {
        allTabs.push({
          ...tab,
          windowIndex: index + 1,
          windowFocused: isFocused
        });
      });
    });

    console.log('Total tabs loaded:', allTabs.length);

    // Sort: current window first, then by window id, then by tab index
    allTabs.sort((a, b) => {
      if (a.windowId === currentWindow.id && b.windowId !== currentWindow.id) return -1;
      if (b.windowId === currentWindow.id && a.windowId !== currentWindow.id) return 1;
      if (a.windowId !== b.windowId) return a.windowId - b.windowId;
      return a.index - b.index;
    });

    filteredTabs = [...allTabs];
    updateStats();
    renderTabs();
    
    // Debug: show window count in UI
    console.log('Debug - Windows found:', windowsMap.size, 'Tabs total:', allTabs.length);
    
  } catch (error) {
    console.error('加载Tab失败:', error);
    tabList.innerHTML = `
      <div class="no-results">
        <div class="no-results-icon">⚠️</div>
        <div class="no-results-text">加载失败</div>
        <div style="font-size:12px;color:#888;margin-top:8px;">${error.message}</div>
      </div>
    `;
  }
}

// Update statistics
function updateStats() {
  const windowCount = windowsMap.size;
  const totalTabs = allTabs.length;
  const filteredCount = filteredTabs.length;

  if (filteredCount === totalTabs) {
    stats.textContent = `共 ${windowCount} 个窗口，${totalTabs} 个Tab`;
  } else {
    stats.textContent = `找到 ${filteredCount} 个结果 (共 ${totalTabs} 个Tab)`;
  }
}

// Filter tabs based on search query
function filterTabs(query) {
  if (!query.trim()) {
    filteredTabs = [...allTabs];
  } else {
    const lowerQuery = query.toLowerCase();
    filteredTabs = allTabs.filter(tab => {
      const titleMatch = tab.title && tab.title.toLowerCase().includes(lowerQuery);
      const urlMatch = tab.url && tab.url.toLowerCase().includes(lowerQuery);
      return titleMatch || urlMatch;
    });
  }
  selectedIndex = -1;
  updateStats();
  renderTabs();
}

// Highlight matching text
function highlightText(text, query) {
  if (!query.trim() || !text) return escapeHtml(text);

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) return escapeHtml(text);

  const before = text.substring(0, index);
  const match = text.substring(index, index + query.length);
  const after = text.substring(index + query.length);

  return escapeHtml(before) + `<span class="highlight">${escapeHtml(match)}</span>` + escapeHtml(after);
}

// Escape HTML special characters
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Render tabs list
function renderTabs() {
  if (filteredTabs.length === 0) {
    tabList.innerHTML = `
      <div class="no-results">
        <div class="no-results-icon">🔍</div>
        <div class="no-results-text">未找到匹配的Tab</div>
      </div>
    `;
    return;
  }
  
  // Debug info
  console.log('Rendering tabs:', filteredTabs.length, 'from', windowsMap.size, 'windows');

  // Group tabs by window
  const groupedTabs = new Map();
  filteredTabs.forEach((tab, index) => {
    if (!groupedTabs.has(tab.windowId)) {
      groupedTabs.set(tab.windowId, []);
    }
    groupedTabs.get(tab.windowId).push({ ...tab, filteredIndex: index });
  });

  const query = searchInput.value;
  let html = '';

  groupedTabs.forEach((tabs, windowId) => {
    const windowInfo = windowsMap.get(windowId);
    const isCurrentWindow = tabs[0].windowFocused;

    html += `
      <div class="window-group">
        <div class="window-header ${isCurrentWindow ? 'current' : ''}">
          <span class="window-icon">${isCurrentWindow ? '🪟' : '📑'}</span>
          <span>窗口 ${windowInfo.index} ${isCurrentWindow ? '(当前)' : ''}</span>
          <span class="window-tabs-count">${tabs.length} 个Tab</span>
        </div>
        <div class="window-tabs">
    `;

    tabs.forEach(tab => {
      const isActive = tab.active ? 'active' : '';
      const isSelected = tab.filteredIndex === selectedIndex ? 'selected' : '';
      const favicon = tab.favIconUrl || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E📄%3C/text%3E%3C/svg%3E";

      let badges = '';
      if (tab.active || tab.audible) {
        badges = '<div class="tab-badges">';
        if (tab.active) badges += '<span class="tab-badge active">当前</span>';
        if (tab.audible) badges += '<span class="tab-badge audible">🔊</span>';
        badges += '</div>';
      }

      html += `
        <div class="tab-item ${isActive} ${isSelected}" data-index="${tab.filteredIndex}" data-tab-id="${tab.id}" data-window-id="${tab.windowId}">
          <img class="tab-icon" src="${favicon}" alt="" onerror="this.src='data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Ctext%20y%3D%22.9em%22%20font-size%3D%2290%22%3E%F0%9F%93%84%3C%2Ftext%3E%3C%2Fsvg%3E'">
          <div class="tab-content">
            <div class="tab-title">${highlightText(tab.title, query)}</div>
            <div class="tab-url">${highlightText(tab.url, query)}</div>
          </div>
          ${badges}
        </div>
      `;
    });

      html += `
          </div>
        </div>
      </div>
    `;
  });

  tabList.innerHTML = html;

  // Add click handlers
  document.querySelectorAll('.tab-item').forEach(item => {
    item.addEventListener('click', () => {
      const tabId = parseInt(item.dataset.tabId);
      const windowId = parseInt(item.dataset.windowId);
      switchToTab(tabId, windowId);
    });
  });

  // Scroll selected into view
  if (selectedIndex >= 0) {
    const selected = document.querySelector('.tab-item.selected');
    if (selected) {
      selected.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }
}

// Switch to a tab
async function switchToTab(tabId, windowId) {
  try {
    console.log('Switching to tab:', tabId, 'in window:', windowId);
    
    // First update the tab to be active
    await chrome.tabs.update(tabId, { active: true });
    
    // Then focus the window containing this tab
    await chrome.windows.update(windowId, { focused: true });
    
    console.log('Successfully switched to tab');
    
    // Close the popup
    window.close();
  } catch (error) {
    console.error('跳转失败:', error);
    // Show error in UI
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'position:fixed;top:10px;left:10px;right:10px;background:#fee;color:#c33;padding:10px;border-radius:4px;z-index:1000;';
    errorDiv.textContent = '跳转失败: ' + error.message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
  }
}

// Navigate selection
function navigateSelection(direction) {
  if (filteredTabs.length === 0) return;

  if (direction === 'up') {
    selectedIndex = selectedIndex <= 0 ? filteredTabs.length - 1 : selectedIndex - 1;
  } else {
    selectedIndex = selectedIndex >= filteredTabs.length - 1 ? 0 : selectedIndex + 1;
  }

  renderTabs();
}

// Select current item
function selectCurrent() {
  if (selectedIndex >= 0 && selectedIndex < filteredTabs.length) {
    const tab = filteredTabs[selectedIndex];
    switchToTab(tab.id, tab.windowId);
  } else if (filteredTabs.length > 0) {
    // If nothing selected but there are results, select the first one
    const tab = filteredTabs[0];
    switchToTab(tab.id, tab.windowId);
  }
}

// Setup event listeners
function setupEventListeners() {
  // Search input
  searchInput.addEventListener('input', (e) => {
    filterTabs(e.target.value);
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        navigateSelection('up');
        break;
      case 'ArrowDown':
        e.preventDefault();
        navigateSelection('down');
        break;
      case 'Enter':
        e.preventDefault();
        selectCurrent();
        break;
      case 'Escape':
        e.preventDefault();
        window.close();
        break;
    }
  });
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);