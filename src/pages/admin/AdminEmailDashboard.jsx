import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Mail,
  Send,
  Check,
  X,
  RefreshCw,
  Eye,
  Edit3,
  Sliders,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Code,
  Smartphone,
  Monitor,
  AlertCircle,
  CheckCircle2,
  Info,
  RotateCcw,
  FileText,
  Search,
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import adminService from '../../services/admin.service';
import { useToast } from '../../context/ToastContext';
import './AdminEmailDashboard.css';

export const AdminEmailDashboard = () => {
  const [activeTab, setActiveTab] = useState('SENDERS'); // 'SENDERS' | 'TEMPLATES'

  // Senders State
  const [configs, setConfigs] = useState([]);
  const [loadingConfigs, setLoadingConfigs] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testCategory, setTestCategory] = useState('ACCOUNT');
  const [testRecipient, setTestRecipient] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  // Templates State
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateSearch, setTemplateSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Form State for Selected Template
  const [formSubject, setFormSubject] = useState('');
  const [formHtml, setFormHtml] = useState('');
  const [formText, setFormText] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Live Preview State
  const [previewDevice, setPreviewDevice] = useState('desktop'); // 'desktop' | 'mobile'
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sampleVariables, setSampleVariables] = useState({});

  const { showSuccess, showError } = useToast();
  const htmlInputRef = useRef(null);

  // Fetch Senders
  const loadConfigs = async () => {
    try {
      setLoadingConfigs(true);
      const res = await adminService.getEmailConfigs();
      const list = res?.data || res || [];
      setConfigs(Array.isArray(list) ? list : []);
    } catch (err) {
      showError(err.message || 'Failed to load email configurations');
    } finally {
      setLoadingConfigs(false);
    }
  };

  // Fetch Templates
  const loadTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const res = await adminService.getEmailTemplates();
      const list = res?.data || res || [];
      const arrayList = Array.isArray(list) ? list : [];
      setTemplates(arrayList);
      if (arrayList.length > 0 && !selectedTemplate) {
        selectTemplate(arrayList[0]);
      }
    } catch (err) {
      showError(err.message || 'Failed to load email templates');
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'SENDERS') {
      loadConfigs();
    } else {
      loadTemplates();
    }
  }, [activeTab]);

  const selectTemplate = (tmpl) => {
    setSelectedTemplate(tmpl);
    setFormSubject(tmpl.subjectTemplate || '');
    setFormHtml(tmpl.bodyHtmlTemplate || '');
    setFormText(tmpl.bodyTextTemplate || '');
    setFormActive(tmpl.isActive ?? true);

    // Build default sample variables for preview based on template placeholders
    const vars = {};
    if (Array.isArray(tmpl.availablePlaceholders)) {
      tmpl.availablePlaceholders.forEach((p) => {
        const clean = p.replace(/[{}]/g, '');
        if (clean === 'username') vars.username = 'alex_designer';
        else if (clean === 'otpCode') vars.otpCode = '849201';
        else if (clean === 'validityMinutes') vars.validityMinutes = '10';
        else if (clean === 'validityHours') vars.validityHours = '24';
        else if (clean === 'actorUsername') vars.actorUsername = 'sarah_creative';
        else if (clean === 'verifyUrl') vars.verifyUrl = 'http://localhost:5173/verify-email';
        else if (clean === 'resetUrl') vars.resetUrl = 'http://localhost:5173/reset-password';
        else if (clean === 'loginTime') vars.loginTime = new Date().toLocaleString();
        else if (clean === 'ipAddress') vars.ipAddress = '192.168.1.104';
        else if (clean === 'deviceInfo') vars.deviceInfo = 'Chrome on macOS (San Francisco, USA)';
        else vars[clean] = 'SampleValue';
      });
    }
    setSampleVariables(vars);
    triggerPreview(tmpl.emailType, tmpl.subjectTemplate, tmpl.bodyHtmlTemplate, tmpl.bodyTextTemplate, vars);
  };

  const triggerPreview = async (emailType, subject, html, text, vars) => {
    try {
      setPreviewLoading(true);
      const res = await adminService.previewEmailTemplate({
        emailType: emailType || selectedTemplate?.emailType,
        subjectTemplate: subject ?? formSubject,
        bodyHtmlTemplate: html ?? formHtml,
        bodyTextTemplate: text ?? formText,
        sampleVariables: vars ?? sampleVariables,
      });
      setPreviewData(res?.data || res);
    } catch {
      // preview error fallback
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleInsertVariable = (variableTag) => {
    const placeholder = variableTag.startsWith('{{') ? variableTag : `{{${variableTag}}}`;
    setFormHtml((prev) => prev + placeholder);
    if (htmlInputRef.current) {
      htmlInputRef.current.focus();
    }
  };

  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return;
    try {
      setSavingTemplate(true);
      const payload = {
        emailType: selectedTemplate.emailType,
        subjectTemplate: formSubject,
        bodyHtmlTemplate: formHtml,
        bodyTextTemplate: formText,
        templateName: selectedTemplate.templateName,
        description: selectedTemplate.description,
        isActive: formActive,
      };
      await adminService.updateEmailTemplate(payload);
      showSuccess(`Email template [${selectedTemplate.emailType}] saved successfully!`);
      loadTemplates();
      triggerPreview(selectedTemplate.emailType, formSubject, formHtml, formText, sampleVariables);
    } catch (err) {
      showError(err.message || 'Failed to save template');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleResetTemplate = async () => {
    if (!selectedTemplate) return;
    if (!window.confirm(`Are you sure you want to reset [${selectedTemplate.emailType}] to its original Instagram default?`)) {
      return;
    }
    try {
      await adminService.resetEmailTemplate(selectedTemplate.emailType);
      showSuccess(`Template [${selectedTemplate.emailType}] reset to default successfully!`);
      const refreshed = await adminService.getEmailTemplateByType(selectedTemplate.emailType);
      const tmpl = refreshed?.data || refreshed;
      selectTemplate(tmpl);
    } catch (err) {
      showError(err.message || 'Failed to reset template');
    }
  };

  const handleSaveSenderConfig = async (e) => {
    e.preventDefault();
    if (!editingConfig) return;
    try {
      await adminService.updateEmailConfig(editingConfig);
      showSuccess(`Sender configuration for [${editingConfig.category}] updated!`);
      setEditingConfig(null);
      loadConfigs();
    } catch (err) {
      showError(err.message || 'Failed to update sender configuration');
    }
  };

  const handleSendTestEmail = async (e) => {
    e.preventDefault();
    if (!testRecipient) {
      showError('Please enter a recipient email');
      return;
    }
    try {
      setSendingTest(true);
      await adminService.sendTestEmail({
        category: testCategory,
        recipientEmail: testRecipient.trim(),
        subject: `Live Test from Instagram Admin (${testCategory})`,
        message: 'This is a live test email confirming your dynamic email sender deliverability.',
      });
      showSuccess(`Test email sent successfully to ${testRecipient}!`);
      setTestModalOpen(false);
      setTestRecipient('');
    } catch (err) {
      showError(err.message || 'Failed to dispatch test email');
    } finally {
      setSendingTest(false);
    }
  };

  const getCategoryClass = (category) => {
    switch (category) {
      case 'ACCOUNT': return 'badge-account';
      case 'SECURITY': return 'badge-security';
      case 'SOCIAL_ACTIVITY': return 'badge-social';
      case 'MESSAGING': return 'badge-messaging';
      case 'DIGEST_PRODUCT': return 'badge-digest';
      default: return 'badge-account';
    }
  };

  const filteredTemplates = templates.filter((t) => {
    const matchesSearch =
      t.emailType?.toLowerCase().includes(templateSearch.toLowerCase()) ||
      t.templateName?.toLowerCase().includes(templateSearch.toLowerCase()) ||
      t.description?.toLowerCase().includes(templateSearch.toLowerCase());
    const matchesCategory =
      categoryFilter === 'ALL' || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="admin-email-page">
      {/* Top Admin Navigation Header */}
      <div className="admin-nav-header">
        <div className="admin-title-row">
          <div className="admin-title-group">
            <Mail size={30} style={{ color: 'var(--ig-primary-button)' }} />
            <div>
              <h1>Email & Communication Studio</h1>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                Configure multi-category senders, customize dynamic email templates, and preview live layouts.
              </p>
            </div>
          </div>

          <div className="admin-top-links">
            <NavLink to="/admin" className="admin-nav-pill-link">
              <ShieldCheck size={16} />
              <span>Overview & Users</span>
            </NavLink>
            <NavLink to="/admin/reports" className="admin-nav-pill-link">
              <ShieldAlert size={16} />
              <span>Moderation Reports</span>
            </NavLink>
            <NavLink to="/admin/email" className="admin-nav-pill-link active">
              <Mail size={16} />
              <span>Email & Templates</span>
            </NavLink>
          </div>
        </div>

        {/* Studio Sub-Tabs */}
        <div className="admin-sub-tabs">
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'SENDERS' ? 'active' : ''}`}
            onClick={() => setActiveTab('SENDERS')}
          >
            <Sliders size={16} />
            <span>Sender Configurations</span>
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'TEMPLATES' ? 'active' : ''}`}
            onClick={() => setActiveTab('TEMPLATES')}
          >
            <FileText size={16} />
            <span>Dynamic Template Studio</span>
          </button>
        </div>
      </div>

      {/* TAB 1: SENDER CONFIGURATIONS */}
      {activeTab === 'SENDERS' && (
        <div>
          <div className="senders-section-header">
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 4px 0' }}>
                Multi-Category Dynamic Senders
              </h2>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Each functional category dispatches emails from its designated sender identity and purpose.
              </span>
            </div>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setTestModalOpen(true)}
            >
              <Send size={16} />
              <span>Send Test Email</span>
            </button>
          </div>

          {loadingConfigs ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
              <LoadingSpinner size="lg" />
            </div>
          ) : configs.length === 0 ? (
            <EmptyState
              icon={Mail}
              title="No Configurations Loaded"
              description="Click reload to fetch or initialize default category senders."
              actionLabel="Reload Configurations"
              onAction={loadConfigs}
            />
          ) : (
            <div className="senders-grid">
              {configs.map((cfg) => (
                <div key={cfg.category} className="sender-card">
                  <div>
                    <div className="sender-card-header">
                      <span className={`sender-category-badge ${getCategoryClass(cfg.category)}`}>
                        {cfg.category}
                      </span>
                      {cfg.isEnabled ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--color-success)', fontWeight: 600 }}>
                          <CheckCircle2 size={13} /> Active
                        </span>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--color-error)', fontWeight: 600 }}>
                          <AlertCircle size={13} /> Inactive
                        </span>
                      )}
                    </div>
                    <h3 className="sender-card-title">{cfg.purposeName}</h3>
                    <p className="sender-card-desc">{cfg.description}</p>
                  </div>

                  <div className="sender-details-box">
                    <div className="sender-detail-row">
                      <span className="detail-label">From Address:</span>
                      <span className="detail-value">{cfg.fromEmail}</span>
                    </div>
                    <div className="sender-detail-row">
                      <span className="detail-label">Display Name:</span>
                      <span className="detail-value">{cfg.senderName}</span>
                    </div>
                    {cfg.replyToEmail && (
                      <div className="sender-detail-row">
                        <span className="detail-label">Reply-To:</span>
                        <span className="detail-value">{cfg.replyToEmail}</span>
                      </div>
                    )}
                  </div>

                  <div className="sender-card-actions">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setEditingConfig({ ...cfg })}
                    >
                      <Edit3 size={14} />
                      <span>Configure Sender</span>
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setTestCategory(cfg.category);
                        setTestModalOpen(true);
                      }}
                    >
                      <Send size={14} />
                      <span>Test Category</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DYNAMIC TEMPLATE STUDIO */}
      {activeTab === 'TEMPLATES' && (
        <div className="template-studio-layout">
          {/* Sidebar: List of Templates */}
          <div className="templates-sidebar">
            <div className="sidebar-search-box">
              <Search size={15} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search templates..."
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '4px' }}>
              {['ALL', 'ACCOUNT', 'SECURITY', 'SOCIAL_ACTIVITY', 'MESSAGING', 'DIGEST_PRODUCT'].map((c) => (
                <button
                  key={c}
                  type="button"
                  style={{
                    padding: '2px 8px',
                    fontSize: '11px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-primary)',
                    background: categoryFilter === c ? 'var(--ig-primary-button)' : 'var(--bg-elevated)',
                    color: categoryFilter === c ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                  onClick={() => setCategoryFilter(c)}
                >
                  {c === 'SOCIAL_ACTIVITY' ? 'SOCIAL' : c}
                </button>
              ))}
            </div>

            {loadingTemplates ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <LoadingSpinner size="md" />
              </div>
            ) : filteredTemplates.length === 0 ? (
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                No templates found
              </span>
            ) : (
              filteredTemplates.map((tmpl) => (
                <button
                  key={tmpl.emailType}
                  type="button"
                  className={`template-list-item ${selectedTemplate?.emailType === tmpl.emailType ? 'selected' : ''}`}
                  onClick={() => selectTemplate(tmpl)}
                >
                  <div className="template-meta">
                    <span className="template-name">{tmpl.templateName || tmpl.emailType}</span>
                    <span className="template-type-sub">{tmpl.emailType}</span>
                  </div>
                  <span className={`sender-category-badge ${getCategoryClass(tmpl.category)}`}>
                    {tmpl.category === 'SOCIAL_ACTIVITY' ? 'SOCIAL' : tmpl.category}
                  </span>
                </button>
              ))
            )}
          </div>

          {/* Center Column: Template Editor */}
          {selectedTemplate ? (
            <div className="editor-column">
              <div className="editor-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>
                      {selectedTemplate.templateName || selectedTemplate.emailType}
                    </h2>
                    <span className={`sender-category-badge ${getCategoryClass(selectedTemplate.category)}`}>
                      {selectedTemplate.category}
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {selectedTemplate.description || 'Configurable dynamic template with live variable tags.'}
                  </span>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                  <input
                    type="checkbox"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                  />
                  <span>Template Active</span>
                </label>
              </div>

              {/* Available Variable Tags */}
              <div className="form-group">
                <label>
                  Click to insert placeholder variable into template:
                </label>
                <div className="chips-container">
                  {selectedTemplate.availablePlaceholders?.map((p) => (
                    <button
                      key={p}
                      type="button"
                      className="variable-chip"
                      onClick={() => handleInsertVariable(p)}
                      title={`Click to append ${p}`}
                    >
                      <span>+</span> {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject Input */}
              <div className="form-group">
                <label htmlFor="template-subject">Email Subject Template</label>
                <input
                  id="template-subject"
                  type="text"
                  className="form-input"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  placeholder="Subject line with {{placeholders}}..."
                />
              </div>

              {/* HTML Body Editor */}
              <div className="form-group">
                <label htmlFor="template-html">
                  HTML Body Template
                </label>
                <textarea
                  id="template-html"
                  ref={htmlInputRef}
                  className="code-textarea"
                  value={formHtml}
                  onChange={(e) => setFormHtml(e.target.value)}
                  placeholder="<p>HTML body with {{variables}}...</p>"
                />
              </div>

              {/* Plain Text Fallback */}
              <div className="form-group">
                <label htmlFor="template-text">Plain Text Fallback Template</label>
                <textarea
                  id="template-text"
                  className="form-input"
                  style={{ minHeight: '80px', fontFamily: 'monospace' }}
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  placeholder="Plain text content..."
                />
              </div>

              {/* Editor Action Buttons */}
              <div className="editor-footer-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleResetTemplate}
                  title="Revert back to standard built-in Instagram default"
                >
                  <RotateCcw size={15} />
                  <span>Reset to Default</span>
                </button>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => triggerPreview()}
                    disabled={previewLoading}
                  >
                    <RefreshCw size={15} className={previewLoading ? 'spinning' : ''} />
                    <span>Update Preview</span>
                  </button>

                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleSaveTemplate}
                    disabled={savingTemplate}
                  >
                    <Check size={16} />
                    <span>{savingTemplate ? 'Saving...' : 'Save Template'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Select a template from the list to start editing</span>
            </div>
          )}

          {/* Right Column: Live Mockup Preview */}
          <div className="preview-column">
            <div className="preview-top-bar">
              <span style={{ fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Eye size={16} color="var(--ig-primary-button)" />
                Live Email Preview
              </span>

              <div className="view-mode-toggle">
                <button
                  type="button"
                  className={`mode-btn ${previewDevice === 'desktop' ? 'active' : ''}`}
                  onClick={() => setPreviewDevice('desktop')}
                  title="Desktop View"
                >
                  <Monitor size={15} />
                </button>
                <button
                  type="button"
                  className={`mode-btn ${previewDevice === 'mobile' ? 'active' : ''}`}
                  onClick={() => setPreviewDevice('mobile')}
                  title="Mobile View"
                >
                  <Smartphone size={15} />
                </button>
              </div>
            </div>

            {/* Email Client Mockup */}
            <div className={`mockup-frame ${previewDevice === 'mobile' ? 'mobile' : ''}`}>
              <div className="mockup-header">
                <div className="mockup-header-row">
                  <span>From:</span>
                  <strong>Instagram &lt;notifications@instagram.com&gt;</strong>
                </div>
                <div className="mockup-header-row">
                  <span>To:</span>
                  <span>{sampleVariables.username || 'user'}@example.com</span>
                </div>
                <div className="mockup-header-row">
                  <span>Subject:</span>
                  <strong>{previewData?.renderedSubject || formSubject}</strong>
                </div>
              </div>

              <div className="mockup-body-iframe-wrapper">
                {previewLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
                    <LoadingSpinner size="md" />
                  </div>
                ) : previewData?.renderedHtml ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: previewData.renderedHtml }}
                    style={{ width: '100%', minHeight: '300px' }}
                  />
                ) : (
                  <div style={{ color: '#737373', fontSize: '13px', textAlign: 'center', padding: '40px' }}>
                    No preview available. Click &quot;Update Preview&quot; above.
                  </div>
                )}
              </div>
            </div>

            {/* Interactive Sample Variables Editor */}
            <div style={{ marginTop: 'var(--space-2)' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Test Variables Playground:
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '6px' }}>
                {Object.keys(sampleVariables).map((key) => (
                  <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {key}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                      value={sampleVariables[key]}
                      onChange={(e) => {
                        const updated = { ...sampleVariables, [key]: e.target.value };
                        setSampleVariables(updated);
                        triggerPreview(selectedTemplate?.emailType, formSubject, formHtml, formText, updated);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Configure Sender */}
      {editingConfig && (
        <div className="modal-overlay" onClick={() => setEditingConfig(null)}>
          <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                Configure {editingConfig.category} Sender
              </h3>
              <button
                type="button"
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                onClick={() => setEditingConfig(null)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSenderConfig} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label>Purpose Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingConfig.purposeName || ''}
                  onChange={(e) => setEditingConfig({ ...editingConfig, purposeName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>From Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  value={editingConfig.fromEmail || ''}
                  onChange={(e) => setEditingConfig({ ...editingConfig, fromEmail: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Sender Display Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingConfig.senderName || ''}
                  onChange={(e) => setEditingConfig({ ...editingConfig, senderName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Reply-To Email (Optional)</label>
                <input
                  type="email"
                  className="form-input"
                  value={editingConfig.replyToEmail || ''}
                  onChange={(e) => setEditingConfig({ ...editingConfig, replyToEmail: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingConfig.description || ''}
                  onChange={(e) => setEditingConfig({ ...editingConfig, description: e.target.value })}
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                <input
                  type="checkbox"
                  checked={editingConfig.isEnabled ?? true}
                  onChange={(e) => setEditingConfig({ ...editingConfig, isEnabled: e.target.checked })}
                />
                <span>Enable this sender identity</span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditingConfig(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Sender
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Send Test Email */}
      {testModalOpen && (
        <div className="modal-overlay" onClick={() => setTestModalOpen(false)}>
          <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                Send Live Deliverability Test Email
              </h3>
              <button
                type="button"
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                onClick={() => setTestModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
              Dispatches an actual test email using the currently configured sender for the selected category.
            </p>

            <form onSubmit={handleSendTestEmail} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label>Sender Category</label>
                <select
                  className="form-input"
                  value={testCategory}
                  onChange={(e) => setTestCategory(e.target.value)}
                >
                  {['ACCOUNT', 'SECURITY', 'SOCIAL_ACTIVITY', 'MESSAGING', 'DIGEST_PRODUCT'].map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Recipient Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="your-email@example.com"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setTestModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={sendingTest}>
                  <Send size={15} />
                  <span>{sendingTest ? 'Sending...' : 'Send Live Test'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEmailDashboard;
