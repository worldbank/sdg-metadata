.PHONY: test

install:
	npm install
	cd www && bundle install

snapshots:
	node scripts/snapshots.js

build.documents:
	node scripts/prepare-build.js documents

build.api:
	node scripts/prepare-build.js api

build.history:
	node scripts/prepare-build.js history

build.site:
	node scripts/prepare-build.js site
	cd www && bundle exec jekyll build

build: build.documents build.api build.history build.site

publish: snapshots build

# Full (slow) local server, including website, API, and documents.
serve.full: build
	node scripts/watch-translations.js full &
	cd www && bundle exec jekyll serve --skip-initial-build

# Quick local server, only including the website.
serve: build.site
	node scripts/watch-translations.js &
	cd www && bundle exec jekyll serve --skip-initial-build

test:
	npm test
