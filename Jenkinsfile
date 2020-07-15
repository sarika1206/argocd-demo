pipeline {
    agent {
        node {
            label 'master'
        }
    }

    stages {
        stage('Prepare') {
            steps {
                checkout([$class: 'GitSCM',
                branches: [[name: env.BRANCH_NAME]],
                doGenerateSubmoduleConfigurations: false,
                submoduleCfg: [],
                userRemoteConfigs: [[
                    url: 'https://github.com/sarika1206/argocd-demo.git']]
                ])
            }
        }
        stage ('Docker_Build') {
            steps {
                sh'''
                    # Build the image
                    $(aws ecr get-login --region us-west-2 --profile default --no-include-email)
                    docker build . -t k8s-debian-test
		    env
                '''
            }
        }

	stage ('Deploy_K8S') {
             steps {
                        sh '''
                        CONTAINER="k8s-debian-test"
                        REGION="us-west-2"
                        AWS_ACCOUNT="738507247612"
                        AWS_ENVIRONMENT="default"

                        $(aws ecr get-login --region us-west-2 --profile $AWS_ENVIRONMENT --no-include-email)

                        # Deploy image to ECR
                        docker tag $CONTAINER:latest $AWS_ACCOUNT.dkr.ecr.$REGION.amazonaws.com/$CONTAINER:latest
                        docker push $AWS_ACCOUNT.dkr.ecr.$REGION.amazonaws.com/$CONTAINER:latest
                        '''
               }
            }
	    stage ('Deploy into preview env'){
		    steps{
			   withCredentials([string(credentialsId: "argocd-role", variable: 'ARGOCD_AUTH_TOKEN')]) {
			       sh '''
                        
			'''
			script{
				if (env.BRANCH_NAME == 'master') {
					ARGOCD_SERVER="a55eda76d41234773a1192cfc5bf4acd-160446432.us-west-2.elb.amazonaws.com"
                        		ARGOCD_SERVER=$ARGOCD_SERVER
					AWS_ACCOUNT="738507247612"
					REGION="us-west-2"
					CONTAINER="k8s-debian-test"
					IMAGE_DIGEST=(docker image inspect $AWS_ACCOUNT.dkr.ecr.$REGION.amazonaws.com/$CONTAINER:latest -f '{{join .RepoDigests ","}}')
					echo $JOB_BASE_NAME
					echo "sarika"
					argocd app create $JOB_BASE_NAME --repo https://github.com/sarika1206/argocd-dome-deploy.git --revision HEAD --path e2e --dest-namespace preview --dest-server https://kubernetes.default.svc
					echo "sarika1"
					ARGOCD_SERVER=$ARGOCD_SERVER argocd --grpc-web app sync $JOB_BASE_NAME --force
                        		echo "sarika2"
					argocd --grpc-web app set $JOB_BASE_NAME --kustomize-image $IMAGE_DIGEST
                        		echo "sarika3"
					ARGOCD_SERVER=$ARGOCD_SERVER argocd --grpc-web app sync $JOB_BASE_NAME --force
                        		echo "sarika4"
					ARGOCD_SERVER=$ARGOCD_SERVER argocd --grpc-web app wait $JOB_BASE_NAME --timeout 600
					echo "sarika5"
				} else if (updated PR) {
					ARGOCD_SERVER="a55eda76d41234773a1192cfc5bf4acd-160446432.us-west-2.elb.amazonaws.com"
                        		ARGOCD_SERVER=$ARGOCD_SERVER
					AWS_ACCOUNT="738507247612"
					REGION="us-west-2"
					CONTAINER="k8s-debian-test"
					IMAGE_DIGEST=$(docker image inspect $AWS_ACCOUNT.dkr.ecr.$REGION.amazonaws.com/$CONTAINER:latest -f '{{join .RepoDigests ","}}')
					ARGOCD_SERVER=$ARGOCD_SERVER argocd --grpc-web app sync $JOB_BASE_NAME --force
                        		argocd --grpc-web app set $JOB_BASE_NAME --kustomize-image $IMAGE_DIGEST
                        		ARGOCD_SERVER=$ARGOCD_SERVER argocd --grpc-web app sync $JOB_BASE_NAME --force
                        		ARGOCD_SERVER=$ARGOCD_SERVER argocd --grpc-web app wait $JOB_BASE_NAME --timeout 600
				} else if (closed PR) {
					argocd app delete $JOB_BASE_NAME
				}
                        
               		}
            }
        }
    }
}
