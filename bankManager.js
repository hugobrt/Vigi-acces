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
<title>Vigi-Banque — La banque qui veille sur votre argent</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root{
    --ink:#0B1420;
    --ink2:#101C2B;
    --ink3:#182739;
    --paper:#F2F4F3;
    --paper2:#FFFFFF;
    --primary:#147A6B;
    --primary-bright:#2FD9A8;
    --gold:#D6A94E;
    --coral:#E2543E;
    --text:#101820;
    --muted:#66727C;
    --muted-lt:#9AA6AD;
    --line:#E2E6E5;
    --line-dark:#25384A;
    --radius:16px;
  }
  *{box-sizing:border-box; margin:0; padding:0;}
  html{scroll-behavior:smooth;}
  body{
    font-family:'Inter',sans-serif;
    color:var(--text);
    background:var(--paper);
    -webkit-font-smoothing:antialiased;
    overflow-x:hidden;
  }
  h1,h2,h3,h4{font-family:'Space Grotesk',sans-serif; letter-spacing:-0.02em;}
  .mono{font-family:'IBM Plex Mono',monospace;}
  a{color:inherit; text-decoration:none;}
  button{font-family:inherit; cursor:pointer; border:none;}
  ul{list-style:none;}
  img{max-width:100%; display:block;}
  .page{display:none;}
  .page.active{display:block;}
  ::selection{background:var(--primary-bright); color:var(--ink);}

  /* ---------- utility ---------- */
  .wrap{max-width:1180px; margin:0 auto; padding:0 32px;}
  .btn{
    display:inline-flex; align-items:center; justify-content:center; gap:8px;
    padding:13px 24px; border-radius:999px; font-weight:600; font-size:14.5px;
    transition:transform .18s ease, box-shadow .18s ease, background .18s ease;
    white-space:nowrap;
  }
  .btn:active{transform:scale(.97);}
  .btn-primary{background:var(--primary-bright); color:var(--ink);}
  .btn-primary:hover{box-shadow:0 8px 24px rgba(47,217,168,.35); transform:translateY(-1px);}
  .btn-ghost{background:transparent; color:var(--paper2); border:1px solid rgba(255,255,255,.25);}
  .btn-ghost:hover{border-color:rgba(255,255,255,.6);}
  .btn-dark{background:var(--ink); color:var(--paper2);}
  .btn-dark:hover{background:#050a10;}
  .btn-outline{background:transparent; border:1px solid var(--line); color:var(--text);}
  .btn-outline:hover{border-color:var(--text);}
  .btn-block{width:100%;}
  .pill{
    display:inline-flex; align-items:center; gap:6px;
    padding:6px 14px; border-radius:999px; font-size:12.5px; font-weight:600;
    background:rgba(47,217,168,.12); color:var(--primary);
    border:1px solid rgba(20,122,107,.18);
  }

  /* ================= NAVBAR (landing) ================= */
  .nav{
    position:sticky; top:0; z-index:50;
    background:rgba(11,20,32,.72); backdrop-filter:blur(14px);
    border-bottom:1px solid rgba(255,255,255,.06);
  }
  .nav .wrap{display:flex; align-items:center; justify-content:space-between; height:76px;}
  .brand{display:flex; align-items:center; gap:10px; color:var(--paper2); font-family:'Space Grotesk'; font-weight:700; font-size:19px;}
  .brand svg{flex-shrink:0;}
  .nav-links{display:flex; align-items:center; gap:32px;}
  .nav-links a{color:rgba(255,255,255,.75); font-size:14.5px; font-weight:500; transition:color .15s;}
  .nav-links a:hover{color:#fff;}
  .nav-actions{display:flex; align-items:center; gap:14px;}

  /* ================= HERO ================= */
  .hero{
    background:radial-gradient(ellipse 900px 500px at 18% -10%, #133C33 0%, transparent 60%), var(--ink);
    color:var(--paper2); padding:100px 0 140px; position:relative; overflow:hidden;
  }
  .hero .wrap{display:grid; grid-template-columns:1.05fr .95fr; gap:40px; align-items:center;}
  .eyebrow{
    display:inline-flex; align-items:center; gap:8px; margin-bottom:22px;
    color:var(--primary-bright); font-size:13px; font-weight:600; letter-spacing:.04em; text-transform:uppercase;
  }
  .eyebrow .dot{width:7px; height:7px; border-radius:50%; background:var(--primary-bright); box-shadow:0 0 0 4px rgba(47,217,168,.18); animation:pulse 2s infinite;}
  @keyframes pulse{0%,100%{opacity:1;}50%{opacity:.4;}}
  .hero h1{font-size:56px; line-height:1.04; font-weight:700; max-width:620px;}
  .hero h1 em{font-style:normal; color:var(--primary-bright);}
  .hero p.lead{margin-top:22px; font-size:17.5px; color:rgba(255,255,255,.62); max-width:460px; line-height:1.6;}
  .hero-cta{display:flex; gap:14px; margin-top:34px;}
  .trust-row{display:flex; gap:34px; margin-top:56px; flex-wrap:wrap;}
  .trust-row div b{display:block; font-family:'Space Grotesk'; font-size:24px; color:#fff;}
  .trust-row div span{font-size:12.5px; color:rgba(255,255,255,.5);}

  /* phone mockup */
  .phone-stage{position:relative; display:flex; justify-content:center; align-items:center; height:560px;}
  .radar{position:absolute; width:520px; height:520px; border-radius:50%; border:1px solid rgba(47,217,168,.14);}
  .radar::before,.radar::after{content:'';position:absolute; inset:60px; border-radius:50%; border:1px solid rgba(47,217,168,.12);}
  .radar::after{inset:120px;}
  .radar-sweep{
    position:absolute; inset:0; border-radius:50%; overflow:hidden;
    -webkit-mask-image:radial-gradient(circle,#000 60%,transparent 100%);
  }
  .radar-sweep i{
    position:absolute; top:0; left:50%; width:50%; height:50%; transform-origin:0 100%;
    background:conic-gradient(from 0deg, rgba(47,217,168,.35), transparent 40%);
    animation:spin 4s linear infinite;
  }
  @keyframes spin{to{transform:rotate(360deg);}}
  .phone{
    position:relative; width:280px; height:560px; border-radius:38px; background:var(--ink2);
    border:6px solid #1E2E3F; box-shadow:0 40px 80px -20px rgba(0,0,0,.7); padding:18px; z-index:2;
  }
  .phone .screen-head{display:flex; justify-content:space-between; align-items:center; color:rgba(255,255,255,.5); font-size:11px; margin-bottom:22px;}
  .phone .greet{color:rgba(255,255,255,.55); font-size:12.5px;}
  .phone .name{color:#fff; font-size:16px; font-weight:600; margin-top:2px;}
  .balance-card{
    margin-top:18px; padding:20px; border-radius:18px;
    background:linear-gradient(135deg,#17594E,#0E3830);
    position:relative; overflow:hidden;
  }
  .balance-card::after{content:'';position:absolute; width:140px; height:140px; background:radial-gradient(circle,rgba(47,217,168,.35),transparent 70%); top:-50px; right:-40px;}
  .balance-card .lbl{color:rgba(255,255,255,.6); font-size:11.5px;}
  .balance-card .amt{color:#fff; font-family:'Space Grotesk'; font-size:30px; font-weight:700; margin-top:6px;}
  .balance-card .chg{color:var(--primary-bright); font-size:12px; margin-top:8px; display:inline-flex; align-items:center; gap:4px;}
  .mini-row{display:flex; gap:10px; margin-top:16px;}
  .mini-btn{flex:1; background:rgba(255,255,255,.06); border-radius:12px; padding:10px 0; text-align:center; color:#fff; font-size:11px;}
  .mini-tx{margin-top:20px; display:flex; flex-direction:column; gap:12px;}
  .mini-tx-row{display:flex; align-items:center; gap:10px;}
  .mini-tx-ico{width:32px; height:32px; border-radius:10px; background:rgba(255,255,255,.08); display:flex; align-items:center; justify-content:center; font-size:14px;}
  .mini-tx-row .meta{flex:1;}
  .mini-tx-row .meta b{display:block; color:#fff; font-size:12.5px; font-weight:500;}
  .mini-tx-row .meta span{color:rgba(255,255,255,.4); font-size:10.5px;}
  .mini-tx-row .val{font-size:12.5px; font-family:'IBM Plex Mono';}
  .val.neg{color:rgba(255,255,255,.7);}
  .val.pos{color:var(--primary-bright);}

  /* ================= SECTIONS shared ================= */
  section{padding:96px 0;}
  .section-head{max-width:560px; margin-bottom:56px;}
  .section-head .eyebrow{color:var(--primary); }
  .section-head .eyebrow .dot{background:var(--primary); box-shadow:0 0 0 4px rgba(20,122,107,.15);}
  .section-head h2{font-size:38px; font-weight:700; line-height:1.15;}
  .section-head p{margin-top:14px; color:var(--muted); font-size:16px; line-height:1.6;}
  .dark{background:var(--ink); color:var(--paper2);}
  .dark .muted{color:rgba(255,255,255,.55);}

  /* features grid */
  .feat-grid{display:grid; grid-template-columns:repeat(3,1fr); gap:1px; background:var(--line); border:1px solid var(--line); border-radius:var(--radius); overflow:hidden;}
  .feat{background:var(--paper2); padding:34px 30px;}
  .feat .ico{width:42px; height:42px; border-radius:12px; background:rgba(20,122,107,.1); display:flex; align-items:center; justify-content:center; margin-bottom:20px;}
  .feat h3{font-size:17px; font-weight:600; margin-bottom:8px;}
  .feat p{font-size:14px; color:var(--muted); line-height:1.55;}

  /* cards showcase */
  .cards-wrap{display:grid; grid-template-columns:repeat(3,1fr); gap:26px;}
  .card-tile{border-radius:20px; padding:26px; height:250px; position:relative; display:flex; flex-direction:column; justify-content:space-between; color:#fff; overflow:hidden;}
  .card-tile .brand-mark{font-family:'Space Grotesk'; font-weight:700; font-size:13px; letter-spacing:.03em; display:flex; align-items:center; gap:6px;}
  .card-tile .num{font-family:'IBM Plex Mono'; font-size:15px; letter-spacing:.06em;}
  .card-tile .foot{display:flex; justify-content:space-between; align-items:flex-end; font-size:11px;}
  .card-tile .chip{width:34px; height:26px; border-radius:6px; background:linear-gradient(135deg,#e8d48b,#c9a94a); margin-bottom:14px;}
  .c1{background:linear-gradient(135deg,#101C2B,#0B1420);}
  .c2{background:linear-gradient(135deg,#17594E,#0B2A24);}
  .c3{background:linear-gradient(135deg,#3A3020,#1c160c);}
  .c3 .chip{background:linear-gradient(135deg,#f1e2b0,var(--gold));}
  .plan-name{font-size:12px; color:rgba(255,255,255,.55); margin-top:4px;}

  /* security */
  .sec-grid{display:grid; grid-template-columns:.9fr 1.1fr; gap:60px; align-items:center;}
  .sec-list li{display:flex; gap:16px; padding:20px 0; border-bottom:1px solid rgba(255,255,255,.08);}
  .sec-list li:last-child{border-bottom:none;}
  .sec-list .n{font-family:'IBM Plex Mono'; color:var(--primary-bright); font-size:13px; padding-top:2px;}
  .sec-list h4{font-size:15.5px; font-weight:600; margin-bottom:4px;}
  .sec-list p{font-size:13.5px; color:rgba(255,255,255,.5); line-height:1.5;}
  .shield-visual{
    aspect-ratio:1; border-radius:28px; background:var(--ink2); border:1px solid var(--line-dark);
    display:flex; align-items:center; justify-content:center; position:relative;
  }
  .shield-visual svg{width:44%; height:44%;}

  /* testimonials */
  .testi-grid{display:grid; grid-template-columns:repeat(3,1fr); gap:24px;}
  .testi{background:var(--paper2); border:1px solid var(--line); border-radius:var(--radius); padding:28px;}
  .testi p{font-size:14.5px; line-height:1.6; color:var(--text); margin-bottom:20px;}
  .testi .who{display:flex; align-items:center; gap:10px;}
  .avatar{width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg,var(--primary),var(--gold)); display:flex; align-items:center; justify-content:center; color:#fff; font-size:13px; font-weight:600;}
  .who b{font-size:13.5px; display:block;}
  .who span{font-size:11.5px; color:var(--muted);}

  /* cta band */
  .cta-band{background:linear-gradient(135deg,#0E3830,#0B1420); border-radius:28px; padding:70px 60px; display:flex; justify-content:space-between; align-items:center; color:#fff;}
  .cta-band h2{font-size:32px; max-width:420px;}
  .cta-band p{color:rgba(255,255,255,.55); margin-top:10px;}

  /* footer */
  footer{background:var(--ink); color:rgba(255,255,255,.55); padding:70px 0 30px;}
  .foot-grid{display:grid; grid-template-columns:1.4fr repeat(4,1fr); gap:30px; padding-bottom:50px; border-bottom:1px solid rgba(255,255,255,.08);}
  .foot-grid h5{color:#fff; font-size:13px; margin-bottom:16px; font-weight:600;}
  .foot-grid li{margin-bottom:10px; font-size:13.5px;}
  .foot-grid li a:hover{color:#fff;}
  .foot-bottom{padding-top:26px; display:flex; justify-content:space-between; font-size:12px; flex-wrap:wrap; gap:10px;}
  .foot-note{font-size:11.5px; color:rgba(255,255,255,.3); max-width:560px; margin-top:14px; line-height:1.6;}

  /* ================= LOGIN PAGE ================= */
  .login-shell{min-height:100vh; display:grid; grid-template-columns:1fr 1fr;}
  .login-side{
    background:radial-gradient(ellipse 700px 500px at 30% 20%, #133C33 0%, transparent 60%), var(--ink);
    color:#fff; padding:56px; display:flex; flex-direction:column; justify-content:space-between; position:relative; overflow:hidden;
  }
  .login-side .quote{max-width:380px;}
  .login-side .quote p{font-family:'Space Grotesk'; font-size:26px; line-height:1.35; font-weight:500;}
  .login-side .quote span{display:block; margin-top:18px; font-size:13px; color:rgba(255,255,255,.5);}
  .login-form-col{display:flex; align-items:center; justify-content:center; padding:40px;}
  .login-box{width:100%; max-width:380px;}
  .login-box h2{font-size:27px; margin-bottom:8px;}
  .login-box .sub{color:var(--muted); font-size:14px; margin-bottom:32px;}
  .field{margin-bottom:18px;}
  .field label{display:block; font-size:12.5px; font-weight:600; margin-bottom:7px; color:var(--text);}
  .field input{
    width:100%; padding:13px 14px; border-radius:11px; border:1px solid var(--line); background:#fff;
    font-size:14.5px; font-family:inherit; transition:border-color .15s;
  }
  .field input:focus{outline:none; border-color:var(--primary);}
  .field-row{display:flex; justify-content:space-between; align-items:center; margin-bottom:22px; font-size:13px;}
  .checky{display:flex; align-items:center; gap:7px; color:var(--muted);}
  .link-sm{color:var(--primary); font-weight:600;}
  .divider{display:flex; align-items:center; gap:12px; margin:26px 0; color:var(--muted-lt); font-size:12px;}
  .divider::before,.divider::after{content:'';flex:1; height:1px; background:var(--line);}
  .otp-note{margin-top:22px; padding:13px 15px; background:rgba(20,122,107,.06); border:1px solid rgba(20,122,107,.15); border-radius:11px; font-size:12.5px; color:var(--primary); display:flex; gap:8px;}
  .signup-note{text-align:center; margin-top:26px; font-size:13.5px; color:var(--muted);}
  .demo-note{text-align:center; margin-top:10px; font-size:11.5px; color:var(--muted-lt);}
  .back-link{position:absolute; top:32px; left:32px; z-index:5; color:rgba(255,255,255,.6); font-size:13px; display:flex; align-items:center; gap:6px;}
  .login-form-col .back-link{color:var(--muted); position:static; margin-bottom:26px; display:inline-flex;}

  /* ================= DASHBOARD ================= */
  .app-shell{display:grid; grid-template-columns:250px 1fr; min-height:100vh; background:var(--paper);}
  .sidebar{background:var(--ink); color:#fff; padding:26px 18px; display:flex; flex-direction:column;}
  .sidebar .brand{padding:8px 10px 30px;}
  .side-nav{flex:1; display:flex; flex-direction:column; gap:2px;}
  .side-nav a{display:flex; align-items:center; gap:12px; padding:11px 14px; border-radius:10px; font-size:14px; color:rgba(255,255,255,.62); font-weight:500;}
  .side-nav a svg{opacity:.75; flex-shrink:0;}
  .side-nav a.active{background:rgba(47,217,168,.12); color:#fff;}
  .side-nav a.active svg{opacity:1;}
  .side-nav a:hover:not(.active){background:rgba(255,255,255,.05); color:#fff;}
  .side-foot{border-top:1px solid rgba(255,255,255,.08); padding-top:16px; margin-top:10px;}
  .side-user{display:flex; align-items:center; gap:10px; padding:8px 10px;}
  .side-user b{font-size:13px; display:block;}
  .side-user span{font-size:11px; color:rgba(255,255,255,.4);}
  .logout-btn{width:100%; margin-top:10px; text-align:left; padding:10px 14px; border-radius:10px; color:rgba(255,255,255,.5); font-size:13px; background:transparent; display:flex; align-items:center; gap:10px;}
  .logout-btn:hover{background:rgba(226,84,62,.12); color:#ff8a76;}

  .main{padding:34px 42px 60px; overflow-x:hidden;}
  .topbar{display:flex; justify-content:space-between; align-items:center; margin-bottom:32px;}
  .topbar h1{font-size:23px; font-weight:700;}
  .topbar .date{font-size:13px; color:var(--muted); margin-top:3px;}
  .top-actions{display:flex; align-items:center; gap:14px;}
  .icon-btn{width:40px; height:40px; border-radius:12px; background:#fff; border:1px solid var(--line); display:flex; align-items:center; justify-content:center; position:relative;}
  .icon-btn .dot{position:absolute; top:9px; right:9px; width:7px; height:7px; border-radius:50%; background:var(--coral); border:2px solid var(--paper);}
  .user-chip{display:flex; align-items:center; gap:10px; background:#fff; border:1px solid var(--line); padding:6px 14px 6px 6px; border-radius:999px;}
  .user-chip b{font-size:13px;}

  .dash-grid{display:grid; grid-template-columns:1.5fr 1fr; gap:24px; margin-bottom:24px;}
  .panel{background:#fff; border:1px solid var(--line); border-radius:var(--radius); padding:26px;}
  .balance-hero{
    background:linear-gradient(135deg,#17594E,#0B2A24); color:#fff; border-radius:var(--radius); padding:30px;
    position:relative; overflow:hidden;
  }
  .balance-hero::after{content:'';position:absolute; width:220px; height:220px; background:radial-gradient(circle,rgba(47,217,168,.28),transparent 70%); top:-80px; right:-60px;}
  .balance-hero .top-row{display:flex; justify-content:space-between; align-items:flex-start; position:relative; z-index:1;}
  .balance-hero .lbl{font-size:12.5px; color:rgba(255,255,255,.55);}
  .balance-hero .iban{font-family:'IBM Plex Mono'; font-size:12px; color:rgba(255,255,255,.4); margin-top:4px;}
  .balance-hero .amt{font-family:'Space Grotesk'; font-size:42px; font-weight:700; margin-top:14px; position:relative; z-index:1;}
  .balance-hero .chg{margin-top:10px; font-size:13px; color:var(--primary-bright); display:flex; align-items:center; gap:6px; position:relative; z-index:1;}
  .quick-actions{display:flex; gap:12px; margin-top:26px; position:relative; z-index:1;}
  .qa-btn{flex:1; background:rgba(255,255,255,.08); border-radius:12px; padding:14px 8px; text-align:center; color:#fff; font-size:12px; display:flex; flex-direction:column; align-items:center; gap:8px; transition:background .15s;}
  .qa-btn:hover{background:rgba(255,255,255,.16);}

  .side-panels{display:flex; flex-direction:column; gap:24px;}
  .mini-card-visual{border-radius:16px; padding:20px; height:120px; background:linear-gradient(135deg,#101C2B,#0B1420); color:#fff; display:flex; flex-direction:column; justify-content:space-between; position:relative; overflow:hidden;}
  .mini-card-visual .num{font-family:'IBM Plex Mono'; font-size:13px; letter-spacing:.05em;}
  .mini-card-visual .row{display:flex; justify-content:space-between; align-items:flex-end; font-size:10px; color:rgba(255,255,255,.5);}
  .panel h3{font-size:15px; font-weight:600; margin-bottom:4px;}
  .panel .sub{font-size:12.5px; color:var(--muted); margin-bottom:16px;}
  .goal-bar{height:8px; border-radius:6px; background:var(--paper); overflow:hidden; margin:10px 0 8px;}
  .goal-bar i{display:block; height:100%; background:linear-gradient(90deg,var(--primary),var(--primary-bright)); border-radius:6px;}
  .goal-foot{display:flex; justify-content:space-between; font-size:12px; color:var(--muted);}

  .panel-head{display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;}
  .panel-head h3{margin:0;}
  .see-all{font-size:12.5px; color:var(--primary); font-weight:600;}

  .tx-row{display:flex; align-items:center; gap:14px; padding:13px 0; border-bottom:1px solid var(--line);}
  .tx-row:last-child{border-bottom:none;}
  .tx-ico{width:40px; height:40px; border-radius:12px; background:var(--paper); display:flex; align-items:center; justify-content:center; font-size:17px; flex-shrink:0;}
  .tx-meta{flex:1; min-width:0;}
  .tx-meta b{font-size:14px; font-weight:500; display:block;}
  .tx-meta span{font-size:12px; color:var(--muted);}
  .tx-amt{font-family:'IBM Plex Mono'; font-size:14px; font-weight:500; text-align:right;}
  .tx-amt.neg{color:var(--text);}
  .tx-amt.pos{color:var(--primary);}
  .tx-cat{font-size:10.5px; color:var(--muted-lt); text-align:right; margin-top:2px;}

  .chart-panel{margin-top:24px;}
  .bars{display:flex; align-items:flex-end; gap:14px; height:150px; margin-top:20px;}
  .bar-col{flex:1; display:flex; flex-direction:column; align-items:center; gap:10px; height:100%; justify-content:flex-end;}
  .bar-col .bar{width:100%; border-radius:8px 8px 4px 4px; background:linear-gradient(180deg,var(--primary-bright),var(--primary));}
  .bar-col span{font-size:11px; color:var(--muted);}

  .donut-wrap{display:flex; align-items:center; gap:24px; margin-top:10px;}
  .legend li{display:flex; align-items:center; gap:8px; font-size:12.5px; margin-bottom:10px; color:var(--muted);}
  .legend i{width:9px; height:9px; border-radius:3px; flex-shrink:0;}
  .legend b{color:var(--text); margin-left:auto; font-family:'IBM Plex Mono'; font-weight:500;}

  @media(max-width:980px){
    .hero .wrap{grid-template-columns:1fr;}
    .phone-stage{display:none;}
    .feat-grid{grid-template-columns:1fr;}
    .cards-wrap{grid-template-columns:1fr;}
    .sec-grid{grid-template-columns:1fr;}
    .testi-grid{grid-template-columns:1fr;}
    .login-shell{grid-template-columns:1fr;}
    .login-side{display:none;}
    .app-shell{grid-template-columns:1fr;}
    .sidebar{display:none;}
    .dash-grid{grid-template-columns:1fr;}
    .nav-links{display:none;}
    .cta-band{flex-direction:column; align-items:flex-start; gap:24px;}
  }
</style>
</head>
<body>

<!-- ============================================================ -->
<!-- PAGE 1 : LANDING -->
<!-- ============================================================ -->
<div id="page-landing" class="page active">

  <nav class="nav">
    <div class="wrap">
      <div class="brand">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M12 2L4 5V11C4 16.5 7.4 20.7 12 22C16.6 20.7 20 16.5 20 11V5L12 2Z" fill="#2FD9A8" fill-opacity="0.18" stroke="#2FD9A8" stroke-width="1.5"/><circle cx="12" cy="11" r="3" stroke="#2FD9A8" stroke-width="1.5"/></svg>
        Vigi-Banque
      </div>
      <div class="nav-links">
        <a href="#features">Fonctionnalités</a>
        <a href="#cards">Cartes</a>
        <a href="#security">Sécurité</a>
        <a href="#testimonials">Avis</a>
      </div>
      <div class="nav-actions">
        <a href="javascript:void(0)" class="btn btn-ghost" onclick="showPage('login')">Se connecter</a>
        <a href="javascript:void(0)" class="btn btn-primary" onclick="showPage('login')">Ouvrir un compte</a>
      </div>
    </div>
  </nav>

  <header class="hero">
    <div class="wrap">
      <div>
        <div class="eyebrow"><span class="dot"></span> Agréée établissement de paiement · Fonds protégés</div>
        <h1>La banque qui <em>veille</em> sur votre argent, jour et nuit.</h1>
        <p class="lead">Compte courant, cartes virtuelles et surveillance des dépenses en temps réel — ouvert en 4 minutes, sans paperasse et sans frais cachés.</p>
        <div class="hero-cta">
          <a href="javascript:void(0)" class="btn btn-primary" onclick="showPage('login')">Ouvrir un compte gratuit</a>
          <a href="javascript:void(0)" class="btn btn-ghost" onclick="showPage('login')">J'ai déjà un compte</a>
        </div>
        <div class="trust-row">
          <div><b>210 000+</b><span>clients actifs</span></div>
          <div><b>0 €</b><span>de frais de tenue de compte</span></div>
          <div><b>24/7</b><span>surveillance anti-fraude</span></div>
          <div><b>4.8/5</b><span>note moyenne</span></div>
        </div>
      </div>

      <div class="phone-stage">
        <div class="radar"><div class="radar-sweep"><i></i></div></div>
        <div class="phone">
          <div class="screen-head"><span>9:41</span><span>●●●●● Vigi</span></div>
          <div class="greet">Bonjour Camille</div>
          <div class="name">Compte courant</div>
          <div class="balance-card">
            <div class="lbl">Solde disponible</div>
            <div class="amt">2 847,30 €</div>
            <div class="chg">↑ +312,40 € ce mois-ci</div>
          </div>
          <div class="mini-row">
            <div class="mini-btn">↗<br>Envoyer</div>
            <div class="mini-btn">↙<br>Recevoir</div>
            <div class="mini-btn">⏻<br>Bloquer</div>
          </div>
          <div class="mini-tx">
            <div class="mini-tx-row"><div class="mini-tx-ico">🛒</div><div class="meta"><b>Carrefour City</b><span>Aujourd'hui, 12:04</span></div><div class="val neg">-24,80 €</div></div>
            <div class="mini-tx-row"><div class="mini-tx-ico">💼</div><div class="meta"><b>Virement salaire</b><span>Hier, 08:02</span></div><div class="val pos">+1 950,00 €</div></div>
            <div class="mini-tx-row"><div class="mini-tx-ico">🎬</div><div class="meta"><b>Netflix</b><span>Hier, 09:15</span></div><div class="val neg">-13,49 €</div></div>
          </div>
        </div>
      </div>
    </div>
  </header>

  <section id="features">
    <div class="wrap">
      <div class="section-head">
        <div class="eyebrow"><span class="dot"></span> Fonctionnalités</div>
        <h2>Tout ce qu'il faut, rien de superflu.</h2>
        <p>Un compte pensé pour donner de la visibilité sur votre argent, sans jargon bancaire ni frais surprise.</p>
      </div>
      <div class="feat-grid">
        <div class="feat"><div class="ico">💳</div><h3>Cartes virtuelles illimitées</h3><p>Générez une carte à usage unique pour chaque achat en ligne et gardez le contrôle total sur vos dépenses.</p></div>
        <div class="feat"><div class="ico">📊</div><h3>Analyse des dépenses</h3><p>Chaque transaction est classée automatiquement par catégorie pour une vision claire de votre budget.</p></div>
        <div class="feat"><div class="ico">🔔</div><h3>Alertes en temps réel</h3><p>Une notification instantanée à chaque mouvement sur votre compte, sans exception.</p></div>
        <div class="feat"><div class="ico">🌍</div><h3>Paiements à l'étranger</h3><p>Payez au taux de change réel, sans commission cachée, dans plus de 130 devises.</p></div>
        <div class="feat"><div class="ico">🐷</div><h3>Cagnottes automatiques</h3><p>Arrondissez vos achats et mettez la différence de côté sans y penser.</p></div>
        <div class="feat"><div class="ico">🔒</div><h3>Verrouillage instantané</h3><p>Bloquez ou débloquez votre carte en un tap en cas de doute.</p></div>
      </div>
    </div>
  </section>

  <section id="cards" class="dark">
    <div class="wrap">
      <div class="section-head">
        <div class="eyebrow"><span class="dot" style="background:#2FD9A8"></span> Cartes</div>
        <h2>Une carte pour chaque usage.</h2>
        <p class="muted">Du quotidien au voyage, choisissez la formule adaptée à votre rythme de vie.</p>
      </div>
      <div class="cards-wrap">
        <div class="card-tile c1">
          <div class="brand-mark">VIGI · STANDARD</div>
          <div><div class="chip"></div><div class="num">•••• •••• •••• 4821</div></div>
          <div class="foot"><span>C. BERTRAND</span><span>09/29</span></div>
        </div>
        <div class="card-tile c2">
          <div class="brand-mark">VIGI · PREMIUM</div>
          <div><div class="chip"></div><div class="num">•••• •••• •••• 7734</div></div>
          <div class="foot"><span>C. BERTRAND</span><span>03/30</span></div>
        </div>
        <div class="card-tile c3">
          <div class="brand-mark">VIGI · METAL</div>
          <div><div class="chip"></div><div class="num">•••• •••• •••• 1190</div></div>
          <div class="foot"><span>C. BERTRAND</span><span>11/31</span></div>
        </div>
      </div>
    </div>
  </section>

  <section id="security">
    <div class="wrap sec-grid">
      <div>
        <div class="shield-visual">
          <svg viewBox="0 0 24 24" fill="none"><path d="M12 2L4 5V11C4 16.5 7.4 20.7 12 22C16.6 20.7 20 16.5 20 11V5L12 2Z" fill="#147A6B" fill-opacity="0.12" stroke="#147A6B" stroke-width="1.4"/><path d="M8.5 12L11 14.5L16 9" stroke="#2FD9A8" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
      </div>
      <div>
        <div class="section-head" style="margin-bottom:30px;">
          <div class="eyebrow"><span class="dot"></span> Sécurité</div>
          <h2>La vigilance, ce n'est pas qu'un nom.</h2>
        </div>
        <ul class="sec-list" style="color:var(--text);">
          <li><span class="n" style="color:var(--primary)">01</span><div><h4>Surveillance anti-fraude 24/7</h4><p style="color:var(--muted)">Une équipe et des algorithmes analysent chaque transaction en continu pour détecter les anomalies.</p></div></li>
          <li><span class="n" style="color:var(--primary)">02</span><div><h4>Authentification biométrique</h4><p style="color:var(--muted)">Empreinte ou reconnaissance faciale à chaque connexion sensible.</p></div></li>
          <li><span class="n" style="color:var(--primary)">03</span><div><h4>Fonds protégés</h4><p style="color:var(--muted)">Vos dépôts sont garantis jusqu'à 100 000 € par le fonds de garantie des dépôts.</p></div></li>
        </ul>
      </div>
    </div>
  </section>

  <section id="testimonials">
    <div class="wrap">
      <div class="section-head">
        <div class="eyebrow"><span class="dot"></span> Ils en parlent</div>
        <h2>Des clients qui gardent l'œil ouvert.</h2>
      </div>
      <div class="testi-grid">
        <div class="testi"><p>"J'ai enfin une vision claire de mes dépenses. Les alertes en temps réel m'ont évité un prélèvement en double."</p><div class="who"><div class="avatar">M</div><div><b>Manon T.</b><span>Cliente depuis 2023</span></div></div></div>
        <div class="testi"><p>"Les cartes virtuelles pour les achats en ligne, c'est devenu un réflexe. Je ne reviens plus en arrière."</p><div class="who"><div class="avatar">Y</div><div><b>Yanis K.</b><span>Cliente depuis 2022</span></div></div></div>
        <div class="testi"><p>"Ouverture de compte en moins de 5 minutes depuis mon canapé, carte reçue trois jours après."</p><div class="who"><div class="avatar">S</div><div><b>Sofia L.</b><span>Cliente depuis 2024</span></div></div></div>
      </div>
    </div>
  </section>

  <section>
    <div class="wrap">
      <div class="cta-band">
        <div>
          <h2>Prêt à garder l'œil sur votre argent ?</h2>
          <p>Ouvrez un compte gratuit en quelques minutes, sans engagement.</p>
        </div>
        <a href="javascript:void(0)" class="btn btn-primary" onclick="showPage('login')">Ouvrir un compte gratuit</a>
      </div>
    </div>
  </section>

  <footer>
    <div class="wrap">
      <div class="foot-grid">
        <div>
          <div class="brand" style="color:#fff; margin-bottom:14px;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2L4 5V11C4 16.5 7.4 20.7 12 22C16.6 20.7 20 16.5 20 11V5L12 2Z" fill="#2FD9A8" fill-opacity="0.18" stroke="#2FD9A8" stroke-width="1.5"/></svg>
            Vigi-Banque
          </div>
          <p style="font-size:13px; max-width:220px;">Établissement de paiement fictif — projet de démonstration.</p>
        </div>
        <div><h5>Produits</h5><ul><li><a href="#">Compte courant</a></li><li><a href="#">Cartes</a></li><li><a href="#">Cagnottes</a></li></ul></div>
        <div><h5>Entreprise</h5><ul><li><a href="#">À propos</a></li><li><a href="#">Carrières</a></li><li><a href="#">Presse</a></li></ul></div>
        <div><h5>Assistance</h5><ul><li><a href="#">Centre d'aide</a></li><li><a href="#">Contact</a></li><li><a href="#">Statut</a></li></ul></div>
        <div><h5>Légal</h5><ul><li><a href="#">Conditions</a></li><li><a href="#">Confidentialité</a></li><li><a href="#">Mentions légales</a></li></ul></div>
      </div>
      <div class="foot-bottom">
        <span>© 2026 Vigi-Banque — Interface fictive à but non commercial.</span>
        <span>Fait avec vigilance 👁</span>
      </div>
      <p class="foot-note">Vigi-Banque est une marque et une interface entièrement fictives, créées à des fins de démonstration / projet communautaire. Aucun service bancaire réel n'est proposé, aucune donnée saisie n'est traitée ni stockée.</p>
    </div>
  </footer>
</div>


<!-- ============================================================ -->
<!-- PAGE 2 : LOGIN -->
<!-- ============================================================ -->
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
        <span>— Manon T., cliente Vigi-Banque</span>
      </div>
      <div style="font-size:12px; color:rgba(255,255,255,.35);">🔒 Connexion chiffrée de bout en bout</div>
    </div>

    <div class="login-form-col">
      <div class="login-box">
        <a href="javascript:void(0)" class="back-link" onclick="showPage('landing')">← Retour au site</a>
        <h2>Content de vous revoir</h2>
        <p class="sub">Connectez-vous à votre espace client Vigi-Banque.</p>

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
        <p class="signup-note">Pas encore de compte ? <a href="javascript:void(0)" class="link-sm" onclick="showPage('landing')">Ouvrir un compte</a></p>
        <p class="demo-note">Démo — Entrez le code fourni par l'entreprise pour accéder à l'espace client.</p>
      </div>
    </div>
  </div>
</div>


<!-- ============================================================ -->
<!-- PAGE 3 : DASHBOARD / ESPACE CLIENT -->
<!-- ============================================================ -->
<div id="page-dashboard" class="page">
  <div class="app-shell">

    <aside class="sidebar">
      <div class="brand" style="color:#fff;">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2L4 5V11C4 16.5 7.4 20.7 12 22C16.6 20.7 20 16.5 20 11V5L12 2Z" fill="#2FD9A8" fill-opacity="0.18" stroke="#2FD9A8" stroke-width="1.5"/><circle cx="12" cy="11" r="3" stroke="#2FD9A8" stroke-width="1.5"/></svg>
        Vigi-Banque
      </div>
      <nav class="side-nav">
        <a href="javascript:void(0)" class="active"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 10.5L12 3l9 7.5V21H3z"/></svg> Accueil</a>
        <a href="javascript:void(0)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/></svg> Comptes</a>
        <a href="javascript:void(0)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18"/></svg> Cartes</a>
        <a href="javascript:void(0)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M7 17L17 7M17 7H9M17 7v8"/></svg> Virements</a>
        <a href="javascript:void(0)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 19V5m6 14V9m6 10V13"/></svg> Analyse</a>
        <a href="javascript:void(0)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.6 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/></svg> Paramètres</a>
      </nav>
      <div class="side-foot">
        <div class="side-user">
          <div class="avatar" id="sideAvatar">U</div>
          <div><b id="sideUserName">Utilisateur</b><span id="sideUserPlan">Compte Standard</span></div>
        </div>
        <button class="logout-btn" onclick="logout()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></svg>
          Se déconnecter
        </button>
      </div>
    </aside>

    <main class="main">
      <div class="topbar">
        <div>
          <h1 id="dashGreeting">Bonjour 👋</h1>
          <div class="date" id="dashDate"></div>
        </div>
        <div class="top-actions">
          <button class="icon-btn">🔍</button>
          <button class="icon-btn">🔔<span class="dot"></span></button>
          <div class="user-chip"><div class="avatar" style="width:28px;height:28px;font-size:11px;" id="topAvatar">U</div><b id="topUserChipName">Utilisateur</b></div>
        </div>
      </div>

      <div class="dash-grid">
        <div class="balance-hero">
          <div class="top-row">
            <div>
              <div class="lbl">Compte courant</div>
              <div class="iban mono">FR76 3000 4008 2800 0117 3928 K56</div>
            </div>
            <span class="pill" style="background:rgba(255,255,255,.1); color:#fff; border-color:rgba(255,255,255,.2);">● Actif</span>
          </div>
          <div class="amt" id="dashBalance">0 Vigi-Coins</div>
          <div class="chg">↑ Synchronisé avec l'entreprise</div>
          <div class="quick-actions">
            <div class="qa-btn">↗<br>Virement</div>
            <div class="qa-btn">↙<br>Recevoir</div>
            <div class="qa-btn">＋<br>Recharger</div>
            <div class="qa-btn">⏻<br>Bloquer carte</div>
          </div>
        </div>

        <div class="side-panels">
          <div class="panel" style="padding:20px;">
            <div class="mini-card-visual">
              <div class="row"><span>VIGI · EMPLOYÉ</span><span>💳</span></div>
              <div class="num">•••• 7734</div>
              <div class="row"><span id="cardName">USER</span><span>12/26</span></div>
            </div>
          </div>
          <div class="panel">
            <h3>Cagnotte « Entreprise »</h3>
            <p class="sub">Objectif 1 500 Vigi-Coins</p>
            <div class="goal-bar"><i style="width:62%"></i></div>
            <div class="goal-foot"><span>930 Vigi-Coins</span><span>62%</span></div>
          </div>
        </div>
      </div>

      <div class="dash-grid" style="grid-template-columns:1.5fr 1fr;">
        <div class="panel">
          <div class="panel-head"><h3>Transactions récentes</h3><a href="javascript:void(0)" class="see-all">Tout voir</a></div>

          <div class="tx-row"><div class="tx-ico">💼</div><div class="tx-meta"><b>Virement salaire — Entreprise</b><span>Hier, 08:02</span></div><div><div class="tx-amt pos">+1 000,00 Vigi</div><div class="tx-cat">Revenus</div></div></div>
          <div class="tx-row"><div class="tx-ico">🏦</div><div class="tx-meta"><b>Ouverture de compte</b><span>Récemment</span></div><div><div class="tx-amt pos">+0,00 Vigi</div><div class="tx-cat">Système</div></div></div>
          <div class="tx-row"><div class="tx-ico">🚀</div><div class="tx-meta"><b>Achat Boutique (Bientôt)</b><span>En attente</span></div><div><div class="tx-amt neg">-0,00 Vigi</div><div class="tx-cat">WIP</div></div></div>
        </div>

        <div class="panel">
          <div class="panel-head"><h3>Dépenses par catégorie</h3></div>
          <div class="donut-wrap">
            <svg width="120" height="120" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E2E6E5" stroke-width="4"/>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#147A6B" stroke-width="4" stroke-dasharray="34 66" stroke-dashoffset="25"/>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#2FD9A8" stroke-width="4" stroke-dasharray="22 78" stroke-dashoffset="-9"/>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#D6A94E" stroke-width="4" stroke-dasharray="18 82" stroke-dashoffset="-31"/>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E2543E" stroke-width="4" stroke-dasharray="14 86" stroke-dashoffset="-49"/>
            </svg>
            <ul class="legend" style="flex:1;">
              <li><i style="background:#147A6B"></i>Salaires<b>34%</b></li>
              <li><i style="background:#2FD9A8"></i>Primes<b>22%</b></li>
              <li><i style="background:#D6A94E"></i>Boutique<b>18%</b></li>
              <li><i style="background:#E2543E"></i>Amendes<b>14%</b></li>
            </ul>
          </div>
        </div>
      </div>

      <div class="panel chart-panel">
        <div class="panel-head"><h3>Solde sur 6 mois</h3><span class="pill">+18,4% vs période préc.</span></div>
        <div class="bars">
          <div class="bar-col"><div class="bar" style="height:55%"></div><span>Fév.</span></div>
          <div class="bar-col"><div class="bar" style="height:68%"></div><span>Mars</span></div>
          <div class="bar-col"><div class="bar" style="height:48%"></div><span>Avril</span></div>
          <div class="bar-col"><div class="bar" style="height:76%"></div><span>Mai</span></div>
          <div class="bar-col"><div class="bar" style="height:64%"></div><span>Juin</span></div>
          <div class="bar-col"><div class="bar" style="height:92%"></div><span>Juil.</span></div>
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
        // Mise à jour de l'interface avec les vraies données
        document.getElementById('dashBalance').innerText = data.balance.toLocaleString('fr-FR') + ' Vigi-Coins';
        
        const name = data.username || 'Utilisateur';
        const initial = name.charAt(0).toUpperCase();
        
        document.getElementById('dashGreeting').innerText = 'Bonjour, ' + name + ' 👋';
        document.getElementById('sideUserName').innerText = name;
        document.getElementById('topUserChipName').innerText = name;
        document.getElementById('sideAvatar').innerText = initial;
        document.getElementById('topAvatar').innerText = initial;
        document.getElementById('cardName').innerText = name.toUpperCase();
        
        const planName = data.stage === 'confirmed' ? 'Compte Premium' : (data.stage === 'trainee' ? 'Compte Standard' : 'Non employé');
        document.getElementById('sideUserPlan').innerText = planName;

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

  // Date actuelle sur la landing si besoin
  // Afficher la page login par défaut si on vient de l'admin
  // On laisse sur la landing par défaut
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
            let username = 'Client';
            try {
                const empRes = await dbNova.query("SELECT stage FROM employees WHERE user_id = $1 AND status = 'active'", [userEco.userId]);
                if (empRes.rows.length > 0) {
                    stage = empRes.rows[0].stage;
                }
                
                const guildId = process.env.GUILD_ID;
                const guild = client.guilds.cache.get(guildId);
                if (guild) {
                    const member = await guild.members.fetch(userEco.userId);
                    username = member.user.username;
                }
            } catch (e) { console.error("Erreur BDD Nova bank login:", e); }

            res.json({ success: true, balance: userEco.balance, stage, username });
        } catch (error) {
            console.error(error);
            res.json({ success: false, message: error.message });
        }
    });

    return router;
};
