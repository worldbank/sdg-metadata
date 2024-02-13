---
layout: single
title: Metadata
permalink: /metadata/
---
The SDG reference metadata are currently available in the languages below.

{% include translation-status-legend.html %}

For information on the translation process, please see [Documentation]({{ site.baseurl }}/documentation/).

<ul>
  {% for language in site.data.languages %}
  {% assign langcode = language[0] | trim %}
  {% if site.data.store.metadata[langcode] %}
  <li>
    <a class="btn btn--info" href="{{ site.baseurl }}/metadata/{{ language[0] }}">
      {{ language[1].name }}
    </a>
    {% if langcode != 'en' %}
      {% assign stats = site.data.stats[langcode] %}
      {% include translation-status.html stats=stats %}
    {% else %}
    <span class="language-tag">Source Files for Translation</span>
    {% endif %}
  </li>
  {% endif %}
  {% endfor %}
</ul>
