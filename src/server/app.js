import express from 'express';
import compression from 'compression';
import path from 'path';
import http from 'http';
import datasets from './datasets';
import config from 'config';

let app = express();

app.use(compression());

app.use('/datasets', datasets);

// In development mode, we create a proxy server to forward all
// http request to the webpack-dev-server
if (config.watch) {
  let httpProxy = require('http-proxy');
  let proxy = httpProxy.createProxyServer();

  app.all('*', function(req, res) {
    proxy.web(req, res, {
      target: 'http://localhost:' + config.ports.devServer
    });
  });

  proxy.on('error', function(e) {
    console.log('Could not connect to proxy, please try again...');
  });

} else if (!config.test) {
  app.use(express.static(path.join(__dirname, '../../build/website')));
}

export default app;