require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ActivityType, MessageFlags } = require('discord.js');
const express = require('express');
const session = require('express-session');
const pkg = require('./package.json'); 
const embedBuilderRoute = require('./embedBuilder'); 
const economyManagerRoute = require('./economyManager');
const bankManagerRoute = require('./bankManager');
const { Client: PGClient } = require('pg');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration des sessions (Pour garder la connexion de la banque active)
app.use(session({
    secret: process.env.SECRET_KEY || 'vigi-super-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // Reste connecté 24h
}));

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
    lastPayday: { type: Date, default: null },
    bankCode: { type: String, default: null },
    bankIdentifier: { type: String, default: null },
    bankFrozen: { type: Boolean, default: false },
    cardStyle: { type: String, default: 'dark' },
    transactions: [{
        amount: Number,
        label: String,
        date: { type: Date, default: Date.now }
    }]
});
const Economy = mongoose.model('Economy', EconomySchema);

const ShopItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    icon: { type: String, default: '📦' }
});
const ShopItem = mongoose.model('ShopItem', ShopItemSchema);

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
    statusText: 'Vigi-access',
    paydayDay: 5,
    paydayHour: 18,
    lastPaydayProcessed: null,
    paydayEnabled: true
};

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/', embedBuilderRoute(client));
app.use('/', economyManagerRoute(client, dbNova, Economy, ShopItem));
app.use('/', bankManagerRoute(client, dbNova, Economy, ShopItem));

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
                userEco.transactions.push({ amount: salary, label: 'Salaire automatique' });
                await userEco.save();
            } else {
                await Economy.create({ 
                    userId: String(emp.user_id), 
                    balance: salary, 
                    lastPayday: new Date(),
                    transactions: [{ amount: salary, label: 'Salaire automatique' }]
                });
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

// NOUVELLE API : Récupérer les membres du serveur
app.get('/api/guild/:guildId/members', async (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildId);
    if (!guild) return res.status(404).json({ error: 'Serveur introuvable' });
    
    await guild.members.fetch(); // On force le chargement des membres en cache
    const members = guild.members.cache
        .filter(m => !m.user.bot) // On ignore les bots
        .map(m => ({ id: m.id, name: m.user.username }))
        .sort((a, b) => a.name.localeCompare(b.name));
        
    res.json({ success: true, members });
});

