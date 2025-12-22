import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'

// ============================================
// BOLT & NUT MODEL - For Screw Nut Products
// ============================================
function BoltModel({ color = '#e94560' }) {
  const groupRef = useRef()

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.5
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1
    }
  })

  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
      <group ref={groupRef}>
        {/* Hexagonal bolt head */}
        <mesh position={[0, 0.4, 0]}>
          <cylinderGeometry args={[0.35, 0.35, 0.2, 6]} />
          <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.1} />
        </mesh>
        {/* Bolt shaft with threads */}
        <mesh position={[0, -0.1, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.8, 32]} />
          <meshStandardMaterial color="#666666" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Thread ridges */}
        {[...Array(8)].map((_, i) => (
          <mesh key={i} position={[0, -0.4 + i * 0.08, 0]}>
            <torusGeometry args={[0.16, 0.02, 8, 32]} />
            <meshStandardMaterial color="#555555" metalness={0.8} roughness={0.3} />
          </mesh>
        ))}
        {/* Nut at bottom */}
        <mesh position={[0, -0.55, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.15, 6]} />
          <meshStandardMaterial color={color} metalness={0.85} roughness={0.15} />
        </mesh>
      </group>
    </Float>
  )
}

// ============================================
// PAPER ROLL MODEL - For Tissue Paper Products
// ============================================
function PaperRollModel({ color = '#f5f5f5' }) {
  const groupRef = useRef()

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.3
    }
  })

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.4}>
      <group ref={groupRef} rotation={[Math.PI / 6, 0, 0]}>
        {/* Main roll */}
        <mesh>
          <cylinderGeometry args={[0.4, 0.4, 0.6, 32]} />
          <meshStandardMaterial color={color} roughness={0.9} />
        </mesh>
        {/* Inner tube */}
        <mesh>
          <cylinderGeometry args={[0.12, 0.12, 0.65, 32]} />
          <meshStandardMaterial color="#8b4513" roughness={0.7} />
        </mesh>
        {/* Unrolling paper effect */}
        <mesh position={[0.3, 0, 0.2]} rotation={[0, 0, Math.PI / 4]}>
          <planeGeometry args={[0.5, 0.55]} />
          <meshStandardMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.9} />
        </mesh>
      </group>
    </Float>
  )
}

// ============================================
// PIPE MODEL - For Steel Pipes
// ============================================
function PipeModel({ color = '#4a5568' }) {
  const groupRef = useRef()

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.4
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.2) * 0.1
    }
  })

  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
      <group ref={groupRef} rotation={[Math.PI / 4, 0, Math.PI / 6]}>
        {/* Main pipe */}
        <mesh>
          <cylinderGeometry args={[0.25, 0.25, 1.2, 32, 1, true]} />
          <meshStandardMaterial
            color={color}
            metalness={0.9}
            roughness={0.2}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Inner dark */}
        <mesh>
          <cylinderGeometry args={[0.2, 0.2, 1.25, 32]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.8} />
        </mesh>
        {/* Flange at end */}
        <mesh position={[0, 0.65, 0]}>
          <cylinderGeometry args={[0.35, 0.35, 0.08, 32]} />
          <meshStandardMaterial color="#0f3460" metalness={0.85} roughness={0.2} />
        </mesh>
      </group>
    </Float>
  )
}

// ============================================
// FITTING MODEL - For Pipe Fittings
// ============================================
function FittingModel({ color = '#0f3460' }) {
  const groupRef = useRef()

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.5
    }
  })

  return (
    <Float speed={2} rotationIntensity={0.4} floatIntensity={0.5}>
      <group ref={groupRef}>
        {/* T-fitting center */}
        <mesh>
          <sphereGeometry args={[0.25, 32, 32]} />
          <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Horizontal pipe */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.15, 0.15, 0.8, 32]} />
          <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Vertical pipe */}
        <mesh position={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.5, 32]} />
          <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Flanges */}
        {[-0.45, 0.45].map((x, i) => (
          <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.22, 0.22, 0.05, 32]} />
            <meshStandardMaterial color="#e94560" metalness={0.85} roughness={0.15} />
          </mesh>
        ))}
        <mesh position={[0, 0.62, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.05, 32]} />
          <meshStandardMaterial color="#e94560" metalness={0.85} roughness={0.15} />
        </mesh>
      </group>
    </Float>
  )
}

