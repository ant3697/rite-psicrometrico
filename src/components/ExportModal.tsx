import React, { useState } from 'react';
import { StatePoint, ProcessConnection, UnitSystem } from '../types/psychrometrics';
import { UnitConvert } from '../utils/psychrolib';
import { X, FileText, Download, FileSpreadsheet, Image as ImageIcon, Printer } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  points: StatePoint[];
  processes: ProcessConnection[];
  pressure: number;
  altitude: number;
  units: UnitSystem;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  points,
  processes,
  pressure,
  altitude,
  units,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Punto',
      'Tbs [C]',
      'HR [%]',
      'Tbh [C]',
      'Tpr [C]',
      'W [g/kg]',
      'h [kJ/kg]',
      'v [m3/kg]',
      'rho [kg/m3]',
      'Caudal [m3/h]',
      'Flujo [kg/s]',
    ];

    const rows = points.map((p) => [
      `"${p.name}"`,
      p.tdb.toFixed(2),
      p.rh.toFixed(2),
      p.twb.toFixed(2),
      p.tdp.toFixed(2),
      (p.w * 1000).toFixed(3),
      p.h.toFixed(2),
      p.v.toFixed(4),
      p.rho.toFixed(4),
      p.volumeFlow.toFixed(0),
      p.massFlow.toFixed(3),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `psychrometric_data_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export SVG directly from DOM
  const handleExportSVG = () => {
    const svgElement = document.querySelector('svg.cursor-crosshair');
    if (!svgElement) return;

    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgElement);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `psychrometric_chart_${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Print Report
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md select-none p-4 font-primary">
      <div className="panel-glass w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.1)] bg-[#0a0a0c]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[6px] bg-[#fbbf24]/15 border border-[#fbbf24]/30 flex items-center justify-center text-[#fbbf24]">
              <Download className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white tracking-wide">
              Exportar Datos y Diagrama
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="flex items-center justify-between p-4 rounded-[8px] bg-[#0a0a0c]/80 border border-[rgba(255,255,255,0.1)] hover:border-[#fbbf24] transition-all text-left group hover:shadow-[0_0_10px_rgba(251,191,36,0.15)]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[6px] bg-[#65a30d]/20 text-[#a3e635] flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white group-hover:text-[#fbbf24] transition-colors">
                    Hoja de Cálculo CSV
                  </h4>
                  <p className="text-xs text-[#cbd5e1] font-secondary">
                    Exporta la tabla completa de puntos termodinámicos compatible con Excel
                  </p>
                </div>
              </div>
              <Download className="w-4 h-4 text-[#94a3b8] group-hover:text-[#fbbf24]" />
            </button>

            {/* Export SVG */}
            <button
              onClick={handleExportSVG}
              className="flex items-center justify-between p-4 rounded-[8px] bg-[#0a0a0c]/80 border border-[rgba(255,255,255,0.1)] hover:border-[#fbbf24] transition-all text-left group hover:shadow-[0_0_10px_rgba(251,191,36,0.15)]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[6px] bg-[#3b82f6]/20 text-[#93c5fd] flex items-center justify-center">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white group-hover:text-[#fbbf24] transition-colors">
                    Gráfico Vectorial SVG
                  </h4>
                  <p className="text-xs text-[#cbd5e1] font-secondary">
                    Exporta el diagrama psicrométrico vectorial de alta resolución
                  </p>
                </div>
              </div>
              <Download className="w-4 h-4 text-[#94a3b8] group-hover:text-[#fbbf24]" />
            </button>

            {/* Print Engineering Report */}
            <button
              onClick={handlePrint}
              className="flex items-center justify-between p-4 rounded-[8px] bg-[#0a0a0c]/80 border border-[rgba(255,255,255,0.1)] hover:border-[#fbbf24] transition-all text-left group hover:shadow-[0_0_10px_rgba(251,191,36,0.15)]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[6px] bg-[#fbbf24]/15 text-[#fbbf24] flex items-center justify-center">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white group-hover:text-[#fbbf24] transition-colors">
                    Imprimir Informe de Ingeniería / PDF
                  </h4>
                  <p className="text-xs text-[#cbd5e1] font-secondary">
                    Genera una vista de impresión limpia con diagrama, tablas y balance térmico
                  </p>
                </div>
              </div>
              <Download className="w-4 h-4 text-[#94a3b8] group-hover:text-[#fbbf24]" />
            </button>
          </div>
        </div>

        <div className="px-6 py-4 bg-[#0a0a0c]/80 border-t border-[rgba(255,255,255,0.1)] flex justify-end">
          <button
            onClick={onClose}
            className="btn-secondary text-xs"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
