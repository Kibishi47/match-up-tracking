.PHONY: help ip dev dev-build up down stop logs

help:
	@echo "Available commands:"
	@echo "  make ip        - Update HOST_IP in .env with current local IP address"
	@echo "  make dev       - Update IP then run containers with docker compose up --build"
	@echo "  make up        - Update IP then run containers with docker compose up"
	@echo "  make stop      - Stop running containers"
	@echo "  make down      - Stop and remove containers and network"
	@echo "  make logs      - Follow container logs"

ip:
	@bash scripts/update-ip.sh

dev: ip
	docker compose up --build

up: ip
	docker compose up

stop:
	docker compose stop

down:
	docker compose down

logs:
	docker compose logs -f app
