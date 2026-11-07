# CLAUDE.md

Application d'organisation des JOJ Dakar 2026 : une API NestJS (`apps/api`), un front React (`apps/web`) et des schémas partagés (`packages/shared`), dans un monorepo pnpm. Commandes et structure détaillée : `README.md`.

## Méthodologie

- Toute fonctionnalité suit le cycle `/prd` → `/spec` → `/spec-plan` → `/tdd-task` → `/converge`, avec validation humaine après le PRD, la spec et le plan. Règles communes : `specs/constitution.md`.
- Test d'abord, vu en échec pour la bonne raison (`pnpm tdd:red <fichier>`), puis le code minimal.
- Ordre de construction (README, « Ajouter une fonctionnalité ») : schéma partagé → entité → cas d'usage → table et migration → repository Drizzle → controller et e2e → fausse API MSW → écran.
- `pnpm verify` sur les fichiers modifiés avant chaque commit ; `pnpm check` avant de conclure.
- Celui qui produit ne valide pas : relecture par le sous-agent `relecteur` (contexte vierge).

## Architecture

- Un module par domaine dans `apps/api/src/modules/<domaine>/`, découpé en `domain/`, `application/`, `infra/`, `http/`, sur le modèle de `disciplines`.
- `domain/` est du TypeScript pur : aucun import de NestJS, Drizzle ou pg (vérifié par `.oxlintrc.json`).
- `application/` : le port du repository est une classe abstraite (`discipline.repository.ts`), implémentée par `infra/drizzle-….repository.ts` et par `application/testing/in-memory-….ts`.
- Le controller est fin : valider (DTO `nestjs-zod`), appeler un cas d'usage, sérialiser via `toResponse()`. Aucune règle métier.
- Les schémas Zod d'entrée et de réponse sont dans `packages/shared/src/<nom>.ts`, exportés par `index.ts`, et servent à l'API comme au front.
- Front : `apps/web/src/features/<nom>/api/` (`<nom>.api.ts` pour HTTP, `<nom>.queries.ts` pour les hooks TanStack Query) et `components/` ; une route par fichier dans `src/routes/`.
- Transverse API dans `src/core/` (config, base, erreurs). Migrations générées par `pnpm db:generate`, jamais éditées à la main.

## Concepts appréciés

- Typage strict, pas de `any` ; types dérivés des schémas (`z.infer`) plutôt que redéclarés.
- Une classe par cas d'usage, `@Injectable()`, une seule méthode `execute()`.
- Entités à constructeur privé : `create()` applique les règles, `restore()` relit la base sans les rejouer ; mutations par méthodes métier (`rename()`).
- Le domaine ne fait pas confiance à la validation HTTP : il revalide ses invariants.
- Fonctions courtes et nommées (`validName`, `toDomain`, `toRow`) ; commentaires JSDoc en français qui disent le pourquoi.
- Constantes partagées (`DISCIPLINE_CATEGORIES`, `DISCIPLINE_NAME_MAX_LENGTH`) plutôt que valeurs en dur.

## Bonnes pratiques

- Toute erreur métier est une sous-classe d'`AppError` (`disciplines.errors.ts`) : code stable en majuscules + catégorie `VALIDATION`, `NOT_FOUND`, `CONFLICT` ou `BUSINESS_RULE`. Seul `ProblemDetailsFilter` la transforme en HTTP (RFC 9457).
- Une entrée est validée par un schéma Zod de `packages/shared`, jamais à la main dans le controller ; le front valide aussi les réponses avec ces schémas.
- Unicité : vérifiée par le cas d'usage pour un message clair, et garantie par une contrainte en base.
- Aucun secret dans le code : les valeurs sensibles vont dans `apps/api/.env` (ignoré par git).
- Tests : domaine et cas d'usage avec le repository en mémoire, repository Drizzle sur PGlite en mémoire, e2e via supertest ; front contre la fausse API unique (`src/mocks/`, même contrat que l'API) et un audit axe par état d'écran.
- Jamais de `--no-verify` ni de `LEFTHOOK=0`.

## Nommage

- Fichiers en kebab-case : `create-discipline.ts`, `drizzle-discipline.repository.ts`, `discipline.mapper.ts`.
- Classes en PascalCase, cas d'usage nommés par un verbe : `CreateDiscipline`, `ListDisciplines`.
- Codes d'erreur en majuscules, préfixés par le domaine : `DISCIPLINE_NAME_TAKEN`.
- Tests API : `*.spec.ts` (unitaire), `*.int.spec.ts` (intégration), `test/*.e2e.spec.ts` ; front : `<fichier>.test.tsx` à côté du fichier, `*.a11y.test.tsx` pour l'accessibilité.
- Titres de tests en anglais, préfixés par la spec et le scénario : `it('001-AS2: rejects a full slot')`.
- Commits Conventional Commits en anglais, citant tâche et scénario : `feat(benevoles): T03 refuse a full slot (001-AS2)`.
