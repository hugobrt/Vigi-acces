const express = require('express');

module.exports = function(client, dbNova, Economy, ShopItem) {
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
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
                * { box-sizing: border-box; font-family: 'Inter', sans-serif; }
                body { background: radial-gradient(circle at 0% 0%, #1a1c20 0%, #0e0f12 100%); color: #e6e8eb; margin: 0; padding: 50px 20px; display: flex; justify-content: center; min-height: 100vh; }
                .glass-card { background: rgba(35, 37, 42, 0.6); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 24px; padding: 40px; box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5); margin-bottom: 32px; max-width: 1000px; width: 100%; }
                h1 { font-size: 32px; font-weight: 800; margin: 0 0 20px 0; background: linear-gradient(90deg, #ffffff, #b5bac1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 20px; }
                h2 { font-size: 20px; font-weight: 600; margin: 0 0 24px 0; color: #ffffff; text-transform: uppercase; letter-spacing: 1px; }
                .back-link { display: inline-block; margin-bottom: 20px; color: #5865F2; text-decoration: none; font-weight: 600; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { padding: 14px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.05); }
                th { color: #80848e; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
                td { font-size: 15px; }
                .user-info { display: flex; align-items: center; gap: 10px; }
                .user-info img { width: 32px; height: 32px; border-radius: 50%; }
                .badge { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
                .badge.trainee { background: rgba(242, 63, 66, 0.1); color: #f23f42; border: 1px solid rgba(242, 63, 66, 0.2); }
                .badge.confirmed { background: rgba(45, 199, 112, 0.1); color: #2dc770; border: 1px solid rgba(45, 199, 112, 0.2); }
                .badge.frozen { background: rgba(88, 101, 242, 0.1); color: #5865F2; border: 1px solid rgba(88, 101, 242, 0.2); }
                .badge.active { background: rgba(45, 199, 112, 0.1); color: #2dc770; border: 1px solid rgba(45, 199, 112, 0.2); }
                .btn { border: none; padding: 10px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; margin-right: 5px; margin-bottom: 5px; color: #fff; }
                .btn-blue { background: linear-gradient(135deg, #5865F2, #4752c4); }
                .btn-red { background: linear-gradient(135deg, #f23f42, #c93538); }
                .btn-gold { background: linear-gradient(135deg, #FFD700, #FFB800); color: black; }
                .btn-green { background: linear-gradient(135deg, #2dc770, #26a85f); }
                .btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
                .alert { padding: 16px; border-radius: 12px; margin-bottom: 20px; font-weight: 600; display: none; }
                .alert.success { background: rgba(45, 199, 112, 0.1); color: #2dc770; border: 1px solid rgba(45, 199, 112, 0.2); }
                .alert.error { background: rgba(242, 63, 66, 0.1); color: #f23f42; border: 1px solid rgba(242, 63, 66, 0.2); }
                .modal-overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 100; justify-content: center; align-items: center; }
                .modal { background: #2b2d31; padding: 40px; border-radius: 20px; max-width: 500px; width: 90%; text-align: center; border: 1px solid rgba(255,255,255,0.1); }
                .modal h3 { margin-top: 0; font-size: 24px; color: #fff; }
                .modal input { width: 100%; padding: 14px; margin: 10px 0 20px 0; background: #1e1f22; border: 1px solid #111214; border-radius: 8px; color: #fff; font-size: 16px; outline: none; }
                .modal-actions { display: flex; gap: 10px; }
                .modal-actions .btn { flex: 1; margin: 0; }
                .tabs { display: flex; gap: 10px; margin-bottom: 30px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 10px; }
                .tab-btn { background: none; border: none; color: #80848e; font-size: 16px; font-weight: 600; cursor: pointer; padding: 10px 20px; border-radius: 8px; transition: all 0.2s; }
                .tab-btn.active { background: rgba(88, 101, 242, 0.1); color: #fff; }
                .tab-content { display: none; }
                .tab-content.active { display: block; }
            </style>
        </head>
        <body>
            <div class="glass-card">
                <a href="/" class="back-link">← Retour au Dashboard</a>
                <h1>💰 Gestion Financière & Boutique</h1>
                
                <div class="tabs">
                    <button class="tab-btn active" onclick="switchTab('empTab', this)">Employés & Solde</button>
                    <button class="tab-btn" onclick="switchTab('bankTab', this)">Comptes Bancaires</button>
                    <button class="tab-btn" onclick="switchTab('shopTab', this)">Boutique</button>
                </div>

                <!-- ONGLET EMPLOYÉS -->
                <div id="empTab" class="tab-content active">
                    <div id="alertMsg" class="alert"></div>
                    <table>
                        <thead>
                            <tr>
                                <th>Employé</th>
                                <th>Statut</th>
                                <th>Solde</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="empBody"><tr><td colspan="4">Chargement...</td></tr></tbody>
                    </table>
                </div>

                <!-- ONGLET BANQUE -->
                <div id="bankTab" class="tab-content">
                    <div id="bankAlert" class="alert"></div>
                    <h2>Créer un nouveau compte</h2>
                    <div style="display: grid; grid-template-columns: 1fr 1fr auto; gap: 15px; margin-bottom: 30px; align-items: end;">
                        <div>
                            <label style="font-size: 12px; color: #80848e; font-weight: 600; text-transform: uppercase;">Employé</label>
                            <select id="bankEmpSelect" style="width: 100%; padding: 12px; background: #1e1f22; border: 1px solid #111214; border-radius: 8px; color: #fff; font-size: 15px;"></select>
                        </div>
                        <div>
                            <label style="font-size: 12px; color: #80848e; font-weight: 600; text-transform: uppercase;">Identifiant Personnalisé</label>
                            <input type="text" id="bankIdentifierInput" placeholder="ex: jean.dupont" style="width: 100%; padding: 12px; background: #1e1f22; border: 1px solid #111214; border-radius: 8px; color: #fff; font-size: 15px;">
                        </div>
                        <button class="btn btn-gold" onclick="openCreateModal()" style="height: 47px;">Créer le compte</button>
                    </div>

                    <h2 style="margin-top: 40px;">Comptes actifs</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Employé</th>
                                <th>Identifiant</th>
                                <th>Code Banque</th>
                                <th>État</th>
                                <th>Gestion</th>
                            </tr>
                        </thead>
                        <tbody id="bankBody"><tr><td colspan="5">Chargement...</td></tr></tbody>
                    </table>
                </div>

                <!-- ONGLET BOUTIQUE -->
                <div id="shopTab" class="tab-content">
                    <div id="shopAlert" class="alert"></div>
                    <h2>Créer un article</h2>
                    <div style="display: grid; grid-template-columns: 1fr 2fr 1fr auto; gap: 15px; margin-bottom: 30px; align-items: end;">
                        <div>
                            <label style="font-size: 12px; color: #80848e; font-weight: 600; text-transform: uppercase;">Icône</label>
                            <input type="text" id="shopIcon" placeholder="🎨" style="width: 100%; padding: 12px; background: #1e1f22; border: 1px solid #111214; border-radius: 8px; color: #fff; font-size: 15px; text-align: center;">
                        </div>
                        <div>
                            <label style="font-size: 12px; color: #80848e; font-weight: 600; text-transform: uppercase;">Nom de l'article</label>
                            <input type="text" id="shopName" placeholder="Rôle Coloré" style="width: 100%; padding: 12px; background: #1e1f22; border: 1px solid #111214; border-radius: 8px; color: #fff; font-size: 15px;">
                        </div>
                        <div>
                            <label style="font-size: 12px; color: #80848e; font-weight: 600; text-transform: uppercase;">Prix (Vigi-Coins)</label>
                            <input type="number" id="shopPrice" placeholder="500" style="width: 100%; padding: 12px; background: #1e1f22; border: 1px solid #111214; border-radius: 8px; color: #fff; font-size: 15px;">
                        </div>
                        <button class="btn btn-green" onclick="createShopItem()" style="height: 47px;">Ajouter</button>
                    </div>
                    <div>
                        <label style="font-size: 12px; color: #80848e; font-weight: 600; text-transform: uppercase;">Description</label>
                        <input type="text" id="shopDesc" placeholder="Débloquez un rôle de couleur" style="width: 100%; padding: 12px; background: #1e1f22; border: 1px solid #111214; border-radius: 8px; color: #fff; font-size: 15px; margin-top: 5px;">
                    </div>

                    <h2 style="margin-top: 40px;">Articles en vente</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Article</th>
                                <th>Description</th>
                                <th>Prix</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody id="shopBody"><tr><td colspan="4">Chargement...</td></tr></tbody>
                    </table>
                </div>
            </div>

            <!-- MODALE DE CONFIRMATION BANQUE -->
            <div class="modal-overlay" id="createModal">
                <div class="modal">
                    <h3>⚠️ Confirmer la création</h3>
                    <p style="color: #b5bac1; margin-bottom: 20px;">Vous allez créer un compte pour <strong id="modalEmpName" style="color: #fff;"></strong> avec l'identifiant <strong id="modalIdent" style="color: #fff;"></strong>.</p>
                    <p style="font-size: 13px; color: #80848e; margin-bottom: 20px;">Un code aléatoire sera généré et envoyé par Message Privé à l'employé sur Discord.</p>
                    <div class="modal-actions">
                        <button class="btn btn-red" onclick="closeModal()">Annuler</button>
                        <button class="btn btn-green" onclick="confirmCreateBank()">Confirmer & Envoyer</button>
                    </div>
                </div>
            </div>

            <script>
                const empBody = document.getElementById('empBody');
                const bankBody = document.getElementById('bankBody');
                const shopBody = document.getElementById('shopBody');
                const alertMsg = document.getElementById('alertMsg');
                const bankAlert = document.getElementById('bankAlert');
                const shopAlert = document.getElementById('shopAlert');

                function switchTab(tabId, btn) {
                    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
                    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                    document.getElementById(tabId).classList.add('active');
                    btn.classList.add('active');
                }

                async function loadEmployees() {
                    const res = await fetch('/api/economy/employees');
                    const data = await res.json();
                    if (!data.success) return empBody.innerHTML = '<tr><td colspan="4">Erreur</td></tr>';
                    
                    let htmlContent = '';
                    let bankSelectHtml = '';
                    
                    for (const emp of data.employees) {
                        const stageClass = emp.stage === 'confirmed' ? 'confirmed' : 'trainee';
                        const stageText = emp.stage === 'confirmed' ? 'Titulaire' : 'En formation';
                        
                        htmlContent += '<tr>';
                        htmlContent += '<td><div class="user-info">' + (emp.avatar ? '<img src="' + emp.avatar + '">' : '') + '<span>' + emp.username + '</span></div></td>';
                        htmlContent += '<td><span class="badge ' + stageClass + '">' + stageText + '</span></td>';
                        htmlContent += '<td><strong>' + emp.balance + ' 🪙</strong></td>';
                        htmlContent += '<td><button class="btn btn-green" onclick="modifyBalance(\\'' + emp.user_id + '\\', \\'add\\')">➕</button> <button class="btn btn-red" onclick="modifyBalance(\\'' + emp.user_id + '\\', \\'remove\\')">➖</button></td>';
                        htmlContent += '</tr>';

                        bankSelectHtml += '<option value="' + emp.user_id + '">' + emp.username + '</option>';
                    }
                    empBody.innerHTML = htmlContent || '<tr><td colspan="4">Aucun employé.</td></tr>';
                    document.getElementById('bankEmpSelect').innerHTML = bankSelectHtml || '<option>Aucun employé</option>';
                }

                async function loadBankAccounts() {
                    const res = await fetch('/api/bank/accounts');
                    const data = await res.json();
                    if (!data.success) return bankBody.innerHTML = '<tr><td colspan="5">Erreur</td></tr>';
                    
                    if (data.accounts.length === 0) return bankBody.innerHTML = '<tr><td colspan="5">Aucun compte bancaire actif.</td></tr>';
                    
                    let htmlContent = '';
                    for (const acc of data.accounts) {
                        const statusClass = acc.bankFrozen ? 'frozen' : 'active';
                        const statusText = acc.bankFrozen ? '🔴 Gelé' : '🟢 Actif';
                        
                        htmlContent += '<tr>';
                        htmlContent += '<td><div class="user-info">' + (acc.avatar ? '<img src="' + acc.avatar + '">' : '') + '<span>' + acc.username + '</span></div></td>';
                        htmlContent += '<td><strong style="color: #5865F2;">' + acc.bankIdentifier + '</strong></td>';
                        htmlContent += '<td style="font-family: monospace; letter-spacing: 2px; color: #FFD700;">' + acc.bankCode + '</td>';
                        htmlContent += '<td><span class="badge ' + statusClass + '">' + statusText + '</span></td>';
                        htmlContent += '<td>';
                        if (acc.bankFrozen) {
                            htmlContent += '<button class="btn btn-green" onclick="toggleFreeze(\\'' + acc.userId + '\\')">Dégeler</button>';
                        } else {
                            htmlContent += '<button class="btn btn-blue" onclick="toggleFreeze(\\'' + acc.userId + '\\')">Geler</button>';
                        }
                        htmlContent += ' <button class="btn btn-red" onclick="deleteBank(\\'' + acc.userId + '\\')">Supprimer</button></td>';
                        htmlContent += '</tr>';
                    }
                    bankBody.innerHTML = htmlContent;
                }

                async function loadShopItems() {
                    const res = await fetch('/api/shop/admin/items');
                    const data = await res.json();
                    if (!data.success) return shopBody.innerHTML = '<tr><td colspan="4">Erreur</td></tr>';
                    
                    if (data.items.length === 0) return shopBody.innerHTML = '<tr><td colspan="4">Aucun article en vente.</td></tr>';
                    
                    let htmlContent = '';
                    for (const item of data.items) {
                        htmlContent += '<tr>';
                        htmlContent += '<td><strong>' + item.icon + ' ' + item.name + '</strong></td>';
                        htmlContent += '<td>' + item.description + '</td>';
                        htmlContent += '<td><strong style="color: #2dc770;">' + item.price + ' 🪙</strong></td>';
                        htmlContent += '<td><button class="btn btn-red" onclick="deleteShopItem(\\'' + item._id + '\\')">Supprimer</button></td>';
                        htmlContent += '</tr>';
                    }
                    shopBody.innerHTML = htmlContent;
                }

                async function modifyBalance(userId, action) {
                    const amountStr = prompt("Montant à " + (action === 'add' ? 'ajouter' : 'retirer') + " ?");
                    if (!amountStr) return;
                    const amount = parseInt(amountStr);
                    if (isNaN(amount) || amount <= 0) return alert('Invalide.');

                    const res = await fetch('/api/economy/manage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, amount: action === 'add' ? amount : -amount }) });
                    const result = await res.json();
                    alertMsg.className = 'alert ' + (result.success ? 'success' : 'error');
                    alertMsg.innerText = (result.success ? '✅ ' : '❌ ') + result.message;
                    alertMsg.style.display = 'block';
                    if (result.success) loadEmployees();
                }

                function openCreateModal() {
                    const select = document.getElementById('bankEmpSelect');
                    const empName = select.options[select.selectedIndex].text;
                    const ident = document.getElementById('bankIdentifierInput').value.trim();
                    
                    if (!ident) return alert("Veuillez entrer un identifiant.");
                    
                    document.getElementById('modalEmpName').innerText = empName;
                    document.getElementById('modalIdent').innerText = ident;
                    document.getElementById('createModal').style.display = 'flex';
                }

                function closeModal() {
                    document.getElementById('createModal').style.display = 'none';
                }

                async function confirmCreateBank() {
                    const userId = document.getElementById('bankEmpSelect').value;
                    const identifier = document.getElementById('bankIdentifierInput').value.trim();
                    
                    const res = await fetch('/api/bank/create', { 
                        method: 'POST', 
                        headers: { 'Content-Type': 'application/json' }, 
                        body: JSON.stringify({ userId, identifier }) 
                    });
                    const result = await res.json();
                    
                    closeModal();
                    bankAlert.className = 'alert ' + (result.success ? 'success' : 'error');
                    bankAlert.innerText = (result.success ? '✅ ' : '❌ ') + result.message;
                    bankAlert.style.display = 'block';
                    
                    if (result.success) {
                        document.getElementById('bankIdentifierInput').value = '';
                        loadBankAccounts();
                    }
                }

                async function toggleFreeze(userId) {
                    const res = await fetch('/api/bank/freeze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId }) });
                    const result = await res.json();
                    bankAlert.className = 'alert ' + (result.success ? 'success' : 'error');
                    bankAlert.innerText = (result.success ? '✅ ' : '❌ ') + result.message;
                    bankAlert.style.display = 'block';
                    if (result.success) loadBankAccounts();
                }

                async function deleteBank(userId) {
                    if (!confirm("Supprimer définitivement l'accès bancaire de cet employé ?")) return;
                    const res = await fetch('/api/bank/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId }) });
                    const result = await res.json();
                    bankAlert.className = 'alert ' + (result.success ? 'success' : 'error');
                    bankAlert.innerText = (result.success ? '✅ ' : '❌ ') + result.message;
                    bankAlert.style.display = 'block';
                    if (result.success) loadBankAccounts();
                }

                async function createShopItem() {
                    const icon = document.getElementById('shopIcon').value.trim() || '📦';
                    const name = document.getElementById('shopName').value.trim();
                    const description = document.getElementById('shopDesc').value.trim();
                    const price = parseInt(document.getElementById('shopPrice').value);

                    if (!name || !description || isNaN(price) || price <= 0) return alert("Veuillez remplir tous les champs correctement.");

                    const res = await fetch('/api/shop/admin/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ icon, name, description, price }) });
                    const result = await res.json();
                    shopAlert.className = 'alert ' + (result.success ? 'success' : 'error');
                    shopAlert.innerText = (result.success ? '✅ ' : '❌ ') + result.message;
                    shopAlert.style.display = 'block';

                    if (result.success) {
                        document.getElementById('shopIcon').value = '';
                        document.getElementById('shopName').value = '';
                        document.getElementById('shopDesc').value = '';
                        document.getElementById('shopPrice').value = '';
                        loadShopItems();
                    }
                }

                async function deleteShopItem(id) {
                    if (!confirm("Supprimer cet article ?")) return;
                    const res = await fetch('/api/shop/admin/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
                    const result = await res.json();
                    shopAlert.className = 'alert ' + (result.success ? 'success' : 'error');
                    shopAlert.innerText = (result.success ? '✅ ' : '❌ ') + result.message;
                    shopAlert.style.display = 'block';
                    if (result.success) loadShopItems();
                }

                loadEmployees();
                loadBankAccounts();
                loadShopItems();
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
            for (const doc of ecoDocs) ecoMap.set(String(doc.userId), doc.balance);

            const guildId = process.env.GUILD_ID;
            const guild = client.guilds.cache.get(guildId);
            if (!guild) return res.json({ success: false, message: "Bot pas sur un serveur." });

            const enriched = [];
            for (const emp of empRes.rows) {
                try {
                    const member = await guild.members.fetch(emp.user_id);
                    enriched.push({ user_id: String(emp.user_id), username: member.user.username, avatar: member.user.displayAvatarURL(), stage: emp.stage, balance: ecoMap.get(String(emp.user_id)) || 0 });
                } catch {
                    enriched.push({ user_id: String(emp.user_id), username: "Introuvable", avatar: null, stage: emp.stage, balance: ecoMap.get(String(emp.user_id)) || 0 });
                }
            }
            res.json({ success: true, employees: enriched });
        } catch (error) { res.json({ success: false, message: error.message }); }
    });

    router.post('/api/economy/manage', async (req, res) => {
        try {
            const { userId, amount } = req.body;
            const finalAmount = parseInt(amount);
            let userEco = await Economy.findOne({ userId: userId });
            const label = finalAmount > 0 ? 'Prime (Admin)' : 'Amende (Admin)';
            
            if (userEco) {
                userEco.balance += finalAmount;
                if (userEco.balance < 0) userEco.balance = 0;
                userEco.transactions.push({ amount: finalAmount, label });
                await userEco.save();
            } else {
                await Economy.create({ userId, balance: finalAmount > 0 ? finalAmount : 0, transactions: [{ amount: finalAmount, label }] });
            }
            res.json({ success: true, message: "Solde mis à jour !" });
        } catch (error) { res.json({ success: false, message: error.message }); }
    });

    // --- APIs BANQUE ---
    router.get('/api/bank/accounts', async (req, res) => {
        try {
            const accounts = await Economy.find({ bankIdentifier: { $ne: null } });
            const guildId = process.env.GUILD_ID;
            const guild = client.guilds.cache.get(guildId);
            const enriched = [];
            for (const acc of accounts) {
                let username = "Inconnu", avatar = null;
                if (guild) {
                    try {
                        const member = await guild.members.fetch(acc.userId);
                        username = member.user.username;
                        avatar = member.user.displayAvatarURL();
                    } catch {}
                }
                enriched.push({ userId: acc.userId, username, avatar, bankIdentifier: acc.bankIdentifier, bankCode: acc.bankCode, bankFrozen: acc.bankFrozen });
            }
            res.json({ success: true, accounts: enriched });
        } catch (error) { res.json({ success: false, message: error.message }); }
    });

    router.post('/api/bank/create', async (req, res) => {
        try {
            const { userId, identifier } = req.body;
            let userEco = await Economy.findOne({ userId: String(userId) });
            
            const existingIdent = await Economy.findOne({ bankIdentifier: identifier });
            if (existingIdent) return res.json({ success: false, message: "Cet identifiant est déjà utilisé." });

            const code = Math.floor(100000 + Math.random() * 900000).toString();
            
            if (userEco) {
                userEco.bankCode = code;
                userEco.bankIdentifier = identifier;
                userEco.bankFrozen = false;
                await userEco.save();
            } else {
                await Economy.create({ userId: String(userId), balance: 0, bankCode: code, bankIdentifier: identifier });
            }

            try {
                const user = await client.users.fetch(userId);
                const bankUrl = process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000';
                await user.send(`🏦 **Vigi-Banque - Compte Créé**\n\nBonjour ! Votre compte bancaire a été ouvert par l'administration.\n\n**Identifiant :** ${identifier}\n**Code d'accès :** ${code}\n\nGardez précieusement ce code. Vous pouvez accéder à votre banque ici : ${bankUrl}/bank/login`);
            } catch (e) { console.log("DM impossible à envoyer."); }

            res.json({ success: true, message: "Compte créé et DM envoyé à l'employé !" });
        } catch (error) { res.json({ success: false, message: error.message }); }
    });

    router.post('/api/bank/freeze', async (req, res) => {
        try {
            const { userId } = req.body;
            let userEco = await Economy.findOne({ userId: String(userId) });
            if (!userEco || !userEco.bankIdentifier) return res.json({ success: false, message: "Compte introuvable." });
            
            userEco.bankFrozen = !userEco.bankFrozen;
            await userEco.save();
            res.json({ success: true, message: userEco.bankFrozen ? "Compte gelé." : "Compte dégelé." });
        } catch (error) { res.json({ success: false, message: error.message }); }
    });

    router.post('/api/bank/delete', async (req, res) => {
        try {
            const { userId } = req.body;
            let userEco = await Economy.findOne({ userId: String(userId) });
            if (!userEco) return res.json({ success: false, message: "Compte introuvable." });
            
            userEco.bankCode = null;
            userEco.bankIdentifier = null;
            userEco.bankFrozen = false;
            await userEco.save();
            res.json({ success: true, message: "Accès bancaire supprimé." });
        } catch (error) { res.json({ success: false, message: error.message }); }
    });

    // --- APIs BOUTIQUE (ADMIN) ---
    router.get('/api/shop/admin/items', async (req, res) => {
        try {
            const items = await ShopItem.find({});
            res.json({ success: true, items });
        } catch (error) { res.json({ success: false, message: error.message }); }
    });

    router.post('/api/shop/admin/create', async (req, res) => {
        try {
            const { name, description, price, icon } = req.body;
            await ShopItem.create({ name, description, price: parseInt(price), icon });
            res.json({ success: true, message: "Article ajouté à la boutique !" });
        } catch (error) { res.json({ success: false, message: error.message }); }
    });

    router.post('/api/shop/admin/delete', async (req, res) => {
        try {
            await ShopItem.findByIdAndDelete(req.body.id);
            res.json({ success: true, message: "Article supprimé." });
        } catch (error) { res.json({ success: false, message: error.message }); }
    });

    return router;
};
