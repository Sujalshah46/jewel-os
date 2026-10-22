import React, { useState } from 'react';
import {
  Scale,
  X,
  CheckCircle,
  RefreshCw,
  Usb,
  Cpu,
  Sliders,
  AlertCircle
} from 'lucide-react';
import { useWeighingScale } from '../../utils/weighingScale';

export default function WeighingScaleModal({
  isOpen,
  onClose,
  onCaptureWeight,
  initialWeight = 0,
  title = 'Electronic Precision Scale Interface'
}) {
  const {
    isSupported,
    isConnected,
    isSimulated,
    currentWeight,
    isStable,
    error,
    connectPhysicalScale,
    connectSimulatedScale,
    setManualSimulatedWeight,
    disconnectScale
  } = useWeighingScale();

  const [simWeightInput, setSimWeightInput] = useState(initialWeight || 8.450);

  if (!isOpen) return null;

  const handleCapture = () => {
    const finalWeight = isConnected ? currentWeight : Number(simWeightInput);
    onCaptureWeight(Number(finalWeight.toFixed(3)));
    onClose();
  };

  const handleSimulatedSlider = (val) => {
    const w = parseFloat(val);
    setSimWeightInput(w);
    setManualSimulatedWeight(w);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Scale className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-serif font-bold text-slate-100 uppercase tracking-wider">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-slate-950 border border-slate-800">
          <div className="flex items-center space-x-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isConnected
                  ? isStable ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  : 'bg-slate-600'
              }`}
            />
            <span className="font-medium text-slate-300">
              {isConnected
                ? isSimulated ? 'Simulated Digital Scale Active' : 'USB Serial Scale Connected'
                : 'Scale Disconnected'}
            </span>
          </div>

          <span
            className={`font-mono text-[10px] px-2 py-0.5 rounded uppercase font-bold ${
              isStable
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}
          >
            {isStable ? 'STABLE' : 'UNSTABLE'}
          </span>
        </div>

        {error && (
          <div className="flex items-center space-x-2 bg-rose-500/10 border border-rose-500/30 text-rose-300 px-3 py-2 rounded-xl text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Precision Digital LCD Display */}
        <div className="bg-[#0a0f0d] border-2 border-slate-800 rounded-2xl p-5 text-center shadow-inner relative overflow-hidden">
          <div className="absolute top-2 left-3 text-[9px] font-mono text-emerald-500/60 uppercase tracking-widest">
            RS-232 / PRECISION 0.001g
          </div>
          <div className="absolute top-2 right-3 text-[9px] font-mono text-emerald-400 uppercase font-bold">
            {isConnected ? (isSimulated ? 'SIM' : 'LIVE') : 'OFFLINE'}
          </div>

          <div className="py-2">
            <span className="font-mono text-5xl font-black text-emerald-400 tracking-wider drop-shadow-[0_0_12px_rgba(52,211,153,0.3)]">
              {(isConnected ? currentWeight : Number(simWeightInput) || 0).toFixed(3)}
            </span>
            <span className="text-xl font-bold text-emerald-500 ml-2 font-mono">g</span>
          </div>

          <p className="text-[11px] text-slate-400">
            Compatible with Essae DS-215, CAS MW, Phoenix, Gold Star & Contech
          </p>
        </div>

        {/* Connection / Simulation Controls */}
        <div className="space-y-3 pt-1">
          {!isConnected ? (
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => connectPhysicalScale(9600)}
                className="flex items-center justify-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold py-2.5 px-3 rounded-xl text-xs transition cursor-pointer"
              >
                <Usb className="w-4 h-4 text-amber-400" />
                <span>Connect USB Scale</span>
              </button>

              <button
                type="button"
                onClick={() => connectSimulatedScale(initialWeight || 8.450)}
                className="flex items-center justify-center space-x-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold py-2.5 px-3 rounded-xl text-xs transition cursor-pointer"
              >
                <Cpu className="w-4 h-4 text-amber-400" />
                <span>Simulate Scale</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {isSimulated && (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span className="flex items-center space-x-1">
                      <Sliders className="w-3.5 h-3.5 text-amber-400" />
                      <span>Adjust Test Weight:</span>
                    </span>
                    <strong className="text-amber-400 font-mono font-bold">{simWeightInput.toFixed(3)}g</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="0.005"
                    value={simWeightInput}
                    onChange={(e) => handleSimulatedSlider(e.target.value)}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex gap-2">
                    {[5.250, 8.450, 15.620, 24.800, 48.000].map(w => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => handleSimulatedSlider(w)}
                        className="flex-1 py-1 text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 font-mono"
                      >
                        {w}g
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={disconnectScale}
                  className="text-xs text-slate-400 hover:text-rose-400 transition cursor-pointer"
                >
                  Disconnect Scale
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (isSimulated) handleSimulatedSlider(0);
                    else setManualSimulatedWeight(0);
                  }}
                  className="text-xs text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
                >
                  Zero / Tare
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Capture Action */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleCapture}
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 text-slate-950 font-bold py-3 px-4 rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition cursor-pointer"
          >
            <CheckCircle className="w-4 h-4" />
            <span>
              CAPTURE WEIGHT ({((isConnected ? currentWeight : Number(simWeightInput)) || 0).toFixed(3)}g)
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
