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
			 
			script{
				if (env.BRANCH_NAME.startsWith('PR') ) {
					ARGOCD_SERVER="a55eda76d41234773a1192cfc5bf4acd-160446432.us-west-2.elb.amazonaws.com"
                        	//	ARGOCD_SERVER=$ARGOCD_SERVER
					AWS_ACCOUNT="738507247612"
					AWS_REGION="us-west-2"
					CONTAINER="k8s-debian-test"
					CLUSTER="https://kubernetes.default.svc"
					REPO="https://github.com/sarika1206/argocd-dome-deploy.git"
					//IMAGE_DIGEST=$(docker image inspect $AWS_ACCOUNT.dkr.ecr.$REGION.amazonaws.com/$CONTAINER:latest -f '{{join .RepoDigests ","}}')
					sh "IMAGE_DIGEST=\$(docker image inspect 738507247612.dkr.ecr.us-west-2.amazonaws.com/k8s-debian-test:latest -f '{{join .RepoDigests /",/"}}')"
				//	sh "argocd app create $JOB_BASE_NAME --repo $REPO  --revision HEAD --path e2e --dest-server $CLUSTER --dest-namespace preview"
				//	sh "ARGOCD_SERVER=\$(ARGOCD_SERVER argocd --grpc-web app sync $JOB_BASE_NAME --force)"
				//	sh "argocd --grpc-web app set $JOB_BASE_NAME --kustomize-image $IMAGE_DIGEST"
                        	//	sh "ARGOCD_SERVER=\$(ARGOCD_SERVER argocd --grpc-web app sync $JOB_BASE_NAME --force)"
                        	//	sh "ARGOCD_SERVER=\$(ARGOCD_SERVER argocd --grpc-web app wait $JOB_BASE_NAME --timeout 600)"
			
					}
				}
               		}
            	}
        }
    }
}
