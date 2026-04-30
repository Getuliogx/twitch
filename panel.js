document.addEventListener("DOMContentLoaded", function () {
  var DEFAULT_DATA = {
    movies: [],
    series: [],
    anime: []
  };

  var data = JSON.parse(JSON.stringify(DEFAULT_DATA));

  var searchInput = document.getElementById("searchInput");
  var sortSelect = document.getElementById("sortSelect");
  var statusMsg = document.getElementById("statusMsg");

  var favoritesList = document.getElementById("favoritesList");
  var moviesList = document.getElementById("moviesList");
  var seriesList = document.getElementById("seriesList");
  var animeList = document.getElementById("animeList");

  function setStatus(message) {
    statusMsg.textContent = message || "";
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalizeText(text) {
    return String(text || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function allItems() {
    var combined = [];
    ["movies", "series", "anime"].forEach(function (category) {
      (data[category] || []).forEach(function (item) {
        combined.push(item);
      });
    });
    return combined;
  }

  function getFavoritesItems() {
    return allItems().filter(function (item) {
      return !!item.favorite;
    });
  }

  function sortItems(items, mode) {
    var list = items.slice();

    if (mode === "recent") {
      list.sort(function (a, b) {
        return (b.addedAt || 0) - (a.addedAt || 0);
      });
      return list;
    }

    if (mode === "oldest") {
      list.sort(function (a, b) {
        return (a.addedAt || 0) - (b.addedAt || 0);
      });
      return list;
    }

    list.sort(function (a, b) {
      return normalizeText(a.title).localeCompare(normalizeText(b.title), "pt-BR");
    });

    return list;
  }

  function filterItems(items, term) {
    var normalizedTerm = normalizeText(term);
    if (!normalizedTerm) return items;

    return items.filter(function (item) {
      return normalizeText(item.title).indexOf(normalizedTerm) !== -1;
    });
  }

  function renderCategory(targetEl, items) {
    targetEl.innerHTML = "";

    if (!items.length) {
      targetEl.innerHTML = '<div class="empty">Nenhum item nessa categoria.</div>';
      return;
    }

    items.forEach(function (item) {
      var div = document.createElement("div");
      div.className = "card";
      div.innerHTML =
        '<img src="https://image.tmdb.org/t/p/w300' + item.poster + '" alt="">' +
        '<p>' + escapeHtml(item.title) + '</p>';
      targetEl.appendChild(div);
    });
  }

  function renderAll() {
    var term = searchInput.value || "";
    var sortMode = sortSelect.value || "az";

    renderCategory(favoritesList, sortItems(filterItems(getFavoritesItems(), term), sortMode));
    renderCategory(moviesList, sortItems(filterItems(data.movies || [], term), sortMode));
    renderCategory(seriesList, sortItems(filterItems(data.series || [], term), sortMode));
    renderCategory(animeList, sortItems(filterItems(data.anime || [], term), sortMode));
  }

  function setupScrollButtons() {
    document.querySelectorAll(".scroll-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var targetId = btn.getAttribute("data-target");
        var dir = btn.getAttribute("data-dir");
        var el = document.getElementById(targetId);
        if (!el) return;

        var amount = 220;
        el.scrollBy({
          left: dir === "left" ? -amount : amount,
          behavior: "smooth"
        });
      });
    });
  }

  searchInput.addEventListener("input", renderAll);
  sortSelect.addEventListener("change", renderAll);

  if (window.Twitch && window.Twitch.ext) {
    window.Twitch.ext.onAuthorized(function () {
      setStatus("");
    });

    window.Twitch.ext.configuration.onChanged(function () {
      try {
        var cfg = window.Twitch.ext.configuration.broadcaster;
        if (cfg && cfg.content) {
          data = JSON.parse(cfg.content);
        } else {
          data = JSON.parse(JSON.stringify(DEFAULT_DATA));
        }
      } catch (e) {
        console.error(e);
        data = JSON.parse(JSON.stringify(DEFAULT_DATA));
      }

      renderAll();
    });
  } else {
    setStatus("Abra esta página dentro da Twitch.");
  }

  setupScrollButtons();
  renderAll();
});
