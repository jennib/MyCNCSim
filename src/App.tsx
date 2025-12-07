import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import { EffectComposer, Bloom, SSAO } from '@react-three/postprocessing'
import { useMachineStore } from './store'
import { Machine } from './components/Machine'
import { MaterialCore } from './components/MaterialCore'
import { UIOverlay } from './components/UIOverlay'

import { Interpolator } from './components/Interpolator'
import { ChipSystem } from './components/ChipSystem'
import { SoundSystem } from './components/SoundSystem'

import { Physics } from '@react-three/rapier'
import { CollisionSystem } from './components/CollisionSystem'

function Scene() {
  const resetCount = useMachineStore(state => state.resetCount);

  return (
    <>
      <Physics gravity={[0, 0, 0]}> {/* No gravity for machine logic context */}
        <SoundSystem />
        <Interpolator />
        <ChipSystem />
        <CollisionSystem />
      </Physics>
      <OrbitControls makeDefault />

      {/* Lighting environment - High Realism Studio similar */}
      <Environment preset="city" />
      <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
      <ambientLight intensity={0.5} />

      {/* Floor with shadows */}
      <ContactShadows resolution={1024} scale={50} blur={2} opacity={0.5} far={10} color="#000000" />

      {/* The Machine Simulator */}
      <Machine />

      {/* The Workpiece (Material Removal Core) 
          Keyed by resetCount to force remount on reset
      */}
      <MaterialCore key={resetCount} initialSize={[0.5, 0.1, 0.5]} />

      {/* Post Processing for Hyper Realism */}
      <EffectComposer>
        <SSAO radius={0.1} intensity={20} luminanceInfluence={0.6} color="black" />
        <Bloom luminanceThreshold={0.5} luminanceSmoothing={0.025} intensity={0.5} />
      </EffectComposer>
    </>
  )
}

function App() {
  return (
    <div className="w-full h-screen bg-cnc-dark relative">
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <h1 className="text-4xl font-mono font-bold text-cnc-text opacity-50">HYPER-CNC</h1>
        <p className="text-cnc-accent font-mono text-sm">Status: READY</p>
      </div>

      <UIOverlay />

      <Canvas shadows camera={{ position: [1.5, 1.5, 1.5], fov: 45 }}>
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  )
}

export default App
