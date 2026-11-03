// Textes légaux de TabNest.
// Brouillons rédigés selon le droit français (RGPD, loi Informatique et Libertés,
// Code de la consommation). Ils doivent être relus par un juriste avant publication.
// Éditeur : ABA (personne physique, activité non immatriculée à ce jour).

export type LegalSlug = 'confidentialite' | 'cgu' | 'cookies' | 'remboursement'

export type LegalSection = {
  title: string
  paragraphs?: string[]
  paragraphsAfter?: string[]
  list?: string[]
  table?: { head: string[]; rows: string[][] }
}

export type LegalDoc = {
  slug: LegalSlug
  title: string
  updated: string
  intro: string
  sections: LegalSection[]
}

export const LEGAL_DOCS: Record<LegalSlug, LegalDoc> = {
  confidentialite: {
    slug: 'confidentialite',
    title: 'Politique de confidentialité',
    updated: '1er novembre 2025',
    intro:
      "TabNest conserve les pages web que vous visitez pour que vous ne perdiez plus le fil. Cette page explique, sans jargon, quelles données nous traitons, pourquoi, pendant combien de temps, et quels sont vos droits. Nous appliquons le principe de minimisation : nous ne collectons que ce qui est nécessaire au fonctionnement du service.",
    sections: [
      {
        title: '1. Responsable du traitement',
        paragraphs: [
          "Le responsable du traitement est ABA, personne physique, exerçant sous le nom TabNest. Contact : salimababulgu@gmail.com.",
          "L’activité n’est pas immatriculée à ce jour : aucun numéro SIRET ne peut donc être communiqué. Conformément à l’article 6, III de la LCEN, l’adresse d’un éditeur non professionnel n’est pas publiée ; elle est communiquée à l’hébergeur du site.",
          "Pour toute question relative à vos données : salimababulgu@gmail.com.",
        ],
      },
      {
        title: '2. Données que nous traitons',
        table: {
          head: ['Catégorie', 'Contenu', 'Pourquoi'],
          rows: [
            [
              'Compte',
              'Adresse e-mail, identifiant technique, mot de passe (chiffré, jamais lisible par nous). Si vous utilisez Google : adresse e-mail et nom transmis par Google.',
              'Créer votre compte et vous connecter.',
            ],
            [
              'Pages enregistrées',
              'Adresse (URL), titre, icône du site, image de partage publique, couleur dominante, nombre de visites, date de dernière visite, raison de garder choisie, épinglage, date d’expiration.',
              'Enregistrer, classer et afficher vos pages.',
            ],
            [
              'Projets',
              'Nom du projet et pages rattachées.',
              'Organiser vos pages par projet.',
            ],
            [
              'Extension (stockage local du navigateur)',
              'Jetons de session, réglage « capture activée », compteurs locaux, adresses des onglets ouverts (effacées à la fermeture du navigateur).',
              'Vous authentifier et faire fonctionner la capture automatique.',
            ],
            [
              'Technique',
              'Journaux techniques de nos prestataires (adresse IP, horodatage) lors des connexions et des erreurs.',
              'Sécurité et diagnostic.',
            ],
          ],
        },
        paragraphs: [
          "Nous ne demandons pas votre nom, votre adresse postale, votre numéro de téléphone ni votre date de naissance. Nous ne lisons pas le contenu des pages : seules les métadonnées publiques listées ci-dessus sont enregistrées. Aucune capture d'écran n'est réalisée.",
        ],
      },
      {
        title: '3. Finalités et bases légales',
        table: {
          head: ['Finalité', 'Base légale (article 6 RGPD)'],
          rows: [
            ['Créer et gérer votre compte, fournir le service', 'Exécution du contrat'],
            ['Enregistrer et classer vos pages', 'Exécution du contrat'],
            ['Sécurité, prévention de la fraude, journaux techniques', 'Intérêt légitime'],
            ['Répondre à vos demandes et respecter nos obligations légales', 'Obligation légale / intérêt légitime'],
            ['Améliorer le service grâce à des statistiques (si activées)', 'Votre consentement'],
          ],
        },
      },
      {
        title: '4. Destinataires et sous-traitants',
        paragraphs: [
          "Vos données ne sont jamais vendues. Elles sont traitées par les prestataires suivants, uniquement pour les besoins décrits :",
        ],
        list: [
          'Supabase — hébergement de la base de données et de l’authentification. Supabase peut traiter des données en dehors de l’Union européenne ; ces transferts sont encadrés par les clauses contractuelles types (voir ci-après).',
          'Google — si vous choisissez « Continuer avec Google », Google nous transmet votre adresse e-mail et votre nom, dans le cadre de son service d’authentification.',
          'Microlink — plateforme d’extraction de métadonnées. Elle reçoit l’adresse des pages enregistrées lorsque l’extension n’a pas pu récupérer le titre ou l’image directement, afin de compléter votre fiche.',
          'Lemon Squeezy — à venir : paiement et facturation. Lemon Squeezy agit comme vendeur enregistré (merchant of record) et applique ses propres conditions.',
          'Amazon SES — à venir : envoi des e-mails de service (confirmation, réinitialisation du mot de passe).',
          'L’hébergeur du site — à venir : hébergement de l’application et journaux techniques.',
        ],
        paragraphsAfter: [
          "Certains prestataires peuvent traiter des données en dehors de l’Union européenne (notamment aux États-Unis). Ces transferts sont encadrés par les clauses contractuelles types de la Commission européenne ou par un mécanisme équivalent prévu par le RGPD.",
        ],
      },
      {
        title: '5. Durées de conservation',
        list: [
          'Données de compte : conservées tant que votre compte existe, puis supprimées dans un délai maximal de 30 jours après la suppression du compte.',
          'Pages enregistrées : conservées selon leur durée de vie (3, 7, 14 ou 90 jours selon la raison de garder choisie, allongée à chaque visite). Les pages arrivées à échéance ne sont plus affichées et sont supprimées automatiquement.',
          'Projets : supprimés avec votre compte ou à votre demande.',
          'Journaux techniques : conservés au maximum 6 mois.',
        ],
      },
      {
        title: '6. Vos droits',
        paragraphs: [
          "Vous disposez des droits suivants, que vous pouvez exercer à tout moment en écrivant à salimababulgu@gmail.com :",
        ],
        list: [
          'Droit d’accès : obtenir une copie des données que nous détenons sur vous.',
          'Droit de rectification : corriger des données inexactes.',
          'Droit à l’effacement : demander la suppression de votre compte et de vos données.',
          'Droit à la limitation du traitement.',
          'Droit d’opposition, notamment au traitement fondé sur notre intérêt légitime.',
          'Droit à la portabilité : recevoir vos données dans un format lisible par machine.',
          'Droit de retirer votre consentement à tout moment, lorsque le traitement repose sur celui-ci.',
        ],
        paragraphsAfter: [
          "Nous répondons dans un délai d’un mois. Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de la CNIL (www.cnil.fr), 3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07.",
        ],
      },
      {
        title: '7. Sécurité',
        paragraphs: [
          "L’accès à vos données est cloisonné par compte : chaque utilisateur ne peut voir que ses propres pages (règles de sécurité au niveau des lignes). Les échanges sont chiffrés (HTTPS) et les mots de passe ne sont jamais stockés en clair.",
          "En cas de violation de données susceptible d’engendrer un risque élevé pour vos droits, nous vous en informerons ainsi que la CNIL, conformément aux articles 33 et 34 du RGPD.",
        ],
      },
      {
        title: '8. Mineurs',
        paragraphs: [
          "Le service est destiné aux personnes âgées de 15 ans et plus. Les personnes de moins de 15 ans doivent obtenir l’accord de leur titulaire de l’autorité parentale avant de créer un compte.",
        ],
      },
      {
        title: '9. Modifications',
        paragraphs: [
          "Cette politique peut être mise à jour. En cas de changement important, nous vous en informerons par e-mail ou dans l’application, au moins 15 jours avant l’entrée en vigueur.",
        ],
      },
    ],
  },

  cgu: {
    slug: 'cgu',
    title: "Conditions générales d'utilisation",
    updated: '1er novembre 2025',
    intro:
      "Les présentes conditions générales encadrent l'utilisation de TabNest, service web qui conserve automatiquement les pages que vous visitez. En créant un compte, vous les acceptez.",
    sections: [
      {
        title: '1. Éditeur du service',
        paragraphs: [
          "TabNest est édité par ABA, personne physique, sous le nom TabNest. Contact : salimababulgu@gmail.com.",
          "L’activité n’est pas immatriculée à ce jour : aucun numéro SIRET ne peut donc être communiqué. Conformément à l’article 6, III de la LCEN, l’adresse d’un éditeur non professionnel n’est pas publiée ; elle est communiquée à l’hébergeur du site. Dès l’immatriculation de l’activité, les mentions SIRET seront ajoutées.",
        ],
      },
      {
        title: '2. Objet du service',
        paragraphs: [
          "TabNest enregistre les pages web que vous consultez (via son extension de navigateur), les classe par site et par projet, leur attribue une durée de vie et vous permet de les retrouver. Le service est fourni « en l’état », dans le cadre d’un usage personnel.",
        ],
      },
      {
        title: '3. Compte utilisateur',
        list: [
          'Vous devez fournir une adresse e-mail valide et garder votre mot de passe confidentiel.',
          'Vous êtes responsable de l’activité réalisée depuis votre compte.',
          'Un compte est personnel : il ne doit pas être partagé ni revendu.',
          'Vous pouvez supprimer votre compte à tout moment ; la suppression entraîne celle de vos données dans les délais indiqués par la politique de confidentialité.',
        ],
      },
      {
        title: '4. Utilisation acceptable',
        paragraphs: [
          "Vous vous engagez à ne pas :",
        ],
        list: [
          'utiliser le service pour collecter ou diffuser des contenus illicites ;',
          'tenter de contourner les mesures de sécurité, les limitations techniques ou les règles d’accès aux données ;',
          'extraire massivement les données du service (scraping, robots) sans autorisation écrite ;',
          'perturber le fonctionnement du service ou de ses serveurs ;',
          'utiliser le service pour surveiller une autre personne à son insu.',
        ],
      },
      {
        title: '5. Extension de navigateur',
        paragraphs: [
          "L’extension demande l’autorisation de lire les onglets et de communiquer avec notre service, afin d’enregistrer les pages que vous visitez. Vous pouvez désactiver la capture à tout moment depuis l’application, et désinstaller l’extension à tout moment.",
        ],
      },
      {
        title: '6. Tarifs et paiement',
        paragraphs: [
          "L’usage de base est gratuit. Les formules payantes, lorsqu’elles seront disponibles, seront facturées via Lemon Squeezy, qui agit comme vendeur enregistré. Les prix seront indiqués toutes taxes comprises. Les conditions de remboursement figurent dans la page « Remboursement ».",
        ],
      },
      {
        title: '7. Disponibilité',
        paragraphs: [
          "Nous faisons nos meilleurs efforts pour assurer la disponibilité du service, sans garantie d’absence d’interruption. Des maintenances peuvent être nécessaires ; elles seront annoncées lorsque c’est possible.",
        ],
      },
      {
        title: '8. Responsabilité',
        paragraphs: [
          "Dans les limites permises par la loi, notre responsabilité ne peut être engagée pour les dommages indirects (perte de données, perte de chance, perte d’exploitation). Rien dans ces conditions ne limite les droits que la loi accorde aux consommateurs.",
        ],
      },
      {
        title: '9. Propriété intellectuelle',
        paragraphs: [
          "Le nom TabNest, le logo, l’interface et le code du service sont protégés. Nous vous accordons un droit d’usage personnel, non exclusif et non transférable du service. Les pages enregistrées restent la propriété de leurs éditeurs respectifs.",
        ],
      },
      {
        title: '10. Résiliation',
        paragraphs: [
          "Vous pouvez cesser d’utiliser le service à tout moment. Nous pouvons suspendre ou résilier un compte en cas de manquement grave aux présentes conditions, après information lorsque la loi le permet.",
        ],
      },
      {
        title: '11. Réclamations et médiation',
        paragraphs: [
          "Toute réclamation doit être adressée à salimababulgu@gmail.com. Nous répondons sous 15 jours.",
          "Le service est actuellement gratuit : aucune vente à des consommateurs n’est proposée à ce jour. Dès la commercialisation des formules payantes, un médiateur de la consommation sera désigné et ses coordonnées publiées ici, conformément aux articles L611-1 et suivants du Code de la consommation.",
        ],
      },
      {
        title: '12. Droit applicable',
        paragraphs: [
          "Les présentes conditions sont soumises au droit français. En cas de litige, les tribunaux français sont compétents, sous réserve des règles protectrices applicables aux consommateurs.",
        ],
      },
    ],
  },

  cookies: {
    slug: 'cookies',
    title: 'Cookies et traceurs',
    updated: '1er novembre 2025',
    intro:
      "Cette page décrit ce que TabNest stocke sur votre appareil. Nous n'utilisons aujourd'hui aucun traceur publicitaire, aucun cookie de réseaux sociaux et aucun outil de mesure d'audience.",
    sections: [
      {
        title: '1. Le principe',
        paragraphs: [
          "La CNIL distingue les traceurs strictement nécessaires au service (dispense de consentement) des traceurs qui ne le sont pas (publicité, mesure d’audience, réseaux sociaux), qui exigent votre consentement préalable.",
          "TabNest n’utilise que des traceurs strictement nécessaires. C’est pourquoi vous ne voyez pas de bandeau de consentement : il n’y a rien à autoriser ni à refuser aujourd’hui.",
        ],
      },
      {
        title: '2. Ce qui est stocké sur votre appareil',
        table: {
          head: ['Nom / clé', 'Type', 'Finalité', 'Durée'],
          rows: [
            [
              'sb-<projet>-auth-token',
              'Stockage local du navigateur',
              'Maintenir votre session ouverte (vous authentifier).',
              'Jusqu’à la déconnexion ou expiration du jeton.',
            ],
            [
              'tabnest-extension',
              'Attribut de page',
              'Permettre à l’application de détecter que l’extension est installée.',
              'Le temps de la visite.',
            ],
            [
              'session, tabs, captures, captureEnabled',
              'Stockage local de l’extension (hors site)',
              'Session de l’extension, onglets mémorisés (effacés à la fermeture du navigateur), réglage de capture et compteurs.',
              'Selon le navigateur ; « tabs » disparaît à la fermeture.',
            ],
            [
              'tabnest-cookie-notice',
              'Stockage local du navigateur',
              'Mémoriser que vous avez lu l’information cookies.',
              'Jusqu’à suppression manuelle.',
            ],
          ],
        },
      },
      {
        title: '3. Mesure d’audience (uniquement avec votre accord)',
        paragraphs: [
          'Si vous l’acceptez, nous utilisons PostHog pour mesurer l’usage du service (pages consultées, création de compte, installation de l’extension) afin de comprendre où les utilisateurs rencontrent des difficultés. PostHog est hébergé dans l’Union européenne.',
          'Nous avons désactivé l’enregistrement de session (aucune capture de votre navigation) et la collecte automatique de clics. Aucun cookie publicitaire, aucun pixel de réseaux sociaux, aucun profilage publicitaire.',
        ],
      },
      {
        title: '4. Comment les supprimer',
        list: [
          'Dans l’application : « Se déconnecter » efface la session.',
          'Dans le navigateur : Paramètres → Confidentialité → Effacer les données de navigation.',
          'Pour l’extension : la désinstaller efface son stockage local.',
        ],
      },
      {
        title: '5. Votre choix, et comment le modifier',
        paragraphs: [
          'Le bandeau s’affiche au premier passage : rien n’est chargé avant votre choix, et refuser est aussi simple qu’accepter.',
          'Vous pouvez retirer votre consentement à tout moment en effaçant les données du site dans votre navigateur (Paramètres → Confidentialité → Effacer les données de navigation pour tabnest) : le bandeau réapparaîtra et vous pourrez choisir à nouveau.',
        ],
      },
    ],
  },

  remboursement: {
    slug: 'remboursement',
    title: 'Remboursement et rétractation',
    updated: '1er novembre 2025',
    intro:
      "Le service TabNest est actuellement gratuit. Cette page décrit les règles qui s'appliqueront aux formules payantes, lorsqu'elles seront proposées, ainsi que vos droits légaux.",
    sections: [
      {
        title: '1. Qui vend le service',
        paragraphs: [
          "Lorsque les formules payantes seront disponibles, le paiement sera traité par Lemon Squeezy, qui agit comme vendeur enregistré (merchant of record). Lemon Squeezy émet la facture, encaisse le paiement et traite les remboursements selon ses propres conditions, accessibles sur son site.",
        ],
      },
      {
        title: '2. Droit de rétractation de 14 jours',
        paragraphs: [
          "Conformément à l’article L221-18 du Code de la consommation, si vous êtes consommateur, vous disposez d’un délai de 14 jours à compter de la conclusion du contrat pour exercer votre droit de rétractation, sans avoir à justifier de motif.",
          "Pour l’exercer, écrivez à salimababulgu@gmail.com ou utilisez le formulaire de rétractation fourni avec votre confirmation de commande. Le remboursement intervient dans les 14 jours suivant la réception de votre demande.",
        ],
      },
      {
        title: '3. Cas du contenu numérique fourni immédiatement',
        paragraphs: [
          "L’accès à TabNest est fourni immédiatement après le paiement. Conformément à l’article L221-28 13° du Code de la consommation, vous pouvez renoncer à votre droit de rétractation en cochant une case expresse au moment de l’achat, reconnaissant que l’exécution commence immédiatement et que vous perdez votre droit de rétractation.",
          "Si cette case n’est pas cochée, le droit de rétractation de 14 jours s’applique normalement.",
        ],
      },
      {
        title: '4. Notre politique commerciale',
        paragraphs: [
          "Au-delà des droits légaux, nous appliquons une garantie commerciale : si vous n’êtes pas satisfait, écrivez-nous dans les 14 jours suivant votre premier paiement et nous procéderons au remboursement intégral de ce paiement, sans justification. Cette garantie s’appliquera aux formules payantes et sera confirmée avant leur mise en vente.",
        ],
      },
      {
        title: '5. Comment demander un remboursement',
        list: [
          "Écrivez à salimababulgu@gmail.com en précisant l’adresse e-mail du compte et la date du paiement.",
          'Nous confirmons la demande sous 2 jours ouvrés.',
          'Le remboursement est effectué via Lemon Squeezy sur le moyen de paiement d’origine, sous 5 à 10 jours ouvrés selon votre banque.',
        ],
      },
      {
        title: '6. Abonnements',
        paragraphs: [
          "Les abonnements sont reconduits automatiquement à la fin de chaque période, sauf résiliation avant la date de renouvellement. Vous pouvez résilier à tout moment depuis votre espace de paiement ; la résiliation prend effet à la fin de la période en cours.",
        ],
      },
    ],
  },
}

export const LEGAL_PATHS: Record<string, LegalSlug> = {
  '/confidentialite': 'confidentialite',
  '/cgu': 'cgu',
  '/cookies': 'cookies',
  '/remboursement': 'remboursement',
}
