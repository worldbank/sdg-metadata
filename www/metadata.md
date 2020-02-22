---
layout: single
title: Metadata
---
The SDG metadata is currently available in the following languages:

<ul>
  {% for language in site.data.all %}
  {% assign langcode = language[0] %}
  <li>
    <a class="btn btn--info" href="{{ site.baseurl }}/metadata/{{ langcode }}">{{ site.languages[langcode] }}</a>
  </li>
  {% endfor %}
</ul>
