# weblee-utils [![Build Status](https://travis-ci.org/weblee-solutions/weblee-utils.svg?branch=master)](https://travis-ci.org/weblee-solutions/weblee-utils)
A cli/gulp library for quicker for quicker front-end development

#### How To Use
1. run `npm i --save-dev git://github.com/weblee-solutions/weblee-utils.git`
2. Run `weblee` from root folder to see list of tasks.
3. Run `weblee setup` within the project's npm environment (add `weblee-setup` to npm scripts).
 
#### Example Config
```
{
  "name": "project_name"
  "avocode" : {
      "userSelector": "User's Full Name",
      "projectSelector": "Project_name_to_match_against"
  },
  "workingDir" "/an/absolute/path|default|wordpress",
  "tasks" : [
    {
      "name" : "stylus",
      "input": "relative/path/to/stylus/folder/from/workingDir",
      "output": "relative/path/to/stylesheets/folder/from/workingDir"
    },
    {
      "name" : "pug-php",
      "input": "relative/path/to/pug/folder/from/workingDir",
      "output": "relative/path/to/php/folder/from/workingDir",
      "options": {
        "pretty": true
      }
    },
    {
      "name" : "jsx",
      "input": "relative/path/to/jsx/folder/from/workingDir",
      "options": {
        "ignore": ["glob/pattern/to/ignore", "**/node_modules/**"]
       }
    }
  ]
}
```
 

##### Config Details
* All paths are relative to `workingDir`. `workingDir` is an absolute path.
* `workingDir` when set to `"default"`, uses the `process.cwd()` (the current working directory)
* `jsx`, `stylus`, `less`, and `js` tasks support `options.ignore` field which is a [glob pattern](https://github.com/isaacs/node-glob#glob-primer) to exclude

###### Task Options

Task Names    | Details
--------------|---------
`pug-php`     | [additional helper functions](lib/pug/templates/_functions.pug) are saved  and included before compilation. compiles to `.php` files
`pug-ejs`     | [additional helper functions](lib/pug/templates/_functions.pug) are saved  and included before compilation. compiles to `.ejs` files
`pug-html`    | [additional helper functions](lib/pug/templates/_functions.pug) are saved  and included before compilation. compiles to `.html` files
`stylus`      | [additional helper functions](lib/stylus/templates/) are included at compilation. compiles to css
`stylus-bem`  | [additional helper functions](lib/stylus/templates/) are included at compilation. compiles to css. Read more about [stylus-bem](https://github.com/khalidhoffman/stylus-bem)
`sass`        | compiles to css
`compass`     | compiles to css
`less`        | compiles less to css. will prompt for filename.
`css`         | minifies css with cssnano. Will rewrite files with `.min.css` extension. Accepts path to single file or folder relative to workingDir for input
`js`          | beautifies js, overwriting file
`rjs`         | bundles and minfies with requirejs. input path should be a path to a requirejs config `build.js`
`webpack`     | bundles with webpack. input path should be a path to a webpack config file
`jsx`         | compiles to `.js` in same directory as original `.jsx` file
`html2pug`    | compiles `.html` files to `.pug` files
`php2pug`     | compiles `.php` files to `.pug` files
