document.addEventListener("DOMContentLoaded", function () {
  var DEFAULT_DATA = {
    movies: [],
    series: [],
    anime: [],
    favorites: []
  };

  var data = JSON.parse(JSON.stringify(DEFAULT_DATA));

  var listEl = document.getElementById("list");
  var searchInput = document.getElementById("searchInput");
  var categorySelect = document.getElementById("category");
  var statusMsg = document.getElementById("statusMsg");

  function setStatus(message) {
    statusMsg.textContent = message || "";
  }

  function renderList(filterText) {
    var category = categorySelect.value;
    var filter = (filterText || "").toLowerCase();
    var items = (data[category] || []).filter(function (item) {
      return (item.title || "").toLowerCase().indexOf(filter) !== -1;
    });

    listEl.innerHTML = "";

    if (!items.length) {
      listEl.innerHTML = '<div class="empty">Nenhum item nessa categoria.</div>';
      return;
    }

    items.forEach(function (item) {
      var div = document.createElement("div");
      div.className = "card";
      div.innerHTML =
        '<img src="https://image.tmdb.org/t/p/w300' + item.poster + '" alt="">' +
        '<p>' + escapeHtml(item.title) + '</p>';
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

  searchInput.addEventListener("input", function () {
    renderList(searchInput.value);
  });

  categorySelect.addEventListener("change", function () {
    renderList(searchInput.value);
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

      renderList(searchInput.value);
    });
  } else {
    setStatus("Abra esta página dentro da Twitch.");
  }

  renderList("");
});
