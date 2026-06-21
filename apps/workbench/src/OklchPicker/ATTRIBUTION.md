# Attribution

The interaction model of this picker — a paint-backed lightness×chroma plane
and a hue strip, each drawing the sRGB gamut boundary live as the user drags —
is adapted from Evil Martians' [oklch.com](https://oklch.com)
(`evilmartians/oklch-picker`), which is **MIT-licensed**. Only the *model* is
adapted; none of its source is copied. Our colour maths lives in Rust/wasm
(harmoni), not a JS colour library, and we render 2-D charts rather than the
3-D gamut solid oklch.com draws (RFC 0010 §8).

```
MIT License

Copyright (c) 2022 Andrey Sitnik and contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
