module.exports = (indicatorId, content) => `
<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8" />
        <title>${ indicatorId }</title>
        <style>
            h1 {
                border-bottom: 2px solid #BBB;
                padding-bottom: 10px;
              }
            table {
                border-collapse: collapse;
            }
            table, th, td {
                border: 1px solid black;
            }
            th, td {
                padding: 10px;
                text-align: left;
            }
        </style>
    </head>
    <body>
        ${ content }
    </body>
</html>
`