## Install Gulp Globally
```
$ npm install -g gulp
```

## Install local dependencies
```
$ npm install
```

## Configure folders and more

Modify `gulpConfig.json` to configure gulp behaviour.

## Gulp tasks

***All tasks produce sourcemaps and unminified output***

###### CSS
`gulp build:css`
`gulp build:js`

###### JS
`gulp watch:css`
`gulp watch:js`

###### ALL
`gulp build`
`gulp watch`

### Minify and remove source maps
***Add --prod flag to any of above commands***
