const express = require('express');

module.exports = function(client, dbNova, Economy) {
    const router = express.Router();
    router.use(express.json());
    router.use(express.urlencoded({ extended: true }));

    router.get('/economy-manager', (req, res) => {
        const html = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Gestion de l'Économie</title>
            <style>
                * { box-sizing: border-box; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
                body { background-color: #313338; color: #dbdee1; margin: 0; padding: 40px 20px; display: flex; justify-content: center; }
                .container { background: #2b2d31; border-radius: 12px; padding: 32px; width: 100%; max-width: 900px; box-shadow: 0 8px 16px rgba(0,0,0,0.3); margin-bottom: 20px; }
                h1 { color: #ffffff; margin-top: 0; font-size: 28px; border-bottom: 1px solid #1e1f22; padding-bottom: 20px; margin-bottom: 24px; display: flex; align-items: center; gap: 10px; }
                .back-link { display: inline-block; margin-bottom: 20px; color: #5865F2; text-decoration: none; font-weight: 600; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { padding: 12px; text-align: left; border-bottom: 1px solid #1e1f22; }
                th { color: #b5bac1; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
                td { font-size: 16px; }
                .user-info { display: flex; align-items: center; gap: 10px; }
                .user-info img { width: 32px; height: 32px; border-radius: 50%; }
                .badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
                .badge.trainee { background: #f23f42; color: #fff; }
                .badge.confirmed { background: #2dc770; color: #fff; }
                .actions button { background: #5865F2; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 14px; margin-right: 5px; }
                .actions button.remove { background: #f23f42; }
                .alert { padding: 12px; border-radius: 8px; margin-top: 20px; font-weight: 600; display: none; }
                .alert.success { background: #1e3a29; color: #2dc770; border: 1px solid #2dc770; }
                .alert.error { background: #3a1e1e; color: #f23f42; border: 1px solid #f23f42; }
            </style>
        </head>
        <body>
            <div class="container">
                <a href="/" class="back-link">← Retour au Dashboard</a>
                <h1>💰 Gestion de l'Économie & Employés</h1>
                
                <div id="alertMsg" class="alert"></div>
                <p>Liste des employés actifs (PostgreSQL) et de leurs soldes Vigi-Coins (MongoDB).</p>
                
                <table>
                    <thead>
                        <tr>
                            <th>Employé</th>
                            <th>Statut</th>
                            <th>Solde</th>
                            <th>Actions (Admin)</th>
                        </tr>
                    </thead>
                    <tbody id="empBody">
                        <tr><td colspan="4">Chargement des employés...</td></tr>
                    </tbody>
                </table>
            </div>

            <script>
                const empBody = document.getElementById('empBody');
                const alertMsg = document.getElementById('alertMsg');

                async function loadEmployees() {
                    const res = await fetch('/api/economy/employees');
                    const data = await res.json();
                    
                    if (!data.success) {
                        empBody.innerHTML = '<tr><td colspan="4">Erreur: ' + data.message + '</td></tr>';
                        return;
                    }

                    if (data.employees.length === 0) {
                        empBody.innerHTML = '<tr><td colspan="4">Aucun employé actif trouvé.</td></tr>';
                        return;
                    }

                    empBody.innerHTML = data.employees.map(emp => `
                        <tr>
                            <td>
                                <div class="user-info">
                                    ${emp.avatar ? '<img src="' + emp.avatar + '">' : ''}
                                    <span>${emp.username}</span>
                                </div>
                            </td>
                            <td><span class="badge ${emp.stage === 'confirmed' ? 'confirmed' : 'trainee'}">${emp.stage === 'confirmed' ? 'Titulaire' : 'En formation'}</span></td>
                            <td><strong>${emp.balance} 🪙</strong></td>
                            <td class="actions">
                                <button onclick="modifyBalance('${emp.user_id}', 'add')">➕ Prime</button>
                                <button class="remove" onclick="modifyBalance('${emp.user_id}', 'remove')">➖ Amendes</button>
                            </td>
                        </tr>
                    `).join('');
                }

                async function modifyBalance(userId, action) {
                    const amountStr = prompt("Combien de Vigi-Coins " + (action === 'add' ? 'ajouter à' : 'retirer de') + " cet employé ?");
                    if (!amountStr) return;
                    const amount = parseInt(amountStr);
                    if (isNaN(amount) || amount <= 0) return alert('Montant invalide.');

                    const res = await fetch('/api/economy/manage', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId, amount: action === 'add' ? amount : -amount })
                    });
                    const result = await res.json();

                    alertMsg.style.display = 'block';
                    alertMsg.className = result.success ? 'alert success' : 'alert error';
                    alertMsg.innerText = (result.success ? '✅ ' : '❌ Erreur : ') + result.message;

                    if (result.success) loadEmployees();
                }

                loadEmployees();
            </script>
        </body>
        </html>`;
        res.send(html);
    });

    router.get('/api/economy/employees', async (req, res) => {
        try {
            const empRes = await dbNova.query("SELECT user_id, stage FROM employees WHERE status = 'active'");
            
            const ecoDocs = await Economy.find({});
            const ecoMap = new Map();
            for (const doc of ecoDocs) {
                ecoMap.set(String(doc.userId), doc.balance);
            }

            const guildId = process.env.GUILD_ID;
            const guild = client.guilds.cache.get(guildId);
            if (!guild) return res.json({ success: false, message: "Bot pas sur un serveur." });

            const enriched = [];
            for (const emp of empRes.rows) {
                try {
                    const member = await guild.members.fetch(emp.user_id);
                    enriched.push({
                        user_id: String(emp.user_id),
                        username: member.user.username,
                        avatar: member.user.displayAvatarURL(),
                        stage: emp.stage,
                        balance: ecoMap.get(String(emp.user_id)) || 0
                    });
                } catch {
                    enriched.push({
                        user_id: String(emp.user_id),
                        username: "Utilisateur introuvable",
                        avatar: null,
                        stage: emp.stage,
                        balance: ecoMap.get(String(emp.user_id)) || 0
                    });
                }
            }

            res.json({ success: true, employees: enriched });
        } catch (error) {
            console.error(error);
            res.json({ success: false, message: error.message });
        }
    });

    router.post('/api/economy/manage', async (req, res) => {
        try {
            const { userId, amount } = req.body;
            const finalAmount = parseInt(amount);
            if (isNaN(finalAmount) || finalAmount === 0) return res.json({ success: false, message: "Montant invalide." });

            let userEco = await Economy.findOne({ userId: userId });
            
            if (userEco) {
                userEco.balance += finalAmount;
                if (userEco.balance < 0) userEco.balance = 0;
                await userEco.save();
            } else {
                await Economy.create({ userId: userId, balance: finalAmount > 0 ? finalAmount : 0, lastPayday: null });
            }

            res.json({ success: true, message: "Solde mis à jour avec succès !" });
        } catch (error) {
            console.error(error);
            res.json({ success: false, message: error.message });
        }
    });

    return router;
};
