.PHONY: help serve build clean

PORT ?= 8000

help: ## Show available commands
	@echo "App Icon Badger - commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Run the dev server:"
	@echo "  make serve                  # http://127.0.0.1:$(PORT)"
	@echo "  make serve PORT=8080        # custom port"

build: ## Render pug templates into public/index.html
	@chmod +x ./render.sh
	./render.sh

serve: build ## Build and run a local static server for public/
	@go run . --port $(PORT) --dir public

build-server: ## Build the dev server binary
	go build -o bin/app-icon-badger .

clean: ## Remove generated build output
	rm -f public/index.html
	rm -rf bin
