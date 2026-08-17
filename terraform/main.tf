# ==============================================================================
# Terraform Main Configuration for Multi-Cloud Production Setup
# Provisions Kubernetes clusters, managed PostgreSQL DBs, and RabbitMQ brokers.
# Supported providers: AWS, Azure, Google Cloud.
# ==============================================================================

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

# --- AWS Provider Configuration ---
provider "aws" {
  region = var.aws_region
}

# --- Azure Provider Configuration ---
provider "azurerm" {
  features {}
}

# --- Google Cloud Provider Configuration ---
provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
}

# ==========================================
# 1. AWS Resource Deployments (EKS & RDS)
# ==========================================

# VPC Network
resource "aws_vpc" "main" {
  count                = var.cloud_provider == "aws" ? 1 : 0
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  tags = {
    Name = "${var.project_name}-vpc"
  }
}

# EKS Cluster
resource "aws_eks_cluster" "k8s" {
  count    = var.cloud_provider == "aws" ? 1 : 0
  name     = "${var.project_name}-eks-cluster"
  role_arn = aws_iam_role.eks_role[0].arn

  vpc_config {
    subnet_ids = [aws_subnet.public_a[0].id, aws_subnet.public_b[0].id]
  }
}

# RDS PostgreSQL
resource "aws_db_instance" "postgres" {
  count                  = var.cloud_provider == "aws" ? 1 : 0
  allocated_storage      = 50
  engine                 = "postgres"
  engine_version         = "15.4"
  instance_class         = "db.t3.medium"
  db_name                = "medclues_prod"
  username               = var.db_username
  password               = var.db_password
  parameter_group_name   = "default.postgres15"
  skip_final_snapshot    = true
  publicly_accessible    = false
  vpc_security_group_ids = [aws_security_group.db_sg[0].id]
}

# IAM Support Resources
resource "aws_iam_role" "eks_role" {
  count = var.cloud_provider == "aws" ? 1 : 0
  name  = "${var.project_name}-eks-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "eks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_subnet" "public_a" {
  count             = var.cloud_provider == "aws" ? 1 : 0
  vpc_id            = aws_vpc.main[0].id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "${var.aws_region}a"
}

resource "aws_subnet" "public_b" {
  count             = var.cloud_provider == "aws" ? 1 : 0
  vpc_id            = aws_vpc.main[0].id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "${var.aws_region}b"
}

resource "aws_security_group" "db_sg" {
  count  = var.cloud_provider == "aws" ? 1 : 0
  vpc_id = aws_vpc.main[0].id
  name   = "${var.project_name}-db-sg"

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }
}

# ==========================================
# 2. Azure Resource Deployments (AKS & Postgres)
# ==========================================

# Azure Resource Group
resource "azurerm_resource_group" "rg" {
  count    = var.cloud_provider == "azure" ? 1 : 0
  name     = "${var.project_name}-rg"
  location = var.azure_location
}

# Azure Kubernetes Service (AKS)
resource "azurerm_kubernetes_cluster" "k8s" {
  count               = var.cloud_provider == "azure" ? 1 : 0
  name                = "${var.project_name}-aks-cluster"
  location            = azurerm_resource_group.rg[0].location
  resource_group_name = azurerm_resource_group.rg[0].name
  dns_prefix          = var.project_name

  default_node_pool {
    name       = "default"
    node_count = 3
    vm_size    = "Standard_D2s_v5"
  }

  identity {
    type = "SystemAssigned"
  }
}

# Azure Database for PostgreSQL Flexible Server
resource "azurerm_postgresql_flexible_server" "postgres" {
  count                = var.cloud_provider == "azure" ? 1 : 0
  name                 = "${var.project_name}-db-server"
  resource_group_name  = azurerm_resource_group.rg[0].name
  location             = azurerm_resource_group.rg[0].location
  version              = "15"
  administrator_login  = var.db_username
  administrator_password = var.db_password
  storage_mb           = 32768
  sku_name             = "B_Standard_D2s_v3"
}

# ==========================================
# 3. Google Cloud Resource Deployments (GKE & Cloud SQL)
# ==========================================

# GCP Network
resource "google_compute_network" "vpc" {
  count                   = var.cloud_provider == "gcp" ? 1 : 0
  name                    = "${var.project_name}-vpc"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "subnet" {
  count         = var.cloud_provider == "gcp" ? 1 : 0
  name          = "${var.project_name}-subnet"
  ip_cidr_range = "10.0.0.0/16"
  region        = var.gcp_region
  network       = google_compute_network.vpc[0].id
}

# Google Kubernetes Engine (GKE) Cluster
resource "google_container_cluster" "k8s" {
  count              = var.cloud_provider == "gcp" ? 1 : 0
  name               = "${var.project_name}-gke-cluster"
  location           = var.gcp_region
  network            = google_compute_network.vpc[0].id
  subnetwork         = google_compute_subnetwork.subnet[0].id
  initial_node_count = 3

  node_config {
    machine_type = "e2-medium"
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]
  }
}

# GCP Cloud SQL PostgreSQL Instance
resource "google_sql_database_instance" "postgres" {
  count            = var.cloud_provider == "gcp" ? 1 : 0
  name             = "${var.project_name}-sql-instance"
  database_version = "POSTGRES_15"
  region           = var.gcp_region

  settings {
    tier = "db-f1-micro"
    ip_configuration {
      ipv4_enabled    = true
      private_network = google_compute_network.vpc[0].id
    }
  }
}
