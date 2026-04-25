(function () {
  const DEFAULT_DATA = {
    movies: [],
    series: [],
    anime: [],
    favorites: []
  };

  let data = JSON.parse(JSON.stringify(DEFAULT_DATA));

  const listEl = document.getElementById("list");
  const searchInput = document.getElementById("searchInput");
  const categorySelect = document.getElementById("category");
  const statusMsg = document.getElementById("statusMsg");

  function setStatus(message) {
    statusMsg.textContent = message || "";
  }

  function renderList(filter) {
    const category = categorySelect.value;
    const safeFilter = (filter || "").toLowerCase();
    const items = (data[category] || []).filter(function (item) {
      return (item.title || "").toLowerCase().includes(safeFilter);
    });

    listEl.innerHTML = "";

    if (!items.length) {
      listEl.innerHTML = '<div class="empty">Nenhum item nessa categoria.</div>';
      return;
    }

    items.forEach(function (item) {
      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `
        <img src="https://image.tmdb.org/t/p/w300${item.poster}" alt="">
        <p>${item.title}</p>
      `;
      listEl.appendChild(div);
    });
  }

  searchInput.addEventListener("input", function () {
    renderList(searchInput.value);
  });

  categorySelect.addEventListener("change", function () {
    renderList(searchInput.value);
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

      renderList(searchInput.value);
    });

    window.Twitch.ext.onAuthorized(function () {
      setStatus("");
    });
  } else {
    setStatus("Abra esta página dentro da Twitch.");
  }

  renderList("");
})();
