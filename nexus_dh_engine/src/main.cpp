#include <iostream>
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
        std::cerr << "[!] Error: Failed to open targeted CSV file: " << csv_path << "\n";
        return;
    }

    std::string line;
    // Skip row 0 configuration headers
    std::getline(file, line);

    std::cout << "\n=======================================================\n";
    std::cout << "  PROCESSING NEXUS-GRID DATASET LOG ENTRIES            \n";
    std::cout << "=======================================================\n";

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
                  << " N | Base Reaction: " << std::setprecision(2) << outputs[0].moment[2] << " Nm\n";
    }
    std::cout << "=======================================================\n";
}

int main(int argc, char* argv[]) {
    // If CLI arguments specify numerical load: ./nexus_dh_engine <Force_Z> <Link3_Mass>
    if (argc >= 3 && argv[1][0] != '-') {
        double input_fz = std::atof(argv[1]);
        double link3_mass = std::atof(argv[2]);

        std::cout << "[*] Parsing dynamic user inputs. Terminal Fz: " << input_fz 
                  << " N, Mass: " << link3_mass << " kg\n";

        std::vector<DHLinkRow> linkConfigurations = {
            {0.0, 0.45, 0.0, 1.5708, 8.5},
            {0.5236, 0.0, 0.55, 0.0, 12.0},
            {0.7854, 0.0, 0.35, 0.0, link3_mass}
        };

        WrenchVector externalResistance = {{0.0, 0.0, input_fz}, {5.0, 12.5, 45.0}};
        NexusDHLoadEngine engine(linkConfigurations);
        std::vector<WrenchVector> outputs = engine.calculateStaticLoading(externalResistance);

        std::cout << "[SUCCESS] Base link total torque reaction (Mz): " 
                  << std::fixed << std::setprecision(2) << outputs[0].moment[2] << " Nm\n";
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
}
