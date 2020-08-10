#!/usr/bin/env groovy
import org.apache.commons.lang.StringUtils
import java.util.regex.Matcher
import java.util.regex.Pattern
import groovy.json.JsonSlurper

domain1 = []
domain2 = []

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
							sh'''
							git clone https://github.com/sarika1206/argocd-dome-deploy.git
							'''
							for (int i = 0; i < pool.length; i++) {
								def domain = "${pool[i]}"
								def status = sh returnStatus: true, script: "grep -q \"$domain\" argocd-dome-deploy/preview/ingress.yaml && echo \$?"
								"${status}"
								if (0 == status){
									domain1.add("$domain")
								}
								else{ 
									domain2.add("$domain")
								}
							}
							echo "Already_used => $domain1 , free => $domain2 "
							a = domain1[0]
							b = domain2[0]
							echo "Preview url is => $b"
							def replace = sh returnStatus: true, script: "sed -i 's/$a/$b/g' argocd-dome-deploy/preview/ingress.yaml"
							sh'''
							cd argocd-dome-deploy/
							git status
							git add preview/ingress.yaml
							git commit -m "updated preview url in ingress.yaml"
							git push
							cd ..
							rm -rf argocd-dome-deploy/
							'''
							
						}
      						stage('Deploying application in preview env') {
							sh''' 
							ARGOCD_SERVER="a4029de4acdb6402d9c666710e4aab2d-1724426219.us-west-2.elb.amazonaws.com"
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
							ARGOCD_SERVER="a4029de4acdb6402d9c666710e4aab2d-1724426219.us-west-2.elb.amazonaws.com"
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
							ARGOCD_SERVER="a4029de4acdb6402d9c666710e4aab2d-1724426219.us-west-2.elb.amazonaws.com"
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
					
		    			}
				}
     	   		 }
		}
	}
}
