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
            <title>Vigi-Banque</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
                * { box-sizing: border-box; font-family: 'Inter', sans-serif; }
                body {
                    background: radial-gradient(circle at 50% 0%, #1a2235 0%, #0b0e14 100%);
                    color: #e6e8eb; margin: 0; padding: 50px 20px;
                    display: flex; justify-content: center; min-height: 100vh;
                }
                .bank-card {
                    background: rgba(25, 30, 45, 0.7);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 24px;
                    padding: 40px;
                    width: 100%; max-width: 450px;
                    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
                    text-align: center;
                }
                h1 { font-size: 28px; font-weight: 800; margin: 0 0 10px 0; color: #fff; }
                .subtitle { color: #80848e; margin-bottom: 30px; font-size: 14px; }
                .input-group { margin-bottom: 20px; text-align: left; }
                label { display: block; margin-bottom: 8px; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #80848e; }
                input {
                    width: 100%; background: rgba(11, 14, 20, 0.8);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px; padding: 16px; color: #fff;
                    font-size: 18px; text-align: center; letter-spacing: 4px; outline: none;
                    transition: all 0.2s;
                }
                input:focus { border-color: #FFD700; box-shadow: 0 0 0 4px rgba(255, 215, 0, 0.1); }
                .btn {
                    background: linear-gradient(135deg, #FFD700, #FFB800);
                    color: black; border: none; padding: 16px; border-radius: 12px;
                    font-size: 16px; font-weight: 800; cursor: pointer; width: 100%;
                    transition: all 0.3s; text-transform: uppercase;
                }
                .btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(255, 215, 0, 0.3); }
                .alert { padding: 12px; border-radius: 8px; margin-bottom: 20px; font-weight: 600; display: none; font-size: 14px; }
                .alert.error { background: rgba(242, 63, 66, 0.1); color: #f23f42; border: 1px solid rgba(242, 63, 66, 0.2); }
                
                /* Dashboard View */
                #dashView { display: none; }
                .balance-card {
                    background: linear-gradient(135deg, #1e293b, #0f172a);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 16px; padding: 24px; margin-bottom: 20px; text-align: left;
                }
                .balance-label { font-size: 12px; text-transform: uppercase; color: #80848e; margin-bottom: 5px; }
                .balance-amount { font-size: 36px; font-weight: 800; color: #FFD700; }
                .status-badge {
                    display: inline-block; padding: 6px 12px; background: rgba(45, 199, 112, 0.1);
                    color: #2dc770; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 10px;
                }
                .wip-card {
                    background: rgba(255,255,255,0.03); border: 1px dashed rgba(255,255,255,0.1);
                    border-radius: 16px; padding: 30px; text-align: center; color: #666;
                }
                .logout-btn { background: rgba(242, 63, 66, 0.1); color: #f23f42; border: 1px solid rgba(242, 63, 66, 0.2); margin-top: 20px; padding: 12px; border-radius: 12px; cursor: pointer; width: 100%; font-weight: 600; }
            </style>
        </head>
        <body>
            <div class="bank-card">
                <!-- Login View -->
                <div id="loginView">
                    <h1>🏦 Vigi-Banque</h1>
                    <p class="subtitle">Entrez votre code d'accès à 6 chiffres pour consulter votre compte.</p>
                    <div id="loginAlert" class="alert error"></div>
                    <div class="input-group">
                        <label>Code d'accès</label>
                        <input type="text" id="codeInput" maxlength="6" placeholder="123456">
                    </div>
                    <button id="loginBtn" class="btn">🔐 Accéder à mon compte</button>
                </div>

                <!-- Dashboard View -->
                <div id="dashView">
                    <h1>🏦 Mon Compte</h1>
                    
                    <div class="balance-card">
                        <div class="balance-label">Solde Disponible</div>
                        <div class="balance-amount" id="solde">0 Vigi-Coins</div>
                        <div class="status-badge" id="statut">Statut : Inconnu</div>
                    </div>

                    <div class="balance-card">
                        <div class="balance-label">Boutique (Achats)</div>
                        <div class="wip-card">
                            🚧 <br> Section en cours de développement<br>
                            <small>Bientôt disponible</small>
                        </div>
                    </div>

                    <button id="logoutBtn" class="logout-btn">Se déconnecter</button>
                </div>
            </div>

            <script>
                const loginView = document.getElementById('loginView');
                const dashView = document.getElementById('dashView');
                const loginBtn = document.getElementById('loginBtn');
                const loginAlert = document.getElementById('loginAlert');

                loginBtn.addEventListener('click', async () => {
                    const code = document.getElementById('codeInput').value;
                    if (code.length !== 6) {
                        loginAlert.innerText = 'Le code doit faire 6 chiffres.';
                        loginAlert.style.display = 'block';
                        return;
                    }

                    loginAlert.style.display = 'none';
                    loginBtn.innerText = 'Vérification...';

                    try {
                        const res = await fetch('/api/bank/login', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ code })
                        });
                        const data = await res.json();

                        if (data.success) {
                            document.getElementById('solde').innerText = data.balance + ' Vigi-Coins';
                            document.getElementById('statut').innerText = 'Statut : ' + (data.stage === 'confirmed' ? 'Titulaire' : (data.stage === 'trainee' ? 'En formation' : 'Non employé'));
                            loginView.style.display = 'none';
                            dashView.style.display = 'block';
                        } else {
                            loginAlert.innerText = data.message;
                            loginAlert.style.display = 'block';
                            loginBtn.innerText = '🔐 Accéder à mon compte';
                        }
                    } catch (err) {
                        loginAlert.innerText = 'Erreur réseau.';
                        loginAlert.style.display = 'block';
                        loginBtn.innerText = '🔐 Accéder à mon compte';
                    }
                });

                document.getElementById('logoutBtn').addEventListener('click', () => {
                    document.getElementById('codeInput').value = '';
                    dashView.style.display = 'none';
                    loginView.style.display = 'block';
                });
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
            try {
                const empRes = await dbNova.query("SELECT stage FROM employees WHERE user_id = $1 AND status = 'active'", [userEco.userId]);
                if (empRes.rows.length > 0) {
                    stage = empRes.rows[0].stage;
                }
            } catch (e) { console.error("Erreur BDD Nova bank login:", e); }

            res.json({ success: true, balance: userEco.balance, stage });
        } catch (error) {
            console.error(error);
            res.json({ success: false, message: error.message });
        }
    });

    return router;
};
