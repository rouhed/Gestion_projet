import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { X, Clock, Plus, Trash2, Send, User, MessageSquare } from 'lucide-react';

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

export default function TaskDetailModal({ taskId, projectMembers, onClose, onTaskUpdated }) {
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentAuthorId, setCommentAuthorId] = useState('');
  const [addHoursInput, setAddHoursInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customConfirm, setCustomConfirm] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [customAlert, setCustomAlert] = useState({ isOpen: false, title: 'Erreur', message: '' });

  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = React.useRef(null);
  const [reactions, setReactions] = useState({});

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleStartTimer = async () => {
    setIsTimerRunning(true);
    // Calculer le timestamp de départ virtuel (compensé par les secondes déjà accumulées en cas de reprise)
    const startTime = Date.now() - (timerSeconds * 1000);
    localStorage.setItem('running_task_id', task.id.toString());
    localStorage.setItem('timer_start_time', startTime.toString());

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const currentElapsed = Math.floor((Date.now() - startTime) / 1000);
      setTimerSeconds(currentElapsed);
    }, 1000);

    // Transition de statut automatique si TODO -> IN_PROGRESS
    if (task.status === 'TODO') {
      try {
        const updated = await api.tasks.changeStatus(task.id, 'IN_PROGRESS');
        setTask(updated);
        onTaskUpdated();
      } catch (err) {
        console.error("Erreur de changement de statut automatique", err);
      }
    }
  };

  const handlePauseTimer = () => {
    setIsTimerRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    localStorage.removeItem('running_task_id');
    localStorage.removeItem('timer_start_time');
  };

  const handleStopTimer = () => {
    setIsTimerRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    localStorage.removeItem('running_task_id');
    localStorage.removeItem('timer_start_time');
    
    const minutesTracked = Math.ceil(timerSeconds / 60);
    const hoursTracked = parseFloat((timerSeconds / 3600).toFixed(2));
    
    if (timerSeconds > 0) {
      setCustomConfirm({
        isOpen: true,
        title: 'Enregistrer le temps',
        message: `Vous avez chronométré ${formatLoggedHours(hoursTracked)}. Souhaitez-vous enregistrer ce temps sur cette tâche ?`,
        onConfirm: async () => {
          try {
            const hoursToLog = Math.max(0.01, hoursTracked);
            const updated = await api.tasks.addHours(task.id, hoursToLog);
            setTask(updated);
            onTaskUpdated();
            setTimerSeconds(0);
          } catch (err) {
            setCustomAlert({ isOpen: true, title: 'Erreur', message: err.message });
            setTimerSeconds(0);
          }
        }
      });
    } else {
      setTimerSeconds(0);
    }
  };

  const formatTimerTime = (totalSecs) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAddReaction = (commentId, emoji) => {
    setReactions(prev => {
      const commentReactions = prev[commentId] || {
        '👍': 2 + (commentId % 3),
        '🔥': 1 + (commentId % 2),
        '❤️': (commentId % 4),
        '🚀': 1,
        userReacted: []
      };
      
      const newReactions = { ...commentReactions };
      if (newReactions.userReacted.includes(emoji)) {
        newReactions[emoji] = Math.max(0, newReactions[emoji] - 1);
        newReactions.userReacted = newReactions.userReacted.filter(e => e !== emoji);
      } else {
        newReactions[emoji] = (newReactions[emoji] || 0) + 1;
        newReactions.userReacted = [...newReactions.userReacted, emoji];
      }
      return { ...prev, [commentId]: newReactions };
    });
  };

  const getCommentReactionsData = (commentId) => {
    if (reactions[commentId]) return reactions[commentId];
    return {
      '👍': 2 + (commentId % 3),
      '🔥': 1 + (commentId % 2),
      '❤️': (commentId % 4),
      '🚀': 1,
      userReacted: []
    };
  };

  useEffect(() => {
    loadTaskAndComments();
  }, [taskId]);

  const loadTaskAndComments = async () => {
    setLoading(true);
    try {
      const taskData = await api.tasks.getById(taskId);
      setTask(taskData);
      
      const commentsData = await api.comments.getByTask(taskId);
      setComments(commentsData);
      
      // Par défaut, choisir le premier membre du projet pour poster le commentaire
      if (projectMembers && projectMembers.length > 0) {
        setCommentAuthorId(projectMembers[0].id.toString());
      }
      
      setError(null);

      // Vérifier si un minuteur tourne pour cette tâche dans localStorage
      const runningTaskId = localStorage.getItem('running_task_id');
      const timerStartTime = localStorage.getItem('timer_start_time');
      if (runningTaskId === taskData.id.toString() && timerStartTime) {
        const startTime = parseInt(timerStartTime);
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setTimerSeconds(elapsed);
        setIsTimerRunning(true);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          const currentElapsed = Math.floor((Date.now() - startTime) / 1000);
          setTimerSeconds(currentElapsed);
        }, 1000);
      }
    } catch (err) {
      setError('Erreur lors du chargement des détails de la tâche.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      let updated = await api.tasks.changeStatus(task.id, newStatus);
      
      // Gérer le minuteur selon le nouveau statut
      if (newStatus === 'DONE') {
        const runningTaskId = localStorage.getItem('running_task_id');
        if (runningTaskId === task.id.toString()) {
          const startTime = parseInt(localStorage.getItem('timer_start_time'));
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          localStorage.removeItem('running_task_id');
          localStorage.removeItem('timer_start_time');
          setIsTimerRunning(false);
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          if (elapsed > 0) {
            const hoursTracked = parseFloat((elapsed / 3600).toFixed(2));
            const hoursToLog = Math.max(0.01, hoursTracked);
            updated = await api.tasks.addHours(task.id, hoursToLog);
          }
        }
      } else if (newStatus === 'IN_PROGRESS' && task.status === 'TODO') {
        // Démarrer automatiquement le minuteur
        setIsTimerRunning(true);
        const startTime = Date.now();
        localStorage.setItem('running_task_id', task.id.toString());
        localStorage.setItem('timer_start_time', startTime.toString());
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          const currentElapsed = Math.floor((Date.now() - startTime) / 1000);
          setTimerSeconds(currentElapsed);
        }, 1000);
      }
      
      setTask(updated);
      onTaskUpdated();
    } catch (err) {
      setCustomAlert({ isOpen: true, title: 'Erreur', message: err.message });
    }
  };

  const handlePriorityChange = async (newPriority) => {
    try {
      const updated = await api.tasks.update(task.id, {
        ...task,
        priority: newPriority
      });
      setTask(updated);
      onTaskUpdated();
    } catch (err) {
      setCustomAlert({ isOpen: true, title: 'Erreur', message: err.message });
    }
  };

  const handleAssigneeChange = async (newAssigneeId) => {
    try {
      let updated;
      if (newAssigneeId === '') {
        updated = await api.tasks.update(task.id, {
          ...task,
          assignee: null
        });
      } else {
        updated = await api.tasks.assignMember(task.id, parseInt(newAssigneeId));
      }
      setTask(updated);
      onTaskUpdated();
    } catch (err) {
      setCustomAlert({ isOpen: true, title: 'Erreur', message: err.message });
    }
  };

  const handleAddHours = async (e) => {
    e.preventDefault();
    const hours = parseFloat(addHoursInput);
    if (isNaN(hours) || hours <= 0) return;

    try {
      const updated = await api.tasks.addHours(task.id, hours);
      setTask(updated);
      setAddHoursInput('');
      onTaskUpdated();
    } catch (err) {
      setCustomAlert({ isOpen: true, title: 'Erreur', message: err.message });
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !commentAuthorId) return;

    try {
      const commentPayload = {
        content: newComment,
        author: { id: parseInt(commentAuthorId) }
      };
      const createdComment = await api.comments.create(task.id, commentPayload);
      setComments([...comments, createdComment]);
      setNewComment('');
    } catch (err) {
      setCustomAlert({ isOpen: true, title: 'Erreur', message: err.message });
    }
  };

  const handleDeleteComment = (commentId) => {
    setCustomConfirm({
      isOpen: true,
      title: 'Supprimer le commentaire',
      message: 'Voulez-vous vraiment supprimer ce commentaire ?',
      onConfirm: async () => {
        try {
          await api.comments.delete(commentId);
          setComments(comments.filter(c => c.id !== commentId));
        } catch (err) {
          setCustomAlert({ isOpen: true, title: 'Erreur', message: err.message });
        }
      }
    });
  };
  const handleDeleteTask = () => {
    setCustomConfirm({
      isOpen: true,
      title: 'Supprimer la tâche',
      message: 'Êtes-vous sûr de vouloir supprimer cette tâche ? Cette action est irenvoyable et supprimera également tous ses commentaires.',
      onConfirm: async () => {
        try {
          await api.tasks.delete(task.id);
          onClose();
          onTaskUpdated();
        } catch (err) {
          setCustomAlert({ isOpen: true, title: 'Erreur', message: err.message });
        }
      }
    });
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
      <div className="modal-overlay">
        <div className="modal-content" style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Chargement des détails...</p>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="modal-overlay">
        <div className="modal-content" style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-high)' }}>{error || 'Tâche introuvable'}</p>
          <button className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={onClose}>Fermer</button>
        </div>
      </div>
    );
  }

  // Calcul du pourcentage d'heures réelles par rapport aux estimées
  const hoursPercent = task.estimatedHours > 0 
    ? Math.min((task.loggedHours / task.estimatedHours) * 100, 100)
    : 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '750px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Projet : {task.projectName}</span>
            <h2 className="modal-title" style={{ marginTop: '0.25rem' }}>{task.title}</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: '2.5rem', paddingBottom: '1rem' }}>
          {/* Section gauche : Détails & Commentaires */}
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Description</h4>
              <p style={{ fontSize: '0.925rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                {task.description || 'Aucune description fournie pour cette tâche.'}
              </p>
            </div>

            {/* Suivi des heures (Graphique linéaire / Barre de progression) */}
            <div style={{ marginBottom: '2rem', background: 'rgba(0, 0, 0, 0.15)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={16} style={{ color: 'var(--secondary)' }} /> Temps Réalisé
                </h4>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
                  {formatLoggedHours(task.loggedHours)} / {task.estimatedHours}h estimées
                </span>
              </div>
              <div className="progress-bar-container" style={{ height: '6px' }}>
                <div 
                  className="progress-bar-fill" 
                  style={{ 
                    width: `${hoursPercent}%`,
                    background: task.loggedHours > task.estimatedHours ? 'var(--color-high)' : 'linear-gradient(90deg, var(--primary), var(--secondary))'
                  }}
                ></div>
              </div>

              {/* Formulaire ajout d'heures */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                <form onSubmit={handleAddHours} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="number" 
                    className="form-control" 
                    style={{ width: '120px', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                    placeholder="Ajouter heures..."
                    min="1"
                    value={addHoursInput}
                    onChange={(e) => setAddHoursInput(e.target.value)}
                  />
                  <button type="submit" className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}>
                    Enregistrer
                  </button>
                </form>

                {/* Minuteur / Chronomètre d'activité */}
                <div className="time-tracker-widget" style={{ flex: 1, margin: 0, padding: '0.5rem 0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
                      Minuteur
                    </span>
                    {isTimerRunning && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <div className="tracker-dot active"></div>
                        <span style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: 'bold' }}>En cours</span>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <div className="time-tracker-display" style={{ fontSize: '1.2rem' }}>
                      {formatTimerTime(timerSeconds)}
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      {task.status === 'DONE' ? (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-done)', fontWeight: 'bold' }}>✓ Tâche terminée</span>
                      ) : (
                        <>
                          {!isTimerRunning && timerSeconds === 0 ? (
                            <button type="button" className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }} onClick={handleStartTimer}>
                              Démarrer
                            </button>
                          ) : isTimerRunning ? (
                            <button type="button" className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', borderColor: 'var(--color-medium)' }} onClick={handlePauseTimer}>
                              Pause
                            </button>
                          ) : (
                            <button type="button" className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }} onClick={handleStartTimer}>
                              Reprendre
                            </button>
                          )}
                          {(isTimerRunning || timerSeconds > 0) && (
                            <button type="button" className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }} onClick={handleStopTimer}>
                              Enregistrer
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Commentaires */}
            <div className="comments-section">
              <h4 style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
                <MessageSquare size={16} /> Commentaires ({comments.length})
              </h4>
              
              <div className="comments-list">
                {comments.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic', textAlign: 'center', padding: '1rem' }}>
                    Aucun commentaire pour le moment.
                  </p>
                ) : (
                  comments.map(comment => (
                    <div key={comment.id} className="comment-card">
                      <div className="comment-header">
                        <span className="comment-author">
                          {comment.author.firstName} {comment.author.lastName}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="comment-date">
                            {new Date(comment.createdAt).toLocaleString('fr-FR', {
                              day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                          <button 
                            style={{ background: 'none', border: 'none', color: 'var(--color-high)', cursor: 'pointer' }}
                            onClick={() => handleDeleteComment(comment.id)}
                            title="Supprimer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      <div className="comment-content">{comment.content}</div>
                      
                      {/* Emojis Reactions */}
                      <div className="reactions-bar">
                        {['👍', '🔥', '❤️', '🚀'].map(emoji => {
                          const rData = getCommentReactionsData(comment.id);
                          const count = rData[emoji] || 0;
                          const hasReacted = rData.userReacted.includes(emoji);
                          return (
                            <button 
                              key={emoji}
                              type="button"
                              className={`reaction-btn ${hasReacted ? 'active' : ''}`}
                              onClick={() => handleAddReaction(comment.id, emoji)}
                            >
                              <span className="reaction-emoji">{emoji}</span>
                              {count > 0 && <span style={{ fontSize: '0.75rem' }}>{count}</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Formulaire ajout commentaire */}
              <form onSubmit={handleAddComment} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Commenter en tant que :</span>
                  <select 
                    className="form-control" 
                    style={{ width: '180px', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                    value={commentAuthorId}
                    onChange={(e) => setCommentAuthorId(e.target.value)}
                  >
                    {projectMembers && projectMembers.map(m => (
                      <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                    ))}
                    {(!projectMembers || projectMembers.length === 0) && (
                      <option value="">Aucun membre dans le projet</option>
                    )}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                  <input 
                    type="text" 
                    className="form-control" 
                    style={{ fontSize: '0.85rem', flex: 1, minWidth: 0 }}
                    placeholder="Écrire un commentaire..."
                    required
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: '0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} disabled={!commentAuthorId}>
                    <Send size={14} />
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Section droite : Métadonnées / Assignation */}
          <div style={{ borderLeft: '1px solid var(--border-glass)', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <span className="form-label">Statut</span>
              <select 
                className="form-control" 
                style={{ fontWeight: 'bold' }}
                value={task.status}
                onChange={(e) => handleStatusChange(e.target.value)}
              >
                <option value="TODO">À faire</option>
                <option value="IN_PROGRESS">En cours</option>
                <option value="DONE">Terminé</option>
              </select>
            </div>

            <div>
              <span className="form-label">Priorité</span>
              <select 
                className="form-control"
                value={task.priority}
                onChange={(e) => handlePriorityChange(e.target.value)}
              >
                <option value="LOW">Basse</option>
                <option value="MEDIUM">Moyenne</option>
                <option value="HIGH">Haute</option>
              </select>
            </div>

            <div>
              <span className="form-label">Assigné à</span>
              <select 
                className="form-control"
                value={task.assignee ? task.assignee.id : ''}
                onChange={(e) => handleAssigneeChange(e.target.value)}
              >
                <option value="">Non assigné</option>
                {projectMembers && projectMembers.map(m => (
                  <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                ))}
              </select>
            </div>

            <div style={{ marginTop: 'auto', background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                <User size={12} />
                <span>Responsable de la tâche :</span>
              </div>
              {task.assignee ? (
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{task.assignee.firstName} {task.assignee.lastName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{task.assignee.role}</div>
                </div>
              ) : (
                <div style={{ fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Personne d'assigné</div>
              )}
            </div>

            <button 
              className="btn btn-danger" 
              style={{ width: '100%', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              onClick={handleDeleteTask}
            >
              <Trash2 size={16} />
              Supprimer la tâche
            </button>
          </div>
        </div>
      </div>

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
