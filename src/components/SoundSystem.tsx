import { useEffect, useRef } from 'react'
import { useMachineStore } from '../store'

export function SoundSystem() {
    const { isSpindleOn, spindleSpeed, isMoving, coords, isCutting } = useMachineStore();
    const audioContextRef = useRef<AudioContext | null>(null);

    // Nodes
    const spindleOscRef = useRef<OscillatorNode | null>(null);
    const spindleGainRef = useRef<GainNode | null>(null);
    const noiseGainRef = useRef<GainNode | null>(null);

    // Initialize Audio Engine
    useEffect(() => {
        // AudioContext must be created after user interaction usually, 
        // but in this constrained env we handle it carefully.
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContext();
        audioContextRef.current = ctx;

        // 1. Spindle Motor Sound (Sawtooth for industrial whine)
        // We use a Lowpass filter to dampen the harshness
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = 0; // Start silent

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 2000;

        const gain = ctx.createGain();
        gain.gain.value = 0;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        spindleOscRef.current = osc;
        spindleGainRef.current = gain;

        // 2. Cutting Noise (White Noise Buffer)
        const bufferSize = ctx.sampleRate * 2; // 2 seconds
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = 1000; // Grinding sound frequency

        const noiseGain = ctx.createGain();
        noiseGain.gain.value = 0;

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);

        noise.start();
        noiseGainRef.current = noiseGain;

        return () => {
            ctx.close();
        }
    }, []);

    // Update Sounds based on Machine State
    useEffect(() => {
        if (!audioContextRef.current) return;
        const ctx = audioContextRef.current;

        // Resume if suspended (browser policy)
        if (ctx.state === 'suspended' && isSpindleOn) {
            ctx.resume();
        }

        // Spindle Logic
        if (isSpindleOn && spindleOscRef.current && spindleGainRef.current) {
            // RPM to Hz mapping. CNC spindles usually 10k-24k RPM.
            // Let's map 0-1 (normalized speed) or raw RPM? 
            // Logic store has `spindleSpeed` usually S1000 etc.
            // S1000 is low. S10000 is high.
            // Let's assume input S=RPM.
            // Motor frequency is roughly linear to RPM.
            // Base pitch + variable pitch
            const targetFreq = (spindleSpeed || 1000) / 60 * 4; // Hz scaling heuristic

            spindleOscRef.current.frequency.setTargetAtTime(targetFreq, ctx.currentTime, 0.5);
            spindleGainRef.current.gain.setTargetAtTime(0.1, ctx.currentTime, 0.1);
        } else if (spindleGainRef.current) {
            spindleGainRef.current.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
        }

        // Cutting Logic
        // Use the explicit isCutting flag from MaterialCore (which knows when CSG happened)
        // + fallback to simple Z check for immediate feedback if CSG is slow? 
        // Strict isCutting is better for "load" simulation.
        if (noiseGainRef.current) {
            const targetVol = (isCutting && isSpindleOn) ? 0.3 : 0;
            noiseGainRef.current.gain.setTargetAtTime(targetVol, ctx.currentTime, 0.05);
        }

    }, [isSpindleOn, spindleSpeed, isMoving, coords.z, isCutting]);

    return null;
}
