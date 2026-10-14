# Projet Uber : stories 1 a 6

Le code Uber se trouve a la racine de ce depot. La story 3 enregistre les passagers
(`riders`), les chauffeurs (`drivers`) et les courses (`rides`) dans PostgreSQL.

La story 4 liste les courses d'un passager avec leurs chauffeurs.
La story 5 double le montant total pendant les 24 et 25 decembre entiers.
La story 6 ajoute 5 euros pour UberX, sauf le jour de l'anniversaire du passager.
Le supplement UberX est ajoute avant de doubler le montant pour Noel :
une course a 15 euros avec UberX coute donc 40 euros a Noel.

### Lancer PostgreSQL avec Docker

Depuis la racine du depot, installer les dependances avec `npm ci`, puis demarrer Docker Desktop :

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
npm test -- --run test

npm run test:integration:uber
```

Les tests d'integration lancent leur propre conteneur, appliquent les migrations,
puis le suppriment a la fin. Ils utilisent un port disponible automatiquement.

### Comprendre le code

- `app/models.ts` decrit les informations des passagers, chauffeurs et courses.
- `app/uber.repository.ts` liste les methodes pour sauvegarder et lire ces objets.
- `infra/knex-uber.repository.ts` execute ces methodes avec Knex et PostgreSQL.
- `test/fake-uber.repository.ts` utilise des tableaux pour les tests unitaires.

`BookRideUsecase` et `CancelRideUsecase` recoivent le repository dans leur
constructeur. Avec `KnexUberRepository`, ils enregistrent leurs changements en base.
Avec `FakeUberRepository`, on teste les memes regles dans des tableaux.
On utilise `await` devant `handle(...)` pour attendre la fin de la sauvegarde.

Pour tester une reservation a une date precise, on peut passer cette date
en dernier parametre de `BookRideUsecase.handle(...)` :

```ts
const ride = await bookRide.handle(rider, "Paris", "Lyon", 10, true, new Date(2026, 11, 25));
```

Sans ce parametre, la reservation utilise la date du jour. Les tests passent
toujours une date fixe pour donner le meme resultat quel que soit le jour d'execution.
