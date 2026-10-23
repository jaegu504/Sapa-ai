import React, { useState } from 'react';
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Clock,
  Heart,
  MessageCircle,
  Briefcase,
  Layers,
} from 'lucide-react';

import { PermissionStep } from './PermissionStep';
import sapaLogo from '../../assets/logo.png';

export interface OnboardingModalProps {
  isOpen: boolean;
  /** Lewati: closes the intro and skips the guided tour. */
  onClose: () => void;
  onComplete?: () => void;
  /** Called after the permission screen's "Mulai Tutorial"; defaults to the skip path. */
  onFinish?: () => void;
}

export const ONBOARDING_STORAGE_KEY = 'sapa_onboarding_completed';

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  onFinish,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showPermissions, setShowPermissions] = useState(false);

  if (!isOpen) return null;

  const slides = [
    {
      id: 'welcome',
      badge: 'Selamat Datang',
      title: "Assalamu'alaikum, Selamat Datang di Sapa",
      description:
        'Sapa membantu Anda menjaga silaturahmi: mengingatkan siapa yang sudah waktunya disapa, mencatat kabar mereka, dan membantu menyusun pesan WhatsApp yang santun.',
      visual: (
        <img src={sapaLogo} alt="Sapa Logo" className="w-28 h-28 mx-auto rounded-[28px] shadow-xl object-cover" />
      ),
      highlights: [
        { icon: Heart, label: 'Ingat Siapa Disapa', desc: 'Pengingat sesuai ritme tiap relasi' },
        { icon: Sparkles, label: 'Pesan Lebih Santun', desc: 'Draf AI dari catatan Anda' },
      ],
    },
    {
      id: 'radar',
      badge: 'Denyut & Radar Sapa',
      title: 'Pantau Denyut Silaturahmi',
      description:
        'Sapa membantu Anda merawat hubungan penting dengan ritme yang teratur dan personal, menjaga kehangatan tanpa terasa seperti beban.',
      visual: (
        <div className="relative w-40 h-40 sm:w-44 sm:h-44 mx-auto flex items-center justify-center">
          {/* Outer Ring: Emerald 92% */}
          <div
            className="w-40 h-40 rounded-full p-2.5 flex items-center justify-center shadow-lg"
            style={{
              background:
                'conic-gradient(#10B981 0% 92%, rgba(255, 255, 255, 0.08) 92% 100%)',
            }}
          >
            {/* Gap Track */}
            <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-2.5">
              {/* Inner Ring: Rose / Attention 45% */}
              <div
                className="w-full h-full rounded-full p-2.5 flex items-center justify-center shadow-md"
                style={{
                  background:
                    'conic-gradient(#F43F5E 0% 45%, rgba(255, 255, 255, 0.08) 45% 100%)',
                }}
              >
                {/* Center Core */}
                <div className="w-full h-full rounded-full bg-white dark:bg-[#1C1C1E] flex flex-col items-center justify-center text-center shadow-inner">
                  <span className="text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-none">
                    92%
                  </span>
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mt-1">
                    Harmonis
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      highlights: [
        { icon: Heart, label: 'Skor Denyut Real-Time', desc: 'Indikator kehangatan relasi Anda' },
        { icon: Layers, label: 'Ritme Silaturahmi', desc: 'Siklus 7, 15, atau 30 hari yang fleksibel' },
      ],
    },
    {
      id: 'whatsapp',
      badge: 'Dual WhatsApp & AI Draft',
      title: 'Sapa Cepat via WhatsApp',
      description:
        'Kirim pesan langsung ke WhatsApp Personal atau WhatsApp Business dengan satu klik, didukung saran draf pesan AI yang santun.',
      visual: (
        <div className="w-full max-w-xs mx-auto py-3 space-y-3">
          {/* Glass Card Mockup */}
          <div className="bg-slate-50/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-2xl p-3.5 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  UD
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white">Ustadz Danu Hasan</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">+62 812-3456-7891</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                Sisa 1 hr
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white/90 dark:bg-black/40 border border-slate-100 dark:border-white/5 text-[11px] text-slate-600 dark:text-slate-300 italic">
              &quot;Assalamu&apos;alaikum Ustadz Danu, semoga sehat selalu. Ingin menanyakan materi kajian kitab pekan depan...&quot;
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-full bg-[#25D366] text-white text-[11px] font-semibold shadow-xs">
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-full bg-slate-900 dark:bg-slate-700 text-white text-[11px] font-semibold shadow-xs">
                <Briefcase className="w-3.5 h-3.5" />
                <span>W4B Bisnis</span>
              </div>
            </div>
          </div>
        </div>
      ),
      highlights: [
        { icon: MessageCircle, label: 'Dukungan Dua WhatsApp', desc: 'Buka WhatsApp Pribadi maupun Business' },
        { icon: Sparkles, label: 'Draf Percakapan AI', desc: 'Salam pembuka natural sesuai catatan obrolan' },
      ],
    },
    {
      id: 'privacy',
      badge: 'Pengingat & 100% Privat',
      title: 'Pengingat Pagi & Bebas Cemas',
      description:
        'Nikmati pengingat jam 08:00 WIB yang tenang tanpa spam. Semua data dan catatan tersimpan 100% lokal di HP Anda.',
      visual: (
        <div className="relative w-44 h-44 sm:w-48 sm:h-48 mx-auto flex items-center justify-center">
          <div className="absolute inset-4 bg-gradient-to-tr from-blue-500/15 via-indigo-500/15 to-emerald-400/15 rounded-full pointer-events-none" />
          <div className="relative z-10 w-28 h-28 rounded-3xl bg-slate-50 dark:bg-white/10 border border-slate-200/80 dark:border-white/15 shadow-xl flex flex-col items-center justify-center gap-1.5 text-center p-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-md">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-base font-extrabold text-slate-800 dark:text-white">08:00 WIB</span>
            <div className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% Offline</span>
            </div>
          </div>
        </div>
      ),
      highlights: [
        { icon: Clock, label: 'Pengingat Pagi Terencana', desc: 'Notifikasi lokal otomatis tanpa ganggu fokus' },
        { icon: ShieldCheck, label: 'Privasi Terjamin', desc: 'Tanpa pelacak, data tidak dikirim ke server luar' },
      ],
    },
  ];

  const handleFinish = () => {
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    } catch {
      // Ignore localStorage failures
    }
    onComplete?.();
    onClose();
  };

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      setShowPermissions(true);
    }
  };

  const handleStartTour = () => {
    if (!onFinish) {
      handleFinish();
      return;
    }
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    } catch {
      // Ignore localStorage failures
    }
    onFinish();
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const activeSlide = slides[currentSlide];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      data-testid="onboarding-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 animate-fade-in"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-[#1C1C1E] border border-slate-200/80 dark:border-white/10 rounded-[32px] shadow-2xl p-6 sm:p-7 flex flex-col justify-between min-h-[540px] text-slate-800 dark:text-white overflow-hidden">
        {/* Top Header Actions */}
        <div className="flex items-center justify-between pb-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400">
            {showPermissions ? 'Izin Akses' : activeSlide.badge}
          </span>
          <button
            type="button"
            onClick={handleFinish}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white px-2.5 py-1 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            Lewati
          </button>
        </div>

        {showPermissions ? (
          <PermissionStep onContinue={handleStartTour} />
        ) : (
        <>
        {/* Slide Visual Graphic */}
        <div className="my-auto py-2">
          {activeSlide.visual}

          <div className="text-center mt-3 space-y-1.5">
            <h2
              id="onboarding-title"
              className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white"
            >
              {activeSlide.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed px-2">
              {activeSlide.description}
            </p>
          </div>

          {/* Highlights Bento */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            {activeSlide.highlights.map((h, i) => {
              const Icon = h.icon;
              return (
                <div
                  key={i}
                  className="p-2.5 rounded-2xl bg-slate-50/80 dark:bg-white/5 border border-slate-100 dark:border-white/10 flex items-start gap-2"
                >
                  <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-800 dark:text-white truncate">
                      {h.label}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                      {h.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between gap-3">
          {/* Dot Indicators */}
          <div className="flex items-center gap-1.5">
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Buka slide ${index + 1}`}
                onClick={() => setCurrentSlide(index)}
                className={`transition-all duration-300 ${
                  currentSlide === index
                    ? 'w-6 h-2 rounded-full bg-blue-600 dark:bg-blue-500'
                    : 'w-2 h-2 rounded-full bg-slate-200 dark:bg-white/20 hover:bg-slate-300'
                }`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {currentSlide > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="w-10 h-10 rounded-full flex items-center justify-center border border-slate-200 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                aria-label="Kembali"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {currentSlide < slides.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-slate-900 dark:bg-blue-600 text-white font-semibold text-xs sm:text-sm hover:bg-slate-800 dark:hover:bg-blue-500 shadow-md transition-all active:scale-95"
              >
                <span>Lanjut</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Lanjutkan</span>
              </button>
            )}
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
};
