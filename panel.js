const DEFAULT_DATA = {
  movies: [],
  series: [],
  anime: [],
  favorites: []
};

let data = structuredClone(DEFAULT_DATA);

const listEl = document.getElementById("list");
const searchInput = document.getElementById("searchInput");
const categorySelect = document.getElementById("category");
const statusMsg = document.getElementById("statusMsg");

function renderList(filter = "") {
  const category = categorySelect.value;
  const items = (data[category] || []).filter(item =>
    item.title.toLowerCase().includes(filter.toLowerCase())
  );

  listEl.innerHTML = "";

  if (!items.length) {
    listEl.innerHTML = `<div class="empty">Nenhum item nessa categoria.</div>`;
    return;
  }

  items.forEach(item => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <img src="https://image.tmdb.org/t/p/w300${item.poster}" alt="">
      <p>${item.title}</p>
    `;
    listEl.appendChild(div);
  });
}

searchInput.addEventListener("input", () => {
  renderList(searchInput.value);
});

categorySelect.addEventListener("change", () => {
  renderList(searchInput.value);
});

if (window.Twitch && window.Twitch.ext) {
  window.Twitch.ext.configuration.onChanged(() => {
    const cfg = window.Twitch.ext.configuration.broadcaster;
    if (cfg && cfg.content) {
      try {
        data = JSON.parse(cfg.content);
      } catch {
        data = structuredClone(DEFAULT_DATA);
      }
    } else {
      data = structuredClone(DEFAULT_DATA);
    }
    renderList(searchInput.value);
  });

  window.Twitch.ext.onAuthorized(() => {
    statusMsg.textContent = "";
  });
} else {
  statusMsg.textContent = "Fora da Twitch: esta tela só mostra a lista salva.";
}

renderList();