import React, { useEffect, useState, useRef } from 'react';
import {
  Star, Copy, Check, ExternalLink, Share2, MessageSquare,
  QrCode, RefreshCw, Send, Sparkles, Building2, Globe,
  ShieldCheck, Printer, CheckCircle2, Heart, Award, ArrowUpRight,
  TrendingUp, Users, Smartphone, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { googleReviewService } from '../services/api';

interface GoogleReviewConfig {
  id: string;
  labPlaceName: string;
  placeId?: string | null;
  googleReviewUrl: string;
  customMessage: string;
  totalClicks: number;
  totalReviewsSent: number;
  isActive: boolean;
  updatedAt?: string;
}

export const GoogleReviewBuilderPage: React.FC = () => {
  const [config, setConfig] = useState<GoogleReviewConfig>({
    id: 'singleton',
    labPlaceName: 'MedsSeva Diagnostic Center & Pathology Laboratory',
    placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
    googleReviewUrl: 'https://g.page/r/medsseva-pathology/review',
    customMessage: 'Dear Patient, thank you for choosing MedsSeva Diagnostics! Please take a moment to share your valuable rating & review with us on Google:',
    totalClicks: 124,
    totalReviewsSent: 48,
    isActive: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Edit Form Fields
  const [labPlaceName, setLabPlaceName] = useState('');
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [placeId, setPlaceId] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Patient Quick Dispatcher
  const [patientName, setPatientName] = useState('');
  const [patientMobile, setPatientMobile] = useState('');

  // Copy states
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [copiedSms, setCopiedSms] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await googleReviewService.getConfig();
      if (res) {
        setConfig(res);
        setLabPlaceName(res.labPlaceName || '');
        setGoogleReviewUrl(res.googleReviewUrl || '');
        setPlaceId(res.placeId || '');
        setCustomMessage(res.customMessage || '');
        setIsActive(res.isActive !== undefined ? res.isActive : true);
      }
    } catch (err) {
      console.error('Failed to load review config:', err);
      toast.error('Failed to load Google Review settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleReviewUrl.trim()) {
      toast.error('Please provide a valid Google Review URL.');
      return;
    }

    setSaving(true);
    try {
      const updated = await googleReviewService.updateConfig({
        labPlaceName: labPlaceName.trim(),
        googleReviewUrl: googleReviewUrl.trim(),
        placeId: placeId.trim() || undefined,
        customMessage: customMessage.trim(),
        isActive,
      });

      if (updated?.config) {
        setConfig(updated.config);
      }
      toast.success('Google Review settings updated successfully');
    } catch (err: any) {
      console.error('Failed to update config:', err);
      toast.error(err?.response?.data?.error || 'Failed to update review settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = (text: string, type: 'LINK' | 'TEMPLATE' | 'SMS') => {
    navigator.clipboard.writeText(text);
    if (type === 'LINK') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      toast.success('Review link copied to clipboard!');
    } else if (type === 'TEMPLATE') {
      setCopiedTemplate(true);
      setTimeout(() => setCopiedTemplate(false), 2000);
      toast.success('WhatsApp review message copied!');
    } else {
      setCopiedSms(true);
      setTimeout(() => setCopiedSms(false), 2000);
      toast.success('SMS template copied!');
    }
  };

  const getPersonalizedMessage = (pName?: string) => {
    const greeting = pName?.trim() ? `Dear ${pName.trim()}, ` : 'Dear Patient, ';
    return `${greeting}thank you for choosing ${config.labPlaceName}! Please take a moment to rate our diagnostic lab service and share your feedback on Google: ${config.googleReviewUrl}`;
  };

  const handleOpenReviewPage = () => {
    googleReviewService.trackClick().catch(() => {});
    window.open(config.googleReviewUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSendWhatsApp = (mobile?: string, pName?: string) => {
    googleReviewService.trackSent().catch(() => {});
    const msg = encodeURIComponent(getPersonalizedMessage(pName));
    const cleanMobile = mobile?.replace(/[^0-9]/g, '');
    const url = cleanMobile ? `https://wa.me/91${cleanMobile}?text=${msg}` : `https://wa.me/?text=${msg}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    toast.success('Opening WhatsApp review invite...');
  };

  const handlePrintStandee = () => {
    window.print();
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(config.googleReviewUrl)}&margin=10`;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 font-bold">
            <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Google Review Builder</h1>
            <p className="text-xs text-muted-foreground">Manage your lab's Google rating URL, generate shareable links & dispatch 5-Star review invites.</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadConfig}
            className="p-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOpenReviewPage}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" /> Open Google Review Page
          </button>
        </div>
      </div>

      {/* 4 SUMMARY STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-amber-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Google Rating</span>
            <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-foreground font-mono">5.0</span>
            <div className="flex items-center text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
              ))}
            </div>
          </div>
          <div className="text-[11px] text-muted-foreground mt-1 font-medium">Google Verified Business</div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-blue-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Invites Dispatched</span>
            <Send className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-foreground font-mono">
            {config.totalReviewsSent || 0}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1 font-medium">WhatsApp & SMS Requests</div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-purple-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Patient Clicks</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">
            {config.totalClicks || 0}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1 font-medium">Review Page Visits</div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-emerald-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Builder Status</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {config.isActive ? 'Active & Live' : 'Paused'}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1 font-medium">Automatic Link Ready</div>
        </div>
      </div>

      {/* 2 COLUMN LAYOUT: LIVE BUILDER & QUICK DISPATCHER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2 COLS: GOOGLE REVIEW LINK & ACTIONS + PATIENT DISPATCHER */}
        <div className="lg:col-span-2 space-y-6">
          {/* SHAREABLE REVIEW LINK CARD */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground">Active Google Review URL</h2>
                  <p className="text-xs text-muted-foreground">Shareable link that opens Google's native review dialogue directly</p>
                </div>
              </div>

              <button
                onClick={handleOpenReviewPage}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Test URL <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2 p-2 bg-muted/60 rounded-xl border border-border">
              <input
                type="text"
                readOnly
                value={config.googleReviewUrl}
                className="flex-1 bg-transparent px-2 text-xs font-mono text-foreground outline-none select-all"
              />
              <button
                onClick={() => handleCopy(config.googleReviewUrl, 'LINK')}
                className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedLink ? 'Copied' : 'Copy Link'}
              </button>
            </div>

            {/* ACTION BUTTONS STRIP */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <button
                onClick={() => handleSendWhatsApp()}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <MessageSquare className="w-4 h-4" /> Share on WhatsApp
              </button>

              <button
                onClick={() => handleCopy(getPersonalizedMessage(), 'TEMPLATE')}
                className="px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-bold flex items-center justify-center gap-2 transition-all"
              >
                {copiedTemplate ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                {copiedTemplate ? 'Copied Template' : 'Copy WhatsApp Msg'}
              </button>

              <button
                onClick={() => handleCopy(getPersonalizedMessage(), 'SMS')}
                className="px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-bold flex items-center justify-center gap-2 transition-all"
              >
                {copiedSms ? <Check className="w-4 h-4 text-blue-500" /> : <Smartphone className="w-4 h-4" />}
                {copiedSms ? 'Copied SMS' : 'Copy SMS Msg'}
              </button>
            </div>
          </div>

          {/* 1-CLICK PATIENT REVIEW DISPATCHER */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">Send Review Request to Patient</h2>
                <p className="text-xs text-muted-foreground">Type patient details to generate a customized WhatsApp / SMS review invite</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Patient Name</label>
                <input
                  type="text"
                  placeholder="e.g. Anjali Sharma"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-background border border-input rounded-xl text-xs font-bold text-foreground outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Patient Mobile Number</label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={patientMobile}
                  onChange={(e) => setPatientMobile(e.target.value)}
                  className="w-full px-3.5 py-2 bg-background border border-input rounded-xl text-xs font-mono text-foreground outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* LIVE MESSAGE PREVIEW */}
            <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl space-y-1.5">
              <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Live Personalized Invitation
              </div>
              <p className="text-xs text-foreground/90 leading-relaxed font-sans select-all">
                "{getPersonalizedMessage(patientName)}"
              </p>
            </div>

            <div className="flex justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => handleCopy(getPersonalizedMessage(patientName), 'TEMPLATE')}
                className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted"
              >
                Copy Text
              </button>
              <button
                type="button"
                onClick={() => handleSendWhatsApp(patientMobile, patientName)}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer transition-all"
              >
                <Send className="w-4 h-4" /> Send via WhatsApp
              </button>
            </div>
          </div>

          {/* ADMIN CONFIGURATION SETTINGS FORM */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">Configure Google Business Profile Details</h2>
                <p className="text-xs text-muted-foreground">Update your laboratory's official Google Place ID & Review Link</p>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Laboratory / Business Name *</label>
                <input
                  type="text"
                  value={labPlaceName}
                  onChange={(e) => setLabPlaceName(e.target.value)}
                  required
                  placeholder="e.g. MedsSeva Diagnostic Center & Pathology Lab"
                  className="w-full px-3.5 py-2 bg-background border border-input rounded-xl text-xs font-bold text-foreground outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Google Review URL *</label>
                <input
                  type="url"
                  value={googleReviewUrl}
                  onChange={(e) => setGoogleReviewUrl(e.target.value)}
                  required
                  placeholder="https://g.page/r/.../review or https://search.google.com/local/writereview?placeid=..."
                  className="w-full px-3.5 py-2 bg-background border border-input rounded-xl text-xs font-mono text-foreground outline-none focus:border-purple-500"
                />
                <p className="text-[10px] text-muted-foreground">
                  Tip: Get this from your Google Business Profile &gt; "Ask for reviews" &gt; Copy link.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Google Place ID (Optional)</label>
                <input
                  type="text"
                  value={placeId}
                  onChange={(e) => setPlaceId(e.target.value)}
                  placeholder="e.g. ChIJN1t_tDeuEmsRUsoyG83frY4"
                  className="w-full px-3.5 py-2 bg-background border border-input rounded-xl text-xs font-mono text-foreground outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Custom Review Invite Message</label>
                <textarea
                  rows={2}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Dear Patient, thank you for choosing MedsSeva Diagnostics..."
                  className="w-full px-3.5 py-2 bg-background border border-input rounded-xl text-xs text-foreground outline-none focus:border-purple-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-foreground">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <span>Enable Google Review Link Generator for Lab</span>
                </label>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-60 cursor-pointer shadow-md shadow-purple-600/20 transition-all"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT COL: LIVE GOOGLE REVIEW MOCKUP & PRINTABLE QR STANDEE */}
        <div className="space-y-6">
          {/* GOOGLE CARD PREVIEW */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-500" /> Patient Experience Mockup
            </div>

            {/* GOOGLE BADGE PREVIEW */}
            <div className="bg-white text-slate-900 border border-slate-200 rounded-2xl p-5 shadow-md space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center font-bold text-blue-600">
                  <span className="text-lg font-black">G</span>
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900 leading-tight">{config.labPlaceName}</div>
                  <div className="flex items-center gap-1 text-amber-400 mt-0.5">
                    <span className="text-xs font-bold text-slate-700">5.0</span>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                    <span className="text-[10px] text-slate-500">(Google Verified)</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 italic leading-relaxed">
                "Accurate diagnostic blood reports, super fast home collection and very polite lab staff. Highly recommend MedsSeva Diagnostics!"
              </div>

              <button
                onClick={handleOpenReviewPage}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <Star className="w-3.5 h-3.5 fill-white" /> Write a Review on Google
              </button>
            </div>
          </div>

          {/* PRINTABLE QR CODE STANDEE */}
          <div ref={printRef} className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4 text-center">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-teal-500" /> In-Clinic QR Standee
              </div>
              <button
                onClick={handlePrintStandee}
                className="px-2.5 py-1 rounded-lg border border-border text-[11px] font-bold hover:bg-muted text-foreground flex items-center gap-1 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" /> Print Standee
              </button>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-inner inline-block mx-auto max-w-[240px]">
              <div className="text-xs font-bold text-slate-900 mb-1">Rate Us on Google</div>
              <div className="flex items-center justify-center gap-0.5 text-amber-400 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                ))}
              </div>
              <img
                src={qrCodeUrl}
                alt="Google Review QR Code"
                className="w-44 h-44 mx-auto rounded-lg"
              />
              <div className="text-[10px] text-slate-600 mt-2 font-medium">Scan with camera to review</div>
              <div className="text-[9px] text-slate-400 font-mono mt-0.5 truncate">{config.labPlaceName}</div>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Place this printable QR standee on the pathology reception desk so walk-in patients can scan and leave a 5-star Google review immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleReviewBuilderPage;
