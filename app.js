// Navegación entre secciones
function showSection(id, event) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(id).classList.add('active');
    event.currentTarget.classList.add('active');
}

// Cargar datos al iniciar
document.addEventListener('DOMContentLoaded', () => {
    loadHosts();
    loadMedia();
    loadDocs();
});

// Helper para convertir archivo a Base64
const fileToBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

// --- GESTIÓN DE ARCHIVOS MULTIMEDIA ---
document.getElementById('uploadForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('fileTitle').value;
    const photoFiles = document.getElementById('photoInput').files;
    const videoFiles = document.getElementById('videoInput').files;
    const audioFile = document.getElementById('audioInput').files[0];
    const locationUrl = document.getElementById('locationInput').value;

    try {
        // Procesar fotos obligatorias
        const photos = [];
        for (let i = 0; i < photoFiles.length; i++) {
            photos.push(await fileToBase64(photoFiles[i]));
        }

        // Procesar videos opcionales
        const videos = [];
        if (videoFiles && videoFiles.length > 0) {
            for (let i = 0; i < videoFiles.length; i++) {
                videos.push(await fileToBase64(videoFiles[i]));
            }
        }

        // Procesar audio de WhatsApp
        const audio = audioFile ? await fileToBase64(audioFile) : null;

        const reportItem = {
            id: Date.now(),
            title: title,
            photos: photos,
            videos: videos,
            audio: audio,
            location: locationUrl,
            date: new Date().toLocaleDateString()
        };

        const mediaList = JSON.parse(localStorage.getItem('mediaReports') || '[]');
        mediaList.push(reportItem);
        localStorage.setItem('mediaReports', JSON.stringify(mediaList));

        document.getElementById('uploadForm').reset();
        loadMedia();
    } catch (error) {
        console.error("Error al guardar el reporte multimedia:", error);
    }
});

function loadMedia() {
    const mediaList = JSON.parse(localStorage.getItem('mediaReports') || '[]');
    const container = document.getElementById('mediaContainer');
    
    if (container) {
        if (mediaList.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted);">No hay reportes registrados.</p>';
            return;
        }

        container.innerHTML = mediaList.map((item, index) => `
            <div class="media-card">
                <h3>${item.title}</h3>
                <small style="color: var(--text-muted);">Fecha: ${item.date}</small>
                
                <!-- Galería de Fotos -->
                <div class="photo-gallery">
                    ${item.photos.map(p => `<img src="${p}" alt="Foto del evento">`).join('')}
                </div>

                <!-- Videos (Opcionales) -->
                ${item.videos && item.videos.length > 0 ? `
                    <div class="video-container">
                        ${item.videos.map(v => `<video src="${v}" controls></video>`).join('')}
                    </div>
                ` : ''}

                <!-- Audio de WhatsApp -->
                ${item.audio ? `
                    <div style="margin-top: 10px;">
                        <label style="font-size:0.85rem; font-weight:bold;">Audio adjunto:</label>
                        <audio src="${item.audio}" controls style="width: 100%; margin-top: 4px;"></audio>
                    </div>
                ` : ''}

                <!-- Ubicación Google Maps / WhatsApp -->
                <div style="margin-top: 12px; font-size: 0.9rem;">
                    📍 <a href="${item.location}" target="_blank" style="color: var(--guinda-main); font-weight: bold; text-decoration: none;">
                        Ver Ubicación en Mapa
                    </a>
                </div>

                <div style="margin-top: 12px; text-align: right;">
                    <button class="btn-delete" onclick="deleteMedia(${index})">Eliminar Reporte</button>
                </div>
            </div>
        `).join('');
    }
}

function deleteMedia(index) {
    const mediaList = JSON.parse(localStorage.getItem('mediaReports') || '[]');
    mediaList.splice(index, 1);
    localStorage.setItem('mediaReports', JSON.stringify(mediaList));
    loadMedia();
}

// --- GESTIÓN DE ANFITRIONES ---
document.getElementById('hostForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const host = {
        name: document.getElementById('hostName').value,
        zone: document.getElementById('hostZone').value,
        status: document.getElementById('hostStatus').value,
        email: document.getElementById('hostEmail').value
    };

    const hosts = JSON.parse(localStorage.getItem('hosts') || '[]');
    hosts.push(host);
    localStorage.setItem('hosts', JSON.stringify(hosts));
    
    document.getElementById('hostForm').reset();
    loadHosts();
});

function loadHosts() {
    const hosts = JSON.parse(localStorage.getItem('hosts') || '[]');
    const tbody = document.getElementById('hostTableBody');
    if (tbody) {
        if (hosts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No hay anfitriones registrados.</td></tr>';
            return;
        }

        tbody.innerHTML = hosts.map((h, index) => `
            <tr>
                <td>${h.name}</td>
                <td>${h.zone}</td>
                <td>${h.status}</td>
                <td>${h.email}</td>
                <td>
                    <button class="btn-delete" onclick="deleteHost(${index})">Eliminar</button>
                </td>
            </tr>
        `).join('');
    }
}

function deleteHost(index) {
    const hosts = JSON.parse(localStorage.getItem('hosts') || '[]');
    hosts.splice(index, 1);
    localStorage.setItem('hosts', JSON.stringify(hosts));
    loadHosts();
}

// --- GESTIÓN DE DOCUMENTOS ---
document.getElementById('docForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const docInput = document.getElementById('docInput');
    const file = docInput.files[0];
    const name = document.getElementById('docName').value;

    if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
            const docItem = { name: name, src: event.target.result, fileName: file.name };
            const docList = JSON.parse(localStorage.getItem('docs') || '[]');
            docList.push(docItem);
            localStorage.setItem('docs', JSON.stringify(docList));

            document.getElementById('docForm').reset();
            loadDocs();
        };
        reader.readAsDataURL(file);
    }
});

function loadDocs() {
    const docList = JSON.parse(localStorage.getItem('docs') || '[]');
    const container = document.getElementById('docList');
    if (container) {
        if (docList.length === 0) {
            container.innerHTML = '<li style="color: var(--text-muted);">No hay documentos disponibles.</li>';
            return;
        }

        container.innerHTML = docList.map((doc, index) => `
            <li>
                <span>📄 <strong>${doc.name}</strong> (${doc.fileName})</span>
                <div>
                    <a href="${doc.src}" download="${doc.fileName}" style="margin-right: 10px;">Descargar</a>
                    <button class="btn-delete" onclick="deleteDoc(${index})">Eliminar</button>
                </div>
            </li>
        `).join('');
    }
}

function deleteDoc(index) {
    const docList = JSON.parse(localStorage.getItem('docs') || '[]');
    docList.splice(index, 1);
    localStorage.setItem('docs', JSON.stringify(docList));
    loadDocs();
}