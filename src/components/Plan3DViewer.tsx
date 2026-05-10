// @react-three/fiber
// @react-three/drei
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

const WALL_HEIGHT = 2.5;
const WALL_THICKNESS = 0.15;
const FORMA_WALL_COLOR = "#C4A264";

interface WallProps {
  x: number;
  y: number;
  width: number;
  height: number;
  isOuter?: boolean;
}

function Wall({ x, y, width, height, isOuter = false }: WallProps) {
  const scale = 0.02;
  const posX = x * scale;
  const posZ = y * scale;
  const wallWidth = width * scale;
  const wallDepth = height * scale;
  const thickness = WALL_THICKNESS;

  return (
    <mesh position={[posX + wallWidth / 2, WALL_HEIGHT / 2, posZ + wallDepth / 2]}>
      <boxGeometry args={[wallWidth, WALL_HEIGHT, wallDepth]} />
      <meshStandardMaterial
        color={FORMA_WALL_COLOR}
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  );
}

interface LineWallProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function LineWall({ x1, y1, x2, y2 }: LineWallProps) {
  const scale = 0.02;
  const dx = Math.abs(x2 - x1) * scale;
  const dy = Math.abs(y2 - y1) * scale;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length < 0.1) return null;

  const centerX = ((x1 + x2) / 2) * scale;
  const centerZ = ((y1 + y2) / 2) * scale;

  const angle = Math.atan2((y2 - y1), (x2 - x1));

  return (
    <mesh
      position={[centerX, WALL_HEIGHT / 2, centerZ]}
      rotation={[0, -angle, 0]}
    >
      <boxGeometry args={[length, WALL_HEIGHT, WALL_THICKNESS]} />
      <meshStandardMaterial
        color={FORMA_WALL_COLOR}
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  );
}

function Floor() {
  const floorSize = 2.5;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[floorSize / 2, 0, floorSize / 2]}>
      <planeGeometry args={[floorSize, floorSize]} />
      <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
    </mesh>
  );
}

function GridFloor() {
  const gridSize = 2.5;
  const divisions = 25;
  return (
    <group position={[0, 0.01, 0]}>
      <gridHelper args={[gridSize, divisions, "#333333", "#222222"]} rotation={[0, 0, 0]} />
    </group>
  );
}

interface ParsedSVG {
  walls: WallProps[];
  lines: LineWallProps[];
}

function parseSvg(svgString: string): ParsedSVG {
  const walls: WallProps[] = [];
  const lines: LineWallProps[] = [];

  if (!svgString) return { walls: [], lines: [] };

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, "image/svg+xml");
    const svg = doc.querySelector("svg");

    if (!svg) return { walls: [], lines: [] };

    const viewBox = svg.getAttribute("viewBox");
    let width = 100;
    let height = 100;

    if (viewBox) {
      const parts = viewBox.split(" ").map(Number);
      width = parts[2] || 100;
      height = parts[3] || 100;
    }

    const rects = svg.querySelectorAll("rect");
    rects.forEach((rect) => {
      const x = parseFloat(rect.getAttribute("x") || "0");
      const y = parseFloat(rect.getAttribute("y") || "0");
      const w = parseFloat(rect.getAttribute("width") || "0");
      const h = parseFloat(rect.getAttribute("height") || "0");
      const stroke = rect.getAttribute("stroke");

      const isOuter = w > 80 || h > 80;

      if (stroke && stroke === FORMA_WALL_COLOR && w > 5 && h > 5) {
        walls.push({ x, y, width: w, height: h, isOuter });
      }
    });

    const linesElements = svg.querySelectorAll("line");
    linesElements.forEach((line) => {
      const x1 = parseFloat(line.getAttribute("x1") || "0");
      const y1 = parseFloat(line.getAttribute("y1") || "0");
      const x2 = parseFloat(line.getAttribute("x2") || "0");
      const y2 = parseFloat(line.getAttribute("y2") || "0");
      const stroke = line.getAttribute("stroke");

      if (stroke === FORMA_WALL_COLOR) {
        lines.push({ x1, y1, x2, y2 });
      }
    });

    const paths = svg.querySelectorAll("path");
    paths.forEach((path) => {
      const d = path.getAttribute("d");
      const stroke = path.getAttribute("stroke");

      if (d && stroke === FORMA_WALL_COLOR) {
        const commands = d.match(/[MLQ]\s*[\d.,\s-]+/g) || [];
        const points: { x: number; y: number }[] = [];

        commands.forEach((cmd) => {
          const nums = cmd.replace(/[MLQ]/, "").trim().split(/[\s,]+/).filter(Boolean).map(Number);
          if (cmd.startsWith("M") || cmd.startsWith("L")) {
            if (nums.length >= 2) {
              points.push({ x: nums[0], y: nums[1] });
            }
          } else if (cmd.startsWith("Q") && nums.length >= 4) {
            points.push({ x: nums[2], y: nums[3] });
          }
        });

        for (let i = 0; i < points.length - 1; i++) {
          lines.push({
            x1: points[i].x,
            y1: points[i].y,
            x2: points[i + 1].x,
            y2: points[i + 1].y,
          });
        }
      }
    });
  } catch (e) {
    console.error("SVG parsing error:", e);
  }

  return { walls, lines };
}

interface Plan3DViewerProps {
  svg: string;
}

export default function Plan3DViewer({ svg }: Plan3DViewerProps) {
  const { walls, lines } = parseSvg(svg);

  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [1.5, 2, 1.5], fov: 50 }}
        shadows
        style={{ background: "#0a0a0a" }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[3, 5, 3]}
          intensity={0.8}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight position={[1, 3, 1]} intensity={0.3} />

        <Floor />
        <GridFloor />

        {walls.map((wall, index) => (
          <Wall key={`wall-${index}`} {...wall} />
        ))}

        {lines.map((line, index) => (
          <LineWall key={`line-${index}`} {...line} />
        ))}

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={0.5}
          maxDistance={5}
          minPolarAngle={0.1}
          maxPolarAngle={Math.PI / 2.1}
          target={[0.5, 0, 0.5]}
        />
      </Canvas>
    </div>
  );
}