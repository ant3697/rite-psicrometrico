import React from 'react';
import { PRESET_CYCLES } from '../utils/processEngine';
import { PresetCycle } from '../types/psychrometrics';
import { X, Layers, CheckCircle2, ArrowRight } from 'lucide-react';

interface PresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: PresetCycle) => void;
}

export const PresetsModal: React.FC<PresetsModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md select-none p-4 font-primary">
      <div className="panel-glass w-full max-w-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.1)] bg-[#0a0a0c]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[6px] bg-[#fbbf24]/15 border border-[#fbbf24]/30 flex items-center justify-center text-[#fbbf24]">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white tracking-wide">
              Plantillas y Ciclos HVAC Predefinidos
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <p className="text-xs text-[#cbd5e1]">
            Selecciona un ciclo completo para cargar sus puntos de estado psicrométricos y todas las transformaciones energéticas en el diagrama:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {PRESET_CYCLES.map((cycle) => (
              <div
                key={cycle.id}
                onClick={() => {
                  onSelectPreset(cycle);
                  onClose();
                }}
                className="group p-4 bg-[#0a0a0c]/80 border border-[rgba(255,255,255,0.1)] hover:border-[#fbbf24] rounded-[8px] cursor-pointer transition-all hover:shadow-[0_0_10px_rgba(251,191,36,0.15)] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#cbd5e1] font-mono">
                      {cycle.category}
                    </span>
                    <span className="text-[11px] text-[#fbbf24] font-mono font-semibold">
                      {cycle.points.length} puntos
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-1 group-hover:text-[#fbbf24] transition-colors">
                    {cycle.name}
                  </h4>
                  <p className="text-xs text-[#cbd5e1] mt-1.5 line-clamp-3 leading-relaxed">
                    {cycle.description}
                  </p>
                </div>

                <div className="mt-4 pt-2 border-t border-[rgba(255,255,255,0.08)] flex items-center justify-between text-[11px] text-[#fbbf24] font-semibold">
                  <span>Cargar ciclo</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
