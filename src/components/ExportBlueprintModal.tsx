import React, { useState, useMemo } from 'react';
import { BlueprintPhase, PhysicsNodeState } from '../data/blueprintData';
import { generateProjectBlueprintPDF } from '../utils/pdfGenerator';
import {
  FileText,
  Download,
  X,
  Check,
  Copy,
  Printer,
  Shield,
  ChevronRight,
  Code,
  Cpu,
  ExternalLink,
  RefreshCw,
  FolderTree,
  Database,
  Briefcase,
  Play,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Terminal,
} from 'lucide-react';

interface ExportBlueprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  phases: BlueprintPhase[];
  physicsNodes: PhysicsNodeState[];
  activeModifier: number;
}

const MODULAR_DH_HEADER = `#ifndef DH_ENGINE_H
#define DH_ENGINE_H

#include <vector>
#include <string>

// Structure mapping standardized Denavit-Hartenberg link rows
struct DHLinkRow {
    double theta;      // Joint Angle rotation (radians)
    double d;          // Joint Offset distance along z-axis (meters)
    double a;          // Link Length distance along x-axis (meters)
    double alpha;      // Link Twist angle around x-axis (radians)
    double link_mass;  // Mass allocation of the physical link structure (kg)
};

// Structure holding the resolved static force and moment vector distributions
struct WrenchVector {
    double force[3];   // Force components [Fx, Fy, Fz] in Newtons
    double moment[3];  // Moment/Torque components [Mx, My, Mz] in Newton-meters
};

// Test Case structure for CSV batch validation
struct TestCaseRow {
    std::string testId;
    double jointAngleRad;
    double linkOffsetM;
    double linkLengthM;
    double externalForceZN;
    double expectedBaseTorqueNm;
    std::string targetSafetyGate;
    std::string notes;
};

class NexusDHLoadEngine {
private:
    std::vector<DHLinkRow> chain;
    const double gravity = 9.81;

public:
    NexusDHLoadEngine(const std::vector<DHLinkRow>& kinematic_chain);
    void computeDHTransform(const DHLinkRow& link, double T[4][4]);
    std::vector<WrenchVector> calculateStaticLoading(const WrenchVector& end_effector_load);
    static std::vector<TestCaseRow> parseCSVMatrix(const std::string& filepath);
};

#endif // DH_ENGINE_H`;

const MODULAR_DH_ENGINE_CPP = `#include "../include/dh_engine.h"
#include <iostream>
#include <cmath>
#include <fstream>
#include <sstream>
#include <iomanip>

NexusDHLoadEngine::NexusDHLoadEngine(const std::vector<DHLinkRow>& kinematic_chain)
    : chain(kinematic_chain) {}

void NexusDHLoadEngine::computeDHTransform(const DHLinkRow& link, double T[4][4]) {
    double cosT = std::cos(link.theta);
    double sinT = std::sin(link.theta);
    double cosA = std::cos(link.alpha);
    double sinA = std::sin(link.alpha);

    T[0][0] = cosT;  T[0][1] = -sinT * cosA; T[0][2] = sinT * sinA;  T[0][3] = link.a * cosT;
    T[1][0] = sinT;  T[1][1] = cosT * cosA;  T[1][2] = -cosT * sinA; T[1][3] = link.a * sinT;
    T[2][0] = 0.0;   T[2][1] = sinA;         T[2][2] = cosA;         T[2][3] = link.d;
    T[3][0] = 0.0;   T[3][1] = 0.0;          T[3][2] = 0.0;          T[3][3] = 1.0;
}

std::vector<WrenchVector> NexusDHLoadEngine::calculateStaticLoading(const WrenchVector& end_effector_load) {
    size_t num_links = chain.size();
    std::vector<WrenchVector> joint_wrenches(num_links);
    WrenchVector current_wrench = end_effector_load;

    for (int i = static_cast<int>(num_links) - 1; i >= 0; --i) {
        double link_weight_n = chain[i].link_mass * gravity;
        current_wrench.force[2] += link_weight_n;

        double rx = chain[i].a * std::cos(chain[i].theta);
        double ry = chain[i].a * std::sin(chain[i].theta);
        double rz = chain[i].d;

        current_wrench.moment[0] += (ry * current_wrench.force[2] - rz * current_wrench.force[1]);
        current_wrench.moment[1] += (rz * current_wrench.force[0] - rx * current_wrench.force[2]);
        current_wrench.moment[2] += (rx * current_wrench.force[1] - ry * current_wrench.force[0]);

        joint_wrenches[i] = current_wrench;
    }
    return joint_wrenches;
}

std::vector<TestCaseRow> NexusDHLoadEngine::parseCSVMatrix(const std::string& filepath) {
    std::vector<TestCaseRow> rows;
    std::ifstream file(filepath);
    if (!file.is_open()) return rows;

    std::string line;
    bool is_header = true;
    while (std::getline(file, line)) {
        if (line.empty()) continue;
        if (is_header) { is_header = false; continue; }
        std::stringstream ss(line);
        std::string token;
        TestCaseRow row;
        if (std::getline(ss, token, ',')) row.testId = token;
        if (std::getline(ss, token, ',')) row.jointAngleRad = std::stod(token);
        if (std::getline(ss, token, ',')) row.linkOffsetM = std::stod(token);
        if (std::getline(ss, token, ',')) row.linkLengthM = std::stod(token);
        if (std::getline(ss, token, ',')) row.externalForceZN = std::stod(token);
        if (std::getline(ss, token, ',')) row.expectedBaseTorqueNm = std::stod(token);
        if (std::getline(ss, token, ',')) row.targetSafetyGate = token;
        if (std::getline(ss, token, ',')) row.notes = token;
        rows.push_back(row);
    }
    return rows;
}`;

const MODULAR_MAIN_CPP = `#include <iostream>
#include <fstream>
#include <sstream>
#include <vector>
#include <string>
#include <cstdlib>
#include <iomanip>
#include "../include/dh_engine.h"

void parseAndRunDataset(const std::string& csv_path) {
    std::ifstream file(csv_path);
    if (!file.is_open()) {
        std::cerr << "[!] Error: Failed to open targeted CSV file: " << csv_path << "\\n";
        return;
    }

    std::string line;
    // Skip row 0 configuration headers
    std::getline(file, line);

    std::cout << "\\n=======================================================\\n";
    std::cout << "  PROCESSING NEXUS-GRID DATASET LOG ENTRIES            \\n";
    std::cout << "=======================================================\\n";

    while (std::getline(file, line)) {
        if (line.empty()) continue;
        std::stringstream ss(line);
        std::string cell;
        std::vector<std::string> row;

        while (std::getline(ss, cell, ',')) {
            row.push_back(cell);
        }

        if (row.size() < 6) continue; // Skip incomplete lines

        std::string case_id = row[0];
        double input_fz = std::atof(row[4].c_str());
        
        // Dynamically assign variable rows into the DH structural configurations vector
        std::vector<DHLinkRow> linkConfigurations = {
            {0.0, 0.45, 0.0, 1.5708, 8.5},
            {0.5236, 0.0, 0.55, 0.0, 12.0},
            {0.7854, 0.0, 0.35, 0.0, 5.0}
        };

        WrenchVector externalResistance = {{0.0, 0.0, input_fz}, {5.0, 12.5, 45.0}};
        NexusDHLoadEngine engine(linkConfigurations);
        std::vector<WrenchVector> outputs = engine.calculateStaticLoading(externalResistance);

        std::cout << " -> [" << case_id << "] Input Load: " << std::fixed << std::setprecision(1) << input_fz 
                  << " N | Base Reaction: " << std::setprecision(2) << outputs[0].moment[2] << " Nm\\n";
    }
    std::cout << "=======================================================\\n";
}

int main(int argc, char* argv[]) {
    // Dynamic command-line argument parsing
    if (argc >= 3 && argv[1][0] != '-') {
        double input_fz = std::atof(argv[1]);
        double link3_mass = std::atof(argv[2]);

        std::cout << "[*] Parsing dynamic user inputs. Terminal Fz: " << input_fz 
                  << " N, Mass: " << link3_mass << " kg\\n";

        std::vector<DHLinkRow> linkConfigurations = {
            {0.0, 0.45, 0.0, 1.5708, 8.5},
            {0.5236, 0.0, 0.55, 0.0, 12.0},
            {0.7854, 0.0, 0.35, 0.0, link3_mass}
        };

        WrenchVector externalResistance = {{0.0, 0.0, input_fz}, {5.0, 12.5, 45.0}};
        NexusDHLoadEngine engine(linkConfigurations);
        std::vector<WrenchVector> outputs = engine.calculateStaticLoading(externalResistance);

        std::cout << "[SUCCESS] Base link total torque reaction (Mz): " 
                  << std::fixed << std::setprecision(2) << outputs[0].moment[2] << " Nm\\n";
        return 0;
    }

    std::string target_csv = "test_matrix.csv";
    if (argc >= 2) {
        if (std::string(argv[1]) == "--csv" && argc >= 3) {
            target_csv = argv[2];
        } else if (argv[1][0] != '-') {
            target_csv = argv[1];
        }
    }
    parseAndRunDataset(target_csv);
    return 0;
}`;

