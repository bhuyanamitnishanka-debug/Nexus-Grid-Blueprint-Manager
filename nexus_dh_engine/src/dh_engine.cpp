#include "../include/dh_engine.h"
#include <iostream>
#include <cmath>
#include <fstream>
#include <sstream>

NexusDHLoadEngine::NexusDHLoadEngine(const std::vector<DHLinkRow>& kinematic_chain) : chain(kinematic_chain) {}

void NexusDHLoadEngine::computeDHTransform(const DHLinkRow& link, double T[4][4]) {
    double cosT = std::cos(link.theta), sinT = std::sin(link.theta);
    double cosA = std::cos(link.alpha), sinA = std::sin(link.alpha);
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
        current_wrench.force[2] += chain[i].link_mass * gravity;
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
}
