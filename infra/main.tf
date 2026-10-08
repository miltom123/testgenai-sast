terraform {
  required_version = ">= 1.6"
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.6"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.7"
    }
  }
}

provider "docker" {}

resource "random_password" "database" {
  length  = 32
  special = false
}

resource "random_password" "jwt" {
  length  = 64
  special = false
}

resource "docker_network" "testgenai" {
  name = "testgenai-ci"
}

resource "docker_image" "postgres" {
  name         = "postgres:16-alpine"
  keep_locally = true
}

resource "docker_image" "app" {
  name         = "testgenai:terraform-ci"
  keep_locally = true
  build {
    context    = abspath("${path.module}/..")
    dockerfile = "backend/Dockerfile"
  }
}

resource "docker_container" "postgres" {
  name  = "testgenai-ci-postgres"
  image = docker_image.postgres.image_id
  env = [
    "POSTGRES_DB=calidad_ci",
    "POSTGRES_USER=testgenai",
    "POSTGRES_PASSWORD=${random_password.database.result}"
  ]
  networks_advanced { name = docker_network.testgenai.name }
  ports {
    internal = 5432
    external = 15432
    ip       = "127.0.0.1"
  }
  healthcheck {
    test         = ["CMD-SHELL", "pg_isready -U testgenai -d calidad_ci"]
    interval     = "5s"
    timeout      = "5s"
    retries      = 12
    start_period = "10s"
  }
  wait = true
}

resource "docker_container" "app" {
  name       = "testgenai-ci-app"
  image      = docker_image.app.image_id
  depends_on = [docker_container.postgres]
  env = [
    "NODE_ENV=production",
    "PORT=4000",
    "DATABASE_URL=postgresql://testgenai:${random_password.database.result}@testgenai-ci-postgres:5432/calidad_ci?schema=public",
    "DIRECT_URL=postgresql://testgenai:${random_password.database.result}@testgenai-ci-postgres:5432/calidad_ci?schema=public",
    "JWT_SECRET=${random_password.jwt.result}",
    "CORS_ORIGINS=http://localhost:14000",
    "AI_PROVIDER_DEFAULT=gemini"
  ]
  networks_advanced { name = docker_network.testgenai.name }
  ports {
    internal = 4000
    external = 14000
    ip       = "127.0.0.1"
  }
  wait = true
}

output "application_url" {
  value = "http://127.0.0.1:14000"
}

output "database_url" {
  value     = "postgresql://testgenai:${random_password.database.result}@127.0.0.1:15432/calidad_ci?schema=public"
  sensitive = true
}
