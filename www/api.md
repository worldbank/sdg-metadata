---
layout: single
title: API endpoints
permalink: /api/
---
This page list the endpoints available for accessing the metadata programmatically. Supported file types are `json` and `xml`.

> Note that the structure of the responses is experimental during this pilot, and could change.

* ### GET /api/indicators.[file type]

    An array of indicator ids.

    <a class="btn btn--info" href="indicators.json">Try JSON</a>
    <a class="btn btn--info" href="indicators.xml">Try XML</a>

* ### GET /api/[indicator id]/fields.[file type]

    An array of field names for the specified indicator.

    <a class="btn btn--info" href="3-8-2/fields.json">Try JSON</a>
    <a class="btn btn--info" href="3-8-2/fields.xml">Try XML</a>

* ### GET /api/[indicator id].[file type]

    All metadata fields for the specified indicator, translated into all languages.

    <a class="btn btn--info" href="3-8-2.json">Try JSON</a>
    <a class="btn btn--info" href="3-8-2.xml">Try XML</a>

* ### GET /api/[indicator id]/[language].[file type]

    All metadata fields for the specified indicator, translated into the specified language.

    <a class="btn btn--info" href="3-8-2/en.json">Try JSON</a>
    <a class="btn btn--info" href="3-8-2/en.xml">Try XML</a>

* ### GET /api/[indicator id]/[field].[file type]

    The specified metadata field for the specified indicator, translated into all languages.

    <a class="btn btn--info" href="3-8-2/COLL_METHOD.json">Try JSON</a>
    <a class="btn btn--info" href="3-8-2/COLL_METHOD.xml">Try XML</a>

* ### GET /api/[indicator id]/[field]/[language].[file type]

    The specified metadata field for the specified indicator, translated into the specified language.

    <a class="btn btn--info" href="3-8-2/COLL_METHOD/en.json">Try JSON</a>
    <a class="btn btn--info" href="3-8-2/COLL_METHOD/en.xml">Try XML</a>

* ### GET /api/all.[file type]

    All translations of all fields in all indicators.

    <a class="btn btn--info" href="all.json">Try JSON</a>
    <a class="btn btn--info" href="all.xml">Try XML</a>
