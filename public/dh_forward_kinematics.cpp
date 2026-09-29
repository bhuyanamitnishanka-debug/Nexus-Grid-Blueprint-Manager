// Denavit-Hartenberg (DH) Mathematical Transform Matrix Loops & Gear Load Forces
#include <iostream>
#include <cmath>
#include <vector>
#include <iomanip>

struct DHParameterRow {
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
    std::vector<DHParameterRow> robotKinematicsChain = {
        {0.0, 0.35, 0.0, M_PI_2},
        {M_PI_4, 0.0, 0.45, 0.0},
        {-M_PI_4, 0.0, 0.30, 0.0}
    };
    double BaseToTipTransform[4][4] = {{1,0,0,0},{0,1,0,0},{0,0,1,0},{0,0,0,1}};
    for (size_t i = 0; i < robotKinematicsChain.size(); ++i) {
        double CurrentLinkMatrix[4][4], TemporaryBufferMatrix[4][4];
        computeDHTransformMatrix(robotKinematicsChain[i], CurrentLinkMatrix);
        multiply4x4Matrices(BaseToTipTransform, CurrentLinkMatrix, TemporaryBufferMatrix);
        for(int r=0; r<4; ++r) for(int c=0; c<4; ++c) BaseToTipTransform[r][c] = TemporaryBufferMatrix[r][c];
    }
    std::cout << "End-Effector (meters): X=" << BaseToTipTransform[0][3] << " Y=" << BaseToTipTransform[1][3] << " Z=" << BaseToTipTransform[2][3] << std::endl;
    return 0;
}
