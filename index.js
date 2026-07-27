require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ActivityType, MessageFlags } = require('discord.js');
const express = require('express');
const pkg = require('./package.json'); 
const embedBuilderRoute = require('./embedBuilder'); 
const economyManagerRoute = require('./economyManager');
const { Client: PGClient } = require('pg');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMembers 
    ]
});

// ---------------------------------------------------------
// CONNEXIONS AUX BASES DE DONNÉES
// ---------------------------------------------------------
let isPgConnected = false;
const dbNova = new PGClient({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("🟢 Connecté à MongoDB (Vigi-Access Économie) !"))
    .catch(err => console.error("🔴 Erreur de connexion MongoDB :", err));

const EconomySchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    balance: { type: Number, default: 0 },
    lastPayday: { type: Date, default: null }
});
const Economy = mongoose.model('Economy', EconomySchema);

dbNova.connect().then(() => {
    isPgConnected = true;
    console.log("🟢 Connecté à la BDD de Nova-Bot (Employés) !");
}).catch(err => console.error("🔴 Erreur BDD Nova :", err));

// Configuration
let config = {
    guildId: process.env.GUILD_ID || '',
    channelId: process.env.CHANNEL_ID || '',
    logChannelId: process.env.LOG_CHANNEL_ID || '',
    roleId: process.env.ROLE_ID || '',
    messageId: '',
    messageContent: "Veuillez lire le règlement ci-dessous et cliquer sur le bouton pour accepter.",
    statusType: 'Playing',            
    statusText: 'Veiller sur le serveur',
    paydayDay: 5,
    paydayHour: 18,
    lastPaydayProcessed: null,
    paydayEnabled: true // NOUVEAU : Interrupteur des paies
};

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/', embedBuilderRoute(client));
app.use('/', economyManagerRoute(client, dbNova, Economy));

function updateBotStatus() {
    if (!client.user) return;
    const typeMap = { 
        'Playing': ActivityType.Playing, 
        'Watching': ActivityType.Watching, 
        'Listening': ActivityType.Listening, 
        'Competing': ActivityType.Competing 
    };
    const activityType = typeMap[config.statusType] || ActivityType.Playing;
    client.user.setActivity(config.statusText, { type: activityType });
}

// ---------------------------------------------------------
// SYSTÈME DE PAIE AUTOMATIQUE
// ---------------------------------------------------------
async function processPayday() {
    try {
        console.log("💸 Lancement de la distribution des paies...");
        const empRes = await dbNova.query("SELECT user_id, stage FROM employees WHERE status = 'active'");
        let paidCount = 0;

        for (const emp of empRes.rows) {
            const salary = emp.stage === 'confirmed' ? 1000 : 500;
            let userEco = await Economy.findOne({ userId: String(emp.user_id) });
            if (userEco) {
                userEco.balance += salary;
                await userEco.save();
            } else {
                await Economy.create({ userId: String(emp.user_id), balance: salary, lastPayday: new Date() });
            }
            paidCount++;
        }
        console.log(`✅ Paies distribuées à ${paidCount} employés.`);
        
        if (config.logChannelId) {
            const logChannel = await client.channels.fetch(config.logChannelId);
            if (logChannel) {
                const paydayEmbed = new EmbedBuilder()
                    .setColor('#FFD700')
                    .setTitle("💸 Distribution des Paies Automatiques")
                    .setDescription(`Les paies ont été distribuées automatiquement à **${paidCount} employés**.`)
                    .setTimestamp();
                await logChannel.send({ embeds: [paydayEmbed] });
            }
        }
    } catch (err) {
        console.error("Erreur lors de la distribution des paies:", err);
    }
}

// ---------------------------------------------------------
// PARTIE WEB (Dashboard principal)
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

    const channels = guild.channels.cache.filter(c => c.type === 0).map(c => ({ id: c.id, name: c.name })).sort((a, b) => a.name.localeCompare(b.name));
    const roles = guild.roles.cache.filter(r => r.name !== '@everyone' && !r.managed).map(r => ({ id: r.id, name: r.name })).sort((a, b) => b.position - a.position);

    res.json({ channels, roles });
});

app.post('/api/status', (req, res) => {
    config.statusType = req.body.statusType;
    config.statusText = req.body.statusText;
    updateBotStatus();
    res.json({ success: true, message: "Statut du bot mis à jour !" });
});

