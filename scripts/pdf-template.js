module.exports = (indicatorId, content) => `
<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8" />
        <title>${ indicatorId }</title>
    </head>
    <body>
        ${ content }
    </body>
</html>
`