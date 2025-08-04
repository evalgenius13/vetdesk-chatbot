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
    feed.innerHTML = '<li class="p-3 bg-red-50 border border-red-200 rounded-lg text-center text-red-600">No news articles available at this time.</li>';
    return;
  }

  newsItems.forEach((item, idx) => {
    const li = document.createElement('li');
    li.className = "news-item bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow";

    const titleText = escapeHtml(item.title);
    const summaryText = item.summary ? escapeHtml(item.summary) : '';
    
    const publishedDate = item.date ? 
      new Date(item.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }) : '';

    li.innerHTML = `
      <article>
        <h3 class="font-semibold text-sm text-gray-900 mb-2 leading-tight">
          <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800">
            ${titleText}
          </a>
        </h3>
        ${summaryText ? `
          <p class="text-xs text-gray-600 mb-2 line-clamp-3">
            ${summaryText.length > 150 ? summaryText.substring(0, 150) + '...' : summaryText}
          </p>
        ` : ''}
        <div class="flex justify-between items-center text-xs text-gray-500 mb-2">
          ${item.source?.name ? `<span>${escapeHtml(item.source.name)}</span>` : '<span>News Source</span>'}
          ${publishedDate ? `<span>${publishedDate}</span>` : ''}
        </div>
        <button type="button" class="how-affect-me-btn bg-green-100 text-green-800 px-3 py-1 rounded-md hover:bg-green-200 transition-colors text-sm font-medium" data-news-idx="${idx}">
          How does this affect me?
        </button>
      </article>
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
        if (typeof addUserMessageToChat === 'function') {
          addUserMessageToChat(userMessage);
        }
      }
    };
  });
}

// Mobile news functionality (placeholder for future use)
function openMobileNews() {
  console.log('Mobile news functionality not implemented yet');
}

// Utility function for HTML escaping
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
