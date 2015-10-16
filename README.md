# Persistent Cache Webpack Plugin

[![NPM](https://nodei.co/npm/persistent-cache-webpack-plugin.png)](http://github.com/bholloway/persistent-cache-webpack-plugin)

Webpack plugin that persists the compiler cache to the file system

## Rationale

Thanks to the Webpack compiler cache, incremental compile can be orders of magnitude faster than the initial compilation the precedes it.

This plugin persists the compiler cache to the file system in order to also reduce the initial compile time.

## Limitations

This plugin is experimental and you should be aware of the following.

* The plugin may not be able to serialise all of your cache content, what it can serialise should improve performance.
* The cache may be large, possibly an **order of magnitude larger than your project**.
* The file which persists the cache can grow with use and may need **periodic deletion**.

## Usage

The default options will result in silent operation unless the cache cannot be written.

```javascript
var PersistentCacheWebpackPlugin = require('persistent-cache-webpack-plugin');
{
  plugins : [
    new PersistentCacheWebpackPlugin({
      file     : './webpack.cache.json',
      warn     : true,
      stats    : false,
      whitelist: []
    })
  ]
}
```

### Options

* `file` is the path to a file which will persist the cache.

* `warn` enables feedback on cache properties that failed the serialisation process, use `warn:'verbose'` for extended detail.

* `stats` enables feedback on the performance of the plugin.

* `ignore` an Array of RegExp that allows certain warnings to occur without failing serialisation.
