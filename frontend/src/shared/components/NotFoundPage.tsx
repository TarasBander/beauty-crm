import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

// Catch-all for any URL that matches no route — sits outside both the
// /login route and the protected layout route (see App.tsx), so it
// renders the same for everyone regardless of auth state: no extra
// bounce through "/" (which would then redirect a logged-out visitor to
// /login a second time) and no page chrome to build for a route that
// doesn't really exist.
export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <div className="not-found-page">
      <div className="not-found-card">
        <p className="not-found-code">404</p>
        <p>{t('common.notFound.title')}</p>
        <Link to="/" className="text-link">
          {t('common.notFound.backHome')}
        </Link>
      </div>
    </div>
  )
}
