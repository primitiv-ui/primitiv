/*
 * A11Y-01 — the scene that gets recorded.
 *
 * Every control here is the real thing: the headless behaviour from
 * `packages/react` source, the styled surface from `registry/components/*` as
 * `primitiv add` copies it, and the token layer as `primitiv tokens` emits it.
 * Nothing is drawn to look like a component, and nothing about focus is faked —
 * the rings are the components' own, at their own geometry, which is the single
 * claim this illustration exists to make.
 *
 * The one thing the scene adds is the key-cap indicator, and it is honest too:
 * it is a real `keydown` listener rendering a real `Kbd`. It reports what the
 * page received, rather than a caption the recording script draws over the top.
 */
import { useEffect, useState } from "react";
import { Check } from "@primitiv-ui/icons";
import { Card, CardContent } from "@registry/card/card";
import { Field, FieldLabel } from "@registry/field/field";
import { Input } from "@registry/input/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  SelectItemLabel,
} from "@registry/select/select";
import { Checkbox } from "@registry/checkbox/checkbox";
import { Switch } from "@registry/switch/switch";
import { Button } from "@registry/button/button";
import { Kbd } from "@registry/kbd/kbd";

/* Three, and the count is load-bearing. Rows are 40px at md/comfortable and the
   panel opens directly under a trigger whose bottom edge is at y=206, so a
   fourth row puts the panel's bottom at 400 — over the key cap at y=375, which
   would hide the one element that says which key produced the movement.
   Measured, not guessed. */
const COUNTRIES = [
  { value: "au", label: "Australia" },
  { value: "br", label: "Brazil" },
  { value: "ca", label: "Canada" },
];

/**
 * How a raw `KeyboardEvent.key` reads on a key cap. Printable characters keep
 * their own glyph — during typing the cap spells out what is being typed, which
 * is the part of the sequence a still frame cannot show.
 */
function capFor(key: string): string {
  if (key === " ") return "Space";
  if (key === "ArrowDown") return "↓";
  if (key === "ArrowUp") return "↑";
  if (key.length === 1) return key === " " ? "Space" : key.toUpperCase();
  return key;
}

/**
 * The frame decides both the control scale and which rows appear — see
 * `frames.mjs`, which is also what the recorder and the key sequence read, so
 * the three cannot disagree about what is on screen.
 */
type SceneProps = {
  size: "xs" | "sm" | "md" | "lg" | "xl";
  controls: readonly string[];
  /** How many of COUNTRIES to list — the panel has to fit below the trigger. */
  options: number;
};

export function Scene({ size, controls, options }: SceneProps) {
  const shows = (control: string) => controls.includes(control);
  const [country, setCountry] = useState("");
  // `seq` only exists to give the cap a changing React key, so repeating the
  // same key still restarts the press animation.
  const [pressed, setPressed] = useState<{ cap: string; seq: number } | null>(null);

  useEffect(() => {
    let seq = 0;
    const onKeyDown = (event: KeyboardEvent) => {
      setPressed({ cap: capFor(event.key), seq: seq++ });
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, []);

  return (
    <div className="stage">
      <Card className="scene-card">
        <CardContent className="scene-form">
          <Field size={size}>
            <FieldLabel>Full name</FieldLabel>
            <Input size={size} name="name" autoComplete="off" placeholder="Ada Lovelace" />
          </Field>

          <Field size={size}>
            <FieldLabel>Country</FieldLabel>
            <Select value={country} onValueChange={setCountry} name="country">
              <SelectTrigger size={size} aria-label="Country">
                <SelectValue placeholder="Choose a country" />
              </SelectTrigger>
              <SelectContent size={size}>
                {COUNTRIES.slice(0, options).map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    <SelectItemIndicator>
                      <Check aria-hidden="true" />
                    </SelectItemIndicator>
                    <SelectItemLabel>{label}</SelectItemLabel>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {shows("checkbox") && (
            <Checkbox size={size} name="releases">
              Email me about releases
            </Checkbox>
          )}
          {shows("switch") && (
            <Switch size={size} name="public">
              Make my profile public
            </Switch>
          )}

          <Button size={size} variant="primary">Create account</Button>
        </CardContent>
      </Card>

      <p className="scene-cap" aria-hidden="true">
        {pressed && (
          <Kbd size={size} key={pressed.seq} className="scene-cap__key">
            {pressed.cap}
          </Kbd>
        )}
      </p>
    </div>
  );
}
