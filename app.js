const API_KEY = '53146dc82d956c126a53f7d5f691e432'; 
// URLs Base
const URL_POPULAR = `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=es-ES&page=1`;
const URL_SEARCH = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&language=es-ES&include_adult=false&query=`;
const URL_GENRES = `https://api.themoviedb.org/3/genre/movie/list?api_key=${API_KEY}&language=es-ES`;

// --- DOM ELEMENTS ---
const sliderContainer = document.querySelector('.sliderprincipal');
const contenedor = document.getElementById('peliculas');

// Buscador
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const clearBtn = document.getElementById('clearBtn');
const infoBusqueda = document.getElementById('infoBusqueda');

// Favoritos
const contadorFavoritos = document.getElementById('contadorFavoritos');
const modal = document.getElementById('modalFavoritos');
const cerrarModal = document.getElementById('cerrarModal');
const listaFavoritos = document.getElementById('listaFavoritos');
const favoritosBtn = document.getElementById('favoritosBtn');
const notificacion = document.getElementById('notificacion');

// Trailer
const modalTrailer = document.getElementById('modalTrailer');
const iframeYoutube = document.getElementById('iframeYoutube');
const cerrarModalTrailer = document.getElementById('cerrarModalTrailer');

// Variables
let favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
let listaGeneros = []; 

// --- INICIALIZACIÓN ---
init();

async function init() {
    await cargarGeneros(); // Cargamos diccionario de géneros primero
    actualizarContador();
    cargarBanner();
    cargarPeliculas(URL_POPULAR); // Cargamos populares por defecto
}


// ==================================================================
// 0. LÓGICA DE GÉNEROS Y BÚSQUEDA
// ==================================================================

// Obtener lista de géneros
async function cargarGeneros() {
    try {
        const res = await fetch(URL_GENRES);
        const data = await res.json();
        listaGeneros = data.genres; 
    } catch (error) {
        console.error('Error cargando géneros:', error);
    }
}

// Convertir IDs a Nombres
function obtenerNombresGeneros(idsArray) {
    if (!idsArray || idsArray.length === 0) return "Sin categoría";
    
    const nombres = idsArray.map(id => {
        const genero = listaGeneros.find(g => g.id === id);
        return genero ? genero.name : null;
    }).filter(nombre => nombre !== null);

    // Devolvemos solo los 2 primeros
    return nombres.slice(0, 2).join(", ");
}

// Buscador
searchBtn.addEventListener('click', () => ejecutarBusqueda());
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') ejecutarBusqueda();
});

function ejecutarBusqueda() {
    const query = searchInput.value.trim();
    if (query) {
        // CAMBIO DE TEXTO DINÁMICO
        infoBusqueda.textContent = `Resultados para: "${query}"`;
        
        cargarPeliculas(URL_SEARCH + encodeURIComponent(query));
        contenedor.scrollIntoView({ behavior: 'smooth' });
    } else {
        // Si está vacío, volvemos al texto original
        infoBusqueda.textContent = 'Explorá las películas más populares del momento:';
        cargarPeliculas(URL_POPULAR);
    }
}

// Lógica del botón Limpiar
clearBtn.addEventListener('click', () => {
    searchInput.value = ''; 
    
    // RESTAURAR TEXTO ORIGINAL
    infoBusqueda.textContent = 'Explorá las películas más populares del momento:';
    
    cargarPeliculas(URL_POPULAR); 
    searchInput.focus();
});


// ==================================================================
// 1. LÓGICA DE TRAILERS
// ==================================================================
window.verTrailer = async (id) => {
    try {
        let res = await fetch(`https://api.themoviedb.org/3/movie/${id}/videos?api_key=${API_KEY}&language=es-ES`);
        let data = await res.json();
        let video = data.results.find(v => v.site === 'YouTube' && v.type === 'Trailer');

        if (!video) {
            res = await fetch(`https://api.themoviedb.org/3/movie/${id}/videos?api_key=${API_KEY}&language=en-US`);
            data = await res.json();
            video = data.results.find(v => v.site === 'YouTube' && v.type === 'Trailer');
        }

        if (video) {
            iframeYoutube.src = `https://www.youtube.com/embed/${video.key}?autoplay=1`;
            modalTrailer.style.display = 'flex';
        } else {
            mostrarNotificacion('❌ Lo siento, no hay trailer disponible.');
        }
    } catch (error) {
        console.error('Error al buscar trailer:', error);
        mostrarNotificacion('❌ Error al cargar el video.');
    }
};

