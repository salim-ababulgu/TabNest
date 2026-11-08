// Dictionnaire de la landing (fr / en) et détection de langue.
// Le dashboard reste en français pour l'instant : seule la page publique est bilingue.

export type Lang = 'fr' | 'en' | 'es' | 'zh'

export type Entry = string | string[]

type Dict = Record<string, Entry>

const FR: Dict = {
  'hero.h1a': 'Fermez vos onglets.',
  'hero.h1b': 'Rien ne se perd.',
  'hero.sub':
    'Filnest enregistre chaque page que vous visitez, la range par projet et lui donne une durée de vie. Fermez l’onglet : la page vous attend.',
  'hero.ctaInstall': "Installer l'extension",
  'hero.ctaSignup': 'Créer un compte gratuit',
  'hero.note': 'Gratuit, sans carte bancaire. Chrome, Edge ou Brave.',
  'hero.alt': 'Le tableau de bord Filnest : les pages gardées, rangées par sites et par visites',
  'hero.cta': 'Commencer gratuitement',
  'hero.install': "Installer l'extension",
  'hero.how': 'Comment ça marche',

  'nav.principle': 'Le principe',
  'nav.product': 'Le produit',
  'nav.automation': "L'automatisation",
  'nav.projects': 'Les projets',
  'nav.try': 'Essayer',
  'nav.faq': 'Questions fréquentes',
  'nav.install': "Installer l'extension",
  'nav.installShort': 'Installer',
  'nav.lang': 'FR',
  'nav.langTitle': 'Passer en français',
  'nav.langAria': 'Changer de langue',

  'marquee.label': 'Types de pages que Filnest conserve',
  'marquee.items': [
    'Documentation',
    "Offre d'emploi",
    'Comparatif',
    'Annonce immobilière',
    'Traduction',
    'Tutoriel',
    'Achat de voiture',
    'Article de fond',
    'Recette',
    'Série à regarder',
  ],

  'steps.nav': 'Comment ça marche',
  'steps.title': 'Installez, naviguez, retrouvez.',
  'steps.sub':
    'Trois gestes au début, puis plus rien à faire. Filnest travaille pendant que vous naviguez.',
  'steps.s1.title': "Installez l'extension",
  'steps.s1.text': 'Chrome, Edge ou Brave. Deux minutes, une connexion, et la capture est active.',
  'steps.s2.title': 'Naviguez normalement',
  'steps.s2.text':
    'Chaque page visitée est enregistrée sans rien faire, et sa durée de vie s’allonge à chaque retour.',
  'steps.s3.title': 'Retrouvez tout',
  'steps.s3.text':
    'Cherchez, rangez dans un projet, ou laissez l’archive. Aucune page utile ne repart en fumée.',
  'steps.alt1': 'Le tableau de bord Filnest à la première connexion',
  'steps.alt2': 'Les sites enregistrés, empilés par visites',
  'steps.alt3': "Le détail d'une page : sa raison et sa durée de vie",

  'lifetime.title': 'Chaque page a une durée de vie.',
  'lifetime.text':
    'Une documentation et une offre d’emploi ne méritent pas la même attention. Vous dites pourquoi vous gardez une page ; Filnest en déduit combien de temps la garder.',
  'lifetime.note':
    'Sans raison choisie, une page reste trois jours. Ensuite elle rejoint les archives, d’où vous pouvez la restaurer.',
  'lifetime.choose': 'La raison de la garder',
  'lifetime.unit': 'jours',
  'lifetime.expires': 'Expire le',
  'lifetime.visits': '+50 % à chaque visite',
  'lifetime.r.decide': 'Je n’arrive pas à décider.',
  'lifetime.r.finish': 'Je n’ai pas terminé.',
  'lifetime.r.explore': 'Je ne veux pas perdre cette possibilité.',
  'lifetime.r.remember': 'Je ne veux pas oublier que ça existe.',

  'extension.title': 'L’extension fait le travail.',
  'extension.text':
    'Chaque page visitée est enregistrée en une seconde : adresse, titre, icône. Vous n’avez rien à cliquer, rien à classer.',
  'extension.f1': 'Capture automatique, sans rien cliquer.',
  'extension.f2': 'Pause en un clic, sans désinstaller.',
  'extension.f3': 'Une session, tous vos appareils.',
  'extension.cta': "Installer l'extension",
  'extension.note': 'Chrome, Edge ou Brave. Deux minutes.',
  'extension.alt': 'La fenêtre de l’extension Filnest, une fois connectée au compte',
  'extension.caption': 'L’extension, une fois connectée.',

  'bento.title': 'Ce que Filnest fait vraiment.',
  'bento.sub':
    'Pas un énième gestionnaire de favoris. Un système qui décide avec vous, et oublie pour vous.',
  'bento.b1.title': 'Quatre raisons de garder',
  'bento.b1.text':
    'À décider, à finir, piste, à retenir. Chaque raison fixe la durée de vie de la page.',
  'bento.b2.title': 'Épingler',
  'bento.b2.text': 'Un site comme Netflix reste en tête de liste.',
  'bento.b3.title': 'Ressources',
  'bento.b3.text': 'Les sites visités une seule fois, rangés à part.',
  'bento.b4.title': "Aucune capture d'écran",
  'bento.b4.text': "URL, titre et image publique uniquement. Jamais le contenu de la page.",
  'bento.b5.title': 'Par projets',
  'bento.b5.text': 'Emploi, achat de voiture, apprentissage : chaque page retrouve son contexte.',
  'bento.b6.title': 'Cloisonné par compte',
  'bento.b6.text': 'Vos pages ne sont visibles que par vous, jamais par un autre utilisateur.',

  'comparison.title': "Un gestionnaire d'onglets range. Filnest se souvient.",
  'comparison.sub':
    'Les extensions classiques gardent des sessions ou des favoris, sur un seul navigateur. Filnest garde la page avec son intention et sa durée de vie, et la retrouve partout.',
  'comparison.local': 'Une extension locale',
  'comparison.tabnest': 'Filnest',
  'comparison.r1.label': 'Ce qui est gardé',
  'comparison.r1.local': 'Une session du navigateur, ou un favori rangé dans un dossier.',
  'comparison.r1.tabnest': "La page elle-même, avec la raison de la garder et sa date d'expiration.",
  'comparison.r2.label': 'Comment on trie',
  'comparison.r2.local': 'Des dossiers à nommer et à maintenir à la main.',
  'comparison.r2.tabnest': 'Quatre raisons (à décider, à finir, piste, à retenir) et des projets.',
  'comparison.r3.label': 'Où on la retrouve',
  'comparison.r3.local': 'Sur ce navigateur, sur cet appareil, uniquement.',
  'comparison.r3.tabnest': 'Sur tous vos appareils, via votre compte.',
  'comparison.r4.label': "Ce qu'on oublie",
  'comparison.r4.local': 'Rien ne se vide jamais : la liste grossit indéfiniment.',
  'comparison.r4.tabnest': "Chaque page a une durée de vie, qui s'allonge quand vous la revisitez.",
  'comparison.r5.label': 'Vie privée',
  'comparison.r5.local': 'Aucun compte, données locales, aucune synchro possible.',
  'comparison.r5.tabnest': "Compte cloisonné, aucune capture d'écran, aucune revente de données.",
  'comparison.note':
    "Description d'une catégorie de produit, pas d'un concurrent précis : la plupart des extensions de gestion d'onglets et de favoris stockent vos données localement, sans compte.",

  'pricing.beta':
    'La bêta est gratuite : toutes les fonctions actuelles sont ouvertes à tous. Les offres payantes seront activées plus tard, quand tout sera prêt et vérifiable.',
  'pricing.waitlist': 'Être prévenu à l’ouverture des offres',
  'pricing.title': 'Gratuit pour commencer.',
  'pricing.nav': 'Tarifs',
  'pricing.sub':
    "Filnest reste gratuit pour garder vos pages. Les formules payantes ajouteront du confort, jamais l'essentiel.",
  'pricing.rec': 'Recommandé',
  'pricing.cta.free': 'Commencer gratuitement',
  'pricing.cta.choose': 'Choisir cette offre',
  'pricing.coming': 'Bientôt disponible',
  'pricing.note':
    "Les paiements ne sont pas encore ouverts : l'activité est en cours d'immatriculation. Les tarifs affichés sont indicatifs et ne constituent pas une offre de vente.",
  'pricing.noteReady':
    "Paiement sécurisé par Lemon Squeezy, vendeur enregistré. Aucune donnée bancaire n'est stockée par Filnest. Vous pouvez annuler à tout moment.",
  'plans.free.name': 'Découverte',
  'plans.free.period': 'pour toujours',
  'plans.free.desc': 'Garder le fil, sans rien payer.',
  'plans.free.features': [
    'Pages illimitées',
    'Quatre raisons de garder',
    'Projets et épinglage',
    "Aucune capture d'écran",
  ],
  'plans.plus.name': 'Plus',
  'plans.plus.period': 'par mois',
  'plans.plus.desc': 'Pour aller plus loin au quotidien.',
  'plans.plus.features': [
    'Tout Découverte',
    'Sauvegarde prioritaire',
    'Support par e-mail',
    'Accès anticipé aux nouveautés',
  ],
  'plans.pro.name': 'Pro',
  'plans.pro.period': 'par mois',
  'plans.pro.desc': 'Pour les projets qui comptent.',
  'plans.pro.features': [
    'Tout Plus',
    'Export de vos données',
    'Statistiques de consultation',
    'Support prioritaire',
  ],

  'faq.q1': 'Filnest lit-il le contenu de mes pages ?',
  'faq.a1':
    "Non. Seules les métadonnées publiques sont enregistrées : adresse, titre, icône du site, image de partage et couleur dominante. Aucune capture d'écran, aucun texte de page.",
  'faq.q2': 'Où sont stockées mes données ?',
  'faq.a2':
    "Dans votre compte, sur notre base de données (Supabase). Chaque utilisateur ne peut accéder qu'à ses propres pages : le cloisonnement est appliqué au niveau de la base elle-même.",
  'faq.q3': 'Puis-je désactiver la capture automatique ?',
  'faq.a3':
    "Oui, à tout moment depuis le tableau de bord. L'extension arrête immédiatement d'enregistrer vos visites, sans désinstallation.",
  'faq.q4': 'Que deviennent les pages expirées ?',
  'faq.a4':
    'Elles basculent dans les archives et ne sont plus affichées. Vous pouvez les supprimer définitivement à tout moment, et la suppression de votre compte efface toutes vos données.',
  'faq.q5': "Pourquoi pas une extension de gestion d'onglets ou de favoris ?",
  'faq.a5':
    'Les extensions classiques gardent des sessions ou des favoris sur un seul navigateur. Filnest garde la page avec la raison de la garder et une durée de vie, puis la retrouve sur tous vos appareils grâce à votre compte.',
  'faq.q6': "Je change d'ordinateur : je retrouve mes pages ?",
  'faq.a6':
    "Oui. Vos pages sont dans votre compte, pas dans le navigateur : connectez-vous depuis un autre appareil et elles sont là.",
  'faq.q7': "Quelles permissions l'extension demande-t-elle ?",
  'faq.a7':
    "Lire l'adresse, le titre, l'icône et la couleur de la page active, et stocker votre session. Elle ne lit jamais le contenu des pages, ne voit pas vos mots de passe et ne lit pas vos autres onglets. Deux permissions optionnelles (historique, favoris) ne servent qu'à l'import que vous déclenchez vous-même, et peuvent être refusées.",
  'faq.q8': 'Que se passe-t-il si je ferme un onglet ou si le navigateur redémarre ?',
  'faq.a8':
    "Rien n'est perdu au moment de la fermeture : la page est déjà enregistrée. Elle reste disponible jusqu'à la fin de sa durée de vie, puis dans les archives, restaurables. C'est l'inverse d'une session qui dépend du navigateur.",
  'faq.q9': 'Filnest fonctionne-t-il sur mobile ?',
  'faq.a9':
    "L'extension est disponible sur les navigateurs de bureau (Chrome, Edge). Les navigateurs mobiles limitent les extensions ; nous travaillons sur une solution pour téléphone.",
  'faq.q10': 'Est-ce gratuit ?',
  'faq.a10':
    "Oui, gratuit aujourd'hui. Une formule payante viendra plus tard pour les besoins avancés, sans supprimer la version gratuite.",

  'split.principle.title': 'Vous ne gardez pas des onglets. Vous gardez des intentions.',
  'split.principle.text':
    "Lire, comparer, postuler, acheter, apprendre. Fermer une page donne l'impression d'abandonner ce que vous vouliez en faire.",
  'split.mobile.alt': 'Filnest sur mobile : les pages gardées, triées par site',
  'split.dark': "Réunir les pages ne suffit pas. Sinon Filnest ne serait qu'un favori de plus.",
  'split.auto.title': 'Filnest comprend la page.',
  'split.auto.text':
    "Une documentation visitée quatre fois n'a pas la même valeur qu'une offre expirée ouverte une seule fois.",
  'split.detail.alt': "Le détail d'une page dans Filnest : raison, durée de vie et visites",
  'split.projects.title': 'Vos pages, rangées par projets.',
  'split.projects.text':
    "Une offre, un comparatif et une documentation n'ont de sens que reliés à ce que vous essayez de faire. Filnest crée ce lien, puis archive le tout quand le projet est terminé.",
  'split.grid.alt': 'Les sites empilés dans Filnest, avec les projets dans le menu',
  'split.focus.title': 'Votre navigateur peut enfin redevenir un espace de travail.',
  'split.focus.l1': 'Les pages importantes restent accessibles.',
  'split.focus.l2': 'Les pages temporaires disparaissent naturellement.',
  'split.focus.l3': 'Vous ne triez que les décisions qui comptent.',
  'split.focus.badge': 'onglet ouvert',
  'split.focus.number': '1',

  'cta.title': 'Fermez tous les autres. Gardez Filnest.',
  'cta.titlea': 'Fermez vos onglets.',
  'cta.titleb': 'Filnest s’en souvient.',
  'cta.sub':
    'Deux minutes pour installer l’extension, et votre navigateur arrête de vous coûter des pages perdues.',
  'cta.install': "Installer l'extension",
  'cta.signup': 'Créer un compte gratuit',
  'cta.email': 'Votre adresse e-mail',
  'cta.emailPlaceholder': 'vous@exemple.fr',
  'cta.button': 'Commencer',
  'cta.note': 'Gratuit, sans carte bancaire. Vous supprimez ce que vous voulez, quand vous voulez.',

  'privacy.title': 'Vos pages restent les vôtres.',
  'privacy.text':
    "Filnest stocke l'adresse, le titre et l'image publique de vos pages. Pas de capture d'écran, pas de contenu privé, pas de revente. Vous supprimez ce que vous voulez, quand vous voulez.",

  'footer.tagline': 'Un onglet pour garder le fil.',
  'footer.legalNotice': 'Mentions légales',
  'footer.editedBy': 'édité par ABA, personne physique.',
  'footer.product': 'Produit',
  'footer.legal': 'Légal',
  'footer.contact': 'Contact',
  'footer.privacy': 'Confidentialité',
  'footer.terms': "Conditions d'utilisation",
  'footer.cookies': 'Cookies',
  'footer.refund': 'Remboursement',
  'footer.email': 'Écrire un e-mail',
  'footer.editor': 'Édité par ABA, personne physique. Activité non immatriculée à ce jour.',

  'usecase.title': 'Trois façons de s’en servir.',
  'usecase.sub':
    'Des pages gardées par peur de les perdre, devenues des projets qui se terminent.',
  'usecase.c1.title': 'Terminer une candidature',
  'usecase.c1.steps': [
    'Vous ouvrez une offre, puis une autre, puis le site de l’entreprise.',
    'Filnest les range dans le projet « Emploi », à finir sous 7 jours.',
    'Vous reprenez là où vous vous étiez arrêté, sur n’importe quel appareil.',
  ],
  'usecase.c1.alt': 'Les pages du projet Emploi, retrouvées sur mobile',
  'usecase.c2.title': 'Acheter une voiture',
  'usecase.c2.steps': [
    'Douze annonces ouvertes, trois comparatifs, un forum.',
    'Le projet « Achat de voiture » garde chaque piste 14 jours.',
    'Une fois la voiture achetée, le projet se ferme et tout s’archive.',
  ],
  'usecase.c2.alt': 'Une annonce gardée 14 jours, avec sa raison et sa durée de vie',
  'usecase.c3.title': 'Apprendre sans perdre ses docs',
  'usecase.c3.steps': [
    'Une doc CSS visitée quatre fois vaut de l’or.',
    'Filnest la garde 30 jours, à portée de main.',
    'Les tutoriels visités une fois restent à part, dans Ressources.',
  ],
  'usecase.c3.alt': 'Les sites empilés par visites, avec la documentation en tête',
}

