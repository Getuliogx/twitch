document.addEventListener("DOMContentLoaded", () => {

const API_KEY = "b095ccbbb185d27703d007ae0ded5f7d";

// modo streamer (teste)
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

// 🔍 BUSCA
searchInput.addEventListener("input", async () => {
  const query = searchInput.value;

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

// 🎬 RESULTADOS (com botão adicionar)
function renderResults(items) {
  resultsEl.innerHTML = "";

  items.forEach(item => {
    if (!item.poster_path) return;

    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <img src="https://image.tmdb.org/t/p/w200${item.poster_path}">
      <button class="add-btn">Adicionar</button>
    `;

    div.querySelector(".add-btn").onclick = () => addItem(item);

    resultsEl.appendChild(div);
  });
}

// ➕ ADICIONAR
function addItem(item) {
  const category = categorySelect.value;

  const exists = data[category].some(i => i.title === (item.title || item.name));
  if (exists) return;

  data[category].push({
    title: item.title || item.name,
    poster: item.poster_path
  });

  renderList();
}

// ❌ REMOVER
function removeItem(index) {
  const category = categorySelect.value;
  data[category].splice(index, 1);
  renderList();
}

// 📺 LISTA (com botão remover)
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
        <button class="remove-btn">Remover</button>
      `;

      div.querySelector(".remove-btn").onclick = () => removeItem(index);

      listEl.appendChild(div);
    });
}

// 🔄 GRID / LISTA
document.getElementById("toggleView").onclick = () => {
  listEl.classList.toggle("list-mode");
};

// trocar categoria atualiza lista
categorySelect.addEventListener("change", () => {
  renderList();
});

// iniciar
renderList();

});
