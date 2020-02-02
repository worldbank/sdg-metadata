---
layout: default
title: JSON Endpoints
---
{% include breadcrumbs.html %}

<h2>{{ page.title }}</h2>

### GET /api/indicators.json

An array of indicator ids.

<a class="call-to-action" href="indicators.json">Try it</a>

### GET /api/[indicator id]/fields.json

An array of field names for the specified indicator.

<a class="call-to-action" href="1-2-1/fields.json">Try it</a>

### GET /api/[indicator id].json

All metadata fields for the specified indicator, translated into all languages.

<a class="call-to-action" href="1-2-1.json">Try it</a>

### GET /api/[indicator id]/[language].json

All metadata fields for the specified indicator, translated into the specified language.

<a class="call-to-action" href="1-2-1/en.json">Try it</a>

### GET /api/[indicator id]/[field].json

The specified metadata field for the specified indicator, translated into all languages.

<a class="call-to-action" href="1-2-1/COLL_METHOD.json">Try it</a>

### GET /api/[indicator id]/[field]/[language].json

The specified metadata field for the specified indicator, translated into the specified language.

<a class="call-to-action" href="1-2-1/COLL_METHOD/en.json">Try it</a>

### GET /api/all.json

All translations of all fields in all indicators.

<a class="call-to-action" href="all.json">Try it</a>