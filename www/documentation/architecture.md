---
layout: single
title: Architecture Diagram
permalink: /documentation/architecture/
---

<div id="architecture-diagram">
  <div class="container">
    <div class="node local" id="authoring-tool">
      Authoring tool
      <span class="icon-container"><i tabindex="0" class="fa fa-info-circle"></i></span>
      <span class="info">
        Custodian agencies enter metadata (in English) into an authoring tool
        using Microsoft Word.
      </span>
    </div>
    <div class="node repo" id="translation-source">
      GitHub: source language
      <span class="icon-container"><i tabindex="0" class="fa fa-info-circle"></i></span>
      <span class="info">
        Metadata from the uploaded authoring tool is converted into English
        source files for translation, and stored in the GitHub repository.
      </span>
    </div>
    <div class="node cat" id="translation-platform">
      Weblate
      <span class="icon-container"><i tabindex="0" class="fa fa-info-circle"></i></span>
      <span class="info">
        Translators log on to Weblate to perform translations, with the help of
        machine-translation services.
      </span>
    </div>
    <div class="node repo" id="translation-targets">
      GitHub: all languages
      <span class="icon-container"><i tabindex="0" class="fa fa-info-circle"></i></span>
      <span class="info">
        Completed translations for the target languages are stored in the
        GitHub repository.
      </span>
    </div>
    <div class="node host" id="hosting-provider">
      GitHub Pages
      <span class="icon-container"><i tabindex="0" class="fa fa-info-circle"></i></span>
      <span class="info">
        GitHub Pages (a free hosting provider) stores the automatically-generated
        output and serves it to the general public, in several different forms.
      </span>
    </div>
    <div class="node host" id="output">
      JSON, XML, PDF, DOC, and website
      <span class="icon-container"><i tabindex="0" class="fa fa-info-circle"></i></span>
      <span class="info">
        All metadata is served in a variety of machine-readable and
        human-friendly formats.
      </span>
    </div>
  </div>
</div>

<script>
window.addEventListener('load', function(event) {
  jsPlumb.ready(function () {

    // Helper function to get overlay labels as tooltips.
    function connectorTip(text, location) {
      if (!location) {
        location = 0.5;
      }
      var label = '' +
        '<div class="node connector-tooltip">' +
          '<span class="icon-container"><i tabindex="0" class="fa fa-info-circle"></i></span>' +
          '<span class="info">' + text + '</span>' +
        '</div>';
      return [['Custom', {create: function() { return $(label); }, location: location}]]
    }

    // Helper function to get overlay arrows.
    function connectorArrow(location) {
      if (!location) {
        location = 0.5;
      }
      return [["Arrow" , { width: 12, length: 12, location: location }]];
    }

    // Draw the connections using the jsPlumb library.
    jsPlumb.importDefaults({
      ConnectionsDetachable: false,
      Connector: 'Straight',
      Endpoint: [ 'Dot', { radius: 4 } ],
      Anchors: ['Bottom', 'Top'],
    });
    jsPlumb.connect({
      source: 'authoring-tool',
      target: 'translation-source',
      overlays: connectorTip('The Word documents are uploaded to the GitHub repository, to be reviewed/approved.'),
    });
    jsPlumb.connect({
      source: 'translation-source',
      target: 'translation-platform',
      overlays: connectorTip('Administrators pull the source files from GitHub to Weblate for translation.'),
    });
    jsPlumb.connect({
      source: 'translation-platform',
      target: 'translation-targets',
      overlays: connectorTip('Administrators push the completed translations back to GitHub to be reviewed/approved.'),
    });
    jsPlumb.connect({
      source: 'translation-targets',
      target: 'hosting-provider',
      overlays: connectorTip('Completed translation files are automtically processed for deployment to GitHub Pages.'),
    });
    jsPlumb.connect({
      source: 'hosting-provider',
      target: 'output',
      overlays: connectorArrow(),
    });
    jsPlumb.connect({
      source: 'output',
      target: 'authoring-tool',
      anchors: ['Right', 'Right'],
      connector: 'Flowchart',
      overlays: connectorTip('If changes are needed, authors can make edits in the authoring tool to start the process again with a new version.'),
    });
    window.addEventListener('resize', function() {
      jsPlumb.repaintEverything();
    });

    // Add the tooltips with Popper.js.
    var repos = document.getElementsByClassName('node');
    for (var i = 0; i < repos.length; i++) {
      var button = repos[i].getElementsByClassName('icon-container');
      var text = repos[i].getElementsByClassName('info');
      if (text.length && button.length) {
        var instance = new Tooltip(button[0], {
          title: text[0].innerHTML,
          placements: ['bottom', 'top'],
          trigger: 'hover focus',
          delay: {
            show: 50,
            hide: 150,
          },
          html: true,
          closeOnClickOutside: true,
          // Hijack the template to workaround a bug by adding an "inner" div.
          // @see https://github.com/FezVrasta/popper.js/issues/669
          template: '<div class="tooltip" role="tooltip">' +
                      '<div class="inner">' +
                        '<div class="tooltip-arrow"></div>' +
                        '<div class="tooltip-inner"></div>' +
                      '</div>' +
                    '</div>',
        });
      }
    }
  });
});

</script>
