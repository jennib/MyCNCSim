import { useMachineStore } from "../store";
import { generateMachineParts } from "../utils/machineGenerator";
import { exportSTL } from "../utils/stlExporter";
import { useState } from "react";

export function VisualSettingsPanel({ onClose }: { onClose: () => void }) {
    const { machineAssets, setMachineAsset } = useMachineStore();
    const [isGenerating, setIsGenerating] = useState(false);

    const handleUpload = (part: keyof typeof machineAssets, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setMachineAsset(part, url);
        }
    };

    const clearAsset = (part: keyof typeof machineAssets) => {
        setMachineAsset(part, null);
    };

    const handleGenerate = () => {
        setIsGenerating(true);
        // Timeout to allow UI to update
        setTimeout(() => {
            try {
                const parts = generateMachineParts();

                // Process each part
                Object.entries(parts).forEach(([key, geo]) => {
                    const stlString = exportSTL(geo);
                    const blob = new Blob([stlString], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    setMachineAsset(key as any, url);
                });
            } catch (e) {
                console.error("Generation failed", e);
            }
            setIsGenerating(false);
        }, 100);
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-cnc-panel border border-white/20 p-6 rounded-lg shadow-2xl w-96 text-cnc-text">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-mono font-bold text-cnc-accent">VISUAL SETTINGS</h2>
                    <button onClick={onClose} className="text-white/50 hover:text-white">✕</button>
                </div>

                <div className="space-y-4">
                    <div className="bg-emerald-900/30 p-2 rounded border border-emerald-500/30 mb-4">
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded shadow-lg transition-all"
                        >
                            {isGenerating ? 'GENERATING...' : '✨ GENERATE & INSTALL PROCEDURAL MACHINE'}
                        </button>
                        <p className="text-[10px] text-emerald-200/50 text-center mt-1">
                            Creates high-detail T-Slot bed, Gantries, and Motors instantly.
                        </p>
                    </div>

                    <p className="text-xs text-white/60 mb-4">
                        Or upload custom STL files individually:
                    </p>

                    {[
                        { id: 'base', label: 'Base / Table' },
                        { id: 'yAxis', label: 'Y-Axis (Gantry)' },
                        { id: 'xAxis', label: 'X-Axis (Carriage)' },
                        { id: 'zAxis', label: 'Z-Axis (Spindle)' }
                    ].map((item) => {
                        const key = item.id as keyof typeof machineAssets;
                        const hasAsset = !!machineAssets[key];

                        return (
                            <div key={key} className="flex flex-col gap-1">
                                <span className="text-xs font-bold uppercase opacity-80">{item.label}</span>
                                <div className="flex gap-2">
                                    <label className={`flex-1 p-2 rounded border cursor-pointer text-xs font-mono text-center transition-all ${hasAsset ? 'bg-emerald-900/50 border-emerald-500 text-emerald-300' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                                        {hasAsset ? 'CUSTOM MODEL LOADED' : 'UPLOAD .STL'}
                                        <input
                                            type="file"
                                            accept=".stl"
                                            className="hidden"
                                            onChange={(e) => handleUpload(key, e)}
                                        />
                                    </label>
                                    {hasAsset && (
                                        <button
                                            onClick={() => clearAsset(key)}
                                            className="p-2 bg-red-900/50 border border-red-500/50 text-red-400 rounded hover:bg-red-900/80"
                                            title="Reset to default"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