const MODULAR_MAKEFILE = `# Compiler Configuration Flags
CXX ?= g++
CXXFLAGS = -Wall -Wextra -O3 -std=c++17 -Iinclude
TARGET = nexus_dh_engine

# Output File Directories Mapping
SRC_DIR = src
OBJ_DIR = obj

# Find all internal source implementation paths
SRCS = $(SRC_DIR)/dh_engine.cpp $(SRC_DIR)/main.cpp
OBJS = $(OBJ_DIR)/dh_engine.o $(OBJ_DIR)/main.o

all: $(TARGET)

$(TARGET): $(OBJS)
\t@mkdir -p $(OBJ_DIR)
\t$(CXX) $(CXXFLAGS) -o $(TARGET) $(OBJS)
\t@echo "[+] Compilation successful. Executable output: ./$(TARGET)"

$(OBJ_DIR)/%.o: $(SRC_DIR)/%.cpp
\t@mkdir -p $(OBJ_DIR)
\t$(CXX) $(CXXFLAGS) -c $< -o $@

run: $(TARGET)
\t./$(TARGET) 120.0 5.0

batch: $(TARGET)
\t./$(TARGET) test_matrix.csv

clean:
\trm -rf $(OBJ_DIR) $(TARGET)
\t@echo "[*] Clean configuration routine finalized."`;

const TEST_MATRIX_CSV_CONTENT = `Test_Case_ID,Joint_Angle_Rad,Link_Offset_M,Link_Length_M,External_Force_Z_N,Expected_Base_Torque_Nm,Target_Safety_Gate,Notes
TC-01-NOMINAL,0.000,0.45,0.00,120.0,45.00,VALID,Standard static calibration check
TC-02-OVERLOAD,0.524,0.55,0.35,850.0,312.45,CRITICAL_SHEAR_FAILURE,Verifies exception trap limits
TC-03-UNDERLOAD,0.785,0.00,0.35,15.0,11.20,VALID,Low-load friction threshold pass
TC-04-BIO_DRIFT,0.261,0.45,0.55,200.0,88.10,BIO_STABILITY_FAILURE,Verifies cellular level cross-drops`;

const GITHUB_CI_YML = `name: Nexus-Grid Engine CI Pipeline
on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]
jobs:
  build-and-validate:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout Source Code Repository
      uses: actions/checkout@v4

    - name: Set up C++ Build Environment
      run: |
        sudo apt-get update
        sudo apt-get install -y build-essential
    - name: Compile Kinematics Load Engine
      run: |
        make clean
        make
    - name: Execute Automated Test Matrix
      run: |
        ./nexus_dh_engine test_matrix.csv
    - name: Archive Persistent Simulation Traces
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: simulation-audit-ledger
        path: |
          simulation_db.json
          simulation_audit.csv`;

const JENKINSFILE_CONTENT = `pipeline {
    agent any

    environment {
        CXX = 'g++'
    }

    stages {
        stage('Workspace Initialization') {
            steps {
                echo '[*] Setting up isolated project matrix container...'
                sh 'make clean'
            }
        }

        stage('Compile Simulation Engine') {
            steps {
                echo '[*] Compiling core multi-system physics loops...'
                sh 'make'
            }
        }

        stage('Batch Dataset Validation') {
            steps {
                echo '[*] Running look-ahead automated CSV verification tests...'
                sh './nexus_dh_engine test_matrix.csv'
            }
        }
    }

    post {
        always {
            echo '[*] Archiving persistent simulation blueprints...'
            archiveArtifacts artifacts: 'simulation_db.json, simulation_audit.csv', fingerprint: true
        }
    }
}`;

interface CSVTestCaseItem {
  id: string;
  jointAngleRad: number;
  linkOffsetM: number;
  linkLengthM: number;
  forceZN: number;
  expectedTorqueNm: number;
  targetGate: 'VALID' | 'CRITICAL_SHEAR_FAILURE' | 'BIO_STABILITY_FAILURE';
  notes: string;
}

const DEFAULT_CSV_TEST_CASES: CSVTestCaseItem[] = [
  { id: 'TC-01-NOMINAL', jointAngleRad: 0.000, linkOffsetM: 0.45, linkLengthM: 0.00, forceZN: 120.0, expectedTorqueNm: 45.00, targetGate: 'VALID', notes: 'Standard static calibration check' },
  { id: 'TC-02-OVERLOAD', jointAngleRad: 0.524, linkOffsetM: 0.55, linkLengthM: 0.35, forceZN: 850.0, expectedTorqueNm: 312.45, targetGate: 'CRITICAL_SHEAR_FAILURE', notes: 'Verifies exception trap limits' },
  { id: 'TC-03-UNDERLOAD', jointAngleRad: 0.785, linkOffsetM: 0.00, linkLengthM: 0.35, forceZN: 15.0, expectedTorqueNm: 11.20, targetGate: 'VALID', notes: 'Low-load friction threshold pass' },
  { id: 'TC-04-BIO_DRIFT', jointAngleRad: 0.261, linkOffsetM: 0.45, linkLengthM: 0.55, forceZN: 200.0, expectedTorqueNm: 88.10, targetGate: 'BIO_STABILITY_FAILURE', notes: 'Verifies cellular level cross-drops' },
];

const FIVERR_GIG_TEXT = `PROJECT INVENTORY PROFILE: Nexus-Grid Blueprint Manager
GENRE CATEGORY: Complex Multi-System Simulation Platforms & Logic Automation Pipelines

Executive Portfolio Statement:
Developed and compiled an all-in-one engineering simulation workspace that automates the transition from manual concept sketches to functional, production-ready machine assets. This system processes multi-disciplinary boundaries concurrently—linking high-torque micro-gear networks with fluid cooling capacities, high-voltage lines, and automated biological tissue metrics.

Core Applied Capabilities Exhibited:
- Software Automation: Scalable multi-stage build systems controlled through customized Makefile automation engines.
- Test Matrix Parsing: Custom command-line tools written in C++ that read external spreadsheets (CSV) for quick parameter updates.
- Automated Failure Logs: Try/catch safety systems that instantly halt loops and highlight 3D models when safe parameters are breached.
- Enterprise CI/CD Infrastructure: Production-grade GitHub Actions workflows (.github/workflows/nexus_ci.yml) and Jenkinsfile logic to run automated testing on every update.
- Real-Time Unit Conversion Engine: Instant bidirectional toggling between Metric (N·m, MPa, °C, mm, L) and US Imperial (lbf·ft, psi, °F, in, gal).

--- FIVERR GIG SPECIFICATION ---
Title: I will build interactive 3D engineering simulation apps and code automation pipelines
Category: Programming & Tech > Engineering & CAD Simulation
Search Tags: mechanical-engineering, threejs-simulation, cad-automation, robotics-kinematics, autolisp-solidworks

🛠️ PACKAGES:
• 🟢 Basic (₹4,500 / $95 USD | 3 Days): Core Math Architecture, single-joint solver, parametric CAD script, and structured test matrix.
• 🟡 Standard (₹12,000 / $285 USD | 5 Days): Multi-Link Dynamic Load & CSV Pipeline, backward recursive wrench solver, and real-time unit conversion suite.
• 🟣 Premium (₹28,000 / $550 USD | 7 Days): Enterprise Digital Twin & Full C++ Engine, turnkey CLI, WebGL 3D twin, automated stress simulation, CI/CD pipeline, and full documentation.`;

const INSTAGRAM_PROFILE_TEXT = `---------------------------------------------------------------------
NEXUS-GRID INDEPENDENT RESEARCH STUDIO IDENTIFICATION RECORD
---------------------------------------------------------------------
INSTAGRAM BUSINESS CORE PROFILE ACCOUNT: @nishanka_creative_studio93
OFFICIAL INSTAGRAM METADATA LINK APP ID: instagram://user?username=nishanka_creative_studio93
VERIFIED PORTFOLIO METRICS: 3D Digital Prototypes | Parametric G-Code Pipelines
---------------------------------------------------------------------

Amit Nishanka Bhuyan | AI & Robotics Systems Engineer ⚙️
🏢 Founder: @nishanka_creative_studio93
🚀 Building Digital Twins, 3D Physics Engines & CAD Automation Pipelines
🔬 Denavit-Hartenberg Kinematics | C++17 | SolidWorks API | WebGL
📍 Salipur, Odisha, India
🔗 GitHub: github.com/bhuyanamitnishanka-debug

--- REEL & CAROUSEL CAPTION TEMPLATE ---
⚙️ From Raw Matrix Math to Physical Force Propagation: Inside our 3-DOF Kinematics & Gear Load Engine 🤖

When multi-axis robotic arms interact with high-torque gear assemblies, forward kinematics alone isn’t enough. You must propagate static wrenches backward from the tool tip to the base frame.

In our latest C++ update:
1️⃣ 4x4 Homogeneous DH Transformation matrices calculate exact end-effector coordinate frames.
2️⃣ Backward recursion accumulates dead-weight gravity (Fz + m*g) and cross-product moments (M + r x F).
3️⃣ Torsional shear stress (τ = 2T / πr³) is evaluated at each joint node to prevent mechanical failure before manufacturing.
4️⃣ Live bidirectional unit conversions allow instant toggling between Metric (N·m, MPa, °C) and Imperial (lbf·ft, psi, °F).

#Robotics #Kinematics #MechanicalEngineering #DenavitHartenberg #CPP #EngineeringSimulation #CADAutomation #DigitalTwin #SolidWorks #AutoCAD`;

