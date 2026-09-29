export interface MicroGearAsset {
  id: string;
  assetId: string;
  name: string;
  phaseId: 'p1' | 'p2' | 'p3' | 'p4' | 'p5';
  tags: {
    label: string;
    value: string;
    variant?: 'default' | 'amber' | 'emerald' | 'cyan' | 'blue';
  }[];
  specCategory: string;
  description: string;
  status: 'Validated' | 'Active Testing' | 'Queued';
}

export interface DeploymentTask {
  id: string;
  code: string;
  title: string;
  inputNode: string;
  processNode: string;
  outputNode: string;
  assignedZone: string;
  completed: boolean;
}

export interface TelemetryLogEntry {
  id: string;
  timestamp: string;
  level: 'INIT' | 'INFO' | 'WARN' | 'SUCCESS' | 'CMD';
  message: string;
}

export interface BlueprintPhase {
  id: 'p1' | 'p2' | 'p3' | 'p4' | 'p5';
  index: string;
  shortName: string;
  title: string;
  desc: string;
  constraints: string;
  status: 'Complete' | 'In Progress' | 'Pending';
  metric: string;
  targetSystem: string;
  color: string;
  tasks: DeploymentTask[];
  microGear: MicroGearAsset[];
  specs: {
    category: string;
    parameter: string;
    specification: string;
    tolerance: string;
  }[];
  pillars: {
    scalability: string;
    reliability: string;
    security: string;
    efficiency: string;
    compliance: string;
  };
}

