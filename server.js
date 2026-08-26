const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();

// Configuración de CORS y aumento de límite para Base64 (50mb)
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Probar conexión a la BD al iniciar
pool.connect((err, client, release) => {
    if (err) {
        return console.error('❌ Error conectando a PostgreSQL:', err.stack);
    }
    console.log('✅ Conexión exitosa a PostgreSQL');
    release();
});

// --- RUTAS DE ANFITRIONES ---
app.get('/api/hosts', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM hosts ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/hosts', async (req, res) => {
    const { name, zone, status, email } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO hosts (name, zone, status, email) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, zone, status, email]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/hosts/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM hosts WHERE id = $1', [id]);
        res.json({ message: 'Anfitrión eliminado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- RUTAS MULTIMEDIA (Soporta /api/media y /api/media_reports) ---
app.get(['/api/media', '/api/media_reports'], async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM media_reports ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post(['/api/media', '/api/media_reports'], async (req, res) => {
    const { title, photos, videos, audio, location, date } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO media_reports (title, photos, videos, audio, location, date_str) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [title, photos, videos, audio, location, date]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete(['/api/media/:id', '/api/media_reports/:id'], async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM media_reports WHERE id = $1', [id]);
        res.json({ message: 'Reporte eliminado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- RUTAS ASISTENCIAS / PROMOCIONES ---
app.get('/api/asistencias', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM asistencias ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/asistencias', async (req, res) => {
    const { title, photos, date } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO asistencias (title, photos, date_str) VALUES ($1, $2, $3) RETURNING *',
            [title, photos, date]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/asistencias/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM asistencias WHERE id = $1', [id]);
        res.json({ message: 'Registro de asistencia eliminado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`));