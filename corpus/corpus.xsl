<?xml version="1.0" encoding="iso-8859-1"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:template match="/">
    <html>
      <head>
        <meta charset="utf-8"/>
        <meta http-equiv="X-UA-Compatible" content="chrome=1"/>
        <title>Integrated Physics</title>
        <link rel="stylesheet" href="//netdna.bootstrapcdn.com/bootstrap/3.0.3/css/bootstrap.min.css"/>
        <link rel="stylesheet" href="//netdna.bootstrapcdn.com/bootstrap/3.0.3/css/bootstrap-theme.min.css"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <!-- HTML5 Shim and Respond.js IE8 support of HTML5 elements and media queries -->
        <!-- WARNING: Respond.js doesn't work if you view the page via file:// -->
        <!--[if lt IE 9]>
          <script src="https://oss.maxcdn.com/libs/html5shiv/3.7.0/html5shiv.js"></script>
          <script src="https://oss.maxcdn.com/libs/respond.js/1.3.0/respond.min.js"></script>
        <![endif]-->
      </head>
      <body>
        <div class="panel panel-default">
          <div class="panel-heading">Integrated Physics</div>
          <div class="panel-body">
            <p>...</p>
          </div>
          <table class="table">
              <xsl:for-each select="//modules/module">
                <xsl:if test="string(title)">
                  <tr>
                    <td><xsl:value-of select="title"/></td>
                    <td><xsl:value-of select="description"/></td>
                    <td><xsl:value-of select="contents"/></td>
                  </tr>
                </xsl:if>
              </xsl:for-each>
            </table>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>