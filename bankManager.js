const express = require('express');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const pendingPayments = new Map();
const pendingRefunds = new Map();

module.exports = function(client, dbNova, Economy, ShopItem) {
    const router = express.Router();
    router.use(express.json());
    router.use(express.urlencoded({ extended: true }));

    function requireLogin(req, res, next) {
        if (req.session && req.session.bankUserId) {
            next();
        } else {
            res.redirect('/bank/login');
        }
    }

    // ----------------------------------------------------
    // ROUTE 1 : PAGE DE CONNEXION
    // ----------------------------------------------------
    router.get('/bank/login', (req, res) => {
        if (req.session && req.session.bankUserId) return res.redirect('/bank');

        const html = `
        <!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Vigi-Banque — Connexion</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root{
    --bg:#08090C; --surface:#11141A; --surface2:#181C24;
    --border:#222732; --text:#F4F6F8; --muted:#6B7280;
    --accent:#00E0B0; --accent-dim:rgba(0,224,176,0.1); --danger:#FF5C5C;
  }
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--text);overflow-x:hidden;height:100vh;}
  h1,h2{font-family:'Space Grotesk',sans-serif;letter-spacing:-0.02em;}
  a{color:inherit;text-decoration:none;}
  
  .login-wrap{min-height:100vh;display:grid;grid-template-columns:1fr 1fr;}
  .login-visual{background:linear-gradient(135deg,#0B1F1A,#08090C);display:flex;flex-direction:column;justify-content:space-between;padding:48px;position:relative;overflow:hidden;}
  .login-visual::after{content:'';position:absolute;width:600px;height:600px;background:radial-gradient(circle,rgba(0,224,176,0.08),transparent 70%);top:-100px;right:-100px;}
  .logo{display:flex;align-items:center;gap:10px;font-family:'Space Grotesk';font-weight:700;font-size:20px;color:#fff;}
  .logo svg{width:26px;height:26px;}
  .visual-content{position:relative;z-index:1;}
  .visual-content h2{font-size:32px;line-height:1.3;color:#fff;max-width:400px;margin-bottom:20px;}
  .visual-content p{color:var(--muted);max-width:350px;line-height:1.6;}
  
  .login-form-side{display:flex;align-items:center;justify-content:center;padding:40px;background:var(--bg);}
  .login-box{width:100%;max-width:360px;}
  .login-box h1{font-size:28px;color:#fff;margin-bottom:8px;}
  .login-box .sub{color:var(--muted);margin-bottom:32px;font-size:15px;}
  .input-group{margin-bottom:20px;}
  .input-group label{display:block;font-size:13px;color:var(--muted);margin-bottom:8px;font-weight:500;}
  .text-input{width:100%;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:16px;color:#fff;font-size:16px;outline:none;transition:border .2s;}
  .text-input:focus{border-color:var(--accent);box-shadow:0 0 0 4px var(--accent-dim);}
  .code-input{width:100%;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:18px;color:#fff;font-size:24px;text-align:center;letter-spacing:12px;font-family:'IBM Plex Mono';outline:none;transition:border .2s;}
  .code-input:focus{border-color:var(--accent);box-shadow:0 0 0 4px var(--accent-dim);}
  .btn-primary{width:100%;background:var(--accent);color:#000;font-weight:700;padding:16px;border-radius:12px;font-size:15px;cursor:pointer;border:none;transition:transform .15s,box-shadow .2s;}
  .btn-primary:hover{transform:translateY(-2px);box-shadow:0 10px 25px rgba(0,224,176,0.2);}
  .login-error{color:var(--danger);font-size:13px;margin-top:15px;display:none;padding:12px;background:rgba(255,92,92,0.1);border:1px solid rgba(255,92,92,0.2);border-radius:10px;}

  @media(max-width:900px){
    .login-wrap{grid-template-columns:1fr;}
    .login-visual{display:none;}
  }
</style>
</head>
<body>
  <div class="login-wrap">
    <div class="login-visual">
      <div class="logo">
        <svg viewBox="0 0 24 24" fill="none"><path d="M12 2L4 5V11C4 16.5 7.4 20.7 12 22C16.6 20.7 20 16.5 20 11V5L12 2Z" fill="#00E0B0" fill-opacity="0.15" stroke="#00E0B0" stroke-width="1.5"/><circle cx="12" cy="11" r="3" stroke="#00E0B0" stroke-width="1.5"/></svg>
        Vigi-Banque
      </div>
      <div class="visual-content">
        <h2>L'écosystème financier de votre entreprise.</h2>
        <p>Accédez à votre solde, vos revenus et gérez vos fonds en toute sécurité.</p>
      </div>
      <div style="font-size:12px;color:var(--muted);">© Vigi-Banque — Sécurisé par Vigi-Access</div>
    </div>
    
    <div class="login-form-side">
      <div class="login-box">
        <h1>Connexion</h1>
        <p class="sub">Entrez vos identifiants bancaires.</p>
        
        <form id="loginForm">
          <div class="input-group">
            <label>Identifiant</label>
            <input type="text" id="identInput" class="text-input" placeholder="ex: jean.dupont" required>
          </div>
          <div class="input-group">
            <label>Code d'accès (6 chiffres)</label>
            <input type="text" id="codeInput" class="code-input" maxlength="6" placeholder="------" required>
          </div>
          <div id="loginError" class="login-error"></div>
          <div style="margin-top:24px;">
            <button type="submit" class="btn-primary">Accéder à mon compte</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <script>
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const identifier = document.getElementById('identInput').value;
      const code = document.getElementById('codeInput').value;
      const errorDiv = document.getElementById('loginError');
      
      if (!identifier || code.length !== 6) {
        errorDiv.innerText = 'Veuillez remplir tous les champs correctement.';
        errorDiv.style.display = 'block';
        return;
      }

      errorDiv.style.display = 'none';

      try {
        const res = await fetch('/bank/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, code })
        });
        const data = await res.json();

        if (data.success) {
          window.location.href = '/bank';
        } else {
          errorDiv.innerText = data.message || 'Identifiant ou code invalide.';
          errorDiv.style.display = 'block';
        }
      } catch (err) {
        errorDiv.innerText = 'Erreur réseau.';
        errorDiv.style.display = 'block';
      }
    });
  </script>
</body>
</html>`;
        res.send(html);
    });

    // ----------------------------------------------------
    // ROUTE 2 : API DE CONNEXION (POST)
    // ----------------------------------------------------
    router.post('/bank/login', async (req, res) => {
        try {
            const { identifier, code } = req.body;
            const cleanIdentifier = identifier ? identifier.trim().toLowerCase() : null;
            const userEco = await Economy.findOne({ bankIdentifier: cleanIdentifier, bankCode: code });
            
            if (!userEco) return res.json({ success: false, message: 'Identifiant ou code d\'accès invalide.' });
            if (userEco.bankFrozen) return res.json({ success: false, message: 'Votre compte est gelé. Contactez l\'administration.' });

            req.session.bankUserId = userEco.userId;
            res.json({ success: true });
        } catch (error) {
            console.error(error);
            res.json({ success: false, message: error.message });
        }
    });

    // ----------------------------------------------------
    // ROUTE 3 : API DE DÉCONNEXION
    // ----------------------------------------------------
    router.post('/bank/logout', (req, res) => {
        req.session.destroy();
        res.json({ success: true });
    });

    // ----------------------------------------------------
    // ROUTE 4 : API POUR RÉCUPÉRER LES DONNÉES (Protégée)
    // ----------------------------------------------------
    router.get('/api/bank/data', requireLogin, async (req, res) => {
        try {
            const userId = req.session.bankUserId;
            const userEco = await Economy.findOne({ userId: String(userId) });
            
            if (!userEco) {
                req.session.destroy();
                return res.json({ success: false, message: 'Compte introuvable.' });
            }

            let stage = 'Non employé';
            let username = 'Employé';
            try {
                const empRes = await dbNova.query("SELECT stage FROM employees WHERE user_id = $1 AND status = 'active'", [userId]);
                if (empRes.rows.length > 0) stage = empRes.rows[0].stage;
                
                const guildId = process.env.GUILD_ID;
                const guild = client.guilds.cache.get(guildId);
                if (guild) {
                    try {
                        const member = await guild.members.fetch(userId);
                        username = member.user.username;
                    } catch(e) {}
                }
            } catch (e) { console.error("Erreur BDD Nova bank data:", e); }

            res.json({ 
                success: true, 
                balance: userEco.balance, 
                stage, 
                username,
                frozen: userEco.bankFrozen,
                cardStyle: userEco.cardStyle || 'dark',
                transactions: userEco.transactions.slice().reverse()
            });
        } catch (error) {
            console.error(error);
            res.json({ success: false, message: error.message });
        }
    });

    // ----------------------------------------------------
    // ROUTE 5 : API POUR CHANGER LE STYLE DE CARTE (Protégée)
    // ----------------------------------------------------
    router.post('/api/bank/update-card', requireLogin, async (req, res) => {
        try {
            const { style } = req.body;
            const validStyles = ['dark', 'mint', 'ocean', 'sunset', 'gold'];
            if (!validStyles.includes(style)) return res.json({ success: false, message: "Style invalide." });

            await Economy.updateOne({ userId: String(req.session.bankUserId) }, { cardStyle: style });
            res.json({ success: true, message: "Carte mise à jour !" });
        } catch (error) {
            res.json({ success: false, message: error.message });
        }
    });

    // ----------------------------------------------------
    // ROUTE 6 : API POUR RÉCUPÉRER LES ARTICLES (Protégée)
    // ----------------------------------------------------
    router.get('/api/shop/items', requireLogin, async (req, res) => {
        try {
            const items = await ShopItem.find({});
            res.json({ success: true, items });
        } catch (error) {
            res.json({ success: false, message: error.message });
        }
    });

    // ----------------------------------------------------
    // ROUTE 7 : API POUR DÉMARRER UN ACHAT (Protégée)
    // ----------------------------------------------------
    router.post('/api/shop/purchase', requireLogin, async (req, res) => {
        try {
            const { itemId } = req.body;
            const userId = req.session.bankUserId;
            
            const userEco = await Economy.findOne({ userId: String(userId) });
            if (!userEco) return res.json({ success: false, message: "Compte introuvable." });
            
            const item = await ShopItem.findById(itemId);
            if (!item) return res.json({ success: false, message: "Article introuvable." });
            
            if (userEco.balance < item.price) return res.json({ success: false, message: "Fonds insuffisants." });

            const txId = Math.random().toString(36).substring(2, 10);
            pendingPayments.set(txId, { status: 'pending', userId, itemId });

            try {
                const user = await client.users.fetch(userId);
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder().setCustomId('pay_accept_' + txId).setLabel('✅ Autoriser le paiement').setStyle(ButtonStyle.Success),
                        new ButtonBuilder().setCustomId('pay_decline_' + txId).setLabel('❌ Refuser').setStyle(ButtonStyle.Danger)
                    );
                await user.send({ content: `🔐 **Vigi-Banque - Authentification de paiement**\n\nVous tentez d'acheter **${item.name}** pour **${item.price} 🪙**.\nVeuillez confirmer cette transaction.`, components: [row] });
            } catch (e) {
                return res.json({ success: false, message: "DM impossible à envoyer. Veuillez ouvrir vos messages privés." });
            }

            res.json({ success: true, transactionId: txId });
        } catch (error) {
            res.json({ success: false, message: error.message });
        }
    });

    // ----------------------------------------------------
    // ROUTE 8 : API POUR VÉRIFIER LE STATUT DE L'ACHAT (Protégée)
    // ----------------------------------------------------
    router.get('/api/shop/check-purchase', requireLogin, async (req, res) => {
        const txId = req.query.transactionId;
        const tx = pendingPayments.get(txId);
        
        if (!tx) return res.json({ success: false, status: 'expired' });
        if (tx.status === 'pending') return res.json({ success: true, status: 'pending' });
        
        const result = { status: tx.status };
        if (tx.status === 'approved') {
            result.newBalance = tx.newBalance;
            result.itemName = tx.itemName;
            result.itemPrice = tx.itemPrice;
        } else {
            result.message = tx.message;
        }
        
        pendingPayments.delete(txId); 
        res.json({ success: true, ...result });
    });

    // ----------------------------------------------------
    // ROUTE 9 : API POUR DEMANDER UN REMBOURSEMENT (Protégée)
    // ----------------------------------------------------
    router.post('/api/shop/request-refund', requireLogin, async (req, res) => {
        try {
            const { txId } = req.body; 
            const userId = req.session.bankUserId;
            
            const userEco = await Economy.findOne({ userId: String(userId) });
            if (!userEco) return res.json({ success: false, message: "Compte introuvable." });

            const tx = userEco.transactions.id(txId);
            if (!tx) return res.json({ success: false, message: "Transaction introuvable." });
            if (!tx.label.startsWith('Achat Boutique')) return res.json({ success: false, message: "Seuls les achats boutique peuvent être remboursés." });
            if (tx.label.includes('Remboursé')) return res.json({ success: false, message: "Cet achat a déjà été remboursé." });

            const refundId = Math.random().toString(36).substring(2, 10);
            pendingRefunds.set(refundId, { status: 'pending', userId, txId, amount: Math.abs(tx.amount), label: tx.label });

            const channelId = process.env.REFUND_CHANNEL_ID || process.env.LOG_CHANNEL_ID;
            if (!channelId) return res.json({ success: false, message: "Salon de remboursement non configuré." });

            const channel = client.channels.cache.get(channelId);
            if (!channel) return res.json({ success: false, message: "Salon introuvable." });

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId('refund_accept_' + refundId).setLabel('✅ Approuver le remboursement').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId('refund_decline_' + refundId).setLabel('❌ Refuser').setStyle(ButtonStyle.Danger)
                );
            
            await channel.send({ content: `↩️ **Vigi-Banque - Demande de Remboursement**\n\n**Employé :** <@${userId}>\n**Article :** ${tx.label}\n**Montant à rembourser :** ${Math.abs(tx.amount)} 🪙\n\nVeuillez traiter cette demande :`, components: [row] });

            res.json({ success: true, message: "Demande envoyée" });
        } catch (error) {
            res.json({ success: false, message: error.message });
        }
    });

    // ----------------------------------------------------
    // ROUTE 10 : DASHBOARD (Protégé par requireLogin)
    // ----------------------------------------------------
    router.get('/bank', requireLogin, (req, res) => {
        const html = `
        <!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Vigi-Banque — Dashboard</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root{
    --bg:#08090C; --surface:#11141A; --surface2:#181C24;
    --border:#222732; --text:#F4F6F8; --muted:#6B7280;
    --accent:#00E0B0; --accent-dim:rgba(0,224,176,0.1); --danger:#FF5C5C;
    --radius:20px;
  }
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--text);overflow-x:hidden;}
  h1,h2,h3,h4{font-family:'Space Grotesk',sans-serif;letter-spacing:-0.02em;}
  .mono{font-family:'IBM Plex Mono',monospace;}
  button{font-family:inherit;cursor:pointer;border:none;background:none;color:inherit;}
  ul{list-style:none;}
  
  .dash-wrap{min-height:100vh;background:var(--bg);}
  .sidebar{background:var(--surface);border-right:1px solid var(--border);padding:24px 16px;display:flex;flex-direction:column;position:fixed;width:240px;height:100vh;z-index:10;}
  .logo{display:flex;align-items:center;gap:10px;font-family:'Space Grotesk';font-weight:700;font-size:18px;color:#fff;padding:0 12px;}
  .logo svg{width:24px;height:24px;}
  .side-nav{margin-top:40px;flex:1;}
  .side-nav a{display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:10px;color:var(--muted);font-weight:500;font-size:14px;margin-bottom:4px;transition:all .2s;cursor:pointer;}
  .side-nav a.active{background:var(--surface2);color:#fff;}
  .side-user{border-top:1px solid var(--border);padding-top:16px;display:flex;align-items:center;gap:12px;}
  .avatar{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--accent),#005a4a);display:flex;align-items:center;justify-content:center;color:#000;font-weight:700;font-size:14px;}
  
  .main-content{margin-left:240px;padding:32px 40px;max-width:1200px;}
  .topbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:32px;}
  
  .grid-2{display:grid;grid-template-columns:1.2fr 0.8fr;gap:24px;margin-bottom:24px;}
  .card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:24px;}
  
  .virtual-card{width:100%;max-width:320px;height:180px;border-radius:16px;background:linear-gradient(135deg, #1C1F26, #0d0f12);position:relative;box-shadow:0 20px 40px rgba(0,0,0,0.5);padding:20px;display:flex;flex-direction:column;justify-content:space-between;margin:0 auto;border:1px solid rgba(255,255,255,0.05);transition:background 0.5s ease;}
  
  .frozen-overlay{display:none;position:fixed;inset:0;background:rgba(8,9,12,0.95);z-index:1000;justify-content:center;align-items:center;flex-direction:column;text-align:center;}
  .frozen-icon{font-size:80px;margin-bottom:20px;}
  .frozen-overlay h1{color:var(--danger);font-size:32px;margin-bottom:10px;}
  .frozen-overlay p{color:var(--muted);max-width:400px;line-height:1.6;}

  .pay-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(12px);z-index:2000;justify-content:center;align-items:flex-end;text-align:center;}
  .pay-sheet{background:#1C1C1E;width:100%;max-width:420px;border-radius:24px 24px 0 0;padding:24px 20px 40px;box-shadow:0 -10px 40px rgba(0,0,0,0.5);transform:translateY(100%);transition:transform 0.5s cubic-bezier(0.32, 0.72, 0, 1);}
  .pay-overlay.active .pay-sheet{transform:translateY(0);}
  .sheet-handle{width:40px;height:5px;background:#666;border-radius:3px;margin:0 auto 24px;}
  .sheet-title{color:#fff;font-size:16px;text-transform:uppercase;letter-spacing:1px;margin-bottom:20px;}
  .pay-state{display:none;}
  .pay-state.active{display:block;animation:fadeIn 0.3s ease;}
  @keyframes fadeIn{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}

  .terminal-card{width:280px;height:170px;background:linear-gradient(135deg, #1C1F26, #0d0f12);border:1px solid rgba(255,255,255,0.1);border-radius:16px;margin:0 auto 30px;position:relative;box-shadow:0 20px 40px rgba(0,0,0,0.5);transform:scale(0.9);transition:transform 0.5s ease, background 0.5s ease;}
  .terminal-card.tapping{transform:scale(1) translateY(-5px);}
  .contactless-icon{position:absolute;top:20px;right:20px;color:rgba(255,255,255,0.8);}
  .contactless-pulse{position:absolute;top:18px;right:18px;width:30px;height:30px;border:2px solid var(--accent);border-radius:50%;opacity:0;}
  .terminal-card.tapping .contactless-pulse{animation:pulseRing 1.5s infinite;}
  @keyframes pulseRing{0% {transform:scale(0.8);opacity:0.8;}100%{transform:scale(2.5);opacity:0;}}
  .term-dots{display:flex;gap:8px;justify-content:center;margin-top:10px;}
  .term-dots span{width:8px;height:8px;border-radius:50%;background:#444;}
  .term-dots.active span{animation:dotBlink 1.2s infinite both;}
  .term-dots span:nth-child(2){animation-delay:0.2s;}
  .term-dots span:nth-child(3){animation-delay:0.4s;}
  @keyframes dotBlink{0%, 100% {background:#444;}50% {background:var(--accent);box-shadow:0 0 10px var(--accent);}}

  .loader-ring{width:80px;height:80px;border-radius:50%;border:5px solid rgba(255,255,255,0.1);border-top:5px solid var(--accent);animation:spin 1s linear infinite;margin:0 auto 20px;}
  @keyframes spin{100%{transform:rotate(360deg);}}

  .wifi-signal{position:relative;width:100px;height:100px;margin:0 auto 24px;display:flex;justify-content:center;align-items:flex-end;}
  .wifi-dot{width:36px;height:36px;background:linear-gradient(135deg,var(--accent),#005a4a);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;z-index:2;box-shadow:0 0 15px var(--accent);}
  .wifi-arc{position:absolute;bottom:18px;border:4px solid transparent;border-top-color:rgba(255,255,255,0.8);border-radius:50%;opacity:0;transform-origin:bottom center;}
  .wifi-arc.arc1{width:50px;height:50px;animation:wifiPulse 1.5s infinite ease-out;}
  .wifi-arc.arc2{width:75px;height:75px;animation:wifiPulse 1.5s infinite ease-out 0.4s;}
  .wifi-arc.arc3{width:100px;height:100px;animation:wifiPulse 1.5s infinite ease-out 0.8s;}
  @keyframes wifiPulse{0%{opacity:0;transform:scale(0.7);}50%{opacity:0.9;}100%{opacity:0;transform:scale(1.3);}}

  .scan-area{position:relative;width:150px;height:200px;margin:0 auto 30px;overflow:hidden;border-radius:8px;border:2px solid var(--border);}
  .receipt{width:100%;height:100%;background:#fff;display:flex;flex-direction:column;align-items:center;padding-top:20px;color:#000;}
  .receipt-line{width:70%;height:4px;background:#ddd;margin-bottom:8px;border-radius:2px;}
  .receipt-total{width:50%;height:6px;background:#000;margin-top:10px;border-radius:2px;}
  .scan-laser{position:absolute;left:0;right:0;height:3px;background:var(--accent);box-shadow:0 0 15px var(--accent);animation:scanMove 2s infinite linear;}
  @keyframes scanMove{0%{top:0;}50%{top:calc(100% - 3px);}100%{top:0;}}

  .plane-signal{position:relative;width:100px;height:100px;margin:0 auto 24px;display:flex;justify-content:center;align-items:center;}
  .plane-icon{font-size:40px;animation:fly 1.5s infinite ease-in-out;z-index:2;}
  @keyframes fly{0%{transform:translateY(0) rotate(10deg);opacity:1;}50%{transform:translateY(-20px) rotate(15deg);opacity:0.8;}100%{transform:translateY(0) rotate(10deg);opacity:1;}}

  .res-circle{width:80px;height:80px;border-radius:50%;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;font-size:40px;color:#000;font-weight:bold;animation:popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);}
  .res-circle.success{background:var(--accent);}
  .res-circle.fail{background:var(--danger);color:#fff;}
  @keyframes popIn{from{transform:scale(0);}to{transform:scale(1);}}

  .pay-btn{margin-top:25px;background:var(--surface2);color:#fff;padding:12px 24px;border-radius:12px;font-weight:600;border:1px solid var(--border);width:100%;}
  .discord-notify{display:inline-flex;align-items:center;gap:8px;color:#5865F2;font-weight:600;margin-top:10px;}
  .recap-box{background:#181C24;border:1px solid #222732;border-radius:12px;padding:16px;margin:20px 0;text-align:left;}
  .recap-row{display:flex;justify-content:space-between;margin-bottom:12px;font-size:14px;}
  .recap-row:last-child{margin-bottom:0;border-top:1px solid #222732;padding-top:12px;}
  .recap-label{color:var(--muted);}
  .recap-val{color:#fff;font-weight:600;}
  .recap-val.price{color:var(--accent);font-family:'IBM Plex Mono',monospace;}
  .refund-btn{background:rgba(255,215,0,0.1);color:#FFD700;border:1px solid rgba(255,215,0,0.3);padding:6px 12px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;margin-left:10px;}
  
  .style-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:15px;}
  .style-pick{height:80px;border-radius:12px;cursor:pointer;border:2px solid transparent;transition:all .2s;}
  .style-pick:hover{border-color:var(--accent);transform:translateY(-3px);}
  .style-pick.selected{border-color:var(--accent);box-shadow:0 0 15px var(--accent-dim);}
  .style-dark{background:linear-gradient(135deg, #1C1F26, #0d0f12);}
  .style-mint{background:linear-gradient(135deg, #005a4a, #00E0B0);}
  .style-ocean{background:linear-gradient(135deg, #2980b9, #6dd5fa);}
  .style-sunset{background:linear-gradient(135deg, #dd2476, #ff512f);}
  .style-gold{background:linear-gradient(135deg, #bf953f, #fcf6ba, #aa771c);}
</style>
</head>
<body>
  <div class="frozen-overlay" id="frozenScreen">
    <div class="frozen-icon">🔒</div>
    <h1>Compte Gelé</h1>
    <p>Votre compte bancaire a été suspendu par l'administration. Vous n'avez plus accès à vos fonds pour le moment. Veuillez contacter un responsable pour plus d'informations.</p>
    <button onclick="logout()" style="margin-top:30px;background:var(--surface2);padding:12px 24px;border-radius:10px;font-weight:600;color:#fff;">Se déconnecter</button>
  </div>

  <div class="pay-overlay" id="payOverlay">
    <div class="pay-sheet">
      <div class="sheet-handle"></div>
      <div class="sheet-title" id="sheetTitle">Vigi Pay</div>
      
      <div class="pay-state active" id="stateCard">
        <div class="terminal-card" id="animCard">
          <div class="contactless-pulse"></div>
          <div class="contactless-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M9 9a3 3 0 010 6M12 6a7 7 0 010 12M15 3a11 11 0 010 18"/></svg></div>
          <div style="position:absolute;top:20px;left:20px;font-weight:700;font-size:14px;letter-spacing:1px;color:#fff;">VIGI · EMPLOYÉ</div>
          <div class="mono" style="font-size:18px;letter-spacing:3px;color:#fff;position:absolute;bottom:60px;left:20px;">•••• 7734</div>
          <div style="position:absolute;bottom:20px;left:20px;font-size:12px;color:#ccc;" id="payCardName">NOM</div>
          <div style="position:absolute;bottom:20px;right:20px;font-size:12px;color:#aaa;">12/26</div>
        </div>
        <p style="color:#fff;font-weight:600;font-size:16px;">Approchez la carte du terminal</p>
        <div class="term-dots" id="termDots"><span></span><span></span><span></span></div>
      </div>

      <div class="pay-state" id="stateAcs">
        <div class="loader-ring"></div>
        <h3 style="margin-top:0;font-size:18px;color:#fff;">Validation requise</h3>
        <p style="color:var(--muted);margin:10px 0 0 0;font-size:14px;">Veuillez confirmer le paiement dans vos messages privés Discord...</p>
        <div class="discord-notify"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.010c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.010c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg> En attente de validation Discord</div>
      </div>

      <div class="pay-state" id="stateContactBank">
        <div class="wifi-signal"><div class="wifi-arc arc1"></div><div class="wifi-arc arc2"></div><div class="wifi-arc arc3"></div><div class="wifi-dot">🏦</div></div>
        <h3 style="margin-top:0;font-size:18px;color:#fff;">Contact établissement bancaire</h3>
        <p style="color:var(--muted);margin:10px 0 0 0;font-size:14px;">Transfert de données sécurisé en cours...</p>
      </div>

      <div class="pay-state" id="stateSuccess">
        <div class="res-circle success">✔</div>
        <h3 style="margin-top:0;font-size:22px;color:#fff;" id="successTitle">Paiement validé</h3>
        <div class="recap-box" id="recapBox">
            <div class="recap-row"><span class="recap-label">Article</span><span class="recap-val" id="recapItemName"></span></div>
            <div class="recap-row"><span class="recap-label" id="recapPriceLabel">Prix</span><span class="recap-val price" id="recapItemPrice"></span></div>
            <div class="recap-row"><span class="recap-label">Nouveau solde</span><span class="recap-val" id="recapBalance"></span></div>
        </div>
        <p style="color:var(--muted); font-size:12px;" id="redirectText">Redirection vers le site marchand dans <span id="redirectCountdown">5</span>s...</p>
        <button class="pay-btn" onclick="closePayment()">Terminer</button>
      </div>

      <div class="pay-state" id="stateFail">
        <div class="res-circle fail">✖</div>
        <h3 style="margin-top:0;font-size:22px;color:#fff;" id="failTitle">Paiement refusé</h3>
        <p style="color:var(--muted);margin:10px 0;" id="failReason">Fonds insuffisants.</p>
        <button class="pay-btn" onclick="closePayment()">Retour à la boutique</button>
      </div>

      <div class="pay-state" id="stateRefundScan">
        <div class="scan-area"><div class="receipt"><div class="receipt-line"></div><div class="receipt-line"></div><div class="receipt-line"></div><div class="receipt-total"></div><div class="receipt-line"></div><div class="receipt-line"></div></div><div class="scan-laser"></div></div>
        <h3 style="margin-top:0;font-size:18px;color:#fff;">Analyse du ticket</h3>
        <p style="color:var(--muted);margin:10px 0 0 0;font-size:14px;">Lecture de la transaction d'origine...</p>
      </div>

      <div class="pay-state" id="stateRefundTransmit">
        <div class="plane-signal"><div class="plane-icon">✈️</div></div>
        <h3 style="margin-top:0;font-size:18px;color:#fff;">Transmission de la demande</h3>
        <p style="color:var(--muted);margin:10px 0 0 0;font-size:14px;">Envoi de la requête au service financier...</p>
      </div>

      <div class="pay-state" id="stateRefundSent">
        <div class="res-circle success">✔</div>
        <h3 style="margin-top:0;font-size:22px;color:#fff;">Demande envoyée</h3>
        <p style="color:var(--muted);margin:10px 0;">Votre demande de remboursement a bien été transmise à l'administration. Vous pouvez fermer cette fenêtre.</p>
        <button class="pay-btn" onclick="closePayment()">Fermer</button>
      </div>

    </div>
  </div>

  <div class="dash-wrap">
    <aside class="sidebar">
      <div class="logo"><svg viewBox="0 0 24 24" fill="none"><path d="M12 2L4 5V11C4 16.5 7.4 20.7 12 22C16.6 20.7 20 16.5 20 11V5L12 2Z" fill="#00E0B0" fill-opacity="0.15" stroke="#00E0B0" stroke-width="1.5"/><circle cx="12" cy="11" r="3" stroke="#00E0B0" stroke-width="1.5"/></svg> Vigi-Banque</div>
      <nav class="side-nav">
        <a class="active" onclick="switchTab('home')">Accueil</a>
        <a onclick="switchTab('shop')">Boutique</a>
        <a onclick="switchTab('card')">Carte</a>
      </nav>
      <div class="side-user"><div class="avatar" id="sideAvatar">U</div><div><b id="sideName">Employé</b><span id="sidePlan" style="font-size:11px;color:var(--muted);">Compte</span></div></div>
      <button onclick="logout()" style="margin-top:16px;text-align:left;padding:10px 14px;border-radius:10px;color:var(--muted);font-size:13px;">Déconnexion</button>
    </aside>

    <main class="main-content">
      <div id="tab-home" class="tab-content active">
        <div class="topbar"><div><h1 id="greeting">Bonjour 👋</h1><div style="font-size:13px;color:var(--muted);margin-top:4px;" id="dashDate"></div></div></div>
        <div class="grid-2">
          <div class="card">
            <div style="font-size:13px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;">Solde Disponible</div>
            <div style="font-size:42px;font-weight:700;color:#fff;margin-top:8px;font-family:'Space Grotesk';" id="dashBalance">0 Vigi-Coins</div>
            <div style="display:inline-flex;gap:6px;background:var(--accent-dim);color:var(--accent);padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600;margin-top:12px;">● Compte synchronisé</div>
            <div class="virtual-card" id="mainCard">
              <div style="display:flex;justify-content:space-between;"><div style="font-weight:700;font-size:14px;letter-spacing:1px;color:#fff;">VIGI · EMPLOYÉ</div><div style="width:40px;height:30px;background:linear-gradient(135deg,#bf953f,#fcf6ba,#aa771c);border-radius:6px;"></div></div>
              <div class="mono" style="font-size:16px;letter-spacing:3px;color:#fff;">•••• •••• •••• 7734</div>
              <div style="display:flex;justify-content:space-between;font-size:12px;color:#ccc;"><div id="vcName">NOM</div><div style="color:#aaa;">12/26</div></div>
            </div>
          </div>
          <div class="card">
            <h3 style="font-size:16px;font-weight:600;margin-bottom:16px;">Statut du Compte</h3>
            <div style="display:inline-block;padding:8px 16px;background:var(--surface2);border:1px solid var(--accent);color:var(--accent);border-radius:8px;font-weight:600;font-size:14px;" id="dashStatus">En attente...</div>
            <p style="font-size:13px;color:var(--muted);margin-top:16px;line-height:1.5;">Votre compte est lié à votre contrat d'employé actif.</p>
          </div>
        </div>
        <div class="card">
          <h3 style="margin-bottom:16px;font-size:16px;">Transactions récentes</h3>
          <div id="txList"></div>
        </div>
      </div>

      <div id="tab-shop" class="tab-content" style="display:none;">
         <div class="topbar"><div><h1>Boutique Vigi</h1><div style="font-size:13px;color:var(--muted);margin-top:4px;">Dépensez vos Vigi-Coins</div></div></div>
         <div class="card">
            <h3 style="margin-bottom:8px;font-size:18px;">Articles disponibles</h3>
            <p style="font-size:13px;color:var(--muted);margin-bottom:24px;">Cliquez sur un article pour l'acheter. Le paiement sera sécurisé par Vigi-Banque.</p>
            <div id="shopGrid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;"></div>
         </div>
      </div>

      <div id="tab-card" class="tab-content" style="display:none;">
         <div class="topbar"><div><h1>Personnalisation</h1><div style="font-size:13px;color:var(--muted);margin-top:4px;">Choisissez le design de votre carte</div></div></div>
         <div class="card">
            <div id="cardAlert" class="discord-notify" style="display:none;"></div>
            <div class="virtual-card" id="previewCard" style="margin-bottom: 40px;">
                <div style="display:flex;justify-content:space-between;"><div style="font-weight:700;font-size:14px;letter-spacing:1px;color:#fff;">VIGI · EMPLOYÉ</div><div style="width:40px;height:30px;background:linear-gradient(135deg,#bf953f,#fcf6ba,#aa771c);border-radius:6px;"></div></div>
                <div class="mono" style="font-size:16px;letter-spacing:3px;color:#fff;">•••• •••• •••• 7734</div>
                <div style="display:flex;justify-content:space-between;font-size:12px;color:#ccc;"><div id="prevName">NOM</div><div style="color:#aaa;">12/26</div></div>
            </div>
            
            <h3 style="font-size:16px;font-weight:600;margin-bottom:16px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;">Sélectionnez un thème</h3>
            <div class="style-grid">
                <div class="style-pick style-dark" onclick="updateCardStyle('dark')"></div>
                <div class="style-pick style-mint" onclick="updateCardStyle('mint')"></div>
                <div class="style-pick style-ocean" onclick="updateCardStyle('ocean')"></div>
                <div class="style-pick style-sunset" onclick="updateCardStyle('sunset')"></div>
                <div class="style-pick style-gold" onclick="updateCardStyle('gold')"></div>
            </div>
         </div>
      </div>
    </main>
  </div>

  <script>
    let userBalance = 0;
    let currentCardStyle = 'dark';
    const styles = {
        dark: 'linear-gradient(135deg, #1C1F26, #0d0f12)',
        mint: 'linear-gradient(135deg, #005a4a, #00E0B0)',
        ocean: 'linear-gradient(135deg, #2980b9, #6dd5fa)',
        sunset: 'linear-gradient(135deg, #dd2476, #ff512f)',
        gold: 'linear-gradient(135deg, #bf953f, #fcf6ba, #aa771c)'
    };

    function applyCardStyle(style) {
        const bg = styles[style] || styles.dark;
        document.getElementById('mainCard').style.background = bg;
        document.getElementById('previewCard').style.background = bg;
        document.getElementById('animCard').style.background = bg;
        
        document.querySelectorAll('.style-pick').forEach(p => p.classList.remove('selected'));
        const activePick = document.querySelector('.style-' + style);
        if (activePick) activePick.classList.add('selected');
    }

    function switchTab(t) {
      document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
      document.getElementById('tab-' + t).style.display = 'block';
      document.querySelectorAll('.side-nav a').forEach(a => a.classList.remove('active'));
      if(t === 'home') document.querySelectorAll('.side-nav a')[0].classList.add('active');
      if(t === 'shop') document.querySelectorAll('.side-nav a')[1].classList.add('active');
      if(t === 'card') document.querySelectorAll('.side-nav a')[2].classList.add('active');
    }

    function setPayState(stateId) {
      document.querySelectorAll('.pay-state').forEach(s => s.classList.remove('active'));
      document.getElementById(stateId).classList.add('active');
    }

    async function loadData() {
      const res = await fetch('/api/bank/data');
      const data = await res.json();
      if (data.success) {
        if (data.frozen) { document.getElementById('frozenScreen').style.display = 'flex'; return; }

        userBalance = data.balance;
        currentCardStyle = data.cardStyle || 'dark';
        applyCardStyle(currentCardStyle);

        document.getElementById('dashBalance').innerText = userBalance.toLocaleString('fr-FR') + ' Vigi-Coins';
        const name = data.username || 'Employé';
        document.getElementById('greeting').innerText = 'Bonjour, ' + name + ' 👋';
        document.getElementById('sideName').innerText = name;
        document.getElementById('sideAvatar').innerText = name.charAt(0).toUpperCase();
        document.getElementById('vcName').innerText = name.toUpperCase();
        document.getElementById('prevName').innerText = name.toUpperCase();
        document.getElementById('payCardName').innerText = name.toUpperCase();
        
        const planName = data.stage === 'confirmed' ? 'Titulaire' : (data.stage === 'trainee' ? 'En formation' : 'Non employé');
        document.getElementById('sidePlan').innerText = planName;
        document.getElementById('dashStatus').innerText = planName;
        document.getElementById('dashDate').innerText = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        const txList = document.getElementById('txList');
        if (data.transactions.length === 0) {
            txList.innerHTML = '<div style="text-align:center;color:var(--muted);padding:20px;">Aucune transaction.</div>';
        } else {
            let h = '';
            for (const tx of data.transactions) {
                const isPos = tx.amount > 0;
                h += '<div style="display:flex;align-items:center;gap:16px;padding:16px 0;border-bottom:1px solid var(--border);">';
                h += '<div style="width:42px;height:42px;border-radius:12px;background:var(--surface2);display:flex;align-items:center;justify-content:center;font-size:18px;">' + (isPos ? '💰' : '🧾') + '</div>';
                h += '<div style="flex:1;"><b style="font-size:14px;display:block;color:#fff;">' + tx.label + '</b><span style="font-size:12px;color:var(--muted);">' + new Date(tx.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' }) + '</span></div>';
                h += '<div class="mono" style="font-weight:600;color:' + (isPos ? 'var(--accent)' : 'var(--danger)') + ';">' + (isPos ? '+' : '') + tx.amount + ' 🪙</div>';
                
                if (tx.label.startsWith('Achat Boutique') && !tx.label.includes('Remboursé')) {
                    h += '<button class="refund-btn" onclick="requestRefund(\\'' + tx._id + '\\')">↩️ Rembourser</button>';
                }
                h += '</div>';
            }
            txList.innerHTML = h;
        }
        loadShopItems();
      } else { window.location.href = '/bank/login'; }
    }

    async function updateCardStyle(style) {
        applyCardStyle(style);
        const res = await fetch('/api/bank/update-card', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ style }) });
        const data = await res.json();
        
        const alertDiv = document.getElementById('cardAlert');
        if(data.success) {
            currentCardStyle = style;
            alertDiv.innerText = "✅ Design mis à jour avec succès !";
            alertDiv.style.color = "var(--accent)";
        } else {
            applyCardStyle(currentCardStyle);
            alertDiv.innerText = "❌ Erreur lors de la mise à jour.";
            alertDiv.style.color = "var(--danger)";
        }
        alertDiv.style.display = 'flex';
        setTimeout(() => { alertDiv.style.display = 'none'; }, 3000);
    }

    async function loadShopItems() {
        const res = await fetch('/api/shop/items');
        const data = await res.json();
        const grid = document.getElementById('shopGrid');
        if (!data.success || data.items.length === 0) { grid.innerHTML = '<p style="color:var(--muted);grid-column:1/-1;text-align:center;">Aucun article en vente.</p>'; return; }
        let h = '';
        for (const item of data.items) {
            h += '<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:24px;text-align:center;display:flex;flex-direction:column;align-items:center;">';
            h += '<div style="font-size:40px;margin-bottom:16px;">' + item.icon + '</div>';
            h += '<h3 style="font-size:18px;margin-bottom:8px;">' + item.name + '</h3>';
            h += '<p style="font-size:13px;color:var(--muted);margin-bottom:20px;flex-grow:1;">' + item.description + '</p>';
            h += '<div style="display:inline-block;padding:6px 16px;background:var(--accent-dim);color:var(--accent);border-radius:20px;font-weight:700;font-family:IBM Plex Mono,monospace;margin-bottom:16px;">' + item.price + ' 🪙</div>';
            h += '<button onclick="buyItem(\\'' + item._id + '\\')" style="width:100%;background:var(--accent);color:#000;border:none;padding:12px;border-radius:10px;font-weight:700;cursor:pointer;">Acheter</button>';
            h += '</div>';
        }
        grid.innerHTML = h;
    }

    async function buyItem(itemId) {
        document.getElementById('sheetTitle').innerText = "Vigi Pay";
        document.getElementById('successTitle').innerText = "Paiement validé";
        document.getElementById('failTitle').innerText = "Paiement refusé";
        document.getElementById('recapPriceLabel').innerText = "Prix";
        document.getElementById('recapBox').style.display = 'block';
        document.getElementById('redirectText').style.display = 'block';

        document.getElementById('payOverlay').style.display = 'flex';
        document.getElementById('payOverlay').classList.add('active');
        setPayState('stateCard');
        document.getElementById('termDots').classList.remove('active');
        await new Promise(r => setTimeout(r, 400)); 
        document.getElementById('animCard').classList.add('tapping');
        document.getElementById('termDots').classList.add('active');

        const res = await fetch('/api/shop/purchase', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itemId }) });
        const data = await res.json();

        await new Promise(r => setTimeout(r, 1500));
        document.getElementById('animCard').classList.remove('tapping');
        document.getElementById('termDots').classList.remove('active');

        if (!data.success) { document.getElementById('failReason').innerText = data.message; setPayState('stateFail'); return; }

        setPayState('stateAcs');
        let pollCount = 0;
        const pollInterval = setInterval(async () => {
            pollCount++;
            if (pollCount > 60) { clearInterval(pollInterval); document.getElementById('failReason').innerText = "Délai dépassé."; setPayState('stateFail'); return; }

            const checkRes = await fetch('/api/shop/check-purchase?transactionId=' + data.transactionId);
            const checkData = await checkRes.json();

            if (checkData.status === 'approved') {
                clearInterval(pollInterval);
                setPayState('stateContactBank');
                await new Promise(r => setTimeout(r, 2500)); 
                
                userBalance = checkData.newBalance;
                document.getElementById('dashBalance').innerText = userBalance.toLocaleString('fr-FR') + ' Vigi-Coins';
                document.getElementById('recapItemName').innerText = checkData.itemName;
                document.getElementById('recapItemPrice').innerText = '- ' + checkData.itemPrice + ' 🪙';
                document.getElementById('recapBalance').innerText = userBalance.toLocaleString('fr-FR') + ' 🪙';
                setPayState('stateSuccess');
                loadData(); 

                let countdown = 5;
                document.getElementById('redirectCountdown').innerText = countdown;
                const redirectInterval = setInterval(() => {
                    countdown--;
                    if (countdown > 0) document.getElementById('redirectCountdown').innerText = countdown;
                    else { clearInterval(redirectInterval); closePayment(); }
                }, 1000);
            } else if (checkData.status === 'declined' || checkData.status === 'expired') {
                clearInterval(pollInterval);
                document.getElementById('failReason').innerText = checkData.message || "Paiement refusé.";
                setPayState('stateFail');
            }
        }, 2000); 
    }

    async function requestRefund(txId) {
        document.getElementById('sheetTitle').innerText = "Demande de Remboursement";
        document.getElementById('payOverlay').style.display = 'flex';
        document.getElementById('payOverlay').classList.add('active');

        setPayState('stateRefundScan');
        await new Promise(r => setTimeout(r, 2500));

        setPayState('stateRefundTransmit');
        await new Promise(r => setTimeout(r, 2000));

        const res = await fetch('/api/shop/request-refund', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ txId }) });
        const data = await res.json();

        if (data.success) {
            setPayState('stateRefundSent');
            loadData();
        } else {
            document.getElementById('failTitle').innerText = "Erreur";
            document.getElementById('failReason').innerText = data.message || "Erreur lors de la demande.";
            setPayState('stateFail');
        }
    }

    function closePayment() {
        document.getElementById('payOverlay').classList.remove('active');
        setTimeout(() => { document.getElementById('payOverlay').style.display = 'none'; }, 500);
    }

    async function logout() {
      await fetch('/bank/logout', { method: 'POST' });
      window.location.href = '/bank/login';
    }
    loadData();
  </script>
</body>
</html>`;
        res.send(html);
    });

    // ----------------------------------------------------
    // GESTIONNAIRE DE BOUTONS DISCORD
    // ----------------------------------------------------
    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isButton()) return;

        if (interaction.customId.startsWith('pay_accept_') || interaction.customId.startsWith('pay_decline_')) {
            const txId = interaction.customId.split('_')[2];
            const tx = pendingPayments.get(txId);
            if (!tx) return interaction.update({ content: "Session expirée.", components: [] }).catch(()=>{});
            if (tx.userId !== interaction.user.id) return interaction.reply({ content: "Ce n'est pas votre paiement.", ephemeral: true });

            if (interaction.customId.startsWith('pay_accept_')) {
                const userEco = await Economy.findOne({ userId: tx.userId });
                const item = await ShopItem.findById(tx.itemId);
                if (!userEco || !item || userEco.balance < item.price) {
                    tx.status = 'declined'; tx.message = "Fonds insuffisants.";
                    await interaction.update({ content: `❌ **Paiement refusé**\nFonds insuffisants.`, components: [] });
                    return;
                }
                userEco.balance -= item.price;
                userEco.transactions.push({ amount: -item.price, label: `Achat Boutique: ${item.name}` });
                await userEco.save();
                tx.status = 'approved'; tx.newBalance = userEco.balance; tx.itemName = item.name; tx.itemPrice = item.price;
                await interaction.update({ content: `✅ **Paiement validé**\nObtenu : **${item.name}**\nNouveau solde : ${userEco.balance} 🪙`, components: [] });
            } else {
                tx.status = 'declined'; tx.message = "Refusé par l'utilisateur.";
                await interaction.update({ content: `❌ **Paiement refusé**`, components: [] });
            }
        }

        if (interaction.customId.startsWith('refund_accept_') || interaction.customId.startsWith('refund_decline_')) {
            const refundId = interaction.customId.split('_')[2];
            const ref = pendingRefunds.get(refundId);
            if (!ref) return interaction.update({ content: "Demande expirée.", components: [] }).catch(()=>{});

            if (interaction.customId.startsWith('refund_accept_')) {
                const userEco = await Economy.findOne({ userId: ref.userId });
                if (!userEco) { pendingRefunds.delete(refundId); return interaction.update({ content: `❌ Erreur: Compte introuvable.`, components: [] }); }

                const tx = userEco.transactions.id(ref.txId);
                if (!tx) { pendingRefunds.delete(refundId); return interaction.update({ content: `❌ Erreur: Transaction introuvable.`, components: [] }); }

                if (!tx.label.includes("(Remboursé)")) {
                    const refundAmount = Math.abs(tx.amount);
                    userEco.balance += refundAmount;
                    tx.label += " (Remboursé)";
                    userEco.transactions.push({ amount: refundAmount, label: `Remboursement: ${tx.label.replace(" (Remboursé)", "")}` });
                    await userEco.save();
                }
                pendingRefunds.delete(refundId);
                await interaction.update({ content: `✅ **Remboursement approuvé**\n<@${ref.userId}> a été remboursé de **${ref.amount} 🪙**.`, components: [] });
            } else {
                pendingRefunds.delete(refundId);
                await interaction.update({ content: `❌ **Remboursement refusé** par l'administration.`, components: [] });
            }
        }
    });

    return router;
};
