.PHONY: all
all:

project:
	docker compose run --rm app bun .projenrc.ts

build:
	docker compose run --rm app bun run build

install:
	docker compose run --rm app bun i

publish:
	docker compose run --rm app npm publish

bump:
	docker compose run --rm app bun run bump
