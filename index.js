require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ActivityType } = require('discord.js');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration du Bot Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMembers 
    ]
});

// Variables en mémoire
let config = {
    guildId: '',
    channelId: '',
    roleId: '',
    messageContent: 'Veuillez lire le règlement ci-dessous et cliquer sur le bouton pour accepter.',
    statusType: 'Playing', // Par défaut: Joue à
    statusText: 'Veiller sur le serveur' // Par défaut: Veiller sur le serveur
};

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Fonction pour mettre à jour le statut du bot
function updateBotStatus() {
    if (client.user) {
        const typeMap = {
            'Playing': ActivityType.Playing,
            'Watching': ActivityType.Watching,
            'Listening': ActivityType.Listening,
            'Competing': ActivityType.Competing
        };
        const activityType = typeMap[config.statusType] || ActivityType.Playing;
        client.user.setActivity(config.statusText, { type: activityType });
    }
}

// ---------------------------------------------------------
// PARTIE WEB (API + Interface)
// ---------------------------------------------------------

app.get('/api/guilds', (req, res) => {
    const guilds = client.guilds.cache.map(g => ({ id: g.id, name: g.name }));
    res.json(guilds);
});

app.get('/api/guild/:guildId/data', async (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildId);
    if (!guild) return res.status(404).json({ error: 'Serveur introuvable' });

    await guild.channels.fetch();
    await guild.roles.fetch();

    const channels = guild.channels.cache
        .filter(c => c.type === 0)
        .map(c => ({ id: c.id, name: c.name }))
        .sort((a, b) => a.name.localeCompare(b.name));

    const roles = guild.roles.cache
        .filter(r => r.name !== '@everyone' && !r.managed)
        .map(r => ({ id: r.id, name: r.name }))
        .sort((a, b) => b.position - a.position);

    res.json({ channels, roles });
});

// Route pour mettre à jour le statut
app.post('/api/status', (req, res) => {
    config.statusType = req.body.statusType;
    config.statusText = req.body.statusText;
    updateBotStatus();
    res.json({ success: true, message: 'Statut du bot mis à jour !' });
});