export const INITIAL_PHASES: BlueprintPhase[] = [
  {
    id: 'p1',
    index: '01',
    shortName: 'Raw Layout Sketch',
    title: 'Phase 01: Concept & Raw Architectural Sketch',
    desc: 'Translating rough concepts, geometries, and client space visions into initial mathematical spatial layouts across the 140m × 85m master plot.',
    constraints: 'Bedrock Depth -4.2m · Max Plot Ratio 0.68 · Seismic Zone 4',
    status: 'Complete',
    metric: 'Concept Sign-off',
    targetSystem: 'Simulation App Integration',
    color: 'border-blue-500 text-blue-400',
    tasks: [
      {
        id: 't-101',
        code: 'P1-T01',
        title: 'Define master plot boundaries & seismic setbacks',
        inputNode: 'Raw Graphite Site Sketch',
        processNode: 'Coordinate Geometry (COGO) Solver',
        outputNode: 'Locked GIS Perimeter Polygon',
        assignedZone: 'Master Site Envelope',
        completed: true,
      },
      {
        id: 't-102',
        code: 'P1-T02',
        title: 'Map raw spatial dimensions via digital sketch boards',
        inputNode: '6.4MW Target IT Brief',
        processNode: 'Volumetric Space Partitioning',
        outputNode: '4-Room Isometric Floorplan',
        assignedZone: 'All Facility Wings',
        completed: true,
      },
      {
        id: 't-103',
        code: 'P1-T03',
        title: 'Draft initial building envelope & blast-resistant profiles',
        inputNode: 'Perspective Elevation Drawing',
        processNode: 'Thermal & Security Modeling',
        outputNode: 'Precast Concrete Shell Blueprint',
        assignedZone: 'South Entrance & Shell',
        completed: true,
      },
    ],
    microGear: [
      {
        id: 'mg-p1-1',
        assetId: 'MG-8840-X1',
        name: 'High-Torque Rotational Gear Assembly',
        phaseId: 'p1',
        tags: [
          { label: 'Ratio', value: '45:1', variant: 'default' },
          { label: 'Pitch', value: '0.5mm', variant: 'default' },
          { label: 'Limit', value: '180° Limit', variant: 'emerald' },
        ],
        specCategory: 'Kinematics & Surveying',
        description: 'High-precision laser theodolite rotational bearing gear used for sub-millimeter perimeter cadastral layout.',
        status: 'Validated',
      },
      {
        id: 'mg-p1-2',
        assetId: 'GEO-CORE-09',
        name: 'Sub-Basalt Bedrock Anchor Piezometer',
        phaseId: 'p1',
        tags: [
          { label: 'Depth', value: '-8.5m', variant: 'cyan' },
          { label: 'Pressure', value: '14.2 Bar', variant: 'default' },
          { label: 'Seismic', value: '0.45g PGA', variant: 'emerald' },
        ],
        specCategory: 'Geotechnical & Foundations',
        description: 'Monitors hydro-static water table pressure beneath the depressed central server hall plenum.',
        status: 'Validated',
      },
      {
        id: 'mg-p1-3',
        assetId: 'ENV-WALL-01',
        name: '450mm Thermal Break Insulated Precast Core',
        phaseId: 'p1',
        tags: [
          { label: 'U-Value', value: '0.12 W/m²K', variant: 'emerald' },
          { label: 'Rating', value: '4-Hr Fire', variant: 'amber' },
          { label: 'Core', value: 'Basalt Rebar', variant: 'default' },
        ],
        specCategory: 'Envelope Architecture',
        description: 'Perimeter blast-attenuating thermal shell eliminating thermal bridging to external weather variations.',
        status: 'Validated',
      },
    ],
    specs: [
      {
        category: 'Envelope Geometry',
        parameter: 'Master Containment Footprint',
        specification: '140.0m (L) × 85.0m (W) × 14.5m (H) Orthogonal Grid',
        tolerance: '±2.0 mm Laser Survey',
      },
      {
        category: 'Spatial Zoning',
        parameter: '4-Compartment Fire & Acoustic Partition',
        specification: 'West Power Wing (28%) · Center Hall (46%) · NE HVAC (14%) · SE NOC (12%)',
        tolerance: '4-Hour UL Fire Rating',
      },
      {
        category: 'Substructure',
        parameter: 'Depressed Slab & Raised Plenum',
        specification: '600mm Basalt-Reinforced Concrete Slab + 1,200mm Underfloor Air Plenum',
        tolerance: 'FF50 / FL35 Flatness',
      },
    ],
    pillars: {
      scalability: 'Modular North wall knockout panels engineered for +3.2MW Phase-II expansion.',
      reliability: 'Zero shared exterior wall between diesel fuel storage and core optical switching hall.',
      security: '30m stand-off perimeter berm with single dual-interlock biometric mantrap entry.',
      efficiency: 'East-West orientation reduces roof radiant thermal solar gain by 18.4%.',
      compliance: 'TIA-942 Rated-4 & ISO/IEC 22237-2 Physical Site Location verified.',
    },
  },
  {
    id: 'p2',
    index: '02',
    shortName: 'Structural Perspective',
    title: 'Phase 02: Structural Perspective Engineering',
    desc: 'Developing detailed structural steel frameworks, multi-story structural layouts, crane rigging logistics, and finite element stress verification.',
    constraints: 'Clear Span 36.0m · Crane Radius 62.5m · Max Deflection L/360',
    status: 'In Progress',
    metric: 'Structural CAD Validation',
    targetSystem: 'Simulation App Integration',
    color: 'border-amber-500 text-amber-400',
    tasks: [
      {
        id: 't-201',
        code: 'P2-T01',
        title: 'Generate 3D structural steel wireframes & drop-rod nodes',
        inputNode: 'Phase 01 Perspective Lines',
        processNode: '3D Parametric Truss Extrusion',
        outputNode: 'IFC-4 Structural Steel Model',
        assignedZone: 'Center Hall Roof Grid',
        completed: true,
      },
      {
        id: 't-202',
        code: 'P2-T02',
        title: 'Map tower crane radii and heavy machinery paths',
        inputNode: 'Genset & Chiller Dry Weights (42T)',
        processNode: '4D Crane Boom Kinematics Check',
        outputNode: 'Certified Rigging Sequence Plan',
        assignedZone: 'West & North-East Wings',
        completed: true,
      },
      {
        id: 't-203',
        code: 'P2-T03',
        title: 'Design safety zone parameters & vibration-isolated plinths',
        inputNode: 'Dynamic Point-Load Map',
        processNode: 'Harmonic Attenuation Solver',
        outputNode: 'Spring-Isolated Inertia Bases',
        assignedZone: 'West Generator Hall',
        completed: false,
      },
    ],
    microGear: [
      {
        id: 'mg-p2-1',
        assetId: 'STR-STRC-11',
        name: 'Structural Column Framework (Wireframe Grid)',
        phaseId: 'p2',
        tags: [
          { label: 'Material', value: 'Wootz Steel', variant: 'default' },
          { label: 'Section', value: 'H-Beam W36', variant: 'default' },
          { label: 'Logistics', value: 'Crane Node #3', variant: 'cyan' },
        ],
        specCategory: 'Superstructure Framing',
        description: 'Long-span Warren truss column nodes carrying 18 metric tons of suspended MEP power conduits and fiber raceways.',
        status: 'Active Testing',
      },
      {
        id: 'mg-p2-2',
        assetId: 'CRN-RIG-62',
        name: 'Luffing Tower Crane Boom Anchor Gantry',
        phaseId: 'p2',
        tags: [
          { label: 'Jib Radius', value: '62.5m Jib', variant: 'amber' },
          { label: 'Tip Load', value: '45-Ton Tip', variant: 'default' },
          { label: 'Safety', value: '1.45x SF', variant: 'emerald' },
        ],
        specCategory: 'Heavy Rigging Logistics',
        description: 'Positions primary heavy lift boom outside subterranean utility trenches for zero-impact plant rigging.',
        status: 'Active Testing',
      },
      {
        id: 'mg-p2-3',
        assetId: 'ISO-PLN-04',
        name: 'Inertia Foundation Elastomeric Damper Pad',
        phaseId: 'p2',
        tags: [
          { label: 'Freq', value: '3.2 Hz Natural', variant: 'default' },
          { label: 'Isolation', value: '98.5% Atten', variant: 'emerald' },
          { label: 'Rating', value: '65T Static', variant: 'default' },
        ],
        specCategory: 'Vibration Attenuation',
        description: 'Acoustic and harmonic decoupler isolating 1,800 RPM V16 diesel alternators from sensitive optical switches.',
        status: 'Queued',
      },
    ],
    specs: [
      {
        category: 'Primary Steel Frame',
        parameter: 'Long-Span Warren Roof Trusses',
        specification: '36.0m Clear Span ASTM A992 Steel @ 6.0m O.C. Spacing',
        tolerance: 'Max Deflection 14.2 mm',
      },
      {
        category: 'Rigging & Logistics',
        parameter: 'Luffing Tower Crane & Roll-In Corridor',
        specification: '62.5m Boom Radius · 45T Hoist Path over West Power Wing',
        tolerance: 'Wind Lock @ 20 m/s',
      },
      {
        category: 'Vibration Isolation',
        parameter: 'Generator & Chiller Inertia Plinths',
        specification: 'Spring-Isolated Floating Concrete Pads (Natural Freq 3.2 Hz)',
        tolerance: '98.5% Harmonic Isolation',
      },
    ],
    pillars: {
      scalability: 'Overhead truss nodes pre-rated for 150% load for drop-in liquid cooling manifolds.',
      reliability: 'Seismic Zone-4 diagonal cross-bracing resists 0.45g lateral acceleration.',
      security: 'Reinforced roof decking prevents top-down physical breach across all utility bays.',
      efficiency: 'Column-free 36m hall eliminates airflow eddies and allows uniform cold-aisle containment.',
      compliance: 'AISC 360-22 Structural Steel & ASCE 7-22 Risk Category IV Essential Facility.',
    },
  },
  {
    id: 'p3',
    index: '03',
    shortName: 'Power & Cooling Grid',
    title: 'Phase 03: Power Generation & Thermal Subsystems',
    desc: 'Engineering heavy duty power infrastructure, electrochemical battery routing, overhead yellow busways, and hot/cold containment airflows.',
    constraints: '2N+1 Redundancy · PUE ≤ 1.15 · ΔT 14.2°C Cold Aisle',
    status: 'Pending',
    metric: 'PUE Flow Efficiency',
    targetSystem: 'Simulation App Integration',
    color: 'border-slate-700 text-slate-500',
    tasks: [
      {
        id: 't-301',
        code: 'P3-T01',
        title: 'Layout main UPS transformer grid array & LiFePO4 banks',
        inputNode: 'Dual 13.8kV Utility Entry Feeds',
        processNode: '2N Phase-Locked Busbar Routing',
        outputNode: 'Isolated West-Wing Switchgear Lineup',
        assignedZone: 'West Power Wing',
        completed: false,
      },
      {
        id: 't-302',
        code: 'P3-T02',
        title: 'Position primary and auxiliary diesel generators + yellow busways',
        inputNode: '3.2MW Genset CAD Envelopes',
        processNode: 'Exhaust Scrubber & Overhead Conduit Alignment',
        outputNode: 'Dual Overhead Yellow Power Trunks',
        assignedZone: 'West Power Wing -> Center Hall',
        completed: false,
      },
      {
        id: 't-303',
        code: 'P3-T03',
        title: 'Model hot/cold aisle cooling airflow directions & CFD plumes',
        inputNode: '133kW/Row Thermal Dissipation Map',
        processNode: '3D Navier-Stokes CFD Plume Simulation',
        outputNode: 'Balanced Underfloor Damper Schedule',
        assignedZone: 'Center Server Hall & NE Chiller Room',
        completed: false,
      },
    ],
    microGear: [
      {
        id: 'mg-p3-1',
        assetId: 'PWR-UPS-02',
        name: 'Agastya Electrochemical Energy Array',
        phaseId: 'p3',
        tags: [
          { label: 'Thermal', value: 'Max 85°C Fluid', variant: 'amber' },
          { label: 'Voltage', value: '480V Line', variant: 'default' },
          { label: 'Protocol', value: 'SPI Redundancy', variant: 'blue' },
        ],
        specCategory: 'Electrochemical Energy Storage',
        description: '4.0MWh high-rate LiFePO4 battery storage array providing instantaneous zero-break ride-through during utility transfer.',
        status: 'Active Testing',
      },
      {
        id: 'mg-p3-2',
        assetId: 'GEN-CAT-3516',
        name: '3.2MW Twin-Turbo V16 Diesel Alternator Skid',
        phaseId: 'p3',
        tags: [
          { label: 'Power', value: '3,200 kVA', variant: 'default' },
          { label: 'Sync Time', value: '< 6.8s Sync', variant: 'emerald' },
          { label: 'Fuel Autonomy', value: '72h Tank', variant: 'cyan' },
        ],
        specCategory: 'Emergency Generation',
        description: 'N+1 backup generators coupled to overhead yellow busbars with Tier-4 Final SCR catalytic exhaust scrubbers.',
        status: 'Queued',
      },
      {
        id: 'mg-p3-3',
        assetId: 'CHL-MAG-1800',
        name: 'Magnetic-Bearing Centrifugal Chiller Skid',
        phaseId: 'p3',
        tags: [
          { label: 'Capacity', value: '1,800 Tons', variant: 'default' },
          { label: 'Supply Temp', value: '15.5°C Chilled', variant: 'cyan' },
          { label: 'PUE Impact', value: '1.15 Validated', variant: 'emerald' },
        ],
        specCategory: 'Thermal Heat Rejection',
        description: 'Dual oil-free chillers operating with adiabatic free-cooling economizer mode 78% of the annual cycle.',
        status: 'Queued',
      },
    ],
    specs: [
      {
        category: 'Primary & Backup Power',
        parameter: 'Twin-Turbo Diesel Gensets & UPS Matrix',
        specification: '2 × 3.2MW Caterpillar 3516E + 4.0MWh LiFePO4 UPS Cabinets',
        tolerance: '< 8.0 ms Transfer Switch',
      },
      {
        category: 'Power Distribution',
        parameter: 'Overhead Yellow Busway Conduits',
        specification: 'Dual 4,000A Copper Busducts (Feed A + Feed B) @ 415V/240V',
        tolerance: 'THD < 2.5% Harmonic Distortion',
      },
      {
        category: 'Thermal Containment',
        parameter: 'Pressurized Cold-Aisle & Chiller Plant',
        specification: '2 × 1,800T Magnetic Chillers · 16.0°C Supply / 30.2°C Return',
        tolerance: 'ASHRAE TC 9.9 A1 Recommended',
      },
    ],
    pillars: {
      scalability: 'Plug-and-play overhead busway tap-off boxes allow live rack upgrades from 20kW to 80kW.',
      reliability: '72-hour underground double-walled diesel belly tanks with automated fuel polishing.',
      security: 'Air-gapped Modbus/SCADA PLC network for generator synchronization and breaker control.',
      efficiency: 'Magnetic-bearing oil-free chillers + cold-aisle containment achieve validated 1.15 PUE.',
      compliance: 'NFPA 110 Level 1 Emergency Power & Uptime Institute Tier IV Fault-Tolerant Topology.',
    },
  },
  {
    id: 'p4',
    index: '04',
    shortName: 'Infra & Cabling',
    title: 'Phase 04: Infrastructure & Structured Cabling',
    desc: 'Zoning physical server cabinets, deploying overhead patch panels, optical raceways, and establishing the Network Operations Center layout.',
    constraints: '48 × 42U Cabinets · 400GbE Spine-Leaf · Zero Macro-Bend',
    status: 'Pending',
    metric: 'Network Topology Check',
    targetSystem: 'Simulation App Integration',
    color: 'border-slate-700 text-slate-500',
    tasks: [
      {
        id: 't-401',
        code: 'P4-T01',
        title: 'Map optical fiber underfloor tray tracks & overhead raceways',
        inputNode: 'Spine-Leaf Port Matrix (1,536 Ports)',
        processNode: 'Diverse East/West Tray Routing Solver',
        outputNode: 'Zero-Cross Overhead Raceway Blueprint',
        assignedZone: 'Center Hall Overhead Grid',
        completed: false,
      },
      {
        id: 't-402',
        code: 'P4-T02',
        title: 'Define rack-to-rack high-density copper & fiber patches',
        inputNode: 'Hardware BOM & Thermal Schedule',
        processNode: 'Center-of-Gravity & U-Slot Allocation',
        outputNode: 'Per-Rack 42U Elevation Schematics',
        assignedZone: 'Server Rows A, B, C, D',
        completed: false,
      },
      {
        id: 't-403',
        code: 'P4-T03',
        title: 'Setup multi-display consoles in NOC tracking room',
        inputNode: 'DCIM & BMS Telemetry Streams',
        processNode: 'KVM-over-IP Matrix & Ergonomics',
        outputNode: 'Operational NOC Command Deck',
        assignedZone: 'South-East NOC Wing',
        completed: false,
      },
    ],
    microGear: [
      {
        id: 'mg-p4-1',
        assetId: 'NET-SPN-400G',
        name: 'Nexus-Spine 400GbE Optical Switch (64-Port)',
        phaseId: 'p4',
        tags: [
          { label: 'Throughput', value: '25.6 Tbps', variant: 'cyan' },
          { label: 'Latency', value: '450ns Cut-thru', variant: 'emerald' },
          { label: 'Power', value: '1,450W', variant: 'default' },
        ],
        specCategory: 'Optical Network Fabric',
        description: 'Top-of-Rack high-throughput spine switch connecting Row A/B AI clusters to overhead blue fiber basket trays.',
        status: 'Active Testing',
      },
      {
        id: 'mg-p4-2',
        assetId: 'CDU-RACK-80K',
        name: 'In-Rack Liquid Coolant Distribution Unit (CDU)',
        phaseId: 'p4',
        tags: [
          { label: 'Capacity', value: '80kW Heat', variant: 'default' },
          { label: 'Flow Rate', value: '42 L/min', variant: 'cyan' },
          { label: 'Delta-P', value: '1.8 Bar', variant: 'emerald' },
        ],
        specCategory: 'Direct-to-Chip Thermal CDU',
        description: 'Negative-pressure closed-loop liquid manifold circulating dielectric PG25 coolant across 8-GPU blade heat exchangers.',
        status: 'Queued',
      },
      {
        id: 'mg-p4-3',
        assetId: 'NOC-CON-01',
        name: 'NOC Triple-Display Operator Ergonomic Console',
        phaseId: 'p4',
        tags: [
          { label: 'Displays', value: '3 × 4K IPS', variant: 'default' },
          { label: 'Feed', value: 'Dual 10G KVM', variant: 'blue' },
          { label: 'Airlock', value: 'Mantrap Sync', variant: 'emerald' },
        ],
        specCategory: 'Command & Control Telemetry',
        description: 'South-East wing command console monitoring real-time power, thermal PUE, breaker statuses, and network packet drops.',
        status: 'Queued',
      },
    ],
    specs: [
      {
        category: 'Rack Topology',
        parameter: '4-Row High-Density Server Matrix',
        specification: 'Rows A, B, C, D (12 × 42U 600mm×1200mm Racks per Row)',
        tolerance: '1,200mm Cold Aisle Pitch',
      },
      {
        category: 'Structured Cabling',
        parameter: 'Overhead Tiered Fiber & Copper Pathways',
        specification: 'Upper Yellow Tray (Power A/B) · Lower Blue Tray (OM5 & OS2 Single-Mode Fiber)',
        tolerance: 'Insertion Loss < 0.35 dB',
      },
      {
        category: 'NOC Control Room',
        parameter: 'Multi-Display Telemetry Wall & Operator Desk',
        specification: '4 × 55" 4K Wall Matrices + Dual 3-Monitor Ergonomic NOC Consoles',
        tolerance: '< 50 ms Telemetry Refresh',
      },
    ],
    pillars: {
      scalability: 'Pre-terminated MPO-24 fiber trunks support drop-in migration from 400GbE to 1.6TbE optics.',
      reliability: 'Physically separated A-Side and B-Side overhead fiber trays prevent single-point tray severing.',
      security: 'Biometric rack-door smart locks log every cabinet access event directly to the NOC wall.',
      efficiency: 'Brush-sealed cable cutouts and blanking panels in all unused U-slots prevent 99.2% bypass air leakage.',
      compliance: 'ANSI/TIA-568.3-D Optical Fiber Cabling & ISO/IEC 11801-5 Data Center Class I.',
    },
  },
  {
    id: 'p5',
    index: '05',
    shortName: 'Test & Handoff',
    title: 'Phase 05: Validation, Test & Final Delivery',
    desc: 'Running end-to-end load simulations, load testing power transfer shifts, compliance verification, and client Digital Twin handoff.',
    constraints: 'IST Level 5 · 6.4MW Load Bank · 99.995% Uptime Certified',
    status: 'Pending',
    metric: 'Uptime Certification',
    targetSystem: 'Simulation App Integration',
    color: 'border-slate-700 text-slate-500',
    tasks: [
      {
        id: 't-501',
        code: 'P5-T01',
        title: 'Run thermal load capacity simulations & chiller step tests',
        inputNode: '48 Portable Rack Load Banks (6.4MW)',
        processNode: 'Infrared Thermography & ΔT Verification',
        outputNode: 'Signed PUE 1.15 Thermal Certificate',
        assignedZone: 'Center Hall & NE Chiller Wing',
        completed: false,
      },
      {
        id: 't-502',
        code: 'P5-T02',
        title: 'Test generator failover automated switches & blackout pull',
        inputNode: 'Simulated Main Breaker Trip Signal',
        processNode: 'Auto-Start V16 Diesel Paralleling Sequence',
        outputNode: 'Zero-Interruption Waveform Log',
        assignedZone: 'West Power Wing',
        completed: false,
      },
      {
        id: 't-503',
        code: 'P5-T03',
        title: 'Verify global compliance standard markers & client handoff',
        inputNode: 'As-Built Redline Blueprints + Sensor Telemetry',
        processNode: 'Tier IV Fault-Tolerance Audit',
        outputNode: 'Operational Production Certificate',
        assignedZone: 'South-East NOC Command Center',
        completed: false,
      },
    ],
    microGear: [
      {
        id: 'mg-p5-1',
        assetId: 'LDB-RES-6400',
        name: 'Resistive/Reactive 6.4MW Commissioning Load Bank',
        phaseId: 'p5',
        tags: [
          { label: 'Step Load', value: '100% 48-Hour', variant: 'default' },
          { label: 'Voltage Sag', value: '< 2.1%', variant: 'emerald' },
          { label: 'Power Factor', value: '0.80 - 1.00', variant: 'cyan' },
        ],
        specCategory: 'Commissioning & Burn-In',
        description: 'Simulates maximum computational server heat rejection and sudden step-load transients across all 4 server rows.',
        status: 'Queued',
      },
      {
        id: 'mg-p5-2',
        assetId: 'STS-ISO-4000',
        name: 'Solid-State Static Transfer Switch (STS 4,000A)',
        phaseId: 'p5',
        tags: [
          { label: 'Transfer', value: '< 4.0ms Fast', variant: 'emerald' },
          { label: 'Phase Gate', value: '< 5° Sync', variant: 'default' },
          { label: 'Bypass', value: 'Dual Isolated', variant: 'amber' },
        ],
        specCategory: 'Power Protection Relaying',
        description: 'High-speed silicon-controlled rectifier transfer switch guaranteeing zero power dip to IT equipment during utility failure.',
        status: 'Queued',
      },
      {
        id: 'mg-p5-3',
        assetId: 'TWIN-API-GATE',
        name: 'ISO 19650 Digital Twin Telemetry Gateway',
        phaseId: 'p5',
        tags: [
          { label: 'Streams', value: '14,200 Tags', variant: 'cyan' },
          { label: 'Sync', value: '50ms Refresh', variant: 'emerald' },
          { label: 'Standard', value: 'BIM IFC-4', variant: 'default' },
        ],
        specCategory: 'Digital Twin Delivery',
        description: 'Production gateway linking physical BMS, Modbus, SNMP, and optical sensors into the interactive 3D digital model.',
        status: 'Queued',
      },
    ],
    specs: [
      {
        category: 'Load Bank Testing',
        parameter: 'Full-Capacity Thermal & Electrical Burn-In',
        specification: '6.40MW Continuous 48-Hour Heat & Step-Load Simulation',
        tolerance: 'Zero Voltage Sag > 3%',
      },
      {
        category: 'Failover Verification',
        parameter: 'Utility Pull-the-Plug Blackout Test',
        specification: 'Simulated Dual 13.8kV Grid Loss -> UPS Ride-Through -> Genset Sync',
        tolerance: 'Genset Online in 6.8s',
      },
      {
        category: 'Digital Twin Handoff',
        parameter: 'As-Built BIM + Live DCIM Telemetry Binding',
        specification: '100% Asset Barcode & Sensor UUID Calibration Package',
        tolerance: 'ISO 19650 Digital Twin Standard',
      },
    ],
    pillars: {
      scalability: 'Digital Twin baseline captures predictive headroom curves for next-gen 120kW AI rack upgrades.',
      reliability: '99.995% availability verified across 14 concurrent maintenance and fault-injection scenarios.',
      security: 'SOC 2 Type II, ISO 27001, and physical intrusion penetration testing signed off.',
      efficiency: 'Dynamic AI cooling loop tuning verified to save 4.2 GWh annually at 75% nominal load.',
      compliance: 'Uptime Institute Tier IV Constructed Facility Certification & ASHRAE 90.4 Energy Standard.',
    },
  },
];

