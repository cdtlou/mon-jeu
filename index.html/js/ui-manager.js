// ============ GESTIONNAIRE D'INTERFACE UTILISATEUR ============
class UIManager {
    constructor() {
        this.currentPage = 'loginPage';
        this.setupEventListeners();
        this.setupSyncIndicator();
    }

    setupSyncIndicator() {
        // Écouter les changements de synchronisation
        if (window.accountSystem) {
            window.addEventListener('sync-status', (e) => {
                this.updateSyncStatus(e.detail);
            });
        }
    }

    updateSyncStatus(status) {
        const indicator = document.getElementById('syncStatus');
        const text = document.getElementById('syncStatusText');
        if (!indicator) return;

        if (status === 'syncing') {
            indicator.classList.remove('synced', 'error');
            text.textContent = '📡 Synchronisation...';
        } else if (status === 'synced') {
            indicator.classList.remove('error');
            indicator.classList.add('synced');
            text.textContent = '✅ Synchronisé';
            setTimeout(() => {
                if (indicator.classList.contains('synced')) {
                    indicator.classList.remove('synced');
                    text.textContent = '📡 Synchronisation...';
                }
            }, 3000);
        } else if (status === 'error') {
            indicator.classList.remove('synced');
            indicator.classList.add('error');
            text.textContent = '⚠️ Hors ligne';
        }
    }