if(cerrarModalTrailer) {
    cerrarModalTrailer.addEventListener('click', () => {
        modalTrailer.style.display = 'none';
        iframeYoutube.src = ''; 
    });
}
window.addEventListener('click', (e) => {
    if (e.target === modalTrailer) {
        modalTrailer.style.display = 'none';
        iframeYoutube.src = '';
    }
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});


// ==================================================================
// 2. LÓGICA DE FAVORITOS
// ==================================================================
function toggleFavorito(pelicula) {
    const index = favoritos.findIndex(p => String(p.id) === String(pelicula.id));
    let fueAgregado = false;

    if (index !== -1) {
        favoritos.splice(index, 1);
        mostrarNotificacion(`❌ Eliminada de favoritos`);
        fueAgregado = false;
    } else {
        favoritos.push(pelicula);
        mostrarNotificacion(`❤️ ${pelicula.title} agregada a favoritos`);
        fueAgregado = true;
    }

    localStorage.setItem('favoritos', JSON.stringify(favoritos));
    actualizarContador();
    if(modal.style.display === 'flex') mostrarFavoritos();
    return fueAgregado;
}

function esFavorito(id) {
    return favoritos.some(p => String(p.id) === String(id));
}

function actualizarBotonUI(boton, esFavorito) {
    if (esFavorito) {
        boton.textContent = "❌ Eliminar favorito";
        boton.classList.add("is-favorite");
    } else {
        boton.innerHTML = "❤️ Agregar a favorito";
        boton.classList.remove("is-favorite");
    }
}

window.toggleDesdeBanner = (btnElement, id, title, poster, voto) => {
    const pelicula = { id, title, poster, voto };
    const ahoraEsFavorito = toggleFavorito(pelicula);
    actualizarBotonUI(btnElement, ahoraEsFavorito);
    const btnGrilla = document.querySelector(`.btn-favorito[data-id="${id}"]`);
    if(btnGrilla) actualizarBotonUI(btnGrilla, ahoraEsFavorito);
};


// ==================================================================
// 3. BANNER / SLIDER
// ==================================================================
async function cargarBanner() {
    try {
        const res = await fetch(URL_POPULAR);
        const data = await res.json();
        const peliculasBanner = data.results.slice(0, 3);

        const slidesHTML = peliculasBanner.map((p, index) => {
            const tituloSafe = p.title.replace(/'/g, "\\'"); 
            const yaEsFavorito = esFavorito(p.id);
            const textoBtn = yaEsFavorito ? "❌ Eliminar favorito" : "❤️ Agregar a Favoritos";
            const claseBtn = yaEsFavorito ? "is-favorite" : "";

            return `
            <div class="slide ${index === 0 ? 'active' : ''}">
                <img src="https://image.tmdb.org/t/p/original${p.backdrop_path}" alt="${tituloSafe}">
                <div class="slider-content">
                    <h1>${p.title}</h1>
                    <p>${p.overview}</p>
                    <div class="botones-wrapper">
                        <button class="btn-banner-fav ${claseBtn}" 
                            onclick="toggleDesdeBanner(this, '${p.id}', '${tituloSafe}', '${p.poster_path}', '${p.vote_average}')">
                            ${textoBtn}
                        </button>
                        <button class="btn-trailer" onclick="verTrailer('${p.id}')">
                            ▶ Ver Trailer
                        </button>
                    </div>
                </div>
            </div>
        `}).join('');

        const dotsHTML = `
            <div class="slider-indicators">
                ${peliculasBanner.map((_, index) => `
                    <div class="dot ${index === 0 ? 'active' : ''}" data-index="${index}"></div>
                `).join('')}
            </div>
        `;

        sliderContainer.innerHTML = slidesHTML + dotsHTML;
        iniciarSlider();
    } catch (error) {
        console.error('Error cargando banner:', error);
    }
}

function iniciarSlider() {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    let currentSlide = 0;
    let slideInterval;

    const showSlide = (index) => {
        if(slides.length === 0) return;
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        slides[index].classList.add('active');
        dots[index].classList.add('active');
    };

    const nextSlide = () => {
        if(slides.length === 0) return;
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    };

    const startAutoSlide = () => {
        if(slideInterval) clearInterval(slideInterval);
        slideInterval = setInterval(nextSlide, 5000);
    };

    startAutoSlide();

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            clearInterval(slideInterval);
            currentSlide = index;
            showSlide(currentSlide);
            startAutoSlide();
        });
    });
}


