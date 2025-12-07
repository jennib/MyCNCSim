import { useMachineStore } from "../store";
import { useRef, useState } from 'react';
import { exportSTL, saveString } from '../utils/stlExporter';
import { VisualSettingsPanel } from './VisualSettingsPanel';
// We need access to the CURRENT geometry to export it. 
// The geometry lives in MaterialCore state. 
// Standard React pattern: Lift state up OR use a Signal/Context.
// For this quick implementation: We can't easily grab the geometry ONLY from the UI button without logic changes.
// ALTERNATIVE: Add an 'exportRequested' flag to store? 
// MaterialCore watches it, exports, and clears flag.

export function UIOverlay() {
    const {
        coords, setCoords,
        isSpindleOn, setSpindle,
        isAlarm, triggerAlarm,
        toolDiameter, setToolDiameter,
        toolType, setToolType,
        loadGCode, popNextCommand,
        resetSimulation, rewindJob, clearJob
    } = useMachineStore();

    const [showSettings, setShowSettings] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            const content = ev.target?.result as string;
            if (content) {
                loadGCode(content);
                popNextCommand(); // Start immediately
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleExport = () => {
        // Trigger export via event?
        // Since MaterialCore has the geometry, let's dispatch a custom event.
        window.dispatchEvent(new CustomEvent('EXPORT_STL'));
    };

    return (
        <>
            {showSettings && <VisualSettingsPanel onClose={() => setShowSettings(false)} />}
            <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-4">
                {/* Readout Panel */}
                <div className={`backdrop-blur-md p-4 rounded-lg border font-mono w-64 shadow-2xl transition-all duration-300 ${isAlarm ? 'bg-red-900/90 border-red-500 animate-pulse' : 'bg-cnc-panel/80 border-white/10 text-cnc-text'}`}>
                    <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-2">
                        <span className="text-sm font-bold opacity-70">{isAlarm ? '!!! E-STOP !!!' : 'DRO (mm)'}</span>
                        <span className={`w-2 h-2 rounded-full ${isSpindleOn ? 'bg-red-500 animate-pulse' : 'bg-gray-600'}`} />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xl">
                        <span className="text-red-400">X:</span> <span>{coords.x.toFixed(3)}</span>
                        <span className="text-green-400">Y:</span> <span>{coords.y.toFixed(3)}</span>
                        <span className="text-blue-400">Z:</span> <span>{coords.z.toFixed(3)}</span>
                    </div>

                    {isAlarm && (
                        <button
                            onClick={() => triggerAlarm(false)}
                            className="mt-2 w-full bg-red-600 font-bold p-1 rounded hover:bg-red-500 animate-none"
                        >
                            RESET ALARM
                        </button>
                    )}
                </div>

                {/* Reset & Status */}
                <div className="flex gap-2 w-64">
                    <button
                        onClick={resetSimulation}
                        className="flex-1 bg-white/10 text-cnc-text text-xs p-2 rounded hover:bg-white/20 border border-white/10"
                    >
                        RESET ALL
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex-1 bg-emerald-600 text-white text-xs p-2 rounded hover:bg-emerald-500 font-bold"
                    >
                        EXPORT STL
                    </button>
                </div>

                {/* Job Controls */}
                <div className="flex gap-2 w-64">
                    <button
                        onClick={rewindJob}
                        className="flex-1 bg-yellow-600/80 text-white text-xs p-2 rounded hover:bg-yellow-500 font-bold border border-yellow-700"
                        title="Restart current G-code job without resetting stock"
                    >
                        REWIND JOB
                    </button>
                    <button
                        onClick={clearJob}
                        className="flex-1 bg-gray-600/50 text-white text-xs p-2 rounded hover:bg-gray-500 border border-white/10"
                        title="Clear current G-code queue"
                    >
                        CLEAR JOB
                    </button>
                </div>

                {/* Tool & Controls Panel */}
                <div className="bg-cnc-panel/80 backdrop-blur-md p-4 rounded-lg border border-white/10 flex flex-col gap-3 w-64 text-cnc-text">

                    {/* Tool Library */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs uppercase opacity-50 font-bold">Tool Diam (mm)</label>
                        <div className="flex gap-2">
                            {[2, 5, 10].map(dia => (
                                <button
                                    key={dia}
                                    onClick={() => setToolDiameter(dia)}
                                    className={`flex-1 p-1 text-xs rounded border ${toolDiameter === dia ? 'bg-cnc-accent text-black border-cnc-accent' : 'bg-transparent border-white/20 hover:bg-white/10'}`}
                                >
                                    {dia}
                                </button>
                            ))}
                        </div>

                        <label className="text-xs uppercase opacity-50 font-bold mt-1">Tool Type</label>
                        <div className="flex gap-2">
                            {['FLAT', 'BALL', 'VBIT'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setToolType(type as any)}
                                    className={`flex-1 p-1 text-[10px] rounded border ${toolType === type ? 'bg-cnc-accent text-black border-cnc-accent' : 'bg-transparent border-white/20 hover:bg-white/10'}`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-px bg-white/10"></div>

                    <button
                        onClick={() => setSpindle(!isSpindleOn)}
                        className={`p-2 rounded font-bold transition-all ${isSpindleOn ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-500'}`}
                    >
                        {isSpindleOn ? 'STOP SPINDLE' : 'START SPINDLE'}
                    </button>

                    <div className="grid grid-cols-3 gap-1">
                        <button className="p-2 bg-white/10 rounded hover:bg-white/20" onClick={() => setCoords({ x: coords.x - 10 })}>-X</button>
                        <button className="p-2 bg-white/10 rounded hover:bg-white/20" onClick={() => setCoords({ y: coords.y + 10 })}>+Y</button>
                        <button className="p-2 bg-white/10 rounded hover:bg-white/20" onClick={() => setCoords({ x: coords.x + 10 })}>+X</button>

                        <button className="p-2 bg-white/10 rounded hover:bg-white/20" onClick={() => setCoords({ y: coords.y - 10 })}>-Y</button>
                        <div className="flex flex-col items-center justify-center gap-1">
                            <button className="w-full bg-white/10 rounded hover:bg-white/20 text-xs py-1" onClick={() => setCoords({ z: coords.z + 5 })}>Z+</button>
                            <button className="w-full bg-white/10 rounded hover:bg-white/20 text-xs py-1" onClick={() => setCoords({ z: coords.z - 5 })}>Z-</button>
                        </div>
                        <button className="p-2 bg-white/5 rounded text-xs opacity-50 cursor-not-allowed">JOG</button>
                    </div>

                </div>

                {/* Settings Toggle */}
                <button
                    onClick={() => setShowSettings(true)}
                    className="w-full bg-white/5 border border-white/10 p-1 rounded text-xs text-white/50 hover:text-white hover:bg-white/10"
                >
                    CONFIGURE MACHINE VISUALS
                </button>

                {/* G-Code Loader */}
                <div className="flex flex-col gap-2 mt-1">
                    <label className="cursor-pointer p-2 bg-white/10 rounded font-bold hover:bg-white/20 text-xs text-center border border-white/20 border-dashed">
                        UPLOAD G-CODE FILE
                        <input
                            type="file"
                            accept=".nc,.gcode,.txt"
                            className="hidden"
                            onChange={handleFileUpload}
                            ref={fileInputRef}
                        />
                    </label>
                </div>
            </div>
        </>
    );
}
