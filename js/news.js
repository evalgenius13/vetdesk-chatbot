// News feed functionality with 24-hour caching

// Cache configuration
const NEWS_CACHE_KEY = 'vetdesk_news_cache';
const NEWS_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Check if cached news is still valid
function isCacheValid(cacheData) {
  if (!cacheData || !cacheData.timestamp || !cacheData.articles) {
    return false;
  }
  
  const now = Date.now();
  const cacheAge = now - cacheData.timestamp;
  return cacheAge < NEWS_CACHE_DURATION;
}

// Get cached news from localStorage
function getCachedNews() {
  try {
    const cached = localStorage.getItem(NEWS_CACHE_KEY);
    if (!cached) return null;
    
    const cacheData = JSON.parse(cached);
    return isCacheValid(cacheData) ? cacheData.articles : null;
  } catch (error) {
    console.warn('Error reading news cache:', error);
    return null;
  }
}

// Save news to localStorage cache
function setCachedNews(articles) {
  try {
    const cacheData = {
      articles: articles,
      timestamp: Date.now()
    };
    localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Error saving news cache:', error);
  }
}

// Fetch and display veteran news
async function fetchNews() {
  const newsFeed = document.getElementById('news-feed');
  if (!newsFeed) {
    console.warn('News feed element not found');
    return;
  }

  // Try to load from cache first
  const cachedArticles = getCachedNews();
  if (cachedArticles) {
    console.log('Loading news from cache');
    displayNews(cachedArticles, newsFeed);
    return;
  }

  // Show loading state if no cache
  newsFeed.innerHTML = '<li class="news-loading">Loading veteran news...</li>';

  try {
    // Check if CONFIG is available
    if (!CONFIG?.NEWS_API_URL) {
      throw new Error('News API URL not configured');
    }

    console.log('Fetching fresh news from API');
    const response = await fetch(CONFIG.NEWS_API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data?.articles || !Array.isArray(data.articles)) {
      throw new Error('Invalid news data received');
    }

    // Cache the fresh news
    setCachedNews(data.articles);
    
    // Display the news
    displayNews(data.articles, newsFeed);

  } catch (error) {
    console.error('Error fetching news:', error);
    newsFeed.innerHTML = `
      <li class="news-error">
        Unable to load news at this time. Please try again later.
      </li>
    `;
  }
}

// Display news articles in the feed
function displayNews(articles, newsFeed) {
  // Clear existing content
  newsFeed.innerHTML = '';

  if (!articles || articles.length === 0) {
    newsFeed.innerHTML = '<li class="news-error">No news articles available at this time.</li>';
    return;
  }

  // Display news articles
  articles.forEach(article => {
    if (!article?.title || !article?.url) {
      return; // Skip invalid articles
    }

    const newsItem = document.createElement('li');
    newsItem.className = 'news-item bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow';
    
    const publishedDate = article.publishedAt ? 
      new Date(article.publishedAt).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }) : '';

    newsItem.innerHTML = `
      <article>
        <h3 class="font-semibold text-sm text-gray-900 mb-2 leading-tight">
          <a href="${escapeHtml(article.url)}" target="_blank" rel="noopener noreferrer" class="hover:text-blue-600">
            ${escapeHtml(article.title)}
          </a>
        </h3>
        ${article.description ? `
          <p class="text-xs text-gray-600 mb-2 line-clamp-3">
            ${escapeHtml(article.description.substring(0, 150))}${article.description.length > 150 ? '...' : ''}
          </p>
        ` : ''}
        <div class="flex justify-between items-center text-xs text-gray-500">
          ${article.source?.name ? `<span>${escapeHtml(article.source.name)}</span>` : '<span>News Source</span>'}
          ${publishedDate ? `<span>${publishedDate}</span>` : ''}
        </div>
      </article>
    `;

    newsFeed.appendChild(newsItem);
  });
}

// Mobile news functionality (placeholder for future use)
function openMobileNews() {
  // This function was referenced in the original code but mobile functionality was removed
  // Keeping as placeholder in case mobile news feature is added later
  console.log('Mobile news functionality not implemented yet');
}

// Utility function for escaping HTML (duplicate from chat.js for safety)
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
