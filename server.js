// Config
// var config = require('../load_config');
//
// var port = config.services.tile_server.vector_port;
// var shapesPath = config.services.tile_server.shapes_path;
// var requireXml = shapesPath + '/surface-test/_require.xml';

var requireXml = __dirname + '/resources/require.xml';
var port = 7001;
var vectorTileProto = __dirname + '/resources/vector_tile.proto';

// Libs
var fs = require('fs');
var http = require('http');
var url = require('url');

// Load tilelive
var npmLocation = './node_modules/';
if (!fs.existsSync(npmLocation)) {
    npmLocation = '/usr/lib/node_modules/';
}

// Protobuf & zlib
var zlib = require('zlib');
var protobuf = require(npmLocation + 'protocol-buffers');
var pMessages = protobuf(fs.readFileSync(vectorTileProto));

// Start the think
var tilelive = require(npmLocation + 'tilelive');
require(npmLocation + 'tilelive-bridge').registerProtocols(tilelive);

// App package
var app = {
    start: function () {
        var server = http.createServer(function (request, response) {
            var query = url.parse(request.url, true).query;

            if (request.url == '/') {
                app.showIndex(request, response);
                return;
            }

            try {
                query.zoom = parseInt(query.zoom);

                tilelive.load('bridge://' + requireXml, function (err, source) {
                    if (err) {
                        app.showError(request, response, err);
                        return;
                    }

                    source.getTile(query.zoom, query.x, query.y, function (err, tile, headers) {
                        if (err) {
                            app.showError(request, response, err);
                            return;
                        }

                        headers['Access-Control-Allow-Origin'] = '*';
                        headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept';

                        response.writeHead(200, headers);

                        response.write(tile);
                        response.end();

                        // Debug
                        zlib.gunzip(tile, function (err, dezipped) {
                            var parsed = pMessages.Tile.decode(dezipped);
                            console.log("\n\n\n", query.zoom, query.x, query.y);
                            console.log(JSON.stringify(parsed));
                        });
                    });
                });
            } catch (err) {
                app.showError(request, response, err);
            }
        });

        server.listen(port);

        console.log('Server running at http://127.0.0.1:' + port);
    },

    showIndex: function (request, response) {
        var content = fs.readFileSync(__dirname + '/index.html').toString();
        content = content.replace(/\%HOST\%/gi, request.headers.host);

        response.writeHead(200, {
            'Content-Type': 'text/html'
        });
        response.write(content);
        response.end();
    },

    showError: function (request, response, error) {
        console.log('\033[31m' + 'ERROR' + '\033[39m', error);

        response.writeHead(500, {
            'Content-Type': 'text/plain'
        });
        response.write(JSON.stringify(error));
        response.end();
    }
};

app.start();
