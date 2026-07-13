# Terraform GCP - SOLO el registry (Artifact Registry). No provisiona el cluster GKE.
terraform {
  required_version = ">= 1.5"
  required_providers {
    google = { source = "hashicorp/google", version = "~> 5.0" }
  }
}

variable "project_id" { type = string }
variable "region" {
  type    = string
  default = "us-central1"
}
variable "repository_id" {
  type    = string
  default = "integration-hub"
}

provider "google" {
  project = var.project_id
  region  = var.region
}

resource "google_artifact_registry_repository" "integration_hub" {
  location      = var.region
  repository_id = var.repository_id
  format        = "DOCKER"
  description   = "Imagenes nativas de Integration Hub"
}

output "repository_url" {
  value = "${var.region}-docker.pkg.dev/${var.project_id}/${var.repository_id}"
}
