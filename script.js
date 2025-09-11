const API_KEY = "b831426aeb74456b8fdb31f052e6d3b1";
const BASE_URL = "https://newsapi.org/v2/top-headlines";
const SEARCH_URL = "https://newsapi.org/v2/everything";
const COUNTRY = "in";

const newsContainer = document.getElementById("news-container");

async function fetchNews(category = "") {
  try {
    let url = `${BASE_URL}?country=us&apiKey=${API_KEY}`;
    if (category && category !== "home" && category !== "") {
      url += `&category=${category}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "ok") {
      displayNews(data.articles);
    } else {
      newsContainer.innerHTML = `<p>⚠️ Failed to load news</p>`;
    }
  } catch (error) {
    newsContainer.innerHTML = `<p>❌ Error: ${error.message}</p>`;
  }
}
async function searchNews(query) {
  try {
    let url = `${SEARCH_URL}?q=${encodeURIComponent(query)}&language=en&apiKey=${API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "ok") {
      displayNews(data.articles);
    } else {
      newsContainer.innerHTML = `<p>⚠️ No results found</p>`;
    }
  } catch (error) {
    newsContainer.innerHTML = `<p>❌ Error: ${error.message}</p>`;
  }
}


// Display news on page
function displayNews(articles) {
  newsContainer.innerHTML = ""; // clear old news

  if (!articles.length) {
    newsContainer.innerHTML = `<p>No news found for this category.</p>`;
    return;
  }

  articles.forEach(article => {
    if (!article.urlToImage || !article.title) return; // skip if missing image or title

    const articleEl = document.createElement("div");
    articleEl.classList.add("article");

    articleEl.innerHTML = `
      <img src="${article.urlToImage}" alt="${article.title}">
      <h2>${article.title}</h2>
      <p>${article.description || "No description available."}</p>
      <a href="${article.url}" target="_blank">Read more</a>
    `;

    newsContainer.appendChild(articleEl);
  });
}

document.querySelectorAll("nav ul li a").forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();

    // Remove old active
    document.querySelectorAll("nav ul li a").forEach(l => l.classList.remove("active"));

    // Set new active
    e.target.classList.add("active");

    const category = e.target.textContent.toLowerCase();
    fetchNews(category);
  });
});


// Press Enter to search
document.getElementById("search-input").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    document.getElementById("search-btn").click();
  }
});

// Load default news (home) on page load
fetchNews("home");
