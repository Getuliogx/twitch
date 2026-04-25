(function () {
  const API_KEY = "b095ccbbb185d27703d007ae0ded5f7d";

  const DEFAULT_DATA = {
    movies: [],
    series: [],
    anime: [],
    favorites: []
  };

  let data = JSON.parse(JSON.stringify(DEFAULT_DATA));

  const resultsEl = document.getElementById("results");
  const listEl = document.getElementById("list");
  const searchInput = document.getElementById("searchInput");
  const categorySelect = document.getElementById("category");
  const statusMsg = document.getElementById("statusMsg");

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

    const filtered = (items || []).filter(function (item) {
      return item.poster_path && (item.title || item.name);
    });

    if (!filtered.length) {
      resultsEl.innerHTML = '<div class="empty">Nenhum resultado encontrado.</div>';
      return;
    }

    filtered.forEach(function (item) {
      const title = item.title || item.name;

      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `
        <img src="https://image.tmdb.org/t/p/w300${item.poster_path}" alt="">
        <p>${title}</p>
        <button type="button">Adicionar</button>
      `;

      div.querySelector("button").onclick = function () {
        addItem({
          title: title,
          poster: item.poster_path
        });
      };

      resultsEl.appendChild(div);
    });
  }

  function addItem(item) {
    const category = categorySelect.value;
    const exists = (data[category] || []).some(function (i) {
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
    const category = categorySelect.value;
    data[category].splice(index, 1);
    saveData();
    renderList();
  }

  function renderList() {
    const category = categorySelect.value;
    const items = data[category] || [];

    listEl.innerHTML = "";

    if (!items.length) {
      listEl.innerHTML = '<div class="empty">Nenhum item adicionado nessa categoria.</div>';
      return;
    }

    items.forEach(function (item, index) {
      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `
        <img src="https://image.tmdb.org/t/p/w300${item.poster}" alt="">
        <p>${item.title}</p>
        <button type="button">Remover</button>
      `;

      div.querySelector("button").onclick = function () {
        removeItem(index);
      };

      listEl.appendChild(div);
    });
  }

  searchInput.addEventListener("input", async function () {
    const query = searchInput.value.trim();

    if (query.length < 3) {
      resultsEl.innerHTML = "";
      setStatus("");
      return;
    }

    try {
      setStatus("Buscando...");
      const res = await fetch(
        "https://api.themoviedb.org/3/search/multi?api_key=" +
          API_KEY +
          "&query=" +
          encodeURIComponent(query)
      );
      const json = await res.json();
      renderResults(json.results || []);
      setStatus("");
    } catch (error) {
      console.error(error);
      setStatus("Erro ao buscar no TMDb.");
    }
  });

  categorySelect.addEventListener("change", function () {
    renderList();
  });

  if (window.Twitch && window.Twitch.ext) {
    window.Twitch.ext.configuration.onChanged(function () {
      const cfg = window.Twitch.ext.configuration.broadcaster;

      if (cfg && cfg.content) {
        try {
          data = JSON.parse(cfg.content);
        } catch (e) {
          console.error(e);
          data = JSON.parse(JSON.stringify(DEFAULT_DATA));
        }
      } else {
        data = JSON.parse(JSON.stringify(DEFAULT_DATA));
      }

      renderList();
    });

    window.Twitch.ext.onAuthorized(function () {
      setStatus("");
    });
  } else {
    setStatus("Abra esta página dentro da Twitch.");
  }

  renderList();
})();
