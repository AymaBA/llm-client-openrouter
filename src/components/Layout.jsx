import { useState } from 'react'
import { Menu, Zap, PanelLeftClose, PanelLeft } from 'lucide-react'

export function Layout({ sidebar, children }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="h-full flex" style={{ background: 'var(--color-bg-primary)' }}>
      {/* Mobile sidebar backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-20 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-30
          transition-all duration-300 ease-out
          lg:relative
          ${mobileSidebarOpen ? 'translate-x-0 w-80' : '-translate-x-full w-80'}
          ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-80'}
          lg:translate-x-0
        `}
        style={{
          background: 'var(--color-bg-secondary)',
          borderRight: '1px solid var(--color-border-subtle)'
        }}
      >
        <div className={`h-full flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'lg:w-16' : 'w-80'}`}>
          {/* Toggle button */}
          <button
            className={`
              absolute top-5 z-10 p-2 rounded-lg transition-all duration-200
              ${sidebarCollapsed ? 'right-1/2 translate-x-1/2 lg:right-auto lg:left-1/2 lg:-translate-x-1/2' : 'right-4'}
            `}
            style={{
              color: 'var(--color-text-muted)',
              background: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-bg-hover)'
              e.currentTarget.style.color = 'var(--color-text-primary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--color-text-muted)'
            }}
            onClick={() => {
              if (window.innerWidth < 1024) {
                setMobileSidebarOpen(false)
              } else {
                setSidebarCollapsed(!sidebarCollapsed)
              }
            }}
            title={sidebarCollapsed ? "Ouvrir la sidebar" : "Réduire la sidebar"}
          >
            {sidebarCollapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
          </button>

          {/* Sidebar content */}
          <div className={`h-full ${sidebarCollapsed ? 'lg:hidden' : ''}`}>
            {sidebar}
          </div>

          {/* Collapsed sidebar */}
          {sidebarCollapsed && (
            <div className="hidden lg:flex flex-col h-full items-center">
              <div className="p-3 pt-16">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, var(--color-accent) 0%, #f97316 100%)',
                    boxShadow: 'var(--shadow-glow)'
                  }}
                >
                  <Zap size={20} className="text-black" fill="currentColor" />
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div
          className="lg:hidden flex items-center gap-3 px-4 py-3"
          style={{
            background: 'var(--color-bg-secondary)',
            borderBottom: '1px solid var(--color-border-subtle)'
          }}
        >
          <button
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, var(--color-accent) 0%, #f97316 100%)'
              }}
            >
              <Zap size={16} className="text-black" fill="currentColor" />
            </div>
            <span
              className="font-semibold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              LLM Client
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-h-0">{children}</div>
      </main>
    </div>
  )
}
