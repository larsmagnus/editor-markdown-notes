[link](https://example.com) and [titled](https://example.com "Title") and <https://autolink.example>

[unclosed text](https://example.com

[unclosed url](https://example.com and more text

[no url]() and [](https://empty-text.example) and []()

![image](./image.png) ![unclosed alt](./image.png ![](empty-alt.png)

[ref link][ref] and [missing ref][nope] and [collapsed][] and [shortcut]

[ref]: https://example.com/ref "Ref title"
[collapsed]: https://example.com/collapsed
[shortcut]: <https://example.com/with spaces>

[nested [brackets] inside](https://example.com)

[link with `code` and **bold**](https://example.com)

https://bare.example.com/path?query=1&other=2#hash and www.example.com

[a](b)(c) [x]: not a definition because inline

<not-a-link> <span>inline html</span> <https://ok.example>
