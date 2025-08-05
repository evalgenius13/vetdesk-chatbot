// News feed functionality with simple caching

let newsItems = [];
let newsLoading = false;

// Simple cache functions
function getCachedNews() {
  try {
    const cached = sessionStorage.getItem('news');
    return cached ? JSON.parse(cached) : null;
  } catch (e) {
    return null;
  }
}

function getCachedAnalysis(articleUrl) {
  try {
    const cached = sessionStorage.getItem('analysis_' + btoa(articleUrl).slice(0, 20));
    return cached ? JSON.parse(cached) : null;
  } catch (e) {
    return null;
  }
}

function saveAnalysis(articleUrl, analysis) {
  try {
    const key = 'analysis_' + btoa(articleUrl).slice(0, 20);
    sessionStorage.setItem(key, JSON.stringify({
      analysis: analysis,
      timestamp: Date.now()
    }));
  } catch (e) {
    // Storage full, ignore
  }
}

// Analyze article (with simple caching)
async function analyzeArticle(article) {
  // Check cache
  const cached = getCachedAnalysis(article.url);
  if (cached) {
    return cached.analysis;
  }
  
  // Call API
  try {
    const response = await fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.FRONTEND_SECRET}`
      },
      body: JSON.stringify({ 
        chatHistory: [{
          role: "user",
          parts: [{ text: `How does this VA news affect veterans? Article: "${article.title}" - ${article.summary}` }]
        }],
        systemPrompt: SYSTEM_PROMPT
      })
    });

    if (!response.ok) throw new Error('API failed');

    const data = await response.json();
    const analysis = data?.candidates?.[0]?.content?.parts?.[0]?.text || 
                    "Sorry, I couldn't analyze this article.";
    
    // Save to cache
    saveAnalysis(article.url, analysis);
    return analysis;
    
  } catch (error) {
    return "Sorry, I couldn't analyze this article right now.";
  }
}

// Fetch news from backend API
async function fetchNews(forceRefresh = false) {
  if (newsLoading) return;

  // Check cache first
  if (!forceRefresh) {
    const cached = getCachedNews();
    if (cached) {
      newsItems = cached;
      renderNewsFeed();
      return;
    }
  }

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
    
    // Cache the news
    try {
      sessionStorage.setItem('news', JSON.stringify(newsItems));
    } catch (e) {
      // Storage full, ignore
    }
    
    renderNewsFeed();

  } catch (error) {
    // Try to use cached news on error
    const cached = getCachedNews();
    if (cached && cached.length > 0) {
      newsItems = cached;
      renderNewsFeed();
    } else {
      showNewsError(error.message);
    }
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
    btn.onclick = async function() {
      const idx = parseInt(this.getAttribute('data-news-idx'));
      const article = newsItems[idx];
      if (!article) return;

      const originalText = this.textContent;
      this.textContent = 'Analyzing...';
      this.disabled = true;

      try {
        // Get analysis (cached or fresh)
        const analysis = await analyzeArticle(article);

        // Add to chat
        if (typeof chatMessages !== 'undefined') {
          chatMessages.push({ 
            sender: "user", 
            text: `How does "${article.title}" affect me?` 
          });
          
          chatMessages.push({ 
            sender: "bot", 
            text: analysis 
          });
          
          if (typeof renderChatHistory === 'function') {
            renderChatHistory();
          }
        }
      } catch (error) {
        console.error('Error analyzing article:', error);
        if (typeof showError === 'function') {
          showError('Sorry, I couldn\'t analyze that article right now.');
        }
      } finally {
        this.textContent = originalText;
        this.disabled = false;
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
