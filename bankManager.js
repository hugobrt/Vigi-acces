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
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root{
    --ink:#0B1420; --ink2:#101C2B; --ink3:#182739;
    --paper:#F2F4F3; --paper2:#FFFFFF;
    --primary:#147A6B; --primary-bright:#2FD9A8;
    --gold:#D6A94E; --coral:#E2543E;
    --text:#101820; --muted:#66727C; --muted-lt:#9AA6AD;
    --line:#E2E6E5; --line-dark:#25384A;
    --radius:16px;
  }
  *{box-sizing:border-box; margin:0; padding:0;}
  html{scroll-behavior:smooth;}
  body{font-family:'Inter',sans-serif; color:var(--text); background:var(--paper); -webkit-font-smoothing:antialiased; overflow-x:hidden;}
  h1,h2,h3,h4{font-family:'Space Grotesk',sans-serif; letter-spacing:-0.02em;}
  .mono{font-family:'IBM Plex Mono',monospace;}
  a{color:inherit; text-decoration:none;}
  button{font-family:inherit; cursor:pointer; border:none;}
  ul{list-style:none;}
  img{max-width:100%; display:block;}
  .page{display:none;}
  .page.active{display:block;}
  ::selection{background:var(--primary-bright); color:var(--ink);}

  .wrap{max-width:1180px; margin:0 auto; padding:0 32px;}
  .btn{display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:13px 24px; border-radius:999px; font-weight:600; font-size:14.5px; transition:transform .18s ease, box-shadow .18s ease, background .18s ease; white-space:nowrap;}
  .btn:active{transform:scale(.97);}
  .btn-primary{background:var(--primary-bright); color:var(--ink);}
  .btn-primary:hover{box-shadow:0 8px 24px rgba(47,217,168,.35); transform:translateY(-1px);}
  .btn-ghost{background:transparent; color:var(--paper2); border:1px solid rgba(255,255,255,.25);}
  .btn-ghost:hover{border-color:rgba(255,255,255,.6);}
  .btn-dark{background:var(--ink); color:var(--paper2);}
  .btn-dark:hover{background:#050a10;}
  .btn-block{width:100%;}
  .pill{display:inline-flex; align-items:center; gap:6px; padding:6px 14px; border-radius:999px; font-size:12.5px; font-weight:600; background:rgba(47,217,168,.12); color:var(--primary); border:1px solid rgba(20,122,107,.18);}

  .nav{position:sticky; top:0; z-index:50; background:rgba(11,20,32,.72); backdrop-filter:blur(14px); border-bottom:1px solid rgba(255,255,255,.06);}
  .nav .wrap{display:flex; align-items:center; justify-content:space-between; height:76px;}
  .brand{display:flex; align-items:center; gap:10px; color:var(--paper2); font-family:'Space Grotesk'; font-weight:700; font-size:19px;}
  .brand svg{flex-shrink:0;}
  .nav-links{display:flex; align-items:center; gap:32px;}
  .nav-links a{color:rgba(255,255,255,.75); font-size:14.5px; font-weight:500; transition:color .15s;}
  .nav-links a:hover{color:#fff;}
  .nav-actions{display:flex; align-items:center; gap:14px;}

  .hero{background:radial-gradient(ellipse 900px 500px at 18% -10%, #133C33 0%, transparent 60%), var(--ink); color:var(--paper2); padding:100px 0 140px; position:relative; overflow:hidden;}
  .hero .wrap{display:grid; grid-template-columns:1.05fr .95fr; gap:40px; align-items:center;}
  .eyebrow{display:inline-flex; align-items:center; gap:8px; margin-bottom:22px; color:var(--primary-bright); font-size:13px; font-weight:600; letter-spacing:.04em; text-transform:uppercase;}
  .eyebrow .dot{width:7px; height:7px; border-radius:50%; background:var(--primary-bright); box-shadow:0 0 0 4px rgba(47,217,168,.18); animation:pulse 2s infinite;}
  @keyframes pulse{0%,100%{opacity:1;}50%{opacity:.4;}}
  .hero h1{font-size:56px; line-height:1.04; font-weight:700; max-width:620px;}
  .hero h1 em{font-style:normal; color:var(--primary-bright);}
  .hero p.lead{margin-top:22px; font-size:17.5px; color:rgba(255,255,255,.62); max-width:460px; line-height:1.6;}
  .hero-cta{display:flex; gap:14px; margin-top:34px;}
  .trust-row{display:flex; gap:34px; margin-top:56px; flex-wrap:wrap;}
  .trust-row div b{display:block; font-family:'Space Grotesk'; font-size:24px; color:#fff;}
  .trust-row div span{font-size:12.5px; color:rgba(255,255,255,.5);}

  .phone-stage{position:relative; display:flex; justify-content:center; align-items:center; height:560px;}
  .radar{position:absolute; width:520px; height:520px; border-radius:50%; border:1px solid rgba(47,217,168,.14);}
  .radar::before,.radar::after{content:'';position:absolute; inset:60px; border-radius:50%; border:1px solid rgba(47,217,168,.12);}
  .radar::after{inset:120px;}
  .radar-sweep{position:absolute; inset:0; border-radius:50%; overflow:hidden; -webkit-mask-image:radial-gradient(circle,#000 60%,transparent 100%);}
  .radar-sweep i{position:absolute; top:0; left:50%; width:50%; height:50%; transform-origin:0 100%; background:conic-gradient(from 0deg, rgba(47,217,168,.35), transparent 40%); animation:spin 4s linear infinite;}
  @keyframes spin{to{transform:rotate(360deg);}}
  .phone{position:relative; width:280px; height:560px; border-radius:38px; background:var(--ink2); border:6px solid #1E2E3F; box-shadow:0 40px 80px -20px rgba(0,0,0,.7); padding:18px; z-index:2;}
  .phone .screen-head{display:flex; justify-content:space-between; align-items:center; color:rgba(255,255,255,.5); font-size:11px; margin-bottom:22px;}
  .phone .greet{color:rgba(255,255,255,.55); font-size:12.5px;}
  .phone .name{color:#fff; font-size:16px; font-weight:600; margin-top:2px;}
  .balance-card{margin-top:18px; padding:20px; border-radius:18px; background:linear-gradient(135deg,#17594E,#0E3830); position:relative; overflow:hidden;}
  .balance-card::after{content:'';position:absolute; width:140px; height:140px; background:radial-gradient(circle,rgba(47,217,168,.35),transparent 70%); top:-50px; right:-40px;}
  .balance-card .lbl{color:rgba(255,255,255,.6); font-size:11.5px;}
  .balance-card .amt{color:#fff; font-family:'Space Grotesk'; font-size:30px; font-weight:700; margin-top:6px;}
  .balance-card .chg{color:var(--primary-bright); font-size:12px; margin-top:8px; display:inline-flex; align-items:center; gap:4px;}

  .login-shell{min-height:100vh; display:grid; grid-template-columns:1fr 1fr;}
  .login-side{background:radial-gradient(ellipse 700px 500px at 30% 20%, #133C33 0%, transparent 60%), var(--ink); color:#fff; padding:56px; display:flex; flex-direction:column; justify-content:space-between; position:relative; overflow:hidden;}
  .login-side .quote{max-width:380px;}
  .login-side .quote p{font-family:'Space Grotesk'; font-size:26px; line-height:1.35; font-weight:500;}
  .login-side .quote span{display:block; margin-top:18px; font-size:13px; color:rgba(255,255,255,.5);}
  .login-form-col{display:flex; align-items:center; justify-content:center; padding:40px;}
  .login-box{width:100%; max-width:380px;}
  .login-box h2{font-size:27px; margin-bottom:8px;}
  .login-box .sub{color:var(--muted); font-size:14px; margin-bottom:32px;}
  .field{margin-bottom:18px;}
  .field label{display:block; font-size:12.5px; font-weight:600; margin-bottom:7px; color:var(--text);}
  .field input{width:100%; padding:13px 14px; border-radius:11px; border:1px solid var(--line); background:#fff; font-size:14.5px; font-family:inherit; transition:border-color .15s;}
  .field input:focus{outline:none; border-color:var(--primary);}
  .otp-note{margin-top:22px; padding:13px 15px; background:rgba(20,122,107,.06); border:1px solid rgba(20,122,107,.15); border-radius:11px; font-size:12.5px; color:var(--primary); display:flex; gap:8px;}
  .back-link{position:absolute; top:32px; left:32px; z-index:5; color:rgba(255,255,255,.6); font-size:13px; display:flex; align-items:center; gap:6px;}
  .login-form-col .back-link{color:var(--muted); position:static; margin-bottom:26px; display:inline-flex;}

  .app-shell{display:grid; grid-template-columns:250px 1fr; min-height:100vh; background:var(--paper);}
  .sidebar{background:var(--ink); color:#fff; padding:26px 18px; display:flex; flex-direction:column;}
  .sidebar .brand{padding:8px 10px 30px;}
  .side-nav{flex:1; display:flex; flex-direction:column; gap:2px;}
  .side-nav a{display:flex; align-items:center; gap:12px; padding:11px 14px; border-radius:10px; font-size:14px; color:rgba(255,255,255,.62); font-weight:500;}
  .side-nav a.active{background:rgba(47,217,168,.12); color:#fff;}
  .side-foot{border-top:1px solid rgba(255,255,255,.08); padding-top:16px; margin-top:10px;}
  .side-user{display:flex; align-items:center; gap:10px; padding:8px 10px;}
  .side-user b{font-size:13px; display:block;}
  .side-user span{font-size:11px; color:rgba(255,255,255,.4);}
  .logout-btn{width:100%; margin-top:10px; text-align:left; padding:10px 14px; border-radius:10px; color:rgba(255,255,255,.5); font-size:13px; background:transparent; display:flex; align-items:center; gap:10px;}

  .main{padding:34px 42px 60px; overflow-x:hidden;}
  .topbar{display:flex; justify-content:space-between; align-items:center; margin-bottom:32px;}
  .topbar h1{font-size:23px; font-weight:700;}
  .topbar .date{font-size:13px; color:var(--muted); margin-top:3px;}
  .user-chip{display:flex; align-items:center; gap:10px; background:#fff; border:1px solid var(--line); padding:6px 14px 6px 6px; border-radius:999px;}
  
  .dash-grid{display:grid; grid-template-columns:1.5fr 1fr; gap:24px; margin-bottom:24px;}
  .panel{background:#fff; border:1px solid var(--line); border-radius:var(--radius); padding:26px;}
  .balance-hero{background:linear-gradient(135deg,#17594E,#0B2A24); color:#fff; border-radius:var(--radius); padding:30px; position:relative; overflow:hidden;}
  .balance-hero .amt{font-family:'Space Grotesk'; font-size:42px; font-weight:700; margin-top:14px; position:relative; z-index:1;}
  .side-panels{display:flex; flex-direction:column; gap:24px;}
  .avatar{width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg,var(--primary),var(--gold)); display:flex; align-items:center; justify-content:center; color:#fff; font-size:13px; font-weight:600;}

  @media(max-width:980px){
    .hero .wrap{grid-template-columns:1fr;}
    .phone-stage{display:none;}
    .login-shell{grid-template-columns:1fr;}
    .login-side{display:none;}
    .app-shell{grid-template-columns:1fr;}
    .sidebar{display:none;}
    .dash-grid{grid-template-columns:1fr;}
    .nav-links{display:none;}
  }
</style>
</head>
<body>

<!-- PAGE 1 : LANDING -->
<div id="page-landing" class="page active">
  <nav class="nav">
    <div class="wrap">
      <div class="brand">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M12 2L4 5V11C4 16.5 7.4 20.7 12 22C16.6 20.7 20 16.5 20 11V5L12 2Z" fill="#2FD9A8" fill-opacity="0.18" stroke="#2FD9A8" stroke-width="1.5"/><circle cx="12" cy="11" r="3" stroke="#2FD9A8" stroke-width="1.5"/></svg>
        Vigi-Banque
      </div>
      <div class="nav-links">
        <a href="#features">Fonctionnalités</a>
        <a href="#security">Sécurité</a>
      </div>
      <div class="nav-actions">
        <a href="javascript:void(0)" class="btn btn-primary" onclick="showPage('login')">Accéder à mon espace</a>
      </div>
    </div>
  </nav>

  <header class="hero">
    <div class="wrap">
      <div>
        <div class="eyebrow"><span class="dot"></span> Espace sécurisé · Employés</div>
        <h1>La banque qui <em>veille</em> sur votre argent.</h1>
        <p class="lead">Consultez votre solde, vos transactions et vos fiches de paie en temps réel. Un accès réservé aux employés de l'entreprise.</p>
        <div class="hero-cta">
          <a href="javascript:void(0)" class="btn btn-primary" onclick="showPage('login')">Se connecter</a>
        </div>
      </div>

      <div class="phone-stage">
        <div class="radar"><div class="radar-sweep"><i></i></div></div>
        <div class="phone">
          <div class="screen-head"><span>9:41</span><span>●●●●● Vigi</span></div>
          <div class="greet">Bonjour Employé</div>
          <div class="name">Compte courant</div>
          <div class="balance-card">
            <div class="lbl">Solde disponible</div>
            <div class="amt">1 500 🪙</div>
            <div class="chg">↑ Synchronisé avec l'entreprise</div>
          </div>
        </div>
      </div>
    </div>
  </header>
</div>

<!-- PAGE 2 : LOGIN -->
<div id="page-login" class="page">
  <div class="login-shell">
    <div class="login-side">
      <a href="javascript:void(0)" class="back-link" onclick="showPage('landing')">← Retour au site</a>
      <div class="brand" style="color:#fff;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2L4 5V11C4 16.5 7.4 20.7 12 22C16.6 20.7 20 16.5 20 11V5L12 2Z" fill="#2FD9A8" fill-opacity="0.18" stroke="#2FD9A8" stroke-width="1.5"/><circle cx="12" cy="11" r="3" stroke="#2FD9A8" stroke-width="1.5"/></svg>
        Vigi-Banque
      </div>
      <div class="quote">
        <p>"Toujours un œil sur mes comptes, où que je sois."</p>
        <span>— Espace Employé</span>
      </div>
      <div style="font-size:12px; color:rgba(255,255,255,.35);">🔒 Connexion chiffrée de bout en bout</div>
    </div>

    <div class="login-form-col">
      <div class="login-box">
        <a href="javascript:void(0)" class="back-link" onclick="showPage('landing')">← Retour au site</a>
        <h2>Connexion Employé</h2>
        <p class="sub">Entrez le code d'accès fourni par votre entreprise.</p>

        <form onsubmit="event.preventDefault(); attemptLogin();">
          <div class="field">
            <label>Code d'accès (6 chiffres)</label>
            <input type="text" id="bankCodeInput" maxlength="6" placeholder="••••••" style="text-align: center; letter-spacing: 8px; font-family: 'IBM Plex Mono', monospace; font-size: 22px;" required>
          </div>
          <div id="loginError" style="color: var(--coral); margin-top: 15px; font-size: 13px; display:none;"></div>
          <div style="margin-top: 22px;">
            <button type="submit" class="btn btn-dark btn-block">Se connecter</button>
          </div>
        </form>

        <div class="otp-note">🛡️ Une validation par code à usage unique peut être demandée pour toute connexion inhabituelle.</div>
      </div>
    </div>
  </div>
</div>

<!-- PAGE 3 : DASHBOARD -->
<div id="page-dashboard" class="page">
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand" style="color:#fff;">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2L4 5V11C4 16.5 7.4 20.7 12 22C16.6 20.7 20 16.5 20 11V5L12 2Z" fill="#2FD9A8" fill-opacity="0.18" stroke="#2FD9A8" stroke-width="1.5"/><circle cx="12" cy="11" r="3" stroke="#2FD9A8" stroke-width="1.5"/></svg>
        Vigi-Banque
      </div>
      <nav class="side-nav">
        <a href="javascript:void(0)" class="active"> Accueil</a>
        <a href="javascript:void(0)"> Comptes</a>
        <a href="javascript:void(0)"> Transactions</a>
      </nav>
      <div class="side-foot">
        <div class="side-user">
          <div class="avatar" id="sideAvatar">U</div>
          <div><b id="sideUserName">Employé</b><span id="sideUserPlan">Compte</span></div>
        </div>
        <button class="logout-btn" onclick="logout()"> Se déconnecter</button>
      </div>
    </aside>

    <main class="main">
      <div class="topbar">
        <div>
          <h1 id="dashGreeting">Bonjour 👋</h1>
          <div class="date" id="dashDate"></div>
        </div>
        <div class="user-chip"><div class="avatar" style="width:28px;height:28px;font-size:11px;" id="topAvatar">U</div><b id="topUserChipName">Employé</b></div>
      </div>

      <div class="dash-grid">
        <div class="balance-hero">
          <div class="lbl" style="font-size:12.5px; color:rgba(255,255,255,.55);">Solde disponible</div>
          <div class="amt" id="dashBalance">0 Vigi-Coins</div>
          <div class="chg" style="margin-top:10px; font-size:13px; color:var(--primary-bright);">Synchronisé avec l'entreprise</div>
        </div>

        <div class="panel">
          <h3 style="font-size:15px; font-weight:600; margin-bottom:16px;">Statut du compte</h3>
          <div style="background: #f4f6f5; padding: 15px; border-radius: 12px; margin-bottom: 10px; font-weight: 600;">
            <span id="dashStatus">En attente...</span>
          </div>
          <p style="font-size: 13px; color: var(--muted);">Votre compte est lié à votre statut d'employé actif au sein de l'entreprise.</p>
        </div>
      </div>

      <div class="panel">
        <h3 style="font-size:15px; font-weight:600; margin-bottom:18px;">Transactions récentes</h3>
        <div style="display:flex; align-items:center; gap:14px; padding:13px 0; border-bottom:1px solid var(--line);">
          <div style="width:40px; height:40px; border-radius:12px; background:var(--paper); display:flex; align-items:center; justify-content:center; font-size:17px;">💼</div>
          <div style="flex:1;"><b style="font-size:14px; display:block;">Virement salaire — Entreprise</b><span style="font-size:12px; color:var(--muted);">Synchronisation automatique</span></div>
          <div style="font-family:'IBM Plex Mono'; color:var(--primary); font-weight:500;">+ Virement</div>
        </div>
        <div style="display:flex; align-items:center; gap:14px; padding:13px 0;">
          <div style="width:40px; height:40px; border-radius:12px; background:var(--paper); display:flex; align-items:center; justify-content:center; font-size:17px;">🚀</div>
          <div style="flex:1;"><b style="font-size:14px; display:block;">Boutique (Bientôt)</b><span style="font-size:12px; color:var(--muted);">En cours de développement</span></div>
          <div style="font-family:'IBM Plex Mono'; color:var(--muted);">WIP</div>
        </div>
      </div>
    </main>
  </div>
</div>

<script>
  function showPage(name){
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + name).classList.add('active');
    window.scrollTo(0,0);
  }

  function logout() {
    document.getElementById('bankCodeInput').value = '';
    showPage('login');
  }

  async function attemptLogin() {
    const code = document.getElementById('bankCodeInput').value;
    const errorDiv = document.getElementById('loginError');
    
    if (code.length !== 6) {
      errorDiv.innerText = 'Le code doit comporter 6 chiffres.';
      errorDiv.style.display = 'block';
      return;
    }

    errorDiv.style.display = 'none';

    try {
      const res = await fetch('/api/bank/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const data = await res.json();

      if (data.success) {
        document.getElementById('dashBalance').innerText = data.balance.toLocaleString('fr-FR') + ' Vigi-Coins';
        
        const name = data.username || 'Employé';
        const initial = name.charAt(0).toUpperCase();
        
        document.getElementById('dashGreeting').innerText = 'Bonjour, ' + name + ' 👋';
        document.getElementById('sideUserName').innerText = name;
        document.getElementById('topUserChipName').innerText = name;
        document.getElementById('sideAvatar').innerText = initial;
        document.getElementById('topAvatar').innerText = initial;
        
        const planName = data.stage === 'confirmed' ? 'Titulaire' : (data.stage === 'trainee' ? 'En formation' : 'Non employé');
        document.getElementById('sideUserPlan').innerText = planName;
        document.getElementById('dashStatus').innerText = planName;

        const now = new Date();
        document.getElementById('dashDate').innerText = now.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        showPage('dashboard');
      } else {
        errorDiv.innerText = data.message || 'Code invalide.';
        errorDiv.style.display = 'block';
      }
    } catch (err) {
      errorDiv.innerText = 'Erreur réseau.';
      errorDiv.style.display = 'block';
    }
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
