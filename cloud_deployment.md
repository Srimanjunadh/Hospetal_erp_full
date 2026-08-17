# Production Cloud Deployment Guide

This guide details the steps to deploy, scale, and maintain the MediClues+ microservice ERP system in a production cloud environment (AWS EKS, Azure AKS, or Google Cloud GKE).

---

## 1. Multi-Cloud Provisioning (Terraform)

Our [Terraform scripts](file:///c:/Users/shaik/OneDrive%20-%20Vignan%20University/Desktop/Hospetal_erp_full/terraform) automate cluster setup. Select your cloud provider via the `cloud_provider` variable:

```bash
cd terraform
terraform init
terraform plan -var="cloud_provider=aws" -var="db_password=SecurePasswordProd123!"
terraform apply -var="cloud_provider=aws" -var="db_password=SecurePasswordProd123!"
```

---

## 2. Secrets Management

Do not store raw passwords in plain Kubernetes manifests. Follow these cloud-native secrets ingestion steps:

### A. AWS Secrets Manager Integration
Use the AWS Secrets Store CSI driver to project secrets directly into the pods:
```yaml
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: aws-secrets-provider
  namespace: medclues
spec:
  provider: aws
  parameters:
    objects: |
      - objectName: "medclues/production/secrets"
        objectType: "secretsmanager"
```

### B. Azure Key Vault Integration
Link AKS Pod Identities to load credentials dynamically:
```yaml
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: azure-kv-provider
  namespace: medclues
spec:
  provider: azure
  parameters:
    usePodIdentity: "true"
    keyvaultName: "medcluesKeyVault"
    objects: |
      array:
        - |
          objectName: db-password
          objectType: secret
```

---

## 3. SSL / TLS Setup (Cert-Manager)

Cert-Manager automates Let's Encrypt certificates provisioning.

1. **Install Cert-Manager via Helm**:
   ```bash
   helm repo add jetstack https://charts.jetstack.io
   helm install cert-manager jetstack/cert-manager --namespace cert-manager --create-namespace --set installCRDs=true
   ```

2. **Register ClusterIssuer**:
   Create `k8s/issuer.yaml` mapping Let's Encrypt certificate challenge solutions:
   ```yaml
   apiVersion: cert-manager.io/v1
   kind: ClusterIssuer
   metadata:
     name: letsencrypt-prod
   spec:
     acme:
       server: https://acme-v02.api.letsencrypt.org/directory
       email: operations@medclues.com
       privateKeySecretRef:
         name: letsencrypt-prod-key
       solvers:
       - http01:
           ingress:
             class: nginx
   ```

3. **Deploy Ingress Router**:
   Apply [k8s/ingress.yaml](file:///c:/Users/shaik/OneDrive%20-%20Vignan%20University/Desktop/Hospetal_erp_full/k8s/ingress.yaml):
   ```bash
   kubectl apply -f k8s/ingress.yaml
   ```

---

## 4. Horizontal Pod Auto-scaling (HPA)

The Horizontal Pod Autoscaler is configured in [k8s/hpa.yaml](file:///c:/Users/shaik/OneDrive%20-%20Vignan%20University/Desktop/Hospetal_erp_full/k8s/hpa.yaml). It polls CPU load and scales replicas:
- **Gateway**: Scales dynamically between 2 and 10 pods when CPU averages > 70%.
- **Microservices**: Scale between 2 and 8 pods.

Ensure the Kubernetes metrics-server is running on your cluster to supply utilization stats:
```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
kubectl apply -f k8s/hpa.yaml
```

---

## 5. Monitoring & Logging

### A. Metrics Collection (Prometheus & Grafana)
Apply the Prometheus [k8s/monitoring.yaml](file:///c:/Users/shaik/OneDrive%20-%20Vignan%20University/Desktop/Hospetal_erp_full/k8s/monitoring.yaml) to scrape API and system performance. Use Helm to install the Prometheus stack:
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack --namespace monitoring --create-namespace
kubectl apply -f k8s/monitoring.yaml
```

### B. Centralized Logging (Loki, Promtail & Grafana)
Inject standard stdout/stderr logs into Loki using Grafana Promtail agents:
```bash
helm repo add grafana https://grafana.github.io/helm-charts
helm install loki grafana/loki-stack --namespace logging --create-namespace
```

---

## 6. Automated Backup Execution

Manage daily database backups using our [scripts/backup.sh](file:///c:/Users/shaik/OneDrive%20-%20Vignan%20University/Desktop/Hospetal_erp_full/scripts/backup.sh) automation. It performs compressed binary SQL dumps and uploads them to S3 / Blob / GCS.

### Scheduling via CronJob in Kubernetes
Create `k8s/backup-cronjob.yaml` to execute the script daily at 2:00 AM:
```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: db-backup-job
  namespace: medclues
spec:
  schedule: "0 2 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: postgres-backup
            image: postgres:15-alpine
            envFrom:
            - secretRef:
                name: medclues-secrets
            command:
            - /bin/sh
            - -c
            - "/workspace/scripts/backup.sh"
            volumeMounts:
            - name: script-vol
              mountPath: /workspace/scripts
          restartPolicy: OnFailure
          volumes:
          - name: script-vol
            configMap:
              name: backup-script-cm
```
