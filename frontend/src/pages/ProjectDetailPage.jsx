import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Play, CheckCircle2, ListTodo, Plus, Users, UserPlus, UserMinus, Clock, Calendar, ArrowLeft, X } from 'lucide-react';
import TaskDetailModal from '../components/TaskDetailModal';

const formatLoggedHours = (hours) => {
  if (!hours || hours <= 0) return '0 min';
  const totalMinutes = Math.round(hours * 60);
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hrs > 0) {
    return mins > 0 ? `${hrs}h${mins} min` : `${hrs}h`;
  } else {
    return `${mins} min`;
  }
};

export default function ProjectDetailPage({ projectId, onBack }) {
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [globalMembers, setGlobalMembers] = useState([]); // Pour ajouter de nouveaux membres
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const canvasRef = React.useRef(null);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban', 'gantt'
  const [activeDragColumn, setActiveDragColumn] = useState(null);
  
  // Modals & Sub-states
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isAddMemberMode, setIsAddMemberMode] = useState(false);
  const [selectedMemberToAdd, setSelectedMemberToAdd] = useState('');
  
  // Task Create State
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [customConfirm, setCustomConfirm] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [customAlert, setCustomAlert] = useState({ isOpen: false, title: 'Erreur', message: '' });
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    estimatedHours: 0,
    assigneeId: ''
  });

  const triggerCelebration = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#6366f1', '#06b6d4', '#d946ef', '#10b981', '#f59e0b', '#ef4444'];
    const particles = [];

    for (let i = 0; i < 150; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 50,
        y: canvas.height / 2 + (Math.random() - 0.5) * 50,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15 - 5,
        radius: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: Math.random() * 0.015 + 0.005,
        gravity: 0.15
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      particles.forEach(p => {
        if (p.alpha > 0) {
          alive = true;
          p.x += p.vx;
          p.y += p.vy;
          p.vy += p.gravity;
          p.alpha -= p.decay;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(p.alpha, 0);
          ctx.fill();
        }
      });

      if (alive) {
        requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    animate();
  };

  const getGanttTaskPosition = (task, idx) => {
    const start = (idx % 4) + 2;
    const duration = Math.max(2, Math.min(8, Math.ceil((task.estimatedHours || 4) / 2)));
    return { start, duration };
  };

  const getMemberWorkload = (memberId) => {
    const memberTasks = tasks.filter(t => t.assignee && t.assignee.id === memberId);
    const totalEst = memberTasks.reduce((acc, t) => acc + (t.estimatedHours || 0), 0);
    const totalLog = memberTasks.reduce((acc, t) => acc + (t.loggedHours || 0), 0);
    const percent = Math.min((totalEst / 40) * 100, 100);
    return { count: memberTasks.length, totalEst, totalLog, percent };
  };

  const handleCardMouseMove = (e) => {
    const card = e.currentTarget;
    const box = card.getBoundingClientRect();
    const x = e.clientX - box.left;
    const y = e.clientY - box.top;
    card.style.setProperty('--x', `${x}px`);
    card.style.setProperty('--y', `${y}px`);
    
    const centerX = box.width / 2;
    const centerY = box.height / 2;
    const rotateX = ((centerY - y) / centerY) * 10;
    const rotateY = ((x - centerX) / centerX) * 10;
    card.style.setProperty('--rx', `${rotateX}deg`);
    card.style.setProperty('--ry', `${rotateY}deg`);
  };

  const handleCardMouseLeave = (e) => {
    const card = e.currentTarget;
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
  };

  useEffect(() => {
    loadAllData();
  }, [projectId]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const projData = await api.projects.getById(projectId);
      setProject(projData);

      const statsData = await api.projects.getStats(projectId);
      setStats(statsData);

      const tasksData = await api.tasks.getByProject(projectId);
      setTasks(tasksData);

      const allMembers = await api.members.getAll();
      setGlobalMembers(allMembers);

      setError(null);
    } catch (err) {
      setError('Impossible de charger les détails du projet.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const reloadTasksAndStats = async () => {
    try {
      const statsData = await api.projects.getStats(projectId);
      setStats(statsData);

      const tasksData = await api.tasks.getByProject(projectId);
      setTasks(tasksData);
    } catch (err) {
      console.error('Erreur rechargement tâches/stats', err);
    }
  };

  // --- GESTION DES MEMBRES ---

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedMemberToAdd) return;
    try {
      const updatedProj = await api.projects.addMember(projectId, parseInt(selectedMemberToAdd));
      setProject(updatedProj);
      setSelectedMemberToAdd('');
      setIsAddMemberMode(false);
      loadAllData(); // Recharger pour rafraîchir les listes
    } catch (err) {
      setCustomAlert({ isOpen: true, title: 'Erreur', message: err.message });
    }
  };

  const handleRemoveMember = (memberId) => {
    setCustomConfirm({
      isOpen: true,
      title: 'Retirer le membre',
      message: 'Voulez-vous vraiment retirer ce membre du projet ? Ses tâches en cours seront conservées.',
      onConfirm: async () => {
        try {
          const updatedProj = await api.projects.removeMember(projectId, memberId);
          setProject(updatedProj);
          loadAllData();
        } catch (err) {
          setCustomAlert({ isOpen: true, title: 'Erreur', message: err.message });
        }
      }
    });
  };

  // Filtre les membres globaux pour n'afficher que ceux qui ne sont pas déjà dans le projet
  const getNonProjectMembers = () => {
    if (!project || !globalMembers) return [];
    const projectMemberIds = new Set(project.members.map(m => m.id));
    return globalMembers.filter(m => !projectMemberIds.has(m.id));
  };

  // --- GESTION DRAG AND DROP KANBAN ---

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId.toString());
    e.currentTarget.classList.add('dragging');
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('dragging');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    const taskIdStr = e.dataTransfer.getData('text/plain');
    if (!taskIdStr) return;
    const taskId = parseInt(taskIdStr);
    
    // Récupérer la tâche et son statut d'origine
    const draggedTask = tasks.find(t => t.id === taskId);
    const sourceStatus = draggedTask ? draggedTask.status : '';
    
    // Optimistic UI update
    const previousTasks = [...tasks];
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: targetStatus } : t));
    
    try {
      await api.tasks.changeStatus(taskId, targetStatus);
      
      if (targetStatus === 'DONE') {
        triggerCelebration();
        // Arrêter le minuteur si actif pour cette tâche et enregistrer le temps en heures décimales
        const runningTaskId = localStorage.getItem('running_task_id');
        if (runningTaskId === taskId.toString()) {
          const startTime = parseInt(localStorage.getItem('timer_start_time'));
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          localStorage.removeItem('running_task_id');
          localStorage.removeItem('timer_start_time');
          
          if (elapsed > 0) {
            const hoursTracked = parseFloat((elapsed / 3600).toFixed(2));
            const hoursToLog = Math.max(0.01, hoursTracked);
            await api.tasks.addHours(taskId, hoursToLog);
          }
        }
      } else if (targetStatus === 'IN_PROGRESS' && sourceStatus === 'TODO') {
        // Lancement automatique du minuteur lors du passage à "En cours"
        localStorage.setItem('running_task_id', taskId.toString());
        localStorage.setItem('timer_start_time', Date.now().toString());
      } else {
        // Si déplacé vers un autre état, on arrête le minuteur s'il tournait sur cette tâche
        const runningTaskId = localStorage.getItem('running_task_id');
        if (runningTaskId === taskId.toString()) {
          localStorage.removeItem('running_task_id');
          localStorage.removeItem('timer_start_time');
        }
      }
      
      reloadTasksAndStats();
    } catch (err) {
      setCustomAlert({ isOpen: true, title: 'Erreur', message: err.message });
      setTasks(previousTasks); // Rollback en cas d'erreur
    }
  };

  // --- CREATION DE TACHE ---

  const handleOpenCreateTaskModal = () => {
    setTaskFormData({
      title: '',
      description: '',
      status: 'TODO',
      priority: 'MEDIUM',
      estimatedHours: 4,
      assigneeId: ''
    });
    setIsCreateTaskModalOpen(true);
  };

  const handleCreateTaskSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: taskFormData.title,
        description: taskFormData.description,
        status: taskFormData.status,
        priority: taskFormData.priority,
        estimatedHours: parseInt(taskFormData.estimatedHours) || 0,
        assignee: taskFormData.assigneeId ? { id: parseInt(taskFormData.assigneeId) } : null
      };

      await api.tasks.create(projectId, payload);
      setIsCreateTaskModalOpen(false);
      reloadTasksAndStats();
    } catch (err) {
      setCustomAlert({ isOpen: true, title: 'Erreur', message: err.message });
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'LOW': return 'badge-low';
      case 'MEDIUM': return 'badge-medium';
      case 'HIGH': return 'badge-high';
      default: return '';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'LOW': return 'Basse';
      case 'MEDIUM': return 'Moyenne';
      case 'HIGH': return 'Haute';
      default: return priority;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', margin: '4rem 0' }}>
        <div className="progress-bar-container" style={{ width: '200px' }}>
          <div className="progress-bar-fill" style={{ width: '100%', animation: 'shimmer 1.5s infinite' }}></div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: 'var(--color-high)', fontWeight: 'bold' }}>{error || 'Projet introuvable.'}</p>
        <button className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={onBack}>Retour aux projets</button>
      </div>
    );
  }

  // Filtrer les tâches par colonnes
  const todoTasks = tasks.filter(t => t.status === 'TODO');
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS');
  const doneTasks = tasks.filter(t => t.status === 'DONE');

  const nonProjectMembers = getNonProjectMembers();

  return (
    <div className="project-detail-container">
      {/* En-tête de retour */}
      <button className="btn btn-secondary" style={{ marginBottom: '1.5rem', padding: '0.45rem 1rem', fontSize: '0.85rem' }} onClick={onBack}>
        <ArrowLeft size={16} /> Retour aux projets
      </button>

      {/* Titre et Détails Projet */}
      <div className="glass-panel" style={{ marginBottom: '2rem', padding: '1.5rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{project.name}</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.95rem', maxWidth: '800px', lineHeight: '1.5' }}>
              {project.description}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <Calendar size={16} />
            <span>Du {project.startDate} {project.endDate ? `au ${project.endDate}` : ''}</span>
          </div>
        </div>
      </div>

      <div className="project-details-grid">
        {/* Colonne Principale : Tableau Kanban */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                {viewMode === 'kanban' ? 'Tableau Kanban' : 'Chronologie (Gantt)'}
              </h3>
              <div className="view-toggle-container">
                <button 
                  className={`view-toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`} 
                  onClick={() => setViewMode('kanban')}
                >
                  Kanban
                </button>
                <button 
                  className={`view-toggle-btn ${viewMode === 'gantt' ? 'active' : ''}`} 
                  onClick={() => setViewMode('gantt')}
                >
                  Gantt
                </button>
              </div>
            </div>
            <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={handleOpenCreateTaskModal}>
              <Plus size={16} /> Nouvelle Tâche
            </button>
          </div>

          {viewMode === 'gantt' ? (
            <div className="gantt-chart-container">
              <div className="gantt-header-row">
                <div className="gantt-title-col">Tâches</div>
                <div className="gantt-timeline-days">
                  {Array.from({ length: 14 }).map((_, i) => (
                    <div key={i}>J{i + 1}</div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {tasks.map((task, idx) => {
                  const { start, duration } = getGanttTaskPosition(task, idx);
                  return (
                    <div key={task.id} className="gantt-row">
                      <div 
                        className="gantt-task-name" 
                        onClick={() => { setSelectedTaskId(task.id); setIsTaskModalOpen(true); }} 
                        style={{ cursor: 'pointer' }}
                        title={task.title}
                      >
                        {task.title}
                      </div>
                      <div className="gantt-bar-track">
                        <div 
                          className={`gantt-bar-fill gantt-bar-${task.priority.toLowerCase()}`}
                          style={{
                            gridColumnStart: start,
                            gridColumnEnd: `span ${duration}`,
                            '--start': start,
                            '--duration': duration
                          }}
                          onClick={() => { setSelectedTaskId(task.id); setIsTaskModalOpen(true); }}
                          title={`${task.title} - ${task.loggedHours}/${task.estimatedHours}h (${task.priority})`}
                        >
                          {task.assignee ? `${task.assignee.firstName.charAt(0)}${task.assignee.lastName.charAt(0)}` : ''} ({task.estimatedHours}h)
                        </div>
                      </div>
                    </div>
                  );
                })}
                {tasks.length === 0 && (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', padding: '2rem' }}>
                    Aucune tâche créée pour le moment.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="kanban-board">
              {/* Colonne A FAIRE */}
              <div 
                className={`kanban-column ${activeDragColumn === 'TODO' ? 'drag-hover-column' : ''}`}
                onDragOver={handleDragOver}
                onDragEnter={() => setActiveDragColumn('TODO')}
                onDragLeave={() => setActiveDragColumn(null)}
                onDrop={(e) => { handleDrop(e, 'TODO'); setActiveDragColumn(null); }}
              >
                <div className="kanban-column-header">
                  <span className="kanban-column-title" style={{ color: 'var(--text-secondary)' }}>
                    <ListTodo size={16} /> À faire
                  </span>
                  <span className="kanban-column-count">{todoTasks.length}</span>
                </div>
                <div className="kanban-tasks-list">
                  {todoTasks.map(task => (
                    <div 
                      key={task.id} 
                      className="task-card tilt-card"
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={handleDragEnd}
                      onMouseMove={handleCardMouseMove}
                      onMouseLeave={handleCardMouseLeave}
                      onClick={() => { setSelectedTaskId(task.id); setIsTaskModalOpen(true); }}
                    >
                      <div className="task-card-header">
                        <span className={`badge ${getPriorityBadgeClass(task.priority)}`}>
                          {getPriorityLabel(task.priority)}
                        </span>
                      </div>
                      <div className="task-title">{task.title}</div>
                      <div className="task-description">{task.description}</div>
                      
                      <div className="task-card-footer">
                        <div className="task-hours">
                          <Clock size={12} />
                          <span>{formatLoggedHours(task.loggedHours)} / {task.estimatedHours}h</span>
                        </div>
                        {task.assignee ? (
                          <div className="member-avatar" style={{ margin: 0 }} title={`Assigné à : ${task.assignee.firstName}`}>
                            {task.assignee.firstName.charAt(0)}{task.assignee.lastName.charAt(0)}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Non assignée</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Colonne EN COURS */}
              <div 
                className={`kanban-column ${activeDragColumn === 'IN_PROGRESS' ? 'drag-hover-column' : ''}`}
                onDragOver={handleDragOver}
                onDragEnter={() => setActiveDragColumn('IN_PROGRESS')}
                onDragLeave={() => setActiveDragColumn(null)}
                onDrop={(e) => { handleDrop(e, 'IN_PROGRESS'); setActiveDragColumn(null); }}
              >
                <div className="kanban-column-header">
                  <span className="kanban-column-title" style={{ color: 'var(--color-progress)' }}>
                    <Play size={16} /> En cours
                  </span>
                  <span className="kanban-column-count">{inProgressTasks.length}</span>
                </div>
                <div className="kanban-tasks-list">
                  {inProgressTasks.map(task => (
                    <div 
                      key={task.id} 
                      className="task-card tilt-card"
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={handleDragEnd}
                      onMouseMove={handleCardMouseMove}
                      onMouseLeave={handleCardMouseLeave}
                      onClick={() => { setSelectedTaskId(task.id); setIsTaskModalOpen(true); }}
                    >
                      <div className="task-card-header">
                        <span className={`badge ${getPriorityBadgeClass(task.priority)}`}>
                          {getPriorityLabel(task.priority)}
                        </span>
                      </div>
                      <div className="task-title">{task.title}</div>
                      <div className="task-description">{task.description}</div>
                      
                      <div className="task-card-footer">
                        <div className="task-hours">
                          <Clock size={12} />
                          <span>{formatLoggedHours(task.loggedHours)} / {task.estimatedHours}h</span>
                        </div>
                        {task.assignee ? (
                          <div className="member-avatar" style={{ margin: 0 }} title={`Assigné à : ${task.assignee.firstName}`}>
                            {task.assignee.firstName.charAt(0)}{task.assignee.lastName.charAt(0)}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Non assignée</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Colonne TERMINE */}
              <div 
                className={`kanban-column ${activeDragColumn === 'DONE' ? 'drag-hover-column' : ''}`}
                onDragOver={handleDragOver}
                onDragEnter={() => setActiveDragColumn('DONE')}
                onDragLeave={() => setActiveDragColumn(null)}
                onDrop={(e) => { handleDrop(e, 'DONE'); setActiveDragColumn(null); }}
              >
                <div className="kanban-column-header">
                  <span className="kanban-column-title" style={{ color: 'var(--color-done)' }}>
                    <CheckCircle2 size={16} /> Terminé
                  </span>
                  <span className="kanban-column-count">{doneTasks.length}</span>
                </div>
                <div className="kanban-tasks-list">
                  {doneTasks.map(task => (
                    <div 
                      key={task.id} 
                      className="task-card tilt-card"
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={handleDragEnd}
                      onMouseMove={handleCardMouseMove}
                      onMouseLeave={handleCardMouseLeave}
                      onClick={() => { setSelectedTaskId(task.id); setIsTaskModalOpen(true); }}
                    >
                      <div className="task-card-header">
                        <span className={`badge ${getPriorityBadgeClass(task.priority)}`}>
                          {getPriorityLabel(task.priority)}
                        </span>
                      </div>
                      <div className="task-title" style={{ textDecoration: 'line-through', opacity: 0.65 }}>{task.title}</div>
                      <div className="task-description" style={{ opacity: 0.5 }}>{task.description}</div>
                      
                      <div className="task-card-footer">
                        <div className="task-hours">
                          <Clock size={12} />
                          <span>{formatLoggedHours(task.loggedHours)} / {task.estimatedHours}h</span>
                        </div>
                        {task.assignee ? (
                          <div className="member-avatar" style={{ margin: 0 }} title={`Assigné à : ${task.assignee.firstName}`}>
                            {task.assignee.firstName.charAt(0)}{task.assignee.lastName.charAt(0)}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Non assignée</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Colonne Latérale : Statistiques & Membres */}
        <div className="project-sidebar">
          {/* Panel Statistiques */}
          {stats && (
            <div className="glass-panel project-stats-panel">
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
                Statistiques du Projet
              </h3>
              
              {/* Cercle d'avancement / Barre progress dynamique */}
              <div style={{ margin: '0.5rem 0' }}>
                <div className="progress-bar-container" style={{ height: '10px' }}>
                  <div className="progress-bar-fill" style={{ width: `${stats.completionPercentage}%` }}></div>
                </div>
                <div className="progress-label-container">
                  <span>Taux de complétion</span>
                  <span>{Math.round(stats.completionPercentage)}%</span>
                </div>
              </div>

              <div className="stat-row">
                <span className="stat-label">Tâches totales</span>
                <span className="stat-value">{stats.totalTasks}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Tâches terminées</span>
                <span className="stat-value">{stats.completedTasks}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Heures estimées</span>
                <span className="stat-value" style={{ color: 'var(--secondary)' }}>{stats.totalEstimatedHours}h</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Heures réalisées</span>
                <span className="stat-value" style={{ color: 'var(--primary)' }}>{formatLoggedHours(stats.totalLoggedHours)}</span>
              </div>
            </div>
          )}

          {/* Panel Charge de Travail (Workload) */}
          <div className="glass-panel" style={{ marginTop: '0px' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
              Charge de l'Équipe (Semaine)
            </h3>
            <div className="workload-gauge-container">
              {project.members && project.members.map(member => {
                const workload = getMemberWorkload(member.id);
                return (
                  <div key={member.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', background: 'rgba(255, 255, 255, 0.02)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{member.firstName} {member.lastName}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{workload.count} tâches</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div className="progress-bar-container" style={{ height: '6px', flex: 1, margin: 0 }}>
                        <div 
                          className="progress-bar-fill" 
                          style={{ 
                            width: `${workload.percent}%`,
                            background: workload.percent > 80 ? 'var(--color-high)' : 'linear-gradient(90deg, var(--primary), var(--secondary))'
                          }}
                        ></div>
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', minWidth: '35px', textAlign: 'right' }}>
                        {workload.totalEst}h / 40h
                      </span>
                    </div>
                  </div>
                );
              })}
              {(!project.members || project.members.length === 0) && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center' }}>
                  Aucun membre à analyser.
                </p>
              )}
            </div>
          </div>

          {/* Panel Membres */}
          <div className="glass-panel project-members-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 700 }}>
                Membres ({project.members ? project.members.length : 0})
              </h3>
              <button 
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}
                onClick={() => setIsAddMemberMode(!isAddMemberMode)}
                title="Associer un membre"
              >
                <UserPlus size={16} />
              </button>
            </div>

            {isAddMemberMode && (
              <form onSubmit={handleAddMember} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <select 
                  className="form-control" 
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem' }}
                  required
                  value={selectedMemberToAdd}
                  onChange={(e) => setSelectedMemberToAdd(e.target.value)}
                >
                  <option value="">Sélectionner...</option>
                  {nonProjectMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.firstName} {m.lastName} ({m.role})</option>
                  ))}
                </select>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} disabled={!selectedMemberToAdd}>
                  Ajouter
                </button>
              </form>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {project.members && project.members.map(member => (
                <div key={member.id} className="member-list-item">
                  <div className="member-info">
                    <div className="member-avatar" style={{ margin: 0 }}>
                      {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                    </div>
                    <div>
                      <div className="member-name">{member.firstName} {member.lastName}</div>
                      <div className="member-role">{member.role}</div>
                    </div>
                  </div>
                  <button 
                    className="btn-remove-member" 
                    onClick={() => handleRemoveMember(member.id)}
                    title="Retirer du projet"
                  >
                    <UserMinus size={14} />
                  </button>
                </div>
              ))}
              {(!project.members || project.members.length === 0) && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '0.5rem' }}>
                  Aucun membre sur ce projet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODALE DETAIL DE TACHE */}
      {isTaskModalOpen && selectedTaskId && (
        <TaskDetailModal 
          taskId={selectedTaskId}
          projectMembers={project ? project.members : []}
          onClose={() => { setSelectedTaskId(null); setIsTaskModalOpen(false); }}
          onTaskUpdated={reloadTasksAndStats}
        />
      )}

      {/* MODALE CREATION DE TACHE */}
      {isCreateTaskModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateTaskModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Créer une nouvelle Tâche</h2>
              <button className="modal-close-btn" onClick={() => setIsCreateTaskModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateTaskSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Titre de la tâche *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    value={taskFormData.title}
                    onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                    placeholder="Ex: Écrire les tests unitaires"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea 
                    className="form-control" 
                    value={taskFormData.description}
                    onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                    placeholder="Décrivez les critères de validation de la tâche..."
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Priorité *</label>
                    <select 
                      className="form-control"
                      value={taskFormData.priority}
                      onChange={(e) => setTaskFormData({ ...taskFormData, priority: e.target.value })}
                    >
                      <option value="LOW">Basse</option>
                      <option value="MEDIUM">Moyenne</option>
                      <option value="HIGH">Haute</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Heures estimées *</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      required
                      min="1"
                      value={taskFormData.estimatedHours}
                      onChange={(e) => setTaskFormData({ ...taskFormData, estimatedHours: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Statut Initial *</label>
                    <select 
                      className="form-control"
                      value={taskFormData.status}
                      onChange={(e) => setTaskFormData({ ...taskFormData, status: e.target.value })}
                    >
                      <option value="TODO">À faire</option>
                      <option value="IN_PROGRESS">En cours</option>
                      <option value="DONE">Terminé</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Assigner à</label>
                    <select 
                      className="form-control"
                      value={taskFormData.assigneeId}
                      onChange={(e) => setTaskFormData({ ...taskFormData, assigneeId: e.target.value })}
                    >
                      <option value="">Sélectionner un membre...</option>
                      {project.members && project.members.map(m => (
                        <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreateTaskModalOpen(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <canvas id="celebration-canvas" ref={canvasRef}></canvas>

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
