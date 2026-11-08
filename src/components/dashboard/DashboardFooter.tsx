import { useLangValue } from '@/components/landing/i18n'

/**
 * Pied de page du tableau de bord : discret, mais il garantit l'accès permanent
 * aux mentions légales et aux documents obligatoires, y compris sur mobile.
 */
export function DashboardFooter() {
  const { t } = useLangValue()
  const year = new Date().getFullYear()
  const links = [
    { href: '/mentions-legales', key: 'footer.legalNotice' },
    { href: '/cgu', key: 'footer.terms' },
    { href: '/confidentialite', key: 'footer.privacy' },
    { href: '/cookies', key: 'footer.cookies' },
    { href: '/remboursement', key: 'footer.refund' },
  ]

  return (
    <footer className="mt-10 border-t border-border pt-5 pb-24 text-[11px] text-muted-foreground md:pb-8">
      <nav
        aria-label={t('footer.legal')}
        className="flex flex-wrap items-center gap-x-4 gap-y-1.5"
      >
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="underline-offset-2 hover:text-foreground hover:underline"
          >
            {t(link.key)}
          </a>
        ))}
        <a
          href="mailto:salimababulgu@gmail.com"
          className="underline-offset-2 hover:text-foreground hover:underline"
        >
          {t('footer.contact')}
        </a>
      </nav>
      <p className="mt-3 leading-relaxed">
        © {year} Filnest — {t('footer.editedBy')}
      </p>
    </footer>
  )
}
