import React, { useState, useEffect } from 'react';
import { healthService } from '../services/health.service';
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, Server, Database, Layers, Radio, ShieldCheck } from 'lucide-react';
import './HealthStatusPage.css';

export const HealthStatusPage = () => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await healthService.getHealthStatus();
      setHealthData(response.data);
    } catch (err) {
      setError(err.message || 'Unable to connect to Spring Boot backend API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="health-page">
      <div className="health-header">
        <div>
          <h1 className="health-title">System Foundation Status</h1>
          <p className="health-subtitle">Real-time status check of core infrastructure and Spring Boot modular monolith</p>
        </div>
        <button onClick={fetchHealth} disabled={loading} className="btn-refresh">
          <RefreshCw size={18} className={loading ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <AlertCircle size={20} />
          <div>
            <strong>Backend Connection Offline:</strong> {error}
            <div className="error-hint">Ensure Spring Boot is started locally via <code>mvn spring-boot:run</code> on port 8080.</div>
          </div>
        </div>
      )}

      {loading && !healthData ? (
        <div className="loading-state">
          <div className="pulse-loader"></div>
          <p>Contacting backend foundation...</p>
        </div>
      ) : healthData ? (
        <div className="health-grid">
          {/* Spring Boot Service */}
          <div className="health-card">
            <div className="card-header">
              <Server size={22} className="card-icon" />
              <div className="card-title-group">
                <h3>Spring Boot Backend</h3>
                <span className="tech-badge">Java {healthData.javaVersion || '21'} • Boot {healthData.springBootVersion || '3.3.4'}</span>
              </div>
              <span className={`status-badge ${healthData.status === 'UP' ? 'status-ok' : 'status-err'}`}>
                {healthData.status === 'UP' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                {healthData.status}
              </span>
            </div>
            <div className="card-body">
              <p className="card-desc">Stateless modular monolith with Spring Security 6, JWT, and JPA.</p>
              <div className="meta-row">
                <span>Timestamp:</span>
                <code>{new Date(healthData.timestamp).toLocaleTimeString()}</code>
              </div>
            </div>
          </div>

          {/* MySQL Database */}
          <div className="health-card">
            <div className="card-header">
              <Database size={22} className="card-icon" />
              <div className="card-title-group">
                <h3>MySQL Database</h3>
                <span className="tech-badge">{healthData.database?.databaseProduct || 'MySQL 8.0'}</span>
              </div>
              <span className={`status-badge ${healthData.database?.status === 'CONNECTED' ? 'status-ok' : 'status-warn'}`}>
                {healthData.database?.status === 'CONNECTED' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {healthData.database?.status}
              </span>
            </div>
            <div className="card-body">
              <p className="card-desc">System of record for users, profiles, and transactional outbox. Managed by Flyway.</p>
              <div className="meta-row">
                <span>Engine Version:</span>
                <code>{healthData.database?.databaseVersion || '8.0+'}</code>
              </div>
            </div>
          </div>

          {/* Redis Cache */}
          <div className="health-card">
            <div className="card-header">
              <Layers size={22} className="card-icon" />
              <div className="card-title-group">
                <h3>Redis Cache</h3>
                <span className="tech-badge">Port 6379</span>
              </div>
              <span className={`status-badge ${healthData.redis?.status === 'CONNECTED' ? 'status-ok' : 'status-standby'}`}>
                {healthData.redis?.status === 'CONNECTED' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {healthData.redis?.status}
              </span>
            </div>
            <div className="card-body">
              <p className="card-desc">Configured for rate-limiting, online presence, and ephemeral token sessions.</p>
              <div className="meta-row">
                <span>Ping:</span>
                <code>{healthData.redis?.ping || healthData.redis?.note || 'STANDBY'}</code>
              </div>
            </div>
          </div>

          {/* Kafka Messaging */}
          <div className="health-card">
            <div className="card-header">
              <Radio size={22} className="card-icon" />
              <div className="card-title-group">
                <h3>Apache Kafka</h3>
                <span className="tech-badge">Port 9092</span>
              </div>
              <span className="status-badge status-ok">
                <CheckCircle2 size={16} />
                {healthData.kafka?.status}
              </span>
            </div>
            <div className="card-body">
              <p className="card-desc">Prepared for event contracts (social, engagement, media) and transactional outbox.</p>
              <div className="meta-row">
                <span>Brokers:</span>
                <code>{healthData.kafka?.bootstrapServers || 'localhost:9092'}</code>
              </div>
            </div>
          </div>

          {/* WebSocket STOMP */}
          <div className="health-card">
            <div className="card-header">
              <Radio size={22} className="card-icon" />
              <div className="card-title-group">
                <h3>WebSocket & STOMP</h3>
                <span className="tech-badge">Endpoint: /ws</span>
              </div>
              <span className="status-badge status-ok">
                <CheckCircle2 size={16} />
                {healthData.websocket?.status}
              </span>
            </div>
            <div className="card-body">
              <p className="card-desc">Configured with SockJS fallback and destinations for chat, notifications, and typing.</p>
              <div className="meta-row">
                <span>Broker Descriptors:</span>
                <code>{healthData.websocket?.messageBroker}</code>
              </div>
            </div>
          </div>

          {/* Security & Token Model */}
          <div className="health-card">
            <div className="card-header">
              <ShieldCheck size={22} className="card-icon" />
              <div className="card-title-group">
                <h3>Security Baseline</h3>
                <span className="tech-badge">Spring Security 6</span>
              </div>
              <span className="status-badge status-ok">
                <CheckCircle2 size={16} />
                CONFIGURED
              </span>
            </div>
            <div className="card-body">
              <p className="card-desc">BCrypt (cost 12), stateless JWT filters, strict CORS, and centralized exception handling.</p>
              <div className="meta-row">
                <span>Auth Scheme:</span>
                <code>Bearer JWT (HMAC-SHA256)</code>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default HealthStatusPage;
