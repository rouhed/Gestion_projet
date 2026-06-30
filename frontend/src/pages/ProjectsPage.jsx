import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Plus, Calendar, Folder, ArrowRight, Trash2, Edit, X, LayoutDashboard } from 'lucide-react';

export default function ProjectsPage({ onSelectProject }) {
  const [projects, setProjects] = useState([]);
  const [projectStats, setProjectStats] = useState({});
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [customConfirm, setCustomConfirm] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [customAlert, setCustomAlert] = useState({ isOpen: false, title: 'Erreur', message: '' });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'TODO',
    startDate: '',
    endDate: ''
  });

  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const box = card.getBoundingClientRect();
    const x = e.clientX - box.left;
    const y = e.clientY - box.top;
    const centerX = box.width / 2;
    const centerY = box.height / 2;
    const rotateX = ((centerY - y) / centerY) * 10;
    const rotateY = ((x - centerX) / centerX) * 10;
    card.style.setProperty('--rx', `${rotateX}deg`);
    card.style.setProperty('--ry', `${rotateY}deg`);
  };

  const handleMouseLeave = (e) => {
    const card = e.currentTarget;
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
  };

  useEffect(() => {
    loadProjects();
  }, [filter]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await api.projects.getAll(filter);
      setProjects(data);
      
      // Load stats for each project
      const statsMap = {};
      for (const proj of data) {
        try {
          const stats = await api.projects.getStats(proj.id);
          statsMap[proj.id] = stats;
        } catch (err) {
          console.error(`Erreur stats projet ${proj.id}`, err);
        }
      }
      setProjectStats(statsMap);
      setError(null);
    } catch (err) {
      setError('Impossible de charger les projets. Assurez-vous que le serveur backend est démarré.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingProject(null);
    setFormData({
      name: '',
      description: '',
      status: 'TODO',
      startDate: new Date().toISOString().split('T')[0],
      endDate: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (e, project) => {
    e.stopPropagation(); // Éviter de naviguer vers le détail du projet
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate || ''
    });
    setIsModalOpen(true);
  };

  const handleDeleteProject = (e, id) => {
    e.stopPropagation();
    setCustomConfirm({
      isOpen: true,
      title: 'Supprimer le projet',
      message: 'Êtes-vous sûr de vouloir supprimer ce projet ? Toutes ses tâches seront supprimées définitivement.',
      onConfirm: async () => {
        try {
          await api.projects.delete(id);
          setProjects(projects.filter(p => p.id !== id));
        } catch (err) {
          setCustomAlert({ isOpen: true, title: 'Erreur', message: err.message });
        }
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProject) {
        await api.projects.update(editingProject.id, formData);
      } else {
        await api.projects.create(formData);
      }
      setIsModalOpen(false);
      loadProjects();
    } catch (err) {
      setCustomAlert({ isOpen: true, title: 'Erreur', message: err.message });
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'TODO': return 'À faire';
      case 'IN_PROGRESS': return 'En cours';
      case 'DONE': return 'Terminé';
      default: return status;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'TODO': return 'badge-todo';
      case 'IN_PROGRESS': return 'badge-progress';
      case 'DONE': return 'badge-done';
      default: return '';
    }
  };

  return (
    <div className="projects-container">
      <div className="page-header" style={{ flexDirection: 'column', textAlign: 'center', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
            <LayoutDashboard size={32} style={{ color: 'var(--primary)' }} />
            Tableau de Bord des Projets
          </h1>
          <p className="page-subtitle" style={{ fontSize: '1.05rem', marginTop: '0.5rem' }}>Gérez et suivez l'avancement de vos projets d'équipe.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreateModal} style={{ alignSelf: 'center', padding: '0.65rem 1.5rem' }}>
          <Plus size={18} /> Nouveau Projet
        </button>
      </div>

      <div className="dashboard-filters" style={{ justifyContent: 'center', marginBottom: '3rem' }}>
        <button className={`filter-tab ${filter === '' ? 'active' : ''}`} onClick={() => setFilter('')}>Tous</button>
        <button className={`filter-tab ${filter === 'TODO' ? 'active' : ''}`} onClick={() => setFilter('TODO')}>À faire</button>
        <button className={`filter-tab ${filter === 'IN_PROGRESS' ? 'active' : ''}`} onClick={() => setFilter('IN_PROGRESS')}>En cours</button>
        <button className={`filter-tab ${filter === 'DONE' ? 'active' : ''}`} onClick={() => setFilter('DONE')}>Terminés</button>
      </div>

      {error && (
        <div className="glass-panel" style={{ borderLeft: '4px solid var(--color-high)', marginBottom: '2rem' }}>
          <p style={{ color: 'var(--color-high)', fontWeight: 'bold' }}>{error}</p>
          <button className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={loadProjects}>Réessayer</button>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '4rem 0' }}>
          <div className="progress-bar-container" style={{ width: '200px' }}>
            <div className="progress-bar-fill" style={{ width: '100%', animation: 'shimmer 1.5s infinite' }}></div>
          </div>
        </div>
      ) : projects.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Folder size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Aucun projet trouvé dans cette catégorie.</p>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(project => {
            const stats = projectStats[project.id] || { completionPercentage: 0, totalTasks: 0, completedTasks: 0 };
            return (
              <div 
                key={project.id} 
                className="glass-card project-card tilt-card"
                onClick={() => onSelectProject(project.id)}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{ cursor: 'pointer' }}
              >
                <div className="project-card-header">
                  <div className="project-name">{project.name}</div>
                  <span className={`badge ${getStatusBadgeClass(project.status)}`}>
                    {getStatusLabel(project.status)}
                  </span>
                </div>
                
                <div className="project-description">
                  {project.description || 'Aucune description fournie.'}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div className="project-dates" style={{ margin: 0 }}>
                      <Calendar size={14} />
                      <span>Du {project.startDate} {project.endDate ? `au ${project.endDate}` : ''}</span>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                      Tâches : {stats.completedTasks} / {stats.totalTasks} terminées
                    </span>
                  </div>

                  <div className="circular-progress-wrapper">
                    <svg className="circular-progress-svg">
                      <defs>
                        <linearGradient id={`gradient-${project.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="var(--primary)" />
                          <stop offset="100%" stopColor="var(--secondary)" />
                        </linearGradient>
                      </defs>
                      <circle cx="36" cy="36" r="28" className="circular-progress-bg" />
                      <circle 
                        cx="36" 
                        cy="36" 
                        r="28" 
                        className="circular-progress-fill" 
                        stroke={`url(#gradient-${project.id})`}
                        strokeDasharray={2 * Math.PI * 28} 
                        strokeDashoffset={2 * Math.PI * 28 - (stats.completionPercentage / 100) * (2 * Math.PI * 28)} 
                      />
                    </svg>
                    <span className="circular-progress-text">{Math.round(stats.completionPercentage)}%</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-glass)', paddingTop: '0.75rem' }}>
                  <div className="project-members-preview">
                    {project.members && project.members.slice(0, 3).map((m, idx) => (
                      <div key={m.id} className="member-avatar" title={`${m.firstName} ${m.lastName} (${m.role})`}>
                        {m.firstName.charAt(0)}{m.lastName.charAt(0)}
                      </div>
                    ))}
                    {project.members && project.members.length > 3 && (
                      <div className="member-avatar member-avatar-plus" title={`${project.members.length - 3} de plus`}>
                        +{project.members.length - 3}
                      </div>
                    )}
                    {(!project.members || project.members.length === 0) && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Aucun membre assigné</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      className="btn btn-secondary btn-icon" 
                      onClick={(e) => handleOpenEditModal(e, project)}
                      title="Modifier le projet"
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      className="btn btn-danger btn-icon" 
                      onClick={(e) => handleDeleteProject(e, project.id)}
                      title="Supprimer le projet"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODALE GLASSMORPHIC DE CREATION/EDITION */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingProject ? 'Modifier le Projet' : 'Créer un Nouveau Projet'}</h2>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nom du projet *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Site Web E-Commerce"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea 
                    className="form-control" 
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Entrez les détails ou l'objectif du projet..."
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Date de début *</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date de fin</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Statut *</label>
                  <select 
                    className="form-control" 
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="TODO">À faire</option>
                    <option value="IN_PROGRESS">En cours</option>
                    <option value="DONE">Terminé</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale de Confirmation Personnalisée */}
      {customConfirm.isOpen && (
        <div className="modal-overlay" style={{ zIndex: 11000 }} onClick={() => setCustomConfirm({ ...customConfirm, isOpen: false })}>
          <div className="modal-content" style={{ maxWidth: '420px', textAlign: 'center', padding: '2rem' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>{customConfirm.title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              {customConfirm.message}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setCustomConfirm({ isOpen: false, title: '', message: '', onConfirm: null })}
              >
                Annuler
              </button>
              <button 
                className="btn btn-danger" 
                onClick={() => {
                  if (customConfirm.onConfirm) customConfirm.onConfirm();
                  setCustomConfirm({ isOpen: false, title: '', message: '', onConfirm: null });
                }}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale d'Alerte Personnalisée */}
      {customAlert.isOpen && (
        <div className="modal-overlay" style={{ zIndex: 11000 }} onClick={() => setCustomAlert({ ...customAlert, isOpen: false })}>
          <div className="modal-content" style={{ maxWidth: '420px', textAlign: 'center', padding: '2rem' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '1rem', fontFamily: 'var(--font-heading)', color: 'var(--color-high)' }}>{customAlert.title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              {customAlert.message}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button 
                className="btn btn-primary" 
                onClick={() => setCustomAlert({ isOpen: false, title: 'Erreur', message: '' })}
              >
                D'accord
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
