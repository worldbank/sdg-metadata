window.addEventListener('load', function(event) {
    $('.fa-info-circle').each(function() {
        var title = document.getElementById($(this).attr('aria-describedby'));
        if (title) {
            new Tooltip(this, {
                title: title.innerHTML,
                trigger: 'hover focus',
                template:   '<div class="tooltip" role="tooltip">' +
                                '<div class="inner">' +
                                    '<div class="tooltip-arrow"></div>' +
                                    '<div class="tooltip-inner"></div>' +
                                '</div>' +
                            '</div>',
            });
        }
    })
});
