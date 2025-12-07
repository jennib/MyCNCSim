import { create } from 'zustand'
import { parseGCode, type GCodeCommand } from './utils/gcodeParser'

export interface MachineState {
    coords: { x: number; y: number; z: number }
    targetCoords: { x: number; y: number; z: number }
    workCoords: { x: number; y: number; z: number }

    spindleSpeed: number
    feedRate: number
    isSpindleOn: boolean

    // Tool State
    toolDiameter: number // in mm
    toolType: 'FLAT' | 'BALL' | 'VBIT'

    // Custom Assets
    machineAssets: {
        base: string | null
        yAxis: string | null
        xAxis: string | null
        zAxis: string | null
    }

    // Simulation State
    resetCount: number

    // G-Code Execution
    gcodeQueue: GCodeCommand[]
    originalGCode: string
    isRunning: boolean
    isMoving: boolean
    isAlarm: boolean
    isCutting: boolean

    // Actions
    setCoords: (axis: Partial<{ x: number; y: number; z: number }>) => void
    setTargetCoords: (axis: Partial<{ x: number; y: number; z: number }>) => void
    setSpindle: (on: boolean, speed?: number) => void
    setToolDiameter: (diameter: number) => void
    setToolType: (type: 'FLAT' | 'BALL' | 'VBIT') => void

    setMachineAsset: (part: 'base' | 'yAxis' | 'xAxis' | 'zAxis', url: string | null) => void

    loadGCode: (gcode: string) => void
    rewindJob: () => void
    clearJob: () => void
    popNextCommand: () => GCodeCommand | null
    setIsMoving: (moving: boolean) => void
    setIsCutting: (cutting: boolean) => void
    triggerAlarm: (alarm: boolean) => void
    resetSimulation: () => void
}

export const useMachineStore = create<MachineState>((set, get) => ({
    coords: { x: 0, y: 0, z: 0 },
    targetCoords: { x: 0, y: 0, z: 0 },
    workCoords: { x: 0, y: 0, z: 0 },
    spindleSpeed: 0,
    feedRate: 1000,
    isSpindleOn: false,

    toolDiameter: 5, // Default 5mm
    toolType: 'FLAT',

    machineAssets: {
        base: null,
        yAxis: null,
        xAxis: null,
        zAxis: null
    },

    resetCount: 0,

    gcodeQueue: [],
    originalGCode: '',
    isRunning: false,
    isMoving: false,
    isCutting: false,
    isAlarm: false,

    setCoords: (axis) => set((state) => ({ coords: { ...state.coords, ...axis } })),
    setTargetCoords: (axis) => set((state) => ({ targetCoords: { ...state.targetCoords, ...axis } })),

    setSpindle: (on, speed) => set((state) => ({
        isSpindleOn: on,
        spindleSpeed: speed !== undefined ? speed : state.spindleSpeed
    })),

    setToolDiameter: (diameter) => set({ toolDiameter: diameter }),
    setToolType: (type) => set({ toolType: type }),

    setMachineAsset: (part, url) => set((state) => ({
        machineAssets: { ...state.machineAssets, [part]: url }
    })),

    loadGCode: (gcode) => {
        const commands = parseGCode(gcode);
        set({ gcodeQueue: commands, isRunning: false, isAlarm: false, originalGCode: gcode });
    },

    rewindJob: () => {
        const { originalGCode } = get();
        if (originalGCode) {
            const commands = parseGCode(originalGCode);
            set({ gcodeQueue: commands, isRunning: false, isAlarm: false });
        }
    },

    clearJob: () => set({ gcodeQueue: [], isRunning: false, isAlarm: false, originalGCode: '' }),

    popNextCommand: () => {
        const { gcodeQueue, isAlarm } = get();
        if (isAlarm) return null;

        if (gcodeQueue.length === 0) {
            set({ isRunning: false });
            return null;
        }
        const [cmd, ...rest] = gcodeQueue;
        set({ gcodeQueue: rest, isRunning: true });
        return cmd;
    },

    setIsMoving: (moving) => set({ isMoving: moving }),
    setIsCutting: (cutting) => set({ isCutting: cutting }),
    triggerAlarm: (alarm) => set({ isAlarm: alarm, isRunning: false, isMoving: false, isSpindleOn: false }),

    resetSimulation: () => set((state) => ({
        coords: { x: 0, y: 0, z: 0 },
        targetCoords: { x: 0, y: 0, z: 0 },
        isAlarm: false,
        isRunning: false,
        isMoving: false,
        isSpindleOn: false,
        gcodeQueue: [],
        originalGCode: '',
        resetCount: state.resetCount + 1
    }))
}))
