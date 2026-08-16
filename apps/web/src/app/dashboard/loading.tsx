export default function DashboardLoading() {
  return (
    <main className="dashboard-loading-shell" aria-label="Caricamento dashboard">
      <aside className="dashboard-loading-sidebar">
        <span className="loading-brand" />
        {Array.from({ length: 9 }).map((_, index) => (
          <span className="loading-nav" key={index} />
        ))}
      </aside>
      <section className="dashboard-loading-main">
        <header className="dashboard-loading-header">
          <span className="loading-title" />
          <span className="loading-actions" />
        </header>
        <div className="dashboard-loading-content">
          <div className="loading-kpis">
            {Array.from({ length: 4 }).map((_, index) => (
              <span className="loading-card" key={index} />
            ))}
          </div>
          <div className="loading-panels">
            <span className="loading-panel wide" />
            <span className="loading-panel" />
          </div>
          <div className="loading-panels bottom">
            <span className="loading-panel wide" />
            <span className="loading-panel" />
          </div>
        </div>
      </section>
    </main>
  );
}
