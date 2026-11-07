# PRD — Bénévoles

**Statut** : Validé

## Problème

Chaque discipline a besoin de bénévoles pour accueillir le public. Les responsables de discipline gèrent aujourd'hui les inscriptions sur papier, et des créneaux débordent : plus de bénévoles inscrits que de places prévues.

## Utilisateurs

- Responsable de discipline : ouvre des créneaux d'accueil et fixe combien de bénévoles chacun accueille.
- Bénévole : s'inscrit à un créneau d'accueil d'une discipline.

## Proposition

Le responsable ouvre un créneau avec une capacité ; les bénévoles s'y inscrivent ; l'application refuse toute inscription au-delà de la capacité. Le compte des places est tenu par l'application et non plus à la main, ce qui supprime le débordement.

## Mesure du succès

Pendant la démo, un créneau de capacité 2 accepte deux bénévoles et refuse le troisième.

## Tranches

### TR1 — Ouvrir un créneau et s'y inscrire, sans déborder

Le responsable ouvre un créneau avec une capacité ; un bénévole s'y inscrit. Règle : une inscription est refusée quand le créneau est complet.

### TR2 — Consulter un créneau et ses inscrits

On consulte un créneau, sa capacité et la liste de ses inscrits. Règle : un même email ne s'inscrit pas deux fois au même créneau.

### TR3 — Se désinscrire, et un écran pour le bénévole

Un bénévole se désinscrit d'un créneau, ce qui libère sa place. Un écran permet de voir un créneau, de s'y inscrire et de s'en désinscrire.

## Hors périmètre

- Modifier ou supprimer un créneau.
- Envoyer des emails de confirmation.
- Les comptes des bénévoles : un bénévole est identifié par son email, sans mot de passe.

## Hypothèses et risques

- Supposé : un créneau appartient à une discipline existante et a une date et une plage horaire. Si ce n'est pas le cas, le bénévole ne sait pas quand venir.
- Supposé : n'importe qui peut ouvrir un créneau, faute de comptes. Si un bénévole ouvre ou gonfle un créneau, la capacité ne protège plus rien.
- Supposé : la capacité est un entier strictement positif.
- Risque : sans écran avant TR3, les deux premières tranches ne se montrent pas à un responsable ou à un bénévole réel.
