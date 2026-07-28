const express = require('express');
const multer = require('multer');
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const upload = multer({ storage: multer.memoryStorage() });

module.exports = function(client) {
    const router = express.Router();
    router.use(express.json());
    router.use(express.urlencoded({ extended: true }));

    router.get('/embed-builder', (req, res) => {
        const html = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Constructeur de Messages</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
                * { box-sizing: border-box; font-family: 'Inter', sans-serif; }
                body { background: radial-gradient(circle at 0% 0%, #1a1c20 0%, #0e0f12 100%); color: #e6e8eb; margin: 0; padding: 50px 20px; display: flex; justify-content: center; min-height: 100vh; }
                .glass-card { background: rgba(35, 37, 42, 0.6); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 24px; padding: 40px; box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5); margin-bottom: 32px; max-width: 800px; width: 100%; }
                h1 { font-size: 32px; font-weight: 800; margin: 0 0 20px 0; background: linear-gradient(90deg, #ffffff, #b5bac1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 20px; }
                .back-link { display: inline-block; margin-bottom: 20px; color: #5865F2; text-decoration: none; font-weight: 600; }
                .form-group { margin-bottom: 24px; }
                label { display: block; margin-bottom: 10px; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #80848e; letter-spacing: 0.5px; }
                select, input[type="text"], input[type="url"], textarea, input[type="file"] { width: 100%; background: rgba(14, 15, 18, 0.8); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 14px 16px; color: #e6e8eb; font-size: 15px; outline: none; transition: all 0.2s; }
                select:focus, input:focus, textarea:focus { border-color: #5865F2; box-shadow: 0 0 0 4px rgba(88, 101, 242, 0.1); }
                textarea { resize: vertical; min-height: 120px; }
                .btn { border: none; padding: 16px 24px; border-radius: 12px; font-size: 15px; font-weight: 700; cursor: pointer; width: 100%; transition: all 0.3s; text-transform: uppercase; letter-spacing: 0.5px; }
                .btn-primary { background: linear-gradient(135deg, #5865F2, #4752c4); color: white; box-shadow: 0 4px 15px rgba(88, 101, 242, 0.3); }
                .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(88, 101, 242, 0.4); }
                .alert { padding: 16px; border-radius: 12px; margin-bottom: 20px; font-weight: 600; display: none; }
                .alert.success { background: rgba(45, 199, 112, 0.1); color: #2dc770; border: 1px solid rgba(45, 199, 112, 0.2); }
                .alert.error { background: rgba(242, 63, 66, 0.1); color: #f23f42; border: 1px solid rgba(242, 63, 66, 0.2); }
                .row { display: flex; gap: 20px; }
                .row .form-group { flex: 1; }
            </style>
        </head>
        <body>
            <div class="glass-card">
                <a href="/" class="back-link">← Retour au Dashboard</a>
                <h1>📝 Constructeur de Messages</h1>
                <div id="alertMsg" class="alert"></div>
                <form id="embedForm">
                    <div class="form-group">
                        <label for="guildId">Serveur</label>
                        <select id="guildId" required><option value="">Chargement...</option></select>
                    </div>
                    <div class="form-group">
                        <label for="channelId">Salon d'envoi</label>
                        <select id="channelId" required disabled><option value="">Sélectionne un serveur</option></select>
                    </div>
                    <div class="form-group">
                        <label for="title">Titre</label>
                        <input type="text" id="title" placeholder="Titre de l'embed">
                    </div>
                    <div class="form-group">
                        <label for="description">Description (Markdown **gras**, *italique*)</label>
                        <textarea id="description" placeholder="Texte principal de l'annonce"></textarea>
                    </div>
                    <div class="row">
                        <div class="form-group">
                            <label for="color">Couleur</label>
                            <input type="color" id="color" value="#5865F2" style="height: 50px; padding: 5px; border-radius: 12px;">
                        </div>
                        <div class="form-group" style="flex: 2;">
                            <label for="footerText">Pied de page</label>
                            <input type="text" id="footerText" placeholder="Texte en bas de l'embed">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="imageUpload">Image depuis ton PC (Optionnel)</label>
                        <input type="file" id="imageUpload" accept="image/*">
                    </div>
                    <button type="submit" id="submitBtn" class="btn btn-primary">🚀 Envoyer le message Embed</button>
                </form>
            </div>

            <script>
                const guildSelect = document.getElementById('guildId');
                const channelSelect = document.getElementById('channelId');
                const form = document.getElementById('embedForm');
                const alertMsg = document.getElementById('alertMsg');
                const submitBtn = document.getElementById('submitBtn');

                async function loadGuilds() {
                    const res = await fetch('/api/guilds');
                    const guilds = await res.json();
                    guildSelect.innerHTML = '<option value="">-- Choisir un serveur --</option>' + guilds.map(g => '<option value="' + g.id + '">' + g.name + '</option>').join('');
                }

                guildSelect.addEventListener('change', async (e) => {
                    const guildId = e.target.value;
                    channelSelect.disabled = true;
                    channelSelect.innerHTML = '<option>Chargement...</option>';
                    if (!guildId) return;
                    const res = await fetch('/api/guild/' + guildId + '/data');
                    const data = await res.json();
                    channelSelect.innerHTML = data.channels.map(c => '<option value="' + c.id + '">#' + c.name + '</option>').join('');
                    channelSelect.disabled = false;
                });

                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    submitBtn.disabled = true;
                    submitBtn.innerText = 'Envoi en cours...';
                    alertMsg.style.display = 'none';

                    const formData = new FormData();
                    formData.append('channelId', channelSelect.value);
                    formData.append('title', document.getElementById('title').value);
                    formData.append('description', document.getElementById('description').value);
                    formData.append('color', document.getElementById('color').value);
                    formData.append('footerText', document.getElementById('footerText').value);
                    
                    const imageFile = document.getElementById('imageUpload').files[0];
                    if (imageFile) formData.append('imageFile', imageFile);

                    try {
                        const res = await fetch('/api/send-embed', { method: 'POST', body: formData });
                        const result = await res.json();
                        alertMsg.style.display = 'block';
                        alertMsg.className = 'alert ' + (result.success ? 'success' : 'error');
                        alertMsg.innerText = (result.success ? '✅ ' : '❌ Erreur : ') + result.message;
                    } catch (err) {
                        alertMsg.style.display = 'block';
                        alertMsg.className = 'alert error';
                        alertMsg.innerText = '❌ Erreur réseau.';
                    }
                    submitBtn.disabled = false;
                    submitBtn.innerText = "🚀 Envoyer le message Embed";
                });

                loadGuilds();
            </script>
        </body>
        </html>`;
        res.send(html);
    });

    router.post('/api/send-embed', upload.single('imageFile'), async (req, res) => {
        try {
            const { channelId, title, description, color, footerText } = req.body;
            const channel = await client.channels.fetch(channelId);
            if (!channel) return res.json({ success: false, message: 'Salon introuvable.' });

            const embed = new EmbedBuilder();
            if (title) embed.setTitle(title);
            if (description) embed.setDescription(description);
            if (color) embed.setColor(color);
            if (footerText) embed.setFooter({ text: footerText });

            const files = [];
            if (req.file) {
                const safeFileName = req.file.originalname.replace(/\s+/g, '_');
                const attachment = new AttachmentBuilder(req.file.buffer, { name: safeFileName });
                files.push(attachment);
                embed.setImage('attachment://' + safeFileName);
            }

            await channel.send({ embeds: [embed], files });
            res.json({ success: true, message: "Le message embed a été envoyé avec succès !" });
        } catch (error) {
            console.error(error);
            res.json({ success: false, message: error.message });
        }
    });

    return router;
};
