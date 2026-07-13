# Terraform OCI - SOLO el registry (OCIR repo). No provisiona el cluster OKE.
terraform {
  required_version = ">= 1.5"
  required_providers {
    oci = { source = "oracle/oci", version = "~> 5.0" }
  }
}

variable "compartment_ocid" { type = string }
variable "region" {
  type    = string
  default = "us-ashburn-1"
}
variable "repository_name" {
  type    = string
  default = "integration-hub"
}

provider "oci" {
  region = var.region
}

resource "oci_artifacts_container_repository" "integration_hub" {
  compartment_id = var.compartment_ocid
  display_name   = var.repository_name
  is_public      = false
  is_immutable   = true
}

output "repository_name" {
  value = oci_artifacts_container_repository.integration_hub.display_name
}
