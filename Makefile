.PHONY: all
all:

project:
	docker compose run --rm app bun .projenrc.ts

run:
	docker compose run --rm app bun start

build:
	bun run build

publish:
	docker compose run --rm app npm publish

bump:
	docker compose run --rm app bun run bump
