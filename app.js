const API_URL = 'https://justicia-social-backend.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
    loadHosts();
    loadMedia();
    loadAsistencias();
});

// --- NAVEGACIÓN Y PESTAÑAS ---
function showSection(sectionId, event) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(sec => sec.classList.remove('active'));

    const buttons = document.querySelectorAll('.nav-btn');
    buttons.forEach(btn => btn.classList.remove('active'));

    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
}

// --- AUXILIAR: CONVERTIR ARCHIVOS A BASE64 ---
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

// --- 1. GESTIÓN DE ARCHIVOS MULTIMEDIA ---
document.getElementById('mediaForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('mediaTitle').value;
    const photoFiles = document.getElementById('mediaPhotos').files;
    const videoFiles = document.getElementById('mediaVideos').files;
    const audioFile = document.getElementById('mediaAudio').files[0];
    const location = document.getElementById('mediaLocation').value;

    try {
        const photos = [];
        for (let i = 0; i < photoFiles.length; i++) {
            photos.push(await fileToBase64(photoFiles[i]));
        }

        const videos = [];
        for (let i = 0; i < videoFiles.length; i++) {
            videos.push(await fileToBase64(videoFiles[i]));
        }

        let audio = null;
        if (audioFile) {
            audio = await fileToBase64(audioFile);
        }

        const now = new Date();
        const formattedDate = `${now.toLocaleDateString()} a las ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

        const mediaReport = {
            title: title,
            photos: photos,
            videos: videos,
            audio: audio,
            location: location,
            date: formattedDate
        };

        const res = await fetch(`${API_URL}/api/media_reports`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mediaReport)
        });

        if (res.ok) {
            document.getElementById('mediaForm').reset();
            loadMedia();
        } else {
            console.error("Error al guardar multimedia en el servidor");
        }
    } catch (error) {
        console.error("Error al guardar multimedia:", error);
    }
});

// Cargar y mostrar los reportes multimedia
async function loadMedia() {
    try {
        const response = await fetch(`${API_URL}/api/media`);
        if (!response.ok) throw new Error('Error al obtener datos');
        const data = await response.json();

        const container = document.getElementById('mediaContainer'); 
        if (!container) return;

        container.innerHTML = '';

        if (data.length === 0) {
            container.innerHTML = '<p style="color: #666;">No hay reportes subidos aún.</p>';
            return;
        }

        data.forEach(item => {
            let photos = [];
            let videos = [];
            try { photos = typeof item.photos === 'string' ? JSON.parse(item.photos) : item.photos; } catch(e) { photos = []; }
            try { videos = typeof item.videos === 'string' ? JSON.parse(item.videos) : item.videos; } catch(e) { videos = []; }

            const div = document.createElement('div');
            div.className = 'media-card';

            let photosHTML = photos && photos.length ? photos.map(img => `<img src="${img}" style="max-width: 150px; margin: 5px; border-radius: 4px;">`).join('') : '';
            let videosHTML = videos && videos.length ? videos.map(vid => `<video src="${vid}" controls style="max-width: 250px; margin: 5px;"></video>`).join('') : '';
            let audioHTML = item.audio ? `<audio src="${item.audio}" controls style="margin-top: 5px; display: block;"></audio>` : '';
            let locationHTML = item.location ? `<p><a href="${item.location}" target="_blank" rel="noopener noreferrer">📍 Ver Ubicación</a></p>` : '';

            div.innerHTML = `
                <h3>${item.title || 'Sin título'}</h3>
                <small style="color: #888;">${item.date_str || item.date || ''}</small>
                <div style="margin-top: 10px;">${photosHTML}</div>
                <div style="margin-top: 10px;">${videosHTML}</div>
                <div>${audioHTML}</div>
                ${locationHTML}
                <button class="btn-delete" onclick="deleteMedia(${item.id})" style="margin-top: 10px;">Eliminar</button>
            `;
            container.appendChild(div);
        });
    } catch (err) {
        console.error('Error cargando reportes multimedia:', err);
    }
}

async function deleteMedia(id) {
    if (!confirm('¿Deseas eliminar este reporte?')) return;
    try {
        await fetch(`${API_URL}/api/media/${id}`, { method: 'DELETE' });
        loadMedia();
    } catch (err) {
        console.error('Error al eliminar:', err);
    }
}

// --- 2. GESTIÓN DE ASISTENCIAS / PROMOCIONES ---
document.getElementById('asistenciaForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('asistenciaTitle').value;
    const photoFiles = document.getElementById('asistenciaPhotos').files;

    try {
        const photos = [];
        for (let i = 0; i < photoFiles.length; i++) {
            photos.push(await fileToBase64(photoFiles[i]));
        }

        const now = new Date();
        const formattedDate = `${now.toLocaleDateString()} a las ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

        const asistenciaItem = {
            title: title,
            photos: photos,
            date: formattedDate
        };

        const res = await fetch(`${API_URL}/api/asistencias`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(asistenciaItem)
        });

        if (res.ok) {
            document.getElementById('asistenciaForm').reset();
            loadAsistencias();
        }
    } catch (error) {
        console.error("Error al registrar la asistencia:", error);
    }
});

