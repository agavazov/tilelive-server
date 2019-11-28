## Vector map server

Boilerplate NodeJS Vector map tile server. The tiles are comply with the standards of Mapbox which has defined an open standard for vector map tiles called "[vector-tile-spec](https://github.com/mapbox/vector-tile-spec/tree/master/2.0)" which uses Google protocol buffers for space-efficient data serialisation. 

![](https://github.com/agavazov/tilelive-server/raw/master/principle.png)

## The idea of this project

The idea of the project is to give you a basic idea of how to create your vector server connected with your own database.

The coordinate system is `WGS84`

Projection settings are `+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0.0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs +over` (check the xml file)

## How to run it
```
npm install
node server.js
```
