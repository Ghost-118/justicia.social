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

async function loadMedia() {
    const container = document.getElementById('mediaContainer');
    if (!container) return;

    try {
        const res = await fetch(`${API_URL}/api/media_reports`);
        const reports = await res.json();

        if (!reports || reports.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted);">No hay reportes multimedia cargados.</p>';
            return;
        }

        container.innerHTML = reports.map((r) => `
            <div class="media-card">
                <h3>${r.title}</h3>
                <small style="color: var(--text-muted);">📅 ${r.date}</small>

                <div class="photo-gallery" style="margin-top: 10px;">
                    ${(r.photos || []).map(p => `<img src="${p}" alt="Fotografía">`).join('')}
                </div>

                ${r.videos && r.videos.length > 0 ? `
                    <div class="video-gallery" style="margin-top: 10px;">
                        ${r.videos.map(v => `<video src="${v}" controls style="width: 100%; max-height: 200px; border-radius: 8px;"></video>`).join('')}
                    </div>
                ` : ''}

                ${r.audio ? `
                    <div style="margin-top: 10px;">
                        <label><strong>Audio adjunto:</strong></label>
                        <audio src="${r.audio}" controls style="width: 100%; margin-top: 5px;"></audio>
                    </div>
                ` : ''}

                <div style="margin-top: 12px;">
                    📍 <a href="${r.location}" target="_blank" rel="noopener noreferrer">Ver Ubicación en Mapa</a>
                </div>

                <div style="margin-top: 12px; text-align: right;">
                    <button class="btn-delete" onclick="deleteMedia(${r.id})">Eliminar Reporte</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error("Error al cargar reportes:", error);
    }
}

async function deleteMedia(id) {
    try {
        const res = await fetch(`${API_URL}/api/media_reports/${id}`, { method: 'DELETE' });
        if (res.ok) {
            loadMedia();
        }
    } catch (error) {
        console.error("Error al eliminar reporte:", error);
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
            container.innerHTML = '<p style="color: var(--text-muted);">No hay registros de asistencias o promociones.</p>';
            return;
        }

        container.innerHTML = list.map((item) => `
            <div class="media-card">
                <h3>${item.title}</h3>
                <small style="color: var(--text-muted);">📅 Registrado el: <strong>${item.date}</strong></small>

                <div class="photo-gallery" style="margin-top: 10px;">
                    ${(item.photos || []).map(p => `<img src="${p}" alt="Evidencia fotográfica">`).join('')}
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
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No hay anfitriones registrados.</td></tr>';
            return;
        }

        tbody.innerHTML = hosts.map((h) => `
            <tr>
                <td>${h.name}</td>
                <td>${h.zone}</td>
                <td>${h.status}</td>
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
    try {
        const res = await fetch(`${API_URL}/api/hosts/${id}`, { method: 'DELETE' });
        if (res.ok) {
            loadHosts();
        }
    } catch (error) {
        console.error("Error al eliminar anfitrión:", error);
    }
}