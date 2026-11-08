import { cn } from '@/lib/utils'

/**
 * Illustration sur mesure de la page /extension : un navigateur, un nid et une
 * page qui s'y pose. Trait plat isométrique, couleurs de la marque (encre,
 * papier, miel, lime), sans dégradé ni ombre portée.
 */
export function ExtensionIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 480 340"
      role="img"
      aria-label="Une page de navigateur vole vers un nid Filnest."
      className={cn('h-auto w-full', className)}
      fill="none"
    >
      {/* Fenêtre de navigateur */}
      <rect x="70" y="30" width="340" height="230" rx="14" fill="#1f2c25" />
      <rect x="82" y="46" width="316" height="200" rx="8" fill="#f6f1e4" />

      {/* Barre d'onglets */}
      <rect x="82" y="46" width="316" height="34" rx="8" fill="#2b382f" />
      <rect x="82" y="72" width="316" height="8" fill="#2b382f" />
      <circle cx="100" cy="63" r="4" fill="#f6f1e4" />
      <circle cx="114" cy="63" r="4" fill="#e8a13c" />
      <circle cx="128" cy="63" r="4" fill="#c8f05a" />

      {/* Page affichée */}
      <rect x="106" y="96" width="150" height="120" rx="8" fill="#ffffff" stroke="#e4dcc6" />
      <rect x="118" y="112" width="112" height="8" rx="4" fill="#1f2c25" />
      <rect x="118" y="130" width="90" height="6" rx="3" fill="#d9d2be" />
      <rect x="118" y="142" width="100" height="6" rx="3" fill="#d9d2be" />
      <rect x="118" y="154" width="76" height="6" rx="3" fill="#d9d2be" />

      {/* Logo F sur la page */}
      <circle cx="286" cy="140" r="34" fill="#c8f05a" />
      <path
        d="M272 158 v-36 h30 a14 14 0 0 1 0 28 h-20"
        stroke="#1c1a10"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Trajectoire de la page volante */}
      <path
        d="M404 250 C 380 216, 352 190, 318 172"
        stroke="#e8a13c"
        strokeWidth="3"
        strokeDasharray="2 10"
        strokeLinecap="round"
        fill="none"
      />

      {/* Page volante */}
      <g transform="rotate(-14 396 262)">
        <rect x="368" y="240" width="64" height="80" rx="8" fill="#ffffff" stroke="#e4dcc6" />
        <path d="M432 240 v26 a10 10 0 0 1 -10 10 h-10" fill="#c8f05a" />
        <rect x="378" y="254" width="38" height="7" rx="3.5" fill="#1f2c25" />
        <rect x="378" y="268" width="32" height="6" rx="3" fill="#d9d2be" />
        <rect x="378" y="280" width="36" height="6" rx="3" fill="#d9d2be" />
      </g>

      {/* Nid */}
      <path
        d="M108 312 a132 34 0 0 0 264 0 z"
        fill="#e8a13c"
      />
      <path
        d="M118 310 c 20 -18 60 -24 122 -24 s 102 6 122 24"
        stroke="#1f2c25"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M160 306 c 14 -8 40 -10 80 -10 s 66 2 80 10"
        stroke="#c8f05a"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      {/* Petites pages posées dans le nid */}
      <rect x="214" y="294" width="26" height="20" rx="4" fill="#ffffff" transform="rotate(-8 227 304)" />
      <rect x="246" y="298" width="22" height="16" rx="4" fill="#ffffff" transform="rotate(6 257 306)" />
    </svg>
  )
}
