// Nexus-Grid Extended DH Kinematics & Static Load Engine (v3.5.0)
#include <iostream>
#include <cmath>
#include <vector>
#include <iomanip>

struct DHLinkRow {
    double theta, d, a, alpha, link_mass;
};

struct WrenchVector {
    double force[3];
    double moment[3];
};

class NexusDHLoadEngine {
private:
    std::vector<DHLinkRow> chain;
    const double gravity = 9.81;
public:
    NexusDHLoadEngine(const std::vector<DHLinkRow>& kinematic_chain) : chain(kinematic_chain) {}

    std::vector<WrenchVector> calculateStaticLoading(const WrenchVector& end_effector_load) {
        size_t num_links = chain.size();
        std::vector<WrenchVector> joint_wrenches(num_links);
        WrenchVector current_wrench = end_effector_load;

        for (int i = static_cast<int>(num_links) - 1; i >= 0; --i) {
            current_wrench.force[2] += chain[i].link_mass * gravity;
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
        {0.0, 0.45, 0.0, M_PI_2, 8.5},
        {M_PI_6, 0.0, 0.55, 0.0, 12.0},
        {M_PI_4, 0.0, 0.35, 0.0, 5.0}
    };
    NexusDHLoadEngine engine(linkConfigurations);
    WrenchVector gearAssemblyResistance = {{15.0, 25.0, 120.0}, {5.0, 12.5, 45.0}};
    std::vector<WrenchVector> calculatedLoads = engine.calculateStaticLoading(gearAssemblyResistance);

    std::cout << std::fixed << std::setprecision(3);
    for (size_t i = 0; i < calculatedLoads.size(); ++i) {
        std::cout << "[NODE 0" << i + 1 << "] Force: (" << calculatedLoads[i].force[0] << ", " << calculatedLoads[i].force[1] << ", " << calculatedLoads[i].force[2] << ") N | Mz: " << calculatedLoads[i].moment[2] << " Nm" << std::endl;
    }
    return 0;
}
