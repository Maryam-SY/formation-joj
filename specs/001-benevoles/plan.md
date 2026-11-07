# 001 — Bénévoles : ouvrir un créneau et s'y inscrire : plan

**Statut** : Validé

## 1. Résumé

On construit côté API la première brique de la gestion des bénévoles : un responsable ouvre un créneau d'accueil rattaché à une discipline, avec un début, une fin et une capacité, et un bénévole s'y inscrit avec son nom et son email. Une fois les tâches terminées, l'application refuse toute inscription quand le créneau est complet, y compris quand deux bénévoles visent la dernière place au même moment. Le travail est découpé en cinq tâches, dans l'ordre des couches : schémas partagés et entité créneau, règle « complet » dans le domaine, cas d'usage, table et repository Drizzle, puis routes HTTP et tests e2e. L'écran, la fausse API du front, la consultation des inscrits et le refus d'un email en double sont laissés aux tranches suivantes.

Les mots de la spec et leur nom dans le code :

| Dans la spec           | Dans le code        | Ce que c'est                                                                  |
| ---------------------- | ------------------- | ----------------------------------------------------------------------------- |
| bénévoles (le domaine) | module `volunteers` | Le module NestJS qui regroupe les créneaux et les inscriptions.               |
| créneau                | `Slot`              | Une plage horaire d'accueil d'une discipline, avec une capacité.              |
| capacité               | `capacity`          | Le nombre maximal de bénévoles inscrits sur un créneau, entier positif.       |
| nombre d'inscrits      | `registeredCount`   | Le nombre de bénévoles déjà inscrits sur le créneau, tenu par le créneau.     |
| inscription            | `Registration`      | Le fait qu'un bénévole, identifié par son nom et son email, occupe une place. |
| ouvrir un créneau      | `OpenSlot`          | Le cas d'usage qui crée un créneau.                                           |
| s'inscrire             | `RegisterVolunteer` | Le cas d'usage qui inscrit un bénévole sur un créneau.                        |

## 2. Fichiers par couche

On crée le module `volunteers` dans `apps/api/src/modules/volunteers/`, organisé comme le module Disciplines : un dossier par couche. Il dépend du module Disciplines pour vérifier qu'une discipline existe.

