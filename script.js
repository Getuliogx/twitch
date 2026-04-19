const API_KEY = "b095ccbbb185d27703d007ae0ded5f7d";

let isBroadcaster = false;
let data = {
movies: [],
series: [],
anime: [],
favorites: []
};

const listEl = document.getElementById("list");
const resultsEl = document.getElementById("results");
const searchInput = document.getElementById("searchInput");
const categorySelect = document.getElementById("category");

let currentView = "grid";

// 🔐 Detecta se é streamer
window.Twitch.ext.onAuthorized((auth) => {
isBroadcaster = auth.role === "broadcaster";
});

// 📥 Recebe dados do streamer
window.Twitch.ext.configuration.onChanged(() => {
const cfg = window.Twitch.ext.configuration.broadcaster;

if (cfg && cfg.content) {
data = JSON.parse(cfg.content);
renderList();
}
});

// 💾 Salva dados (só streamer)
function saveData() {
if (!isBroadcaster) return;

window.Twitch.ext.configuration.set(
"broadcaster",
"1",
JSON.stringify(data)
);
}

// 🔍 Busca
searchInput.addEventListener("input", async () => {
const query = searchInput.value;

// viewer só filtra lista
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

// 🎬 Mostrar resultados (só streamer)
function renderResults(items) {
if (!isBroadcaster) return;

resultsEl.innerHTML = "";

items.forEach(item => {
if (!item.poster_path) return;

```
const div = document.createElement("div");
div.className = "card";

div.innerHTML = `
  <img src="https://image.tmdb.org/t/p/w200${item.poster_path}">
`;

div.onclick = () => addItem(item);

resultsEl.appendChild(div);
```

});
}

// ➕ Adicionar item
function addItem(item) {
if (!isBroadcaster) return;

const category = categorySelect.value;

data[category].push({
title: item.title || item.name,
poster: item.poster_path
});

saveData();
renderList();
}

// 📺 Render lista
function renderList(filter = "") {
const category = categorySelect.value;

listEl.innerHTML = "";

data[category]
.filter(i => i.title.toLowerCase().includes(filter.toLowerCase()))
.forEach(item => {
const div = document.createElement("div");
div.className = "card";

```
  div.innerHTML = `
    <img src="https://image.tmdb.org/t/p/w200${item.poster}">
    <p>${item.title}</p>
  `;

  listEl.appendChild(div);
});
```

}

// 🔄 Alternar layout
document.getElementById("toggleView").onclick = () => {
currentView = currentView === "grid" ? "list" : "grid";
listEl.classList.toggle("list-mode");
};

// 🚀 Inicial
renderList();

if (!window.Twitch) {
  isBroadcaster = true;
}
