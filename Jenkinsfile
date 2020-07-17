#!/usr/bin/env groovy
import org.apache.commons.lang.StringUtils
import java.util.regex.Matcher
import java.util.regex.Pattern
import groovy.json.JsonSlurper


pipeline {
    agent {
	node {label 'master'}
	}

    stages {
	stage('Prepare'){
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

      stage('Deploy into preview env') {
        steps {
          script{
		withCredentials([string(credentialsId: "argocd-role", variable: 'ARGOCD_AUTH_TOKEN')]){
			
			if (env.BRANCH_NAME.startsWith('PR') ){
				sh''' 
				ARGOCD_SERVER="a55eda76d41234773a1192cfc5bf4acd-160446432.us-west-2.elb.amazonaws.com"
                        	AWS_ACCOUNT="738507247612"
				AWS_REGION="us-west-2"
				CONTAINER="k8s-debian-test"
				CLUSTER="https://kubernetes.default.svc"
				REPO="https://github.com/sarika1206/argocd-dome-deploy.git"
				IMAGE_DIGEST=$(docker image inspect $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com/$CONTAINER:latest -f '{{join .RepoDigests ","}}')
				argocd app create $CHANGE_BRANCH --repo $REPO  --revision HEAD --path e2e --dest-server $CLUSTER --dest-namespace preview
				ARGOCD_SERVER=$ARGOCD_SERVER argocd --grpc-web app sync $CHANGE_BRANCH --force 
				argocd --grpc-web app set $CHANGE_BRANCH --kustomize-image $IMAGE_DIGEST
				ARGOCD_SERVER=$ARGOCD_SERVER argocd --grpc-web app sync $CHANGE_BRANCH --force
                        	ARGOCD_SERVER=$ARGOCD_SERVER argocd --grpc-web app wait $CHANGE_BRANCH --timeout 600
				'''
				}
			}
		    }
		}
     	    }
	}
}
