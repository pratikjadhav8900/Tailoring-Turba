"use client";
import React, { Suspense, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Environment, Float, Html, Decal, useTexture } from "@react-three/drei";
import { Loader2 } from "lucide-react";

function Shirt({ color, textureUrl, garmentType }: { color: string, textureUrl: string | null, garmentType: string }) {
  const meshRef = useRef<any>();
  const texture = textureUrl ? useTexture(textureUrl) : null;
  const isHoodie = garmentType === "hoodie";

  return (
    <group>
      {/* Main Body */}
      <mesh ref={meshRef} castShadow receiveShadow position={[0, 0, 0]} scale={2.5}>
        <boxGeometry args={[isHoodie ? 1.1 : 1, 1.2, isHoodie ? 0.3 : 0.2]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} />
        
        {texture && (
          <Decal
            position={[0, 0, isHoodie ? 0.16 : 0.11]}
            rotation={[0, 0, 0]}
            scale={[0.8, 0.8, 1]}
            map={texture}
          />
        )}
      </mesh>

      {/* Hoodie Specific Elements */}
      {isHoodie && (
        <group scale={2.5}>
          {/* Hood */}
          <mesh position={[0, 0.7, -0.1]} castShadow>
            <boxGeometry args={[0.6, 0.5, 0.4]} />
            <meshStandardMaterial color={color} roughness={0.5} />
          </mesh>
          {/* Sleeves (Simplified) */}
          <mesh position={[0.7, 0.3, 0]} rotation={[0, 0, -0.4]}>
            <boxGeometry args={[0.3, 0.8, 0.25]} />
            <meshStandardMaterial color={color} roughness={0.5} />
          </mesh>
          <mesh position={[-0.7, 0.3, 0]} rotation={[0, 0, 0.4]}>
            <boxGeometry args={[0.3, 0.8, 0.25]} />
            <meshStandardMaterial color={color} roughness={0.5} />
          </mesh>
        </group>
      )}
    </group>
  );
}

export default function ThreeDScene({ bodyColor, textureUrl, garmentType }: { bodyColor: string, textureUrl: string | null, garmentType: string }) {
  return (
    <Canvas shadows camera={{ position: [0, 0, 5], fov: 35 }}>
      <color attach="background" args={["#0a0a0a"]} />
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} shadow-mapSize={[512, 512]} castShadow />
      
      <Suspense fallback={<Html center><Loader2 className="w-10 h-10 text-white/20 animate-spin" /></Html>}>
        <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
          <Shirt color={bodyColor} textureUrl={textureUrl} garmentType={garmentType} />
        </Float>
        <ContactShadows position={[0, -1.8, 0]} opacity={0.4} scale={10} blur={2.5} far={2} />
        <Environment preset="city" />
      </Suspense>

      <OrbitControls 
        enablePan={false} 
        minPolarAngle={Math.PI / 4} 
        maxPolarAngle={Math.PI / 1.5} 
        minDistance={3} 
        maxDistance={7} 
      />
    </Canvas>
  );
}