- **shared** : `packages/shared/src/volunteers.ts` contient les schémas Zod `openSlotSchema` (discipline, début, fin, capacité ; la fin doit suivre le début), `registerVolunteerSchema` (nom, email), `slotIdParamsSchema` et `slotSchema` (le créneau tel que l'API le renvoie, avec `registeredCount`), ainsi que les constantes `VOLUNTEER_NAME_MAX_LENGTH` et `VOLUNTEER_EMAIL_MAX_LENGTH`. `packages/shared/src/index.ts` les exporte.
- **domain** : `domain/slot.ts` est l'entité créneau : `Slot.create()` revalide la capacité et l'ordre des horaires, `Slot.restore()` relit la base, et `register()` ajoute un inscrit ou lève `SLOT_FULL`. `domain/registration.ts` est l'entité inscription : `Registration.create()` revalide le nom et l'email. `domain/volunteers.errors.ts` déclare `VolunteerError`, sous-classe d'`AppError`, et ses codes.
- **application** : `application/slot.repository.ts` est le port `SlotRepository`, une classe abstraite avec `findById`, `insert` et `addRegistration` ; ce dernier enregistre l'inscription et le nouveau compte d'inscrits en une seule opération atomique, et lève `SLOT_FULL` si la place a été prise entre-temps. `application/testing/in-memory-slot.repository.ts` en est l'implémentation en mémoire pour les tests. `application/use-cases/open-slot.ts` contient `OpenSlot`, qui vérifie que la discipline existe puis crée le créneau. `application/use-cases/register-volunteer.ts` contient `RegisterVolunteer`, qui charge le créneau, appelle `register()` et enregistre l'inscription.
- **infra** : `infra/volunteers.schema.ts` déclare les tables `slots` et `registrations` pour Drizzle. `infra/slot.mapper.ts` contient `toDomain` et `toRow`. `infra/drizzle-slot.repository.ts` implémente le port ; `addRegistration` incrémente le compte seulement si le créneau n'est pas complet, et insère l'inscription dans la même transaction.
- **http** : `http/volunteers.controller.ts` est le controller fin, avec deux routes. `POST /api/slots` ouvre un créneau à partir du corps `openSlotSchema` et renvoie 201 avec le créneau (`slotSchema`, `registeredCount` à 0). `POST /api/slots/:id/registrations` inscrit un bénévole à partir du corps `registerVolunteerSchema` et renvoie 201 avec le créneau mis à jour, dont le `registeredCount`. `volunteers.module.ts` relie le port à son implémentation Drizzle et importe `DisciplinesModule`. On modifie `disciplines.module.ts` pour exporter `DisciplineRepository`, et `app.module.ts` pour importer `VolunteersModule`.
- **web** : rien. L'écran et la fausse API du front sont hors périmètre de cette tranche, qui n'a pas d'écran.

## 3. Données

On stocke les créneaux et leurs inscriptions dans deux nouvelles tables. Migration : `pnpm db:generate --name=create-slots-and-registrations`.

- **`slots`** : `id` (uuid, clé primaire), `discipline_id` (uuid, non nul), `starts_at` et `ends_at` (horodatages avec fuseau, précision milliseconde), `capacity` (entier), `registered_count` (entier, 0 par défaut) et `created_at`.
  - La clé étrangère `discipline_id` vers `disciplines.id`, avec suppression en cascade, garantit qu'un créneau appartient à une discipline existante (AS3).
  - La contrainte `slots_capacity_positive` (`capacity > 0`) et la contrainte `slots_time_range` (`ends_at > starts_at`) protègent les règles d'AS2.
  - La contrainte `slots_not_overbooked` (`registered_count` entre 0 et `capacity`) garantit qu'un créneau ne déborde jamais, même si deux inscriptions arrivent au même moment (AS6).
- **`registrations`** : `id` (uuid, clé primaire), `slot_id` (uuid, non nul, clé étrangère vers `slots.id` avec suppression en cascade), `name` (100 caractères au plus), `email` (254 caractères au plus) et `created_at`. Il n'y a pas d'unicité sur le couple créneau et email : elle arrive avec TR2.

## 4. Erreurs

Chaque refus de la spec devient une erreur métier (`AppError`), avec un code stable et un statut HTTP. Par HTTP, une entrée mal formée est d'abord refusée par le schéma Zod partagé, avec le code `VALIDATION_FAILED` et le champ en cause ; le domaine lève ses propres codes s'il est appelé sans passer par HTTP.

| Code AppError                | Catégorie  | HTTP | Quand                                                  | Scénario |
| ---------------------------- | ---------- | ---- | ------------------------------------------------------ | -------- |
| `SLOT_CAPACITY_INVALID`      | VALIDATION | 400  | La capacité est nulle, négative ou non entière.        | AS2      |
| `SLOT_TIME_RANGE_INVALID`    | VALIDATION | 400  | La fin du créneau n'est pas après son début.           | AS2      |
| `DISCIPLINE_NOT_FOUND`       | NOT_FOUND  | 404  | La discipline du créneau n'existe pas (code existant). | AS3      |
| `REGISTRATION_NAME_REQUIRED` | VALIDATION | 400  | Le nom du bénévole est vide ou fait d'espaces.         | AS5      |
| `REGISTRATION_EMAIL_INVALID` | VALIDATION | 400  | L'email du bénévole est mal formé.                     | AS5      |
| `SLOT_FULL`                  | CONFLICT   | 409  | Le créneau compte déjà autant d'inscrits que de places | AS6      |
| `SLOT_NOT_FOUND`             | NOT_FOUND  | 404  | Aucun créneau n'a cet identifiant.                     | AS7      |

## 5. Tests par scénario

Chaque scénario de la spec est prouvé par au moins un test, au niveau le plus bas qui suffit ; le fichier e2e vérifie en plus le contrat HTTP de chaque scénario.

| Scénario | Fichier de test                                                              | Niveau      | Ce que le test vérifie                                                                |
| -------- | ---------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------- |
| AS1      | `apps/api/src/modules/volunteers/application/volunteers.application.spec.ts` | unitaire    | Le créneau ouvert a la discipline, les horaires, une capacité de 2 et 0 inscrit.      |
| AS2      | `apps/api/src/modules/volunteers/domain/slot.spec.ts`                        | unitaire    | Capacité 0, -1 ou 1,5 et fin avant le début lèvent leur code ; rien n'est créé.       |
| AS3      | `apps/api/src/modules/volunteers/application/volunteers.application.spec.ts` | unitaire    | Une discipline inconnue lève `DISCIPLINE_NOT_FOUND` et aucun créneau n'est stocké.    |
| AS4      | `apps/api/src/modules/volunteers/application/volunteers.application.spec.ts` | unitaire    | Sur un créneau de capacité 2 avec 1 inscrit, l'inscription porte le compte à 2.       |
| AS5      | `apps/api/src/modules/volunteers/domain/registration.spec.ts`                | unitaire    | Un nom vide et un email mal formé lèvent leur code ; le compte ne change pas.         |
| AS6      | `apps/api/src/modules/volunteers/domain/slot.spec.ts`                        | unitaire    | Un troisième `register()` sur un créneau de capacité 2 lève `SLOT_FULL`.              |
| AS6      | `apps/api/src/modules/volunteers/infra/drizzle-slot.repository.int.spec.ts`  | intégration | Deux inscriptions simultanées sur la dernière place : une passe, l'autre `SLOT_FULL`. |
| AS7      | `apps/api/src/modules/volunteers/application/volunteers.application.spec.ts` | unitaire    | S'inscrire à un créneau inconnu lève `SLOT_NOT_FOUND`.                                |
| AS1–AS7  | `apps/api/test/slots.e2e.spec.ts`                                            | e2e         | Statuts 201, 400, 404 et 409, codes et corps conformes à `slotSchema`.                |

## 6. Tâches

Cinq tâches, dans l'ordre des couches. Chaque tâche nomme le test à écrire d'abord et cite les scénarios qu'elle couvre ; elle tient dans un commit.

- [x] T01 [001-AS2] Écrire d'abord `apps/api/src/modules/volunteers/domain/slot.spec.ts` (« 001-AS2: rejects an invalid capacity or time range »), puis les schémas de `packages/shared/src/volunteers.ts`, `volunteers.errors.ts` et `Slot.create()` / `Slot.restore()`
- [x] T02 [001-AS5, AS6] Écrire d'abord `domain/registration.spec.ts` (« 001-AS5: rejects an empty name or a malformed email ») et un test dans `domain/slot.spec.ts` (« 001-AS6: refuses a registration on a full slot »), puis `Registration.create()` et `Slot.register()`
- [x] T03 [001-AS1, AS3, AS4, AS7] Écrire d'abord `application/volunteers.application.spec.ts` (« 001-AS1: opens a slot with no registration », « 001-AS3: … », « 001-AS4: … », « 001-AS7: … »), puis le port `SlotRepository`, sa version en mémoire, `OpenSlot`, `RegisterVolunteer`, et l'export de `DisciplineRepository` par `DisciplinesModule`
- [x] T04 [001-AS6] Écrire d'abord `infra/drizzle-slot.repository.int.spec.ts` (« 001-AS6: lets only one of two concurrent registrations take the last place »), puis `volunteers.schema.ts`, la migration générée, `slot.mapper.ts` et `DrizzleSlotRepository`
- [ ] T05 [001-AS1, AS2, AS3, AS4, AS5, AS6, AS7] Écrire d'abord `apps/api/test/slots.e2e.spec.ts` (« 001-AS1: opens a slot (201) », … « 001-AS7: … (404) »), puis `volunteers.controller.ts`, `volunteers.module.ts` et l'import dans `app.module.ts`
