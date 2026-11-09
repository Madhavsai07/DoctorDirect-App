import { ArrowRight, CalendarCheck2, ClipboardList, Stethoscope } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'
import { BrandMark } from '@/components/common/BrandMark'

const benefits = [
  {
    icon: Stethoscope,
    title: 'Find the right doctor',
    description: 'Explore doctors and their specialties to find care that fits your needs.',
  },
  {
    icon: CalendarCheck2,
    title: 'Keep appointments organized',
    description: 'Book visits and keep track of upcoming and past appointments in one place.',
  },
  {
    icon: ClipboardList,
    title: 'Stay connected to your care',
    description: 'Access prescriptions and consultation information through your account.',
  },
]

export function LandingPage() {
  const user = useAppSelector((state) => state.auth.user)
  const destination = user ? `/${user.role}/dashboard` : '/register/patient'

  return (
    <main className="landing-page">
      <header className="landing-header">
        <Link className="brand-lockup" to="/" aria-label="DoctorDirect home">
          <BrandMark />
          <span>DoctorDirect</span>
        </Link>
        <nav className="landing-header__actions" aria-label="Main navigation">
          <Link className="landing-link" to="/login">Sign in</Link>
          <Link className="button button--primary landing-header__cta" to="/register/patient">
            Get started <ArrowRight size={16} />
          </Link>
        </nav>
      </header>

      <section className="landing-hero">
        <div className="landing-hero__content">
          <span className="eyebrow">CARE THAT CONNECTS</span>
          <h1>Better care starts with a simpler connection.</h1>
          <p>
            Find a doctor, manage appointments, and keep your care information together with DoctorDirect.
          </p>
          <div className="landing-hero__actions">
            <Link className="button button--primary landing-action" to={destination}>
              {user ? 'Go to your dashboard' : 'Get started'} <ArrowRight size={17} />
            </Link>
            <Link className="landing-secondary-action" to="/register/doctor">
              Join as a doctor
            </Link>
          </div>
          <div className="landing-hero__note">
            <span className="landing-hero__note-mark"><CalendarCheck2 size={17} /></span>
            <span>Appointments and care details, all in one place.</span>
          </div>
        </div>

        <div className="landing-hero__visual" aria-hidden="true">
          <div className="landing-visual-card landing-visual-card--back">
            <span className="landing-visual-card__orb"><Stethoscope size={25} /></span>
          </div>
          <div className="landing-visual-card landing-visual-card--front">
            <span className="landing-visual-card__label">YOUR CARE, CONNECTED</span>
            <div className="landing-visual-card__row">
              <span className="landing-visual-card__icon"><CalendarCheck2 size={19} /></span>
              <span><strong>Appointments</strong><small>Plan your next visit</small></span>
              <ArrowRight size={17} />
            </div>
            <div className="landing-visual-card__row">
              <span className="landing-visual-card__icon landing-visual-card__icon--blue"><ClipboardList size={19} /></span>
              <span><strong>Care information</strong><small>Keep important details close</small></span>
              <ArrowRight size={17} />
            </div>
            <div className="landing-visual-card__footer"><span /> Designed around your care journey</div>
          </div>
          <div className="landing-visual-badge"><span><Stethoscope size={17} /></span> Patient and doctor workspaces</div>
        </div>
      </section>

      <section className="landing-benefits" aria-labelledby="landing-benefits-title">
        <div className="landing-benefits__heading">
          <span className="eyebrow">ONE PLACE FOR YOUR CARE</span>
          <h2 id="landing-benefits-title">A clearer way to manage care</h2>
        </div>
        <div className="landing-benefits__grid">
          {benefits.map(({ icon: Icon, title, description }) => (
            <article className="landing-benefit" key={title}>
              <span className="landing-benefit__icon"><Icon size={20} /></span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="landing-footer">
        <Link className="brand-lockup" to="/">
          <BrandMark />
          <span>DoctorDirect</span>
        </Link>
        <span>Healthcare, connected.</span>
      </footer>
    </main>
  )
}
