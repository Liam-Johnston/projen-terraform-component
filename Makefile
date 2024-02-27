.PHONY: all
all:

project:
	docker compose run --rm app bun .projenrc.ts

run:
	docker compose run --rm app bun start

build:
	docker compose run --rm app bun run build

install:
	docker compose run --rm app bun i

publish:
	docker compose run --rm app npm publish

bump:
	docker compose run --rm app bun run bump
