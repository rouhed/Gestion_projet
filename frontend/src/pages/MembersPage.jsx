import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Plus, User, Trash2, Edit, X, Mail, Briefcase } from 'lucide-react';

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [customConfirm, setCustomConfirm] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [customAlert, setCustomAlert] = useState({ isOpen: false, title: 'Erreur', message: '' });
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: ''
  });

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const data = await api.members.getAll();
      setMembers(data);
      setError(null);
    } catch (err) {
      setError('Impossible de charger l\'annuaire des membres.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingMember(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      role: 'Développeur Fullstack'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (member) => {
    setEditingMember(member);
    setFormData({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      role: member.role
    });
    setIsModalOpen(true);
  };

  const handleDeleteMember = (id) => {
    setCustomConfirm({
      isOpen: true,
      title: 'Supprimer le membre',
      message: 'Êtes-vous sûr de vouloir supprimer ce membre ? Il sera retiré de tous les projets et tâches.',
      onConfirm: async () => {
        try {
          await api.members.delete(id);
          setMembers(members.filter(m => m.id !== id));
        } catch (err) {
          setCustomAlert({ isOpen: true, title: 'Erreur', message: err.message });
        }
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMember) {
        await api.members.update(editingMember.id, formData);
      } else {
        await api.members.create(formData);
      }
      setIsModalOpen(false);
      loadMembers();
    } catch (err) {
      setCustomAlert({ isOpen: true, title: 'Erreur', message: err.message });
    }
  };

  return (
    <div className="members-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Membres de l'Équipe</h1>
          <p className="page-subtitle">Gérez l'annuaire des membres de l'équipe et leurs rôles respectifs.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreateModal}>
          <Plus size={18} /> Ajouter un Membre
        </button>
      </div>

      {error && (
        <div className="glass-panel" style={{ borderLeft: '4px solid var(--color-high)', marginBottom: '2rem' }}>
          <p style={{ color: 'var(--color-high)', fontWeight: 'bold' }}>{error}</p>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '4rem 0' }}>
          <div className="progress-bar-container" style={{ width: '200px' }}>
            <div className="progress-bar-fill" style={{ width: '100%', animation: 'shimmer 1.5s infinite' }}></div>
          </div>
        </div>
      ) : members.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <User size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Aucun membre inscrit dans l'annuaire.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {members.map(member => (
            <div key={member.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div 
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                    color: 'white',
                    fontSize: '1.2rem',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>{member.firstName} {member.lastName}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    <Briefcase size={12} />
                    <span>{member.role}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <Mail size={14} style={{ color: 'var(--text-muted)' }} />
                <span style={{ wordBreak: 'break-all' }}>{member.email}</span>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid var(--border-glass)', paddingTop: '0.75rem', marginTop: 'auto' }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ flex: 1, padding: '0.45rem 1rem', fontSize: '0.8rem' }}
                  onClick={() => handleOpenEditModal(member)}
                >
                  <Edit size={12} /> Modifier
                </button>
                <button 
                  className="btn btn-danger" 
                  style={{ padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center' }}
                  onClick={() => handleDeleteMember(member.id)}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODALE AJOUT/EDITION DE MEMBRE */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingMember ? 'Modifier le Membre' : 'Créer un Nouveau Membre'}</h2>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Prénom *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      required 
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="Ex: Alice"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nom de famille *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      required 
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Ex: Dubois"
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Adresse Email *</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    required 
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Ex: alice.dubois@example.com"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Rôle / Poste *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="Ex: Développeuse Fullstack, UI/UX Designer..."
                  />
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