async function loadAsistencias() {
    const container = document.getElementById('asistenciasContainer');
    if (!container) return;

    try {
        const res = await fetch(`${API_URL}/api/asistencias`);
        const list = await res.json();

        if (!list || list.length === 0) {
            container.innerHTML = '<p style="color: #666;">No hay registros de asistencias o promociones.</p>';
            return;
        }

        container.innerHTML = list.map((item) => `
            <div class="media-card">
                <h3>${item.title}</h3>
                <small style="color: #888;">📅 Registrado el: <strong>${item.date}</strong></small>

                <div class="photo-gallery" style="margin-top: 10px;">
                    ${(item.photos || []).map(p => `<img src="${p}" alt="Evidencia fotográfica" style="max-width: 150px; margin: 5px;">`).join('')}
                </div>

                <div style="margin-top: 12px; text-align: right;">
                    <button class="btn-delete" onclick="deleteAsistencia(${item.id})">Eliminar</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error("Error al cargar asistencias:", error);
    }
}

async function deleteAsistencia(id) {
    if (!confirm('¿Deseas eliminar este registro?')) return;
    try {
        const res = await fetch(`${API_URL}/api/asistencias/${id}`, { method: 'DELETE' });
        if (res.ok) {
            loadAsistencias();
        }
    } catch (error) {
        console.error("Error al eliminar asistencia:", error);
    }
}

// --- 3. GESTIÓN DE ANFITRIONES ---
document.getElementById('hostForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('hostName').value;
    const zone = document.getElementById('hostZone').value;
    const status = document.getElementById('hostStatus').value;
    const email = document.getElementById('hostEmail').value;

    const host = { name, zone, status, email };

    try {
        const res = await fetch(`${API_URL}/api/hosts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(host)
        });

        if (res.ok) {
            document.getElementById('hostForm').reset();
            loadHosts();
        }
    } catch (error) {
        console.error("Error al registrar anfitrión:", error);
    }
});

async function loadHosts() {
    const tbody = document.getElementById('hostTableBody');
    if (!tbody) return;

    try {
        const res = await fetch(`${API_URL}/api/hosts`);
        const hosts = await res.json();

        if (!hosts || hosts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #666;">No hay anfitriones registrados.</td></tr>';
            return;
        }

        tbody.innerHTML = hosts.map((h) => `
            <tr>
                <td>${h.name}</td>
                <td>${h.zone}</td>
                <td><strong>${h.status}</strong></td>
                <td>${h.email}</td>
                <td>
                    <button class="btn-delete" onclick="deleteHost(${h.id})">Eliminar</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error("Error al cargar anfitriones:", error);
    }
}

async function deleteHost(id) {
    if (!confirm('¿Deseas eliminar este anfitrión?')) return;
    try {
        const res = await fetch(`${API_URL}/api/hosts/${id}`, { method: 'DELETE' });
        if (res.ok) {
            loadHosts();
        }
    } catch (error) {
        console.error("Error al eliminar anfitrión:", error);
    }
}