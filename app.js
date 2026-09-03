const API_URL = 'https://justicia-social-backend.onrender.com';

// Variable global para controlar si se está editando un registro del colectivo
let idEdicionColectivo = null;

document.addEventListener('DOMContentLoaded', () => {
    loadHosts();
    loadMedia();
    loadAsistencias();
    cargarRegistrosColectivo();
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

// --- AUXILIARES PARA ENLACES (MAPS Y WHATSAPP) ---
function generarEnlaceMaps(calle, numero, colonia) {
    const direccion = `${calle || ''} ${numero || ''}, ${colonia || ''}, Tonalá, Jalisco`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion.trim())}`;
}

function generarEnlaceWhatsApp(numeroTel) {
    if (!numeroTel) return '#';
    const numLimpio = numeroTel.replace(/\D/g, '');
    const numFinal = numLimpio.length === 10 ? `52${numLimpio}` : numLimpio;
    return `https://wa.me/${numFinal}`;
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

// --- 1. GESTIÓN DE ARCHIVOS MULTIMEDIA / REPORTES ---
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
            tipo: 'reporte',
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
            alert('¡Reporte multimedia guardado exitosamente!');
            document.getElementById('mediaForm').reset();
            loadMedia();
        } else {
            alert('Error al guardar el reporte multimedia en el servidor.');
            console.error("Error al guardar multimedia en el servidor");
        }
    } catch (error) {
        alert('Ocurrió un error al procesar o enviar los archivos multimedia.');
        console.error("Error al guardar multimedia:", error);
    }
});

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

// --- 2. GESTIÓN DE REGISTROS - COLECTIVO JUSTICIA SOCIAL ---
document.getElementById('colectivoForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log("Iniciando envío de formulario del Colectivo...");

    const colectivoData = {
        tipo: 'registro_colectivo',
        conoceJuncal: document.getElementById('conoceJuncal')?.value || '',
        actividadCivica: document.getElementById('actividadCivica')?.value || '',
        acuerdo4T: document.getElementById('acuerdo4T')?.value || '',
        simpatizaPartido: document.getElementById('simpatizaPartido')?.value || '',
        cualPartido: document.getElementById('cualPartido')?.value || '',
        recibirInfo: document.getElementById('recibirInfo')?.value || '',
        celular: document.getElementById('celularEncuesta')?.value || '',
        whatsapp: document.getElementById('wtsEncuesta')?.value || '',
        nombre: document.getElementById('nombreEncuesta')?.value || '',
        apellido: document.getElementById('apellidoEncuesta')?.value || '',
        observaciones: document.getElementById('observacionesEncuesta')?.value || '',
        responsable: document.getElementById('responsableEncuesta')?.value || '',
        fecha: document.getElementById('fechaEncuesta')?.value || '',
        distrito: document.getElementById('distritoEncuesta')?.value || '',
        seccion: document.getElementById('seccionEncuesta')?.value || '',
        manzana: document.getElementById('manzanaEncuesta')?.value || '',
        colonia: document.getElementById('coloniaEncuesta')?.value || '',
        calle: document.getElementById('calleEncuesta')?.value || '',
        numero: document.getElementById('numeroEncuesta')?.value || ''
    };

    const esEdicion = idEdicionColectivo !== null;
    const url = esEdicion ? `${API_URL}/api/colectivo/${idEdicionColectivo}` : `${API_URL}/api/colectivo`;
    const metodo = esEdicion ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(colectivoData)
        });

        if (res.ok) {
            alert(esEdicion ? '¡Registro actualizado con éxito!' : '¡Registro guardado con éxito en el servidor!');
            
            // Resetear estado del formulario
            document.getElementById('colectivoForm').reset();
            idEdicionColectivo = null;
            
            const btnSubmit = document.querySelector('#colectivoForm button[type="submit"]');
            if (btnSubmit) btnSubmit.textContent = 'Guardar Registro Colectivo';

            cargarRegistrosColectivo();
        } else {
            const errorText = await res.text();
            alert(`El servidor devolvió un error (${res.status}): ${errorText}`);
            console.error('Error del servidor:', res.status, errorText);
        }
    } catch (error) {
        alert('Error de conexión: No se pudo conectar con el backend en Render.');
        console.error('Error al enviar registro:', error);
    }
});

