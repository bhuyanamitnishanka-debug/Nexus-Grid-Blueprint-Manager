import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Play, Pause, RotateCw, Activity, Sparkles, AlertTriangle } from 'lucide-react';

interface Pipeline3DViewportProps {
  isHalted: boolean;
  modifier: number;
  coolantLiters: number;
  hasThermalBreach: boolean;
  flowViscosityCp?: number;
}

export const Pipeline3DViewport: React.FC<Pipeline3DViewportProps> = ({
  isHalted,
  modifier,
  coolantLiters,
  hasThermalBreach,
  flowViscosityCp = 4.5,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const isAlert = isHalted || hasThermalBreach || coolantLiters < 420;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 380;
    const height = container.clientHeight || 240;

    // 1. Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x06080d, 1);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. Lighting
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(2, 2, 4).normalize();
    scene.add(dirLight);

    const ambientLight = new THREE.AmbientLight(0x334155, 0.8);
    scene.add(ambientLight);

    // 3. Cylinder Conduit Mesh (modeling fluid pipeline flows)
    const geometry = new THREE.CylinderGeometry(0.72, 0.72, 2.7, 32, 8, true);
    const material = new THREE.MeshPhongMaterial({
      color: isAlert ? 0xf43f5e : 0x00d2ff,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    });
    const fluidMesh = new THREE.Mesh(geometry, material);
    fluidMesh.rotation.x = 1.57; // Align cross-section horizontally
    scene.add(fluidMesh);

    // 4. Inner Flow Core (translucent particle vector core)
    const innerGeo = new THREE.CylinderGeometry(0.38, 0.38, 2.8, 16, 4, true);
    const innerMat = new THREE.MeshBasicMaterial({
      color: isAlert ? 0xff2a55 : 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    innerMesh.rotation.x = 1.57;
    scene.add(innerMesh);

    // 5. Animation loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (!isPaused) {
        // Rotate pipeline elements to emulate fluid flow velocity proportional to load modifier
        const speed = 0.012 * Math.max(0.6, modifier);
        fluidMesh.rotation.z += speed;
        innerMesh.rotation.z -= speed * 1.5;
        fluidMesh.rotation.y = Math.sin(Date.now() * 0.001) * 0.15;
      }

      // Update color based on alert state dynamically
      if (isAlert) {
        material.color.setHex(0xf43f5e);
        innerMat.color.setHex(0xff1e56);
      } else {
        material.color.setHex(0x00d2ff);
        innerMat.color.setHex(0x38bdf8);
      }

      renderer.render(scene, camera);
    };

    animate();

    // 6. Resize handler
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isAlert, modifier, isPaused]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 overflow-hidden relative flex flex-col justify-between">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-semibold">
          <Activity className="w-3.5 h-3.5" />
          <span>3D Fluid Conduit WebGL Viewport</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${
              isAlert
                ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
                : 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300'
            }`}
          >
            {isAlert ? 'HIGH THERMAL RESISTANCE' : 'LAMINAR FLOW'}
          </span>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition cursor-pointer"
            title="Toggle WebGL rotation"
          >
            {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3 text-cyan-400" />}
          </button>
        </div>
      </div>

      {/* WebGL Canvas Mount */}
      <div
        ref={mountRef}
        className="w-full h-52 sm:h-56 bg-[#06080D] rounded-xl overflow-hidden relative border border-slate-800/80 shadow-inner"
      />

      {/* Real-Time Telemetry Bar Beneath Viewport */}
      <div className="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
        <div>
          <span className="text-[10px] text-slate-500 block">FLOW VELOCITY</span>
          <span className="text-white font-bold">{(1.85 * modifier).toFixed(2)} m/s</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 block">TARGET VISCOSITY</span>
          <span className="text-cyan-400 font-bold">{flowViscosityCp} cP</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 block">VECTOR STATE</span>
          <span className={isAlert ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
            {isAlert ? 'FAULT TRAP' : 'STABLE'}
          </span>
        </div>
      </div>
    </div>
  );
};
