document.addEventListener("DOMContentLoaded", () => {

const API_KEY = "b095ccbbb185d27703d007ae0ded5f7d";

// 🔥 FORÇA MODO STREAMER (TESTE FORA DA TWITCH)
let isBroadcaster = true;

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

// segurança
if (!listEl || !resultsEl || !searchInput || !categorySelect) {
  console.error("Erro: HTML não carregou corretamente");
  return;
}

// 🔍 BUSCA
searchInput.addEventListener("input", async () => {
  const query = searchInput.value;

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
    console.error("Erro na busca:", err);
  }
});

// 🎬 MOSTRAR RESULTADOS
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

// ➕ ADICIONAR ITEM
function addItem(item) {
  const category = categorySelect.value;

  data[category].push({
    title: item.title || item.name,
    poster: item.poster_path
  });

  renderList();
}

// 📺 RENDER LISTA
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

// 🔄 BOTÃO LISTA / GRID
document.getElementById("toggleView").onclick = () => {
  listEl.classList.toggle("list-mode");
};

// iniciar
renderList();

});
