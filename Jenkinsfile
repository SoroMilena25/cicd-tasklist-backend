pipeline {
    agent any

    environment {
        DOCKER_CREDS = credentials('soromilena25-dockerhub-password')
        SONAR_TOKEN  = credentials('soromilena25-sonar-token')
        IMAGE_NAME   = 'milena-tasklist-backend'
    }

    stages {

        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Generate Prisma Client') {
            steps {
                sh 'npx prisma generate'
            }
        }

        stage('Unit Tests') {
            steps {
                sh 'npm run test:coverage'
            }
            post {
                always {
                    junit testResults: 'reports/junit.xml', allowEmptyResults: true
                }
            }
        }

        stage('E2E Tests') {
            steps {
                sh 'npm run test:e2e'
            }
            post {
                always {
                    junit testResults: 'reports/junit.xml', allowEmptyResults: true
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh 'sonar-scanner -Dsonar.token=$SONAR_TOKEN'
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t "$DOCKER_CREDS_USR/$IMAGE_NAME:$BUILD_NUMBER" .'
            }
        }

        stage('Security Scan (Trivy)') {
            steps {
                script {
                    sh 'trivy image --format json --output trivy-report.json "$DOCKER_CREDS_USR/$IMAGE_NAME:$BUILD_NUMBER"'
                    def trivyStatus = sh(
                        script: 'trivy image --exit-code 1 --severity HIGH,CRITICAL --format table --output trivy-report.txt "$DOCKER_CREDS_USR/$IMAGE_NAME:$BUILD_NUMBER"',
                        returnStatus: true
                    )
                    if (trivyStatus != 0) {
                        error('Trivy detected HIGH or CRITICAL vulnerabilities. Pipeline blocked. See trivy-report.txt for details.')
                    }
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: 'trivy-report.json, trivy-report.txt', allowEmptyArchive: true
                }
            }
        }

        stage('Generate SBOM') {
            steps {
                sh 'trivy image --format cyclonedx --output sbom-cyclonedx.json "$DOCKER_CREDS_USR/$IMAGE_NAME:$BUILD_NUMBER"'
            }
            post {
                always {
                    archiveArtifacts artifacts: 'sbom-cyclonedx.json', allowEmptyArchive: true
                }
            }
        }

        stage('Push Docker Image') {
            steps {
                sh '''
                    echo "$DOCKER_CREDS_PSW" | docker login -u "$DOCKER_CREDS_USR" --password-stdin
                    docker push "$DOCKER_CREDS_USR/$IMAGE_NAME:$BUILD_NUMBER"
                '''
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}
