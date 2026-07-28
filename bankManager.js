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
  .side
