document.addEventListener("DOMContentLoaded", () => {

const API_KEY = "b095ccbbb185d27703d007ae0ded5f7d";

// modo streamer (teste)
let isBroadcaster = true;

// ✅ CARREGA DO LOCALSTORAGE
let data = JSON.parse(localStorage.getItem("mediaList")) || {
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

// 💾 SALVAR
function saveData() {
  localStorage.setItem("mediaList", JSON.stringify(data));
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

// 🎬 RESULTADOS
function renderResults(items) {
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

// ➕ ADICIONAR
function addItem(item) {
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

// ❌ REMOVER
function removeItem(index) {
  const category = categorySelect.value;

  data[category].splice(index, 1);

  saveData();
  renderList();
}

// 📺 LISTA
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
        <button>Remover</button>
      `;

      div.querySelector("button").onclick = () => removeItem(index);

      listEl.appendChild(div);
    });
}

// 🔄 LISTA / GRID
document.getElementById("toggleView").onclick = () => {
  listEl.classList.toggle("list-mode");
};

// trocar categoria
categorySelect.addEventListener("change", () => {
  renderList();
});

// iniciar
renderList();

});
