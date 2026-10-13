# Interview Frontend

Le code à modifier se situe essentiellement dans `components/basket`.  
Le dossier `data` contient des données de demo et des exemples de types

### What's in

- React + Vite
- TypeScript
- UI: Shadcn
- Some useful libs

### Run

```
npm i
npm run dev
```

### 3. Tests E2E (Playwright)

Les tests end-to-end vérifient le comportement de l'application du point de vue utilisateur.

**Fichiers de tests:**

- `e2e/basket.spec.ts` - Tests du panier (4 tests)
  - Affichage initial des produits
  - Calcul du sous-total
  - Affichage du montant final
  - Suppression d'un produit

- `e2e/coupon.spec.ts` - Tests des coupons (10 tests)
  - Application d'un code promo
  - Désactivation du champ après application
  - Un seul coupon à la fois
  - Suppression d'un coupon
  - Suggestions de coupons
  - Calcul du prix avec réduction
  - Navigation clavier dans les suggestions

**Lancer les tests:**

```bash
# Mode headless
npx playwright test

# Mode UI (visualisation)
npx playwright test --ui

# Un fichier spécifique
npx playwright test e2e/basket.spec.ts

# Mode debug
npx playwright test --debug
```

**Prérequis:**

- Installer les navigateurs Playwright: `npx playwright install`
- Le serveur frontend démarre automatiquement (configuré dans `playwright.config.ts`)

**⚠️ Stack complète requise pour tous les tests:**

Certains tests (calcul du prix avec coupon) nécessitent le backend + base de données:

```bash
# Terminal 1: Démarrer PostgreSQL (Docker)
cd ../setup-integration-tests
docker-compose -f docker-compose-postgresql-test.yaml up -d

# Terminal 2: Démarrer le backend
cd ..
npm run dev  # Écoute sur http://localhost:3000

# Terminal 3: Lancer les tests E2E
cd frontend
npx playwright test
```
