// News feed functionality

let newsItems = [];
let newsLoading = false;

// Fetch news from backend API
async function fetchNews(forceRefresh = false) {
  if (newsLoading) return;

  newsLoading = true;
  const newsFeed = document.getElementById('news-feed');

  try {
    showNewsLoading();

    const response = await fetch(CONFIG.NEWS_API_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    // Prioritize articles - only throw error if no articles available
    if (data.error && (!data.articles || data.articles.length === 0)) {
      throw new Error(data.error);
    }

    newsItems = data.articles || [];
    renderNewsFeed();

  } catch (error) {
    showNewsError(error.message);
  } finally {
    newsLoading = false;
  }
}

// Show loading state
function showNewsLoading() {
  const feed = document.getElementById('news-feed');
  feed.innerHTML = '<li class="p-3 bg-gray-50 border rounded-lg text-center text-gray-500"><div class="spinner"></div><p class="mt-2">Loading news...</p></li>';
}

// Show error state
function showNewsError(message) {
  const feed = document.getElementById('news-feed');
  feed.innerHTML = `<li class="p-3 bg-red-50 border border-red-200 rounded-lg text-center text-red-600">Unable to load news</li>`;
}

// Render news feed in the UI (desktop sidebar)
function renderNewsFeed() {
  const feed = document.getElementById('news-feed');
  feed.innerHTML = "";

  if (!newsItems.length) {
    feed.innerHTML = '<li class="text-gray-500 text-center py-4">No news available</li>';
    return;
  }

  newsItems.forEach((item, idx) => {
    const li = document.createElement('li');
    li.className = "p-3 bg-gray-50 border rounded-lg shadow-sm hover:shadow-md transition-shadow news-item";

    const titleText = escapeHtml(item.title);
    const summaryText = escapeHtml(item.summary);

    li.innerHTML = `
      <a href="${escapeHtml(item.url)}" class="font-semibold text-blue-800 hover:underline" target="_blank" rel="noopener noreferrer">${titleText}</a>
      ${item.date ? `<div class="text-xs text-gray-500 mb-1">${escapeHtml(item.date)}</div>` : ''}
      <div class="mb-2 text-sm">${summaryText}</div>
      <button type="button" class="how-affect-me-btn bg-green-100 text-green-800 px-3 py-1 rounded-md hover:bg-green-200 transition-colors text-sm font-medium" data-news-idx="${idx}">
        How does this affect me?
      </button>
    `;
    feed.appendChild(li);
  });

  // Attach event listeners for desktop "How does this affect me?" buttons
  attachDesktopNewsEventListeners();
}

// Desktop event listeners (sidebar)
function attachDesktopNewsEventListeners() {
  document.querySelectorAll('#news-feed .how-affect-me-btn').forEach(btn => {
    btn.onclick = function() {
      const idx = parseInt(this.getAttribute('data-news-idx'));
      const news = newsItems[idx];
      if (news) {
        const userMessage = `How does "${news.title}" affect me?`;
        addUserMessageToChat(userMessage);
      }
    };
  });
}

// Mobile news open/close logic
function openMobileNews() {
  const mobileNewsInline = document.getElementById('mobile-news-inline');
  const desktopNews = document.getElementById('news-feed');
  const mobileNewsFeed = document.getElementById('mobile-news-feed');
  
  mobileNewsInline.classList.add('show');

  // Copy desktop feed HTML for consistency
  if (desktopNews && mobileNewsFeed) {
    mobileNewsFeed.innerHTML = desktopNews.innerHTML;
    attachMobileNewsEventListeners();
  }
}

function closeMobileNews() {
  const mobileNewsInline = document.getElementById('mobile-news-inline');
  if (mobileNewsInline) {
    mobileNewsInline.classList.remove('show');
  }
  const chatContainer = document.getElementById('chat-container');
  if (chatContainer) chatContainer.style.display = 'flex';
}

// Attach event listeners for mobile news feed
function attachMobileNewsEventListeners() {
  const mobileNewsFeed = document.getElementById('mobile-news-feed');
  if (!mobileNewsFeed) return;

  mobileNewsFeed.querySelectorAll('.how-affect-me-btn').forEach(btn => {
    btn.onclick = function() {
      const idx = parseInt(this.getAttribute('data-news-idx'));
      const news = newsItems[idx];
      if (news) {
        const userMessage = `How does "${news.title}" affect me?`;
        closeMobileNews();
        addUserMessageToChat(userMessage);
      }
    };
  });
}

// Utility function for HTML escaping
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Make sure to call fetchNews() on load to populate feeds.
document.addEventListener('DOMContentLoaded', () => {
  fetchNews();
  
  // Handle mobile news close button
  const mobileNewsClose = document.getElementById('mobile-news-close');
  if (mobileNewsClose) {
    mobileNewsClose.addEventListener('click', closeMobileNews);
  }
});
