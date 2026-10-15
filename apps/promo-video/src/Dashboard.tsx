import { Avatar, AvatarFallback, AvatarImage } from "@components/avatar";
import { AvatarGroup } from "@components/avatar-group";
import { Badge } from "@components/badge";
import { Button } from "@components/button";
import { Card, CardContent } from "@components/card";
import { Input } from "@components/input";
import { Progress, ProgressIndicator } from "@components/progress";
import { SegmentedControl, SegmentedControlItem } from "@components/segmented-control";
import { Switch } from "@components/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/table";
import avatar1 from "@docs-public/avatar-1.png";
import avatar2 from "@docs-public/avatar-2.png";
import avatar3 from "@docs-public/avatar-3.png";

const ROWS = [
  { name: "api-gateway", owner: "R. Achebe", status: "Live" },
  { name: "billing", owner: "M. Okonjo", status: "Live" },
  { name: "search", owner: "S. Ferreira", status: "Review" },
  { name: "webhooks", owner: "L. Haugen", status: "Paused" },
] as const;

const TONES = { Live: "success", Review: "info", Paused: "warning" } as const;

export const FACES = [
  { src: avatar1, initials: "RA" },
  { src: avatar2, initials: "MO" },
  { src: avatar3, initials: "SF" },
] as const;

/**
 * A believable product surface built only from registry components. Every
 * size is `sm`; the density scope around it does all the scaling.
 */
export const Dashboard = ({ rows = ROWS.length, progress = 72 }: { rows?: number; progress?: number }) => (
  <Card className="v-card">
    <CardContent>
      <div className="v-col">
        <div className="v-row-between">
          <div className="v-row">
            <h2 className="v-title" style={{ fontFamily: "var(--primitiv-heading-h5-font-family)", fontSize: "var(--primitiv-heading-h5-font-size)", lineHeight: "var(--primitiv-heading-h5-line-height)" }}>
              Deployments
            </h2>
            <Badge size="sm" tone="info" variant="counter">
              12
            </Badge>
          </div>
          <div className="v-row">
            <AvatarGroup size="sm">
              {FACES.map((f) => (
                <Avatar key={f.initials} size="sm">
                  <AvatarImage src={f.src} alt="" />
                  <AvatarFallback>{f.initials}</AvatarFallback>
                </Avatar>
              ))}
            </AvatarGroup>
            <Button size="sm">Deploy</Button>
          </div>
        </div>

        <div className="v-row">
          <SegmentedControl size="sm" value="all" onValueChange={() => {}} aria-label="Filter">
            <SegmentedControlItem value="all">All</SegmentedControlItem>
            <SegmentedControlItem value="live">Live</SegmentedControlItem>
            <SegmentedControlItem value="paused">Paused</SegmentedControlItem>
          </SegmentedControl>
          <div className="v-grow">
            <Input size="sm" placeholder="Search services" aria-label="Search" style={{ width: "100%" }} />
          </div>
        </div>

        <Table size="sm">
          <TableHead>
            <TableRow>
              <TableHeader>Service</TableHeader>
              <TableHeader>Owner</TableHeader>
              <TableHeader>Status</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {ROWS.slice(0, rows).map((row) => (
              <TableRow key={row.name}>
                <TableCell>
                  <span className="v-mono">{row.name}</span>
                </TableCell>
                <TableCell>{row.owner}</TableCell>
                <TableCell>
                  <Badge size="sm" tone={TONES[row.status]}>
                    {row.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="v-row-between">
          <Switch size="sm" checked onCheckedChange={() => {}}>
            Auto-deploy
          </Switch>
          <div className="v-row" style={{ width: "46%" }}>
            <span className="v-meta">Build</span>
            <div className="v-grow">
              <Progress size="sm" value={progress} aria-label="Build progress">
                <ProgressIndicator />
              </Progress>
            </div>
            <span className="v-meta v-mono">{Math.round(progress)}%</span>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);
