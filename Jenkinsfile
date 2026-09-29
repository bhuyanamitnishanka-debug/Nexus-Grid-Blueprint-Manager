pipeline {
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
}