// Route principale (Interface Web)
app.get('/', (req, res) => {
    const status = client.user ? '🟢 En ligne' : '🔴 Hors ligne';
    const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dashboard Bot</title>
        <style>
            * { box-sizing: border-box; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
            body { background-color: #313338; color: #dbdee1; margin: 0; padding: 40px 20px; display: flex; justify-content: center; }
            .container { background: #2b2d31; border-radius: 12px; padding: 32px; width: 100%; max-width: 650px; box-shadow: 0 8px 16px rgba(0,0,0,0.3); margin-bottom: 20px; }
            h1 { color: #ffffff; margin-top: 0; font-size: 28px; border-bottom: 1px solid #1e1f22; padding-bottom: 20px; margin-bottom: 24px; display: flex; align-items: center; gap: 10px; }
            h2 { color: #ffffff; font-size: 20px; margin-top: 0; margin-bottom: 20px; }
            .form-group { margin-bottom: 20px; }
            label { display: block; margin-bottom: 8px; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #b5bac1; letter-spacing: 0.5px; }
            select, input[type="text"], textarea { width: 100%; background: #1e1f22; border: 1px solid #111214; border-radius: 8px; padding: 12px; color: #dbdee1; font-size: 16px; outline: none; transition: border-color 0.2s; }
            select:focus, input:focus, textarea:focus { border-color: #5865F2; }
            textarea { resize: vertical; min-height: 100px; }
            button { background: #5865F2; color: white; border: none; padding: 14px 24px; border-radius: 8px; font-size: 16px; font-weight: 700; cursor: pointer; width: 100%; transition: background 0.2s; }
            button:hover { background: #4752c4; }
            button:disabled { background: #4e5058; cursor: not-allowed; }
            .status { display: inline-block; padding: 4px 10px; border-radius: 4px; background: #2dc770; color: #fff; font-size: 14px; font-weight: 600; margin-bottom: 20px; }
            .alert { padding: 12px; border-radius: 8px; margin-top: 20px; font-weight: 600; display: none; }
            .alert.success { background: #1e3a29; color: #2dc770; border: 1px solid #2dc770; }
            .alert.error { background: #3a1e1e; color: #f23f42; border: 1px solid #f23f42; }
            .row { display: flex; gap: 15px; }
            .row .form-group { flex: 1; }
        </style>
    </head>
    <body>
        <div style="width: 100%; max-width: 650px;">
            <div class="container">
                <h1>🤖 Dashboard Bot</h1>
                <div class="status">Statut : ${status}</div>
                
                <div id="alertMsg" class="alert"></div>

                <form id="configForm">
                    <div class="form-group">
                        <label for="guildId">Serveur</label>
                        <select id="guildId" name="guildId" required>
                            <option value="">Chargement des serveurs...</option>
                        </select>
                    </div>

                    <div class="row">
                        <div class="form-group">
                            <label for="channelId">Salon du Règlement</label>
                            <select id="channelId" name="channelId" required disabled>
                                <option value="">-</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="roleId">Rôle à donner</label>
                            <select id="roleId" name="roleId" required disabled>
                                <option value="">-</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="messageContent">Message du Règlement</label>
                        <textarea id="messageContent" name="messageContent" rows="5" required>${config.messageContent}</textarea>
                    </div>

                    <button type="submit" id="submitBtn">🚀 Envoyer le Règlement</button>
                </form>
            </div>

            <div class="container">
                <h2>🎮 Activité du Bot</h2>
                <div id="statusAlert" class="alert"></div>
                <form id="statusForm">
                    <div class="row">
                        <div class="form-group">
                            <label for="statusType">Type</label>
                            <select id="statusType" name="statusType">
                                <option value="Playing" ${config.statusType === 'Playing' ? 'selected' : ''}>Joue à</option>
                                <option value="Watching" ${config.statusType === 'Watching' ? 'selected' : ''}>Regarde</option>
                                <option value="Listening" ${config.statusType === 'Listening' ? 'selected' : ''}>Écoute</option>
                                <option value="Competing" ${config.statusType === 'Competing' ? 'selected' : ''}>Participe à</option>
                            </select>
                        </div>
                        <div class="form-group" style="flex: 2;">
                            <label for="statusText">Texte</label>
                            <input type="text" id="statusText" name="statusText" value="${config.statusText}" required>
                        </div>
                    </div>
                    <button type="submit" id="statusBtn" style="background: #2dc770;">✅ Mettre à jour le statut</button>
                </form>
            </div>
        </div>

        <script>
            const guildSelect = document.getElementById('guildId');
            const channelSelect = document.getElementById('channelId');
            const roleSelect = document.getElementById('roleId');
            const form = document.getElementById('configForm');
            const alertMsg = document.getElementById('alertMsg');
            const submitBtn = document.getElementById('submitBtn');

            const statusForm = document.getElementById('statusForm');
            const statusBtn = document.getElementById('statusBtn');
            const statusAlert = document.getElementById('statusAlert');

            async function loadGuilds() {
                const res = await fetch('/api/guilds');
                const guilds = await res.json();
                guildSelect.innerHTML = '<option value="">-- Choisir un serveur --</option>' + 
                    guilds.map(g => '<option value="' + g.id + '">' + g.name + '</option>').join('');
            }

            guildSelect.addEventListener('change', async (e) => {
                const guildId = e.target.value;
                channelSelect.disabled = true;
                roleSelect.disabled = true;
                channelSelect.innerHTML = '<option>Chargement...</option>';
                roleSelect.innerHTML = '<option>Chargement...</option>';

                if (!guildId) return;

                const res = await fetch('/api/guild/' + guildId + '/data');
                const data = await res.json();

                channelSelect.innerHTML = data.channels.map(c => '<option value="' + c.id + '">#' + c.name + '</option>').join('');
                roleSelect.innerHTML = data.roles.map(r => '<option value="' + r.id + '">' + r.name + '</option>').join('');
                channelSelect.disabled = false;
                roleSelect.disabled = false;
            });

            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                submitBtn.disabled = true;
                submitBtn.innerText = 'Envoi en cours...';
                alertMsg.style.display = 'none';

                const formData = new FormData(form);
                const data = Object.fromEntries(formData);

                try {
                    const res = await fetch('/setup', {
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
                submitBtn.innerText = '🚀 Envoyer le Règlement';
            });

            statusForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                statusBtn.disabled = true;
                statusBtn.innerText = 'Mise à jour...';
                statusAlert.style.display = 'none';

                const formData = new FormData(statusForm);
                const data = Object.fromEntries(formData);

                try {
                    const res = await fetch('/api/status', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                    const result = await res.json();

                    statusAlert.style.display = 'block';
                    statusAlert.className = result.success ? 'alert success' : 'alert error';
                    statusAlert.innerText = (result.success ? '✅ ' : '❌ ') + result.message;
                } catch (err) {
                    statusAlert.style.display = 'block';
                    statusAlert.className = 'alert error';
                    statusAlert.innerText = '❌ Erreur réseau.';
                }

                statusBtn.disabled = false;
                statusBtn.innerText = '✅ Mettre à jour le statut';
            });

            loadGuilds();
        </script>
    </body>
    </html>`;
    res.send(html);
});

app.post('/setup', async (req, res) => {
    try {
        config.guildId = req.body.guildId;
        config.channelId = req.body.channelId;
        config.roleId = req.body.roleId;
        config.messageContent = req.body.messageContent;

        const channel = await client.channels.fetch(config.channelId);
        if (!channel) return res.json({ success: false, message: 'Salon introuvable.' });

        const embed = new EmbedBuilder()
            .setTitle('📜 Règlement du Serveur')
            .setDescription(config.messageContent)
            .setColor(0x5865F2);

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('accept_rules')
                    .setLabel('✅ J\'accepte le règlement')
                    .setStyle(ButtonStyle.Success)
            );

        await channel.send({ embeds: [embed], components: [row] });
        res.json({ success: true, message: 'Le règlement a été envoyé dans le salon !' });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Serveur web démarré sur le port ${PORT}`);
});

// ---------------------------------------------------------
// PARTIE BOT DISCORD
// ---------------------------------------------------------

client.once('ready', () => {
    console.log(`Bot connecté en tant que ${client.user.tag}`);
    updateBotStatus(); // Applique le statut au démarrage
    
    // Système Anti-Sleep pour Render
    const url = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
    setInterval(() => {
        fetch(url)
            .then(() => console.log('Ping de maintien en vie envoyé'))
            .catch(err => console.error('Erreur de ping:', err));
    }, 4 * 60 * 1000);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'accept_rules') {
        try {
            const role = await interaction.guild.roles.fetch(config.roleId);
            if (!role) {
                return interaction.reply({ content: 'Erreur : Le rôle est introuvable. Contactez un admin.', ephemeral: true });
            }

            const member = await interaction.guild.members.fetch(interaction.user.id);
            if (member.roles.cache.has(role.id)) {
                return interaction.reply({ content: 'Tu as déjà accepté le règlement !', ephemeral: true });
            }

            await member.roles.add(role);
            await interaction.reply({ content: 'Merci ! Tu as accepté le règlement et reçu ton rôle. 🎉', ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Une erreur est survenue lors de l\'attribution du rôle.', ephemeral: true });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
