# Wasserbilanz Web-Viewer

This is a very simple web viewer that displays cloud-optimized GeoTIFFs on an OpenLayers-powered web map.

It is publicly deployed at https://wasserbilanz.eo2cube.org/


## Installation

On your device, clone this repo and execute:

1. `npm install`
2. `npm run build`
3. `scp -i /path/to/privatekey -r dist/* eocube@eo2cube.org:/var/www/wasserbilanz/`
4. `scp -i /path/to/privatekey -r data/* eocube@eo2cube.org:/var/www/wasserbilanz/data`

(Make sure the folders exist on the server beforehand.)

On the server, in `/etc/caddy/Caddyfile` add:

```
wasserbilanz.eo2cube.org {
    root * /var/www/wasserbilanz
    file_server
}
```

And execute `docker exec -w /etc/caddy caddy caddy reload`.

If Caddy doesn't find the files, verify that `/var/www` is mounted into the `caddy` Docker container (i.e. it is listed in the `volumes` section of `/home/eocube/Docker/proxy/docker-compose.yml`).

*Ready to serve!*


## Authors

Code: Christoph Friedrich <christoph.friedrich@uni-wuerzburg.de>

Data: Thomas Piernicke <thomasp@gfz-potsdam.de>