// NOUVELLE API : Récupérer les rôles actuels d'un membre
app.get('/api/guild/:guildId/member/:userId/roles', async (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildId);
    if (!guild) return res.status(404).json({ error: 'Serveur introuvable' });
    try {
        const member = await guild.members.fetch(req.params.userId);
        if (!member) return res.status(404).json({ error: 'Membre introuvable' });
        const roles = member.roles.cache.filter(r => r.id !== guild.id).map(r => r.id);
        res.json({ success: true, roles });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// NOUVELLE API : Mettre à jour les rôles d'un membre
app.post('/api/guild/:guildId/member/:userId/roles', async (req, res) => {
    const { guildId, userId } = req.params;
    const { roles } = req.body; // Tableau des IDs de rôles sélectionnés
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return res.status(404).json({ error: 'Serveur introuvable' });
    
    try {
        const member = await guild.members.fetch(userId);
        if (!member) return res.status(404).json({ error: 'Membre introuvable' });

        const currentRoles = member.roles.cache.filter(r => r.id !== guild.id && !r.managed).map(r => r.id);
        const newRoles = roles.filter(r => r !== guild.id);

        const rolesToAdd = newRoles.filter(r => !currentRoles.includes(r));
        const rolesToRemove = currentRoles.filter(r => !newRoles.includes(r));

        if (rolesToAdd.length > 0) await member.roles.add(rolesToAdd, "Dashboard Vigi-Access");
        if (rolesToRemove.length > 0) await member.roles.remove(rolesToRemove, "Dashboard Vigi-Access");

        res.json({ success: true, message: "Rôles mis à jour avec succès !" });
    } catch (e) {
        res.json({ success: false, message: e.message });
    }
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
    config.paydayEnabled = req.body.paydayEnabled === true || req.body.paydayEnabled === 'true';
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
        <title>Vigi-Access Dashboard</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
            * { box-sizing: border-box; font-family: 'Inter', sans-serif; }
            body { background: radial-gradient(circle at 0% 0%, #1a1c20 0%, #0e0f12 100%); color: #e6e8eb; margin: 0; padding: 50px 20px; display: flex; justify-content: center; min-height: 100vh; }
            ::-webkit-scrollbar { width: 8px; }
            ::-webkit-scrollbar-track { background: #1e1f22; }
            ::-webkit-scrollbar-thumb { background: #5865F2; border-radius: 4px; }
            .wrapper { width: 100%; max-width: 800px; }
            .glass-card { background: rgba(35, 37, 42, 0.6); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 24px; padding: 40px; box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5); margin-bottom: 32px; transition: transform 0.3s ease, box-shadow 0.3s ease; }
            .glass-card:hover { transform: translateY(-3px); box-shadow: 0 20px 45px rgba(0, 0, 0, 0.6); border: 1px solid rgba(88, 101, 242, 0.2); }
            h1 { font-size: 32px; font-weight: 800; margin: 0 0 20px 0; background: linear-gradient(90deg, #ffffff, #b5bac1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 20px; }
            h2 { font-size: 20px; font-weight: 600; margin: 0 0 24px 0; color: #ffffff; display: flex; align-items: center; gap: 10px; text-transform: uppercase; letter-spacing: 1px; }
            .status-badge { display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; background: rgba(45, 199, 112, 0.1); border: 1px solid rgba(45, 199, 112, 0.3); border-radius: 50px; color: #2dc770; font-size: 14px; font-weight: 600; margin-bottom: 30px; width: fit-content; }
            .status-badge.offline { background: rgba(242, 63, 66, 0.1); border-color: rgba(242, 63, 66, 0.3); color: #f23f42; }
            .status-dot { width: 8px; height: 8px; background: #2dc770; border-radius: 50%; box-shadow: 0 0 10px #2dc770; }
            .status-badge.offline .status-dot { background: #f23f42; box-shadow: 0 0 10px #f23f42; }
            .form-group { margin-bottom: 24px; }
            label { display: block; margin-bottom: 10px; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #80848e; letter-spacing: 0.5px; }
            select, input[type="text"], input[type="number"], textarea { width: 100%; background: rgba(14, 15, 18, 0.8); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 14px 16px; color: #e6e8eb; font-size: 15px; outline: none; transition: all 0.2s; }
            select:focus, input:focus, textarea:focus { border-color: #5865F2; box-shadow: 0 0 0 4px rgba(88, 101, 242, 0.1); }
            textarea { resize: vertical; min-height: 120px; font-family: 'Inter', sans-serif; }
            select[multiple] { height: 180px; padding: 12px; }
            .btn { border: none; padding: 16px 24px; border-radius: 12px; font-size: 15px; font-weight: 700; cursor: pointer; width: 100%; transition: all 0.3s; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; justify-content: center; gap: 8px; }
            .btn-primary { background: linear-gradient(135deg, #5865F2, #4752c4); color: white; box-shadow: 0 4px 15px rgba(88, 101, 242, 0.3); }
            .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(88, 101, 242, 0.4); }
            .btn-success { background: linear-gradient(135deg, #2dc770, #26a85f); color: white; box-shadow: 0 4px 15px rgba(45, 199, 112, 0.3); }
            .btn-success:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(45, 199, 112, 0.4); }
            .btn-gold { background: linear-gradient(135deg, #FFD700, #FFB800); color: black; box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3); }
            .btn-gold:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(255, 215, 0, 0.4); }
            .btn-pink { background: linear-gradient(135deg, #EB459E, #d63384); color: white; box-shadow: 0 4px 15px rgba(235, 69, 158, 0.3); }
            .btn-pink:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(235, 69, 158, 0.4); }
            .btn-secondary { background: rgba(255, 255, 255, 0.05); color: #e6e8eb; border: 1px solid rgba(255, 255, 255, 0.1); margin-top: 12px; }
            .btn-secondary:hover { background: rgba(255, 255, 255, 0.1); }
            .alert { padding: 16px; border-radius: 12px; margin-bottom: 20px; font-weight: 600; display: none; align-items: center; gap: 10px; animation: slideIn 0.3s ease; }
            .alert.success { background: rgba(45, 199, 112, 0.1); color: #2dc770; border: 1px solid rgba(45, 199, 112, 0.2); }
            .alert.error { background: rgba(242, 63, 66, 0.1); color: #f23f42; border: 1px solid rgba(242, 63, 66, 0.2); }
            @keyframes slideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
            .row { display: flex; gap: 20px; }
            .row .form-group { flex: 1; }
            .link-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 30px; }
            .link-card { background: rgba(14, 15, 18, 0.8); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 24px; text-decoration: none; color: #e6e8eb; text-align: center; font-weight: 600; transition: all 0.3s; display: flex; flex-direction: column; align-items: center; gap: 10px; }
            .link-card:hover { border-color: #5865F2; transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0,0,0,0.3); }
            .link-icon { font-size: 24px; }
            .toggle-container { display: flex; align-items: center; justify-content: space-between; background: rgba(14, 15, 18, 0.8); padding: 16px 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); margin-top: 20px; margin-bottom: 20px; }
            .toggle-label { font-size: 14px; font-weight: 600; color: #e6e8eb; }
            .switch { position: relative; display: inline-block; width: 50px; height: 24px; flex-shrink: 0; }
            .switch input { opacity: 0; width: 0; height: 0; }
            .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #4e5058; transition: .4s; border-radius: 24px; }
            .slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 4px; bottom: 4px; background-color: white; transition: .4s; border-radius: 50%; }
            input:checked + .slider { background-color: #2dc770; box-shadow: 0 0 10px rgba(45, 199, 112, 0.4); }
            input:checked + .slider:before { transform: translateX(26px); }
            .version-tag { font-size: 12px; background: rgba(255,255,255,0.1); padding: 4px 10px; border-radius: 20px; color: #b5bac1; font-weight: 600; }
        </style>
    </head>
    <body>
        <div class="wrapper">
            <div class="glass-card">
                <h1>🤖 Vigi-Access <span class="version-tag">v${pkg.version}</span></h1>
                <div class="status-badge ${client.user ? '' : 'offline'}">
                    <span class="status-dot"></span>
                    Statut : ${status}
                </div>
                
                <div class="link-grid">
                    <a href="/embed-builder" class="link-card"><span class="link-icon">📝</span>Constructeur</a>
                    <a href="/economy-manager" class="link-card"><span class="link-icon">💰</span>Économie</a>
                    <a href="/bank/login" class="link-card"><span class="link-icon">🏦</span>Banque</a>
                </div>

                <div id="alertMsg" class="alert"></div>

                <form id="configForm">
                    <div class="form-group">
                        <label for="guildId">Serveur</label>
                        <select id="guildId" name="guildId" required><option value="">Chargement...</option></select>
                    </div>
                    <div class="row">
                        <div class="form-group" style="flex: 2;"><label for="channelId">Salon Règlement</label><select id="channelId" name="channelId" required disabled><option value="">-</option></select></div>
                        <div class="form-group" style="flex: 2;"><label for="logChannelId">Salon Logs</label><select id="logChannelId" name="logChannelId" disabled><option value="">-</option></select></div>
                        <div class="form-group" style="flex: 2;"><label for="roleId">Rôle Membre</label><select id="roleId" name="roleId" required disabled><option value="">-</option></select></div>
                    </div>
                    <div class="form-group"><label for="messageContent">Message du Règlement</label><textarea id="messageContent" name="messageContent" rows="5" required>${config.messageContent}</textarea></div>
                    <div class="form-group"><label for="messageId">ID message (Pour éditer)</label><input type="text" id="messageId" name="messageId" value="${config.messageId}"></div>
                    <button type="submit" id="submitBtn" class="btn btn-primary">🚀 Envoyer le Règlement</button>
                    <button type="button" id="editBtn" class="btn btn-secondary">✏️ Modifier le message existant</button>
                </form>
            </div>

            <!-- NOUVELLE SECTION GESTION DES RÔLES -->
            <div class="glass-card">
                <h2>👥 Gestion des Membres</h2>
                <div id="memberAlert" class="alert"></div>
                <form id="memberForm">
                    <div class="row">
                        <div class="form-group">
                            <label for="memberId">Sélectionner un membre</label>
                            <select id="memberId" name="memberId" disabled required><option value="">Sélectionne un serveur d'abord</option></select>
                        </div>
                        <div class="form-group">
                            <label for="memberRoles">Rôles (Maintiens Ctrl pour choisir)</label>
                            <select id="memberRoles" name="memberRoles" multiple disabled required></select>
                        </div>
                    </div>
                    <button type="submit" id="memberBtn" class="btn btn-primary">💾 Sauvegarder les rôles</button>
                </form>
            </div>

            <div class="glass-card">
                <h2>📅 Configuration des Paies</h2>
                <div id="paydayAlert" class="alert"></div>
                <form id="paydayForm">
                    <div class="row">
                        <div class="form-group"><label for="paydayDay">Jour de la paie</label>
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
                        <div class="form-group"><label for="paydayHour">Heure (0-23)</label><input type="number" id="paydayHour" name="paydayHour" min="0" max="23" value="${config.paydayHour}" required></div>
                    </div>
                    <div class="toggle-container">
                        <span class="toggle-label">Activer la distribution automatique</span>
                        <label class="switch"><input type="checkbox" id="paydayEnabled" name="paydayEnabled" ${config.paydayEnabled ? 'checked' : ''}><span class="slider"></span></label>
                    </div>
                    <button type="submit" id="paydayBtn" class="btn btn-gold">💰 Sauvegarder</button>
                </form>
            </div>

            <div class="glass-card">
                <h2>🎭 Rôles à Réaction</h2>
                <div id="rrAlert" class="alert"></div>
                <form id="rrForm">
                    <div class="form-group"><label for="rrChannelId">Salon d'envoi</label><select id="rrChannelId" name="rrChannelId" disabled required><option value="">-</option></select></div>
                    <div class="form-group"><label for="rrTitle">Titre</label><input type="text" id="rrTitle" name="rrTitle" value="Choisis tes rôles" required></div>
                    <div class="form-group"><label for="rrDescription">Description</label><textarea id="rrDescription" name="rrDescription" rows="3">Clique sur les boutons ci-dessous pour obtenir ou retirer le rôle correspondant.</textarea></div>
                    <div class="form-group"><label for="rrRoles">Rôles (Maintiens Ctrl)</label><select id="rrRoles" name="rrRoles" multiple disabled required></select></div>
                    <button type="submit" id="rrBtn" class="btn btn-pink">🎭 Envoyer le menu</button>
                </form>
            </div>

            <div class="glass-card">
                <h2>🎮 Activité du Bot</h2>
                <div id="statusAlert" class="alert"></div>
                <form id="statusForm">
                    <div class="row">
                        <div class="form-group"><label for="statusType">Type</label>
                            <select id="statusType" name="statusType">
                                <option value="Playing" ${config.statusType === 'Playing' ? 'selected' : ''}>Joue à</option>
                                <option value="Watching" ${config.statusType === 'Watching' ? 'selected' : ''}>Regarde</option>
                                <option value="Listening" ${config.statusType === 'Listening' ? 'selected' : ''}>Écoute</option>
                                <option value="Competing" ${config.statusType === 'Competing' ? 'selected' : ''}>Participe à</option>
                            </select>
                        </div>
                        <div class="form-group" style="flex: 2;"><label for="statusText">Texte</label><input type="text" id="statusText" name="statusText" value="${config.statusText}" required></div>
                    </div>
                    <button type="submit" id="statusBtn" class="btn btn-success">✅ Mettre à jour</button>
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

            // NOUVEAU : Éléments Gestion des Membres
            const memberSelect = document.getElementById('memberId');
            const memberRolesSelect = document.getElementById('memberRoles');
            const memberForm = document.getElementById('memberForm');
            const memberBtn = document.getElementById('memberBtn');
            const memberAlert = document.getElementById('memberAlert');

            async function loadGuilds() {
                const res = await fetch('/api/guilds');
                const guilds = await res.json();
                guildSelect.innerHTML = '<option value="">-- Choisir un serveur --</option>' + guilds.map(g => '<option value="' + g.id + '">' + g.name + '</option>').join('');
                if ("${config.guildId}") { guildSelect.value = "${config.guildId}"; guildSelect.dispatchEvent(new Event('change')); }
            }

            guildSelect.addEventListener('change', async (e) => {
                const guildId = e.target.value;
                channelSelect.disabled = true; roleSelect.disabled = true; logChannelSelect.disabled = true; rrChannelSelect.disabled = true; rrRolesSelect.disabled = true;
                memberSelect.disabled = true; memberRolesSelect.disabled = true;
                channelSelect.innerHTML = '<option>Chargement...</option>'; roleSelect.innerHTML = '<option>Chargement...</option>'; logChannelSelect.innerHTML = '<option>Chargement...</option>'; rrChannelSelect.innerHTML = '<option>Chargement...</option>'; rrRolesSelect.innerHTML = '<option>Chargement...</option>';
                memberSelect.innerHTML = '<option>Chargement...</option>'; memberRolesSelect.innerHTML = '';
                
                if (!guildId) return;
                
                // Charger salons et rôles
                const res = await fetch('/api/guild/' + guildId + '/data');
                const data = await res.json();
                
                channelSelect.innerHTML = data.channels.map(c => '<option value="' + c.id + '">#' + c.name + '</option>').join('');
                logChannelSelect.innerHTML = '<option value="">Aucun</option>' + data.channels.map(c => '<option value="' + c.id + '">#' + c.name + '</option>').join('');
                roleSelect.innerHTML = data.roles.map(r => '<option value="' + r.id + '">' + r.name + '</option>').join('');
                rrChannelSelect.innerHTML = data.channels.map(c => '<option value="' + c.id + '">#' + c.name + '</option>').join('');
                rrRolesSelect.innerHTML = data.roles.map(r => '<option value="' + r.id + '">' + r.name + '</option>').join('');
                
                // Charger les membres (NOUVEAU)
                const memRes = await fetch('/api/guild/' + guildId + '/members');
                const memData = await memRes.json();
                if (memData.success) {
                    memberSelect.innerHTML = '<option value="">-- Sélectionner un membre --</option>' + memData.members.map(m => '<option value="' + m.id + '">' + m.name + '</option>').join('');
                    memberRolesSelect.innerHTML = data.roles.map(r => '<option value="' + r.id + '">' + r.name + '</option>').join('');
                    memberSelect.disabled = false;
                    memberRolesSelect.disabled = false;
                }

                channelSelect.disabled = false; roleSelect.disabled = false; logChannelSelect.disabled = false; rrChannelSelect.disabled = false; rrRolesSelect.disabled = false;
                if ("${config.channelId}") channelSelect.value = "${config.channelId}";
                if ("${config.logChannelId}") logChannelSelect.value = "${config.logChannelId}";
                if ("${config.roleId}") roleSelect.value = "${config.roleId}";
            });

            // NOUVEAU : Quand on change de membre, on charge ses rôles actuels
            memberSelect.addEventListener('change', async (e) => {
                const guildId = guildSelect.value;
                const userId = e.target.value;
                if (!userId) return;

                const res = await fetch('/api/guild/' + guildId + '/member/' + userId + '/roles');
                const data = await res.json();
                
                if (data.success) {
                    // On décoche tout
                    Array.from(memberRolesSelect.options).forEach(opt => opt.selected = false);
                    // On coche les rôles du membre
                    data.roles.forEach(roleId => {
                        const opt = memberRolesSelect.querySelector('option[value="' + roleId + '"]');
                        if (opt) opt.selected = true;
                    });
                }
            });

            // NOUVEAU : Sauvegarder les rôles
            memberForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const guildId = guildSelect.value;
                const userId = memberSelect.value;
                if (!guildId || !userId) return;

                memberBtn.disabled = true;
                memberBtn.innerText = 'Sauvegarde...';
                memberAlert.style.display = 'none';

                const selectedRoles = Array.from(memberRolesSelect.selectedOptions).map(opt => opt.value);

                try {
                    const res = await fetch('/api/guild/' + guildId + '/member/' + userId + '/roles', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ roles: selectedRoles })
                    });
                    const result = await res.json();

                    memberAlert.style.display = 'flex';
                    memberAlert.className = 'alert ' + (result.success ? 'success' : 'error');
                    memberAlert.innerText = (result.success ? '✅ ' : '❌ Erreur : ') + (result.message || 'Rôles mis à jour !');
                } catch (err) {
                    memberAlert.style.display = 'flex';
                    memberAlert.className = 'alert error';
                    memberAlert.innerText = '❌ Erreur réseau.';
                }
                memberBtn.disabled = false;
                memberBtn.innerText = '💾 Sauvegarder les rôles';
            });

            form.addEventListener('submit', async (e) => {
                e.preventDefault(); submitBtn.disabled = true; submitBtn.innerText = 'Envoi en cours...'; alertMsg.style.display = 'none';
                const formData = new FormData(form); const data = Object.fromEntries(formData);
                try {
                    const res = await fetch('/setup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
                    const result = await res.json();
                    alertMsg.style.display = 'flex'; alertMsg.className = 'alert ' + (result.success ? 'success' : 'error'); alertMsg.innerText = (result.success ? '✅ ' : '❌ Erreur : ') + result.message;
                    if (result.success && result.messageId) { messageInput.value = result.messageId; }
                } catch (err) { alertMsg.style.display = 'flex'; alertMsg.className = 'alert error'; alertMsg.innerText = '❌ Erreur réseau.'; }
                submitBtn.disabled = false; submitBtn.innerText = '🚀 Envoyer le Règlement';
            });

            editBtn.addEventListener('click', async () => {
                editBtn.disabled = true; editBtn.innerText = 'Édition en cours...'; alertMsg.style.display = 'none';
                const data = { guildId: guildSelect.value, channelId: channelSelect.value, messageId: messageInput.value, messageContent: document.getElementById('messageContent').value };
                try {
                    const res = await fetch('/edit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
                    const result = await res.json();
                    alertMsg.style.display = 'flex'; alertMsg.className = 'alert ' + (result.success ? 'success' : 'error'); alertMsg.innerText = (result.success ? '✅ ' : '❌ Erreur : ') + result.message;
                } catch (err) { alertMsg.style.display = 'flex'; alertMsg.className = 'alert error'; alertMsg.innerText = '❌ Erreur réseau.'; }
                editBtn.disabled = false; editBtn.innerText = '✏️ Modifier le message existant';
            });

            paydayForm.addEventListener('submit', async (e) => {
                e.preventDefault(); paydayBtn.disabled = true; paydayBtn.innerText = 'Sauvegarde...'; paydayAlert.style.display = 'none';
                const data = { paydayDay: document.getElementById('paydayDay').value, paydayHour: document.getElementById('paydayHour').value, paydayEnabled: document.getElementById('paydayEnabled').checked };
                try {
                    const res = await fetch('/api/payday-config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
                    const result = await res.json();
                    paydayAlert.style.display = 'flex'; paydayAlert.className = 'alert ' + (result.success ? 'success' : 'error'); paydayAlert.innerText = (result.success ? '✅ ' : '❌ Erreur : ') + result.message;
                } catch (err) { paydayAlert.style.display = 'flex'; paydayAlert.className = 'alert error'; paydayAlert.innerText = '❌ Erreur réseau.'; }
                paydayBtn.disabled = false; paydayBtn.innerText = '💰 Sauvegarder';
            });

            rrForm.addEventListener('submit', async (e) => {
                e.preventDefault(); rrBtn.disabled = true; rrBtn.innerText = 'Envoi en cours...'; rrAlert.style.display = 'none';
                const selectedRoles = Array.from(rrRolesSelect.selectedOptions).map(opt => opt.value);
                const data = { channelId: rrChannelSelect.value, title: document.getElementById('rrTitle').value, description: document.getElementById('rrDescription').value, roles: selectedRoles };
                try {
                    const res = await fetch('/api/setup-rr', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
                    const result = await res.json();
                    rrAlert.style.display = 'flex'; rrAlert.className = 'alert ' + (result.success ? 'success' : 'error'); rrAlert.innerText = (result.success ? '✅ ' : '❌ Erreur : ') + result.message;
                } catch (err) { rrAlert.style.display = 'flex'; rrAlert.className = 'alert error'; rrAlert.innerText = '❌ Erreur réseau.'; }
                rrBtn.disabled = false; rrBtn.innerText = '🎭 Envoyer le menu';
            });

            statusForm.addEventListener('submit', async (e) => {
                e.preventDefault(); statusBtn.disabled = true; statusBtn.innerText = 'Mise à jour...'; statusAlert.style.display = 'none';
                const formData = new FormData(statusForm); const data = Object.fromEntries(formData);
                try {
                    const res = await fetch('/api/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
                    const result = await res.json();
                    statusAlert.style.display = 'flex'; statusAlert.className = 'alert ' + (result.success ? 'success' : 'error'); statusAlert.innerText = (result.success ? '✅ ' : '❌ ') + result.message;
                } catch (err) { statusAlert.style.display = 'flex'; statusAlert.className = 'alert error'; statusAlert.innerText = '❌ Erreur réseau.'; }
                statusBtn.disabled = false; statusBtn.innerText = '✅ Mettre à jour';
            });

            loadGuilds();
        </script>
    </body>
    </html>`;
    res.send(html);
});

app.post('/setup', async (req, res) => {
    try {
        config.guildId = req.body.guildId; config.channelId = req.body.channelId; config.roleId = req.body.roleId; config.messageContent = req.body.messageContent;
        const channel = await client.channels.fetch(config.channelId);
        if (!channel) return res.json({ success: false, message: 'Salon introuvable.' });
        const embed = new EmbedBuilder().setTitle('📜 Règlement du Serveur').setDescription(config.messageContent).setColor('#5865F2');
        const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('accept_rules').setLabel("✅ J'accepte le règlement").setStyle(ButtonStyle.Success));
        const sentMessage = await channel.send({ embeds: [embed], components: [row] });
        config.messageId = sentMessage.id;
        res.json({ success: true, message: 'Le règlement a été envoyé dans le salon !', messageId: sentMessage.id });
    } catch (error) { console.error(error); res.json({ success: false, message: error.message }); }
});

app.post('/api/setup-rr', async (req, res) => {
    try {
        const { channelId, title, description, roles } = req.body;
        if (!roles || roles.length === 0) return res.json({ success: false, message: 'Sélectionne au moins un rôle.' });
        if (roles.length > 25) return res.json({ success: false, message: 'Maximum 25 rôles par message (limite de Discord).' });
        const channel = await client.channels.fetch(channelId);
        if (!channel) return res.json({ success: false, message: 'Salon introuvable.' });
        const embed = new EmbedBuilder().setTitle(title || "Choisis tes rôles").setDescription(description || "Clique sur les boutons ci-dessous pour obtenir ou retirer le rôle correspondant.").setColor('#EB459E');
        const rows = []; let currentRow = new ActionRowBuilder(); let count = 0;
        for (const roleId of roles) {
            const role = await channel.guild.roles.fetch(roleId);
            if (role) {
                const btn = new ButtonBuilder().setCustomId('rr_' + roleId).setLabel(role.name.length > 70 ? role.name.substring(0, 67) + '...' : role.name).setStyle(ButtonStyle.Primary);
                currentRow.addComponents(btn); count++;
                if (count % 5 === 0) { rows.push(currentRow); currentRow = new ActionRowBuilder(); }
            }
        }
        if (count % 5 !== 0) rows.push(currentRow);
        await channel.send({ embeds: [embed], components: rows });
        res.json({ success: true, message: 'Le menu de rôles a été envoyé !' });
    } catch (error) { console.error(error); res.json({ success: false, message: error.message }); }
});

app.post('/edit', async (req, res) => {
    try {
        const { guildId, channelId, messageId, messageContent } = req.body; config.messageContent = messageContent; config.messageId = messageId;
        const channel = await client.channels.fetch(channelId);
        if (!channel) return res.json({ success: false, message: 'Salon introuvable.' });
        const message = await channel.messages.fetch(messageId);
        if (!message) return res.json({ success: false, message: 'Message introuvable.' });
        const embed = new EmbedBuilder().setTitle('📜 Règlement du Serveur').setDescription(config.messageContent).setColor('#5865F2');
        await message.edit({ embeds: [embed] });
        res.json({ success: true, message: 'Le règlement a été modifié à distance !' });
    } catch (error) { console.error(error); res.json({ success: false, message: error.message }); }
});

app.listen(PORT, () => { console.log(`Serveur web démarré sur le port ${PORT}`); });

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
        client.guilds.cache.forEach(async (guild) => { await client.application.commands.set(commands, guild.id); });
        console.log('Commandes slash enregistrées !');
    } catch (err) { console.error("Impossible d'enregistrer les commandes slash :", err); }

    if (config.logChannelId) {
        try {
            const logChannel = await client.channels.fetch(config.logChannelId);
            if (logChannel) {
                const botLatency = Date.now() - client.readyTimestamp; const apiLatency = Math.round(client.ws.ping);
                const pgStatus = isPgConnected ? '🟢 Connecté' : '🔴 Erreur';
                const mongoStatus = mongoose.connection.readyState === 1 ? '🟢 Connecté' : '🔴 Erreur';
                const commandList = '`/version` • `/ping` • `/solde`';
                const paydayStatus = config.paydayEnabled ? '✅ Active' : '🔴 Suspendue';
                
                const startupEmbed = new EmbedBuilder()
                    .setTitle("🟢 Bot Redémarré avec Succès").setColor('#2dc770')
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
                    .setFooter({ text: "Protection active : OK | Captcha validation systeme OK | Économie active" }).setTimestamp();
                await logChannel.send({ embeds: [startupEmbed] });

                setTimeout(async () => {
                    try {
                        const botLatency30s = Date.now() - client.readyTimestamp; const apiLatency30s = Math.round(client.ws.ping);
                        let pgStatus30s = '🔴 Déconnecté';
                        try { await dbNova.query('SELECT 1'); pgStatus30s = '🟢 Connecté'; } catch (e) { pgStatus30s = '🔴 Erreur'; }
                        const mongoStatus30s = mongoose.connection.readyState === 1 ? '🟢 Connecté' : '🔴 Erreur';
                        const globalStatus = (pgStatus30s.includes('🟢') && mongoStatus30s.includes('🟢')) ? '✅ Stable' : '⚠️ Instable';
                        const healthEmbed = new EmbedBuilder()
                            .setTitle("🩺 Vérification Post-Démarrage (30s)").setColor(pgStatus30s.includes('🟢') && mongoStatus30s.includes('🟢') ? '#2dc770' : '#f23f42')
                            .setDescription("Vérification de la stabilité des connexions 30 secondes après le lancement.")
                            .addFields(
                                { name: '🌐 Latence Bot', value: '`' + botLatency30s + 'ms`', inline: true },
                                { name: "⚡ Latence API", value: '`' + apiLatency30s + 'ms`', inline: true },
                                { name: '🚦 État Global', value: globalStatus, inline: true },
                                { name: '🗄️ BDD Nova (PostgreSQL)', value: pgStatus30s, inline: true },
                                { name: '💰 BDD Vigi (MongoDB)', value: mongoStatus30s, inline: true }
                            ).setTimestamp();
                        await logChannel.send({ embeds: [healthEmbed] });
                    } catch (e) { console.error("Erreur lors du health check :", e); }
                }, 30000);
            }
        } catch (e) { console.error("Impossible d'envoyer le message de log :", e); }
    }
    
    const url = process.env.RENDER_EXTERNAL_URL || 'http://localhost:' + PORT;
    setInterval(() => { fetch(url).then(() => console.log('Ping de maintien en vie envoyé')).catch(err => console.error('Erreur de ping:', err)); }, 4 * 60 * 1000);

    setInterval(async () => {
        if (!config.paydayEnabled) return;
        const now = new Date(); const day = now.getDay(); const hour = now.getHours();
        if (day === config.paydayDay && hour === config.paydayHour) {
            const currentKey = `${day}-${hour}`;
            if (config.lastPaydayProcessed !== currentKey) { await processPayday(); config.lastPaydayProcessed = currentKey; }
        }
    }, 60 * 1000); 
});

client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand() && interaction.commandName === 'version') {
        const versionEmbed = new EmbedBuilder().setColor('#2b2d31').setDescription('**Version ' + pkg.version + '**');
        return interaction.reply({ embeds: [versionEmbed], flags: MessageFlags.Ephemeral });
    }

    if (interaction.isChatInputCommand() && interaction.commandName === 'ping') {
        const botLatency = Date.now() - interaction.createdTimestamp; const apiLatency = Math.round(client.ws.ping);
        const pingEmbed = new EmbedBuilder().setTitle('🏓 Pong !').setColor('#5865F2').addFields(
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
            const soldeEmbed = new EmbedBuilder().setColor('#5865F2').setTitle("🏦 Ton solde Vigi-Coins").setDescription("Tu possèdes actuellement **" + balance + " Vigi-Coins**.").setTimestamp();
            return interaction.reply({ embeds: [soldeEmbed], flags: MessageFlags.Ephemeral });
        } catch (err) { console.error(err); return interaction.reply({ content: "Une erreur est survenue.", flags: MessageFlags.Ephemeral }); }
    }

    if (interaction.isButton() && interaction.customId.startsWith('rr_')) {
        const roleId = interaction.customId.split('_')[1];
        try {
            const role = await interaction.guild.roles.fetch(roleId);
            if (!role) return interaction.reply({ content: "Ce rôle n'existe plus.", flags: MessageFlags.Ephemeral });
            const member = interaction.member;
            if (member.roles.cache.has(role.id)) { await member.roles.remove(role); return interaction.reply({ content: "❌ Le rôle **" + role.name + "** t'a été retiré.", flags: MessageFlags.Ephemeral }); } 
            else { await member.roles.add(role); return interaction.reply({ content: "✅ Le rôle **" + role.name + "** t'a été attribué.", flags: MessageFlags.Ephemeral }); }
        } catch (err) { console.error(err); return interaction.reply({ content: "❌ Je n'ai pas la permission de gérer ce rôle.", flags: MessageFlags.Ephemeral }); }
    }

    if (interaction.isButton() && interaction.customId === 'accept_rules') {
        try {
            const role = await interaction.guild.roles.fetch(config.roleId);
            if (!role) return interaction.reply({ content: "Erreur : Rôle introuvable.", flags: MessageFlags.Ephemeral });
            const member = interaction.member;
            if (member.roles.cache.has(role.id)) return interaction.reply({ content: "Tu as déjà accepté le règlement !", flags: MessageFlags.Ephemeral });

            const greenIndex = Math.floor(Math.random() * 9); const rows = []; let btnIndex = 0;
            for (let r = 0; r < 3; r++) {
                const row = new ActionRowBuilder();
                for (let c = 0; c < 3; c++) {
                    if (btnIndex === greenIndex) { row.addComponents(new ButtonBuilder().setCustomId('captcha_ok').setEmoji('🟩').setStyle(ButtonStyle.Secondary)); } 
                    else { row.addComponents(new ButtonBuilder().setCustomId('captcha_no_' + btnIndex).setEmoji('🟥').setStyle(ButtonStyle.Secondary)); }
                    btnIndex++;
                }
                rows.push(row);
            }
            const captchaEmbed = new EmbedBuilder().setTitle("🤖 Vérification Anti-Bot").setDescription("Pour valider ton accès au serveur, prouve que tu es humain.\n### **Clique sur le carré VERT 🟩**").setColor('#FFA500').setFooter({ text: "Si tu te trompes, tu devras recommencer." });
            return interaction.reply({ embeds: [captchaEmbed], components: rows, flags: MessageFlags.Ephemeral });
        } catch (error) { console.error(error); await interaction.reply({ content: "Une erreur est survenue.", flags: MessageFlags.Ephemeral }); }
    }

    if (interaction.isButton() && interaction.customId.startsWith('captcha_')) {
        const isCorrect = interaction.customId === 'captcha_ok';
        const role = await interaction.guild.roles.fetch(config.roleId);
        if (!role) return interaction.update({ content: "Erreur : Le rôle est introuvable.", components: [] });
        if (isCorrect) {
            try {
                await interaction.member.roles.add(role);
                const successEmbed = new EmbedBuilder().setColor('#2dc770').setDescription("✅ **Vérification réussie !** Tu as prouvé que tu n'es pas un robot. Tu as maintenant accès au serveur. 🎉");
                return interaction.update({ embeds: [successEmbed], components: [] });
            } catch (err) { return interaction.update({ content: "❌ Je n'ai pas la permission de te donner le rôle.", components: [] }); }
        } else {
            const failEmbed = new EmbedBuilder().setColor('#f23f42').setDescription("❌ **Perdu !** Tu as cliqué sur un carré rouge. Clique à nouveau sur le bouton du règlement pour réessayer.");
            return interaction.update({ embeds: [failEmbed], components: [] });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
