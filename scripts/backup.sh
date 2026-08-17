#!/usr/bin/env bash
# ==============================================================================
# Database Backup Script for Production PostgreSQL
# Automatically performs pg_dump, compresses it, and uploads it to Cloud Storage
# (AWS S3, Azure Blob Storage, or GCP Cloud Storage).
# Configure via environment variables or cron schedule.
# ==============================================================================

set -o errexit
set -o pipefail
set -o nounset

# --- Configurations ---
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-"postgres"}
DB_NAME=${DB_NAME:-"medclues_prod"}
PGPASSWORD=${DB_PASSWORD:-"postgres_prod_pass"}
export PGPASSWORD

BACKUP_DIR="/tmp/db_backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILENAME="${DB_NAME}_backup_${TIMESTAMP}.sql.gz"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILENAME}"

CLOUD_PROVIDER=${CLOUD_PROVIDER:-"aws"} # aws, azure, or gcp
BUCKET_NAME=${BUCKET_NAME:-"medclues-prod-db-backups"}

mkdir -p "${BACKUP_DIR}"

echo "========================================="
echo "Starting Database Backup Pipeline"
echo "Timestamp: ${TIMESTAMP}"
echo "========================================="

# 1. Execute SQL Dump & Compress
echo "-> Dumping PostgreSQL database '${DB_NAME}' from host '${DB_HOST}'..."
pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" | gzip > "${BACKUP_PATH}"
echo "-> Backup SQL dump successfully created and compressed: ${BACKUP_PATH}"

# 2. Upload to Target Cloud Storage Provider
if [ "${CLOUD_PROVIDER}" == "aws" ]; then
    echo "-> Uploading backup to AWS S3 bucket: s3://${BUCKET_NAME}/${BACKUP_FILENAME}"
    aws s3 cp "${BACKUP_PATH}" "s3://${BUCKET_NAME}/${BACKUP_FILENAME}"
    echo "-> AWS S3 Upload Complete!"
    
elif [ "${CLOUD_PROVIDER}" == "azure" ]; then
    echo "-> Uploading backup to Azure Blob Storage Container: ${BUCKET_NAME}"
    # Requires AZURE_STORAGE_CONNECTION_STRING or similar credential environment variables
    az storage blob upload \
        --container-name "${BUCKET_NAME}" \
        --file "${BACKUP_PATH}" \
        --name "${BACKUP_FILENAME}"
    echo "-> Azure Blob Upload Complete!"
    
elif [ "${CLOUD_PROVIDER}" == "gcp" ]; then
    echo "-> Uploading backup to GCP Cloud Storage Bucket: gs://${BUCKET_NAME}/${BACKUP_FILENAME}"
    gcloud storage cp "${BACKUP_PATH}" "gs://${BUCKET_NAME}/${BACKUP_FILENAME}"
    echo "-> Google Cloud Storage Upload Complete!"
    
else
    echo "[ERROR] Unknown CLOUD_PROVIDER: '${CLOUD_PROVIDER}'. Skip cloud upload."
    exit 1
fi

# 3. Clean up local backup file
echo "-> Pruning local temporary backup file..."
rm -f "${BACKUP_PATH}"
echo "-> Local cleanup complete."
echo "========================================="
echo "Database Backup Job Finished Successfully!"
echo "========================================="
