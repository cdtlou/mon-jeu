// ============ SYSTÈME DE COMPTES AVEC LOCALSTORAGE ============
class AccountSystem {
    constructor() {
        this.accounts = this.loadAccounts();
        this.currentUser = this.loadCurrentSession();
    }

    loadAccounts() {
        const data = localStorage.getItem('tetrisAccounts');
        return data ? JSON.parse(data) : {};
    }

    loadCurrentSession() {
        const session = localStorage.getItem('tetrisCurrentUser');
        return session ? session : null;
    }

    saveCurrentSession() {
        if (this.currentUser) {
            localStorage.setItem('tetrisCurrentUser', this.currentUser);
        } else {
            localStorage.removeItem('tetrisCurrentUser');
        }
    }

    saveAccounts() {
        localStorage.setItem('tetrisAccounts', JSON.stringify(this.accounts));
    }

    createAccount(pseudo, code) {
        // Vérifier que le pseudo n'existe pas déjà
        if (this.accounts[pseudo]) {
            return { success: false, message: 'Pseudo déjà utilisé' };
        }

        // Créer le compte
        this.accounts[pseudo] = {
            pseudo: pseudo,
            code: code,
            xp: 0,
            level: 1,
            bestScore: 0,
            ownedItems: {
                skins: [0], // Index 0 est le skin par défaut
                musics: [0]
            },
            equippedSkin: 0,
            equippedMusic: 0,
            musicVolume: 100,
            effectsVolume: 100,
            controls: {
                left: 'a',
                right: 'd',
                rotate: 'w',
                down: 's',
                hardDrop: ' '
            }
        };

        this.saveAccounts();
        return { success: true, message: 'Compte créé avec succès' };
    }

    login(pseudo, code) {
        const account = this.accounts[pseudo];
        
        if (!account) {
            return { success: false, message: 'Pseudo non trouvé' };
        }

        if (account.code !== code) {
            return { success: false, message: 'Code incorrect' };
        }

        this.currentUser = pseudo;
        // Recalculer le niveau en fonction de l'XP et du nouveau système de progression
        if (window.XpSystem) {
            account.level = window.XpSystem.getLevelFromXP(account.xp);
            this.saveAccounts();
        }
        this.saveCurrentSession();
        return { success: true, message: 'Connexion réussie' };
    }

    logout() {
        this.currentUser = null;
        this.saveCurrentSession();
    }

    getCurrentUser() {
        if (!this.currentUser) return null;
        return this.accounts[this.currentUser];
    }

    updateUser(updates) {
        if (!this.currentUser) return;
        
        Object.assign(this.accounts[this.currentUser], updates);
        this.saveAccounts();
    }

    addXP(amount) {
        if (!this.currentUser) return;
        
        const user = this.accounts[this.currentUser];
        user.xp += amount;
        
        // Recalculer le niveau
        const XpSystem = window.XpSystem;
        if (XpSystem) {
            user.level = XpSystem.getLevelFromXP(user.xp);
        }
        
        this.saveAccounts();
    }

    updateBestScore(score) {
        if (!this.currentUser) return;
        
        const user = this.accounts[this.currentUser];
        if (score > user.bestScore) {
            user.bestScore = score;
            this.saveAccounts();
            return true;
        }
        return false;
    }

    getAllAccounts() {
        return Object.values(this.accounts);
    }

    getTopScores(limit = 3) {
        return Object.values(this.accounts)
            .sort((a, b) => b.bestScore - a.bestScore)
            .slice(0, limit)
            .map(user => ({ pseudo: user.pseudo, score: user.bestScore }));
    }

    buyItem(itemType, itemIndex) {
        if (!this.currentUser) return { success: false, message: 'Utilisateur non connecté' };
        
        const user = this.accounts[this.currentUser];
        const ownedList = user.ownedItems[itemType];
        
        if (ownedList.includes(itemIndex)) {
            return { success: false, message: 'Objet déjà acheté' };
        }

        ownedList.push(itemIndex);
        this.saveAccounts();
        return { success: true, message: 'Achat réussi' };
    }

    isItemOwned(itemType, itemIndex) {
        if (!this.currentUser) return false;
        
        const user = this.accounts[this.currentUser];
        return user.ownedItems[itemType].includes(itemIndex);
    }

    equipItem(itemType, itemIndex) {
        if (!this.currentUser) return;
        
        const user = this.accounts[this.currentUser];
        
        if (itemType === 'skins') {
            user.equippedSkin = itemIndex;
        } else if (itemType === 'musics') {
            user.equippedMusic = itemIndex;
        }
        
        this.saveAccounts();
    }

    updateControls(controls) {
        if (!this.currentUser) return;
        
        this.accounts[this.currentUser].controls = controls;
        this.saveAccounts();
    }

    updateVolume(type, value) {
        if (!this.currentUser) return;
        
        if (type === 'music') {
            this.accounts[this.currentUser].musicVolume = value;
        } else if (type === 'effects') {
            this.accounts[this.currentUser].effectsVolume = value;
        }
        
        this.saveAccounts();
    }
}

// Instance globale
const accountSystem = new AccountSystem();