// ==================================================================
// 4. GRILLA DE PELÍCULAS (CON GÉNEROS Y BÚSQUEDA)
// ==================================================================
async function cargarPeliculas(url) {
    try {
        const res = await fetch(url);
        const data = await res.json();

        if (data.results.length === 0) {
            contenedor.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No se encontraron resultados 😢</p>';
            return;
        }

        contenedor.innerHTML = data.results.map(p => {
            const yaEsFavorito = esFavorito(p.id);
            const textoBtn = yaEsFavorito ? "❌ Eliminar favorito" : "❤️ Agregar a favorito";
            const claseBtn = yaEsFavorito ? "is-favorite" : "";
            
            // Nombre de Géneros
            const nombreGeneros = obtenerNombresGeneros(p.genre_ids);
            
            const posterUrl = p.poster_path 
                ? `https://image.tmdb.org/t/p/w500${p.poster_path}` 
                : 'https://via.placeholder.com/500x750?text=No+Image';

            return `
            <div class="pelicula">
                <img src="${posterUrl}" alt="${p.title}">
                <h3>${p.title}</h3>
                <p class="genero">${nombreGeneros}</p>
                <p>⭐ ${p.vote_average ? p.vote_average.toFixed(2) : 'N/A'}</p>
                
                <button class="btn-favorito ${claseBtn}" 
                    data-id="${p.id}" 
                    data-title="${p.title}" 
                    data-poster="${p.poster_path}" 
                    data-voto="${p.vote_average}">
                    ${textoBtn}
                </button>

                <div style="margin-top: 10px;">
                    <button class="btn-trailer" onclick="verTrailer('${p.id}')" style="width: 100%; justify-content: center;">
                        ▶ Ver Trailer
                    </button>
                </div>
            </div>
        `}).join('');

        document.querySelectorAll('.btn-favorito').forEach(boton => {
            boton.addEventListener('click', (e) => {
                const btn = e.target;
                const peli = {
                    id: btn.dataset.id,
                    title: btn.dataset.title,
                    poster: btn.dataset.poster,
                    voto: btn.dataset.voto
                };
                const ahoraEsFavorito = toggleFavorito(peli);
                actualizarBotonUI(btn, ahoraEsFavorito);
            });
        });

    } catch (error) {
        console.error('Error al cargar las películas:', error);
    }
}


// ==================================================================
// 5. UTILIDADES
// ==================================================================
function actualizarContador() { contadorFavoritos.textContent = favoritos.length; }

window.eliminarFavorito = (id) => {
    const peli = favoritos.find(p => String(p.id) === String(id));
    if(peli) {
        toggleFavorito(peli); 
        const btnGrilla = document.querySelector(`.btn-favorito[data-id="${id}"]`);
        if(btnGrilla) actualizarBotonUI(btnGrilla, false);
    }
};

function mostrarFavoritos() {
    if (favoritos.length === 0) {
        listaFavoritos.innerHTML = '<p>No tenés películas favoritas aún.</p>';
        return;
    }
    listaFavoritos.innerHTML = favoritos.map(p => `
        <div class="item-favorito">
            <img src="https://image.tmdb.org/t/p/w300${p.poster}" alt="${p.title}">
            <h4>${p.title}</h4>
            <button onclick="eliminarFavorito('${p.id}')">Eliminar</button>
        </div>
    `).join('');
}

function mostrarNotificacion(texto) {
    notificacion.textContent = texto;
    notificacion.classList.add('mostrar');
    setTimeout(() => {
        notificacion.classList.remove('mostrar');
    }, 2500);
}

favoritosBtn.addEventListener('click', (e) => {
    e.preventDefault();
    mostrarFavoritos();
    modal.style.display = 'flex';
});
cerrarModal.addEventListener('click', () => modal.style.display = 'none');

const menuToggle = document.querySelector('.menu-toggle');
const menu = document.getElementById('menu');
menuToggle.addEventListener('click', () => menu.classList.toggle('show'));

const header = document.querySelector('header');
const headerHeight = header.offsetHeight;
window.addEventListener('scroll', () => {
  if (window.scrollY > headerHeight) {
    header.classList.add('sticky');
    document.body.style.paddingTop = `${headerHeight}px`; 
  } else {
    header.classList.remove('sticky');
    document.body.style.paddingTop = '0';
  }
});

const form = document.getElementById('contactForm');
if(form){
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = new FormData(form);
        try {
            const res = await fetch(form.action, {
                method: form.method,
                body: data,
                headers: { 'Accept': 'application/json' }
            });
            if (res.ok) {
                form.reset();
                document.getElementById('successMsg').style.display = 'block';
                document.getElementById('errorMsg').style.display = 'none';
            } else {
                document.getElementById('errorMsg').style.display = 'block';
            }
        } catch (err) {
            document.getElementById('errorMsg').style.display = 'block';
        }
    });
}