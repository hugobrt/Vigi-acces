const express = require('express');

module.exports = function(client, dbNova, Economy) {
    const router = express.Router();
    router.use(express.json());
    router.use(express.urlencoded({ extended: true }));

    router.get('/bank', (req, res) => {
        const html = `
        <!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Vigi-Banque — Espace Employé</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root{
    --bg:#08090C;
    --surface:#11141A;
    --surface2:#181C24;
    --border:#222732;
    --text:#F4F6F8;
    --muted:#6B7280;
    --accent:#00E0B0; /* Mint premium */
    --accent-dim:rgba(0,224,176,0.1);
    --danger:#FF5C5C;
    --radius:20px;
  }
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--text);overflow-x:hidden;}
  h1,h2,h3,h4{font-family:'Space Grotesk',sans-serif;letter-spacing:-0.02em;}
  .mono{font-family:'IBM Plex Mono',monospace;}
  a{color:inherit;text-decoration:none;}
  button{font-family:inherit;cursor:pointer;border:none;background:none;color:inherit;}
  ul{list-style:none;}
  .view{display:none;min-height:100vh;}
  .view.active{display:block;}
  
  /* ================= LOGIN ================= */
  .login-wrap{min-height:100vh;display:grid;grid-template-columns:1fr 1fr;}
  .login-visual{background:linear-gradient(135deg,#0B1F1A,#08090C);display:flex;flex-direction:column;justify-content:space-between;padding:48px;position:relative;overflow:hidden;}
  .login-visual::after{content:'';position:absolute;width:600px;height:600px;background:radial-gradient(circle,rgba(0,224,176,0.08),transparent 70%);top:-100px;right:-100px;}
  .logo{display:flex;align-items:center;gap:10px;font-family:'Space Grotesk';font-weight:700;font-size:20px;color:#fff;}
  .logo svg{width:26px;height:26px;}
  .visual-content{position:relative;z-index:1;}
  .visual-content h2{font-size:32px;line-height:1.3;color:#fff;max-width:400px;margin-bottom:20px;}
  .visual-content p{color:var(--muted);max-width:350px;line-height:1.6;}
  .visual-footer{font-size:12px;color:var(--muted);position:relative;z-index:1;}
  
  .login-form-side{display:flex;align-items:center;justify-content:center;padding:40px;background:var(--bg);}
  .login-box{width:100%;max-width:360px;}
  .login-box h1{font-size:28px;color:#fff;margin-bottom:8px;}
  .login-box .sub{color:var(--muted);margin-bottom:32px;font-size:15px;}
  .input-group{margin-bottom:20px;}
  .input-group label{display:block;font-size:13px;color:var(--muted);margin-bottom:8px;font-weight:500;}
  .code-input{width:100%;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:18px;color:#fff;font-size:24px;text-align:center;letter-spacing:12px;font-family:'IBM Plex Mono';outline:none;transition:border .2s;}
  .code-input:focus{border-color:var(--accent);box-shadow:0 0 0 4px var(--accent-dim);}
  .btn-primary{width:100%;background:var(--accent);color:#000;font-weight:700;padding:16px;border-radius:12px;font-size:15px;transition:transform .15s,box-shadow .2s;}
  .btn-primary:hover{transform:translateY(-2px);box-shadow:0 10px 25px rgba(0,224,176,0.2);}
  .login-error{color:var(--danger);font-size:13px;margin-top:15px;display:none;padding:12px;background:rgba(255,92,92,0.1);border:1px solid rgba(255,92,92,0.2);border-radius:10px;}

  /* ================= DASHBOARD ================= */
  .dash-wrap{display:grid;grid-template-columns:240px 1fr;min-height:100vh;}
  .sidebar{background:var(--surface);border-right:1px solid var(--border);padding:24px 16px;display:flex;flex-direction:column;position:sticky;top:0;height:100vh;}
  .side-nav{margin-top:40px;flex:1;}
  .side-nav a{display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:10px;color:var(--muted);font-weight:500;font-size:14px;margin-bottom:4px;transition:all .2s;}
  .side-nav a.active{background:var(--surface2);color:#fff;}
  .side-nav a:hover:not(.active){color:#fff;}
  .side-user{border-top:1px solid var(--border);padding-top:16px;display:flex;align-items:center;gap:12px;}
  .avatar{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--accent),#005a4a);display:flex;align-items:center;justify-content:center;color:#000;font-weight:700;font-size:14px;}
  .side-user-info b{display:block;font-size:13px;color:#fff;}
  .side-user-info span{font-size:11px;color:var(--muted);}
  
  .main-content{padding:32px 40px;max-width:1200px;}
  .topbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:32px;}
  .topbar h1{font-size:26px;font-weight:700;}
  .topbar .date{font-size:13px;color:var(--muted);margin-top:4px;}
  
  .grid-2{display:grid;grid-template-columns:1.2fr 0.8fr;gap:24px;margin-bottom:24px;}
  .card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:24px;}
  
  /* Balance & Virtual Card */
  .balance-box{position:relative;overflow:hidden;}
  .balance-label{font-size:13px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;}
  .balance-amount{font-size:42px;font-weight:700;color:#fff;margin-top:8px;font-family:'Space Grotesk';}
  .balance-status{display:inline-flex;align-items:center;gap:6px;background:var(--accent-dim);color:var(--accent);padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600;margin-top:12px;}
  
  .virtual-card{width:320px;height:180px;border-radius:16px;background:linear-gradient(135deg,#1C1F26,#0d0f12);position:relative;box-shadow:0 20px 40px rgba(0,0,0,0.5);padding:20px;display:flex;flex-direction:column;justify-content:space-between;margin-top:20px;border:1px solid rgba(255,255,255,0.05);}
  .vc-top{display:flex;justify-content:space-between;align-items:flex-start;}
  .vc-brand{font-weight:700;font-size:14px;letter-spacing:1px;}
  .vc-chip{width:40px;height:30px;background:linear-gradient(135deg,#bf953f,#fcf6ba,#aa771c);border-radius:6px;}
  .vc-number{font-family:'IBM Plex Mono';font-size:16px;letter-spacing:3px;color:#fff;}
  .vc-bottom{display:flex;justify-content:space-between;align-items:flex-end;}
  .vc-holder{font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#ccc;}
  .vc-expiry{font-size:12px;color:#aaa;}
  
  .action-btns{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:24px;}
  .action-btn{background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:14px;display:flex;align-items:center;justify-content:center;gap:8px;font-size:13px;font-weight:600;color:#fff;transition:background .2s;}
  .action-btn:hover{background:#20242e;}
  
  .status-card h3{font-size:16px;font-weight:600;margin-bottom:16px;}
  .status-badge{display:inline-block;padding:8px 16px;background:var(--surface2);border:1px solid var(--accent);color:var(--accent);border-radius:8px;font-weight:600;font-size:14px;}
  .status-info{font-size:13px;color:var(--muted);margin-top:16px;line-height:1.5;}
  
  .tx-list{margin-top:16px;}
  .tx-item{display:flex;align-items:center;gap:16px;padding:16px 0;border-bottom:1px solid var(--border);}
  .tx-item:last-child{border-bottom:none;}
  .tx-icon{width:42px;height:42px;border-radius:12px;background:var(--surface2);display:flex;align-items:center;justify-content:center;font-size:18px;}
  .tx-details{flex:1;}
  .tx-details b{display:block;font-size:14px;font-weight:500;color:#fff;}
  .tx-details span{font-size:12px;color:var(--muted);}
  .tx-amount{font-family:'IBM Plex Mono';font-weight:600;font-size:14px;color:var(--accent);}
  
  @media(max-width:900px){
    .login-wrap{grid-template-columns:1fr;}
    .login-visual{display:none;}
    .dash-wrap{grid-template-columns:1fr;}
    .sidebar{display:none;}
    .grid-2{grid-template-columns:1fr;}
  }
</style>
</head>
<body>

<!-- LOGIN VIEW -->
<div id="loginView" class="view active">
  <div class="login-wrap">
    <div class="login-visual">
      <div class="logo">
        <svg viewBox="0 0 24 24" fill="none"><path d="M12 2L4 5V11C4 16.5 7.4 20.7 12 22C16.6 20.7 20 16.5 20 11V5L12 2Z" fill="#00E0B0" fill-opacity="0.15" stroke="#00E0B0" stroke-width="1.5"/><circle cx="12" cy="11" r="3" stroke="#00E0B0" stroke-width="1.5"/></svg>
        Vigi-Banque
      </div>
      <div class="visual-content">
        <h2>L'écosystème financier de votre entreprise.</h2>
        <p>Accédez à votre solde, vos revenus et gérez vos fonds en toute sécurité. Connectez-vous avec votre code d'accès personnel.</p>
      </div>
      <div class="visual-footer">© Vigi-Banque — Sécurisé par Vigi-Access</div>
    </div>
    
    <div class="login-form-side">
      <div class="login-box">
        <h1>Connexion</h1>
        <p class="sub">Entrez votre code à 6 chiffres.</p>
        
        <form onsubmit="event.preventDefault(); attemptLogin();">
          <div class="input-group">
            <label>Code d'accès</label>
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
</div>

<!-- DASHBOARD VIEW -->
<div id="dashView" class="view">
  <div class="dash-wrap">
    <aside class="sidebar">
      <div class="logo" style="padding:0 12px;">
        <svg viewBox="0 0 24 24" fill="none" width="24" height="24"><path d="M12 2L4 5V11C4 16.5 7.4 20.7 12 22C16.6 20.7 20 16.5 20 11V5L12 2Z" fill="#00E0B0" fill-opacity="0.15" stroke="#00E0B0" stroke-width="1.5"/><circle cx="12" cy="11" r="3" stroke="#00E0B0" stroke-width="1.5"/></svg>
        Vigi-Banque
      </div>
      <nav class="side-nav">
        <a href="javascript:void(0)" class="active">Accueil</a>
        <a href="javascript:void(0)">Transactions</a>
        <a href="javascript:void(0)">Cartes</a>
        <a href="javascript:void(0)">Paramètres</a>
      </nav>
      <div class="side-user">
        <div class="avatar" id="sideAvatar">U</div>
        <div class="side-user-info">
          <b id="sideName">Employé</b>
          <span id="sidePlan">Compte</span>
        </div>
      </div>
    </aside>

    <main class="main-content">
      <div class="topbar">
        <div>
          <h1 id="greeting">Bonjour 👋</h1>
          <div class="date" id="dashDate"></div>
        </div>
        <button onclick="logout()" style="background:var(--surface2);padding:10px 20px;border-radius:10px;font-weight:600;font-size:13px;">Déconnexion</button>
      </div>

      <div class="grid-2">
        <div class="card balance-box">
          <div class="balance-label">Solde Disponible</div>
          <div class="balance-amount" id="dashBalance">0 Vigi-Coins</div>
          <div class="balance-status">● Compte synchronisé</div>
          
          <div class="virtual-card">
            <div class="vc-top">
              <div class="vc-brand">VIGI · EMPLOYÉ</div>
              <div class="vc-chip"></div>
            </div>
            <div class="vc-number">•••• •••• •••• 7734</div>
            <div class="vc-bottom">
              <div class="vc-holder" id="vcName">NOM DE L'EMPLOYÉ</div>
              <div class="vc-expiry">12/26</div>
            </div>
          </div>
        </div>

        <div class="card status-card">
          <h3>Statut du Compte</h3>
          <div class="status-badge" id="dashStatus">En attente...</div>
          <p class="status-info">Votre compte bancaire est lié à votre contrat d'employé actif au sein de l'entreprise. Les paies y sont versées automatiquement.</p>
          
          <div class="action-btns">
            <button class="action-btn">↗ Virement</button>
            <button class="action-btn">↙ Recevoir</button>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 style="margin-bottom:16px;font-size:16px;">Transactions récentes</h3>
        <div class="tx-list">
          <div class="tx-item">
            <div class="tx-icon">💼</div>
            <div class="tx-details">
              <b>Virement salaire — Entreprise</b>
              <span>Synchronisation automatique</span>
            </div>
            <div class="tx-amount">+ Virement</div>
          </div>
          <div class="tx-item">
            <div class="tx-icon">🚀</div>
            <div class="tx-details">
              <b>Boutique (Bientôt)</b>
              <span>En cours de développement</span>
            </div>
            <div class="tx-amount" style="color:var(--muted);">WIP</div>
          </div>
        </div>
      </div>
    </main>
  </div>
</div>

<script>
  function attemptLogin() {
    const code = document.getElementById('codeInput').value;
    const errorDiv = document.getElementById('loginError');
    
    if (code.length !== 6) {
      errorDiv.innerText = 'Le code doit comporter 6 chiffres.';
      errorDiv.style.display = 'block';
      return;
    }

    errorDiv.style.display = 'none';

    fetch('/api/bank/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        document.getElementById('dashBalance').innerText = data.balance.toLocaleString('fr-FR') + ' Vigi-Coins';
        
        const name = data.username || 'Employé';
        const initial = name.charAt(0).toUpperCase();
        
        document.getElementById('greeting').innerText = 'Bonjour, ' + name + ' 👋';
        document.getElementById('sideName').innerText = name;
        document.getElementById('sideAvatar').innerText = initial;
        document.getElementById('vcName').innerText = name.toUpperCase();
        
        const planName = data.stage === 'confirmed' ? 'Titulaire' : (data.stage === 'trainee' ? 'En formation' : 'Non employé');
        document.getElementById('sidePlan').innerText = planName;
        document.getElementById('dashStatus').innerText = planName;

        const now = new Date();
        document.getElementById('dashDate').innerText = now.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        document.getElementById('loginView').classList.remove('active');
        document.getElementById('dashView').classList.add('active');
      } else {
        errorDiv.innerText = data.message || 'Code invalide.';
        errorDiv.style.display = 'block';
      }
    })
    .catch(err => {
      errorDiv.innerText = 'Erreur réseau.';
      errorDiv.style.display = 'block';
    });
  }

  function logout() {
    document.getElementById('codeInput').value = '';
    document.getElementById('dashView').classList.remove('active');
    document.getElementById('loginView').classList.add('active');
  }
</script>
</body>
</html>`;
        res.send(html);
    });

    router.post('/api/bank/login', async (req, res) => {
        try {
            const { code } = req.body;
            const userEco = await Economy.findOne({ bankCode: code });
            
            if (!userEco) {
                return res.json({ success: false, message: 'Code d\'accès invalide.' });
            }

            let stage = 'Non employé';
            let username = 'Employé';
            
            try {
                const empRes = await dbNova.query("SELECT stage FROM employees WHERE user_id = $1 AND status = 'active'", [userEco.userId]);
                if (empRes.rows.length > 0) {
                    stage = empRes.rows[0].stage;
                }
                
                const guildId = process.env.GUILD_ID;
                const guild = client.guilds.cache.get(guildId);
                if (guild) {
                    try {
                        const member = await guild.members.fetch(userEco.userId);
                        username = member.user.username;
                    } catch(e) {}
                }
            } catch (e) { 
                console.error("Erreur BDD Nova bank login:", e); 
            }

            res.json({ success: true, balance: userEco.balance, stage, username });
        } catch (error) {
            console.error(error);
            res.json({ success: false, message: error.message });
        }
    });

    return router;
};
