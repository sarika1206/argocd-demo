#!/usr/bin/env groovy
import org.apache.commons.lang.StringUtils
import java.util.regex.Matcher
import java.util.regex.Pattern
import groovy.json.JsonSlurper

string1=""
string2=""

pipeline {
    agent {
	node {label 'master'}
	}
	
    parameters{
	    string(name:'PREVIEW_POOL', defaultValue: "argocdapptest.rel.polysign.io,pocapp2.rel.polysign.io,pocapp3.polysign.io", description: "Pool of ingress")
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
	    stage('Deploy Code'){      		
		steps {
          		script{
				withCredentials([string(credentialsId: "argocd-role", variable: 'ARGOCD_AUTH_TOKEN')]){
					if (env.BRANCH_NAME.startsWith('PR') ){
						stage('Prepare'){
							try{
								sh'''
								argocd app delete $CHANGE_BRANCH
								sleep 1m
								'''
							} catch(Exception ex){
								sh'''
								echo "Application not found"
								'''
							}
							def pool = "${params.PREVIEW_POOL}".split(',')
							//find non used url
							for (int i = 0; i < pool.length; i++) {
								def domain = "${pool[i]}"								
								//def a = "https://"+"${pool[i]}"
								//def res = sh(script: "curl --insecure '$a' -w '%{http_code}'")
								//def status = sh (script: sh "grep -q '$domain' argocd-dome-deploy/preview/ingress.yaml && echo '\$?'")
								//if ($status == 0){
								//	sh'''
								//	sed -i 's/"$domain"/
								//echo "$status"	
								sh"""
								if grep -q '$domain' argocd-dome-deploy/preview/ingress.yaml; then
									string1='$domain'
								else
									string2='$domain'
								fi
								echo $string1
								echo $string2
								sed -i 's/"\$string1"/"\$string2"/g' argocd-dome-deploy/preview/ingress.yaml
								"""
							}
						}
      						stage('Creating app in preview env') {
							sh''' 
							ARGOCD_SERVER="a55eda76d41234773a1192cfc5bf4acd-160446432.us-west-2.elb.amazonaws.com"
                        				AWS_ACCOUNT="738507247612"
							AWS_REGION="us-west-2"
							CONTAINER="k8s-debian-test"
							CLUSTER="https://kubernetes.default.svc"
							REPO="https://github.com/sarika1206/argocd-dome-deploy.git"
							IMAGE_DIGEST=$(docker image inspect $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com/$CONTAINER:latest -f '{{join .RepoDigests ","}}')
							argocd app create $CHANGE_BRANCH --repo $REPO  --revision HEAD --path preview --dest-server $CLUSTER --dest-namespace preview
							ARGOCD_SERVER=$ARGOCD_SERVER argocd --grpc-web app sync $CHANGE_BRANCH --force 
							argocd --grpc-web app set $CHANGE_BRANCH --kustomize-image $IMAGE_DIGEST
							ARGOCD_SERVER=$ARGOCD_SERVER argocd --grpc-web app sync $CHANGE_BRANCH --force
                        				ARGOCD_SERVER=$ARGOCD_SERVER argocd --grpc-web app wait $CHANGE_BRANCH --timeout 600
							'''
							}
						}
					if (env.BRANCH_NAME == 'master' ){
      						stage('Deploy into staging env') {
							sh''' 
							ARGOCD_SERVER="a55eda76d41234773a1192cfc5bf4acd-160446432.us-west-2.elb.amazonaws.com"
                        				APP_NAME="debian-test"
							PRE_APP="preview-test"
                        				AWS_ACCOUNT="738507247612"
			 				REGION="us-west-2"
			 				CONTAINER="k8s-debian-test"
							#argocd app delete $PRE_APP
							IMAGE_DIGEST=$(docker image inspect $AWS_ACCOUNT.dkr.ecr.$REGION.amazonaws.com/$CONTAINER:latest -f '{{join .RepoDigests ","}}')
                        				argocd --grpc-web app set $APP_NAME --kustomize-image $IMAGE_DIGEST
                        				# Deploy to ArgoCD
                        				ARGOCD_SERVER=$ARGOCD_SERVER argocd --grpc-web app sync $APP_NAME --force
                        				ARGOCD_SERVER=$ARGOCD_SERVER argocd --grpc-web app wait $APP_NAME --timeout 600
							'''
							}
						stage('Deploy into production env'){
							input message:'Approve deployment?'	
							sh'''
							ARGOCD_SERVER="a55eda76d41234773a1192cfc5bf4acd-160446432.us-west-2.elb.amazonaws.com"
                        				APP_NAME="prod-test"
                        				ARGOCD_SERVER=$ARGOCD_SERVER 
							AWS_ACCOUNT="738507247612"
			 				REGION="us-west-2"
			 				CONTAINER="k8s-debian-test"
							IMAGE_DIGEST=$(docker image inspect $AWS_ACCOUNT.dkr.ecr.$REGION.amazonaws.com/$CONTAINER:latest -f '{{join .RepoDigests ","}}')
                        				argocd --grpc-web app set $APP_NAME --kustomize-image $IMAGE_DIGEST
                     		                        ARGOCD_SERVER=$ARGOCD_SERVER argocd --grpc-web app sync $APP_NAME --force
                        				ARGOCD_SERVER=$ARGOCD_SERVER argocd --grpc-web app wait $APP_NAME --timeout 600
							'''
							}
						}
					//else {
					//	stage('Deploy new code into preview env') {
					//		input message:'Approve deployment once PR build is successfully created APP?'
					//		sh''' 
					//		ARGOCD_SERVER="a55eda76d41234773a1192cfc5bf4acd-160446432.us-west-2.elb.amazonaws.com"
                        		//		AWS_ACCOUNT="738507247612"
					//		AWS_REGION="us-west-2"
					//		APP_NAME="preview-test"
					//		CONTAINER="k8s-debian-test"
					//		CLUSTER="https://kubernetes.default.svc"
					//		REPO="https://github.com/sarika1206/argocd-dome-deploy.git"
					//		IMAGE_DIGEST=$(docker image inspect $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com/$CONTAINER:latest -f '{{join .RepoDigests ","}}')
					//		ARGOCD_SERVER=$ARGOCD_SERVER argocd --grpc-web app sync $BRANCH_NAME --force 
					//		argocd --grpc-web app set $BRANCH_NAME --kustomize-image $IMAGE_DIGEST
					//		ARGOCD_SERVER=$ARGOCD_SERVER argocd --grpc-web app sync $BRANCH_NAME --force
                        		//		ARGOCD_SERVER=$ARGOCD_SERVER argocd --grpc-web app wait $BRANCH_NAME --timeout 600
					//		'''
					//		}
					//	}
		    			}
				}
     	   		 }
		}
	}
}
