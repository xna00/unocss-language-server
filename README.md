# UnoCSS Language Server

A language server for unocss

## Features

<img width="200" src="https://raw.githubusercontent.com/xna00/unocss-language-server/main/res/nvim-html.gif">

* Simple completion
* Hover

## Install

```sh
npm i unocss-language-server -g
```

## Usage

You can refer to [my nvim configuration](https://github.com/xna00/nvim)
```lua
local util = require 'lspconfig.util'
local configs = require 'lspconfig.configs'
configs['unocss'] = { default_config = {
  cmd = { 'unocss-language-server', '--stdio' },
  filetypes = {
    'html',
    'javascriptreact',
    'rescript',
    'typescriptreact',
    'vue',
    'svelte',
  },
  on_new_config = function(new_config)
  end,
  root_dir = function(fname)
    return util.root_pattern('unocss.config.js', 'unocss.config.ts')(fname)
        or util.find_package_json_ancestor(fname)
        or util.find_node_modules_ancestor(fname)
        or util.find_git_ancestor(fname)
  end,
} }
```

## TODO
- [ ] Reading config from `root_dir`
- [ ] Highlight matched classes

## Related information

* [Language Server Extension Guide](https://code.visualstudio.com/api/language-extensions/language-server-extension-guide)
* [Language Server Protocol Specification](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/)
* [Lsp - Neovim docs](https://neovim.io/doc/user/lsp.html)