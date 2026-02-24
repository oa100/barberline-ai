"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { CallLog, CallOutcome } from "@/lib/supabase/types";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const outcomeBadgeVariant: Record<
  CallOutcome,
  "default" | "secondary" | "outline" | "destructive"
> = {
  booked: "default",
  no_availability: "secondary",
  fallback: "outline",
  hangup: "destructive",
  info_only: "secondary",
};

const outcomeLabel: Record<CallOutcome, string> = {
  booked: "Booked",
  no_availability: "No Availability",
  fallback: "Fallback",
  hangup: "Hangup",
  info_only: "Info Only",
};

export function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getTranscriptSummary(
  transcript: Record<string, unknown> | null,
): string | null {
  if (!transcript) return null;
  if (typeof transcript.summary === "string") return transcript.summary;
  if (typeof transcript.text === "string") return transcript.text;
  return JSON.stringify(transcript);
}

interface CallTableProps {
  calls: CallLog[];
}

export function CallTable({ calls }: CallTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (calls.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No calls yet
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-8" />
          <TableHead>Time</TableHead>
          <TableHead>Caller</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Outcome</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {calls.map((call) => {
          const isExpanded = expandedId === call.id;
          const summary = getTranscriptSummary(call.transcript);

          return (
            <Fragment key={call.id}>
              <TableRow
                className="cursor-pointer"
                onClick={() =>
                  setExpandedId(isExpanded ? null : call.id)
                }
                data-testid={`call-row-${call.id}`}
              >
                <TableCell>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </TableCell>
                <TableCell>
                  {new Date(call.created_at).toLocaleString()}
                </TableCell>
                <TableCell>{call.caller_phone ?? "Unknown"}</TableCell>
                <TableCell>{formatDuration(call.duration_sec)}</TableCell>
                <TableCell>
                  <Badge variant={outcomeBadgeVariant[call.outcome]}>
                    {outcomeLabel[call.outcome]}
                  </Badge>
                </TableCell>
              </TableRow>
              {isExpanded && summary && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="bg-muted/50 text-sm text-muted-foreground"
                  >
                    {summary}
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
}
