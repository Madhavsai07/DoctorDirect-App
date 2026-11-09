import { ArrowUpRight, Construction } from 'lucide-react'

interface PlaceholderPageProps {
  title: string
  description: string
  role: string
}

export function PlaceholderPage({ title, description, role }: PlaceholderPageProps) {
  return (
    <section className="page-content">
      <div className="page-heading">
        <div>
          <span className="eyebrow">{role.toUpperCase()} WORKSPACE</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <span className="page-heading__mark">
          <Construction size={23} aria-hidden="true" />
        </span>
      </div>
      <div className="placeholder-card">
        <div className="placeholder-card__icon">
          <Construction size={20} aria-hidden="true" />
        </div>
        <div>
          <h2>Feature setup in progress</h2>
          <p>
            This screen is a route placeholder only. Backend data and role-based access will be
            connected in later milestones.
          </p>
        </div>
        <span className="placeholder-card__tag">
          Foundation <ArrowUpRight size={14} aria-hidden="true" />
        </span>
      </div>
      <div className="placeholder-grid" aria-hidden="true">
        <div className="placeholder-skeleton placeholder-skeleton--wide" />
        <div className="placeholder-skeleton" />
        <div className="placeholder-skeleton" />
      </div>
    </section>
  )
}
