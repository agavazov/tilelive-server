// Config
var config = require('../load_config');
var port = config.services.tile_server.vector_port;

// Libs
var fs = require('fs');
var http = require('http');
var url = require('url');

// Load tilelive
var npmLocation = './node_modules/';
if (!fs.existsSync(npmLocation))
{
	npmLocation = '/usr/lib/node_modules/';
}

// Protobuf
var zlib = require('zlib');
var protobuf = require(npmLocation + 'protocol-buffers');
var pMessages = protobuf(fs.readFileSync('/volumes/htdocs/test/vectors/vector_tile.proto'));

// Sqlite
var mbTilesFile = '/volumes/htdocs/test/vectors/bulgaria-lite.mbtiles';
var sqlite3 = require(npmLocation + 'sqlite3').verbose();
var db = new sqlite3.Database(mbTilesFile);

var app = {
	port: port,

	start: function ()
	{
		var server = http.createServer(function (request, response)
		{
			var query = url.parse(request.url, true).query;

			if (query.zoom)
			{
				query.zoom = parseInt(query.zoom);
			}

			try
			{
				if (!query.type)
				{
					app.showMap(request, response);
				}
				else if (query.type && query.x && query.y && query.zoom)
				{
					query.x  = 9223;
					query.y = 10440;
					query.zoom = 14;

					try
					{
						db.serialize(function ()
						{
							var sql = 'SELECT "tile_data" FROM "main"."tiles" WHERE "zoom_level" = "' + query.zoom + '" AND "tile_column" = "' + query.x + '" AND "tile_row" = "' + query.y + '"';
							// var sql = 'SELECT "tile_data" FROM "main"."tiles" WHERE "zoom_level" = "' + query.zoom + '" AND "tile_column" = "' + query.x + '" LIMIT 1';
							console.log("\n\n" + sql + "\n\n");

							db.get(sql, function (err, row)
							{
								if (err)
								{
									app.showError(request, response, err);
									return;
								}

								if (!row)
								{
									app.showError(request, response, 'No results found');
									return;
								}

								var tile = row.tile_data;

								var headers = {
									'Content-Type': 'application/x-protobuf',
									'x-tilelive-contains-data': true,
									'Content-Encoding': 'gzip',
									'Access-Control-Allow-Origin': '*',
									'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
								};

								response.writeHead(200, headers);

								// response.write(tile);
								// response.end();

								// @todo remove me
								zlib.gunzip(tile, function (err, dezipped)
								{
									var parsed = pMessages.Tile.decode(dezipped);

									console.log(JSON.stringify(parsed));

									var pbf = pMessages.Tile.encode(parsed);

									zlib.gzip(pbf, function (err, zipped)
									{
										response.write(zipped);
										response.end();
									});
								});
							});
						});
					}
					catch (err)
					{
						app.showError(request, response, err);
					}

				}
				else
				{
					app.showError(request, response, 'Page not found');
				}
			}
			catch (err)
			{
				app.showError(request, response, 'ERROR::EXCEPTION - ' + err);
			}
		});

		server.listen(app.port);

		console.log('Server running at http://127.0.0.1:' + app.port);
	},

	showMap: function (request, response)
	{
		var content = fs.readFileSync(__dirname + '/lib/map_demo.html').toString();
		content = content.replace(/\%HOST\%/gi, request.headers.host);

		response.writeHead(200, {
			'Content-Type': 'text/html'
		});
		response.write(content);
		response.end();
	},

	showError: function (request, response, error)
	{
		console.log('\033[31m' + 'ERROR' + '\033[39m', error);

		response.writeHead(500, {
			'Content-Type': 'text/plain'
		});
		response.write(JSON.stringify(error));
		response.end();
	}
};

app.start();
