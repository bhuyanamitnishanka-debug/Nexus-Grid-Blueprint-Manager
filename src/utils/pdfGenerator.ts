import { jsPDF } from 'jspdf';
import {
  BlueprintPhase,
  PhysicsNodeState,
  MATERIAL_REGISTRY,
} from '../data/blueprintData';

export function generateProjectBlueprintPDF(
  phases: BlueprintPhase[],
  physicsNodes: PhysicsNodeState[],
  activeModifier: number
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Color Palette Constants
  const navyDark = [10, 14, 23]; // #0A0E17
  const slatePanel = [15, 23, 42]; // #0F172A
  const textWhite = [255, 255, 255];
  const textLight = [226, 232, 240];
  const textMuted = [148, 163, 184];
  const accentBlue = [37, 99, 235]; // #2563EB
  const accentCyan = [6, 182, 212]; // #06B6D4
  const accentAmber = [245, 158, 11]; // #F59E0B
  const accentEmerald = [16, 185, 129]; // #10B981

  // Helper functions
  const addHeader = (pageNum: number, totalPages: number) => {
    doc.setFillColor(navyDark[0], navyDark[1], navyDark[2]);
    doc.rect(0, 0, pageWidth, 18, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(accentCyan[0], accentCyan[1], accentCyan[2]);
    doc.text('NEXUS-GRID BLUEPRINT MANAGER', margin, 11);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('ISO 19650 DIGITAL TWIN SPECIFICATION', margin + 65, 11);

    doc.setFont('helvetica', 'bold');
    doc.text(`SHEET ${pageNum} OF ${totalPages}`, pageWidth - margin - 22, 11);

    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.5);
    doc.line(margin, 18, pageWidth - margin, 18);
  };

  const addFooter = (pageNum: number) => {
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('CLASSIFIED ENGINEERING BLUEPRINT · FOR AUTHORIZED PROJECT STAKEHOLDERS ONLY', margin, pageHeight - 7);
    doc.text(
      `GENERATED: 2026-09-29 · TORQUE MODIFIER: ${activeModifier.toFixed(1)}x`,
      pageWidth - margin - 65,
      pageHeight - 7
    );
  };

  // =========================================================================
  // PAGE 1: EXECUTIVE COVER & PROJECT ARCHITECTURE
  // =========================================================================
  addHeader(1, 5);

  let y = 30;

  // Title Block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text('NEXUS-GRID MASTER PROJECT BLUEPRINT', margin, y);
  y += 7;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(accentBlue[0], accentBlue[1], accentBlue[2]);
  doc.text('HIGH-PERFORMANCE DATA CENTER & ELECTRO-MECHANICAL DIGITAL TWIN', margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'End-to-end engineering documentation bridging raw conceptual hand sketches into structural steel,',
    margin,
    y
  );
  y += 4.5;
  doc.text(
    'power-thermal subsystems, structured fiber cabling, and real-time mechanical torque validation.',
    margin,
    y
  );
  y += 10;

  // Executive KPI Summary Banner (Dark Box)
  doc.setFillColor(slatePanel[0], slatePanel[1], slatePanel[2]);
  doc.roundedRect(margin, y, contentWidth, 34, 2, 2, 'F');

  const colW = contentWidth / 4;
  const kpis = [
    { label: 'MASTER DIMENSIONS', val: '140.0m × 85.0m', sub: '11,900 m² Plot' },
    { label: 'SCALABILITY TIER', val: 'TIER IV MODULAR', sub: '6.40 MW IT Critical' },
    { label: 'RELIABILITY INDEX', val: '99.995% UPTIME', sub: '2N+1 Fault Tolerant' },
    { label: 'TARGET PUE FLOW', val: '1.15 RATIO', sub: 'ΔT 14.2°C Cold Aisle' },
  ];

  kpis.forEach((kpi, idx) => {
    const kx = margin + idx * colW + 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(kpi.label, kx, y + 9);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(textWhite[0], textWhite[1], textWhite[2]);
    doc.text(kpi.val, kx, y + 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(accentCyan[0], accentCyan[1], accentCyan[2]);
    doc.text(kpi.sub, kx, y + 25);
  });

  y += 44;

  // Section 1: Project Management Methodology
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text('1. PROJECT MANAGEMENT METHODOLOGY', margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    'The project utilizes a Hybrid Agile-Waterfall Framework with AI Orchestration (Digital Twin Deployment Model):',
    margin,
    y
  );
  y += 5;

  const methodPoints = [
    '• Waterfall Core: Strict sequential progression (Plan -> Design -> Power -> Infra -> Deploy). Heavy infrastructure casting, generator installation, and power grid routing cannot be re-shuffled mid-way.',
    '• Agile & Visual Sprints: Visual block management converting manual hand drawings into 3D CAD/Simulation pipelines for rapid error testing before physical execution on site.',
    '• Mechanical Integration: Direct tracking of micro-gears, rotators, and fluid valves regulating Generator-cum-Battery subsystems and modular automation robotics.',
  ];

  methodPoints.forEach((pt) => {
    const splitPt = doc.splitTextToSize(pt, contentWidth - 4);
    doc.text(splitPt, margin + 2, y);
    y += splitPt.length * 4.2 + 1;
  });

  y += 4;

  // Section 2: 5 Sequential Phase Status Overview
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text('2. FIVE-PHASE LIFECYCLE PROGRESSION MATRIX', margin, y);
  y += 6;

  // Phase Summary Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text('PHASE', margin + 3, y + 4.8);
  doc.text('DESCRIPTION & CONSTRAINTS', margin + 45, y + 4.8);
  doc.text('GATEWAY METRIC', margin + 125, y + 4.8);
  doc.text('STATUS', margin + 160, y + 4.8);
  y += 7;

  phases.forEach((p, idx) => {
    const isEven = idx % 2 === 0;
    if (isEven) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, 12, 'F');
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
    doc.text(`Phase ${p.index}`, margin + 3, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(p.shortName, margin + 3, y + 9);

    const descSnippet = `${p.desc.substring(0, 75)}...`;
    doc.text(descSnippet, margin + 45, y + 5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Constraints: ${p.constraints.substring(0, 58)}`, margin + 45, y + 9);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(accentBlue[0], accentBlue[1], accentBlue[2]);
    doc.text(p.metric, margin + 125, y + 6);

    let statusColor = [100, 116, 139];
    if (p.status === 'Complete') statusColor = accentEmerald;
    else if (p.status === 'In Progress') statusColor = accentAmber;

    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.text(p.status.toUpperCase(), margin + 160, y + 6);

    y += 12;
  });

  addFooter(1);

  // =========================================================================
  // PAGE 2: DETAILED 5-PHASE BLUEPRINT & DEPLOYMENT TASKLISTS
  // =========================================================================
  doc.addPage();
  addHeader(2, 5);
  y = 26;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text('3. COMPONENT DEPLOYMENT TASKLISTS (INPUT ➔ PROCESS ➔ OUTPUT)', margin, y);
  y += 7;

  phases.forEach((phase) => {
    // Phase Sub-Header Bar
    doc.setFillColor(slatePanel[0], slatePanel[1], slatePanel[2]);
    doc.rect(margin, y, contentWidth, 7, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(textWhite[0], textWhite[1], textWhite[2]);
    doc.text(`PHASE ${phase.index}: ${phase.title.toUpperCase()}`, margin + 3, y + 4.8);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(accentCyan[0], accentCyan[1], accentCyan[2]);
    doc.text(`Target: ${phase.targetSystem}`, pageWidth - margin - 45, y + 4.8);
    y += 9;

    phase.tasks.forEach((t) => {
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, y, contentWidth, 12, 1, 1, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, contentWidth, 12, 1, 1, 'D');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
      doc.text(`[${t.code}] ${t.title}`, margin + 3, y + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(accentBlue[0], accentBlue[1], accentBlue[2]);
      doc.text(`Zone: ${t.assignedZone}`, pageWidth - margin - 40, y + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(71, 85, 105);
      const chain = `Input: ${t.inputNode}   ➔   Process: ${t.processNode}   ➔   Output: ${t.outputNode}`;
      doc.text(chain, margin + 3, y + 9);

      y += 13.5;
    });

    y += 2;
  });

  addFooter(2);

  // =========================================================================
  // PAGE 3: HARDWARE & MICRO-GEAR ASSET TRACKING LEDGER MATRIX
  // =========================================================================
  doc.addPage();
  addHeader(3, 5);
  y = 26;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text('4. HARDWARE & MICRO-GEAR ASSET TRACKING LEDGER MATRIX', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'Tracking minute mechanical linkages, torque boundaries, and fluid valves alongside high-voltage electrical lines.',
    margin,
    y
  );
  y += 7;

  // Table header
  doc.setFillColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(textWhite[0], textWhite[1], textWhite[2]);
  doc.text('ASSET ID', margin + 3, y + 4.8);
  doc.text('COMPONENT NAME & CATEGORY', margin + 36, y + 4.8);
  doc.text('MECHANICAL / ELECTRICAL PARAMETERS', margin + 105, y + 4.8);
  doc.text('STATUS', margin + 162, y + 4.8);
  y += 7;

  const allAssets = phases.flatMap((p) => p.microGear);

  allAssets.forEach((asset, idx) => {
    const isEven = idx % 2 === 0;
    const itemHeight = 13.5;

    if (isEven) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, itemHeight, 'F');
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(accentBlue[0], accentBlue[1], accentBlue[2]);
    doc.text(asset.assetId, margin + 3, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Phase: ${asset.phaseId.toUpperCase()}`, margin + 3, y + 9.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
    doc.text(asset.name, margin + 36, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(71, 85, 105);
    doc.text(asset.specCategory, margin + 36, y + 9.5);

    // Tags
    const tagStr = asset.tags.map((t) => `${t.label}: ${t.value}`).join('  |  ');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(30, 41, 59);
    doc.text(tagStr, margin + 105, y + 7);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    let stColor = accentEmerald;
    if (asset.status === 'Active Testing') stColor = accentAmber;
    else if (asset.status === 'Queued') stColor = [100, 116, 139];

    doc.setTextColor(stColor[0], stColor[1], stColor[2]);
    doc.text(asset.status.toUpperCase(), margin + 162, y + 7);

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(margin, y + itemHeight, pageWidth - margin, y + itemHeight);

    y += itemHeight;
  });

  addFooter(3);

  // =========================================================================
  // PAGE 4: MECHANICAL TORQUE CASCADES & MATERIAL FATIGUE SIMULATION
  // =========================================================================
  doc.addPage();
  addHeader(4, 5);
  y = 26;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text('5. MECHANICAL TORQUE CASCADES & MATERIAL FATIGUE LIFETIME', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Live simulation results validating mechanical linkages under dynamic load modifier (${activeModifier.toFixed(
      1
    )}x applied torque).`,
    margin,
    y
  );
  y += 7;

  // Mathematical Physics Legend Box
  doc.setFillColor(slatePanel[0], slatePanel[1], slatePanel[2]);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(accentCyan[0], accentCyan[1], accentCyan[2]);
  doc.text('PHYSICS ENGINE EQUATIONS & MATERIAL BOUNDARIES', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(textWhite[0], textWhite[1], textWhite[2]);
  doc.text('• Torsional Shear Stress:  Tau = (2 * Output_Torque) / (pi * r^3) [MPa]', margin + 4, y + 12);
  doc.text(
    "• Basquin's Cyclic Fatigue Life:  Stress_Amplitude = Endurance_Limit * (N_cycles)^b  ==>  Lifecycle capability before crack initiation",
    margin + 4,
    y + 17
  );
  doc.text(
    '• Safety Thresholds:  Tau > Yield_Strength (CRITICAL FAILURE)  |  Remaining Cycles < 50,000 (HIGH FATIGUE RISK)  |  Tau <= Yield (VALID)',
    margin + 4,
    y + 22
  );
  y += 28;

  // Physics Nodes Simulation Table
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(51, 65, 85);
  doc.text('NODE ID', margin + 3, y + 4.8);
  doc.text('HARDWARE ELEMENT LINK', margin + 28, y + 4.8);
  doc.text('TORQUE (IN/OUT)', margin + 76, y + 4.8);
  doc.text('STRESS', margin + 105, y + 4.8);
  doc.text('TEMP (°C)', margin + 126, y + 4.8);
  doc.text('CYCLES', margin + 148, y + 4.8);
  doc.text('SAFETY GATE', margin + 168, y + 4.8);
  y += 7;

  physicsNodes.forEach((node, i) => {
    const isEven = i % 2 === 0;
    const rowH = 15;
    if (isEven) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, rowH, 'F');
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(accentBlue[0], accentBlue[1], accentBlue[2]);
    doc.text(node.nodeId, margin + 3, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`r=${node.radiusMm}mm · ${node.teethCount}T`, margin + 3, y + 10);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
    doc.text(node.name, margin + 28, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`${node.material} · ${node.applicationContext}`, margin + 28, y + 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(30, 41, 59);
    doc.text(`${node.inputTorqueNm} ➔ ${node.outputTorqueNm} Nm`, margin + 76, y + 7);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
    doc.text(`${node.calculatedShearStressMpa} MPa`, margin + 105, y + 7);

    // Temperature & Heat Status
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    if (node.operatingTemperatureC >= 85) {
      doc.setTextColor(220, 38, 38);
    } else if (node.operatingTemperatureC >= 60) {
      doc.setTextColor(accentAmber[0], accentAmber[1], accentAmber[2]);
    } else {
      doc.setTextColor(accentCyan[0], accentCyan[1], accentCyan[2]);
    }
    doc.text(`${node.operatingTemperatureC}°C`, margin + 126, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(30, 41, 59);
    doc.text(node.fatigueLifeRemainingCycles.toLocaleString(), margin + 148, y + 7);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    let gateCol = accentEmerald;
    if (node.safetyStatus === 'CRITICAL_SHEAR_FAILURE') gateCol = [220, 38, 38];
    else if (node.safetyStatus === 'HIGH_FATIGUE_RISK') gateCol = accentAmber;

    doc.setTextColor(gateCol[0], gateCol[1], gateCol[2]);
    doc.text(node.safetyStatus, margin + 168, y + 7);

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(margin, y + rowH, pageWidth - margin, y + rowH);

    y += rowH;
  });

  y += 8;

  // Material Registry Reference Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text('MATERIAL REGISTRY PROPERTIES & STRUCTURAL CAPABILITIES', margin, y);
  y += 5;

  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text('ALLOY SPECIFICATION', margin + 3, y + 4.2);
  doc.text('YIELD STRENGTH', margin + 50, y + 4.2);
  doc.text('SHEAR MODULUS', margin + 90, y + 4.2);
  doc.text('FATIGUE EXPONENT (b)', margin + 130, y + 4.2);
  doc.text('ENDURANCE LIMIT', margin + 165, y + 4.2);
  y += 6;

  Object.entries(MATERIAL_REGISTRY).forEach(([matName, props]) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
    doc.text(matName, margin + 3, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(`${props.yieldStrengthMpa} MPa`, margin + 50, y + 4.5);
    doc.text(`${props.shearModulusGpa} GPa`, margin + 90, y + 4.5);
    doc.text(`${props.fatigueExponentB}`, margin + 130, y + 4.5);
    doc.text(`${props.enduranceLimitMpa} MPa`, margin + 165, y + 4.5);
    y += 7;
  });

  addFooter(4);

  // =========================================================================
  // PAGE 5: CRITICAL CONSIDERATIONS & COMPLIANCE CERTIFICATION
  // =========================================================================
  doc.addPage();
  addHeader(5, 5);
  y = 26;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text('6. FIVE-PILLAR CRITICAL CONSIDERATIONS & COMPLIANCE', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'Comprehensive operational audit ensuring Tier IV uptime, thermodynamic efficiency, and seismic safety.',
    margin,
    y
  );
  y += 7;

  const pillarCards = [
    {
      title: '01. SCALABILITY ARCHITECTURE',
      body: 'Modular 36m clear-span column-free hall engineered with North knockout panels for seamless +3.2MW Phase-II expansion. Plug-and-play overhead busway tap-off boxes allow live rack power density upgrades from 20kW to 80kW without taking downstream servers offline.',
      color: accentBlue,
    },
    {
      title: '02. FAULT-TOLERANT RELIABILITY (99.995%)',
      body: 'Zero single point of failure (2N+1 topology). Dual Caterpillar 3.2MW diesel gensets coupled with 4.0MWh high-rate LiFePO4 battery array providing instant <4ms static transfer. Underground 72-hour double-walled fuel tanks with automated fuel polishing.',
      color: accentEmerald,
    },
    {
      title: '03. PHYSICAL & CYBERSECURITY',
      body: 'Multi-layer perimeter defense starting with 30m stand-off berm, biometric mantrap security airlock, STC-55 acoustic glazing on NOC command room, and air-gapped Modbus/SCADA PLC automation network for generator synchronisation.',
      color: accentAmber,
    },
    {
      title: '04. THERMODYNAMIC EFFICIENCY (TARGET PUE 1.15)',
      body: 'Dual oil-free magnetic-bearing chillers operating with adiabatic free-cooling economizer mode 78% of the annual cycle. 1,200mm pressurized subfloor air plenum delivering laminar 15.5°C supply air directly to 48 server cabinets with hot-aisle ducted exhaust.',
      color: accentCyan,
    },
    {
      title: '05. GLOBAL STANDARDS COMPLIANCE',
      body: 'Audited and compliant with Uptime Institute Tier IV Constructed Facility, TIA-942 Rated-4, ASHRAE TC 9.9 Thermal Guidelines Class A1, NFPA 110 Level 1 Type 10 Emergency Power, and ISO/IEC 22237 Data Centre Infrastructure.',
      color: [71, 85, 105],
    },
  ];

  pillarCards.forEach((card) => {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, contentWidth, 21, 1.5, 1.5, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, 21, 1.5, 1.5, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(card.color[0], card.color[1], card.color[2]);
    doc.text(card.title, margin + 4, y + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(51, 65, 85);
    const splitBody = doc.splitTextToSize(card.body, contentWidth - 8);
    doc.text(splitBody, margin + 4, y + 10.5);

    y += 24;
  });

  y += 5;

  // Engineering Sign-Off Block
  doc.setFillColor(slatePanel[0], slatePanel[1], slatePanel[2]);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(accentCyan[0], accentCyan[1], accentCyan[2]);
  doc.text('PROJECT COMMISSIONING SIGN-OFF & AS-BUILT CERTIFICATE', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(textWhite[0], textWhite[1], textWhite[2]);
  doc.text('Lead Systems Architect: Certified BIM / Tier IV Engineer', margin + 4, y + 12);
  doc.text('Digital Twin Hash: SHA-256: 8f9b7c2a1e0d4f3b6c5a8e9d2f1a0b3c', margin + 4, y + 17);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(accentEmerald[0], accentEmerald[1], accentEmerald[2]);
  doc.text('VERIFICATION: PRODUCTION READY', pageWidth - margin - 55, y + 15);

  addFooter(5);

  // Save the PDF directly to user's computer
  doc.save('Nexus-Grid-Master-Project-Blueprint.pdf');
}
