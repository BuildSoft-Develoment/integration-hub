# Terraform AWS - SOLO el registry (ECR) + politica de push. No provisiona el cluster.
# Uso:
#   cd ops/fase-7-deploy/dist/aws/terraform
#   terraform init && terraform apply -var region=us-east-1
terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}

variable "region" { type = string }
variable "repository_name" {
  type    = string
  default = "integration-hub"
}

provider "aws" {
  region = var.region
}

resource "aws_ecr_repository" "integration_hub" {
  name                 = var.repository_name
  image_tag_mutability = "IMMUTABLE"
  image_scanning_configuration { scan_on_push = true }
}

# Retencion: conservar solo las ultimas 20 imagenes.
resource "aws_ecr_lifecycle_policy" "prune" {
  repository = aws_ecr_repository.integration_hub.name
  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "keep last 20 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 20
      }
      action = { type = "expire" }
    }]
  })
}

output "repository_url" {
  value = aws_ecr_repository.integration_hub.repository_url
}