export const INITIAL_LOGS: TelemetryLogEntry[] = [
  {
    id: 'log-1',
    timestamp: '2026-09-29 13:26:01',
    level: 'INIT',
    message: 'Core Python Orchestration Engine Initiated (Nexus-Grid v2.4).',
  },
  {
    id: 'log-2',
    timestamp: '2026-09-29 13:26:02',
    level: 'INFO',
    message: 'Component MG-8840-X1 successfully loaded from sketch data coordinates.',
  },
  {
    id: 'log-3',
    timestamp: '2026-09-29 13:26:03',
    level: 'INFO',
    message: 'Component PWR-UPS-02 secondary redundant SPI bus validation: OK.',
  },
  {
    id: 'log-4',
    timestamp: '2026-09-29 13:26:04',
    level: 'WARN',
    message: 'Thermal threshold limits monitoring set to 85°C maximum boundary.',
  },
  {
    id: 'log-5',
    timestamp: '2026-09-29 13:26:05',
    level: 'SUCCESS',
    message: 'Active phase advanced to: Phase 02 (Structural Engineering).',
  },
];

// =====================================================================
// MECHANICAL TORQUE & MATERIAL FATIGUE SIMULATION ENGINE
// =====================================================================

export interface MaterialProperties {
  yieldStrengthMpa: number;
  shearModulusGpa: number;
  fatigueExponentB: number;
  enduranceLimitMpa: number;
}

