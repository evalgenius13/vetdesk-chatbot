// News feed functionality

// Fetch and display veteran news
async function fetchNews() {
  const newsFeed = document.getElementById('news-feed');
  if (!newsFeed) {
    console.warn('News feed element not found');
    return;
  }

  // Show loading state
  newsFeed.innerHTML = '<li class="news-loading">Loading veteran news...</li>';

  try {
    // Check if CONFIG is available
    if (!CONFIG?.NEWS_API_URL) {
      throw new Error('News API URL not configured');
    }

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

    // Clear loading state
    newsFeed.innerHTML = '';

    if (data.articles.length === 0) {
      newsFeed.innerHTML = '<li class="news-error">No news articles available at this time.</li>';
      return;
    }

    // Display news articles
    data.articles.forEach(article => {
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

  } catch (error) {
    console.error('Error fetching news:', error);
    newsFeed.innerHTML = `
      <li class="news-error">
        Unable to load news at this time. Please try again later.
      </li>
    `;
  }
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
