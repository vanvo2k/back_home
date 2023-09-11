pipeline {
    agent {
        label 'tamz2'
    }

    stages {

        stage('Build') {
            steps {
                sh 'yarn'
            }
        }

        stage('Deploy') {
            steps {
                sh 'NODE_ENV=staging pm2 start index.js --name teeamz-backend-dev || :'
                sh 'NODE_ENV=staging pm2 restart teeamz-backend-dev --update-env || :'
            }
        }
    }
}