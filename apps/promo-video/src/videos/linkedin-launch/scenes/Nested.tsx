import { Badge } from "@components/badge";
import { Card, CardContent } from "@components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/table";

import { easeInOutCubic, easeOutCubic, progress } from "@lib/time";
import { DensityScope } from "@kit/scopes";
import { useTime } from "@kit/timeline";
import { fadeStyle, Header, retype } from "@kit/ui";

export const NESTED_START = 17.6;
export const NESTED_END = 23.35;
const OUT = 5.15;

const INNER_AT = 1.5;
const OUTER_AT = 3.25;
const GLIDE = 0.9;

const ROWS = [
  ["Q1", "4 variants", "Drift"],
  ["Q2", "2 variants", "Review"],
  ["Q3", "1 variant", "Fixed"],
] as const;

const TONE = { Drift: "danger", Review: "warning", Fixed: "success" } as const;

const Tag = ({ text, style }: { text: string; style?: React.CSSProperties }) => (
  <code
    className="v-code"
    style={{ fontSize: 11.5, padding: "5px 9px", borderRadius: 7, position: "absolute", ...style }}
  >
    <span className="attr">data-density</span>
    <span className="tag">=</span>
    <span className="val">"{text}"</span>
  </code>
);

/** 17.6–23.35s: a dense table inside a roomy article, each with its own attribute. */
export const Nested = () => {
  const t = useTime();
  const pInner = easeInOutCubic(progress(t, INNER_AT, INNER_AT + GLIDE));
  const pOuter = easeInOutCubic(progress(t, OUTER_AT, OUTER_AT + GLIDE));
  const outline = easeOutCubic(progress(t, INNER_AT - 0.35, INNER_AT + 0.15));
  const exit = fadeStyle(t, 0.35, OUT, { dist: 24 });

  return (
    <>
      <Header
        overline="Inheritance"
        headline={"Set it once.\nOr *anywhere.*"}
        sub="Density is inherited. A dense table in a roomy article is one attribute on its container."
        at={0}
        out={OUT}
      />
      <div className="v-stage" style={{ top: 226, ...exit }}>
        <DensityScope from="spacious" to="compact" p={pOuter}>
          <div style={{ position: "relative" }}>
            <Card className="v-card">
              <CardContent>
                <div className="v-col">
                  <div className="v-meta" style={{ textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600 }}>
                    Field notes
                  </div>
                  <h3
                    className="v-title"
                    style={{
                      fontSize: "var(--primitiv-heading-h5-font-size)",
                      lineHeight: "var(--primitiv-heading-h5-line-height)",
                      marginTop: "calc(-0.5 * var(--primitiv-card-md-gap))",
                    }}
                  >
                    What a quarter of drift costs
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "var(--primitiv-body-sm-font-size)",
                      lineHeight: "var(--primitiv-body-sm-line-height)",
                      color: "var(--primitiv-content-secondary)",
                    }}
                  >
                    Four versions of one control shipped in a single release. Each was right against a
                    different mockup.
                  </p>

                  <div style={{ position: "relative" }}>
                    <div
                      style={{
                        position: "absolute",
                        inset: -6,
                        borderRadius: 12,
                        border: "1.5px dashed var(--primitiv-action-link-foreground-default)",
                        background: "color-mix(in oklch, var(--primitiv-color-brand-500) 6%, transparent)",
                        opacity: outline,
                      }}
                    />
                    <DensityScope from="spacious" to="dense" p={pInner}>
                      <Table size="sm">
                        <TableHead>
                          <TableRow>
                            <TableHeader>Release</TableHeader>
                            <TableHeader>Buttons</TableHeader>
                            <TableHeader>State</TableHeader>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {ROWS.map(([q, v, s]) => (
                            <TableRow key={q}>
                              <TableCell>{q}</TableCell>
                              <TableCell>{v}</TableCell>
                              <TableCell>
                                <Badge size="sm" tone={TONE[s]}>
                                  {s}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </DensityScope>
                    <Tag
                      text={retype("spacious", "dense", pInner)}
                      style={{ right: 4, bottom: -19, opacity: outline }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Tag
              text={retype("spacious", "compact", pOuter)}
              style={{ right: 12, top: -13, ...fadeStyle(t, 0.7) }}
            />
          </div>
        </DensityScope>
      </div>
    </>
  );
};
