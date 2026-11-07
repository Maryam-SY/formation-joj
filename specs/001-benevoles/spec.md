# 001 — Bénévoles : ouvrir un créneau et s'y inscrire

**Statut** : Validée
**PRD** : specs/prd-benevoles.md, TR1

## Contexte

Les responsables de discipline tiennent les inscriptions des bénévoles sur papier, et des créneaux d'accueil débordent. Cette tranche confie le compte des places à l'application : le responsable ouvre un créneau avec une capacité, et aucun bénévole ne s'y inscrit une fois le créneau complet.

## User stories

- En tant que responsable de discipline, je veux ouvrir un créneau d'accueil avec une capacité, afin de fixer combien de bénévoles il me faut.
- En tant que bénévole, je veux m'inscrire à un créneau, afin d'accueillir le public de cette discipline.

## Scénarios d'acceptation

### AS1 — Ouvrir un créneau

- **Étant donné** la discipline « Lutte »
- **Quand** le responsable ouvre un créneau le 2 novembre 2026 de 9 h à 12 h, de capacité 2
- **Alors** le créneau est enregistré avec cette discipline, ces horaires, une capacité de 2 et 0 inscrit

### AS2 — Créneau invalide

- **Étant donné** une capacité nulle, négative ou non entière, ou une fin qui n'est pas après le début
- **Quand** le responsable ouvre le créneau
- **Alors** c'est refusé avec un message qui dit pourquoi, et aucun créneau n'est enregistré

### AS3 — Discipline introuvable

- **Étant donné** une discipline qui n'existe pas
- **Quand** le responsable ouvre un créneau pour elle
- **Alors** c'est refusé, l'application dit que la discipline est introuvable, et aucun créneau n'est enregistré

### AS4 — S'inscrire à un créneau

- **Étant donné** un créneau de capacité 2 avec 1 inscrit
- **Quand** un bénévole s'y inscrit avec son nom et son email
- **Alors** l'inscription est enregistrée, et le créneau compte 2 inscrits

### AS5 — Inscription invalide

- **Étant donné** un nom vide ou un email mal formé
- **Quand** le bénévole s'inscrit à un créneau
- **Alors** c'est refusé avec un message qui dit pourquoi, et le nombre d'inscrits ne change pas

### AS6 — Créneau complet

- **Étant donné** un créneau de capacité 2 qui compte déjà 2 inscrits
- **Quand** un troisième bénévole s'y inscrit
- **Alors** c'est refusé avec un message de conflit qui dit que le créneau est complet, et le créneau compte toujours 2 inscrits

### AS7 — Créneau introuvable

- **Étant donné** un créneau qui n'existe pas
- **Quand** un bénévole s'y inscrit
- **Alors** l'application dit que le créneau est introuvable

## Hors périmètre

- Consulter un créneau et ses inscrits ; refuser un même email deux fois (TR2).
- Se désinscrire, et tout écran (TR3).
- Modifier ou supprimer un créneau, emails de confirmation, comptes des bénévoles (PRD).

## Questions ouvertes

- Que contient un créneau ? Hypothèse : une discipline existante, un début, une fin et une capacité.
- Qui peut ouvrir un créneau ? Hypothèse : tout le monde, puisqu'il n'y a pas de comptes.
- Deux inscriptions simultanées sur la dernière place : hypothèse, une seule passe et l'autre reçoit le refus « créneau complet ».
- Un créneau passé peut-il encore être ouvert ou recevoir des inscriptions ? Hypothèse : oui, aucune règle sur les dates dans cette tranche.
