import { useState } from "react";

import { Slider } from "@primitiv/react";

import "./SliderExample.scss";

export function SliderExample() {
  const [volume, setVolume] = useState([60]);
  const [price, setPrice] = useState([25, 75]);

  return (
    <div className="sl-example">
      <h2 className="sl-example__title">Slider</h2>

      <section className="sl-example__section">
        <h3 className="sl-example__section-title">Single thumb</h3>
        <p className="sl-example__description">
          Uncontrolled — drag the thumb, click the track, or focus it and use
          the arrow keys.
        </p>
        <Slider.Root
          className="sl-root"
          defaultValue={[40]}
          aria-label="Brightness"
        >
          <Slider.Track className="sl-track">
            <Slider.Range className="sl-range" />
          </Slider.Track>
          <Slider.Thumb className="sl-thumb" />
        </Slider.Root>
      </section>

      <section className="sl-example__section">
        <h3 className="sl-example__section-title">Controlled</h3>
        <p className="sl-example__description">
          State is owned by the parent. Volume is{" "}
          <strong className="sl-example__value">{volume[0]}</strong>.
        </p>
        <Slider.Root
          className="sl-root"
          value={volume}
          onValueChange={setVolume}
          aria-label="Volume"
        >
          <Slider.Track className="sl-track">
            <Slider.Range className="sl-range" />
          </Slider.Track>
          <Slider.Thumb className="sl-thumb" />
        </Slider.Root>
      </section>

      <section className="sl-example__section">
        <h3 className="sl-example__section-title">Range — two thumbs</h3>
        <p className="sl-example__description">
          Selected{" "}
          <strong className="sl-example__value">{price[0]}</strong> –{" "}
          <strong className="sl-example__value">{price[1]}</strong> (kept at
          least 10 apart).
        </p>
        <Slider.Root
          className="sl-root"
          value={price}
          onValueChange={setPrice}
          minStepsBetweenThumbs={10}
          aria-label="Price range"
        >
          <Slider.Track className="sl-track">
            <Slider.Range className="sl-range" />
          </Slider.Track>
          <Slider.Thumb className="sl-thumb" />
          <Slider.Thumb className="sl-thumb" />
        </Slider.Root>
      </section>

      <section className="sl-example__section">
        <h3 className="sl-example__section-title">Stepped</h3>
        <p className="sl-example__description">
          <code>step = 25</code> — snaps to 0, 25, 50, 75, 100.
        </p>
        <Slider.Root
          className="sl-root"
          defaultValue={[50]}
          step={25}
          aria-label="Quality"
        >
          <Slider.Track className="sl-track">
            <Slider.Range className="sl-range" />
          </Slider.Track>
          <Slider.Thumb className="sl-thumb" />
        </Slider.Root>
      </section>

      <section className="sl-example__section">
        <h3 className="sl-example__section-title">Vertical</h3>
        <Slider.Root
          className="sl-root sl-root--vertical"
          defaultValue={[30]}
          orientation="vertical"
          aria-label="Vertical level"
        >
          <Slider.Track className="sl-track sl-track--vertical">
            <Slider.Range className="sl-range" />
          </Slider.Track>
          <Slider.Thumb className="sl-thumb" />
        </Slider.Root>
      </section>

      <section className="sl-example__section">
        <h3 className="sl-example__section-title">Disabled</h3>
        <Slider.Root
          className="sl-root"
          defaultValue={[55]}
          disabled
          aria-label="Disabled slider"
        >
          <Slider.Track className="sl-track">
            <Slider.Range className="sl-range" />
          </Slider.Track>
          <Slider.Thumb className="sl-thumb" />
        </Slider.Root>
      </section>
    </div>
  );
}
