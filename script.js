document.addEventListener("DOMContentLoaded", () => {

let isBroadcaster = false;

// força modo streamer fora da Twitch
if (!window.Twitch) {
  isBroadcaster = true;
}

const API_KEY = "b095ccbbb185d27703d007ae0ded5f7d";

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

// proteção
if (!listEl || !searchInput || !categorySelect) {
  console.error("HTML não carregou corretamente");
  return;
}

// Twitch safe
if (window.Twitch && window.Twitch.ext) {

  window.Twitch.ext.onAuthorized((auth) => {
    isBroadcaster = auth.role === "broadcaster";
  });

  window.Twitch.ext.configuration.onChanged(() => {
    const cfg = window.Twitch.ext.configuration.broadcaster;

    if (cfg && cfg.content) {
      data = JSON.parse(cfg.content);
      renderList();
    }
  });
}

// salvar
function saveData() {
  if (!isBroadcaster || !window.Twitch) return;

  window.Twitch.ext.configuration.set(
    "broadcaster",
    "1",
    JSON.stringify(data)
  );
}

// busca
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

  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&query=${query}`
    );

    const json = await res.json();
    renderResults(json.results);

  } catch (err) {
    console.error(err);
  }
});

// mostrar resultados
function renderResults(items) {
  resultsEl.innerHTML = "";

  items.forEach(item => {
    if (!item.poster_path) return;

    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <img src="https://image.tmdb.org/t/p/w200${item.poster_path}">
    `;

    div.onclick = () => addItem(item);

    resultsEl.appendChild(div);
  });
}

// adicionar
function addItem(item) {
  const category = categorySelect.value;

  data[category].push({
    title: item.title || item.name,
    poster: item.poster_path
  });

  saveData();
  renderList();
}

// render lista
function renderList(filter = "") {
  const category = categorySelect.value;

  listEl.innerHTML = "";

  data[category]
    .filter(i => i.title.toLowerCase().includes(filter.toLowerCase()))
    .forEach(item => {
      const div = document.createElement("div");
      div.className = "card";

      div.innerHTML = `
        <img src="https://image.tmdb.org/t/p/w200${item.poster}">
        <p>${item.title}</p>
      `;

      listEl.appendChild(div);
    });
}

// botão layout
document.getElementById("toggleView").onclick = () => {
  listEl.classList.toggle("list-mode");
};

// iniciar
renderList();

});
