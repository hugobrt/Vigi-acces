const express = require('express');

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
                transactions: userEco.transactions.slice().reverse()
            });
        } catch (error) {
            console.error(error);
            res.json({ success: false, message: error.message });
        }
    });

    // ----------------------------------------------------
    // ROUTE 5 : API POUR RÉCUPÉRER LES ARTICLES (Protégée)
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
    // ROUTE 6 : API POUR ACHETER UN ARTICLE (Protégée)
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

            userEco.balance -= item.price;
            userEco.transactions.push({ amount: -item.price, label: `Achat Boutique: ${item.name}` });
            await userEco.save();

            res.json({ success: true, newBalance: userEco.balance, itemName: item.name });
        } catch (error) {
            res.json({ success: false, message: error.message });
        }
    });

    // ----------------------------------------------------
    // ROUTE 7 : DASHBOARD (Protégé par requireLogin)
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
  
  .virtual-card{width:100%;max-width:320px;height:180px;border-radius:16px;background:linear-gradient(135deg,#1C1F26,#0d0f12);position:relative;box-shadow:0 20px 40px rgba(0,0,0,0.5);padding:20px;display:flex;flex-direction:column;justify-content:space-between;margin-top:20px;border:1px solid rgba(255,255,255,0.05);}
  
  /* FROZEN SCREEN */
  .frozen-overlay{display:none;position:fixed;inset:0;background:rgba(8,9,12,0.95);z-index:1000;justify-content:center;align-items:center;flex-direction:column;text-align:center;}
  .frozen-icon{font-size:80px;margin-bottom:20px;}
  .frozen-overlay h1{color:var(--danger);font-size:32px;margin-bottom:10px;}
  .frozen-overlay p{color:var(--muted);max-width:400px;line-height:1.6;}

  /* PAYMENT OVERLAY (Apple Pay / ACS) */
  .pay-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.8);backdrop-filter:blur(10px);z-index:2000;justify-content:center;align-items:center;flex-direction:column;text-align:center;}
  .pay-card{width:300px;height:180px;background:linear-gradient(135deg,#1C1F26,#0d0f12);border-radius:16px;padding:20px;color:#fff;display:flex;flex-direction:column;justify-content:space-between;transition:transform 0.5s ease, opacity 0.5s ease;}
  .pay-card.tapped{transform:translateY(-20px) scale(0.95);opacity:0.5;}
  .acs-box{display:none;background:#11141A;padding:40px;border-radius:20px;border:1px solid #222732;width:350px;text-align:center;}
  .acs-spinner{border:4px solid rgba(0,224,176,0.2);border-top:4px solid var(--accent);border-radius:50%;width:40px;height:40px;animation:spin 1s linear infinite;margin:20px auto;}
  @keyframes spin{100%{transform:rotate(360deg);}}
  .acs-bar{height:4px;background:#222732;border-radius:2px;margin-top:20px;overflow:hidden;}
  .acs-bar-fill{height:100%;width:0%;background:var(--accent);transition:width 2.5s linear;}
  .success-box{display:none;}
  .success-check{width:80px;height:80px;background:var(--accent);border-radius:50%;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;font-size:40px;color:#000;font-weight:bold;}
</style>
</head>
<body>
  <!-- ÉCRAN DE GEL -->
  <div class="frozen-overlay" id="frozenScreen">
    <div class="frozen-icon">🔒</div>
    <h1>Compte Gelé</h1>
    <p>Votre compte bancaire a été suspendu par l'administration. Vous n'avez plus accès à vos fonds pour le moment. Veuillez contacter un responsable pour plus d'informations.</p>
    <button onclick="logout()" style="margin-top:30px;background:var(--surface2);padding:12px 24px;border-radius:10px;font-weight:600;color:#fff;">Se déconnecter</button>
  </div>

  <!-- ÉCRAN DE PAIEMENT -->
  <div class="pay-overlay" id="payOverlay">
    <div class="pay-card" id="payCard">
      <div style="display:flex;justify-content:space-between;"><div style="font-weight:700;font-size:14px;letter-spacing:1px;">VIGI · EMPLOYÉ</div><div style="width:40px;height:30px;background:linear-gradient(135deg,#bf953f,#fcf6ba,#aa771c);border-radius:6px;"></div></div>
      <div class="mono" style="font-size:16px;letter-spacing:3px;color:#fff;">•••• •••• •••• 7734</div>
      <div style="display:flex;justify-content:space-between;font-size:12px;color:#ccc;"><div id="payCardName">NOM</div><div style="color:#aaa;">12/26</div></div>
    </div>
    
    <div class="acs-box" id="acsBox">
      <h3 style="margin-top:0;font-size:18px;color:#fff;">Authentification de paiement</h3>
      <div class="acs-spinner"></div>
      <p style="color:var(--muted);margin:10px 0 0 0;font-size:14px;">Veuillez patienter pendant la vérification de votre paiement...</p>
      <div class="acs-bar"><div class="acs-bar-fill" id="acsBarFill"></div></div>
    </div>

    <div class="success-box" id="successBox">
      <div class="success-check">✔</div>
      <h3 style="margin-top:0;font-size:22px;color:#fff;">Paiement validé</h3>
      <p style="color:var(--muted);margin:10px 0;">Vous avez obtenu : <strong id="successItemName" style="color:var(--accent);"></strong></p>
      <button onclick="closePayment()" style="margin-top:20px;background:var(--accent);color:#000;padding:12px 24px;border-radius:10px;font-weight:700;">Retour à la boutique</button>
    </div>

    <div class="success-box" id="failBox" style="display:none;">
      <div class="success-check" style="background:var(--danger);">✖</div>
      <h3 style="margin-top:0;font-size:22px;color:#fff;">Paiement refusé</h3>
      <p style="color:var(--muted);margin:10px 0;" id="failReason">Fonds insuffisants.</p>
      <button onclick="closePayment()" style="margin-top:20px;background:var(--surface2);padding:12px 24px;border-radius:10px;font-weight:600;color:#fff;">Retour à la boutique</button>
    </div>
  </div>

  <div class="dash-wrap">
    <aside class="sidebar">
      <div class="logo">
        <svg viewBox="0 0 24 24" fill="none"><path d="M12 2L4 5V11C4 16.5 7.4 20.7 12 22C16.6 20.7 20 16.5 20 11V5L12 2Z" fill="#00E0B0" fill-opacity="0.15" stroke="#00E0B0" stroke-width="1.5"/><circle cx="12" cy="11" r="3" stroke="#00E0B0" stroke-width="1.5"/></svg>
        Vigi-Banque
      </div>
      <nav class="side-nav">
        <a class="active" onclick="switchTab('home')">Accueil</a>
        <a onclick="switchTab('shop')">Boutique</a>
      </nav>
      <div class="side-user">
        <div class="avatar" id="sideAvatar">U</div>
        <div><b id="sideName">Employé</b><span id="sidePlan" style="font-size:11px;color:var(--muted);">Compte</span></div>
      </div>
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
            <div class="virtual-card">
              <div style="display:flex;justify-content:space-between;"><div style="font-weight:700;font-size:14px;letter-spacing:1px;">VIGI · EMPLOYÉ</div><div style="width:40px;height:30px;background:linear-gradient(135deg,#bf953f,#fcf6ba,#aa771c);border-radius:6px;"></div></div>
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
    </main>
  </div>

  <script>
    let userBalance = 0;

    function switchTab(t) {
      document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
      document.getElementById('tab-' + t).style.display = 'block';
    }

    async function loadData() {
      const res = await fetch('/api/bank/data');
      const data = await res.json();
      if (data.success) {
        if (data.frozen) {
          document.getElementById('frozenScreen').style.display = 'flex';
          return;
        }

        userBalance = data.balance;
        document.getElementById('dashBalance').innerText = userBalance.toLocaleString('fr-FR') + ' Vigi-Coins';
        const name = data.username || 'Employé';
        document.getElementById('greeting').innerText = 'Bonjour, ' + name + ' 👋';
        document.getElementById('sideName').innerText = name;
        document.getElementById('sideAvatar').innerText = name.charAt(0).toUpperCase();
        document.getElementById('vcName').innerText = name.toUpperCase();
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
                h += '</div>';
            }
            txList.innerHTML = h;
        }

        loadShopItems();
      } else { window.location.href = '/bank/login'; }
    }

    async function loadShopItems() {
        const res = await fetch('/api/shop/items');
        const data = await res.json();
        const grid = document.getElementById('shopGrid');
        
        if (!data.success || data.items.length === 0) {
            grid.innerHTML = '<p style="color:var(--muted);grid-column:1/-1;text-align:center;">Aucun article en vente pour le moment.</p>';
            return;
        }

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
        // Afficher l'overlay
        document.getElementById('payOverlay').style.display = 'flex';
        document.getElementById('payCard').style.display = 'flex';
        document.getElementById('payCard').classList.add('tapped');
        document.getElementById('acsBox').style.display = 'none';
        document.getElementById('successBox').style.display = 'none';
        document.getElementById('failBox').style.display = 'none';
        document.getElementById('acsBarFill').style.width = '0%';

        // Attendre 1s (effet carte tap)
        await new Promise(r => setTimeout(r, 1000));

        // Afficher ACS
        document.getElementById('payCard').style.display = 'none';
        document.getElementById('acsBox').style.display = 'block';
        
        // Lancer la barre de progression
        setTimeout(() => {
            document.getElementById('acsBarFill').style.width = '100%';
        }, 100);

        // Appeler l'API pendant que la barre se remplit
        const resPromise = fetch('/api/shop/purchase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemId })
        });

        // Attendre la fin de l'animation (2.5s)
        await new Promise(r => setTimeout(r, 2600));
        const res = await resPromise;
        const data = await res.json();

        document.getElementById('acsBox').style.display = 'none';

        if (data.success) {
            userBalance = data.newBalance;
            document.getElementById('dashBalance').innerText = userBalance.toLocaleString('fr-FR') + ' Vigi-Coins';
            document.getElementById('successItemName').innerText = data.itemName;
            document.getElementById('successBox').style.display = 'block';
            // Rafraîchir les transactions
            loadData();
        } else {
            document.getElementById('failReason').innerText = data.message || "Une erreur est survenue.";
            document.getElementById('failBox').style.display = 'block';
        }
    }

    function closePayment() {
        document.getElementById('payOverlay').style.display = 'none';
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

    return router;
};
