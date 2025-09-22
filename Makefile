.PHONY: install build all

all: install build

install:
	@echo "Running npm install..."
	npm install

build:
	@echo "Running npm run build..."
	npm run build
	@echo "Giving aper executable permissions..."
	@sudo chmod +x /usr/local/bin/aper
	@echo "Finish."

clean:
	@echo "Cleaning up node_modules and build files..."
	rm -rf node_modules build dist
