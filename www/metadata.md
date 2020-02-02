---
layout: default
title: Metadata
---
{% include breadcrumbs.html %}
<h2>{{ page.title }}</h2>
<ul>
  {% for language in site.data.all %}
  {% assign langcode = language[0] %}
  <li>
    <a class="call-to-action" href="{{ langcode }}">{{ site.languages[langcode] }}</a>
  </li>
  {% endfor %}
</ul>
