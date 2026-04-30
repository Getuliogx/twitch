document.addEventListener("DOMContentLoaded", function () {
  var API_KEY = "b095ccbbb185d27703d007ae0ded5f7d";

  var DEFAULT_DATA = {
    movies: [],
    series: [],
    anime: []
  };

  var data = clone(DEFAULT_DATA);

  var searchInput = document.getElementById("searchInput");
  var sortSelect = document.getElementById("sortSelect");
  var statusMsg = document.getElementById("statusMsg");
  var resultsEl = document.getElementById("results");

  var favoritesList = document.getElementById("favoritesList");
  var moviesList = document.getElementById("moviesList");
  var seriesList = document.getElementById("seriesList");
  var animeList = document.getElementById("animeList");

  var draggedItemPayload = null;

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

  function inferCategory(item) {
    if (item.media_type === "movie") {
      return "movies";
    }

    if (item.media_type === "tv") {
      var genreIds = item.genre_ids || [];
      var hasAnimation = genreIds.indexOf(16) !== -1;
      var isJapanese = (item.original_language || "").toLowerCase() === "ja";

      if (hasAnimation || isJapanese) {
        return "anime";
      }

      return "series";
    }

    return "movies";
  }

  function categoryLabel(categoryKey) {
    if (categoryKey === "movies") return "Filmes";
    if (categoryKey === "series") return "Séries";
    if (categoryKey === "anime") return "Animes";
    return "";
  }

  function getDisplayTitle(item) {
    return (
      item.title ||
      item.name ||
      item.original_title ||
      item.original_name ||
      "Sem título"
    );
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

  function findItemById(id) {
    var categories = ["movies", "series", "anime"];
    for (var c = 0; c < categories.length; c++) {
      var category = categories[c];
      var list = data[category] || [];
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === id) {
          return { category: category, index: i, item: list[i] };
        }
      }
    }
    return null;
  }

  function toggleFavoriteById(id) {
    var found = findItemById(id);
    if (!found) return;

    found.item.favorite = !found.item.favorite;
    saveData();
    renderStoredLists();
  }

  function setFavoriteById(id, value) {
    var found = findItemById(id);
    if (!found) return;

    found.item.favorite = !!value;
    saveData();
    renderStoredLists();
  }

  function removeById(id) {
    var found = findItemById(id);
    if (!found) return;

    data[found.category].splice(found.index, 1);
    saveData();
    renderStoredLists();
  }

  function addItemFromSearch(item) {
    var category = inferCategory(item);

    if (!data[category]) {
      data[category] = [];
    }

    var itemId = String(item.media_type || "item") + "_" + String(item.id);

    var exists = data[category].some(function (storedItem) {
      return storedItem.id === itemId;
    });

    if (exists) {
      setStatus("Esse item já foi adicionado.");
      return;
    }

    data[category].push({
      id: itemId,
      title: getDisplayTitle(item),
      poster: item.poster_path,
      favorite: false,
      addedAt: Date.now(),
      category: category
    });

    saveData();
    renderStoredLists();
  }

  function createStoredCard(item, showRemove) {
    var div = document.createElement("div");
    div.className = "card stored-card";
    div.setAttribute("draggable", "true");
    div.dataset.itemId = item.id;

    div.innerHTML =
      '<img src="https://image.tmdb.org/t/p/w300' + item.poster + '" alt="">' +
      '<p>' + escapeHtml(item.title) + "</p>" +
      '<div class="badge-line">' +
      '<span class="category-badge">' + escapeHtml(categoryLabel(item.category)) + '</span>' +
      (item.favorite ? '<span class="favorite-badge">★ Favorito</span>' : "") +
      '</div>' +
      '<button type="button" class="fav-btn">' + (item.favorite ? "Desfavoritar" : "Favoritar") + '</button>' +
      (showRemove ? '<button type="button" class="remove-btn">Remover</button>' : '');

    div.addEventListener("dragstart", function () {
      draggedItemPayload = { id: item.id };
      div.classList.add("dragging");
    });

    div.addEventListener("dragend", function () {
      draggedItemPayload = null;
      div.classList.remove("dragging");
    });

    div.querySelector(".fav-btn").addEventListener("click", function () {
      toggleFavoriteById(item.id);
    });

    if (showRemove) {
      div.querySelector(".remove-btn").addEventListener("click", function () {
        removeById(item.id);
      });
    }

    return div;
  }

  function renderCategory(targetEl, items, isFavorites) {
    targetEl.innerHTML = "";

    if (!items.length) {
      targetEl.innerHTML = '<div class="empty">Nenhum item nessa categoria.</div>';
      return;
    }

    items.forEach(function (item) {
      targetEl.appendChild(createStoredCard(item, !isFavorites));
    });
  }

  function renderStoredLists() {
    var term = searchInput.value || "";
    var sortMode = sortSelect.value || "az";

    renderCategory(
      favoritesList,
      sortItems(filterItems(getFavoritesItems(), term), sortMode),
      true
    );

    renderCategory(
      moviesList,
      sortItems(filterItems(data.movies || [], term), sortMode),
      false
    );

    renderCategory(
      seriesList,
      sortItems(filterItems(data.series || [], term), sortMode),
      false
    );

    renderCategory(
      animeList,
      sortItems(filterItems(data.anime || [], term), sortMode),
      false
    );
  }

  function renderResults(items) {
    resultsEl.innerHTML = "";

    var filtered = (items || []).filter(function (item) {
      return item.poster_path && getDisplayTitle(item) && (item.media_type === "movie" || item.media_type === "tv");
    });

    if (!filtered.length) {
      resultsEl.innerHTML = '<div class="empty">Nenhum resultado encontrado.</div>';
      return;
    }

    filtered.forEach(function (item) {
      var inferred = inferCategory(item);
      var title = getDisplayTitle(item);

      var div = document.createElement("div");
      div.className = "card";
      div.innerHTML =
        '<img src="https://image.tmdb.org/t/p/w300' + item.poster_path + '" alt="">' +
        '<p>' + escapeHtml(title) + "</p>" +
        '<div class="badge-line">' +
        '<span class="category-badge">' + escapeHtml(categoryLabel(inferred)) + '</span>' +
        '</div>' +
        '<button type="button">Adicionar</button>';

      div.querySelector("button").addEventListener("click", function () {
        addItemFromSearch(item);
      });

      resultsEl.appendChild(div);
    });
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
          "&language=pt-BR&include_adult=false&query=" +
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

  sortSelect.addEventListener("change", function () {
    renderStoredLists();
  });

  favoritesList.addEventListener("dragover", function (e) {
    e.preventDefault();
    favoritesList.classList.add("drop-active");
  });

  favoritesList.addEventListener("dragleave", function () {
    favoritesList.classList.remove("drop-active");
  });

  favoritesList.addEventListener("drop", function (e) {
    e.preventDefault();
    favoritesList.classList.remove("drop-active");

    if (draggedItemPayload && draggedItemPayload.id) {
      setFavoriteById(draggedItemPayload.id, true);
    }
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
