#ifndef DH_ENGINE_H
#define DH_ENGINE_H

#include <vector>
#include <string>

struct DHLinkRow {
    double theta;
    double d;
    double a;
    double alpha;
    double link_mass;
};

struct WrenchVector {
    double force[3];
    double moment[3];
};

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

#endif
