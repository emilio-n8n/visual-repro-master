/**
 * @fileoverview Utilitaires d'export pour FORMA
 * Fonctions pour exporter les budgets en PDF, et les plans en formats STL/OBJ pour l'impression 3D.
 */

import { jsPDF } from "jspdf";
import type { BudgetEstimate } from "./types";

// Couleurs FORMA
const FORMA_COLORS = {
  gold: "#C4A264",
  goldLight: "#D4B978",
  text: "#F0EAE0",
  textMuted: "#A09A8C",
  background: "#0b0b0b",
  card: "#1a1a1a",
  border: "#C4A264",
  borderLight: "#C4A26433",
};

/**
 * Formate un prix en euros avec le format français
 */
function formatPrice(price: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Exporte les données de budget en PDF avec le style FORMA
 * @param budgetData - Données du budget à exporter
 * @param surface - Surface du projet
 * @param budgetLevel - Niveau de budget (economique, moyen, haut)
 * @returns Promise<Blob> - Fichier PDF
 */
export async function exportBudgetPDF(
  budgetData: BudgetEstimate[],
  surface: string = "150m²",
  budgetLevel: "economique" | "moyen" | "haut" = "moyen"
): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // En-tête FORMA
  doc.setFillColor(FORMA_COLORS.background);
  doc.rect(0, 0, pageWidth, 40, "F");

  doc.setTextColor(FORMA_COLORS.text);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("FORMA", 20, 25);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(FORMA_COLORS.gold);
  doc.text("ESTIMATION BUDGÉTAIRE", 20, 33);

  yPos = 55;

  // Informations du projet
  doc.setTextColor(FORMA_COLORS.text);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Surface: ${surface}`, 20, yPos);
  doc.text(`Niveau: ${budgetLevel.charAt(0).toUpperCase() + budgetLevel.slice(1)}`, 120, yPos);

  yPos += 15;

  // Ligne de séparation
  doc.setDrawColor(FORMA_COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(20, yPos, pageWidth - 20, yPos);

  yPos += 10;

  // Catégories de budget
  const totalMin = budgetData.reduce((sum, cat) => sum + cat.min, 0);
  const totalMax = budgetData.reduce((sum, cat) => sum + cat.max, 0);

  budgetData.forEach((category, index) => {
    // Vérifier si on a besoin d'une nouvelle page
    if (yPos > 260) {
      doc.addPage();
      yPos = 20;
    }

    // Titre de la catégorie
    doc.setFillColor(FORMA_COLORS.card);
    doc.rect(15, yPos - 5, pageWidth - 30, 10, "F");

    doc.setTextColor(FORMA_COLORS.gold);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(category.category, 20, yPos + 2);

    doc.setTextColor(FORMA_COLORS.text);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`${formatPrice(category.min)} - ${formatPrice(category.max)}`, pageWidth - 60, yPos + 2);

    yPos += 15;

    // Items de la catégorie
    doc.setTextColor(FORMA_COLORS.textMuted);
    doc.setFontSize(8);
    category.items.forEach((item) => {
      doc.text(`• ${item}`, 25, yPos);
      yPos += 5;
    });

    yPos += 8;
  });

  // Total
  yPos += 5;
  doc.setDrawColor(FORMA_COLORS.gold);
  doc.setLineWidth(1);
  doc.line(20, yPos, pageWidth - 20, yPos);

  yPos += 10;
  doc.setFillColor(FORMA_COLORS.card);
  doc.rect(15, yPos - 5, pageWidth - 30, 15, "F");

  doc.setTextColor(FORMA_COLORS.gold);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("BUDGET TOTAL ESTIMÉ", 20, yPos + 3);
  doc.text(`${formatPrice(totalMin)} - ${formatPrice(totalMax)}`, pageWidth - 65, yPos + 3);

  // Pied de page
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setDrawColor(FORMA_COLORS.borderLight);
  doc.setLineWidth(0.3);
  doc.line(20, footerY - 5, pageWidth - 20, footerY - 5);

  doc.setTextColor(FORMA_COLORS.textMuted);
  doc.setFontSize(8);
  doc.text("Document généré par FORMA - Estimation non contractuelle", pageWidth / 2, footerY, { align: "center" });
  doc.text(`Date: ${new Date().toLocaleDateString("fr-FR")}`, pageWidth / 2, footerY + 5, { align: "center" });

  return doc.output("blob");
}

/**
 * Extrait les coordonnées des éléments SVG (rect, path, line, circle)
 */
function extractSvgCoordinates(svg: string): { x: number; y: number; width?: number; height?: number; points?: string }[] {
  const coords: { x: number; y: number; width?: number; height?: number; points?: string }[] = [];

  // Extraction des rectangles
  const rectMatches = svg.matchAll(/<rect[^>]*\/>/g);
  for (const match of rectMatches) {
    const x = parseFloat(match[0].match(/x="([^"]+)"/)?.[1] || "0");
    const y = parseFloat(match[0].match(/y="([^"]+)"/)?.[1] || "0");
    const width = parseFloat(match[0].match(/width="([^"]+)"/)?.[1] || "0");
    const height = parseFloat(match[0].match(/height="([^"]+)"/)?.[1] || "0");
    coords.push({ x, y, width, height });
  }

  // Extraction des lignes
  const lineMatches = svg.matchAll(/<line[^>]*\/>/g);
  for (const match of lineMatches) {
    const x1 = parseFloat(match[0].match(/x1="([^"]+)"/)?.[1] || "0");
    const y1 = parseFloat(match[0].match(/y1="([^"]+)"/)?.[1] || "0");
    const x2 = parseFloat(match[0].match(/x2="([^"]+)"/)?.[1] || "0");
    const y2 = parseFloat(match[0].match(/y2="([^"]+)"/)?.[1] || "0");
    // Convertir les lignes en rectangles minces
    coords.push({ x: x1, y: y1, width: x2 - x1 || 1, height: y2 - y1 || 1 });
  }

  // Extraction des cercles - approximation en rectangles
  const circleMatches = svg.matchAll(/<circle[^>]*\/>/g);
  for (const match of circleMatches) {
    const cx = parseFloat(match[0].match(/cx="([^"]+)"/)?.[1] || "0");
    const cy = parseFloat(match[0].match(/cy="([^"]+)"/)?.[1] || "0");
    const r = parseFloat(match[0].match(/r="([^"]+)"/)?.[1] || "0");
    coords.push({ x: cx - r, y: cy - r, width: r * 2, height: r * 2 });
  }

  // Extraction des paths
  const pathMatches = svg.matchAll(/<path[^>]*\/>/g);
  for (const match of pathMatches) {
    const d = match[0].match(/d="([^"]+)"/)?.[1];
    if (d) {
      coords.push({ x: 0, y: 0, points: d });
    }
  }

  return coords;
}

/**
 * Convertit un SVG en fichier STL (format texte/binaire ASCII)
 * Crée une extrusion simple des formes SVG détectées
 * @param svg - Contenu SVG du plan
 * @returns string - Contenu STL formaté
 */
export function exportPlanSTL(svg: string): string {
  const coords = extractSvgCoordinates(svg);

  // Paramètres d'extrusion
  const extrusionHeight = 10;
  const scale = 1;

  let stlOutput = "solid plan\n";

  coords.forEach((coord, index) => {
    if (coord.points) {
      // Pour les paths, créer une approximation rectangulaire
      const minX = coord.x;
      const minY = coord.y;
      const maxX = minX + 50;
      const maxY = minY + 50;

      // Créer les triangles pour le fond
      const triangles = [
        // Face inférieure
        [minX, minY, 0, maxX, minY, 0, maxX, maxY, 0],
        [minX, minY, 0, maxX, maxY, 0, minX, maxY, 0],
        // Face supérieure
        [minX, minY, extrusionHeight, maxX, maxY, extrusionHeight, maxX, minY, extrusionHeight],
        [minX, minY, extrusionHeight, minX, maxY, extrusionHeight, maxX, maxY, extrusionHeight],
        // Faces latérales
        [minX, minY, 0, minX, maxY, extrusionHeight, maxX, maxY, extrusionHeight],
        [minX, minY, 0, maxX, maxY, extrusionHeight, maxX, minY, extrusionHeight],
        [maxX, minY, 0, maxX, maxY, 0, maxX, maxY, extrusionHeight],
        [maxX, minY, 0, maxX, maxY, extrusionHeight, maxX, minY, extrusionHeight],
        [minX, maxY, 0, minX, maxY, extrusionHeight, maxX, maxY, extrusionHeight],
        [minX, maxY, 0, maxX, maxY, extrusionHeight, maxX, maxY, 0],
        [minX, minY, 0, maxX, minY, extrusionHeight, minX, minY, extrusionHeight],
        [minX, minY, 0, maxX, minY, 0, maxX, minY, extrusionHeight],
      ];

      triangles.forEach((tri) => {
        stlOutput += `  facet normal 0 0 1\n    outer loop\n`;
        for (let i = 0; i < 6; i += 3) {
          stlOutput += `      vertex ${(tri[i] * scale).toFixed(6)} ${(tri[i + 1] * scale).toFixed(6)} ${(tri[i + 2] * scale).toFixed(6)}\n`;
        }
        stlOutput += `    endloop\n  endfacet\n`;
      });
    } else if (coord.width && coord.height) {
      const minX = coord.x;
      const minY = coord.y;
      const maxX = coord.x + coord.width;
      const maxY = coord.y + coord.height;

      // Créer les triangles pour chaque face de l'extrusion
      // Face inférieure (z=0)
      stlOutput += `  facet normal 0 0 -1\n    outer loop\n`;
      stlOutput += `      vertex ${(minX * scale).toFixed(6)} ${(minY * scale).toFixed(6)} 0\n`;
      stlOutput += `      vertex ${(maxX * scale).toFixed(6)} ${(minY * scale).toFixed(6)} 0\n`;
      stlOutput += `      vertex ${(maxX * scale).toFixed(6)} ${(maxY * scale).toFixed(6)} 0\n`;
      stlOutput += `    endloop\n  endfacet\n`;

      stlOutput += `  facet normal 0 0 -1\n    outer loop\n`;
      stlOutput += `      vertex ${(minX * scale).toFixed(6)} ${(minY * scale).toFixed(6)} 0\n`;
      stlOutput += `      vertex ${(maxX * scale).toFixed(6)} ${(maxY * scale).toFixed(6)} 0\n`;
      stlOutput += `      vertex ${(minX * scale).toFixed(6)} ${(maxY * scale).toFixed(6)} 0\n`;
      stlOutput += `    endloop\n  endfacet\n`;

      // Face supérieure (z=extrusionHeight)
      stlOutput += `  facet normal 0 0 1\n    outer loop\n`;
      stlOutput += `      vertex ${(minX * scale).toFixed(6)} ${(minY * scale).toFixed(6)} ${extrusionHeight}\n`;
      stlOutput += `      vertex ${(maxX * scale).toFixed(6)} ${(maxY * scale).toFixed(6)} ${extrusionHeight}\n`;
      stlOutput += `      vertex ${(maxX * scale).toFixed(6)} ${(minY * scale).toFixed(6)} ${extrusionHeight}\n`;
      stlOutput += `    endloop\n  endfacet\n`;

      stlOutput += `  facet normal 0 0 1\n    outer loop\n`;
      stlOutput += `      vertex ${(minX * scale).toFixed(6)} ${(minY * scale).toFixed(6)} ${extrusionHeight}\n`;
      stlOutput += `      vertex ${(minX * scale).toFixed(6)} ${(maxY * scale).toFixed(6)} ${extrusionHeight}\n`;
      stlOutput += `      vertex ${(maxX * scale).toFixed(6)} ${(maxY * scale).toFixed(6)} ${extrusionHeight}\n`;
      stlOutput += `    endloop\n  endfacet\n`;

      // Face avant (y=maxY)
      stlOutput += `  facet normal 0 1 0\n    outer loop\n`;
      stlOutput += `      vertex ${(minX * scale).toFixed(6)} ${(maxY * scale).toFixed(6)} 0\n`;
      stlOutput += `      vertex ${(maxX * scale).toFixed(6)} ${(maxY * scale).toFixed(6)} ${extrusionHeight}\n`;
      stlOutput += `      vertex ${(minX * scale).toFixed(6)} ${(maxY * scale).toFixed(6)} ${extrusionHeight}\n`;
      stlOutput += `    endloop\n  endfacet\n`;

      stlOutput += `  facet normal 0 1 0\n    outer loop\n`;
      stlOutput += `      vertex ${(minX * scale).toFixed(6)} ${(maxY * scale).toFixed(6)} 0\n`;
      stlOutput += `      vertex ${(maxX * scale).toFixed(6)} ${(maxY * scale).toFixed(6)} 0\n`;
      stlOutput += `      vertex ${(maxX * scale).toFixed(6)} ${(maxY * scale).toFixed(6)} ${extrusionHeight}\n`;
      stlOutput += `    endloop\n  endfacet\n`;

      // Face arrière (y=minY)
      stlOutput += `  facet normal 0 -1 0\n    outer loop\n`;
      stlOutput += `      vertex ${(minX * scale).toFixed(6)} ${(minY * scale).toFixed(6)} 0\n`;
      stlOutput += `      vertex ${(minX * scale).toFixed(6)} ${(minY * scale).toFixed(6)} ${extrusionHeight}\n`;
      stlOutput += `      vertex ${(maxX * scale).toFixed(6)} ${(minY * scale).toFixed(6)} ${extrusionHeight}\n`;
      stlOutput += `    endloop\n  endfacet\n`;

      stlOutput += `  facet normal 0 -1 0\n    outer loop\n`;
      stlOutput += `      vertex ${(minX * scale).toFixed(6)} ${(minY * scale).toFixed(6)} 0\n`;
      stlOutput += `      vertex ${(maxX * scale).toFixed(6)} ${(minY * scale).toFixed(6)} ${extrusionHeight}\n`;
      stlOutput += `      vertex ${(maxX * scale).toFixed(6)} ${(minY * scale).toFixed(6)} 0\n`;
      stlOutput += `    endloop\n  endfacet\n`;

      // Face droite (x=maxX)
      stlOutput += `  facet normal 1 0 0\n    outer loop\n`;
      stlOutput += `      vertex ${(maxX * scale).toFixed(6)} ${(minY * scale).toFixed(6)} 0\n`;
      stlOutput += `      vertex ${(maxX * scale).toFixed(6)} ${(minY * scale).toFixed(6)} ${extrusionHeight}\n`;
      stlOutput += `      vertex ${(maxX * scale).toFixed(6)} ${(maxY * scale).toFixed(6)} ${extrusionHeight}\n`;
      stlOutput += `    endloop\n  endfacet\n`;

      stlOutput += `  facet normal 1 0 0\n    outer loop\n`;
      stlOutput += `      vertex ${(maxX * scale).toFixed(6)} ${(minY * scale).toFixed(6)} 0\n`;
      stlOutput += `      vertex ${(maxX * scale).toFixed(6)} ${(maxY * scale).toFixed(6)} ${extrusionHeight}\n`;
      stlOutput += `      vertex ${(maxX * scale).toFixed(6)} ${(maxY * scale).toFixed(6)} 0\n`;
      stlOutput += `    endloop\n  endfacet\n`;

      // Face gauche (x=minX)
      stlOutput += `  facet normal -1 0 0\n    outer loop\n`;
      stlOutput += `      vertex ${(minX * scale).toFixed(6)} ${(minY * scale).toFixed(6)} 0\n`;
      stlOutput += `      vertex ${(minX * scale).toFixed(6)} ${(maxY * scale).toFixed(6)} ${extrusionHeight}\n`;
      stlOutput += `      vertex ${(minX * scale).toFixed(6)} ${(minY * scale).toFixed(6)} ${extrusionHeight}\n`;
      stlOutput += `    endloop\n  endfacet\n`;

      stlOutput += `  facet normal -1 0 0\n    outer loop\n`;
      stlOutput += `      vertex ${(minX * scale).toFixed(6)} ${(minY * scale).toFixed(6)} 0\n`;
      stlOutput += `      vertex ${(minX * scale).toFixed(6)} ${(maxY * scale).toFixed(6)} 0\n`;
      stlOutput += `      vertex ${(minX * scale).toFixed(6)} ${(maxY * scale).toFixed(6)} ${extrusionHeight}\n`;
      stlOutput += `    endloop\n  endfacet\n`;
    }
  });

  stlOutput += "endsolid plan\n";

  return stlOutput;
}

/**
 * Convertit un SVG en fichier OBJ
 * Crée des vertices et faces à partir des formes SVG détectées
 * @param svg - Contenu SVG du plan
 * @returns string - Contenu OBJ formaté
 */
export function exportPlanOBJ(svg: string): string {
  const coords = extractSvgCoordinates(svg);

  // Paramètres
  const extrusionHeight = 10;
  const scale = 1;

  let objOutput = "# FORMA Plan OBJ Export\n";
  objOutput += "# Generated by FORMA\n";
  objOutput += `o plan_${Date.now()}\n\n`;

  let vertexIndex = 1;

  coords.forEach((coord, shapeIndex) => {
    if (coord.points) {
      // Pour les paths, créer une approximation
      const minX = coord.x;
      const minY = coord.y;
      const maxX = minX + 50;
      const maxY = minY + 50;

      // Créer une boîte simple
      const boxVertices = [
        [minX, minY, 0],
        [maxX, minY, 0],
        [maxX, maxY, 0],
        [minX, maxY, 0],
        [minX, minY, extrusionHeight],
        [maxX, minY, extrusionHeight],
        [maxX, maxY, extrusionHeight],
        [minX, maxY, extrusionHeight],
      ];

      // Écrire les vertices
      boxVertices.forEach((v) => {
        objOutput += `v ${(v[0] * scale).toFixed(4)} ${(v[1] * scale).toFixed(4)} ${(v[2] * scale).toFixed(4)}\n`;
      });

      objOutput += "\n";

      // Créer les faces
      const faces = [
        [1, 2, 3, 4], // bas
        [5, 6, 7, 8], // haut
        [1, 2, 6, 5], // avant
        [3, 4, 8, 7], // arrière
        [2, 3, 7, 6], // droite
        [4, 1, 5, 8], // gauche
      ];

      faces.forEach((face) => {
        objOutput += `f ${face.map((i) => vertexIndex + i - 1).join(" ")}\n`;
      });

      vertexIndex += 8;
    } else if (coord.width && coord.height) {
      const minX = coord.x;
      const minY = coord.y;
      const maxX = coord.x + coord.width;
      const maxY = coord.y + coord.height;

      // Créer les 8 sommets de la boîte
      const boxVertices = [
        [minX, minY, 0],
        [maxX, minY, 0],
        [maxX, maxY, 0],
        [minX, maxY, 0],
        [minX, minY, extrusionHeight],
        [maxX, minY, extrusionHeight],
        [maxX, maxY, extrusionHeight],
        [minX, maxY, extrusionHeight],
      ];

      // Écrire les vertices
      boxVertices.forEach((v) => {
        objOutput += `v ${(v[0] * scale).toFixed(4)} ${(v[1] * scale).toFixed(4)} ${(v[2] * scale).toFixed(4)}\n`;
      });

      objOutput += "\n";

      // Faces (avec normaux simplifiés)
      // Bas (z=0)
      objOutput += `f ${vertexIndex} ${vertexIndex + 1} ${vertexIndex + 2}\n`;
      objOutput += `f ${vertexIndex} ${vertexIndex + 2} ${vertexIndex + 3}\n`;

      // Haut (z=extrusionHeight)
      objOutput += `f ${vertexIndex + 4} ${vertexIndex + 6} ${vertexIndex + 5}\n`;
      objOutput += `f ${vertexIndex + 4} ${vertexIndex + 7} ${vertexIndex + 6}\n`;

      // Avant (y=minY)
      objOutput += `f ${vertexIndex} ${vertexIndex + 5} ${vertexIndex + 1}\n`;
      objOutput += `f ${vertexIndex} ${vertexIndex + 4} ${vertexIndex + 5}\n`;

      // Arrière (y=maxY)
      objOutput += `f ${vertexIndex + 3} ${vertexIndex + 2} ${vertexIndex + 6}\n`;
      objOutput += `f ${vertexIndex + 3} ${vertexIndex + 6} ${vertexIndex + 7}\n`;

      // Droite (x=maxX)
      objOutput += `f ${vertexIndex + 1} ${vertexIndex + 5} ${vertexIndex + 6}\n`;
      objOutput += `f ${vertexIndex + 1} ${vertexIndex + 6} ${vertexIndex + 2}\n`;

      // Gauche (x=minX)
      objOutput += `f ${vertexIndex} ${vertexIndex + 3} ${vertexIndex + 7}\n`;
      objOutput += `f ${vertexIndex} ${vertexIndex + 7} ${vertexIndex + 4}\n`;

      objOutput += "\n";
      vertexIndex += 8;
    }
  });

  // Matériau par défaut
  objOutput += "\n# Material\n";
  objOutput += "usemtl default\n";
  objOutput += "mtllib plan.mtl\n";

  return objOutput;
}

/**
 * Télécharge un fichier depuis un blob
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Télécharge un contenu texte comme fichier
 */
export function downloadText(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(blob, filename);
}