export const MATERIAL_REGISTRY: Record<string, MaterialProperties> = {
  Wootz_Bronze_Alloy: {
    yieldStrengthMpa: 450.0,
    shearModulusGpa: 40.0,
    fatigueExponentB: -0.08,
    enduranceLimitMpa: 210.0,
  },
  Structural_H_Steel: {
    yieldStrengthMpa: 250.0,
    shearModulusGpa: 79.3,
    fatigueExponentB: -0.12,
    enduranceLimitMpa: 125.0,
  },
};

export interface PhysicsNodeState {
  nodeId: string;
  name: string;
  radiusMm: number;
  teethCount: number;
  material: string;
  gearRatio: number;
  inputTorqueNm: number;
  outputTorqueNm: number;
  calculatedShearStressMpa: number;
  fatigueLifeRemainingCycles: number;
  safetyStatus: 'VALID' | 'HIGH_FATIGUE_RISK' | 'CRITICAL_SHEAR_FAILURE';
  applicationContext: string;
  stressRatioPct: number;
  operatingTemperatureC: number;
  thermalStatus: 'COOL_NOMINAL' | 'WARM_ELEVATED' | 'CRITICAL_THERMAL_ALERT';
}

export function calculateNodeMechanics(
  nodeId: string,
  name: string,
  radiusMm: number,
  teethCount: number,
  material: string,
  incomingTorqueNm: number,
  gearRatioMultiplier: number,
  operatingCycles: number = 1.2e5,
  applicationContext: string = 'Generator-cum-Battery Power Subsystem',
  speedRpm: number = 200
): PhysicsNodeState {
  const radiusM = radiusMm / 1000.0;
  const matProps = MATERIAL_REGISTRY[material] || MATERIAL_REGISTRY.Wootz_Bronze_Alloy;
  const outputTorqueNm = incomingTorqueNm * gearRatioMultiplier;

  // 1. Torsional Shear Stress: Tau = (2 * Torque) / (pi * r^3) in Pa, converted to MPa
  let calculatedShearStressMpa = 0.0;
  if (radiusM > 0) {
    calculatedShearStressMpa = ((2 * outputTorqueNm) / (Math.PI * Math.pow(radiusM, 3))) / 1e6;
  }

  // 2. Basquin's Cyclic Fatigue Life Equation: Stress_Amplitude = Endurance_Limit * (N)^b
  let fatigueLifeRemainingCycles = 1e7;
  if (calculatedShearStressMpa > 0) {
    const stressRatio = calculatedShearStressMpa / matProps.enduranceLimitMpa;
    if (stressRatio < 1.0) {
      fatigueLifeRemainingCycles = 1e7;
    } else {
      try {
        const calculatedN = Math.pow(stressRatio, 1.0 / matProps.fatigueExponentB);
        fatigueLifeRemainingCycles = Math.max(0, calculatedN - operatingCycles);
      } catch {
        fatigueLifeRemainingCycles = 0.0;
      }
    }
  }

  // 3. Dynamic Safety Gate Validation
  let safetyStatus: 'VALID' | 'HIGH_FATIGUE_RISK' | 'CRITICAL_SHEAR_FAILURE' = 'VALID';
  if (calculatedShearStressMpa > matProps.yieldStrengthMpa) {
    safetyStatus = 'CRITICAL_SHEAR_FAILURE';
  } else if (fatigueLifeRemainingCycles < 50000) {
    safetyStatus = 'HIGH_FATIGUE_RISK';
  } else {
    safetyStatus = 'VALID';
  }

  // 4. Thermal Dissipation & Stress Ratio Mapping
  const stressRatioPct = Number(
    Math.min(180, (calculatedShearStressMpa / matProps.yieldStrengthMpa) * 100).toFixed(1)
  );

  // Operating Temperature: Base ambient 24°C + friction & cyclic heat generated
  const thermalRise = (stressRatioPct * 0.58) * (speedRpm / 180);
  const operatingTemperatureC = Number((24.0 + thermalRise).toFixed(1));

  let thermalStatus: 'COOL_NOMINAL' | 'WARM_ELEVATED' | 'CRITICAL_THERMAL_ALERT' = 'COOL_NOMINAL';
  if (operatingTemperatureC >= 85.0 || stressRatioPct >= 90) {
    thermalStatus = 'CRITICAL_THERMAL_ALERT';
  } else if (operatingTemperatureC >= 60.0 || stressRatioPct >= 65) {
    thermalStatus = 'WARM_ELEVATED';
  } else {
    thermalStatus = 'COOL_NOMINAL';
  }

  return {
    nodeId,
    name,
    radiusMm,
    teethCount,
    material,
    gearRatio: gearRatioMultiplier,
    inputTorqueNm: Number(incomingTorqueNm.toFixed(2)),
    outputTorqueNm: Number(outputTorqueNm.toFixed(2)),
    calculatedShearStressMpa: Number(calculatedShearStressMpa.toFixed(2)),
    fatigueLifeRemainingCycles: Math.round(fatigueLifeRemainingCycles),
    safetyStatus,
    applicationContext,
    stressRatioPct,
    operatingTemperatureC,
    thermalStatus,
  };
}

