# Terraform Azure - SOLO el registry (ACR). No provisiona el cluster AKS.
terraform {
  required_version = ">= 1.5"
  required_providers {
    azurerm = { source = "hashicorp/azurerm", version = "~> 3.0" }
  }
}

variable "resource_group" { type = string }
variable "location" {
  type    = string
  default = "eastus"
}
variable "registry_name" {
  type        = string
  description = "Nombre global-unico del ACR (solo alfanumerico)."
  default     = "integrationhubacr"
}

provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "rg" {
  name     = var.resource_group
  location = var.location
}

resource "azurerm_container_registry" "acr" {
  name                = var.registry_name
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  sku                 = "Standard"
  admin_enabled       = false
}

output "login_server" {
  value = azurerm_container_registry.acr.login_server
}
