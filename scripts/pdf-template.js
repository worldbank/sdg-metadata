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
            img {
                max-width: 100%;
            }
        </style>
        <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
        <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
        <script>
        // Lock down the MathJax delimiters to $ and $$.
        MathJax = {
            tex: {
                inlineMath: [['$', '$']],
                displayMath: [['$$', '$$']],
            },
        };
        </script>
    </head>
    <body>
        ${ content }
    </body>
</html>
`