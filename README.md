# Wasserbilanz Web-Viewer

This is a very simple web viewer that displays cloud-optimized GeoTIFFs on an OpenLayers-powered web map.

It is publicly deployed at https://phenocube.org/wasserbilanz/


## Installation

On your device, clone this repo and execute:

1. `npm install`
2. `npm run build -- --base=/wasserbilanz/`
3. `scp -i /path/to/privatekey -r dist/* eocube@phenocube.org:/var/www/wasserbilanz/`
4. `scp -i /path/to/privatekey -r data/* eocube@phenocube.org:/data/indexed_data/eocube/wasserbilanz/`

(Make sure the folders exist on the server beforehand.)

On the server, in `/etc/nginx/sites-enabled/default.conf` add:

```
location /wasserbilanz/data {
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'Range';
        return 200;
    }
    add_header 'Access-Control-Allow-Origin' '*';
    alias /data/indexed_data/eocube/wasserbilanz;
    autoindex on;
}

location /wasserbilanz {
    alias /var/www/wasserbilanz;
    index index.html;
}
```

And execute `sudo service nginx reload`.

*Ready to serve!*


## Authors

Code: Christoph Friedrich <christoph.friedrich@uni-wuerzburg.de>

Data: Thomas Piernicke <thomasp@gfz-potsdam.de>