export function runSimulationCascade(modifier: number): PhysicsNodeState[] {
  const baseTorque = 150.0 * modifier;

  // Node 1: Primary Drive Connection (Generator-cum-Battery Crankshaft Link)
  const node1 = calculateNodeMechanics(
    'MG-DRIVE-01',
    'Primary Hybrid Crankshaft Drive',
    12.5,
    24,
    'Wootz_Bronze_Alloy',
    baseTorque,
    1.0,
    1.2e5,
    'Generator-cum-Battery Hybrid Regulation'
  );

  // Node 2: Secondary Interconnect Gear Linkage (2:1 torque reduction mesh)
  const node2 = calculateNodeMechanics(
    'MG-TRANS-02',
    'Secondary Transmission Reducer',
    25.0,
    48,
    'Wootz_Bronze_Alloy',
    node1.outputTorqueNm,
    2.0,
    1.4e5,
    'Fluid Conveyor & Mechanical Pump Regulator'
  );

  // Node 3: Medical & Automation Robotics Joint Actuator (High Precision 45:1 Micro-Gear)
  const node3 = calculateNodeMechanics(
    'MG-ROBO-03',
    'Operating-Theater Robotic Articulation Joint',
    8.0,
    18,
    'Wootz_Bronze_Alloy',
    baseTorque * 0.4,
    1.75,
    0.8e5,
    'Modular Surgery Robotics Spatial Joint'
  );

  // Node 4: Structural Framework Load Redistribution Cam
  const node4 = calculateNodeMechanics(
    'STR-CAM-04',
    'Heavy Structural Dampening Cam',
    35.0,
    64,
    'Structural_H_Steel',
    node2.outputTorqueNm * 0.7,
    1.3,
    2.1e5,
    'Structural Steel Column Load Balancing'
  );

  return [node1, node2, node3, node4];
}

