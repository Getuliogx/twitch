document.addEventListener("DOMContentLoaded", function () {
  var API_KEY = "b095ccbbb185d27703d007ae0ded5f7d";

  var DEFAULT_DATA = {
    movies: [],
    series: [],
    anime: [],
    favorites: []
  };

  var data = clone(DEFAULT_DATA);

  var searchInput = document.getElementById("searchInput");
  var categorySelect = document.getElementById("categorySelect");
  var sortSelect = document.getElementById("sortSelect");
  var statusMsg = document.getElementById("statusMsg");
  var resultsEl = document.getElementById("results");

  var moviesList = document.getElementById("moviesList");
  var seriesList = document.getElementById("seriesList");
  var animeList = document.getElementById("animeList");
  var favoritesList = document.getElementById("favoritesList");

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

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

  function saveData() {
    if (!window.Twitch || !window.Twitch.ext) {
      setStatus("Abra esta página dentro da Twitch.");
      return;
    }

    try {
      window.Twitch.ext.configuration.set(
        "broadcaster",
        "1",
        JSON.stringify(data)
      );
      setStatus("Lista salva.");
    } catch (e) {
      console.error(e);
      setStatus("Erro ao salvar a lista.");
    }
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

  function renderCategory(targetEl, items, categoryKey) {
    targetEl.innerHTML = "";

    if (!items.length) {
      targetEl.innerHTML = '<div class="empty">Nenhum item nessa categoria.</div>';
      return;
    }

    items.forEach(function (item, displayIndex) {
      var div = document.createElement("div");
      div.className = "card";
      div.innerHTML =
        '<img src="https://image.tmdb.org/t/p/w300' + item.poster + '" alt="">' +
        '<p>' + escapeHtml(item.title) + "</p>" +
        '<button type="button">Remover</button>';

      div.querySelector("button").addEventListener("click", function () {
        removeById(categoryKey, item.id);
      });

      targetEl.appendChild(div);
    });
  }

  function renderStoredLists() {
    var term = searchInput.value || "";
    var sortMode = sortSelect.value || "az";

    renderCategory(
      moviesList,
      sortItems(filterItems(data.movies || [], term), sortMode),
      "movies"
    );

    renderCategory(
      seriesList,
      sortItems(filterItems(data.series || [], term), sortMode),
      "series"
    );

    renderCategory(
      animeList,
      sortItems(filterItems(data.anime || [], term), sortMode),
      "anime"
    );

    renderCategory(
      favoritesList,
      sortItems(filterItems(data.favorites || [], term), sortMode),
      "favorites"
    );
  }

  function renderResults(items) {
    resultsEl.innerHTML = "";

    var filtered = (items || []).filter(function (item) {
      return item.poster_path && (item.title || item.name);
    });

    if (!filtered.length) {
      resultsEl.innerHTML = '<div class="empty">Nenhum resultado encontrado.</div>';
      return;
    }

    filtered.forEach(function (item) {
      var title = item.title || item.name;

      var div = document.createElement("div");
      div.className = "card";
      div.innerHTML =
        '<img src="https://image.tmdb.org/t/p/w300' + item.poster_path + '" alt="">' +
        '<p>' + escapeHtml(title) + "</p>" +
        '<button type="button">Adicionar</button>';

      div.querySelector("button").addEventListener("click", function () {
        addItem({
          id: String(item.media_type || "item") + "_" + String(item.id),
          title: title,
          poster: item.poster_path,
          addedAt: Date.now()
        });
      });

      resultsEl.appendChild(div);
    });
  }

  function addItem(item) {
    var category = categorySelect.value;

    if (!data[category]) {
      data[category] = [];
    }

    var exists = data[category].some(function (i) {
      return i.id === item.id || normalizeText(i.title) === normalizeText(item.title);
    });

    if (exists) {
      setStatus("Esse item já foi adicionado nessa categoria.");
      return;
    }

    data[category].push(item);
    saveData();
    renderStoredLists();
  }

  function removeById(category, itemId) {
    if (!data[category]) return;

    data[category] = data[category].filter(function (item) {
      return item.id !== itemId;
    });

    saveData();
    renderStoredLists();
  }

  searchInput.addEventListener("input", async function () {
    var query = searchInput.value.trim();

    renderStoredLists();

    if (query.length < 3) {
      resultsEl.innerHTML = "";
      setStatus("");
      return;
    }

    try {
      setStatus("Buscando...");
      var res = await fetch(
        "https://api.themoviedb.org/3/search/multi?api_key=" +
          API_KEY +
          "&query=" +
          encodeURIComponent(query)
      );
      var json = await res.json();
      renderResults(json.results || []);
      setStatus("");
    } catch (e) {
      console.error(e);
      setStatus("Erro ao buscar no TMDb.");
    }
  });

  categorySelect.addEventListener("change", function () {
    renderStoredLists();
  });

  sortSelect.addEventListener("change", function () {
    renderStoredLists();
  });

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
          data = clone(DEFAULT_DATA);
        }
      } catch (e) {
        console.error(e);
        data = clone(DEFAULT_DATA);
      }

      renderStoredLists();
    });
  } else {
    setStatus("Abra esta página dentro da Twitch.");
  }

  renderStoredLists();
});
