import React, { useState, useRef, useMemo } from 'react';
import { useJewellery } from '../../context/JewelleryContext';
import {
  MessageSquare,
  Send,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Users,
  Share2,
  Image as ImageIcon,
  Upload,
  Trash2,
  Copy,
  Check,
  Smartphone,
  ExternalLink,
  Download,
  Eye,
  X,
  Link as LinkIcon,
  Info,
  Radio
} from 'lucide-react';

export default function SmsWhatsappModule() {
  const { activeFirm, dailyRates, customers } = useJewellery();
  const [selectedTemplate, setSelectedTemplate] = useState('rate_alert');
  const [targetGroup, setTargetGroup] = useState('all');
  const [testNumber, setTestNumber] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [previewTab, setPreviewTab] = useState('whatsapp'); // 'whatsapp' | 'sms'
  const [sentSuccess, setSentSuccess] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [showPasteTip, setShowPasteTip] = useState(false);

  // Image attachment state
  const [attachedImage, setAttachedImage] = useState(null);
  const [includeInSms, setIncludeInSms] = useState(true);
  const [smsDeliveryMode, setSmsDeliveryMode] = useState('shortlink'); // 'shortlink' | 'mms'
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const gold22k = dailyRates.find(r => r.karat?.includes('22K'))?.ratePerGram || 6600.24;
  const gold24k = dailyRates.find(r => r.karat?.includes('24K'))?.ratePerGram || 7200.00;

  // Helper to generate dynamic SVG preset creatives
  const presetImages = useMemo(() => {
    // 1. Rate Board Preset SVG
    const rateSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0a0f1d"/>
          <stop offset="50%" stop-color="#141a2e"/>
          <stop offset="100%" stop-color="#070a12"/>
        </linearGradient>
        <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#f59e0b"/>
          <stop offset="50%" stop-color="#fef08a"/>
          <stop offset="100%" stop-color="#d97706"/>
        </linearGradient>
      </defs>
      <rect width="600" height="380" fill="url(#bg)" rx="16"/>
      <rect x="12" y="12" width="576" height="356" fill="none" stroke="url(#gold)" stroke-width="2" rx="12" stroke-opacity="0.6"/>
      <text x="300" y="55" fill="url(#gold)" font-family="serif" font-size="22" font-weight="bold" text-anchor="middle" letter-spacing="3">${activeFirm.name || 'KRISHNA JEWELLERS'}</text>
      <text x="300" y="78" fill="#94a3b8" font-family="sans-serif" font-size="11" text-anchor="middle" letter-spacing="1">BIS HALLMARK CERTIFIED • OFFICIAL DAILY BULLION RATE BOARD</text>
      <line x1="60" y1="95" x2="540" y2="95" stroke="#334155" stroke-width="1"/>
      
      <!-- Gold 22k Box -->
      <rect x="45" y="120" width="155" height="130" fill="#1e293b" rx="10" stroke="#f59e0b" stroke-width="1.5"/>
      <text x="122" y="150" fill="#fef08a" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">GOLD 22K (916)</text>
      <text x="122" y="195" fill="#f59e0b" font-family="sans-serif" font-size="22" font-weight="bold" text-anchor="middle">₹${Math.round(gold22k * 10).toLocaleString('en-IN')}</text>
      <text x="122" y="225" fill="#94a3b8" font-family="sans-serif" font-size="11" text-anchor="middle">PER 10 GRAMS</text>
      
      <!-- Gold 24k Box -->
      <rect x="222" y="120" width="155" height="130" fill="#1e293b" rx="10" stroke="#eab308" stroke-width="1.5"/>
      <text x="300" y="150" fill="#fef08a" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">GOLD 24K (999)</text>
      <text x="300" y="195" fill="#eab308" font-family="sans-serif" font-size="22" font-weight="bold" text-anchor="middle">₹${Math.round(gold24k * 10).toLocaleString('en-IN')}</text>
      <text x="300" y="225" fill="#94a3b8" font-family="sans-serif" font-size="11" text-anchor="middle">PER 10 GRAMS</text>

      <!-- Silver 999 Box -->
      <rect x="400" y="120" width="155" height="130" fill="#1e293b" rx="10" stroke="#cbd5e1" stroke-width="1.5"/>
      <text x="477" y="150" fill="#f8fafc" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">SILVER 999</text>
      <text x="477" y="195" fill="#e2e8f0" font-family="sans-serif" font-size="22" font-weight="bold" text-anchor="middle">₹86,000</text>
      <text x="477" y="225" fill="#94a3b8" font-family="sans-serif" font-size="11" text-anchor="middle">PER 1 KG</text>
      
      <line x1="60" y1="285" x2="540" y2="285" stroke="#334155" stroke-width="1"/>
      <text x="300" y="315" fill="#fbbf24" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">✨ Visit Our Showroom Today For Special Making Charge Discounts! ✨</text>
      <text x="300" y="340" fill="#64748b" font-family="sans-serif" font-size="10" text-anchor="middle">Contact: ${activeFirm.phone || '+91 8956693545'} • ${activeFirm.city || 'Pune'}</text>
    </svg>`;

    // 2. Festive Diwali Offer SVG
    const diwaliSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380">
      <defs>
        <radialGradient id="festiveBg" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#4c0519"/>
          <stop offset="60%" stop-color="#1e050f"/>
          <stop offset="100%" stop-color="#050104"/>
        </radialGradient>
        <linearGradient id="gold2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#fbbf24"/>
          <stop offset="100%" stop-color="#f59e0b"/>
        </linearGradient>
      </defs>
      <rect width="600" height="380" fill="url(#festiveBg)" rx="16"/>
      <rect x="14" y="14" width="572" height="352" fill="none" stroke="#d97706" stroke-width="2" rx="12" stroke-dasharray="6,4"/>
      <text x="300" y="60" fill="#fde047" font-family="serif" font-size="16" letter-spacing="4" text-anchor="middle">🪔 SHUBH DHANTERAS &amp; DIWALI UTSAV 🪔</text>
      <text x="300" y="98" fill="#ffffff" font-family="serif" font-size="28" font-weight="bold" text-anchor="middle">${activeFirm.name || 'KRISHNA JEWELLERS'}</text>
      <rect x="70" y="125" width="460" height="135" fill="#701a28" fill-opacity="0.6" rx="14" stroke="#f59e0b" stroke-width="1.5"/>
      <text x="300" y="165" fill="#fde047" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle">FLAT 5% OFF ON GOLD MAKING CHARGES</text>
      <text x="300" y="200" fill="#fcd34d" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle">&amp; FLAT 15% OFF ON NATURAL DIAMOND JEWELLERY</text>
      <text x="300" y="235" fill="#cbd5e1" font-family="sans-serif" font-size="12" text-anchor="middle">Certified 100% BIS Hallmarked • Free Gold Coin on Purchases above ₹1 Lakh</text>
      <text x="300" y="300" fill="#fef08a" font-family="serif" font-size="13" font-style="italic" text-anchor="middle">"Celebrate prosperity with auspicious, handcrafted gold jewellery"</text>
      <text x="300" y="335" fill="#94a3b8" font-family="sans-serif" font-size="11" text-anchor="middle">Bookings Open: ${activeFirm.phone || '+91 8956693545'} • Showroom: ${activeFirm.city || 'Pune'}</text>
    </svg>`;

    // 3. Bridal Collection SVG
    const bridalSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380">
      <defs>
        <linearGradient id="bridalBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#022c22"/>
          <stop offset="50%" stop-color="#064e3b"/>
          <stop offset="100%" stop-color="#021f18"/>
        </linearGradient>
      </defs>
      <rect width="600" height="380" fill="url(#bridalBg)" rx="16"/>
      <rect x="14" y="14" width="572" height="352" fill="none" stroke="#34d399" stroke-width="1.5" rx="12"/>
      <text x="300" y="55" fill="#a7f3d0" font-family="sans-serif" font-size="12" letter-spacing="4" text-anchor="middle">ROYAL WEDDING &amp; BRIDAL COLLECTION 2025</text>
      <text x="300" y="95" fill="#fbbf24" font-family="serif" font-size="26" font-weight="bold" text-anchor="middle">${activeFirm.name || 'KRISHNA JEWELLERS'}</text>
      <rect x="80" y="125" width="440" height="140" fill="#062e24" fill-opacity="0.8" rx="12" stroke="#fbbf24" stroke-width="1.5"/>
      <text x="300" y="165" fill="#fef08a" font-family="serif" font-size="19" font-weight="bold" text-anchor="middle">✨ Handcrafted Kundan, Polki &amp; Antique Gold ✨</text>
      <text x="300" y="200" fill="#6ee7b7" font-family="sans-serif" font-size="13" text-anchor="middle">Exclusive Bridal Chokers, Haar, Bangles, Maang Tikka &amp; Jhumkas</text>
      <text x="300" y="235" fill="#cbd5e1" font-family="sans-serif" font-size="11" text-anchor="middle">Custom Bridal Design Consultations Available with Master Karigars</text>
      <text x="300" y="305" fill="#fbbf24" font-family="sans-serif" font-size="13" font-weight="bold" text-anchor="middle">Visit Showroom to View Exclusive Bridal Lookbook</text>
      <text x="300" y="335" fill="#94a3b8" font-family="sans-serif" font-size="11" text-anchor="middle">Call: ${activeFirm.phone || '+91 8956693545'} • ${activeFirm.address?.split(',')[0] || 'Showroom'}</text>
    </svg>`;

    return {
      rate_card: {
        id: 'rate_card',
        name: 'Daily_Bullion_Rate_Board.svg',
        title: 'Daily Gold Rate Board',
        size: '14.2 KB',
        dataUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(rateSvg),
        shortlink: 'https://j-os.in/m/gld-rate',
        type: 'image/svg+xml'
      },
      diwali: {
        id: 'diwali',
        name: 'Diwali_Festive_Offer_Flyer.svg',
        title: 'Diwali Festive Offer Flyer',
        size: '16.8 KB',
        dataUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(diwaliSvg),
        shortlink: 'https://j-os.in/m/diwali-utsav',
        type: 'image/svg+xml'
      },
      bridal: {
        id: 'bridal',
        name: 'Royal_Bridal_Collection.svg',
        title: 'Royal Bridal Lookbook Flyer',
        size: '15.4 KB',
        dataUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(bridalSvg),
        shortlink: 'https://j-os.in/m/bridal-2025',
        type: 'image/svg+xml'
      }
    };
  }, [activeFirm, gold22k, gold24k]);

  const templates = {
    rate_alert: `✨ *Today's Gold Rate Alert from ${activeFirm.name}* ✨\nGold 22K (916): ₹${Math.round(gold22k * 10).toLocaleString('en-IN')}/10GM\nGold 24K (999): ₹${Math.round(gold24k * 10).toLocaleString('en-IN')}/10GM\nSilver 999: ₹86,000/KG\nVisit showroom today for exclusive making discounts! Phone: ${activeFirm.phone}`,
    festival_offer: `🪔 *Happy Dhanteras & Diwali from ${activeFirm.name}!* 🪔\nEnjoy 5% OFF on Gold Jewellery Making Charges & 15% OFF on Certified Diamond Jewellery.\nFree Gold Coin on purchases above ₹1 Lakh!\nShop now: ${activeFirm.address}`,
    payment_receipt: `Dear Customer, thank you for purchasing from ${activeFirm.name}. Your tax invoice has been generated.\nContact: ${activeFirm.phone}`,
    udhaar_reminder: `Dear Customer, gentle reminder regarding your outstanding jewellery account balance at ${activeFirm.name}.\nKindly visit or GPay at ${activeFirm.upiId || 'krishna@okhdfcbank'}. Thank you!`
  };

  const rawText = customMessage || templates[selectedTemplate] || '';

  // Formatted text with SMS media link if enabled
  const smsTextWithLink = useMemo(() => {
    if (attachedImage && includeInSms && smsDeliveryMode === 'shortlink') {
      return `${rawText}\n\n📸 View Offer Flyer: ${attachedImage.shortlink}`;
    }
    return rawText;
  }, [rawText, attachedImage, includeInSms, smsDeliveryMode]);

  // SMS character count & credit calculations
  const smsCharCount = smsTextWithLink.length;
  const smsCreditsNeeded = Math.max(1, Math.ceil(smsCharCount / 160));

  // Handle local file uploads
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG, WEBP, or SVG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const randomCode = Math.random().toString(36).substring(2, 7);
      setAttachedImage({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        dataUrl: event.target.result,
        shortlink: `https://j-os.in/m/${randomCode}`,
        type: file.type,
        isCustom: true
      });
    };
    reader.readAsDataURL(file);
    // Reset file input value so re-selecting same file triggers change
    e.target.value = '';
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const randomCode = Math.random().toString(36).substring(2, 7);
        setAttachedImage({
          name: file.name,
          size: (file.size / 1024).toFixed(1) + ' KB',
          dataUrl: event.target.result,
          shortlink: `https://j-os.in/m/${randomCode}`,
          type: file.type,
          isCustom: true
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Copy Image to Clipboard helper
  const copyImageToClipboard = async () => {
    if (!attachedImage) return;
    try {
      const img = new window.Image();
      img.src = attachedImage.dataUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 600;
        canvas.height = img.naturalHeight || 380;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(async (blob) => {
          if (blob && navigator.clipboard?.write) {
            try {
              await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
              ]);
              setCopiedToast(true);
              setTimeout(() => setCopiedToast(false), 3000);
            } catch (err) {
              console.warn('Clipboard write error:', err);
            }
          }
        }, 'image/png');
      };
    } catch (e) {
      console.warn('Clipboard fallback:', e);
    }
  };

  // Download Image helper
  const downloadImage = () => {
    if (!attachedImage) return;
    const a = document.createElement('a');
    a.href = attachedImage.dataUrl;
    a.download = attachedImage.name || 'jewellery-offer-flyer.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Share via WhatsApp
  const handleShareWhatsApp = async () => {
    let messageText = rawText;
    if (attachedImage) {
      // Append promotional photo reference link
      messageText = `${rawText}\n\n📸 *Attached Flyer:* ${attachedImage.shortlink}`;
    }

    // Attempt Native Web Share API with attached file if supported (Mobile Chrome, Safari, macOS)
    if (navigator.share && attachedImage && navigator.canShare) {
      try {
        const res = await fetch(attachedImage.dataUrl);
        const blob = await res.blob();
        const file = new File([blob], attachedImage.name || 'offer.png', { type: blob.type || 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `${activeFirm.name} Promotional Campaign`,
            text: rawText
          });
          return;
        }
      } catch (err) {
        console.log('Web Share API dismissed or unhandled, falling back to wa.me');
      }
    }

    // Auto-copy image to clipboard so user can Cmd+V / Ctrl+V into WhatsApp Web
    if (attachedImage) {
      copyImageToClipboard();
      setShowPasteTip(true);
      setTimeout(() => setShowPasteTip(false), 6000);
    }

    // Dispatch wa.me
    const encoded = encodeURIComponent(messageText);
    let url = `https://wa.me/?text=${encoded}`;
    if (targetGroup === 'test' && testNumber.trim()) {
      const cleanNum = testNumber.replace(/\D/g, '');
      const fullNum = cleanNum.length === 10 ? '91' + cleanNum : cleanNum;
      url = `https://wa.me/${fullNum}?text=${encoded}`;
    }
    window.open(url, '_blank');
  };

  // WhatsApp Cloud API Direct Dispatch
  const handleWhatsAppCloudApi = (e) => {
    e?.preventDefault();
    let recipientCount = customers.length;
    if (targetGroup === 'udhaar') {
      recipientCount = customers.filter(c => c.balanceUdhaar > 0).length || 5;
    } else if (targetGroup === 'vip') {
      recipientCount = Math.max(3, Math.floor(customers.length / 3));
    } else if (targetGroup === 'test') {
      recipientCount = 1;
    }

    setSentSuccess({ type: 'demo', recipients: recipientCount, mode: 'WhatsApp demo' });
    setTimeout(() => setSentSuccess(null), 5000);
  };

  // SMS Broadcast Dispatch
  const handleSendSms = (e) => {
    e?.preventDefault();
    let recipientCount = customers.length;
    if (targetGroup === 'udhaar') {
      recipientCount = customers.filter(c => c.balanceUdhaar > 0).length || 5;
    } else if (targetGroup === 'vip') {
      recipientCount = Math.max(3, Math.floor(customers.length / 3));
    } else if (targetGroup === 'test') {
      recipientCount = 1;
    }

    setSentSuccess({ type: 'demo', recipients: recipientCount, mode: 'SMS demo' });
    setTimeout(() => setSentSuccess(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-serif font-bold text-slate-100 uppercase tracking-wider">
              SMS &amp; WHATSAPP MARKETING PANEL
            </h2>
          </div>
          <p className="text-xs text-amber-400 font-medium mt-0.5">
            Automated Rate Broadcasts, Billing Receipts, Festive Campaigns &amp; High-Res Media Flyers
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="bg-slate-900 border border-slate-800 text-amber-400 px-3 py-1.5 rounded-xl font-mono font-bold flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5" /> DEMO ONLY — NO SMS CREDITS
          </span>
          <span className="bg-amber-950/80 text-amber-200 border border-amber-600/50 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> No messaging provider connected
          </span>
          <span className="bg-slate-900 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5" /> Preview assets only
          </span>
        </div>
      </div>

      {/* Success Notification Alert */}
      {sentSuccess && (
        <div className="p-4 bg-amber-950/90 border border-amber-500/80 rounded-2xl text-amber-100 text-xs shadow-xl animate-fade-in flex items-start justify-between gap-3">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-sm">Demo simulation only — no message sent</p>
              <p className="text-amber-200/90">The {sentSuccess.mode} preview included {sentSuccess.recipients} synthetic recipient(s). Nothing was queued, delivered, or charged.</p>
            </div>
          </div>
          <button
            onClick={() => setSentSuccess(null)}
            className="text-amber-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Clipboard Toast */}
      {copiedToast && (
        <div className="p-3 bg-amber-950 border border-amber-500 rounded-xl text-amber-200 text-xs flex items-center space-x-2 shadow-lg animate-bounce">
          <Check className="w-4 h-4 text-amber-400" />
          <span>High-resolution promo image copied to your clipboard! Paste directly into any chat.</span>
        </div>
      )}

      {/* WhatsApp Web Paste Tip */}
      {showPasteTip && (
        <div className="p-3 bg-blue-950/90 border border-blue-500 rounded-xl text-blue-200 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-blue-400 shrink-0" />
            <span>
              <strong>WhatsApp Opened:</strong> Flyer image has been copied to your clipboard! Simply press <strong>Cmd+V / Ctrl+V</strong> in the chat to paste the high-res flyer image along with your pre-filled text.
            </span>
          </div>
          <button onClick={() => setShowPasteTip(false)} className="text-blue-400 hover:text-white ml-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ========================================================= */}
        {/* LEFT COLUMN: Campaign Templates & Image Attachment (5 cols) */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 space-y-6">
          {/* Template Selector Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> 1. Select Campaign Template
            </h3>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'rate_alert', title: 'Daily Gold Rate Alert', icon: '📊' },
                { id: 'festival_offer', title: 'Diwali & Festival Offer', icon: '🪔' },
                { id: 'payment_receipt', title: 'Bill / Payment Receipt', icon: '🧾' },
                { id: 'udhaar_reminder', title: 'Udhaar Reminder', icon: '💳' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelectedTemplate(t.id);
                    setCustomMessage('');
                    // Auto-suggest preset image if matched
                    if (t.id === 'rate_alert' && !attachedImage?.isCustom) {
                      setAttachedImage(presetImages.rate_card);
                    } else if (t.id === 'festival_offer' && !attachedImage?.isCustom) {
                      setAttachedImage(presetImages.diwali);
                    }
                  }}
                  className={`p-3 rounded-xl text-xs font-bold text-left transition-all flex flex-col justify-between ${
                    selectedTemplate === t.id
                      ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold ring-2 ring-amber-400/50'
                      : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <span className="text-base mb-1">{t.icon}</span>
                  <span>{t.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ========================================================= */}
          {/* IMAGE ATTACHMENT CARD (WhatsApp & SMS)                     */}
          {/* ========================================================= */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200">
                  2. Attach Image / Promo Flyer
                </h3>
              </div>
              {attachedImage && (
                <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Image Active
                </span>
              )}
            </div>

            {/* If NO image attached: Show Upload Dropzone & Presets */}
            {!attachedImage ? (
              <div className="space-y-3">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-amber-400 bg-amber-500/10'
                      : 'border-slate-700 hover:border-amber-400/60 bg-slate-950/60 hover:bg-slate-900'
                  }`}
                >
                  <div className="mx-auto w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-amber-400 mb-2">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-200">
                    Click to Upload Image or Drag &amp; Drop
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Promotional Flyer, Store Rate Board, Banner or Jewellery Catalog (JPG, PNG, WEBP)
                  </p>
                </div>

                {/* 1-Click Jeweller Promo Presets */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Or Choose Instant Ready-Made Flyer:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setAttachedImage(presetImages.rate_card)}
                      className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-amber-400/50 rounded-xl text-left transition-all group"
                    >
                      <div className="text-sm mb-1">📊</div>
                      <p className="text-[11px] font-bold text-slate-200 group-hover:text-amber-300 leading-tight">
                        Rate Board
                      </p>
                      <p className="text-[9px] text-slate-500">Stored 22K/24K rates</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAttachedImage(presetImages.diwali)}
                      className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-amber-400/50 rounded-xl text-left transition-all group"
                    >
                      <div className="text-sm mb-1">🪔</div>
                      <p className="text-[11px] font-bold text-slate-200 group-hover:text-amber-300 leading-tight">
                        Festive Offer
                      </p>
                      <p className="text-[9px] text-slate-500">Diwali/Making</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAttachedImage(presetImages.bridal)}
                      className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-amber-400/50 rounded-xl text-left transition-all group"
                    >
                      <div className="text-sm mb-1">💎</div>
                      <p className="text-[11px] font-bold text-slate-200 group-hover:text-amber-300 leading-tight">
                        Bridal Flyer
                      </p>
                      <p className="text-[9px] text-slate-500">Kundan/Polki</p>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* If Image IS Attached: Display Rich Thumbnail Card & Actions */
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 group">
                  <img
                    src={attachedImage.dataUrl}
                    alt="Promotional Attachment"
                    className="w-full h-36 object-cover object-center cursor-pointer hover:opacity-95 transition-all"
                    onClick={() => setLightboxOpen(true)}
                  />
                  
                  {/* Overlay Action Bar */}
                  <div className="absolute top-2 right-2 flex items-center space-x-1.5 bg-slate-950/80 backdrop-blur-md px-2 py-1 rounded-lg border border-slate-700">
                    <button
                      type="button"
                      onClick={() => setLightboxOpen(true)}
                      title="Preview Full Image"
                      className="p-1 hover:text-amber-400 text-slate-300 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={copyImageToClipboard}
                      title="Copy Image to Clipboard"
                      className="p-1 hover:text-amber-400 text-slate-300 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={downloadImage}
                      title="Download Image"
                      className="p-1 hover:text-amber-400 text-slate-300 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setAttachedImage(null)}
                      title="Remove Attachment"
                      className="p-1 hover:text-rose-400 text-slate-300 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    </button>
                  </div>

                  <div className="absolute bottom-2 left-2 bg-slate-950/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 text-[10px] text-slate-200 font-mono">
                    {attachedImage.name} • {attachedImage.size}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" /> Replace with Another Image
                  </button>

                  <button
                    type="button"
                    onClick={() => setAttachedImage(null)}
                    className="text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove Image
                  </button>
                </div>
              </div>
            )}

            {/* Delivery Configuration for WhatsApp & SMS */}
            {attachedImage && (
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <div className="text-[11px] space-y-2">
                  <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span> WhatsApp Delivery:
                    </span>
                    <span className="text-emerald-400 font-mono text-[10px] font-bold">
                      Direct High-Res Image + Caption
                    </span>
                  </div>

                  {/* SMS Delivery Mode Card */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includeInSms}
                          onChange={(e) => setIncludeInSms(e.target.checked)}
                          className="rounded text-amber-500 focus:ring-0 focus:outline-none"
                        />
                        <span>Enable Image Delivery in SMS</span>
                      </label>
                      <span className="text-[10px] text-amber-400 font-mono">
                        {includeInSms ? 'Included' : 'Text Only'}
                      </span>
                    </div>

                    {includeInSms && (
                      <div className="space-y-1.5 pt-1 pl-5">
                        <label className="flex items-center space-x-2 text-[11px] text-slate-300 cursor-pointer">
                          <input
                            type="radio"
                            name="smsMode"
                            value="shortlink"
                            checked={smsDeliveryMode === 'shortlink'}
                            onChange={() => setSmsDeliveryMode('shortlink')}
                            className="text-amber-500"
                          />
                          <span>
                            <strong>Cloud Media Shortlink</strong> (DLT Standard, 100% phone support)
                          </span>
                        </label>
                        <p className="text-[10px] text-slate-500 pl-5">
                          Appends instant trackable link (e.g. <span className="font-mono text-amber-400">{attachedImage.shortlink}</span>) opening HD promotional flyer.
                        </p>

                        <label className="flex items-center space-x-2 text-[11px] text-slate-300 cursor-pointer pt-1">
                          <input
                            type="radio"
                            name="smsMode"
                            value="mms"
                            checked={smsDeliveryMode === 'mms'}
                            onChange={() => setSmsDeliveryMode('mms')}
                            className="text-amber-500"
                          />
                          <span>
                            <strong>Carrier MMS Gateway</strong> (Direct in-inbox multimedia)
                          </span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Target Audience Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-amber-400" /> 3. Target Audience
            </h3>

            <select
              value={targetGroup}
              onChange={(e) => setTargetGroup(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-amber-400"
            >
              <option value="all">All Registered Customers ({customers.length} Contacts)</option>
              <option value="udhaar">Customers with Active Udhaar Only</option>
              <option value="vip">VIP Gold Club Members</option>
              <option value="test">Single Test Mobile Number</option>
            </select>

            {targetGroup === 'test' && (
              <div className="pt-2 space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Enter Test Mobile Number:</label>
                <input
                  type="text"
                  placeholder="+91 9876543210"
                  value={testNumber}
                  onChange={(e) => setTestNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-amber-400"
                />
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: Message Editor & Live Preview (7 cols)       */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Header & Preview Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200">
                Message Editor &amp; Interactive Preview
              </h3>

              <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewTab('whatsapp')}
                  className={`px-3 py-1 rounded-lg font-bold flex items-center space-x-1.5 transition-all ${
                    previewTab === 'whatsapp'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>WhatsApp Preview</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewTab('sms')}
                  className={`px-3 py-1 rounded-lg font-bold flex items-center space-x-1.5 transition-all ${
                    previewTab === 'sms'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>SMS Preview</span>
                </button>
              </div>
            </div>

            {/* Message Textarea */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>EDIT MESSAGE TEXT / CAPTION:</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  Supports WhatsApp formatting (*bold*, _italic_)
                </span>
              </label>
              <textarea
                rows={5}
                value={rawText}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl p-3 text-xs text-slate-100 font-sans focus:outline-none resize-y"
              />

              {/* Character & Credit Counters */}
              <div className="flex flex-wrap items-center justify-between gap-2 mt-1.5 text-[11px] text-slate-400 font-mono">
                <div className="flex items-center space-x-3">
                  <span>Text: {rawText.length} chars</span>
                  {attachedImage && includeInSms && smsDeliveryMode === 'shortlink' && (
                    <span className="text-amber-400">
                      + {attachedImage.shortlink.length + 20} chars (Media Shortlink)
                    </span>
                  )}
                </div>
                <div className="font-bold text-slate-300">
                  Total SMS: {smsCharCount} chars ({smsCreditsNeeded} SMS Credit{smsCreditsNeeded > 1 ? 's' : ''} / recipient)
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* LIVE SIMULATOR PREVIEW                                    */}
            {/* ========================================================= */}
            <div className="pt-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Live Customer Screen Simulation:
              </label>

              {previewTab === 'whatsapp' ? (
                /* WHATSAPP CHAT PREVIEW BUBBLE */
                <div className="bg-[#0b141a] rounded-2xl p-4 border border-slate-800 shadow-inner max-w-lg mx-auto">
                  <div className="flex items-center space-x-2 pb-3 mb-3 border-b border-slate-800 text-xs text-slate-300 font-medium">
                    <div className="w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-white text-[11px]">
                      {activeFirm.name ? activeFirm.name[0] : 'K'}
                    </div>
                    <div>
                      <p className="font-bold text-slate-100 leading-tight">{activeFirm.name || 'Krishna Jewellers'}</p>
                      <p className="text-[10px] text-emerald-400">Official Business Account</p>
                    </div>
                  </div>

                  <div className="bg-[#005c4b] text-slate-100 rounded-2xl rounded-tl-sm p-3 shadow-md space-y-2 max-w-sm">
                    {/* Attached Image Thumbnail */}
                    {attachedImage && (
                      <div className="relative rounded-xl overflow-hidden border border-emerald-400/30 bg-black/40">
                        <img
                          src={attachedImage.dataUrl}
                          alt="Flyer Preview"
                          className="w-full h-44 object-cover object-center cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => setLightboxOpen(true)}
                        />
                        <div className="absolute top-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[10px] text-emerald-300 font-mono">
                          📸 High-Res Promotional Flyer
                        </div>
                      </div>
                    )}

                    {/* Message Body */}
                    <p className="text-xs whitespace-pre-line leading-relaxed font-sans">
                      {rawText}
                    </p>

                    {/* Time & Read Receipts */}
                    <div className="flex items-center justify-end space-x-1 text-[10px] text-emerald-200/80 pt-1 font-mono">
                      <span>11:45 AM</span>
                      <span className="text-cyan-300 font-bold">✓✓</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* SMS CHAT PREVIEW BUBBLE */
                <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 shadow-inner max-w-lg mx-auto space-y-3">
                  <div className="text-center">
                    <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-[10px] font-mono font-bold">
                      SMS From: VK-KRISHNA • DLT Registered
                    </span>
                  </div>

                  <div className="bg-slate-800 text-slate-100 rounded-2xl rounded-bl-sm p-3.5 shadow space-y-2 max-w-sm">
                    <p className="text-xs whitespace-pre-line leading-relaxed">
                      {smsTextWithLink}
                    </p>

                    {/* SMS Rich Link Card if image attached and shortlink enabled */}
                    {attachedImage && includeInSms && smsDeliveryMode === 'shortlink' && (
                      <div
                        onClick={() => setLightboxOpen(true)}
                        className="bg-slate-900 border border-slate-700 rounded-xl p-2.5 flex items-center space-x-3 cursor-pointer hover:border-amber-400/60 transition-all"
                      >
                        <img
                          src={attachedImage.dataUrl}
                          alt="Media Preview"
                          className="w-12 h-12 object-cover rounded-lg border border-slate-700 shrink-0"
                        />
                        <div className="overflow-hidden">
                          <p className="text-[11px] font-bold text-amber-400 truncate">
                            {attachedImage.name}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            Tap to view full high-res jewellery flyer
                          </p>
                          <p className="text-[9px] text-emerald-400 font-mono truncate">
                            {attachedImage.shortlink}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="text-[9px] text-slate-400 text-right pt-0.5 font-mono">
                      Sent via Indian Telecom DLT Gateway
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ========================================================= */}
          {/* ACTION DISPATCH BUTTONS                                    */}
          {/* ========================================================= */}
          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-400 flex items-center space-x-2">
              {attachedImage ? (
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5" /> Image Attached ({attachedImage.size})
                </span>
              ) : (
                <span className="text-slate-500">No image attached (Text campaign only)</span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* WhatsApp Share Button */}
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>
                  {attachedImage ? 'Share via WhatsApp (with Image)' : 'Share via WhatsApp'}
                </span>
              </button>

              {/* WhatsApp Cloud API Direct Dispatch Button */}
              <button
                type="button"
                onClick={handleWhatsAppCloudApi}
                className="px-4 py-2.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-600 text-emerald-200 font-bold rounded-xl text-xs flex items-center space-x-1.5 transition-all cursor-pointer"
                title="Broadcast directly via WhatsApp Business Cloud API"
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp API Broadcast</span>
              </button>

              {/* Send Broadcast SMS Button */}
              <button
                type="button"
                onClick={handleSendSms}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>
                  {attachedImage && includeInSms
                    ? `SEND SMS WITH IMAGE (${smsCreditsNeeded} CR)`
                    : 'SEND BROADCAST SMS'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* FULL-SIZE LIGHTBOX MODAL FOR ATTACHED IMAGE               */}
      {/* ========================================================= */}
      {lightboxOpen && attachedImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-3xl w-full bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl space-y-4 p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <ImageIcon className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm text-slate-100">{attachedImage.name}</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {attachedImage.size} • Hosted Shortlink: {attachedImage.shortlink}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setLightboxOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex justify-center items-center bg-black/60 rounded-xl p-2 max-h-[60vh] overflow-auto">
              <img
                src={attachedImage.dataUrl}
                alt="Full Size Flyer"
                className="max-h-[55vh] max-w-full object-contain rounded-lg shadow-lg"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
              <div className="text-slate-400 font-mono text-[11px]">
                Ready for WhatsApp HD transmission and SMS cloud media delivery
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={copyImageToClipboard}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Image
                </button>
                <button
                  type="button"
                  onClick={downloadImage}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg font-bold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