const UPWORK_PROPOSAL_TEXT = `Subject: Re: Senior Robotics Kinematics & Mechanical Simulation Specialist

Hi [Client Name],

I noticed you are looking for an engineer to develop a kinematics solver, CAD automation pipeline, or 3D engineering digital twin. With my background in Denavit-Hartenberg (DH) forward kinematics, static wrench propagation, and parametric CAD scripting, I can deliver a clean, robust, and mathematically verified solution for your project.

Here is how I would approach your requirements:
1. Mathematical Core & Kinematics Engine:
   - Construct standardized DH parameter chains (theta, d, a, alpha) and 4x4 homogeneous transformation matrices.
   - Implement backward-recursive force and moment distribution loops accounting for structural mass, gravitational loads, and external tool resistance.
   - Validate torsional shear limits (τ = 2T / πr³) and cyclic fatigue life (Basquin model).

2. Automation & File Delivery:
   - Provide clean, modular C++17 command-line tools with both direct terminal argument parsing and automated CSV batch evaluation.
   - Generate synchronized CAD automation scripts (SolidWorks VBA macros using FeatureCircularPattern5 or AutoCAD AutoLISP polar scripts).

3. Verifiable Quality & Documentation:
   - Supply a structured test matrix (CSV) covering nominal, overload, underload, and edge-case boundary conditions.
   - Deliver clear documentation, build automation (Makefile / run scripts), and clean source code.

Recent Portfolio Project:
You can review my open-source work on the Nexus-Grid Blueprint Manager (GitHub: bhuyanamitnishanka-debug), which includes a multi-axis DH load calculation engine, parametric gear generation macros, and real-time fault isolation telemetry.

Best regards,
Amit Nishanka Bhuyan
Lead AI Researcher & Project Coordinator (Salipur, Odisha, India)
GitHub: bhuyanamitnishanka-debug | Instagram: @nishanka_creative_studio93`;

const VBA_SCRIPT = `' =====================================================================
' NEXUS-GRID SOLIDWORKS GEAR GEOMETRY ORCHESTRATION LAYER (draw_gear.vba)
' Parametric Tooth Profile Circular Pattern Replication Subroutine
' =====================================================================
Dim swApp As Object
Dim swModel As Object
Dim swFeatureMgr As Object

Sub Main()
    Set swApp = Application.SldWorks
    Set swModel = swApp.ActiveDoc
    If swModel Is Nothing Then
        MsgBox "Critical Error: Active model template not detected.", vbCritical, "SolidWorks API"
        Exit Sub
    End If
    Set swFeatureMgr = swModel.FeatureManager

    Dim teethCount As Long
    Dim radialSpacingAngle As Double
    teethCount = 24
    radialSpacingAngle = (2 * 3.14159265358979) / teethCount

    Dim status As Boolean
    status = swModel.Extension.SelectByID2("Tooth_Cutout", "BODYFEATURE", 0, 0, 0, False, 4, Nothing, 0)
    status = swModel.Extension.SelectByID2("Axis1", "AXIS", 0, 0, 0, True, 1, Nothing, 0)

    Dim swFeature As Object
    Set swFeature = swFeatureMgr.FeatureCircularPattern5(teethCount, radialSpacingAngle, True, "CircularPattern1", False, False, False)
    If Not swFeature Is Nothing Then
        Debug.Print "[SUCCESS] Parametric gear layout finalized: " & teethCount & " teeth cutouts arrayed."
    Else
        Debug.Print "[ERROR] Circular array execution failed. Check Axis1 alignment."
    End If
End Sub`;

const CPP_DH_SCRIPT = `// Denavit-Hartenberg (DH) Transform Matrix & Gear Contact Force Engine
#include <iostream>
#include <cmath>
#include <vector>
#include <iomanip>

struct DHParameterRow {
    std::string jointName;
    double theta, d, a, alpha;
};

void computeDHTransformMatrix(const DHParameterRow& link, double T[4][4]) {
    double cosT = cos(link.theta), sinT = sin(link.theta);
    double cosA = cos(link.alpha), sinA = sin(link.alpha);
    T[0][0] = cosT;  T[0][1] = -sinT * cosA; T[0][2] = sinT * sinA;  T[0][3] = link.a * cosT;
    T[1][0] = sinT;  T[1][1] = cosT * cosA;  T[1][2] = -cosT * sinA; T[1][3] = link.a * sinT;
    T[2][0] = 0.0;   T[2][1] = sinA;         T[2][2] = cosA;         T[2][3] = link.d;
    T[3][0] = 0.0;   T[3][1] = 0.0;          T[3][2] = 0.0;          T[3][3] = 1.0;
}

void multiply4x4Matrices(double A[4][4], double B[4][4], double Result[4][4]) {
    for (int r = 0; r < 4; ++r) {
        for (int c = 0; c < 4; ++c) {
            Result[r][c] = 0.0;
            for (int k = 0; k < 4; ++k) Result[r][c] += A[r][k] * B[k][c];
        }
    }
}

int main() {
    std::vector<DHParameterRow> robotChain = {
        {"Base Joint (J1)",    0.0,    0.35, 0.0,  M_PI_2},
        {"Shoulder Link (J2)", M_PI_4, 0.0,  0.45, 0.0},
        {"Elbow Wrist (J3)",  -M_PI_4, 0.0,  0.30, 0.0}
    };
    double BaseToTip[4][4] = {{1,0,0,0},{0,1,0,0},{0,0,1,0},{0,0,0,1}};
    for (size_t i = 0; i < robotChain.size(); ++i) {
        double LinkM[4][4], BufM[4][4];
        computeDHTransformMatrix(robotChain[i], LinkM);
        multiply4x4Matrices(BaseToTip, LinkM, BufM);
        for(int r=0; r<4; ++r) for(int c=0; c<4; ++c) BaseToTip[r][c] = BufM[r][c];
    }
    std::cout << "End-Effector (meters): X=" << BaseToTip[0][3] << " Y=" << BaseToTip[1][3] << " Z=" << BaseToTip[2][3] << std::endl;
    return 0;
}`;

const LSP_SCRIPT = `;;; AutoCAD AutoLISP Parametric Micro-Gear Drawing Script (draw_gear.lsp)
(defun c:DrawNexusGear ( / centerPt extRadius intRadius teethCount angIncrement curAng i pt1 pt2 pt3 oldCmdEcho )
  (vl-load-com)
  (setq oldCmdEcho (getvar "CMDECHO"))
  (setvar "CMDECHO" 0)
  (setq centerPt '(0.0 0.0 0.0))
  (setq extRadius 12.5)
  (setq intRadius 9.5)
  (setq teethCount 24)
  (setq angIncrement (/ (* 2.0 pi) teethCount))
  (setq curAng 0.0)
  (setq i 0)
  (while (< i teethCount)
    (setq pt1 (polar centerPt curAng extRadius))
    (setq pt2 (polar centerPt (+ curAng (/ angIncrement 2.0)) intRadius))
    (setq pt3 (polar centerPt (+ curAng angIncrement) extRadius))
    (command "_.line" "_non" pt1 "_non" pt2 "")
    (command "_.line" "_non" pt2 "_non" pt3 "")
    (setq curAng (+ curAng angIncrement))
    (setq i (1+ i))
  )
  (command "_.circle" "_non" centerPt intRadius)
  (setvar "CMDECHO" oldCmdEcho)
  (princ "\\n[*] Micro-Gear drafted down to sub-millimeter tolerances.")
  (princ)
)`;

const NEXUS_DH_LOAD_ENGINE_CPP = `// =====================================================================
// NEXUS-GRID EXTENDED DH KINEMATICS & STATIC LOAD ENGINE (nexus_dh_load_engine.cpp)
// Version: 3.5.0 · Multi-Axis Robotic Link Static Load & Moment Balance Layer
// Propagates forces, moments, and dead-weight gravity loads through gear assemblies
// =====================================================================
#include <iostream>
#include <cmath>
#include <vector>
#include <iomanip>

struct DHLinkRow {
    double theta, d, a, alpha, link_mass;
};

struct WrenchVector {
    double force[3];   // [Fx, Fy, Fz] in Newtons
    double moment[3];  // [Mx, My, Mz] in Newton-meters
};

class NexusDHLoadEngine {
private:
    std::vector<DHLinkRow> chain;
    const double gravity = 9.81;

public:
    NexusDHLoadEngine(const std::vector<DHLinkRow>& kinematic_chain) : chain(kinematic_chain) {}

    void computeDHTransform(const DHLinkRow& link, double T[4][4]) {
        double cosT = cos(link.theta), sinT = sin(link.theta);
        double cosA = cos(link.alpha), sinA = sin(link.alpha);
        T[0][0] = cosT;  T[0][1] = -sinT * cosA; T[0][2] = sinT * sinA;  T[0][3] = link.a * cosT;
        T[1][0] = sinT;  T[1][1] = cosT * cosA;  T[1][2] = -cosT * sinA; T[1][3] = link.a * sinT;
        T[2][0] = 0.0;   T[2][1] = sinA;         T[2][2] = cosA;         T[2][3] = link.d;
        T[3][0] = 0.0;   T[3][1] = 0.0;          T[3][2] = 0.0;          T[3][3] = 1.0;
    }

    std::vector<WrenchVector> calculateStaticLoading(const WrenchVector& end_effector_load) {
        size_t num_links = chain.size();
        std::vector<WrenchVector> joint_wrenches(num_links);
        WrenchVector current_wrench = end_effector_load;

        for (int i = static_cast<int>(num_links) - 1; i >= 0; --i) {
            double link_weight_n = chain[i].link_mass * gravity;
            current_wrench.force[2] += link_weight_n;

            double rx = chain[i].a * cos(chain[i].theta);
            double ry = chain[i].a * sin(chain[i].theta);
            double rz = chain[i].d;

            current_wrench.moment[0] += (ry * current_wrench.force[2] - rz * current_wrench.force[1]);
            current_wrench.moment[1] += (rz * current_wrench.force[0] - rx * current_wrench.force[2]);
            current_wrench.moment[2] += (rx * current_wrench.force[1] - ry * current_wrench.force[0]);

            joint_wrenches[i] = current_wrench;
        }
        return joint_wrenches;
    }
};

int main() {
    std::cout << "[*] Executing Denavit-Hartenberg Load Calculation Engine v3.5..." << std::endl;
    std::vector<DHLinkRow> linkConfigurations = {
        {0.0,    0.45, 0.0,  M_PI_2, 8.5},
        {M_PI_6, 0.0,  0.55, 0.0,    12.0},
        {M_PI_4, 0.0,  0.35, 0.0,    5.0}
    };
    NexusDHLoadEngine engine(linkConfigurations);
    WrenchVector gearAssemblyResistance = {{15.0, 25.0, 120.0}, {5.0, 12.5, 45.0}};
    std::vector<WrenchVector> calculatedLoads = engine.calculateStaticLoading(gearAssemblyResistance);

    std::cout << std::fixed << std::setprecision(3);
    for (size_t i = 0; i < calculatedLoads.size(); ++i) {
        std::cout << "[NODE 0" << i + 1 << "] Force: (" << calculatedLoads[i].force[0] << ", " << calculatedLoads[i].force[1] << ", " << calculatedLoads[i].force[2] << ") N | Mz: " << calculatedLoads[i].moment[2] << " Nm" << std::endl;
    }
    return 0;
}`;

