require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration du Bot Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers // Nécessaire pour ajouter des rôles
    ]
});

// Variables en mémoire (se réinitialisent au redémarrage)
let config = {
    channelId: '',
    roleId: '',
    messageContent: 'Veuillez lire le règlement ci-dessous et cliquer sur le bouton pour accepter.'
};

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ---------------------------------------------------------
// PARTIE WEB (Interface de gestion + Anti-Sleep)
// ---------------------------------------------------------

// Route principale : Interface d'administration
app.get('/', (req, res) => {
    const status = client.user ? '🟢 En ligne' : '🔴 Hors ligne';
    const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dashboard Bot Règlement</title>
        <style>
            body { font-family: Arial, sans-serif; background-color: #f4f7f6; padding: 20px; }
            .container { max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
            h1 { color: #5865F2; }
            .form-group { margin-bottom: 15px; }
            label { display: block; margin-bottom: 5px; font-weight: bold; }
            input[type="text"], textarea { width: 100%; padding: 8px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px; }
            button { background-color: #5865F2; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; font-size: 16px; }
            button:hover { background-color: #4752c4; }
            .status { padding: 10px; background: #e8f5e9; border-left: 5px solid #4caf50; margin-bottom: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Dashboard Bot</h1>
            <div class="status">Statut du Bot : ${status}</div>
            
            <form action="/setup" method="POST">
                <div class="form-group">
                    <label for="channelId">ID du Salon du Règlement</label>
                    <input type="text" id="channelId" name="channelId" value="${config.channelId}" required>
                </div>
                <div class="form-group">
                    <label for="roleId">ID du Rôle à donner</label>
                    <input type="text" id="roleId" name="roleId" value="${config.roleId}" required>
                </div>
                <div class="form-group">
                    <label for="messageContent">Message du Règlement</label>
                    <textarea id="messageContent" name="messageContent" rows="5" required>${config.messageContent}</textarea>
                </div>
                <button type="submit">Envoyer le Règlement</button>
            </form>
        </div>
    </body>
    </html>`;
    res.send(html);
});

// Route pour configurer et envoyer le message de règlement
app.post('/setup', async (req, res) => {
    try {
        config.channelId = req.body.channelId;
        config.roleId = req.body.roleId;
        config.messageContent = req.body.messageContent;

        const channel = await client.channels.fetch(config.channelId);
        if (!channel) return res.send('Erreur : Salon introuvable.');

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
        res.send('Règlement envoyé avec succès ! <a href="/">Retour</a>');
    } catch (error) {
        console.error(error);
        res.send('Une erreur est survenue : ' + error.message);
    }
});

// Démarrage du serveur web
app.listen(PORT, () => {
    console.log(`Serveur web démarré sur le port ${PORT}`);
});

// ---------------------------------------------------------
// PARTIE BOT DISCORD
// ---------------------------------------------------------

client.once('ready', () => {
    console.log(`Bot connecté en tant que ${client.user.tag}`);
    
    // Système Anti-Sleep pour Render (Ping toutes les 4 minutes)
    const url = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
    setInterval(() => {
        fetch(url)
            .then(() => console.log('Ping de maintien en vie envoyé à ' + url))
            .catch(err => console.error('Erreur de ping:', err));
    }, 4 * 60 * 1000); // 4 minutes
});

// Gestion du clic sur le bouton
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