async function cargarRegistrosColectivo() {
    const contenedorColectivo = document.getElementById('contenedor-registros-colectivo');
    if (!contenedorColectivo) return;

    try {
        const res = await fetch(`${API_URL}/api/colectivo`);
        if (!res.ok) throw new Error('Error al consultar la API de colectivo');
        const datos = await res.json();

        contenedorColectivo.innerHTML = '';

        if (!datos || datos.length === 0) {
            contenedorColectivo.innerHTML = '<p style="color: #666;">No hay registros del colectivo guardados.</p>';
            return;
        }

        datos.forEach(item => {
            const tieneWhatsapp = (item.whatsapp || '').toLowerCase().trim() === 'sí' || (item.whatsapp || '').toLowerCase().trim() === 'si';
            const linkWa = tieneWhatsapp ? generarEnlaceWhatsApp(item.celular) : null;
            const linkMaps = generarEnlaceMaps(item.calle, item.numero, item.colonia);

            const div = document.createElement('div');
            div.className = 'media-card';
            div.innerHTML = `
                <h3>${item.nombre || ''} ${item.apellido || 'Registro Colectivo'}</h3>
                
                <p>
                    <strong>Teléfono:</strong> ${item.celular || 'N/A'} 
                    ${tieneWhatsapp && linkWa ? `<a href="${linkWa}" target="_blank" style="margin-left:8px; color:#25D366; font-weight:bold; text-decoration:none;">📱 Abrir WhatsApp</a>` : ''}
                </p>
                
                <p>
                    <strong>Ubicación:</strong> Col. ${item.colonia || 'N/A'}, Calle ${item.calle || 'N/A'} #${item.numero || 'S/N'}, Secc. ${item.seccion || 'N/A'}
                    <a href="${linkMaps}" target="_blank" style="margin-left:8px; color:#1a73e8; font-weight:bold; text-decoration:none;">📍 Ver en Google Maps</a>
                </p>
                
                <p><strong>Observaciones:</strong> ${item.observaciones || 'Sin detalles'}</p>
                <p><strong>Responsable:</strong> ${item.responsable || 'N/A'}</p>
                <small style="color: #888;">📅 Fecha: ${item.fecha || 'N/A'}</small>
                
                <div style="margin-top: 12px; text-align: right; display: flex; gap: 8px; justify-content: flex-end;">
                    <button type="button" class="btn-edit" style="background-color: #f39c12; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;" onclick='prepararEdicionColectivo(${JSON.stringify(item).replace(/'/g, "&apos;")})'>✏️ Editar</button>
                    <button type="button" class="btn-delete" onclick="eliminarRegistroColectivo(${item.id})">🗑️ Eliminar</button>
                </div>
            `;
            contenedorColectivo.appendChild(div);
        });
    } catch (error) {
        console.error('Error al cargar los registros del colectivo:', error);
    }
}

// Función para cargar los datos seleccionados al formulario y habilitar modo Edición
function prepararEdicionColectivo(item) {
    idEdicionColectivo = item.id;

    if (document.getElementById('conoceJuncal')) document.getElementById('conoceJuncal').value = item.conoce_juncal || item.conoceJuncal || '';
    if (document.getElementById('actividadCivica')) document.getElementById('actividadCivica').value = item.actividad_civica || item.actividadCivica || '';
    if (document.getElementById('acuerdo4T')) document.getElementById('acuerdo4T').value = item.acuerdo_4t || item.acuerdo4T || '';
    if (document.getElementById('simpatizaPartido')) document.getElementById('simpatizaPartido').value = item.simpatiza_partido || item.simpatizaPartido || '';
    if (document.getElementById('cualPartido')) document.getElementById('cualPartido').value = item.cual_partido || item.cualPartido || '';
    if (document.getElementById('recibirInfo')) document.getElementById('recibirInfo').value = item.recibir_info || item.recibirInfo || '';
    if (document.getElementById('celularEncuesta')) document.getElementById('celularEncuesta').value = item.celular || '';
    if (document.getElementById('wtsEncuesta')) document.getElementById('wtsEncuesta').value = item.whatsapp || '';
    if (document.getElementById('nombreEncuesta')) document.getElementById('nombreEncuesta').value = item.nombre || '';
    if (document.getElementById('apellidoEncuesta')) document.getElementById('apellidoEncuesta').value = item.apellido || '';
    if (document.getElementById('observacionesEncuesta')) document.getElementById('observacionesEncuesta').value = item.observaciones || '';
    if (document.getElementById('responsableEncuesta')) document.getElementById('responsableEncuesta').value = item.responsable || '';
    if (document.getElementById('fechaEncuesta')) document.getElementById('fechaEncuesta').value = item.fecha || '';
    if (document.getElementById('distritoEncuesta')) document.getElementById('distritoEncuesta').value = item.distrito || '';
    if (document.getElementById('seccionEncuesta')) document.getElementById('seccionEncuesta').value = item.seccion || '';
    if (document.getElementById('manzanaEncuesta')) document.getElementById('manzanaEncuesta').value = item.manzana || '';
    if (document.getElementById('coloniaEncuesta')) document.getElementById('coloniaEncuesta').value = item.colonia || '';
    if (document.getElementById('calleEncuesta')) document.getElementById('calleEncuesta').value = item.calle || '';
    if (document.getElementById('numeroEncuesta')) document.getElementById('numeroEncuesta').value = item.numero || '';

    // Cambiar visualmente el texto del botón de guardar
    const btnSubmit = document.querySelector('#colectivoForm button[type="submit"]');
    if (btnSubmit) btnSubmit.textContent = '🔄 Actualizar Registro Colectivo';

    // Desplazar pantalla suavemente hacia el formulario
    document.getElementById('colectivoForm')?.scrollIntoView({ behavior: 'smooth' });
}

async function eliminarRegistroColectivo(id) {
    if (!confirm('¿Deseas eliminar este registro del colectivo?')) return;
    try {
        const res = await fetch(`${API_URL}/api/colectivo/${id}`, { method: 'DELETE' });
        if (res.ok) {
            cargarRegistrosColectivo();
        }
    } catch (error) {
        console.error('Error al eliminar registro:', error);
    }
}

// --- 3. GESTIÓN DE ASISTENCIAS / PROMOCIONES ---
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
            alert('¡Asistencia registrada exitosamente!');
            document.getElementById('asistenciaForm').reset();
            loadAsistencias();
        } else {
            alert('Error al registrar la asistencia en el servidor.');
        }
    } catch (error) {
        alert('Ocurrió un error al procesar el registro de asistencia.');
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

// --- 4. GESTIÓN DE ANFITRIONES ---
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
            alert('¡Anfitrión registrado exitosamente!');
            document.getElementById('hostForm').reset();
            loadHosts();
        } else {
            alert('Error al registrar el anfitrión en el servidor.');
        }
    } catch (error) {
        alert('Ocurrió un error al conectar con el servidor.');
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