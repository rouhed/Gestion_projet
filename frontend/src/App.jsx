import React, { useState, useEffect } from 'react';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import MembersPage from './pages/MembersPage';
import { api } from './services/api';
import { Briefcase, Users, Moon, Sun, Search, X, Folder, ListTodo } from 'lucide-react';
import TaskDetailModal from './components/TaskDetailModal';
import logoImg from './assets/logo.png';

export default function App() {
  const [view, setView] = useState('projects'); // 'projects', 'project-detail', 'members'
  const [activeProjectId, setActiveProjectId] = useState(null);
  
  // Theme state (default dark)
  const [isLightMode, setIsLightMode] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ projects: [], tasks: [] });
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchProjectMembers, setSearchProjectMembers] = useState([]);
  const [selectedSearchTaskId, setSelectedSearchTaskId] = useState(null);
  const [isSplashLoading, setIsSplashLoading] = useState(true);
  const [splashPercent, setSplashPercent] = useState(0);

  // Splash Screen Loading Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setSplashPercent(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 20); // 20ms * 100 = 2 seconds total loading
    return () => clearInterval(interval);
  }, []);

  // Appliquer le thème clair/sombre
  useEffect(() => {
    if (isLightMode) {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [isLightMode]);

  // Effectuer la recherche à chaque frappe
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length > 1) {
        performSearch();
      } else {
        setSearchResults({ projects: [], tasks: [] });
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const performSearch = async () => {
    try {
      // 1. Rechercher les tâches
      const tasksData = await api.tasks.searchGlobal(searchQuery);
      
      // 2. Rechercher les projets (filtre côté client pour simplifier, ou charger tous les projets et filtrer)
      const allProjects = await api.projects.getAll();
      const filteredProjects = allProjects.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );

      setSearchResults({
        projects: filteredProjects,
        tasks: tasksData
      });
    } catch (err) {
      console.error('Erreur recherche globale', err);
    }
  };

  const handleSelectSearchResult = async (type, item) => {
    setSearchQuery('');
    setIsSearchFocused(false);
    
    if (type === 'project') {
      setActiveProjectId(item.id);
      setView('project-detail');
    } else if (type === 'task') {
      setActiveProjectId(item.projectId);
      setView('project-detail');
      
      // Charger les membres du projet associé pour les passer à la modale de tâche
      try {
        const proj = await api.projects.getById(item.projectId);
        setSearchProjectMembers(proj.members);
        setSelectedSearchTaskId(item.id);
      } catch (e) {
        console.error(e);
      }
    }
  };

  if (isSplashLoading) {
    return (
      <div className="splash-screen">
        <div className="splash-content" style={{ textAlign: 'center' }}>
          <img src={logoImg} alt="G-Projets Logo" className="splash-logo" style={{ marginBottom: '1rem' }} />
          <h1 className="splash-title" style={{ marginBottom: '1.5rem' }}>G-Projets</h1>
          
          <div className="splash-progress-track" style={{ margin: '0 auto 1.5rem auto' }}>
            <div className="splash-progress-bar" style={{ width: `${splashPercent}%`, animation: 'none' }}></div>
          </div>

          <div style={{ minHeight: '90px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyItems: 'center', gap: '1rem' }}>
            {splashPercent < 100 ? (
              <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                Chargement du tableau de bord... {splashPercent}%
              </span>
            ) : (
              <>
                <span className="fade-in" style={{ fontSize: '1rem', color: '#10b981', fontWeight: '700', textShadow: '0 0 10px rgba(16, 185, 129, 0.3)' }}>
                  ✓ Système chargé avec succès !
                </span>
                <button 
                  className="btn btn-primary fade-in" 
                  style={{ 
                    padding: '0.75rem 2rem', 
                    fontSize: '1rem', 
                    fontWeight: 'bold', 
                    borderRadius: '50px',
                    boxShadow: '0 4px 20px var(--primary-glow)',
                    animation: 'logoPulse 2s infinite alternate ease-in-out',
                    cursor: 'pointer'
                  }}
                  onClick={() => setIsSplashLoading(false)}
                >
                  Entrer dans l'application
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Bulles flottantes d'arrière-plan */}
      <div className="bg-bubbles">
        <div className="bubble bubble-1"></div>
        <div className="bubble bubble-2"></div>
        <div className="bubble bubble-3"></div>
      </div>

      {/* HEADER DE L'APPLICATION */}
      <header className="main-header">
        <div className="header-content">
          {/* Logo */}
          <div className="logo-section" onClick={() => { setView('projects'); setActiveProjectId(null); }}>
            <img src={logoImg} alt="G-Projets Logo" style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover', boxShadow: '0 4px 15px var(--primary-glow)' }} />
            <span className="logo-text">G-Projets</span>
          </div>

          {/* Barre de Recherche Globale et Actions */}
          <div className="header-actions">
            <div className="search-bar-container">
              <Search className="search-icon" />
              <input 
                type="text" 
                className="search-input" 
                placeholder="Rechercher tâche ou projet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)} // Retard pour permettre le clic
              />
              
              {/* RÉSULTATS DE LA RECHERCHE EN FLOTTANT */}
              {isSearchFocused && (searchQuery.trim().length > 1) && (
                <div 
                  className="glass-panel" 
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    width: '350px',
                    marginTop: '0.5rem',
                    padding: '1rem',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    zIndex: 200,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    backgroundColor: '#0f172a'
                  }}
                >
                  {/* Projets trouvés */}
                  <div>
                    <h5 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.25rem' }}>
                      Projets ({searchResults.projects.length})
                    </h5>
                    {searchResults.projects.length === 0 ? (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Aucun projet</p>
                    ) : (
                      searchResults.projects.map(proj => (
                        <div 
                          key={proj.id} 
                          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', borderRadius: '4px', cursor: 'pointer' }}
                          className="search-result-item"
                          onClick={() => handleSelectSearchResult('project', proj)}
                        >
                          <Folder size={14} style={{ color: 'var(--secondary)' }} />
                          <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{proj.name}</div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Tâches trouvées */}
                  <div>
                    <h5 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.25rem' }}>
                      Tâches ({searchResults.tasks.length})
                    </h5>
                    {searchResults.tasks.length === 0 ? (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Aucune tâche</p>
                    ) : (
                      searchResults.tasks.map(task => (
                        <div 
                          key={task.id} 
                          style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', padding: '0.5rem', borderRadius: '4px', cursor: 'pointer' }}
                          className="search-result-item"
                          onClick={() => handleSelectSearchResult('task', task)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ListTodo size={14} style={{ color: 'var(--primary)' }} />
                            <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{task.title}</div>
                          </div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '1.25rem' }}>Projet : {task.projectName}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Toggle Thème */}
            <button 
              className="theme-toggle-btn"
              onClick={() => setIsLightMode(!isLightMode)}
              title={isLightMode ? 'Activer le mode sombre' : 'Activer le mode clair'}
            >
              {isLightMode ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* CONTENU PRINCIPAL DE LA PAGE */}
      <main className="main-content">
        {view === 'projects' && (
          <ProjectsPage onSelectProject={(id) => { setActiveProjectId(id); setView('project-detail'); }} />
        )}
        
        {view === 'project-detail' && activeProjectId && (
          <ProjectDetailPage 
            projectId={activeProjectId} 
            onBack={() => { setView('projects'); setActiveProjectId(null); }} 
          />
        )}

        {view === 'members' && <MembersPage />}
      </main>

      {/* MODALE DE TACHE LANCEE DEPUIS LA RECHERCHE GLOBALE */}
      {selectedSearchTaskId && (
        <TaskDetailModal 
          taskId={selectedSearchTaskId}
          projectMembers={searchProjectMembers}
          onClose={() => setSelectedSearchTaskId(null)}
          onTaskUpdated={() => {}}
        />
      )}

      {/* Dock de navigation flottant en bas */}
      <div className="bottom-nav-dock">
        <button 
          className={`dock-item ${view === 'projects' || view === 'project-detail' ? 'active' : ''}`}
          onClick={() => { setView('projects'); setActiveProjectId(null); }}
        >
          <Briefcase className="dock-icon" />
          <span>Projets</span>
        </button>
        <button 
          className={`dock-item ${view === 'members' ? 'active' : ''}`}
          onClick={() => { setView('members'); setActiveProjectId(null); }}
        >
          <Users className="dock-icon" />
          <span>Membres</span>
        </button>
      </div>
    </div>
  );
}
