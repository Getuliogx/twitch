const API_KEY = "b095ccbbb185d27703d007ae0ded5f7d";

let isBroadcaster = false;

let data = {
  movies: [],
  series: [],
  anime: []
};

const listEl = document.getElementById("list");
const resultsEl = document.getElementById("results");
const searchInput = document.getElementById("searchInput");
const categorySelect = document.getElementById("category");

// 🔐 autenticação Twitch
window.Twitch.ext.onAuthorized((auth) => {
  isBroadcaster = auth.role === "broadcaster";
});

// 📥 carregar dados
window.Twitch.ext.configuration.onChanged(() => {
  const cfg = window.Twitch.ext.configuration.broadcaster;

  if (cfg && cfg.content) {
    data = JSON.parse(cfg.content);
    renderList();
  }
});

// 💾 salvar (SÓ streamer)
function saveData() {
  if (!isBroadcaster) return;

  window.Twitch.ext.configuration.set(
    "broadcaster",
    "1",
    JSON.stringify(data)
  );
}

// 🔍 busca
searchInput.addEventListener("input", async () => {
  const query = searchInput.value;

  if (!isBroadcaster) {
    renderList(query);
    return;
  }

  if (query.length < 3) {
    resultsEl.innerHTML = "";
    return;
  }

  const res = await fetch(
    `https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&query=${query}`
  );

  const json = await res.json();
  renderResults(json.results);
});

// 🎬 resultados (streamer)
function renderResults(items) {
  if (!isBroadcaster) return;

  resultsEl.innerHTML = "";

  items.forEach(item => {
    if (!item.poster_path) return;

    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <img src="https://image.tmdb.org/t/p/w200${item.poster_path}">
      <button>Adicionar</button>
    `;

    div.querySelector("button").onclick = () => addItem(item);

    resultsEl.appendChild(div);
  });
}

// ➕ adicionar
function addItem(item) {
  if (!isBroadcaster) return;

  const category = categorySelect.value;

  const exists = data[category].some(i => i.title === (item.title || item.name));
  if (exists) return;

  data[category].push({
    title: item.title || item.name,
    poster: item.poster_path
  });

  saveData();
  renderList();
}

// ❌ remover
function removeItem(index) {
  if (!isBroadcaster) return;

  const category = categorySelect.value;
  data[category].splice(index, 1);

  saveData();
  renderList();
}

// 📺 lista
function renderList(filter = "") {
  const category = categorySelect.value;

  listEl.innerHTML = "";

  data[category]
    .filter(i => i.title.toLowerCase().includes(filter.toLowerCase()))
    .forEach((item, index) => {

      const div = document.createElement("div");
      div.className = "card";

      div.innerHTML = `
        <img src="https://image.tmdb.org/t/p/w200${item.poster}">
        <p>${item.title}</p>
        ${isBroadcaster ? '<button>Remover</button>' : ''}
      `;

      if (isBroadcaster) {
        div.querySelector("button").onclick = () => removeItem(index);
      }

      listEl.appendChild(div);
    });
}

// iniciar
renderList();
