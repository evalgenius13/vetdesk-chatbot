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
    console.log('Raw API response:', data);
    console.log('Articles array:', data.articles);

    // Prioritize articles - only throw error if no articles available
    if (data.error && (!data.articles || data.articles.length === 0)) {
      throw new Error(data.error);
    }

    newsItems = data.articles || [];
    console.log('Processed newsItems:', newsItems);
    console.log('NewsItems length:', newsItems.length);
    renderNewsFeed();

  } catch (error) {
    console.error('News fetch error:', error);
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

// Render news feed in the UI
function renderNewsFeed() {
  const feed = document.getElementById('news-feed');
  console.log('=== RENDER NEWS FEED DEBUG ===');
  console.log('Feed element found:', !!feed);
  console.log('NewsItems for rendering:', newsItems);
  console.log('NewsItems length:', newsItems.length);
  console.log('NewsItems type:', typeof newsItems);
  
  feed.innerHTML = "";

  if (!newsItems.length) {
    console.log('No news items - showing fallback');
    feed.innerHTML = '<li class="text-gray-500 text-center py-4">No news available</li>';
    return;
  }

  console.log('Creating news items HTML...');
  newsItems.forEach((item, idx) => {
    console.log(`Processing item ${idx}:`, item);
    const li = document.createElement('li');
    li.className = "p-3 bg-gray-50 border rounded-lg shadow-sm hover:shadow-md transition-shadow";

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
    console.log(`Added item ${idx} to feed`);
  });

  console.log('=== RENDER COMPLETE ===');
  try {
    console.log('Final feed innerHTML:', feed.innerHTML);
    console.log('Feed children count:', feed.children.length);
    console.log('Feed element:', feed);
  } catch (error) {
    console.error('Error accessing feed element:', error);
  }

  // Attach event listeners for "How does this affect me?" buttons
  document.querySelectorAll('.how-affect-me-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const idx = parseInt(this.getAttribute('data-news-idx'));
      const news = newsItems[idx];
      if (news) {
        const userMessage = `How does "${news.title}" affect me?`;
        addUserMessageToChat(userMessage);
      }
    });
  });
}
