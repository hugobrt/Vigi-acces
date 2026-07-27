const express = require('express');
const { EmbedBuilder } = require('discord.js');

// On exporte une fonction qui prend le client Discord en paramètre
module.exports = function(client) {
    const router = express.Router();
    router.use(express.json());
    router.use(express.urlencoded({ extended: true }));

    // Page principale du constructeur
    router.get('/embed-builder', (req, res) => {
        const html = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Constructeur d'Embeds</title>
            <style>
                * { box-sizing: border-box; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
                body { background-color: #313338; color: #dbdee1; margin: 0; padding: 40px 20px; display: flex; justify-content: center; }
                .container { background: #2b2d31; border-radius: 12px; padding: 32px; width: 100%; max-width: 800px; box-shadow: 0 8px 16px rgba(0,0,0,0.3); margin-bottom: 20px; }
                h1 { color: #ffffff; margin-top: 0; font-size: 28px; border-bottom: 1px solid #1e1f22; padding-bottom: 20px; margin-bottom: 24px; display: flex; align-items: center; gap: 10px; }
                .back-link { display: inline-block; margin-bottom: 20px; color: #5865F2; text-decoration: none; font-weight: 600; }
                .form-group { margin-bottom: 20px; }
                label { display: block; margin-bottom: 8px; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #b5bac1; letter-spacing: 0.5px; }
                select, input[type="text"], input[type="url"], textarea { width: 100%; background: #1e1f22; border: 1px solid #111214; border-radius: 8px; padding: 12px; color: #dbdee1; font-size: 16px; outline: none; transition: border-color 0.2s; }
                select:focus, input:focus, textarea:focus { border-color: #5865F2; }
                textarea { resize: vertical; min-height: 80px; }
                button { background: #5865F2; color: white; border: none; padding: 14px 24px; border-radius: 8px; font-size: 16px; font-weight: 700; cursor: pointer; width: 100%; transition: background 0.2s; }
                button:hover { background: #4752c4; }
                button:disabled { background: #4e5058; cursor: not-allowed; }
                .alert { padding: 12px; border-radius: 8px; margin-top: 20px; font-weight: 600; display: none; }
                .alert.success { background: #1e3a29; color: #2dc770; border: 1px solid #2dc770; }
                .alert.error { background: #3a1e1e; color: #f23f42; border: 1px solid #f23f42; }
                .row { display: flex; gap: 15px; }
                .row .form-group { flex: 1; }
                /* Aperçu style Discord */
                .embed-preview { background: #2b2d31; border-left: 4px solid #5865F2; border-radius: 4px; padding: 16px; margin-top: 20px; display: none; }
                .embed-title { color: #fff; font-weight: 700; font-size: 16px; margin-bottom: 8px; }
                .embed-desc { color: #dbdee1; font-size: 14px; line-height: 1.4; }
                .embed-footer { color: #b5bac1; font-size: 12px; margin-top: 12px; }
                .embed-img { max-width: 100%; border-radius: 4px; margin-top: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <a href="/" class="back-link">← Retour au Dashboard</a>
                <h1>📝 Constructeur d'Embeds</h1>
                
                <div id="alertMsg" class="alert"></div>

                <form id="embedForm">
                    <div class="form-group">
                        <label for="guildId">Serveur</label>
                        <select id="guildId" required>
                            <option value="">Chargement...</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="channelId">Salon d'envoi</label>
                        <select id="channelId" required disabled>
                            <option value="">Sélectionne un serveur</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="title">Titre</label>
                        <input type="text" id="title" placeholder="Titre de l'embed">
                    </div>

                    <div class="form-group">
                        <label for="description">Description (Supporte le markdown **gras**, *italique*)</label>
                        <textarea id="description" placeholder="Texte principal de l'annonce"></textarea>
                    </div>

                    <div class="row">
                        <div class="form-group">
                            <label for="color">Couleur (Barre à gauche)</label>
                            <input type="color" id="color" value="#5865F2" style="height: 45px; padding: 5px;">
                        </div>
                        <div class="form-group" style="flex: 2;">
                            <label for="footerText">Pied de page (Footer)</label>
                            <input type="text" id="footerText" placeholder="Texte en bas de l'embed">
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="imageUrl">URL de l'image principale (Optionnel)</label>
                        <input type="url" id="imageUrl" placeholder="https://exemple.com/image.png">
                    </div>

                    <button type="submit" id="submitBtn">🚀 Envoyer l'Embed</button>
                </form>

                <div class="embed-preview" id="preview">
                    <div class="embed-title" id="p_title"></div>
                    <div class="embed-desc" id="p_desc"></div>
                    <img class="embed-img" id="p_img" src="">
                    <div class="embed-footer" id="p_footer"></div>
                </div>
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
                    guildSelect.innerHTML = '<option value="">-- Choisir un serveur --</option>' + 
                        guilds.map(g => '<option value="' + g.id + '">' + g.name + '</option>').join('');
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

                // Logique d'envoi
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    submitBtn.disabled = true;
                    submitBtn.innerText = 'Envoi en cours...';
                    alertMsg.style.display = 'none';

                    const data = {
                        channelId: channelSelect.value,
                        title: document.getElementById('title').value,
                        description: document.getElementById('description').value,
                        color: document.getElementById('color').value,
                        footerText: document.getElementById('footerText').value,
                        imageUrl: document.getElementById('imageUrl').value
                    };

                    try {
                        const res = await fetch('/api/send-embed', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(data)
                        });
                        const result = await res.json();

                        alertMsg.style.display = 'block';
                        alertMsg.className = result.success ? 'alert success' : 'alert error';
                        alertMsg.innerText = (result.success ? '✅ ' : '❌ Erreur : ') + result.message;
                    } catch (err) {
                        alertMsg.style.display = 'block';
                        alertMsg.className = 'alert error';
                        alertMsg.innerText = '❌ Erreur réseau.';
                    }

                    submitBtn.disabled = false;
                    submitBtn.innerText = '🚀 Envoyer l'Embed';
                });

                loadGuilds();
            </script>
        </body>
        </html>`;
        res.send(html);
    });

    // API pour envoyer l'embed
    router.post('/api/send-embed', async (req, res) => {
        try {
            const { channelId, title, description, color, footerText, imageUrl } = req.body;
            const channel = await client.channels.fetch(channelId);
            if (!channel) return res.json({ success: false, message: 'Salon introuvable.' });

            const embed = new EmbedBuilder();
            
            if (title) embed.setTitle(title);
            if (description) embed.setDescription(description);
            if (color) embed.setColor(color);
            if (footerText) embed.setFooter({ text: footerText });
            if (imageUrl) embed.setImage(imageUrl);

            await channel.send({ embeds: [embed] });
            res.json({ success: true, message: 'L\\'embed a été envoyé avec succès !' });
        } catch (error) {
            console.error(error);
            res.json({ success: false, message: error.message });
        }
    });

    return router;
};
