import React, { useState } from 'react';
import { api } from '../services/api';
import { Shield, User, Lock, Mail, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function LoginPage({ onLoginSuccess }) {
  const [isAdminMode, setIsAdminMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const loginPayloadEmail = isAdminMode ? 'admin' : email;
      const res = await api.auth.login(loginPayloadEmail, password);
      
      setSuccess(true);
      setTimeout(() => {
        onLoginSuccess(res);
      }, 800);
    } catch (err) {
      setError(err.message || 'Une erreur est survenue lors de la connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      {/* Bulles flottantes décoratives en arrière-plan */}
      <div className="bg-bubbles">
        <div className="bubble bubble-1"></div>
        <div className="bubble bubble-2"></div>
        <div className="bubble bubble-3"></div>
      </div>

      <div className="login-card glass-panel fade-in">
        <div className="login-header">
          <img src={logoImg} alt="G-Projets Logo" className="login-logo" />
          <h2 className="login-title">Bienvenue sur G-Projets</h2>
          <p className="login-subtitle">Gérez vos projets et suivez votre temps de travail.</p>
        </div>

        {/* Boutons à bascule esthétiques pour Admin vs Membre */}
        <div className="login-mode-toggle">
          <button 
            type="button" 
            className={`toggle-btn ${isAdminMode ? 'active' : ''}`}
            onClick={() => {
              setIsAdminMode(true);
              setEmail('');
              setError(null);
            }}
          >
            <Shield size={16} />
            <span>Administrateur</span>
          </button>
          <button 
            type="button" 
            className={`toggle-btn ${!isAdminMode ? 'active' : ''}`}
            onClick={() => {
              setIsAdminMode(false);
              setError(null);
            }}
          >
            <User size={16} />
            <span>Membre Équipe</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="login-alert error fade-in">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="login-alert success fade-in">
              <CheckCircle size={18} />
              <span>Connexion réussie ! Chargement...</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              {isAdminMode ? "Identifiant de connexion" : "Adresse email professionnelle"}
            </label>
            <div className="input-icon-wrapper">
              {isAdminMode ? (
                <Shield className="input-icon" size={18} />
              ) : (
                <Mail className="input-icon" size={18} />
              )}
              <input 
                type={isAdminMode ? "text" : "email"}
                className="form-control login-input"
                required
                placeholder={isAdminMode ? "Entrez 'admin'" : "nom@entreprise.com"}
                value={isAdminMode ? 'admin' : email}
                disabled={isAdminMode || loading}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Mot de passe</label>
            <div className="input-icon-wrapper">
              <Lock className="input-icon" size={18} />
              <input 
                type="password"
                className="form-control login-input"
                required
                placeholder={isAdminMode ? "Entrez 'admin123'" : "••••••••"}
                value={password}
                disabled={loading}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary login-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="spinner">Connexion en cours...</span>
            ) : (
              <>
                <span>Se connecter</span>
                <ChevronRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          {isAdminMode ? (
            <span className="login-hint">Identifiants par défaut : <strong>admin</strong> / <strong>admin123</strong></span>
          ) : (
            <span className="login-hint">Connectez-vous avec l'email et le mot de passe configurés par votre administrateur.</span>
          )}
        </div>
      </div>
    </div>
  );
}
