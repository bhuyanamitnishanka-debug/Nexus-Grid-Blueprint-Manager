# Compiler Configuration Flags
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
	@mkdir -p $(OBJ_DIR)
	$(CXX) $(CXXFLAGS) -o $(TARGET) $(OBJS)
	@echo "[+] Compilation successful. Executable output: ./$(TARGET)"

$(OBJ_DIR)/%.o: $(SRC_DIR)/%.cpp
	@mkdir -p $(OBJ_DIR)
	$(CXX) $(CXXFLAGS) -c $< -o $@

run: $(TARGET)
	./$(TARGET) 120.0 5.0

batch: $(TARGET)
	./$(TARGET) test_matrix.csv

test: $(TARGET)
	./$(TARGET) test_matrix.csv

clean:
	rm -rf $(OBJ_DIR) $(TARGET)
	@echo "[*] Clean configuration routine finalized."
