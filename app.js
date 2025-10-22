const API_KEY = '53146dc82d956c126a53f7d5f691e432'; // Reemplazá con tu clave
const URL = `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=es-ES&page=1`;

const contenedor = document.getElementById('peliculas');
const contadorFavoritos = document.getElementById('contadorFavoritos');
const modal = document.getElementById('modalFavoritos');
const cerrarModal = document.getElementById('cerrarModal');
const listaFavoritos = document.getElementById('listaFavoritos');
const favoritosBtn = document.getElementById('favoritosBtn');
const notificacion = document.getElementById('notificacion');

// 🧠 Cargar favoritos del almacenamiento local
let favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
actualizarContador();

async function cargarPeliculas() {
    try {
        const res = await fetch(URL);
        const data = await res.json();

        contenedor.innerHTML = data.results.map(p => `
      <div class="pelicula">
        <img src="https://image.tmdb.org/t/p/w500${p.poster_path}" alt="${p.title}">
        <h3>${p.title}</h3>
        <p>⭐ ${p.vote_average.toFixed(2)}</p>
        <button class="btn-favorito" 
          data-id="${p.id}" 
          data-title="${p.title}" 
          data-poster="${p.poster_path}" 
          data-voto="${p.vote_average}">
          ❤️ Agregar a favorito
        </button>
      </div>
    `).join('');

        document.querySelectorAll('.btn-favorito').forEach(boton => {
            boton.addEventListener('click', (e) => {
                const peli = {
                    id: e.target.dataset.id,
                    title: e.target.dataset.title,
                    poster: e.target.dataset.poster,
                    voto: e.target.dataset.voto
                };
                agregarAFavoritos(peli);
            });
        });

    } catch (error) {
        console.error('Error al cargar las películas:', error);
    }
}

function agregarAFavoritos(pelicula) {
    const existe = favoritos.some(p => p.id === pelicula.id);
    if (existe) {
        mostrarNotificacion(`${pelicula.title} ya está en favoritos ❤️`);
        return;
    }

    favoritos.push(pelicula);
    localStorage.setItem('favoritos', JSON.stringify(favoritos));
    actualizarContador();
    mostrarNotificacion(`${pelicula.title} agregada a favoritos ❤️`);
}

function eliminarFavorito(id) {
    favoritos = favoritos.filter(p => p.id !== id);
    localStorage.setItem('favoritos', JSON.stringify(favoritos));
    actualizarContador();
    mostrarFavoritos();
}

function actualizarContador() {
    contadorFavoritos.textContent = favoritos.length;
}

// ✅ Modal de favoritos
favoritosBtn.addEventListener('click', (e) => {
    e.preventDefault();
    mostrarFavoritos();
    modal.style.display = 'flex';
});

cerrarModal.addEventListener('click', () => {
    modal.style.display = 'none';
});

function mostrarFavoritos() {
    if (favoritos.length === 0) {
        listaFavoritos.innerHTML = '<p>No tenés películas favoritas aún.</p>';
        return;
    }

    listaFavoritos.innerHTML = favoritos.map(p => `
    <div class="item-favorito">
      <img src="https://image.tmdb.org/t/p/w300${p.poster}" alt="${p.title}">
      <h4>${p.title}</h4>
      <p>⭐ ${parseFloat(p.voto).toFixed(2)}</p>
      <button onclick="eliminarFavorito('${p.id}')">Eliminar</button>
    </div>
  `).join('');
}

// ✅ Notificación flotante (sin alert)
function mostrarNotificacion(texto) {
    notificacion.textContent = texto;
    notificacion.classList.add('mostrar');
    setTimeout(() => {
        notificacion.classList.remove('mostrar');
    }, 2500);
}

cargarPeliculas();


const menuToggle = document.getElementById('menuToggle');
const menu = document.getElementById('menu');

menuToggle.addEventListener('click', () => {
    menu.classList.toggle('show');
});