app.post('/api/payday-config', (req, res) => {
    config.paydayDay = parseInt(req.body.paydayDay);
    config.paydayHour = parseInt(req.body.paydayHour);
    config.paydayEnabled = req.body.paydayEnabled === true || req.body.paydayEnabled === 'true'; // NOUVEAU
    res.json({ success: true, message: 'Configuration des paies enregistrée !' });
});

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
            select, input[type="text"], input[type="number"], textarea { width: 100%; background: #1e1f22; border: 1px solid #111214; border-radius: 8px; padding: 12px; color: #dbdee1; font-size: 16px; outline: none; transition: border-color 0.2s; }
            select:focus, input:focus, textarea:focus { border-color: #5865F2; }
            textarea { resize: vertical; min-height: 100px; }
            button { background: #5865F2; color: white; border: none; padding: 14px 24px; border-radius: 8px; font-size: 16px; font-weight: 700; cursor: pointer; width: 100%; transition: background 0.2s; }
            button:hover { background: #4752c4; }
            button:disabled { background: #4e5058; cursor: not-allowed; }
            button.secondary { background: #2b2d31; border: 1px solid #1e1f22; margin-top: 10px; }
            button.secondary:hover { background: #1e1f22; }
            .status { display: inline-block; padding: 4px 10px; border-radius: 4px; background: #2dc770; color: #fff; font-size: 14px; font-weight: 600; margin-bottom: 20px; }
            .version { float: right; font-size: 14px; color: #b5bac1; font-weight: 500; }
            .alert { padding: 12px; border-radius: 8px; margin-top: 20px; font-weight: 600; display: none; }
            .alert.success { background: #1e3a29; color: #2dc770; border: 1px solid #2dc770; }
            .alert.error { background: #3a1e1e; color: #f23f42; border: 1px solid #f23f42; }
            .row { display: flex; gap: 15px; }
            .row .form-group { flex: 1; }
            select[multiple] { height: 120px; }
            .link-btn { display: block; text-align: center; background: #2b2d31; color: #5865F2; padding: 12px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-bottom: 20px; border: 1px solid #1e1f22; }
            /* Style de l'interrupteur */
            .toggle-container { display: flex; align-items: center; gap: 12px; margin-top: 15px; background: #1e1f22; padding: 15px; border-radius: 8px; }
            .toggle-container label { margin: 0; cursor: pointer; }
            .switch { position: relative; display: inline-block; width: 50px; height: 24px; }
            .switch input { opacity: 0; width: 0; height: 0; }
            .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #4e5058; transition: .4s; border-radius: 24px; }
            .slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 4px; bottom: 4px; background-color: white; transition: .4s; border-radius: 50%; }
            input:checked + .slider { background-color: #2dc770; }
            input:checked + .slider:before { transform: translateX(26px); }
        </style>
    </head>
    <body>
        <div style="width: 100%; max-width: 650px;">
            <div class="container">
                <h1>🤖 Dashboard Bot <span class="version">v${pkg.version}</span></h1>
                <div class="status">Statut : ${status}</div>
                
                <a href="/embed-builder" class="link-btn">📝 Ouvrir le Constructeur de Messages</a>
                <a href="/economy-manager" class="link-btn">💰 Gérer l'Économie & Employés</a>

                <div id="alertMsg" class="alert"></div>

                <form id="configForm">
                    <div class="form-group">
                        <label for="guildId">Serveur</label>
                        <select id="guildId" name="guildId" required>
                            <option value="">Chargement des serveurs...</option>
                        </select>
                    </div>

                    <div class="row">
                        <div class="form-group" style="flex: 2;">
                            <label for="channelId">Salon du Règlement</label>
                            <select id="channelId" name="channelId" required disabled><option value="">-</option></select>
                        </div>
                        <div class="form-group" style="flex: 2;">
                            <label for="logChannelId">Salon des Logs</label>
                            <select id="logChannelId" name="logChannelId" disabled><option value="">-</option></select>
                        </div>
                        <div class="form-group" style="flex: 2;">
                            <label for="roleId">Rôle à donner</label>
                            <select id="roleId" name="roleId" required disabled><option value="">-</option></select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="messageContent">Message du Règlement</label>
                        <textarea id="messageContent" name="messageContent" rows="5" required>${config.messageContent}</textarea>
                    </div>

                    <div class="form-group">
                        <label for="messageId">ID du message (Pour l'éditer)</label>
                        <input type="text" id="messageId" name="messageId" value="${config.messageId}" placeholder="Se remplit automatiquement après l'envoi">
                    </div>

                    <button type="submit" id="submitBtn">🚀 Envoyer le Règlement</button>
                    <button type="button" id="editBtn" class="secondary">✏️ Modifier le message existant</button>
                </form>
            </div>

            <!-- Configuration des Paies -->
            <div class="container">
                <h2>📅 Configuration des Paies Automatiques</h2>
                <div id="paydayAlert" class="alert"></div>
                <form id="paydayForm">
                    <div class="row">
                        <div class="form-group">
                            <label for="paydayDay">Jour de la paie</label>
                            <select id="paydayDay" name="paydayDay">
                                <option value="0" ${config.paydayDay === 0 ? 'selected' : ''}>Dimanche</option>
                                <option value="1" ${config.paydayDay === 1 ? 'selected' : ''}>Lundi</option>
                                <option value="2" ${config.paydayDay === 2 ? 'selected' : ''}>Mardi</option>
                                <option value="3" ${config.paydayDay === 3 ? 'selected' : ''}>Mercredi</option>
                                <option value="4" ${config.paydayDay === 4 ? 'selected' : ''}>Jeudi</option>
                                <option value="5" ${config.paydayDay === 5 ? 'selected' : ''}>Vendredi</option>
                                <option value="6" ${config.paydayDay === 6 ? 'selected' : ''}>Samedi</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="paydayHour">Heure de la paie (0-23)</label>
                            <input type="number" id="paydayHour" name="paydayHour" min="0" max="23" value="${config.paydayHour}" required>
                        </div>
                    </div>

                    <!-- NOUVEAU : Interrupteur ON/OFF -->
                    <div class="toggle-container">
                        <label class="switch">
                            <input type="checkbox" id="paydayEnabled" name="paydayEnabled" ${config.paydayEnabled ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                        <label for="paydayEnabled">Activer la distribution automatique des paies</label>
                    </div>

                    <button type="submit" id="paydayBtn" style="background: #FFD700; color: black; margin-top: 20px;">💰 Sauvegarder les paramètres de paie</button>
                </form>
            </div>

            <div class="container">
                <h2>🎭 Générateur de Rôles à Réaction</h2>
                <div id="rrAlert" class="alert"></div>
                <form id="rrForm">
                    <div class="form-group">
                        <label for="rrChannelId">Salon d'envoi</label>
                        <select id="rrChannelId" name="rrChannelId" disabled required><option value="">-</option></select>
                    </div>
                    <div class="form-group">
                        <label for="rrTitle">Titre du message</label>
                        <input type="text" id="rrTitle" name="rrTitle" value="Choisis tes rôles" required>
                    </div>
                    <div class="form-group">
                        <label for="rrDescription">Description</label>
                        <textarea id="rrDescription" name="rrDescription" rows="3">Clique sur les boutons ci-dessous pour obtenir ou retirer le rôle correspondant.</textarea>
                    </div>
                    <div class="form-group">
                        <label for="rrRoles">Rôles à proposer (Maintiens Ctrl pour choisir plusieurs)</label>
                        <select id="rrRoles" name="rrRoles" multiple disabled required></select>
                    </div>
                    <button type="submit" id="rrBtn" style="background: #EB459E;">🎭 Envoyer le menu de rôles</button>
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
            const logChannelSelect = document.getElementById('logChannelId');
            const roleSelect = document.getElementById('roleId');
            const form = document.getElementById('configForm');
            const alertMsg = document.getElementById('alertMsg');
            const submitBtn = document.getElementById('submitBtn');
            const editBtn = document.getElementById('editBtn');
            const messageInput = document.getElementById('messageId');

            const paydayForm = document.getElementById('paydayForm');
            const paydayBtn = document.getElementById('paydayBtn');
            const paydayAlert = document.getElementById('paydayAlert');

            const rrForm = document.getElementById('rrForm');
            const rrChannelSelect = document.getElementById('rrChannelId');
            const rrRolesSelect = document.getElementById('rrRoles');
            const rrBtn = document.getElementById('rrBtn');
            const rrAlert = document.getElementById('rrAlert');

            const statusForm = document.getElementById('statusForm');
            const statusBtn = document.getElementById('statusBtn');
            const statusAlert = document.getElementById('statusAlert');

            async function loadGuilds() {
                const res = await fetch('/api/guilds');
                const guilds = await res.json();
                guildSelect.innerHTML = '<option value="">-- Choisir un serveur --</option>' + 
                    guilds.map(g => '<option value="' + g.id + '">' + g.name + '</option>').join('');
                
                if ("${config.guildId}") {
                    guildSelect.value = "${config.guildId}";
                    guildSelect.dispatchEvent(new Event('change'));
                }
            }

            guildSelect.addEventListener('change', async (e) => {
                const guildId = e.target.value;
                channelSelect.disabled = true;
                roleSelect.disabled = true;
                logChannelSelect.disabled = true;
                rrChannelSelect.disabled = true;
                rrRolesSelect.disabled = true;

                channelSelect.innerHTML = '<option>Chargement...</option>';
                roleSelect.innerHTML = '<option>Chargement...</option>';
                logChannelSelect.innerHTML = '<option>Chargement...</option>';
                rrChannelSelect.innerHTML = '<option>Chargement...</option>';
                rrRolesSelect.innerHTML = '<option>Chargement...</option>';

                if (!guildId) return;

                const res = await fetch('/api/guild/' + guildId + '/data');
                const data = await res.json();

                channelSelect.innerHTML = data.channels.map(c => '<option value="' + c.id + '">#' + c.name + '</option>').join('');
                logChannelSelect.innerHTML = '<option value="">Aucun</option>' + data.channels.map(c => '<option value="' + c.id + '">#' + c.name + '</option>').join('');
                roleSelect.innerHTML = data.roles.map(r => '<option value="' + r.id + '">' + r.name + '</option>').join('');
                
                rrChannelSelect.innerHTML = data.channels.map(c => '<option value="' + c.id + '">#' + c.name + '</option>').join('');
                rrRolesSelect.innerHTML = data.roles.map(r => '<option value="' + r.id + '">' + r.name + '</option>').join('');

                channelSelect.disabled = false;
                roleSelect.disabled = false;
                logChannelSelect.disabled = false;
                rrChannelSelect.disabled = false;
                rrRolesSelect.disabled = false;

                if ("${config.channelId}") channelSelect.value = "${config.channelId}";
                if ("${config.logChannelId}") logChannelSelect.value = "${config.logChannelId}";
                if ("${config.roleId}") roleSelect.value = "${config.roleId}";
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
                    
                    if (result.success && result.messageId) {
                        messageInput.value = result.messageId;
                    }
                } catch (err) {
                    alertMsg.style.display = 'block';
                    alertMsg.className = 'alert error';
                    alertMsg.innerText = '❌ Erreur réseau.';
                }

                submitBtn.disabled = false;
                submitBtn.innerText = '🚀 Envoyer le Règlement';
            });

            editBtn.addEventListener('click', async () => {
                editBtn.disabled = true;
                editBtn.innerText = 'Édition en cours...';
                alertMsg.style.display = 'none';

                const data = {
                    guildId: guildSelect.value,
                    channelId: channelSelect.value,
                    messageId: messageInput.value,
                    messageContent: document.getElementById('messageContent').value
                };

                try {
                    const res = await fetch('/edit', {
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

                editBtn.disabled = false;
                editBtn.innerText = '✏️ Modifier le message existant';
            });

            // Soumission config paie
            paydayForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                paydayBtn.disabled = true;
                paydayBtn.innerText = 'Sauvegarde...';
                paydayAlert.style.display = 'none';

                const data = {
                    paydayDay: document.getElementById('paydayDay').value,
                    paydayHour: document.getElementById('paydayHour').value,
                    paydayEnabled: document.getElementById('paydayEnabled').checked // NOUVEAU
                };

                try {
                    const res = await fetch('/api/payday-config', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                    const result = await res.json();

                    paydayAlert.style.display = 'block';
                    paydayAlert.className = result.success ? 'alert success' : 'alert error';
                    paydayAlert.innerText = (result.success ? '✅ ' : '❌ Erreur : ') + result.message;
                } catch (err) {
                    paydayAlert.style.display = 'block';
                    paydayAlert.className = 'alert error';
                    paydayAlert.innerText = '❌ Erreur réseau.';
                }

                paydayBtn.disabled = false;
                paydayBtn.innerText = '💰 Sauvegarder les paramètres de paie';
            });

            rrForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                rrBtn.disabled = true;
                rrBtn.innerText = 'Envoi en cours...';
                rrAlert.style.display = 'none';

                const selectedRoles = Array.from(rrRolesSelect.selectedOptions).map(opt => opt.value);

                const data = {
                    channelId: rrChannelSelect.value,
                    title: document.getElementById('rrTitle').value,
                    description: document.getElementById('rrDescription').value,
                    roles: selectedRoles
                };

                try {
                    const res = await fetch('/api/setup-rr', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                    const result = await res.json();

                    rrAlert.style.display = 'block';
                    rrAlert.className = result.success ? 'alert success' : 'alert error';
                    rrAlert.innerText = (result.success ? '✅ ' : '❌ Erreur : ') + result.message;
                } catch (err) {
                    rrAlert.style.display = 'block';
                    rrAlert.className = 'alert error';
                    rrAlert.innerText = '❌ Erreur réseau.';
                }

                rrBtn.disabled = false;
                rrBtn.innerText = '🎭 Envoyer le menu de rôles';
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
            .setColor('#5865F2');

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('accept_rules')
                    .setLabel("✅ J'accepte le règlement")
                    .setStyle(ButtonStyle.Success)
            );

        const sentMessage = await channel.send({ embeds: [embed], components: [row] });
        config.messageId = sentMessage.id;
        
        res.json({ success: true, message: 'Le règlement a été envoyé dans le salon !', messageId: sentMessage.id });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
});

app.post('/api/setup-rr', async (req, res) => {
    try {
        const { channelId, title, description, roles } = req.body;
        
        if (!roles || roles.length === 0) return res.json({ success: false, message: 'Sélectionne au moins un rôle.' });
        if (roles.length > 25) return res.json({ success: false, message: 'Maximum 25 rôles par message (limite de Discord).' });

        const channel = await client.channels.fetch(channelId);
        if (!channel) return res.json({ success: false, message: 'Salon introuvable.' });

        const embed = new EmbedBuilder()
            .setTitle(title || "Choisis tes rôles")
            .setDescription(description || "Clique sur les boutons ci-dessous pour obtenir ou retirer le rôle correspondant.")
            .setColor('#EB459E');

        const rows = [];
        let currentRow = new ActionRowBuilder();
        let count = 0;

        for (const roleId of roles) {
            const role = await channel.guild.roles.fetch(roleId);
            if (role) {
                const btn = new ButtonBuilder()
                    .setCustomId('rr_' + roleId)
                    .setLabel(role.name.length > 70 ? role.name.substring(0, 67) + '...' : role.name)
                    .setStyle(ButtonStyle.Primary);
                
                currentRow.addComponents(btn);
                count++;
                if (count % 5 === 0) {
                    rows.push(currentRow);
                    currentRow = new ActionRowBuilder();
                }
            }
        }
        if (count % 5 !== 0) rows.push(currentRow);

        await channel.send({ embeds: [embed], components: rows });
        res.json({ success: true, message: 'Le menu de rôles a été envoyé !' });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
});

app.post('/edit', async (req, res) => {
    try {
        const { guildId, channelId, messageId, messageContent } = req.body;
        config.messageContent = messageContent;
        config.messageId = messageId;

        const channel = await client.channels.fetch(channelId);
        if (!channel) return res.json({ success: false, message: 'Salon introuvable.' });

        const message = await channel.messages.fetch(messageId);
        if (!message) return res.json({ success: false, message: 'Message introuvable.' });

        const embed = new EmbedBuilder()
            .setTitle('📜 Règlement du Serveur')
            .setDescription(config.messageContent)
            .setColor('#5865F2');

        await message.edit({ embeds: [embed] });
        res.json({ success: true, message: 'Le règlement a été modifié à distance !' });
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

client.once('ready', async () => {
    console.log(`Bot connecté en tant que ${client.user.tag}`);
    updateBotStatus();

    try {
        const commands = [ 
            { name: 'version', description: 'Affiche la version du bot' },
            { name: 'ping', description: "Affiche la latence du bot et de l'API" },
            { name: 'solde', description: 'Affiche ton solde de Vigi-Coins' }
        ];
        client.guilds.cache.forEach(async (guild) => {
            await client.application.commands.set(commands, guild.id);
        });
        console.log('Commandes slash enregistrées !');
    } catch (err) {
        console.error("Impossible d'enregistrer les commandes slash :", err);
    }

    if (config.logChannelId) {
        try {
            const logChannel = await client.channels.fetch(config.logChannelId);
            if (logChannel) {
                const botLatency = Date.now() - client.readyTimestamp;
                const apiLatency = Math.round(client.ws.ping);
                
                const pgStatus = isPgConnected ? '🟢 Connecté' : '🔴 Erreur';
                const mongoStatus = mongoose.connection.readyState === 1 ? '🟢 Connecté' : '🔴 Erreur';
                const commandList = '`/version` • `/ping` • `/solde`';
                const paydayStatus = config.paydayEnabled ? '✅ Active' : '🔴 Suspendue';
                
                const startupEmbed = new EmbedBuilder()
                    .setTitle("🟢 Bot Redémarré avec Succès")
                    .setColor('#2dc770')
                    .setDescription("Le bot est de nouveau en ligne et opérationnel !")
                    .addFields(
                        { name: '🏷️ Version', value: '`' + pkg.version + '`', inline: true },
                        { name: '🌐 Latence Bot', value: '`' + botLatency + 'ms`', inline: true },
                        { name: "⚡ Latence API", value: '`' + apiLatency + 'ms`', inline: true },
                        { name: '🗄️ BDD Nova (PostgreSQL)', value: pgStatus, inline: true },
                        { name: '💰 BDD Vigi (MongoDB)', value: mongoStatus, inline: true },
                        { name: '💸 Système de Paie', value: paydayStatus, inline: true },
                        { name: '⚙️ Commandes Synchronisées', value: commandList, inline: false }
                    )
                    .setFooter({ text: "Protection active : OK | Captcha validation systeme OK | Économie active" })
                    .setTimestamp();

                await logChannel.send({ embeds: [startupEmbed] });
            }
        } catch (e) {
            console.error("Impossible d'envoyer le message de log :", e);
        }
    }
    
    const url = process.env.RENDER_EXTERNAL_URL || 'http://localhost:' + PORT;
    setInterval(() => {
        fetch(url)
            .then(() => console.log('Ping de maintien en vie envoyé'))
            .catch(err => console.error('Erreur de ping:', err));
    }, 4 * 60 * 1000);

    // Tâche de fond pour les paies automatiques
    setInterval(async () => {
        if (!config.paydayEnabled) return; // Si c'est coupé, on ne fait rien

        const now = new Date();
        const day = now.getDay(); 
        const hour = now.getHours();

        if (day === config.paydayDay && hour === config.paydayHour) {
            const currentKey = `${day}-${hour}`;
            if (config.lastPaydayProcessed !== currentKey) {
                await processPayday();
                config.lastPaydayProcessed = currentKey;
            }
        }
    }, 60 * 1000); 
});

client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand() && interaction.commandName === 'version') {
        const versionEmbed = new EmbedBuilder()
            .setColor('#2b2d31') 
            .setDescription('**Version ' + pkg.version + '**');
        return interaction.reply({ embeds: [versionEmbed], flags: MessageFlags.Ephemeral });
    }

    if (interaction.isChatInputCommand() && interaction.commandName === 'ping') {
        const botLatency = Date.now() - interaction.createdTimestamp;
        const apiLatency = Math.round(client.ws.ping);
        
        const pingEmbed = new EmbedBuilder()
            .setTitle('🏓 Pong !')
            .setColor('#5865F2')
            .addFields(
                { name: '🌐 Latence du Bot', value: botLatency + 'ms', inline: true },
                { name: "⚡ Latence de l'API", value: apiLatency + 'ms', inline: true }
            );
        return interaction.reply({ embeds: [pingEmbed], flags: MessageFlags.Ephemeral });
    }

    if (interaction.isChatInputCommand() && interaction.commandName === 'solde') {
        const userId = interaction.user.id;
        try {
            const userEco = await Economy.findOne({ userId: userId });
            const balance = userEco ? userEco.balance : 0;
            
            const soldeEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle("🏦 Ton solde Vigi-Coins")
                .setDescription("Tu possèdes actuellement **" + balance + " Vigi-Coins**.")
                .setTimestamp();
            return interaction.reply({ embeds: [soldeEmbed], flags: MessageFlags.Ephemeral });
        } catch (err) {
            console.error(err);
            return interaction.reply({ content: "Une erreur est survenue.", flags: MessageFlags.Ephemeral });
        }
    }

    if (interaction.isButton() && interaction.customId.startsWith('rr_')) {
        const roleId = interaction.customId.split('_')[1];
        try {
            const role = await interaction.guild.roles.fetch(roleId);
            if (!role) return interaction.reply({ content: "Ce rôle n'existe plus.", flags: MessageFlags.Ephemeral });

            const member = interaction.member;
            if (member.roles.cache.has(role.id)) {
                await member.roles.remove(role);
                return interaction.reply({ content: "❌ Le rôle **" + role.name + "** t'a été retiré.", flags: MessageFlags.Ephemeral });
            } else {
                await member.roles.add(role);
                return interaction.reply({ content: "✅ Le rôle **" + role.name + "** t'a été attribué.", flags: MessageFlags.Ephemeral });
            }
        } catch (err) {
            console.error(err);
            return interaction.reply({ content: "❌ Je n'ai pas la permission de gérer ce rôle.", flags: MessageFlags.Ephemeral });
        }
    }

    if (interaction.isButton() && interaction.customId === 'accept_rules') {
        try {
            const role = await interaction.guild.roles.fetch(config.roleId);
            if (!role) return interaction.reply({ content: "Erreur : Rôle introuvable.", flags: MessageFlags.Ephemeral });

            const member = interaction.member;
            if (member.roles.cache.has(role.id)) {
                return interaction.reply({ content: "Tu as déjà accepté le règlement !", flags: MessageFlags.Ephemeral });
            }

            const greenIndex = Math.floor(Math.random() * 9);
            const rows = [];
            let btnIndex = 0;

            for (let r = 0; r < 3; r++) {
                const row = new ActionRowBuilder();
                for (let c = 0; c < 3; c++) {
                    if (btnIndex === greenIndex) {
                        row.addComponents(
                            new ButtonBuilder()
                                .setCustomId('captcha_ok')
                                .setEmoji('🟩')
                                .setStyle(ButtonStyle.Secondary)
                        );
                    } else {
                        row.addComponents(
                            new ButtonBuilder()
                                .setCustomId('captcha_no_' + btnIndex)
                                .setEmoji('🟥')
                                .setStyle(ButtonStyle.Secondary)
                        );
                    }
                    btnIndex++;
                }
                rows.push(row);
            }

            const captchaEmbed = new EmbedBuilder()
                .setTitle("🤖 Vérification Anti-Bot")
                .setDescription("Pour valider ton accès au serveur, prouve que tu es humain.\n### **Clique sur le carré VERT 🟩**")
                .setColor('#FFA500')
                .setFooter({ text: "Si tu te trompes, tu devras recommencer." });

            return interaction.reply({ embeds: [captchaEmbed], components: rows, flags: MessageFlags.Ephemeral });

        } catch (error) {
            console.error(error);
            await interaction.reply({ content: "Une erreur est survenue.", flags: MessageFlags.Ephemeral });
        }
    }

    if (interaction.isButton() && interaction.customId.startsWith('captcha_')) {
        const isCorrect = interaction.customId === 'captcha_ok';
        const role = await interaction.guild.roles.fetch(config.roleId);

        if (!role) return interaction.update({ content: "Erreur : Le rôle est introuvable.", components: [] });

        if (isCorrect) {
            try {
                await interaction.member.roles.add(role);
                const successEmbed = new EmbedBuilder()
                    .setColor('#2dc770')
                    .setDescription("✅ **Vérification réussie !** Tu as prouvé que tu n'es pas un robot. Tu as maintenant accès au serveur. 🎉");
                return interaction.update({ embeds: [successEmbed], components: [] });
            } catch (err) {
                return interaction.update({ content: "❌ Je n'ai pas la permission de te donner le rôle.", components: [] });
            }
        } else {
            const failEmbed = new EmbedBuilder()
                .setColor('#f23f42')
                .setDescription("❌ **Perdu !** Tu as cliqué sur un carré rouge. Clique à nouveau sur le bouton du règlement pour réessayer.");
            return interaction.update({ embeds: [failEmbed], components: [] });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
