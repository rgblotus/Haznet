import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Sidebar from './Sidebar'
import { motion } from 'framer-motion'

interface PageLayoutProps {
  children: ReactNode
  title?: string
  actions?: ReactNode
  rightSidebar?: ReactNode
  breadcrumb?: { label: string; href?: string }[]
}

export default function PageLayout({
  children,
  title,
  actions,
  breadcrumb,
  rightSidebar,
}: PageLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50/50">
      <Sidebar />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-col flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-4 md:p-5 lg:p-6">
            <div className="max-w-7xl mx-auto space-y-5">
              {breadcrumb && breadcrumb.length > 0 && (
                <nav className="flex items-center gap-2 text-sm mb-2">
                  {breadcrumb.map((item, i) => (
                    <span key={i} className="flex items-center gap-2">
                      {i > 0 && <span className="text-slate-300">/</span>}
                      {item.href ? (
                        <Link to={item.href} className="text-slate-500 hover:text-indigo-600 transition-colors font-medium">
                          {item.label}
                        </Link>
                      ) : (
                        <span className="text-slate-800 font-semibold">{item.label}</span>
                      )}
                    </span>
                  ))}
                </nav>
              )}
              {(title || actions) && (
                <div className="flex items-center justify-between mb-4">
                  {title && <h1 className="text-xl font-bold text-slate-800">{title}</h1>}
                  {actions && <div>{actions}</div>}
                </div>
              )}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {children}
              </motion.div>
            </div>
          </main>
        </div>
        {rightSidebar && (
          <aside className="w-72 shrink-0 border-l border-slate-100/50 bg-white/50 backdrop-blur-sm overflow-y-auto">
            {rightSidebar}
          </aside>
        )}
      </div>
    </div>
  )
}