// ============================================
// WRENCH MODEL - For Hand & Power Tools
// ============================================
function WrenchModel({ color = '#d4af37' }) {
  const groupRef = useRef()

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.4
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.15
    }
  })

  const wrenchShape = useMemo(() => {
    const shape = new THREE.Shape()
    // Wrench head
    shape.moveTo(-0.15, 0.5)
    shape.lineTo(-0.25, 0.6)
    shape.lineTo(-0.2, 0.75)
    shape.lineTo(0.2, 0.75)
    shape.lineTo(0.25, 0.6)
    shape.lineTo(0.15, 0.5)
    // Handle
    shape.lineTo(0.08, 0.4)
    shape.lineTo(0.08, -0.6)
    shape.lineTo(0.15, -0.65)
    shape.lineTo(0.15, -0.8)
    shape.lineTo(-0.15, -0.8)
    shape.lineTo(-0.15, -0.65)
    shape.lineTo(-0.08, -0.6)
    shape.lineTo(-0.08, 0.4)
    shape.closePath()
    return shape
  }, [])

  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
      <group ref={groupRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <extrudeGeometry args={[wrenchShape, { depth: 0.08, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02 }]} />
          <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
        </mesh>
      </group>
    </Float>
  )
}

// ============================================
// LIGHTNING MODEL - For Electrical Supplies
// ============================================
function LightningModel({ color = '#e94560' }) {
  const groupRef = useRef()
  const glowRef = useRef()

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3
    }
    if (glowRef.current) {
      glowRef.current.material.emissiveIntensity = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.5
    }
  })

  const boltShape = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(0, 0.7)
    shape.lineTo(0.25, 0.7)
    shape.lineTo(0.1, 0.15)
    shape.lineTo(0.35, 0.15)
    shape.lineTo(-0.1, -0.7)
    shape.lineTo(0.05, -0.1)
    shape.lineTo(-0.2, -0.1)
    shape.closePath()
    return shape
  }, [])

  return (
    <Float speed={3} rotationIntensity={0.2} floatIntensity={0.6}>
      <group ref={groupRef}>
        <mesh ref={glowRef}>
          <extrudeGeometry args={[boltShape, { depth: 0.1, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02 }]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={1.5}
            metalness={0.3}
            roughness={0.4}
          />
        </mesh>
      </group>
    </Float>
  )
}

// ============================================
// GEAR MODEL - For Mechanical Engineering
// ============================================
function GearModel({ color = '#0f3460' }) {
  const meshRef = useRef()

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.z += delta * 0.5
    }
  })

  const teeth = 16
  const gearShape = useMemo(() => {
    const shape = new THREE.Shape()
    const outerRadius = 0.5
    const toothHeight = 0.1

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
    holePath.absarc(0, 0, 0.15, 0, Math.PI * 2, true)
    shape.holes.push(holePath)

    return shape
  }, [])

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.4}>
      <mesh ref={meshRef}>
        <extrudeGeometry args={[gearShape, { depth: 0.15, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02 }]} />
        <meshStandardMaterial color={color} metalness={0.85} roughness={0.15} />
      </mesh>
    </Float>
  )
}

// ============================================
// HARDHAT MODEL - For PPE Products
// ============================================
function HardhatModel({ color = '#d4af37' }) {
  const groupRef = useRef()

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.4
    }
  })

  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
      <group ref={groupRef}>
        {/* Helmet dome */}
        <mesh position={[0, 0.1, 0]}>
          <sphereGeometry args={[0.45, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={color} roughness={0.3} />
        </mesh>
        {/* Brim */}
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.52, 0.48, 0.06, 32]} />
          <meshStandardMaterial color={color} roughness={0.3} />
        </mesh>
        {/* Inner suspension band */}
        <mesh position={[0, -0.05, 0]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.35, 0.02, 8, 32]} />
          <meshStandardMaterial color="#333333" roughness={0.8} />
        </mesh>
        {/* Front logo area */}
        <mesh position={[0, 0.25, 0.4]}>
          <boxGeometry args={[0.2, 0.1, 0.02]} />
          <meshStandardMaterial color="#1a1a2e" metalness={0.5} roughness={0.5} />
        </mesh>
      </group>
    </Float>
  )
}

// ============================================
// PRODUCT CANVAS WRAPPER
// ============================================
function ProductCanvas({ children, className = '' }) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 2.5], fov: 50 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={['transparent']} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <pointLight position={[-3, 2, 2]} intensity={0.5} color="#e94560" />
        {children}
      </Canvas>
    </div>
  )
}

// ============================================
// MODEL MAP BY PRODUCT SLUG
// ============================================
const modelMap = {
  'screw-nut': BoltModel,
  'tissue-paper': PaperRollModel,
  'steel-pipes': PipeModel,
  'pipe-fittings': FittingModel,
  'hand-power-tools': WrenchModel,
  'electrical': LightningModel,
  'mechanical': GearModel,
  'ppe': HardhatModel
}

// ============================================
// EXPORTED COMPONENT
// ============================================
function ProductModel({ slug, className = '' }) {
  const ModelComponent = modelMap[slug]

  if (!ModelComponent) {
    return null
  }

  return (
    <ProductCanvas className={className}>
      <ModelComponent />
    </ProductCanvas>
  )
}

export {
  ProductModel,
  ProductCanvas,
  BoltModel,
  PaperRollModel,
  PipeModel,
  FittingModel,
  WrenchModel,
  LightningModel,
  GearModel,
  HardhatModel
}

export default ProductModel
