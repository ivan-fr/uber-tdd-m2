## Interview

### Setup

```bash

npm i
npm run dev
# ou
npm run test

cd frontend
npm i
npm run dev
```

### Objectif

On cherche à calculer le prix d'un panier lors d'une commande en ligne. La commande contient un panier avec des articles, et un ou plusieurs codes promo.  
**On veut donc créer la fonction permettant de déterminer le prix final du panier sur lequel est appliqué un ou plusieurs codes promo.**

Les codes promo peuvent être de plusieurs types :

- Une réduction en pourcentage (-10% sur la commande)
- Une réduction fixe (30€ d'offert) min 1€ la commande
- Un produit acheté, un produit offert (ex : un t-shirt acheté = un t-shirt offert).

- Black Friday
  - 50% sur tout le panier
  - Uniquement entre le vendredi 00h00 et le lundi 23h59 du week-end du Black Friday le 2025-28-11 au 2025-30-11.
  - Ne peut pas amener le total en dessous de 1 euro.
  - Cumulable avec d’autres promotions

Les réductions s’appliquent dans l’ordre défini par l’entreprise : d’abord les promos “produit”, ensuite les promos fixes/%, et enfin Black Friday.

Ils peuvent aussi avoir des conditions d'applications :

- Un code promo peut s’appliquer uniquement sur certains types de produits (exemple : uniquement sur les t-shirts)
- Réduction si la commande dépasse x€ (exemple : -10% dès 30 € d’achats)
- Un code promo ne doit jamais faire descendre le total sous 0.

**TLDR**:

- Calculer le montant final du panier après l'application des coupons dans le back
- Utiliser l'API dans le front

## Projet Uber : stories 1, 2 et 3

Le code Uber se trouve dans `uber/`. La story 3 enregistre les passagers
(`riders`), les chauffeurs (`drivers`) et les courses (`rides`) dans PostgreSQL.

### Lancer PostgreSQL avec Docker

Depuis la racine du depot, avec Docker Desktop demarre :

```bash
npm run db:start
npm run knex migrate:latest
```

La base est accessible sur `127.0.0.1:5445`. Le nom de la base, l'utilisateur
et le mot de passe de developpement sont tous `uber`.
Les donnees restent dans un volume Docker apres l'arret du conteneur.

Pour arreter la base en conservant les donnees :

```bash
npm run db:stop
```

Pour creer une nouvelle migration :

```bash
npm run knex migrate:make NOM_DE_LA_MIGRATION
```

### Lancer les tests

```bash
# Tests unitaires : des tableaux remplacent la base.
npm test -- --run uber/test

# Tests d'integration : un vrai PostgreSQL est lance dans Docker.
npm run test:integration:uber
```

Les tests d'integration lancent leur propre conteneur, appliquent les migrations,
puis le suppriment a la fin. Ils utilisent un port disponible automatiquement.

### Comprendre le code

- `uber/app/models.ts` decrit les informations des passagers, chauffeurs et courses.
- `uber/app/uber.repository.ts` liste les methodes pour sauvegarder et lire ces objets.
- `uber/infra/knex-uber.repository.ts` execute ces methodes avec Knex et PostgreSQL.
- `uber/test/fake-uber.repository.ts` utilise des tableaux pour les tests unitaires.

`BookRideUsecase` et `CancelRideUsecase` recoivent le repository dans leur
constructeur. Avec `KnexUberRepository`, ils enregistrent leurs changements en base.
Avec `FakeUberRepository`, on teste les memes regles dans des tableaux.
On utilise `await` devant `handle(...)` pour attendre la fin de la sauvegarde.