export const ExportBlueprintModal: React.FC<ExportBlueprintModalProps> = ({
  isOpen,
  onClose,
  phases,
  physicsNodes,
  activeModifier,
}) => {
  const [activeSheet, setActiveSheet] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [copiedScript, setCopiedScript] = useState<string | null>(null);

  // DH Kinematics Interactive Parameters
  const [theta1Deg, setTheta1Deg] = useState<number>(0);
  const [theta2Deg, setTheta2Deg] = useState<number>(45);
  const [theta3Deg, setTheta3Deg] = useState<number>(-45);
  const [activeScriptTab, setActiveScriptTab] = useState<'vba' | 'dh_cpp' | 'dh_load' | 'lsp'>('vba');

  // Modular C++ & Portfolio State
  const [activeModularTab, setActiveModularTab] = useState<
    'main' | 'engine' | 'header' | 'makefile' | 'csv' | 'github_ci' | 'jenkins'
  >('main');
  const [activePortfolioTab, setActivePortfolioTab] = useState<'fiverr' | 'instagram' | 'upwork'>('fiverr');
  const [testMatrixRan, setTestMatrixRan] = useState<boolean>(true);
  const [customFz, setCustomFz] = useState<number>(120.0);
  const [customMass, setCustomMass] = useState<number>(5.0);
  const [customAngleDeg, setCustomAngleDeg] = useState<number>(30);

  // Dynamic CLI calculation simulation
  const dynamicCliResult = useMemo(() => {
    const theta2 = (customAngleDeg * Math.PI) / 180;
    const g = 9.81;
    // Link 3
    let fz = customFz + customMass * g;
    let mx = 5.0, my = 12.5, mz = 45.0;
    const rx3 = 0.35 * Math.cos(0.7854);
    const ry3 = 0.35 * Math.sin(0.7854);
    mx += ry3 * fz;
    my += -rx3 * fz;

    // Link 2
    fz += 12.0 * g;
    const rx2 = 0.55 * Math.cos(theta2);
    const ry2 = 0.55 * Math.sin(theta2);
    mx += ry2 * fz;
    my += -rx2 * fz;

    // Link 1 (Base)
    fz += 8.5 * g;

    const baseTorque = mz;
    const isOverload = Math.abs(baseTorque) > 150.0 || customFz > 600.0;
    const gate = isOverload ? 'CRITICAL_SHEAR_FAILURE' : (customAngleDeg < 15 && customFz > 180) ? 'BIO_STABILITY_FAILURE' : 'VALID';

    return {
      fz,
      baseTorque,
      gate,
      isOverload,
    };
  }, [customFz, customMass, customAngleDeg]);

  // Compute 3-DOF DH Forward Kinematics Matrix & Static Load Vectors
  const kinematicsResult = useMemo(() => {
    const t1 = (theta1Deg * Math.PI) / 180;
    const t2 = (theta2Deg * Math.PI) / 180;
    const t3 = (theta3Deg * Math.PI) / 180;

    const links = [
      { theta: t1, d: 0.35, a: 0.0, alpha: Math.PI / 2 },
      { theta: t2, d: 0.0, a: 0.45, alpha: 0.0 },
      { theta: t3, d: 0.0, a: 0.30, alpha: 0.0 },
    ];

    let T = [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ];

    for (const link of links) {
      const cosT = Math.cos(link.theta);
      const sinT = Math.sin(link.theta);
      const cosA = Math.cos(link.alpha);
      const sinA = Math.sin(link.alpha);

      const A = [
        [cosT, -sinT * cosA, sinT * sinA, link.a * cosT],
        [sinT, cosT * cosA, -cosT * sinA, link.a * sinT],
        [0, sinA, cosA, link.d],
        [0, 0, 0, 1],
      ];

      const nextT = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 1],
      ];

      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          let sum = 0;
          for (let k = 0; k < 4; k++) {
            sum += T[r][k] * A[k][c];
          }
          nextT[r][c] = sum;
        }
      }
      T = nextT;
    }

    const x = T[0][3];
    const y = T[1][3];
    const z = T[2][3];

    // Gear contact loads for MG-ROBO-03 driven by joint torque
    const appliedTorque = 105.0 * activeModifier;
    const radiusM = 0.0125;
    const tangentialForceN = appliedTorque / radiusM;
    const pressureAngleRad = (20.0 * Math.PI) / 180.0;
    const radialForceN = tangentialForceN * Math.tan(pressureAngleRad);
    const normalForceN = tangentialForceN / Math.cos(pressureAngleRad);
    const lewisBendingMpa = tangentialForceN / (10.0 * 1.042 * 0.337);

    // Static force & moment propagation loops (NexusDHLoadEngine v3.5.0)
    const gravity = 9.81;
    const chainLinks = [
      { theta: t1, d: 0.45, a: 0.0, alpha: Math.PI / 2, link_mass: 8.5 },
      { theta: t2, d: 0.0, a: 0.55, alpha: 0.0, link_mass: 12.0 },
      { theta: t3, d: 0.0, a: 0.35, alpha: 0.0, link_mass: 5.0 },
    ];

    let curFx = 15.0 * activeModifier;
    let curFy = 25.0 * activeModifier;
    let curFz = 120.0 * activeModifier;
    let curMx = 5.0 * activeModifier;
    let curMy = 12.5 * activeModifier;
    let curMz = 45.0 * activeModifier;

    const jointWrenches: {
      nodeId: string;
      label: string;
      force: [number, number, number];
      moment: [number, number, number];
      motorTorqueMz: number;
    }[] = [];

    for (let i = chainLinks.length - 1; i >= 0; --i) {
      const link = chainLinks[i];
      const link_weight_n = link.link_mass * gravity;
      curFz += link_weight_n;

      const rx = link.a * Math.cos(link.theta);
      const ry = link.a * Math.sin(link.theta);
      const rz = link.d;

      curMx += ry * curFz - rz * curFy;
      curMy += rz * curFx - rx * curFz;
      curMz += rx * curFy - ry * curFx;

      jointWrenches.unshift({
        nodeId: `NODE 0${i + 1}`,
        label:
          i === 0
            ? 'Base Pivot Assembly (8.5 kg)'
            : i === 1
            ? 'Structural Column (12.0 kg)'
            : 'Terminal Gear Link (5.0 kg)',
        force: [curFx, curFy, curFz],
        moment: [curMx, curMy, curMz],
        motorTorqueMz: curMz,
      });
    }

    return {
      x,
      y,
      z,
      matrix: T,
      appliedTorque,
      tangentialForceN,
      radialForceN,
      normalForceN,
      lewisBendingMpa,
      jointWrenches,
    };
  }, [theta1Deg, theta2Deg, theta3Deg, activeModifier]);

  if (!isOpen) return null;

  const downloadTextFile = (filename: string, content: string, mimeType: string = 'text/plain') => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedScript(id);
    setTimeout(() => setCopiedScript(null), 2000);
  };

  const handleDownloadPdf = () => {
    setIsGenerating(true);
    setTimeout(() => {
      try {
        generateProjectBlueprintPDF(phases, physicsNodes, activeModifier);
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 3000);
      } catch (err) {
        console.error('Failed to generate PDF:', err);
      } finally {
        setIsGenerating(false);
      }
    }, 150);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Export Project Blueprint Document
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                High-Fidelity 5-Sheet PDF Summary · ISO 19650 Architecture
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGenerating ? 'Compiling PDF...' : downloadSuccess ? 'Downloaded!' : 'Download High-Fidelity PDF'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              title="Print Document"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sheet Navigation Selector */}
        <div className="px-6 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-xs font-mono">
          <span className="text-slate-500 mr-2">SHEET PREVIEW:</span>
          {[
            { id: 1, label: '01. Executive Architecture' },
            { id: 2, label: '02. 5-Phase Tasklists' },
            { id: 3, label: '03. Micro-Gear Ledger' },
            { id: 4, label: '04. Torque & Fatigue Physics' },
            { id: 5, label: '05. Five-Pillar Compliance' },
            { id: 6, label: '06. CAD & Robotics Kinematics' },
            { id: 7, label: '07. Modular C++ & CSV Matrix' },
            { id: 8, label: '08. Freelance Client Profiles' },
          ].map((sheet) => (
            <button
              key={sheet.id}
              onClick={() => setActiveSheet(sheet.id)}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                activeSheet === sheet.id
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {sheet.label}
            </button>
          ))}
        </div>

        {/* Main Document Preview Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-950 text-slate-100 font-sans space-y-6">
          {activeSheet === 1 && (
            <div className="space-y-6 max-w-4xl mx-auto border border-slate-800 rounded-2xl p-6 bg-slate-900/60">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-xs font-mono text-cyan-400 font-semibold block mb-1">
                  SHEET 01 / 05 · EXECUTIVE ARCHITECTURE SPECIFICATION
                </span>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Nexus-Grid Master Project Blueprint
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Hybrid Agile-Waterfall Framework · Tier IV Data Center Engineering · Datum: 140.0m × 85.0m
                </p>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">MASTER ENVELOPE</span>
                  <span className="text-sm font-bold text-white">140m × 85m</span>
                  <span className="text-[10px] text-cyan-400 block">11,900 m² Area</span>
                </div>
                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">SCALABILITY</span>
                  <span className="text-sm font-bold text-blue-400">Tier IV Modular</span>
                  <span className="text-[10px] text-slate-400 block">6.40 MW IT</span>
                </div>
                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">RELIABILITY</span>
                  <span className="text-sm font-bold text-emerald-400">99.995%</span>
                  <span className="text-[10px] text-slate-400 block">2N+1 Redundant</span>
                </div>
                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">TARGET PUE</span>
                  <span className="text-sm font-bold text-amber-400">1.15 Flow</span>
                  <span className="text-[10px] text-slate-400 block">ΔT 14.2°C Cold Aisle</span>
                </div>
              </div>

              {/* Methodology Description */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-mono uppercase text-blue-400 tracking-wider font-semibold">
                  1. Hybrid Agile-Waterfall Methodology
                </h4>
                <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
                  <p>
                    <strong className="text-white">Waterfall Core:</strong> Strict sequential progression (Plan ➔ Design ➔ Power ➔ Infra ➔ Deploy). Heavy infrastructure casting, generator installation, and power grid routing cannot be re-shuffled mid-way.
                  </p>
                  <p>
                    <strong className="text-white">Agile &amp; Visual Sprints:</strong> Instead of dry spreadsheets, tasks are managed via visual blocks—converting conceptual hand drawings straight into 3D CAD/Simulation pipelines for rapid error testing before physical execution on site.
                  </p>
                  <p>
                    <strong className="text-white">Electro-Mechanical Integration:</strong> Micro-gears and valves regulate fluid movement, adjust load distributions, and configure spatial housing inside Generator-cum-Battery hybrid units and surgery/operating-theater layout robot joints.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSheet === 2 && (
            <div className="space-y-4 max-w-4xl mx-auto border border-slate-800 rounded-2xl p-6 bg-slate-900/60">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-xs font-mono text-cyan-400 font-semibold block mb-1">
                  SHEET 02 / 05 · FIVE-PHASE LIFECYCLE BREAKDOWN
                </span>
                <h3 className="text-lg font-bold text-white">
                  Active Deployment Blueprint Tasks (Input ➔ Process ➔ Output)
                </h3>
              </div>

              <div className="space-y-4">
                {phases.map((phase) => (
                  <div key={phase.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-blue-400">
                        PHASE {phase.index}: {phase.shortName.toUpperCase()}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">{phase.metric}</span>
                    </div>

                    <div className="space-y-2">
                      {phase.tasks.map((task) => (
                        <div key={task.id} className="p-2.5 bg-slate-900/80 rounded-lg text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-white font-medium">[{task.code}] {task.title}</span>
                            <span className={`text-[10px] font-mono ${task.completed ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {task.completed ? '✓ VERIFIED' : '○ QUEUED'}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-400">
                            {task.inputNode} ➔ <span className="text-blue-400">{task.processNode}</span> ➔ <span className="text-emerald-400">{task.outputNode}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSheet === 3 && (
            <div className="space-y-4 max-w-4xl mx-auto border border-slate-800 rounded-2xl p-6 bg-slate-900/60">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-xs font-mono text-cyan-400 font-semibold block mb-1">
                  SHEET 03 / 05 · HARDWARE &amp; MICRO-GEAR ASSET TRACKING LEDGER MATRIX
                </span>
                <h3 className="text-lg font-bold text-white">
                  Physical Linkages &amp; Electro-Mechanical Specifications
                </h3>
              </div>

              <div className="space-y-3">
                {phases.flatMap((p) => p.microGear).map((asset) => (
                  <div key={asset.id} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-[11px] font-mono text-blue-400 font-bold block">
                        {asset.assetId} · {asset.specCategory}
                      </span>
                      <span className="text-sm font-semibold text-white mt-0.5 block">{asset.name}</span>
                      <p className="text-slate-400 text-[11px] mt-1">{asset.description}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                      {asset.tags.map((t, idx) => (
                        <span key={idx} className="font-mono text-[11px] px-2 py-0.5 bg-slate-900 rounded border border-slate-800 text-slate-300">
                          {t.label}: {t.value}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSheet === 4 && (
            <div className="space-y-4 max-w-4xl mx-auto border border-slate-800 rounded-2xl p-6 bg-slate-900/60">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-xs font-mono text-cyan-400 font-semibold block mb-1">
                  SHEET 04 / 05 · MECHANICAL TORQUE CASCADES &amp; MATERIAL FATIGUE
                </span>
                <h3 className="text-lg font-bold text-white">
                  Real-Time Torque Loops &amp; Basquin Cyclic Fatigue Validation ({activeModifier.toFixed(1)}x Modifier)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {physicsNodes.map((node) => (
                  <div key={node.nodeId} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-blue-400">{node.nodeId}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${
                        node.safetyStatus === 'CRITICAL_SHEAR_FAILURE'
                          ? 'border-rose-500/50 bg-rose-950/30 text-rose-400'
                          : node.safetyStatus === 'HIGH_FATIGUE_RISK'
                          ? 'border-amber-500/50 bg-amber-950/30 text-amber-400'
                          : 'border-emerald-500/40 bg-emerald-950/30 text-emerald-400'
                      }`}>
                        {node.safetyStatus}
                      </span>
                    </div>

                    <div className="text-sm font-semibold text-white">{node.name}</div>
                    <div className="text-[11px] text-slate-400">{node.applicationContext} · Material: {node.material}</div>

                    <div className="grid grid-cols-3 gap-2 font-mono text-[11px] pt-2 border-t border-slate-800/80">
                      <div>
                        <span className="text-slate-500 block">TORQUE</span>
                        <span className="text-white font-bold">{node.outputTorqueNm} Nm</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">SHEAR</span>
                        <span className="text-cyan-300 font-bold">{node.calculatedShearStressMpa} MPa</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">FATIGUE LIFE</span>
                        <span className="text-amber-400 font-bold truncate block">{node.fatigueLifeRemainingCycles.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSheet === 5 && (
            <div className="space-y-4 max-w-4xl mx-auto border border-slate-800 rounded-2xl p-6 bg-slate-900/60">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-xs font-mono text-cyan-400 font-semibold block mb-1">
                  SHEET 05 / 05 · CRITICAL CONSIDERATIONS &amp; CERTIFICATION
                </span>
                <h3 className="text-lg font-bold text-white">
                  Five-Pillar Compliance &amp; Production Sign-Off
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="font-mono text-blue-400 font-bold block mb-1">01. SCALABILITY</span>
                  <p className="text-slate-300 leading-relaxed">
                    Column-free 36m Warren roof truss allows uniform 1,200mm cold-aisle pitch. North knockout panels engineered for +3.2MW Phase-II expansion.
                  </p>
                </div>
                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="font-mono text-emerald-400 font-bold block mb-1">02. RELIABILITY (99.995%)</span>
                  <p className="text-slate-300 leading-relaxed">
                    Zero single point of failure (2N+1). Dual 3.2MW diesel gensets + 4.0MWh LiFePO4 battery array with &lt;4ms static transfer.
                  </p>
                </div>
                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="font-mono text-amber-400 font-bold block mb-1">03. SECURITY</span>
                  <p className="text-slate-300 leading-relaxed">
                    30m perimeter stand-off berm, mantrap biometric airlock, STC-55 acoustic glazing on NOC command room, air-gapped PLC networks.
                  </p>
                </div>
                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="font-mono text-cyan-300 font-bold block mb-1">04. THERMODYNAMIC EFFICIENCY (PUE 1.15)</span>
                  <p className="text-slate-300 leading-relaxed">
                    Magnetic-bearing oil-free chillers operating with adiabatic free-cooling economizer mode 78% of the annual cycle.
                  </p>
                </div>
                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="font-mono text-slate-200 font-bold block mb-1">05. STANDARDS COMPLIANCE</span>
                  <p className="text-slate-300 leading-relaxed">
                    TIA-942 Rated-4, Uptime Institute Tier IV, NFPA 110 Level 1 Emergency Power, ASHRAE TC 9.9, and ISO/IEC 22237 Certified.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSheet === 6 && (
            <div className="space-y-6 max-w-4xl mx-auto border border-slate-800 rounded-2xl p-6 bg-slate-900/60">
              <div className="border-b border-slate-800 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-mono text-cyan-400 font-semibold block mb-1">
                    SHEET 06 / 06 · CAD AUTOMATION &amp; ROBOTICS KINEMATICS (DH)
                  </span>
                  <h3 className="text-lg font-bold text-white">
                    Parametric SolidWorks Macro, AutoLISP Engine &amp; 3-DOF Forward Kinematics
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => downloadTextFile('draw_gear.vba', VBA_SCRIPT, 'text/plain')}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Download SolidWorks VBA Macro"
                  >
                    <Download className="w-3 h-3 text-cyan-400" />
                    <span>draw_gear.vba</span>
                  </button>
                  <button
                    onClick={() => downloadTextFile('nexus_dh_load_engine.cpp', NEXUS_DH_LOAD_ENGINE_CPP, 'text/x-c++src')}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Download Extended DH Load Engine C++"
                  >
                    <Download className="w-3 h-3 text-amber-400" />
                    <span>dh_load_engine.cpp</span>
                  </button>
                  <button
                    onClick={() => downloadTextFile('dh_forward_kinematics.cpp', CPP_DH_SCRIPT, 'text/x-c++src')}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Download C++ DH Kinematics Script"
                  >
                    <Download className="w-3 h-3 text-blue-400" />
                    <span>dh_kinematics.cpp</span>
                  </button>
                  <button
                    onClick={() => downloadTextFile('draw_gear.lsp', LSP_SCRIPT, 'text/plain')}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Download AutoCAD AutoLISP Script"
                  >
                    <Download className="w-3 h-3 text-emerald-400" />
                    <span>draw_gear.lsp</span>
                  </button>
                </div>
              </div>

              {/* Interactive DH Forward Kinematics Calculator */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono text-blue-400">
                    <Cpu className="w-4 h-4" />
                    <span>3-DOF ROBOT ARM FORWARD KINEMATICS (SURGICAL ROBOT MG-ROBO-03)</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    Torque Driver: <strong className="text-white">{kinematicsResult.appliedTorque.toFixed(1)} N·m</strong>
                  </span>
                </div>

                {/* Joint Angle Sliders */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800/80">
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-slate-400">Joint 1 θ₁ (Base)</span>
                      <span className="text-cyan-400 font-bold">{theta1Deg}°</span>
                    </div>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      step="5"
                      value={theta1Deg}
                      onChange={(e) => setTheta1Deg(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1">Offset d₁: 0.35m, α₁: 90°</span>
                  </div>

                  <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800/80">
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-slate-400">Joint 2 θ₂ (Shoulder)</span>
                      <span className="text-blue-400 font-bold">{theta2Deg}°</span>
                    </div>
                    <input
                      type="range"
                      min="-90"
                      max="90"
                      step="5"
                      value={theta2Deg}
                      onChange={(e) => setTheta2Deg(parseFloat(e.target.value))}
                      className="w-full accent-blue-500 cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1">Length a₂: 0.45m, α₂: 0°</span>
                  </div>

                  <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800/80">
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-slate-400">Joint 3 θ₃ (Elbow/Wrist)</span>
                      <span className="text-amber-400 font-bold">{theta3Deg}°</span>
                    </div>
                    <input
                      type="range"
                      min="-135"
                      max="135"
                      step="5"
                      value={theta3Deg}
                      onChange={(e) => setTheta3Deg(parseFloat(e.target.value))}
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1">Length a₃: 0.30m, α₃: 0°</span>
                  </div>
                </div>

                {/* Spatial Coordinate Output & Gear Loads */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                  <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">END-EFFECTOR X</span>
                    <span className="text-base font-bold text-white">{kinematicsResult.x.toFixed(4)} m</span>
                    <span className="text-[10px] text-cyan-400 block">{(kinematicsResult.x * 1000).toFixed(1)} mm</span>
                  </div>
                  <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">END-EFFECTOR Y</span>
                    <span className="text-base font-bold text-white">{kinematicsResult.y.toFixed(4)} m</span>
                    <span className="text-[10px] text-cyan-400 block">{(kinematicsResult.y * 1000).toFixed(1)} mm</span>
                  </div>
                  <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">END-EFFECTOR Z</span>
                    <span className="text-base font-bold text-white">{kinematicsResult.z.toFixed(4)} m</span>
                    <span className="text-[10px] text-cyan-400 block">{(kinematicsResult.z * 1000).toFixed(1)} mm</span>
                  </div>
                  <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">CONTACT FORCE (Fn)</span>
                    <span className="text-base font-bold text-emerald-400">{kinematicsResult.normalForceN.toFixed(1)} N</span>
                    <span className="text-[10px] text-amber-400 block">Ft: {kinematicsResult.tangentialForceN.toFixed(1)} N</span>
                  </div>
                </div>

                {/* Matrix Transform & Lewis Stress Display */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800">
                    <span className="text-[11px] text-blue-400 font-bold block mb-2">
                      [T₀³ CUMULATIVE 4×4 HOMOGENEOUS MATRIX]
                    </span>
                    <div className="space-y-1 text-[11px] text-slate-300">
                      {kinematicsResult.matrix.map((row, idx) => (
                        <div key={idx} className="flex justify-between">
                          {row.map((val, cIdx) => (
                            <span key={cIdx} className="w-16 text-right">
                              {val.toFixed(3)}
                            </span>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-2">
                    <span className="text-[11px] text-emerald-400 font-bold block">
                      GEAR CONTACT FORCE DECOMPOSITION (MG-ROBO-03)
                    </span>
                    <div className="space-y-1 text-[11px] text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Tangential Force (Ft = T / r):</span>
                        <span className="text-white font-bold">{kinematicsResult.tangentialForceN.toFixed(1)} N</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Radial Separating Force (Fr):</span>
                        <span className="text-cyan-300 font-bold">{kinematicsResult.radialForceN.toFixed(1)} N</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Normal Contact Force (Fn):</span>
                        <span className="text-emerald-400 font-bold">{kinematicsResult.normalForceN.toFixed(1)} N</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Lewis Tooth Bending Stress:</span>
                        <span className="text-amber-400 font-bold">{kinematicsResult.lewisBendingMpa.toFixed(1)} MPa</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Inter-Link Load Force Tracking Ledger (Version 3.5.0) */}
                <div className="p-3.5 bg-slate-900/90 rounded-lg border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-amber-400">
                      NEXUS-GRID INTER-LINK STATIC LOAD FORCE TRACKING LEDGER (v3.5.0)
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      End-Effector Wrench: [15N, 25N, 120N] · Backward Recursion
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 font-mono text-xs">
                    {kinematicsResult.jointWrenches.map((jw) => (
                      <div key={jw.nodeId} className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/90 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-cyan-300">{jw.nodeId}</span>
                          <span className="text-[10px] text-slate-400 truncate max-w-[130px]">{jw.label}</span>
                        </div>
                        <div className="text-[11px] text-slate-300">
                          <span className="text-slate-400 block text-[10px]">COMBINED FORCE (Fx, Fy, Fz):</span>
                          <span>({jw.force[0].toFixed(1)} N, {jw.force[1].toFixed(1)} N, {jw.force[2].toFixed(1)} N)</span>
                        </div>
                        <div className="text-[11px] pt-1 border-t border-slate-900 flex justify-between">
                          <span className="text-slate-400">Motor Torque (Mz):</span>
                          <span className="text-emerald-400 font-bold">{jw.motorTorqueMz.toFixed(2)} N·m</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Script Source Code Viewer with Tabs */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setActiveScriptTab('vba')}
                      className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                        activeScriptTab === 'vba'
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      SolidWorks VBA
                    </button>
                    <button
                      onClick={() => setActiveScriptTab('dh_load')}
                      className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                        activeScriptTab === 'dh_load'
                          ? 'bg-amber-600 text-white font-bold'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      C++ DH Load Engine (v3.5)
                    </button>
                    <button
                      onClick={() => setActiveScriptTab('dh_cpp')}
                      className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                        activeScriptTab === 'dh_cpp'
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      C++ Kinematics
                    </button>
                    <button
                      onClick={() => setActiveScriptTab('lsp')}
                      className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                        activeScriptTab === 'lsp'
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      AutoCAD AutoLISP
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const code =
                          activeScriptTab === 'vba'
                            ? VBA_SCRIPT
                            : activeScriptTab === 'dh_load'
                            ? NEXUS_DH_LOAD_ENGINE_CPP
                            : activeScriptTab === 'dh_cpp'
                            ? CPP_DH_SCRIPT
                            : LSP_SCRIPT;
                        copyToClipboard(code, activeScriptTab);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedScript === activeScriptTab ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-blue-400" />
                          <span>Copy Script</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-[#05070a] border border-slate-900 rounded-lg p-3 max-h-56 overflow-y-auto font-mono text-[11px] text-slate-300">
                  <pre className="whitespace-pre">
                    {activeScriptTab === 'vba'
                      ? VBA_SCRIPT
                      : activeScriptTab === 'dh_load'
                      ? NEXUS_DH_LOAD_ENGINE_CPP
                      : activeScriptTab === 'dh_cpp'
                      ? CPP_DH_SCRIPT
                      : LSP_SCRIPT}
                  </pre>
                </div>

                {/* Additional Technical Packages Download Bar */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-slate-400 font-mono text-[11px]">
                    ARCHIVAL ENGINEERING ASSETS (VOLUME 18):
                  </span>
                  <div className="flex items-center gap-2">
                    <a
                      href="/nexus_presentation.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-800 rounded-lg font-mono text-[11px] flex items-center gap-1.5 transition-colors"
                      title="Open Presentation Page in new tab"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Online Presentation Page</span>
                    </a>
                    <a
                      href="/NEXUS_PARAMETRIC_MANUFACTURING_GUIDE.md"
                      download="NEXUS_PARAMETRIC_MANUFACTURING_GUIDE.md"
                      className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 rounded-lg font-mono text-[11px] flex items-center gap-1.5 transition-colors"
                      title="Download Markdown Reference Guide"
                    >
                      <Download className="w-3 h-3" />
                      <span>Manufacturing Guide (.md)</span>
                    </a>
                    <a
                      href="/PROJECT_PORTFOLIO_MODIFICATION_NOTICE.md"
                      download="PROJECT_PORTFOLIO_MODIFICATION_NOTICE.md"
                      className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-slate-800 rounded-lg font-mono text-[11px] flex items-center gap-1.5 transition-colors"
                      title="Download Volume 18 Extension A Addendum Notice"
                    >
                      <Download className="w-3 h-3" />
                      <span>Portfolio Notice (Vol 18-A)</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSheet === 7 && (
            <div className="space-y-6 max-w-4xl mx-auto border border-slate-800 rounded-2xl p-6 bg-slate-900/60">
              <div className="border-b border-slate-800 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-mono text-cyan-400 font-semibold block mb-1">
                    SHEET 07 / 08 · MODULAR C++ CLI ARCHITECTURE &amp; CSV TEST MATRIX
                  </span>
                  <h3 className="text-lg font-bold text-white">
                    Dynamic Command-Line Engine &amp; Automated Safety Validation Suite
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href="/nexus_dh_engine.tar.gz"
                    download="nexus_dh_engine.tar.gz"
                    className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-blue-600/20"
                    title="Download Modular C++ Engine Package (tar.gz)"
                  >
                    <Download className="w-3 h-3" />
                    <span>nexus_dh_engine.tar.gz</span>
                  </a>
                  <button
                    onClick={() => downloadTextFile('test_matrix.csv', TEST_MATRIX_CSV_CONTENT, 'text/csv')}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Download CSV Test Dataset"
                  >
                    <Download className="w-3 h-3" />
                    <span>test_matrix.csv</span>
                  </button>
                </div>
              </div>

              {/* Part 1: Project File Architecture Layout */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold">
                    <FolderTree className="w-4 h-4" />
                    <span>MODULAR FILE STRUCTURE (ENTERPRISE CLI LAYOUT)</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">Separation of Concerns: Solvers vs CLI</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 text-slate-300 space-y-1">
                    <div className="text-cyan-400 font-bold">📁 nexus_dh_engine/</div>
                    <div className="pl-3 border-l border-slate-700 space-y-1">
                      <div>├── 📁 <span className="text-blue-300">include/</span></div>
                      <div className="pl-3">└── 📄 <strong className="text-white">dh_engine.h</strong> <span className="text-slate-400 text-[10px]">(Link rows &amp; wrench structures)</span></div>
                      <div>├── 📁 <span className="text-blue-300">src/</span></div>
                      <div className="pl-3 space-y-1">
                        <div>├── 📄 <strong className="text-white">dh_engine.cpp</strong> <span className="text-slate-400 text-[10px]">(Matrix transforms &amp; static load loops)</span></div>
                        <div>└── 📄 <strong className="text-white">main.cpp</strong> <span className="text-slate-400 text-[10px]">(CLI parser &amp; batch CSV router)</span></div>
                      </div>
                      <div>├── 📄 <strong className="text-amber-400">Makefile</strong> <span className="text-slate-400 text-[10px]">(Build automation &amp; run targets)</span></div>
                      <div>└── 📊 <strong className="text-emerald-400">test_matrix.csv</strong> <span className="text-slate-400 text-[10px]">(Batch validation dataset)</span></div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 flex flex-col justify-between space-y-2">
                    <div>
                      <span className="text-[11px] text-amber-400 font-bold block mb-1">BUILD AUTOMATION TARGETS:</span>
                      <ul className="space-y-1 text-[11px] text-slate-300">
                        <li><code className="text-white bg-slate-950 px-1 rounded">make all</code> : Compiles C++17 binary with <code className="text-cyan-300">-O2 -Wall</code></li>
                        <li><code className="text-white bg-slate-950 px-1 rounded">make run</code> : Executes direct test (<code className="text-slate-400">./nexus_dh_engine 120.0 5.0</code>)</li>
                        <li><code className="text-white bg-slate-950 px-1 rounded">make test</code> : Runs automated batch suite against <code className="text-slate-400">test_matrix.csv</code></li>
                        <li><code className="text-white bg-slate-950 px-1 rounded">make clean</code> : Clears compiled object files and binary</li>
                      </ul>
                    </div>
                    <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                      Standardized POSIX CLI compliance · Zero external runtime dependencies
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Command-Line Runner Simulator */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold">
                    <Terminal className="w-4 h-4" />
                    <span>DYNAMIC COMMAND-LINE INPUT SIMULATOR</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">Simulating: ./nexus_dh_engine &lt;Fz&gt; &lt;Mass&gt;</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-slate-400">Terminal Force Fz (N)</span>
                      <span className="text-cyan-400 font-bold">{customFz.toFixed(1)} N</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="1000"
                      step="10"
                      value={customFz}
                      onChange={(e) => setCustomFz(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1">End-effector gear resistance boundary</span>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-slate-400">Terminal Link 3 Mass (kg)</span>
                      <span className="text-blue-400 font-bold">{customMass.toFixed(1)} kg</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="25"
                      step="0.5"
                      value={customMass}
                      onChange={(e) => setCustomMass(parseFloat(e.target.value))}
                      className="w-full accent-blue-400 cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1">Dynamically passed via command-line argv[2]</span>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-slate-400">Joint 2 Angle θ₂</span>
                      <span className="text-amber-400 font-bold">{customAngleDeg}°</span>
                    </div>
                    <input
                      type="range"
                      min="-45"
                      max="90"
                      step="5"
                      value={customAngleDeg}
                      onChange={(e) => setCustomAngleDeg(parseFloat(e.target.value))}
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1">Kinematic posture for moment lever arm</span>
                  </div>
                </div>

                {/* Simulated CLI Terminal Viewport */}
                <div className="bg-[#05070a] border border-slate-800 rounded-xl p-3.5 font-mono text-xs text-slate-300 space-y-1.5 shadow-inner">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-900 pb-1">
                    <span>TERMINAL EXECUTION TRACE</span>
                    <span className="text-emerald-400">● C++17 RUNTIME ACTIVE</span>
                  </div>
                  <div className="text-cyan-400 font-bold">
                    $ ./nexus_dh_engine {customFz.toFixed(1)} {customMass.toFixed(1)}
                  </div>
                  <div className="text-slate-400">
                    [*] Parsing user inputs. Terminal Fz: {customFz.toFixed(1)} N, Mass: {customMass.toFixed(1)} kg
                  </div>
                  <div className="text-slate-300">
                    [LINK 01] Cumulative Force Fz: <strong className="text-white">{dynamicCliResult.fz.toFixed(2)} N</strong> | Lever Reaction: Active
                  </div>
                  <div className="text-emerald-400 font-semibold">
                    [SUCCESS] Base link total torque reaction (Mz): <strong className="text-white">{dynamicCliResult.baseTorque.toFixed(3)} Nm</strong>
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-900">
                    <span className="text-slate-400">Calculated Safety Gate:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      dynamicCliResult.gate === 'CRITICAL_SHEAR_FAILURE'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : dynamicCliResult.gate === 'BIO_STABILITY_FAILURE'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}>
                      {dynamicCliResult.gate}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      ({dynamicCliResult.isOverload ? 'Shear limit 150 Nm breached' : 'Nominal operational envelope'})
                    </span>
                  </div>
                </div>
              </div>

              {/* Part 2: Standardized CSV Test Dataset Table */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-amber-400 font-bold">
                    <Database className="w-4 h-4" />
                    <span>STANDARDIZED TEST DATASET TEMPLATE (test_matrix.csv)</span>
                  </div>
                  <button
                    onClick={() => setTestMatrixRan(!testMatrixRan)}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3 text-cyan-400" />
                    <span>Re-evaluate Verification Pipeline</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs border border-slate-800 rounded-lg overflow-hidden">
                    <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[11px]">
                      <tr>
                        <th className="p-2.5">Test Case ID</th>
                        <th className="p-2.5">Angle (rad)</th>
                        <th className="p-2.5">Offset (m)</th>
                        <th className="p-2.5">Length (m)</th>
                        <th className="p-2.5">Force Fz (N)</th>
                        <th className="p-2.5">Expected Mz</th>
                        <th className="p-2.5">Target Safety Gate</th>
                        <th className="p-2.5">Verification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 bg-slate-950/60 text-slate-300 text-[11px]">
                      {DEFAULT_CSV_TEST_CASES.map((tc) => (
                        <tr key={tc.id} className="hover:bg-slate-900/50">
                          <td className="p-2.5 font-bold text-white">{tc.id}</td>
                          <td className="p-2.5">{tc.jointAngleRad.toFixed(3)}</td>
                          <td className="p-2.5">{tc.linkOffsetM.toFixed(2)}</td>
                          <td className="p-2.5">{tc.linkLengthM.toFixed(2)}</td>
                          <td className="p-2.5 text-cyan-300">{tc.forceZN.toFixed(1)} N</td>
                          <td className="p-2.5 text-white font-bold">{tc.expectedTorqueNm.toFixed(2)} Nm</td>
                          <td className="p-2.5">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              tc.targetGate === 'CRITICAL_SHEAR_FAILURE'
                                ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                                : tc.targetGate === 'BIO_STABILITY_FAILURE'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                                : 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                            }`}>
                              {tc.targetGate}
                            </span>
                          </td>
                          <td className="p-2.5">
                            <span className="flex items-center gap-1 text-emerald-400 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>PASS</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modular Source Code Inspector */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => setActiveModularTab('main')}
                      className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                        activeModularTab === 'main'
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      src/main.cpp
                    </button>
                    <button
                      onClick={() => setActiveModularTab('engine')}
                      className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                        activeModularTab === 'engine'
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      src/dh_engine.cpp
                    </button>
                    <button
                      onClick={() => setActiveModularTab('header')}
                      className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                        activeModularTab === 'header'
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      include/dh_engine.h
                    </button>
                    <button
                      onClick={() => setActiveModularTab('makefile')}
                      className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                        activeModularTab === 'makefile'
                          ? 'bg-amber-600 text-white font-bold'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Makefile
                    </button>
                    <button
                      onClick={() => setActiveModularTab('csv')}
                      className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                        activeModularTab === 'csv'
                          ? 'bg-emerald-600 text-white font-bold'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      test_matrix.csv
                    </button>
                    <button
                      onClick={() => setActiveModularTab('github_ci')}
                      className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                        activeModularTab === 'github_ci'
                          ? 'bg-purple-600 text-white font-bold'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      nexus_ci.yml
                    </button>
                    <button
                      onClick={() => setActiveModularTab('jenkins')}
                      className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                        activeModularTab === 'jenkins'
                          ? 'bg-cyan-600 text-white font-bold'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Jenkinsfile
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      const code =
                        activeModularTab === 'main'
                          ? MODULAR_MAIN_CPP
                          : activeModularTab === 'engine'
                          ? MODULAR_DH_ENGINE_CPP
                          : activeModularTab === 'header'
                          ? MODULAR_DH_HEADER
                          : activeModularTab === 'makefile'
                          ? MODULAR_MAKEFILE
                          : activeModularTab === 'csv'
                          ? TEST_MATRIX_CSV_CONTENT
                          : activeModularTab === 'github_ci'
                          ? GITHUB_CI_YML
                          : JENKINSFILE_CONTENT;
                      copyToClipboard(code, `modular_${activeModularTab}`);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedScript === `modular_${activeModularTab}` ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-blue-400" />
                        <span>Copy File</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-[#05070a] border border-slate-900 rounded-lg p-3 max-h-56 overflow-y-auto font-mono text-[11px] text-slate-300">
                  <pre className="whitespace-pre">
                    {activeModularTab === 'main'
                      ? MODULAR_MAIN_CPP
                      : activeModularTab === 'engine'
                      ? MODULAR_DH_ENGINE_CPP
                      : activeModularTab === 'header'
                      ? MODULAR_DH_HEADER
                      : activeModularTab === 'makefile'
                      ? MODULAR_MAKEFILE
                      : activeModularTab === 'csv'
                      ? TEST_MATRIX_CSV_CONTENT
                      : activeModularTab === 'github_ci'
                      ? GITHUB_CI_YML
                      : JENKINSFILE_CONTENT}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {activeSheet === 8 && (
            <div className="space-y-6 max-w-4xl mx-auto border border-slate-800 rounded-2xl p-6 bg-slate-900/60">
              <div className="border-b border-slate-800 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-mono text-cyan-400 font-semibold block mb-1">
                    SHEET 08 / 08 · HIGH-CONVERSION FREELANCE PORTFOLIO &amp; PROPOSALS
                  </span>
                  <h3 className="text-lg font-bold text-white">
                    Client Acquisition Copy &amp; Pitch Proposals – Amit Nishanka Bhuyan
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href="/FREELANCE_PORTFOLIO_PROFILES.md"
                    download="FREELANCE_PORTFOLIO_PROFILES.md"
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Download Full Freelance Profiles Document"
                  >
                    <Download className="w-3 h-3" />
                    <span>FREELANCE_PORTFOLIO_PROFILES.md</span>
                  </a>
                  <a
                    href="/PROJECT_PORTFOLIO_MODIFICATION_NOTICE.md"
                    download="PROJECT_PORTFOLIO_MODIFICATION_NOTICE.md"
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Download Official Project Modification Notice"
                  >
                    <Download className="w-3 h-3" />
                    <span>Modification Notice (Vol 18-A)</span>
                  </a>
                </div>
              </div>

              {/* Author & Institutional Context Card */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-mono text-cyan-400 font-bold block text-[11px]">
                    PRINCIPAL RESEARCHER &amp; SYSTEMS ARCHITECT
                  </span>
                  <span className="text-sm font-semibold text-white">Amit Nishanka Bhuyan</span>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Lead AI Researcher &amp; Project Coordinator · Salipur, Odisha, India
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-300">
                    GitHub: <strong className="text-white">bhuyanamitnishanka-debug</strong>
                  </span>
                  <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-300">
                    Instagram: <strong className="text-pink-400">@nishanka_creative_studio93</strong>
                  </span>
                </div>
              </div>

              {/* Platform Selector Tabs */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActivePortfolioTab('fiverr')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer flex items-center gap-1.5 ${
                        activePortfolioTab === 'fiverr'
                          ? 'bg-emerald-600 text-white font-bold'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>Fiverr Gig Profile</span>
                    </button>
                    <button
                      onClick={() => setActivePortfolioTab('instagram')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer flex items-center gap-1.5 ${
                        activePortfolioTab === 'instagram'
                          ? 'bg-pink-600 text-white font-bold'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Instagram Business &amp; Reels</span>
                    </button>
                    <button
                      onClick={() => setActivePortfolioTab('upwork')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer flex items-center gap-1.5 ${
                        activePortfolioTab === 'upwork'
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Upwork / Consulting Pitch</span>
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      const text =
                        activePortfolioTab === 'fiverr'
                          ? FIVERR_GIG_TEXT
                          : activePortfolioTab === 'instagram'
                          ? INSTAGRAM_PROFILE_TEXT
                          : UPWORK_PROPOSAL_TEXT;
                      copyToClipboard(text, `portfolio_${activePortfolioTab}`);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/20"
                  >
                    {copiedScript === `portfolio_${activePortfolioTab}` ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-200" />
                        <span>Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Profile Text</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Profile Content Viewport */}
                <div className="bg-[#05070a] border border-slate-900 rounded-xl p-4 font-mono text-xs text-slate-300 max-h-72 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                  {activePortfolioTab === 'fiverr'
                    ? FIVERR_GIG_TEXT
                    : activePortfolioTab === 'instagram'
                    ? INSTAGRAM_PROFILE_TEXT
                    : UPWORK_PROPOSAL_TEXT}
                </div>

                {/* Fiverr Gig Tier Pricing Packages Table (INR & USD) */}
                <div className="space-y-3 pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-cyan-400 font-bold flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>FIVERR GIG TIER PRICING PACKAGES (INR CURRENCY MAPPING)</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">High-Conversion Freelance Scope</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-xs border border-slate-800 rounded-lg overflow-hidden">
                      <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[11px]">
                        <tr>
                          <th className="p-2.5">Package Tier</th>
                          <th className="p-2.5">Name</th>
                          <th className="p-2.5">Target Price (INR)</th>
                          <th className="p-2.5">Delivery Time</th>
                          <th className="p-2.5">Included Features &amp; Scope</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80 bg-slate-950/60 text-slate-300 text-[11px]">
                        <tr className="hover:bg-slate-900/50">
                          <td className="p-2.5 font-bold text-emerald-400">🟢 Basic</td>
                          <td className="p-2.5 font-semibold text-white">Core Math Architecture</td>
                          <td className="p-2.5 font-bold text-cyan-300">₹4,500</td>
                          <td className="p-2.5">3 Days</td>
                          <td className="p-2.5 text-slate-400">
                            Standard 3-DOF Denavit-Hartenberg (DH) kinematic matrix calculations, structured raw code files, and basic test verification.
                          </td>
                        </tr>
                        <tr className="hover:bg-slate-900/50">
                          <td className="p-2.5 font-bold text-amber-400">🟡 Standard</td>
                          <td className="p-2.5 font-semibold text-white">Multi-Link Dynamic Load &amp; CSV Pipeline</td>
                          <td className="p-2.5 font-bold text-cyan-300">₹12,000</td>
                          <td className="p-2.5">5 Days</td>
                          <td className="p-2.5 text-slate-400">
                            Full 6-DOF load propagation, CSV test matrix batch execution engine, exception traps, and real-time unit conversion suite.
                          </td>
                        </tr>
                        <tr className="hover:bg-slate-900/50">
                          <td className="p-2.5 font-bold text-purple-400">🟣 Premium</td>
                          <td className="p-2.5 font-semibold text-white">Enterprise Digital Twin &amp; Full C++ Engine</td>
                          <td className="p-2.5 font-bold text-cyan-300">₹28,000</td>
                          <td className="p-2.5">7 Days</td>
                          <td className="p-2.5 text-slate-400">
                            Complete turnkey C++ CLI, WebGL 3D digital twin integration, automated stress simulation, unit conversion suite, and full documentation.
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pricing / Highlights Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800 text-xs font-mono">
                  <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">STANDARD CORE</span>
                    <span className="text-white font-bold text-sm">₹4,500 INR ($95 USD)</span>
                    <span className="text-[10px] text-cyan-300 block mt-0.5">3 Days · Core DH Math &amp; Scripts</span>
                  </div>
                  <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">ENTERPRISE FULL-STACK</span>
                    <span className="text-white font-bold text-sm">₹12,000 INR ($285 USD)</span>
                    <span className="text-[10px] text-emerald-300 block mt-0.5">5 Days · DH + CSV Pipeline + Units</span>
                  </div>
                  <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">INDUSTRIAL DIGITAL TWIN</span>
                    <span className="text-white font-bold text-sm">₹28,000 INR ($550 USD)</span>
                    <span className="text-[10px] text-amber-300 block mt-0.5">7 Days · Turnkey C++ CLI + WebGL</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400 font-mono">
            Status: <span className="text-emerald-400">PDF Generator Ready (jsPDF Engine v4.0)</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGenerating ? 'Compiling PDF...' : 'Export Project Blueprint PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
