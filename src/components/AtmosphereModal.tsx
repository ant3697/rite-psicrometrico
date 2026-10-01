import React from 'react';
import { pressureFromAltitude, altitudeFromPressure, P_ATM_STANDARD } from '../utils/psychrolib';
import { X, Mountain } from 'lucide-react';

interface AtmosphereModalProps {
  isOpen: boolean;
  onClose: () => void;
  pressure: number;
  altitude: number;
  onChangeAtmosphere: (pressure: number, altitude: number) => void;
}

const CITY_PRESETS = [
  { name: 'Nivel del mar (Estándar ISO)', altitude: 0, desc: '101.325 kPa' },
  { name: 'Madrid (España)', altitude: 667, desc: '93.7 kPa' },
  { name: 'Santiago (Chile)', altitude: 570, desc: '94.8 kPa' },
  { name: 'Denver (EE. UU.)', altitude: 1609, desc: '83.4 kPa' },
  { name: 'Ciudad de México (México)', altitude: 2240, desc: '77.5 kPa' },
  { name: 'Bogotá (Colombia)', altitude: 2640, desc: '73.9 kPa' },
  { name: 'La Paz (Bolivia)', altitude: 3640, desc: '65.2 kPa' },
];

export const AtmosphereModal: React.FC<AtmosphereModalProps> = ({
  isOpen,
  onClose,
  pressure,
  altitude,
  onChangeAtmosphere,
}) => {
  if (!isOpen) return null;

  const handleAltitudeChange = (alt: number) => {
    const safeAlt = Math.max(0, Math.min(5000, alt));
    const p = pressureFromAltitude(safeAlt);
    onChangeAtmosphere(p, safeAlt);
  };

  const handlePressureChange = (p: number) => {
    const safeP = Math.max(50, Math.min(105, p));
    const alt = altitudeFromPressure(safeP);
    onChangeAtmosphere(safeP, Math.round(alt));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md select-none p-4 font-primary">
      <div className="panel-glass w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.1)] bg-[#0a0a0c]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[6px] bg-[#fbbf24]/15 border border-[#fbbf24]/30 flex items-center justify-center text-[#fbbf24]">
              <Mountain className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white tracking-wide">
              Presión Barométrica y Altitud
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-xs text-[#cbd5e1] leading-relaxed">
            La presión atmosférica influye decisivamente en las propiedades psicrométricas: a mayor altitud, menor presión de saturación, menor densidad y mayor contenido de humedad específica W para una misma temperatura.
          </p>

          {/* Altitude Slider & Number */}
          <div className="space-y-2 bg-[#0a0a0c]/70 p-4 rounded-[8px] border border-[rgba(255,255,255,0.1)]">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#cbd5e1] font-semibold">Altitud sobre el nivel del mar:</span>
              <span className="font-mono text-[#fbbf24] font-bold text-base">
                {altitude} m
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="4000"
              step="50"
              value={altitude}
              onChange={(e) => handleAltitudeChange(parseFloat(e.target.value))}
              className="w-full accent-[#fbbf24] cursor-pointer h-2 bg-[rgba(255,255,255,0.15)] rounded-lg"
            />
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>0 m</span>
              <span>1000 m</span>
              <span>2000 m</span>
              <span>3000 m</span>
              <span>4000 m</span>
            </div>
          </div>

          {/* Pressure Slider & Number */}
          <div className="space-y-2 bg-[#0a0a0c]/70 p-4 rounded-[8px] border border-[rgba(255,255,255,0.1)]">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#cbd5e1] font-semibold">Presión Atmosférica Barométrica:</span>
              <span className="font-mono text-[#a3e635] font-bold text-base">
                {pressure.toFixed(2)} kPa
              </span>
            </div>
            <input
              type="range"
              min="60"
              max="101.325"
              step="0.2"
              value={pressure}
              onChange={(e) => handlePressureChange(parseFloat(e.target.value))}
              className="w-full accent-[#a3e635] cursor-pointer h-2 bg-[rgba(255,255,255,0.15)] rounded-lg"
            />
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>60 kPa</span>
              <span>75 kPa</span>
              <span>90 kPa</span>
              <span>101.325 kPa</span>
            </div>
          </div>

          {/* City Presets */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#cbd5e1] uppercase tracking-wider">
              Ubicaciones de Referencia
            </span>
            <div className="grid grid-cols-2 gap-2">
              {CITY_PRESETS.map((city) => (
                <button
                  key={city.name}
                  onClick={() => handleAltitudeChange(city.altitude)}
                  className={`p-2.5 rounded-[6px] text-left border transition-all text-xs ${
                    Math.abs(altitude - city.altitude) < 30
                      ? 'bg-[#fbbf24]/15 border-[#fbbf24] text-white shadow-[0_0_8px_rgba(251,191,36,0.2)]'
                      : 'bg-[#0a0a0c]/60 border-[rgba(255,255,255,0.1)] text-[#cbd5e1] hover:bg-[rgba(255,255,255,0.06)]'
                  }`}
                >
                  <div className="font-semibold truncate">{city.name}</div>
                  <div className="text-[11px] text-[#cbd5e1] font-mono mt-0.5">
                    {city.altitude} m ({city.desc})
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-[#0a0a0c]/80 border-t border-[rgba(255,255,255,0.1)] flex justify-end">
          <button
            onClick={onClose}
            className="btn-primary"
          >
            Aplicar y Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