    setupEventListeners() {
        // LOGIN PAGE
        document.getElementById('createBtn').addEventListener('click', () => this.createAccount());
        document.getElementById('loginBtn').addEventListener('click', () => this.login());
        
        // Permettre la connexion avec Entrée
        document.getElementById('pseudoInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });
        document.getElementById('codeInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });

        // LOBBY PAGE
        document.getElementById('settingsBtn').addEventListener('click', () => this.showPage('settingsPage'));
        document.getElementById('playBtn').addEventListener('click', () => this.startGame());
        document.getElementById('shopBtn').addEventListener('click', () => this.showPage('shopPage'));
        document.getElementById('casierBtn').addEventListener('click', () => this.showPage('casierPage'));

        // LOGOUT BUTTON (dans les paramètres)
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // SETTINGS PAGE
        document.getElementById('closeSettingsBtn').addEventListener('click', () => this.showPage('lobbyPage'));
        document.getElementById('musicVolume').addEventListener('change', (e) => {
            accountSystem.updateVolume('music', e.target.value);
            document.getElementById('musicVolumeValue').textContent = e.target.value + '%';
            // Mettre à jour le volume du système audio
            if (window.audioSystem) {
                audioSystem.setMusicVolume(e.target.value);
            }
        });
        document.getElementById('effectsVolume').addEventListener('change', (e) => {
            accountSystem.updateVolume('effects', e.target.value);
            document.getElementById('effectsVolumeValue').textContent = e.target.value + '%';
            // Mettre à jour le volume des effets
            if (window.audioSystem) {
                audioSystem.setEffectsVolume(e.target.value);
            }
        });
        document.getElementById('remapKeysBtn').addEventListener('click', () => this.startRemappingKeys());

        // SHOP PAGE
        document.getElementById('closeShopBtn').addEventListener('click', () => this.showPage('lobbyPage'));

        // CASIER PAGE
        document.getElementById('closeCasierBtn').addEventListener('click', () => this.showPage('lobbyPage'));

        // GAME PAGE
        document.getElementById('pauseBtn').addEventListener('click', () => this.toggleGamePause());
        document.getElementById('exitGameBtn').addEventListener('click', () => this.exitGame());
        
        // Desktop buttons (if they exist)
        const pauseBtnDesktop = document.getElementById('pauseBtn-desktop');
        if (pauseBtnDesktop) pauseBtnDesktop.addEventListener('click', () => this.toggleGamePause());
        const exitGameBtnDesktop = document.getElementById('exitGameBtn-desktop');
        if (exitGameBtnDesktop) exitGameBtnDesktop.addEventListener('click', () => this.exitGame());
    }

    showPage(pageName) {
        // Masquer la page actuelle
        document.getElementById(this.currentPage).classList.remove('active');
        
        // Afficher la nouvelle page
        document.getElementById(pageName).classList.add('active');
        this.currentPage = pageName;

        // Actions supplémentaires selon la page
        if (pageName === 'lobbyPage') this.updateLobbyDisplay();
        if (pageName === 'shopPage') this.displayShop();
        if (pageName === 'casierPage') this.displayCasier();
        if (pageName === 'settingsPage') this.updateSettingsDisplay();
    }

    createAccount() {
        const pseudo = document.getElementById('pseudoInput').value.trim();
        const code = document.getElementById('codeInput').value.trim();

        if (!pseudo || !code) {
            this.showError('Veuillez remplir tous les champs');
            return;
        }

        if (pseudo.length < 3) {
            this.showError('Le pseudo doit faire au moins 3 caractères');
            return;
        }

        const result = accountSystem.createAccount(pseudo, code);
        if (result.success) {
            this.showError(''); // Effacer les erreurs
            document.getElementById('pseudoInput').value = '';
            document.getElementById('codeInput').value = '';
            
            // Vérifier 2x que le compte a bien été créé
            setTimeout(() => {
                if (accountSystem.accounts[pseudo]) {
                    this.showError('✅ Compte créé et sauvegardé! Vous pouvez maintenant vous connecter.', 'success');
                } else {
                    this.showError('⚠️ ERREUR: Le compte n\'a pas pu être sauvegardé!', 'error');
                }
            }, 500);
        } else {
            this.showError(result.message);
        }
    }

    login() {
        const pseudo = document.getElementById('pseudoInput').value.trim();
        const code = document.getElementById('codeInput').value.trim();

        if (!pseudo || !code) {
            this.showError('Veuillez remplir tous les champs');
            return;
        }

        const result = accountSystem.login(pseudo, code);
        if (result.success) {
            this.showError('');
            document.getElementById('pseudoInput').value = '';
            document.getElementById('codeInput').value = '';
            
            // Vérifier que l'utilisateur est bien connecté
            setTimeout(() => {
                this.showPage('lobbyPage');
            }, 300);
        } else {
            this.showError(result.message);
        }
    }

    logout() {
        accountSystem.logout();
        document.getElementById('pseudoInput').value = '';
        document.getElementById('codeInput').value = '';
        this.showPage('loginPage');
    }

    showError(message, type = 'error') {
        const errorDiv = document.getElementById('loginError');
        errorDiv.textContent = message;
        errorDiv.style.color = type === 'success' ? '#4caf50' : '#ff6b6b';
    }

    updateLobbyDisplay() {
        const user = accountSystem.getCurrentUser();
        if (!user) return;

        document.getElementById('lobbyUsername').textContent = user.pseudo;
        document.getElementById('lobbyLevel').textContent = user.level;
        // Calculer l'XP requis pour le niveau suivant
        const currentLevelXp = XpSystem.getXpRequiredForLevel(user.level);
        const nextLevelXp = XpSystem.getXpRequiredForLevel(user.level + 1);
        const xpInLevel = user.xp - currentLevelXp;
        const xpRequiredForLevel = nextLevelXp - currentLevelXp;

        // Afficher l'XP relative au niveau courant (progression), pas le total global
        document.getElementById('lobbyXP').textContent = xpInLevel;
        document.getElementById('lobbyXPRequired').textContent = xpRequiredForLevel;

        // Barre de progression (s'assurer de ne pas diviser par 0)
        const percentage = xpRequiredForLevel > 0 ? (xpInLevel / xpRequiredForLevel) * 100 : 0;
        document.getElementById('lobbyXPFill').style.width = Math.max(0, Math.min(100, percentage)) + '%';

        // Record
        document.getElementById('playerRecord').textContent = user.bestScore;

        // Afficher le top 3
        const topScores = accountSystem.getTopScores(3);
        const topList = document.getElementById('topPlayers');
        topList.innerHTML = '';
        
        if (topScores.length === 0) {
            topList.innerHTML = '<li>-</li><li>-</li><li>-</li>';
        } else {
            topScores.forEach((score, index) => {
                const li = document.createElement('li');
                li.textContent = `${score.pseudo}: ${score.score}`;
                topList.appendChild(li);
            });
            
            // Ajouter des tirets si moins de 3
            while (topList.children.length < 3) {
                const li = document.createElement('li');
                li.textContent = '-';
                topList.appendChild(li);
            }
        }
    }

    displayShop() {
        const user = accountSystem.getCurrentUser();
        if (!user) return;

        console.log('UIManager.displayShop - ShopSystem.musics =', window.ShopSystem && window.ShopSystem.musics);

        // Afficher les skins
        const skinsList = document.getElementById('skinsList');
        skinsList.innerHTML = '';
        
        ShopSystem.skins.forEach(skin => {
            const div = document.createElement('div');
            div.className = 'shop-item';
            
            const isUnlocked = ShopSystem.isItemUnlocked('skins', skin.id, user.level);
            const isOwned = accountSystem.isItemOwned('skins', skin.id);
            
            if (!isUnlocked) {
                div.classList.add('locked');
            }

            // Afficher un carré avec la couleur du skin
            const colorSquare = `<div class="color-square" style="background-color: ${skin.color}; width: 60px; height: 60px; border-radius: 8px; margin: 0 auto 10px; border: 2px solid rgba(255, 255, 255, 0.3);"></div>`;

            div.innerHTML = `
                ${colorSquare}
                <div class="shop-item-name">${skin.name}</div>
                <div class="shop-item-level">Niveau ${skin.level}</div>
                <button class="shop-item-button" ${!isUnlocked ? 'disabled' : ''}
                        onclick="uiManager.buySkin(${skin.id})">
                    ${isOwned ? '✓ Possédé' : 'Débloquer'}
                </button>
            `;
            
            skinsList.appendChild(div);
        });

        // Afficher les musiques
        const musicsList = document.getElementById('musicsList');
        musicsList.innerHTML = '';
        
        ShopSystem.musics.forEach(music => {
            const div = document.createElement('div');
            div.className = 'shop-item';
            
            const isUnlocked = ShopSystem.isItemUnlocked('musics', music.id, user.level);
            const isOwned = accountSystem.isItemOwned('musics', music.id);
            
            if (!isUnlocked) {
                div.classList.add('locked');
            }

            div.innerHTML = `
                <div class="shop-item-name">${music.emoji} ${music.name}</div>
                <div class="shop-item-level">Niveau ${music.level}</div>
                <button class="shop-item-button" ${!isUnlocked ? 'disabled' : ''}
                        onclick="uiManager.buyMusic(${music.id})">
                    ${isOwned ? '✓ Possédé' : 'Débloquer'}
                </button>
            `;
            
            musicsList.appendChild(div);
        });
    }

    buySkin(skinId) {
        const user = accountSystem.getCurrentUser();
        if (!user) return;

        const skin = ShopSystem.skins.find(s => s.id === skinId);
        
        if (!ShopSystem.isItemUnlocked('skins', skinId, user.level)) {
            alert(`Débloqué au niveau ${skin.level}`);
            return;
        }

        if (accountSystem.isItemOwned('skins', skinId)) {
            alert('Vous possédez déjà cet objet');
            return;
        }

        accountSystem.buyItem('skins', skinId);
        // Équiper automatiquement le nouveau skin
        accountSystem.equipItem('skins', skinId);
        alert('Skin débloqué et équipé!');
        this.displayShop();
        this.displayCasier();
    }

    buyMusic(musicId) {
        const user = accountSystem.getCurrentUser();
        if (!user) return;

        const music = ShopSystem.musics.find(m => m.id === musicId);
        
        if (!ShopSystem.isItemUnlocked('musics', musicId, user.level)) {
            alert(`Débloqué au niveau ${music.level}`);
            return;
        }

        if (accountSystem.isItemOwned('musics', musicId)) {
            alert('Vous possédez déjà cet objet');
            return;
        }

        accountSystem.buyItem('musics', musicId);
        // Équiper automatiquement la nouvelle musique
        accountSystem.equipItem('musics', musicId);
        alert('Musique débloquée et équipée!');
        this.displayShop();
        this.displayCasier();
    }

    displayCasier() {
        const user = accountSystem.getCurrentUser();
        if (!user) return;

        // Skins
        const skinsWardrobe = document.getElementById('skinsWardrobe');
        skinsWardrobe.innerHTML = '';
        
        ShopSystem.skins.forEach(skin => {
            const isOwned = accountSystem.isItemOwned('skins', skin.id);
            
            // Ne montrer que les skins possédés
            if (!isOwned) return;

            const div = document.createElement('div');
            div.className = 'wardrobe-item';
            
            const isEquipped = user.equippedSkin === skin.id;
            
            if (isEquipped) {
                div.classList.add('equipped');
            }

            const colorSquare = `<div class="color-square" style="background-color: ${skin.color}; width: 60px; height: 60px; border-radius: 8px; margin: 0 auto 10px; border: 2px solid rgba(255, 255, 255, 0.3);"></div>`;

            div.innerHTML = `
                ${colorSquare}
                <div class="wardrobe-item-name">${skin.name}</div>
                <button class="wardrobe-item-button" onclick="uiManager.equipSkin(${skin.id})">
                    ${isEquipped ? '✓ Équipé' : 'Équiper'}
                </button>
            `;
            
            skinsWardrobe.appendChild(div);
        });

        // Afficher un message si aucun skin
        if (skinsWardrobe.innerHTML === '') {
            skinsWardrobe.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">Aucun skin débloqué</p>';
        }

        // Musiques
        const musicsWardrobe = document.getElementById('musicsWardrobe');
        musicsWardrobe.innerHTML = '';
        
        ShopSystem.musics.forEach(music => {
            const isOwned = accountSystem.isItemOwned('musics', music.id);
            
            // Ne montrer que les musiques possédées
            if (!isOwned) return;

            const div = document.createElement('div');
            div.className = 'wardrobe-item';
            
            const isEquipped = user.equippedMusic === music.id;
            
            if (isEquipped) {
                div.classList.add('equipped');
            }

            // Déterminer la couleur basée sur le nom
            const colorMap = {
                'Rhythm': '#FF8800',
                'Groove': '#00DD00',
                'Wave': '#0099FF',
                'Cosmic': '#DD00FF'
            };
            const musicColor = colorMap[music.name] || '#888888';
            const colorSquare = `<div class="color-square" style="background-color: ${musicColor}; width: 60px; height: 60px; border-radius: 8px; margin: 0 auto 10px; border: 2px solid rgba(255, 255, 255, 0.3);"></div>`;

            div.innerHTML = `
                ${colorSquare}
                <div class="wardrobe-item-name">${music.emoji} ${music.name}</div>
                <button class="wardrobe-item-button" onclick="uiManager.equipMusic(${music.id})">
                    ${isEquipped ? '✓ Équipé' : 'Équiper'}
                </button>
            `;
            
            musicsWardrobe.appendChild(div);
        });

        // Afficher un message si aucune musique
        if (musicsWardrobe.innerHTML === '') {
            musicsWardrobe.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">Aucune musique débloquée</p>';
        }
    }

    equipSkin(skinId) {
        accountSystem.equipItem('skins', skinId);
        this.displayCasier();
    }

    equipMusic(musicId) {
        accountSystem.equipItem('musics', musicId);
        this.displayCasier();
    }

    updateSettingsDisplay() {
        const user = accountSystem.getCurrentUser();
        if (!user) return;

        document.getElementById('musicVolume').value = user.musicVolume;
        document.getElementById('musicVolumeValue').textContent = user.musicVolume + '%';
        document.getElementById('effectsVolume').value = user.effectsVolume;
        document.getElementById('effectsVolumeValue').textContent = user.effectsVolume + '%';

        // Afficher les touches actuelles
        document.getElementById('keyLeft').textContent = user.controls.left.toUpperCase();
        document.getElementById('keyRight').textContent = user.controls.right.toUpperCase();
        document.getElementById('keyRotate').textContent = user.controls.rotate.toUpperCase();
        document.getElementById('keyDown').textContent = user.controls.down.toUpperCase();
        document.getElementById('keyHardDrop').textContent = user.controls.hardDrop === ' ' ? 'Space' : user.controls.hardDrop.toUpperCase();
    }

    startRemappingKeys() {
        const keys = ['left', 'right', 'rotate', 'down', 'hardDrop'];
        const keyLabels = {
            'left': '← Gauche',
            'right': '→ Droite',
            'rotate': '↻ Rotation',
            'down': '↓ Descente',
            'hardDrop': '⬇️ Hard Drop'
        };

        const remappedKeys = {};
        let currentKeyIndex = 0;

        const promptKey = () => {
            if (currentKeyIndex >= keys.length) {
                // Remapping terminé
                accountSystem.updateControls(remappedKeys);
                this.updateSettingsDisplay();
                alert('Touches remappées avec succès!');
                return;
            }

            const keyName = keys[currentKeyIndex];
            const label = keyLabels[keyName];

            const response = prompt(`Appuyez sur la touche pour: ${label}\n\n(Tapez le caractère ou "space" pour la barre d'espace)`);
            
            if (response === null) {
                alert('Remapping annulé');
                return;
            }

            const key = response.toLowerCase().trim();
            if (key === 'space' || key === '') {
                remappedKeys[keyName] = ' ';
            } else if (key.length === 1) {
                remappedKeys[keyName] = key;
            } else {
                alert('Entrée invalide. Tapez un seul caractère.');
                return;
            }

            currentKeyIndex++;
            promptKey();
        };

        promptKey();
    }

    startGame() {
        this.showPage('gamePage');
        if (window.tetrisGame) {
            window.tetrisGame.start();
            this.updateGameDisplay(0, 0);
        }
    }

    toggleGamePause() {
        if (window.tetrisGame) {
            window.tetrisGame.togglePause();
        }
    }

    exitGame() {
        if (window.tetrisGame) {
            window.tetrisGame.stop();
        }
        this.showPage('lobbyPage');
    }

    updateGameDisplay(score, xpGained) {
        const user = accountSystem.getCurrentUser();
        if (!user) return;

        // Version desktop
        document.getElementById('gameScore').textContent = score;
        document.getElementById('gameXP').textContent = xpGained;
        document.getElementById('gameRecord').textContent = user.bestScore;
        document.getElementById('gameLevel').textContent = user.level;

        // Version mobile
        const mobileScore = document.getElementById('gameScore-mobile');
        const mobileXP = document.getElementById('gameXP-mobile');
        const mobileLevel = document.getElementById('gameLevel-mobile');
        
        if (mobileScore) mobileScore.textContent = score;
        if (mobileXP) mobileXP.textContent = xpGained;
        if (mobileLevel) mobileLevel.textContent = user.level;

        // Dessiner la prochaine pièce
        this.drawNextPiece();
    }

    updateGameScore(score) {
        document.getElementById('gameScore').textContent = score;
        const mobileScore = document.getElementById('gameScore-mobile');
        if (mobileScore) mobileScore.textContent = score;
    }

    drawNextPiece() {
        // Mettre à jour tous les canvas nextPiece (mobile et desktop)
        const canvases = document.querySelectorAll('#nextPieceCanvas');
        if (canvases.length === 0 || !window.tetrisGame || !window.tetrisGame.nextPiece) return;

        canvases.forEach(canvas => {
            const ctx = canvas.getContext('2d');
            const blockSize = 30;

            // Effacer le canvas
            ctx.fillStyle = 'rgba(10, 14, 39, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Grille
            ctx.strokeStyle = 'rgba(102, 126, 234, 0.1)';
            ctx.lineWidth = 1;
            for (let i = 0; i <= 4; i++) {
                ctx.beginPath();
                ctx.moveTo(i * blockSize, 0);
                ctx.lineTo(i * blockSize, canvas.height);
                ctx.stroke();
            }
            for (let i = 0; i <= 4; i++) {
                ctx.beginPath();
                ctx.moveTo(0, i * blockSize);
                ctx.lineTo(canvas.width, i * blockSize);
                ctx.stroke();
            }

            // Dessiner la pièce
            const piece = window.tetrisGame.nextPiece;
            const shape = piece.shape;
            const offsetX = (4 - shape[0].length) / 2;
            const offsetY = (4 - shape.length) / 2;

            for (let row = 0; row < shape.length; row++) {
                for (let col = 0; col < shape[row].length; col++) {
                    if (shape[row][col]) {
                        const x = offsetX + col;
                        const y = offsetY + row;

                        ctx.fillStyle = piece.color || '#888888';
                        ctx.fillRect(x * blockSize + 1, y * blockSize + 1, blockSize - 2, blockSize - 2);

                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(x * blockSize + 1, y * blockSize + 1, blockSize - 2, blockSize - 2);
                    }
                }
            }
        });
    }

    // ============ GESTION DES SAUVEGARDES ============
    
    setupBackupEventListeners() {
        const exportBtn = document.getElementById('exportBackupBtn');
        const importBtn = document.getElementById('importBackupBtn');
        const autoBackupBtn = document.getElementById('autoBackupBtn');
        const restoreAutoBackupBtn = document.getElementById('restoreAutoBackupBtn');
        const backupInfoBtn = document.getElementById('backupInfoBtn');
        const fileInput = document.getElementById('backupFileInput');
        
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                const result = accountSystem.exportAccounts();
                alert(result.message);
            });
        }
        
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                fileInput?.click();
            });
        }
        
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const result = accountSystem.importAccounts(event.target.result);
                        alert(result.message);
                        if (result.success) {
                            location.reload();
                        }
                    } catch (error) {
                        alert('Erreur lors de la lecture du fichier');
                    }
                };
                reader.readAsText(file);
                e.target.value = ''; // Reset input
            });
        }
        
        if (autoBackupBtn) {
            autoBackupBtn.addEventListener('click', () => {
                const result = accountSystem.createAutoBackup();
                alert(result.success ? 'Sauvegarde automatique créée!' : result.message);
            });
        }
        
        if (restoreAutoBackupBtn) {
            restoreAutoBackupBtn.addEventListener('click', () => {
                const result = accountSystem.restoreFromAutoBackup();
                alert(result.message);
                if (result.success) {
                    location.reload();
                }
            });
        }
        
        if (backupInfoBtn) {
            backupInfoBtn.addEventListener('click', () => {
                const info = accountSystem.getBackupInfo();
                const message = `📊 Informations de Sauvegarde:\n\n` +
                    `Total de comptes: ${info.totalAccounts}\n` +
                    `Comptes: ${info.accounts.join(', ') || 'Aucun'}\n` +
                    `Dernier save: ${info.lastSave}\n` +
                    `Taille stockage: ${info.storageUsage}`;
                alert(message);
            });
        }
    }
}

// Instance globale
const uiManager = new UIManager();
