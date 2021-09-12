# 🌱 Clippings

An opinionated and minimal highlights and references importer and manager for [Obsidian](https://obsidian.md/).
Clippings is geared towards casuals like myself, who just want to keep track of and review their Instapaper highlights and haphazardly copy-pasted notes from articles and websites, and easily reference them throughout their notes.

You might be interested if you haven't caught on to one of the Readwise-based or Zotero-based Obsidian plugins.
Note that Clippings is very much a work in progress - to get started, check out [CONTRIBUTING.md](./CONTRIBUTING.md).

## Integrations

Integrations handles importing your highlights from various sources.

- [Markdown](#markdown)
- [iBooks](#ibooks)

Clippings makes it easy to implement new integrations through the [Integrations API](./CONTRIBUTING.md#developing-integrations).

### Markdown

Import from a variety of simple formats that Clippings can detect through a crude heuristic.
To use this, just paste your highlights into a temporary note and run the Markdown import command in Obsidian.

In general, the following formats should work well:

- Lots of quotes, each with a link. Works well with e.g. [IFTTT -> Google Drive integration](https://ifttt.com/connect/instapaper/google_docs).

    ```md
    > Hello, it's a highlight!

    [Source](https://bobheadxi.dev)

    > Oh, another highlight.

    And a... comment??

    [Source](https://bobheadxi.dev)
    ```

- A list of quotes for a source. Works well with e.g. [Roam Highlighter extension](https://chrome.google.com/webstore/detail/roam-highlighter/hponfflfgcjikmehlcdcnpapicnljkkc).

    ```md
    [Source](https://bobheadxi.dev)
    - Hello, it's a highlight!
    - Oh, another highlight.
        - And a... comment??
    ```

Variations of the above (different spacing, indentation, multiple sources, etc.) should work as well.

### iBooks

Import your iBooks (otherwise just known as "Books") annotations and notes.

Currently, only the mobile app's ability to share annotations via email is supported.
To import:

- From the iBooks mobile app, open your book and click the "Edit notes"
- Click "Select all" and then "Share" via Mail. Note that it appears you must have the official iOS Mail app installed.
- On a email client that supports viewing the full email source (such as [gmail.com](https://gmail.com/) with the "View original" option), copy the full original content of the email.
- With the contents in your clipboard, run the iBooks import command in Obsidian.
