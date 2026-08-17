variable "cloud_provider" {
  description = "The target cloud provider (aws, azure, or gcp)"
  type        = string
  default     = "aws"
}

variable "environment" {
  description = "Deployment environment (production, staging, or development)"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Name prefix for all resources"
  type        = string
  default     = "medclues-erp"
}

# --- AWS Configs ---
variable "aws_region" {
  description = "Target AWS region"
  type        = string
  default     = "us-east-1"
}

# --- Azure Configs ---
variable "azure_location" {
  description = "Target Azure location resource group"
  type        = string
  default     = "East US"
}

# --- GCP Configs ---
variable "gcp_project_id" {
  description = "Target Google Cloud Project ID"
  type        = string
  default     = "medclues-prod-project"
}

variable "gcp_region" {
  description = "Target Google Cloud region"
  type        = string
  default     = "us-central1"
}

# --- DB & AMQP Settings ---
variable "db_password" {
  description = "Database administrator password"
  type        = string
  sensitive   = true
}

variable "db_username" {
  description = "Database administrator username"
  type        = string
  default     = "medclues_admin"
}
