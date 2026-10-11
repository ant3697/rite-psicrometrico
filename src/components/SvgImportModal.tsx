import React, { useState, useRef } from 'react';
import { X, FileCode, Upload, Check, Trash2, Sliders, ShieldCheck, Sparkles } from 'lucide-react';

interface SvgImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  customSvgRaw: string | null;
  onApplyCustomSvg: (svgText: string | null) => void;
  onApplySiNo1Theme: () => void;
  onApplyFlyCarpetTheme?: () => void;
}

export const SvgImportModal: React.FC<SvgImportModalProps> = ({
  isOpen,
  onClose,
  customSvgRaw,
  onApplyCustomSvg,
  onApplySiNo1Theme,
  onApplyFlyCarpetTheme,
}) => {
  const [pastedSvg, setPastedSvg] = useState<string>('');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const processSvgText = (text: string, filename?: string) => {
    setErrorMsg(null);
    const trimmed = text.trim();
    if (!trimmed.includes('<svg') || !trimmed.includes('</svg>')) {
      setErrorMsg('El archivo o texto proporcionado no parece ser un formato SVG válido (debe contener etiquetas <svg> y </svg>).');
      return;
    }
    onApplyCustomSvg(trimmed);
    setSuccessMsg(`¡Archivo ${filename || 'SVG'} cargado correctamente con 100% fidelidad!`);
    setTimeout(() => {
      setSuccessMsg(null);
      onClose();
    }, 1200);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      processSvgText(result, file.name);
    };
    reader.onerror = () => {
      setErrorMsg('Error al leer el archivo en el navegador.');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        processSvgText(result, file.name);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md select-none p-4 font-primary">
      <div className="bg-[#0f172a] border border-slate-700 w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0a0f1d]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                Sustituir / Importar SVG del Diagrama (SI_No1.svg)
              </h3>
              <p className="text-xs text-slate-400">
                Presentación 100% fiel al archivo vectorial oficial de ASHRAE
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Quick Preset: 100% Faithful Native Twin */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/30 flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>Modo Oficial ASHRAE SI No. 1 Integrado</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Activa la reproducción vectorial idéntica a <strong>SI_No1.svg</strong>:
                dominio normalizado (0 a 50 °C, 0 a 30 g/kg), títulos oficiales de ASHRAE (1992),
                logotipo hexagonal y pie de página de la Universidad de Idaho.
              </p>
            </div>
            <button
              onClick={() => {
                onApplySiNo1Theme();
                onClose();
              }}
              className="shrink-0 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Activar Modo SI No. 1</span>
            </button>
          </div>

          {/* Quick Preset: FlyCarpet (FlyCarpetPsyChart.svg) */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-teal-950/40 to-slate-900 border border-teal-500/30 flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-teal-400 font-semibold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Modo FlyCarpet (FlyCarpetPsyChart.svg)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Reproducción de alta fidelidad basada en <strong>FlyCarpetPsyChart</strong>:
                dominio completo (-10 a 50 °C, 0 a 30 g/kg), curvas de humedad en granate con etiquetas directas de porcentaje, líneas de entalpía verdes, isolíneas de volumen en cian y transportador ASHRAE con doble arco (SHR y ΔH/ΔW).
              </p>
            </div>
            {onApplyFlyCarpetTheme && (
              <button
                onClick={() => {
                  onApplyFlyCarpetTheme();
                  onClose();
                }}
                className="shrink-0 px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Activar FlyCarpet</span>
              </button>
            )}
          </div>

          {/* Upload Area */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              1. Cargar archivo local (ej. SI_No1.svg)
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                dragActive
                  ? 'border-cyan-400 bg-cyan-950/20'
                  : 'border-slate-700 hover:border-slate-500 bg-slate-900/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".svg"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Upload className="w-8 h-8 text-cyan-400 mx-auto mb-2 opacity-80" />
              <p className="text-xs font-medium text-slate-200">
                Haz clic o arrastra tu archivo <span className="text-cyan-400 font-mono">SI_No1.svg</span> aquí
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Acepta archivos .svg vectoriales estándar
              </p>
            </div>
          </div>

          {/* Paste Raw XML option */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              2. O pegar el código SVG directamente
            </label>
            <textarea
              value={pastedSvg}
              onChange={(e) => setPastedSvg(e.target.value)}
              placeholder="Pega aquí el contenido &lt;svg ...&gt; ... &lt;/svg&gt; de tu archivo si lo tienes abierto en un editor de texto..."
              rows={4}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs font-mono text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500 placeholder:text-slate-600 resize-none"
            />
            {pastedSvg.trim() && (
              <button
                onClick={() => processSvgText(pastedSvg, 'código pegado')}
                className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Aplicar código SVG pegado</span>
              </button>
            )}
          </div>

          {/* Status & Alerts */}
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-950/50 border border-red-800/60 text-red-300 text-xs">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Current Custom SVG state */}
          {customSvgRaw && (
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-cyan-400">
                <FileCode className="w-4 h-4" />
                <span>Hay un SVG personalizado cargado ({customSvgRaw.length.toLocaleString()} caracteres)</span>
              </div>
              <button
                onClick={() => {
                  onApplyCustomSvg(null);
                  setSuccessMsg('SVG personalizado eliminado. Volviendo a la carta nativa.');
                  setTimeout(() => setSuccessMsg(null), 1500);
                }}
                className="px-2.5 py-1 rounded bg-red-950/60 hover:bg-red-900 text-red-400 hover:text-white border border-red-800 transition-colors flex items-center gap-1"
                title="Eliminar SVG personalizado"
              >
                <Trash2 className="w-3 h-3" />
                <span>Quitar</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-[#0a0f1d] flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Fidelidad 100% garantizada manteniendo las herramientas de cálculo y capas interactivas.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
