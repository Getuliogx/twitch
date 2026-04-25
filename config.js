document.addEventListener("DOMContentLoaded", function () {
  var API_KEY = "b095ccbbb185d27703d007ae0ded5f7d";

  var DEFAULT_DATA = {
    movies: [],
    series: [],
    anime: [],
    favorites: []
  };

  var data = JSON.parse(JSON.stringify(DEFAULT_DATA));

  var resultsEl = document.getElementById("results");
  var listEl = document.getElementById("list");
  var searchInput = document.getElementById("searchInput");
  var categorySelect = document.getElementById("category");
  var statusMsg = document.getElementById("statusMsg");

  function setStatus(message) {
    statusMsg.textContent = message || "";
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
        '<p>' + escapeHtml(title) + '</p>' +
        '<button type="button">Adicionar</button>';

      div.querySelector("button").addEventListener("click", function () {
        addItem({
          title: title,
          poster: item.poster_path
        });
      });

      resultsEl.appendChild(div);
    });
  }

  function addItem(item) {
    var category = categorySelect.value;
    var exists = (data[category] || []).some(function (i) {
      return i.title === item.title;
    });

    if (exists) {
      setStatus("Esse item já foi adicionado nessa categoria.");
      return;
    }

    data[category].push(item);
    saveData();
    renderList();
  }

  function removeItem(index) {
    var category = categorySelect.value;
    data[category].splice(index, 1);
    saveData();
    renderList();
  }

  function renderList() {
    var category = categorySelect.value;
    var items = data[category] || [];

    listEl.innerHTML = "";

    if (!items.length) {
      listEl.innerHTML = '<div class="empty">Nenhum item adicionado nessa categoria.</div>';
      return;
    }

    items.forEach(function (item, index) {
      var div = document.createElement("div");
      div.className = "card";
      div.innerHTML =
        '<img src="https://image.tmdb.org/t/p/w300' + item.poster + '" alt="">' +
        '<p>' + escapeHtml(item.title) + '</p>' +
        '<button type="button">Remover</button>';

      div.querySelector("button").addEventListener("click", function () {
        removeItem(index);
      });

      listEl.appendChild(div);
    });
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  searchInput.addEventListener("input", async function () {
    var query = searchInput.value.trim();

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
    renderList();
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
          data = JSON.parse(JSON.stringify(DEFAULT_DATA));
        }
      } catch (e) {
        console.error(e);
        data = JSON.parse(JSON.stringify(DEFAULT_DATA));
      }

      renderList();
    });
  } else {
    setStatus("Abra esta página dentro da Twitch.");
  }

  renderList();
});
