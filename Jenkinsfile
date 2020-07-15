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
                branches: [[name: "master"]],
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
                    #    ARGOCD_SERVER="a55eda76d41234773a1192cfc5bf4acd-160446432.us-west-2.elb.amazonaws.com"
                    #    APP_NAME="debian-test-k8s"
                        CONTAINER="k8s-debian-test"
                        REGION="us-west-2"
                        AWS_ACCOUNT="738507247612"
                        AWS_ENVIRONMENT="default"

                        $(aws ecr get-login --region us-west-2 --profile $AWS_ENVIRONMENT --no-include-email)

                        # Deploy image to ECR
                        docker tag $CONTAINER:latest $AWS_ACCOUNT.dkr.ecr.$REGION.amazonaws.com/$CONTAINER:latest
                        docker push $AWS_ACCOUNT.dkr.ecr.$REGION.amazonaws.com/$CONTAINER:latest
                      #  IMAGE_DIGEST=$(docker image inspect $AWS_ACCOUNT.dkr.ecr.$REGION.amazonaws.com/$CONTAINER:latest -f '{{join .RepoDigests ","}}')
                        # Customize image
                      #  ARGOCD_SERVER=$ARGOCD_SERVER 
                      #  argocd --grpc-web app set $APP_NAME --kustomize-image $IMAGE_DIGEST

                        # Deploy to ArgoCD
                      #  argocd version
                      #  ARGOCD_SERVER=$ARGOCD_SERVER argocd --grpc-web app sync $APP_NAME --force
                      #  ARGOCD_SERVER=$ARGOCD_SERVER argocd --grpc-web app wait $APP_NAME --timeout 600
                        '''
               }
            }
	    stage ('Deploy into preview env'){
		    steps{
			   withCredentials([string(credentialsId: "argocd-role", variable: 'ARGOCD_AUTH_TOKEN')]) {
			       sh '''
                        ARGOCD_SERVER="a55eda76d41234773a1192cfc5bf4acd-160446432.us-west-2.elb.amazonaws.com"
                 #       APP_NAME="debian-test"
                        ARGOCD_SERVER=$ARGOCD_SERVER 
			 AWS_ACCOUNT="738507247612"
			 REGION="us-west-2"
			 CONTAINER="k8s-debian-test"
			IMAGE_DIGEST=$(docker image inspect $AWS_ACCOUNT.dkr.ecr.$REGION.amazonaws.com/$CONTAINER:latest -f '{{join .RepoDigests ","}}')
                        #argocd --grpc-web app set $APP_NAME --kustomize-image $IMAGE_DIGEST
			argocd app create app-preview-12345 --repo <pr_repo> --revision <pr_branch> --path <path_in_app> --dest-namespace <preview-namespace> --dest-cluster <preview-cluster>
   			argocd app create app-preview-12345
   			argocd app sync app-preview-12345
		#	} else if updated PR {
   		#		argocd app sync app-preview-<pr_number> 
		#	} else if closed PR {
   		#	argocd app delete app-preview-<pr_number>
		#	}

                        # Deploy to ArgoCD
                        argocd version
                  #      ARGOCD_SERVER=$ARGOCD_SERVER argocd --grpc-web app sync $APP_NAME --force
                  #      ARGOCD_SERVER=$ARGOCD_SERVER argocd --grpc-web app wait $APP_NAME --timeout 600
                        '''
               }
            }
         }
    }
}