const EN: Dict = {
  'hero.h1a': 'Close your tabs.',
  'hero.h1b': 'Nothing is lost.',
  'hero.sub':
    'Filnest records every page you visit, files it into projects and gives it a lifetime. Close the tab: the page waits for you.',
  'hero.ctaInstall': 'Install the extension',
  'hero.ctaSignup': 'Create a free account',
  'hero.note': 'Free, no card. Chrome, Edge or Brave.',
  'hero.alt': 'The Filnest dashboard: kept pages, grouped by site and visits',
  'hero.cta': 'Start for free',
  'hero.install': 'Install the extension',
  'hero.how': 'How it works',

  'nav.principle': 'The principle',
  'nav.product': 'The product',
  'nav.automation': 'Automation',
  'nav.projects': 'Projects',
  'nav.try': 'Try it',
  'nav.faq': 'FAQ',
  'nav.install': 'Install the extension',
  'nav.installShort': 'Install',
  'nav.lang': 'EN',
  'nav.langTitle': 'Switch to English',
  'nav.langAria': 'Switch language',

  'marquee.label': 'Kinds of pages Filnest keeps',
  'marquee.items': [
    'Documentation',
    'Job posting',
    'Comparison',
    'Real-estate listing',
    'Translation',
    'Tutorial',
    'Car shopping',
    'Long-read',
    'Recipe',
    'Series to watch',
  ],

  'steps.nav': 'How it works',
  'steps.title': 'Install, browse, find back.',
  'steps.sub': 'Three gestures at the start, then nothing to do. Filnest works while you browse.',
  'steps.s1.title': 'Install the extension',
  'steps.s1.text': 'Chrome, Edge or Brave. Two minutes, one sign-in, and capture is on.',
  'steps.s2.title': 'Browse as usual',
  'steps.s2.text':
    'Every page you visit is saved with no effort, and its lifetime grows each time you come back.',
  'steps.s3.title': 'Find everything back',
  'steps.s3.text':
    'Search it, file it into a project, or let the archive keep it. No useful page goes up in smoke.',
  'steps.alt1': 'The Filnest dashboard on first sign-in',
  'steps.alt2': 'Saved sites, stacked by visits',
  'steps.alt3': "A page's detail: its reason and its lifetime",

  'lifetime.title': 'Every page has a lifetime.',
  'lifetime.text':
    'A doc and a job posting do not deserve the same attention. You say why you keep a page; Filnest works out how long to keep it.',
  'lifetime.note':
    'With no reason chosen, a page stays three days. Then it moves to the archives, where you can restore it.',
  'lifetime.choose': 'Why you are keeping it',
  'lifetime.unit': 'days',
  'lifetime.expires': 'Expires on',
  'lifetime.visits': '+50% with each visit',
  'lifetime.r.decide': 'I can’t decide.',
  'lifetime.r.finish': 'I haven’t finished.',
  'lifetime.r.explore': 'I don’t want to lose this possibility.',
  'lifetime.r.remember': 'I don’t want to forget this exists.',

  'extension.title': 'The extension does the work.',
  'extension.text':
    'Every page you visit is saved in a second: address, title, icon. Nothing to click, nothing to sort.',
  'extension.f1': 'Automatic capture, nothing to click.',
  'extension.f2': 'Pause in one click, no uninstall.',
  'extension.f3': 'One session, all your devices.',
  'extension.cta': 'Install the extension',
  'extension.note': 'Chrome, Edge or Brave. Two minutes.',
  'extension.alt': 'The Filnest extension popup, connected to the account',
  'extension.caption': 'The extension, once connected.',

  'bento.title': 'What Filnest actually does.',
  'bento.sub': 'Not another bookmark manager. A system that decides with you, and forgets for you.',
  'bento.b1.title': 'Four reasons to keep',
  'bento.b1.text': 'Decide, finish, explore, remember. Each reason sets the page lifetime.',
  'bento.b2.title': 'Pin',
  'bento.b2.text': 'A site like Netflix stays at the top of the list.',
  'bento.b3.title': 'Resources',
  'bento.b3.text': 'Sites visited only once, kept apart.',
  'bento.b4.title': 'No screenshots',
  'bento.b4.text': 'URL, title and public image only. Never the page content.',
  'bento.b5.title': 'By project',
  'bento.b5.text': 'Job hunting, car shopping, learning: every page keeps its context.',
  'bento.b6.title': 'Private per account',
  'bento.b6.text': 'Only you can see your pages, never another user.',

  'comparison.title': 'A tab manager tidies up. Filnest remembers.',
  'comparison.sub':
    'Classic extensions keep sessions or bookmarks in a single browser. Filnest keeps the page with its intent and its lifetime, and finds it back everywhere.',
  'comparison.local': 'A local extension',
  'comparison.tabnest': 'Filnest',
  'comparison.r1.label': 'What is kept',
  'comparison.r1.local': 'A browser session, or a bookmark filed in a folder.',
  'comparison.r1.tabnest': 'The page itself, with the reason to keep it and its expiry date.',
  'comparison.r2.label': 'How it is sorted',
  'comparison.r2.local': 'Folders you name and maintain by hand.',
  'comparison.r2.tabnest': 'Four reasons (decide, finish, explore, remember) and projects.',
  'comparison.r3.label': 'Where you find it back',
  'comparison.r3.local': 'In that browser, on that device, only.',
  'comparison.r3.tabnest': 'On all your devices, through your account.',
  'comparison.r4.label': 'What is forgotten',
  'comparison.r4.local': 'Nothing ever empties: the list grows forever.',
  'comparison.r4.tabnest': 'Each page has a lifetime, which grows when you revisit it.',
  'comparison.r5.label': 'Privacy',
  'comparison.r5.local': 'No account, local data, no sync possible.',
  'comparison.r5.tabnest': 'Private account, no screenshots, no data resale.',
  'comparison.note':
    "A description of a product category, not of a specific competitor: most tab and bookmark managers store your data locally, without an account.",

  'pricing.title': 'Free to start.',
  'pricing.nav': 'Pricing',
  'pricing.sub':
    'Filnest stays free for keeping your pages. Paid plans will add comfort, never the essentials.',
  'pricing.rec': 'Recommended',
  'pricing.cta.free': 'Start for free',
  'pricing.cta.choose': 'Choose this plan',
  'pricing.coming': 'Coming soon',
  'pricing.note':
    "Payments are not open yet: the business registration is in progress. The prices shown are indicative and do not constitute an offer to sell.",
  'pricing.noteReady':
    'Secure payment by Lemon Squeezy, merchant of record. Filnest never stores your card details. Cancel anytime.',
  'plans.free.name': 'Starter',
  'plans.free.period': 'forever',
  'plans.free.desc': 'Keep the thread, pay nothing.',
  'plans.free.features': [
    'Unlimited pages',
    'Four reasons to keep',
    'Projects and pinning',
    'No screenshots',
  ],
  'plans.plus.name': 'Plus',
  'plans.plus.period': 'per month',
  'plans.plus.desc': 'To go further every day.',
  'plans.plus.features': [
    'Everything in Starter',
    'Priority backup',
    'Email support',
    'Early access to new features',
  ],
  'plans.pro.name': 'Pro',
  'plans.pro.period': 'per month',
  'plans.pro.desc': 'For the projects that matter.',
  'plans.pro.features': [
    'Everything in Plus',
    'Export your data',
    'Reading statistics',
    'Priority support',
  ],

  'faq.q1': 'Does Filnest read the content of my pages?',
  'faq.a1':
    'No. Only public metadata is stored: address, title, site icon, share image and dominant colour. No screenshots, no page text.',
  'faq.q2': 'Where is my data stored?',
  'faq.a2':
    'In your account, on our database (Supabase). Each user can only access their own pages: the separation is enforced by the database itself.',
  'faq.q3': 'Can I disable automatic capture?',
  'faq.a3':
    'Yes, anytime from the dashboard. The extension immediately stops recording your visits, no uninstall needed.',
  'faq.q4': 'What happens to expired pages?',
  'faq.a4':
    'They move to the archives and are no longer shown. You can delete them permanently at any time, and deleting your account erases all your data.',
  'faq.q5': 'Why not a tab or bookmark manager extension?',
  'faq.a5':
    'Classic extensions keep sessions or bookmarks in a single browser. Filnest keeps the page with its reason and a lifetime, and finds it back on all your devices through your account.',
  'faq.q6': 'If I change computers, do I get my pages back?',
  'faq.a6':
    'Yes. Your pages live in your account, not in the browser: sign in from another device and they are there.',
  'faq.q7': 'What permissions does the extension ask for?',
  'faq.a7':
    'Reading the active page address, title, icon and colour, and storing your session. It never reads page content, never sees your passwords and never reads your other tabs. Two optional permissions (history, bookmarks) are only used for the import you trigger yourself, and can be refused.',
  'faq.q8': 'What happens if I close a tab or the browser restarts?',
  'faq.a8':
    'Nothing is lost when you close: the page is already saved. It stays available until the end of its lifetime, then in the archives, restorable. The opposite of a session that depends on the browser.',
  'faq.q9': 'Does Filnest work on mobile?',
  'faq.a9':
    'The extension works on desktop browsers (Chrome, Edge). Mobile browsers restrict extensions; we are working on a phone solution.',
  'faq.q10': 'Is it free?',
  'faq.a10':
    'Yes, free today. A paid plan will come later for advanced needs, without removing the free version.',

  'split.principle.title': 'You are not keeping tabs. You are keeping intentions.',
  'split.principle.text':
    'Read, compare, apply, buy, learn. Closing a page feels like abandoning what you wanted to do with it.',
  'split.mobile.alt': 'Filnest on mobile: saved pages, grouped by site',
  'split.dark': "Bringing pages together is not enough. Otherwise Filnest would be just another bookmark.",
  'split.auto.title': 'Filnest understands the page.',
  'split.auto.text':
    "A documentation visited four times is not worth the same as an expired offer opened once.",
  'split.detail.alt': "A page's detail in Filnest: reason, lifetime and visits",
  'split.projects.title': 'Your pages, filed by project.',
  'split.projects.text':
    "An offer, a comparison and a documentation only make sense tied to what you are trying to do. Filnest creates that link, then archives it all when the project is done.",
  'split.grid.alt': 'Sites stacked in Filnest, with projects in the menu',
  'split.focus.title': 'Your browser can finally be a workspace again.',
  'split.focus.l1': 'Important pages stay within reach.',
  'split.focus.l2': 'Temporary pages disappear naturally.',
  'split.focus.l3': 'You only sort the decisions that matter.',
  'split.focus.badge': 'open tab',
  'split.focus.number': '1',

  'cta.title': 'Close all the others. Keep Filnest.',
  'cta.titlea': 'Close your tabs.',
  'cta.titleb': 'Filnest remembers.',
  'cta.sub':
    'Two minutes to install the extension, and your browser stops costing you lost pages.',
  'cta.install': 'Install the extension',
  'cta.signup': 'Create a free account',
  'cta.email': 'Your email address',
  'cta.emailPlaceholder': 'you@example.com',
  'cta.button': 'Start',
  'cta.note': 'Free, no card. Delete whatever you want, whenever you want.',

  'privacy.title': 'Your pages stay yours.',
  'privacy.text':
    "Filnest stores the address, title and public image of your pages. No screenshots, no private content, no resale. You delete whatever you want, whenever you want.",

  'footer.tagline': 'One tab to keep the thread.',
  'footer.legalNotice': 'Legal notice',
  'footer.editedBy': 'edited by ABA, individual.',
  'footer.product': 'Product',
  'footer.legal': 'Legal',
  'footer.contact': 'Contact',
  'footer.privacy': 'Privacy',
  'footer.terms': 'Terms of use',
  'footer.cookies': 'Cookies',
  'footer.refund': 'Refunds',
  'footer.email': 'Write an email',
  'footer.editor': 'Edited by ABA, individual. Business not registered yet.',

  'usecase.title': 'Three ways to use it.',
  'usecase.sub': 'Pages you used to keep out of fear, turned into projects that get finished.',
  'usecase.c1.title': 'Finish a job application',
  'usecase.c1.steps': [
    'You open one offer, then another, then the company site.',
    'Filnest files them in the "Job" project, to finish within 7 days.',
    'You pick up where you left off, on any device.',
  ],
  'usecase.c1.alt': 'Job project pages, found back on mobile',
  'usecase.c2.title': 'Buy a car',
  'usecase.c2.steps': [
    'Twelve ads open, three comparisons, one forum.',
    'The "Car shopping" project keeps each lead for 14 days.',
    'Once the car is bought, the project closes and everything archives.',
  ],
  'usecase.c2.alt': 'An ad kept 14 days, with its reason and its lifetime',
  'usecase.c3.title': 'Learn without losing your docs',
  'usecase.c3.steps': [
    'A CSS doc visited four times is worth gold.',
    'Filnest keeps it for 30 days, within reach.',
    'Tutorials visited once stay apart, in Resources.',
  ],
  'usecase.c3.alt': 'Sites stacked by visits, with the documentation on top',
}

export const DICT: Partial<Record<Lang, Dict>> = { fr: FR, en: EN }

export function detectLang(): Lang {
  try {
    const saved = window.localStorage.getItem('tabnest-lang')
    if (saved === 'fr' || saved === 'en' || saved === 'es' || saved === 'zh') return saved
  } catch {
    // stockage indisponible
  }
  if (typeof navigator !== 'undefined') {
    const code = navigator.language?.toLowerCase() ?? ''
    if (code.startsWith('fr')) return 'fr'
    if (code.startsWith('es')) return 'es'
    if (code.startsWith('zh')) return 'zh'
    if (code.startsWith('en')) return 'en'
  }
  return 'en'
}

export function saveLang(lang: Lang): void {
  try {
    window.localStorage.setItem('tabnest-lang', lang)
  } catch {
    // stockage indisponible
  }
}
