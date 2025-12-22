import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Environment, MeshDistortMaterial } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'

// Rotating Gear Component
function Gear({ position, scale = 1, speed = 0.5, color = '#e94560' }) {
  const meshRef = useRef()

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.z += delta * speed
    }
  })

  const teeth = 12
  const gearShape = useMemo(() => {
    const shape = new THREE.Shape()
    const outerRadius = 1
    const innerRadius = 0.7
    const toothHeight = 0.15

    for (let i = 0; i < teeth; i++) {
      const angle1 = (i / teeth) * Math.PI * 2
      const angle2 = ((i + 0.3) / teeth) * Math.PI * 2
      const angle3 = ((i + 0.5) / teeth) * Math.PI * 2
      const angle4 = ((i + 0.8) / teeth) * Math.PI * 2

      const r1 = outerRadius
      const r2 = outerRadius + toothHeight

      if (i === 0) {
        shape.moveTo(Math.cos(angle1) * r1, Math.sin(angle1) * r1)
      }

      shape.lineTo(Math.cos(angle2) * r2, Math.sin(angle2) * r2)
      shape.lineTo(Math.cos(angle3) * r2, Math.sin(angle3) * r2)
      shape.lineTo(Math.cos(angle4) * r1, Math.sin(angle4) * r1)
    }

    // Center hole
    const holePath = new THREE.Path()
    holePath.absarc(0, 0, innerRadius * 0.4, 0, Math.PI * 2, true)
    shape.holes.push(holePath)

    return shape
  }, [])

  const extrudeSettings = {
    steps: 1,
    depth: 0.2,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 2
  }

  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      <extrudeGeometry args={[gearShape, extrudeSettings]} />
      <meshStandardMaterial
        color={color}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  )
}

// Floating Bolt Component
function Bolt({ position, rotation = [0, 0, 0] }) {
  const groupRef = useRef()

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2
    }
  })

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <group ref={groupRef} position={position} rotation={rotation}>
        {/* Bolt head */}
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.1, 6]} />
          <meshStandardMaterial color="#cccccc" metalness={0.9} roughness={0.1} />
        </mesh>
        {/* Bolt shaft */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.5, 16]} />
          <meshStandardMaterial color="#999999" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
    </Float>
  )
}

// Pipe Section Component
function Pipe({ position, rotation = [0, 0, 0], length = 2 }) {
  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.3}>
      <mesh position={position} rotation={rotation}>
        <cylinderGeometry args={[0.2, 0.2, length, 32, 1, true]} />
        <meshStandardMaterial
          color="#0f3460"
          metalness={0.7}
          roughness={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
    </Float>
  )
}

// Industrial Particles - enhanced spread and visibility
function Particles({ count = 100 }) {
  const particlesRef = useRef()

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20
      pos[i * 3 + 1] = (Math.random() - 0.5) * 14
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12
    }
    return pos
  }, [count])

  useFrame((state, delta) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.025
    }
  })

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#d4af37"
        transparent
        opacity={0.7}
        sizeAttenuation
      />
    </points>
  )
}

// Glowing Orb (spark effect)
function GlowOrb({ position }) {
  return (
    <Float speed={3} rotationIntensity={0} floatIntensity={1}>
      <mesh position={position}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <MeshDistortMaterial
          color="#e94560"
          emissive="#e94560"
          emissiveIntensity={2}
          distort={0.3}
          speed={2}
        />
      </mesh>
    </Float>
  )
}

// Main Scene Content - Enhanced for prominence
function SceneContent() {
  const groupRef = useRef()

  useFrame((state) => {
    if (groupRef.current) {
      // Subtle rotation based on time
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.15
    }
  })

  return (
    <group ref={groupRef}>
      {/* Main gear cluster - LARGE and prominent on right side */}
      <Gear position={[2.5, 0, 0]} scale={2.2} speed={0.2} color="#e94560" />
      <Gear position={[4.2, 1.5, -1]} scale={1.4} speed={-0.25} color="#0f3460" />
      <Gear position={[1.5, -1.8, -0.5]} scale={1.1} speed={0.3} color="#16213e" />
      <Gear position={[5, -0.8, -2]} scale={0.9} speed={-0.35} color="#d4af37" />

      {/* Secondary gear cluster - background left */}
      <Gear position={[-4, 2, -4]} scale={1.5} speed={0.15} color="#1a1a2e" />
      <Gear position={[-3, -1.5, -3]} scale={1.0} speed={-0.2} color="#0f3460" />

      {/* Floating bolts - larger and more visible */}
      <Bolt position={[0, 2.5, 1]} />
      <Bolt position={[-2, 0, 2]} rotation={[0.5, 0, 0.3]} />
      <Bolt position={[4, -2, 1]} rotation={[0, 0.5, 0.2]} />
      <Bolt position={[-3, 2, -1]} rotation={[0.3, 0.2, 0]} />

      {/* Pipes - industrial backdrop */}
      <Pipe position={[5, 2, -3]} rotation={[0, 0, Math.PI / 4]} length={3} />
      <Pipe position={[-4, -2, -4]} rotation={[Math.PI / 6, 0, 0]} length={4} />
      <Pipe position={[6, -1, -2]} rotation={[0, Math.PI / 3, Math.PI / 6]} length={2.5} />

      {/* Glow orbs (sparks) - more and brighter */}
      <GlowOrb position={[1, 3, 0]} />
      <GlowOrb position={[-1, -2, 2]} />
      <GlowOrb position={[3, 0.5, 1]} />
      <GlowOrb position={[-2, 1, -1]} />
      <GlowOrb position={[5, 2, -1]} />

      {/* Particles - denser */}
      <Particles count={250} />

      {/* Enhanced lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} color="#ffffff" />
      <pointLight position={[3, 2, 2]} intensity={0.8} color="#e94560" />
      <pointLight position={[-3, -2, -2]} intensity={0.5} color="#d4af37" />
      <pointLight position={[0, 0, 4]} intensity={0.3} color="#ffffff" />
    </group>
  )
}

// Exported Canvas Component
function IndustrialScene({ className = '' }) {
  return (
    <div className={`w-full h-full ${className}`} role="img" aria-label="Interactive 3D industrial scene with rotating gears, floating bolts, and metallic particles">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 75 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={['#1a1a2e']} />
        <fog attach="fog" args={['#1a1a2e', 8, 20]} />

        <SceneContent />

        <Environment preset="city" />

        <EffectComposer>
          <Bloom
            luminanceThreshold={0.4}
            luminanceSmoothing={0.9}
            intensity={0.8}
          />
          <Vignette eskil={false} offset={0.1} darkness={0.4} />
        </EffectComposer>
      </Canvas>
    </div>
  )
}

export default IndustrialScene
