// Put your API key here (you gave this earlier)
const API_KEY = "b831426aeb74456b8fdb31f052e6d3b1";

// Base URL
const BASE_URL = "https://newsapi.org/v2/"

// Basic endpoints
const TOP_HEADLINES = BASE_URL + "top-headlines";
const EVERYTHING = BASE_URL + "everything";

document.addEventListener("DOMContentLoaded", () => {
  const newsContainer = document.getElementById("news-container");
  const trendingList = document.getElementById("trending-list");
  const breakingNews = document.getElementById("breaking-news");
  const searchBtn = document.getElementById("search-btn");
  const searchInput = document.getElementById("search-input");
  const darkToggle = document.getElementById("darkToggle");

  function showLoader() {
    newsContainer.innerHTML = `<div class="empty">Loading news…</div>`;
  }
  function showError(msg){
    newsContainer.innerHTML = `<div class="error">${msg}</div>`;
  }

  // Build URL helper
  function buildTopHeadlinesUrl({country = "us", category = "", pageSize = 20} = {}) {
    let u = `${TOP_HEADLINES}?apiKey=${API_KEY}&pageSize=${pageSize}`;
    if (country) u += `&country=${country}`;
    if (category) u += `&category=${category}`;
    return u;
  }
  function buildEverythingUrl({q = "", pageSize = 20} = {}) {
    return `${EVERYTHING}?apiKey=${API_KEY}&q=${encodeURIComponent(q)}&pageSize=${pageSize}&sortBy=publishedAt`;
  }

  // render helpers
  function renderArticles(list) {
    if (!list || list.length === 0) {
      newsContainer.innerHTML = `<div class="empty">No articles found.</div>`;
      return;
    }
    newsContainer.innerHTML = "";
    list.forEach(a => {
      const card = document.createElement("article");
      card.className = "news-card";
      card.innerHTML = `
        <img src="${a.urlToImage || 'https://via.placeholder.com/800x450?text=No+Image'}" alt="">
        <div class="news-content">
          <h3>${a.title || "No title"}</h3>
          <p>${a.description ? a.description : (a.content ? a.content.slice(0,140)+"…" : "No description.")}</p>
          <div class="meta">${a.source?.name || ""} • ${new Date(a.publishedAt||"").toLocaleString()}</div>
          <a class="read-more" href="${a.url}" target="_blank" rel="noopener">Read more</a>
        </div>
      `;
      newsContainer.appendChild(card);
    });
  }

  async function fetchNewsByTopHeadlines(opts = {}) {
    showLoader();
    try {
      const url = buildTopHeadlinesUrl(opts);
      const res = await fetch(url);
      if (!res.ok) {
        // API returned 4xx/5xx
        const err = await res.json().catch(()=>({message:res.statusText}));
        showError(`API error: ${res.status} ${err.message || res.statusText}`);
        console.error("API error", res.status, err);
        return;
      }
      const data = await res.json();
      if (data.status !== "ok") {
        showError(`API returned error: ${data.message || JSON.stringify(data)}`);
        return;
      }
      renderArticles(data.articles);
    } catch (e) {
      // network / CORS / other
      console.error(e);
      if (e instanceof TypeError && (e.message.includes("Failed to fetch") || e.message.includes("NetworkError"))) {
        showError(`Network/CORS error. Open console to see details. If you see a CORS message, run via a server or use a proxy.`);
      } else {
        showError("Unexpected error. Check console for details.");
      }
    }
  }

  async function fetchNewsByQuery(q) {
    if (!q || q.trim() === "") return;
    showLoader();
    try {
      const url = buildEverythingUrl({q});
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(()=>({message:res.statusText}));
        showError(`API error: ${res.status} ${err.message || res.statusText}`);
        console.error("API error", res.status, err);
        return;
      }
      const data = await res.json();
      if (data.status !== "ok") {
        showError(`API returned error: ${data.message || JSON.stringify(data)}`);
        return;
      }
      renderArticles(data.articles);
    } catch (e) {
      console.error(e);
      showError("Network/CORS or unexpected error. Check console.");
    }
  }

  // breaking + trending
  async function loadBreakingAndTrending(country="us") {
    try {
      const url = buildTopHeadlinesUrl({country, pageSize: 12});
      const res = await fetch(url);
      const data = await res.json().catch(()=>({articles:[]}));
      const titles = (data.articles || []).map(a => a.title).slice(0,6);
      breakingNews.textContent = titles.length ? titles.join("  •  ") : "No breaking news available.";
      trendingList.innerHTML = "";
      (data.articles || []).slice(0,6).forEach(a => {
        const li = document.createElement("li");
        li.innerHTML = `<a href="${a.url}" target="_blank" rel="noopener">${a.title}</a>`;
        trendingList.appendChild(li);
      });
    } catch (e) {
      console.error("Trending load failed", e);
      breakingNews.textContent = "Unable to load breaking news.";
      trendingList.innerHTML = "<li>Unable to load trending.</li>";
    }
  }

  // Wire UI events
  searchBtn.addEventListener("click", () => {
    const q = searchInput.value.trim();
    if (q) fetchNewsByQuery(q);
  });
  searchInput.addEventListener("keypress", (ev) => {
    if (ev.key === "Enter") {
      const q = searchInput.value.trim();
      if (q) fetchNewsByQuery(q);
    }
  });

  darkToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
  });

  // Category clicks (nav)
  document.querySelectorAll('nav a[data-category]').forEach(el => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const category = el.getAttribute("data-category");
      // for 'general' we show top-headlines without category
      fetchNewsByTopHeadlines({country:"us", category: category === "general" ? "" : category});
      loadBreakingAndTrending("us");
    });
  });

  // Country - dropdown
  document.querySelectorAll('.dropdown-content a[data-country]').forEach(el => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const country = el.getAttribute("data-country");
      fetchNewsByTopHeadlines({country, category:""});
      loadBreakingAndTrending(country);
    });
  });

  // Initial load
  fetchNewsByTopHeadlines({country:"us", category:""});
  loadBreakingAndTrending("us");
});
async function loadBreakingAndTrending(country="us") {
  try {
    const url = buildTopHeadlinesUrl({country, pageSize: 12});
    const res = await fetch(url);
    const data = await res.json().catch(()=>({articles:[]}));

    // Trending Bar
    const trendingText = document.getElementById("trending-text");
    if (data.articles.length > 0) {
      trendingText.innerHTML = "";
      data.articles.slice(0, 6).forEach(article => {
        const span = document.createElement("span");
        span.textContent = article.title;
        trendingText.appendChild(span);
      });
    } else {
      trendingText.textContent = "No trending news available.";
    }

    // Sidebar Trending
    const trendingList = document.getElementById("trending-list");
    trendingList.innerHTML = "";
    data.articles.slice(0,6).forEach(article => {
      const li = document.createElement("li");
      li.innerHTML = `<a href="${article.url}" target="_blank" rel="noopener">${article.title}</a>`;
      trendingList.appendChild(li);
    });

    // Update Breaking News Ticker
    const breakingNews = document.getElementById("breaking-news");
    breakingNews.textContent = data.articles.map(a => a.title).slice(0, 5).join(" | ");
  } catch (e) {
    console.error("Trending load failed", e);
    const trendingText = document.getElementById("trending-text");
    trendingText.textContent = "Unable to load trending news.";
  }
}

