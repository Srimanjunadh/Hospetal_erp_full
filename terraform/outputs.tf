output "k8s_cluster_endpoint" {
  description = "The target Kubernetes cluster endpoint"
  value       = var.cloud_provider == "aws" ? (length(aws_eks_cluster.k8s) > 0 ? aws_eks_cluster.k8s[0].endpoint : "") : (var.cloud_provider == "azure" ? (length(azurerm_kubernetes_cluster.k8s) > 0 ? azurerm_kubernetes_cluster.k8s[0].kube_config[0].host : "") : (length(google_container_cluster.k8s) > 0 ? google_container_cluster.k8s[0].endpoint : ""))
}

output "postgres_db_address" {
  description = "The postgres database connection address"
  value       = var.cloud_provider == "aws" ? (length(aws_db_instance.postgres) > 0 ? aws_db_instance.postgres[0].address : "") : (var.cloud_provider == "azure" ? (length(azurerm_postgresql_flexible_server.postgres) > 0 ? azurerm_postgresql_flexible_server.postgres[0].fqdn : "") : (length(google_sql_database_instance.postgres) > 0 ? google_sql_database_instance.postgres[0].public_ip_address : ""))
}

output "postgres_db_name" {
  description = "The database name"
  value       = "medclues_prod"
}
