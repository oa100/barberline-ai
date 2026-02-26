"use client";

import { Phone, Calendar, Clock, TrendingUp } from "lucide-react";

const stats = [
  { label: "Calls Today", value: "12", icon: Phone },
  { label: "Booked Today", value: "8", icon: Calendar },
  { label: "Upcoming", value: "5", icon: Clock },
];

const callLog = [
  { time: "2:15 PM", caller: "(214) 555-0142", duration: "2:45", outcome: "Booked", color: "bg-emerald-500/20 text-emerald-400" },
  { time: "1:48 PM", caller: "(972) 555-0391", duration: "1:12", outcome: "Booked", color: "bg-emerald-500/20 text-emerald-400" },
  { time: "12:30 PM", caller: "(469) 555-0287", duration: "0:45", outcome: "Info Only", color: "bg-gold/20 text-gold" },
  { time: "11:15 AM", caller: "(817) 555-0163", duration: "3:10", outcome: "Booked", color: "bg-emerald-500/20 text-emerald-400" },
];

const chartBars = [
  { day: "Mon", total: 8, booked: 5 },
  { day: "Tue", total: 12, booked: 8 },
  { day: "Wed", total: 10, booked: 7 },
  { day: "Thu", total: 15, booked: 11 },
  { day: "Fri", total: 18, booked: 14 },
  { day: "Sat", total: 22, booked: 18 },
  { day: "Sun", total: 6, booked: 4 },
];

const maxBar = 22;

export function DashboardMockup() {
  return (
    <div className="relative mx-auto mt-20 max-w-5xl animate-fade-in-up stagger-5">
      {/* Glow behind the mockup */}
      <div className="absolute -inset-8 bg-gold/5 rounded-2xl blur-[60px] pointer-events-none" />

      {/* Browser chrome */}
      <div className="relative overflow-hidden rounded-lg border border-gold/20 bg-card shadow-2xl shadow-gold/5">
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-gold/10 bg-secondary px-4 py-3">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-400/60" />
          </div>
          <div className="mx-auto flex items-center gap-2 rounded border border-gold/10 bg-background px-4 py-1 text-xs text-muted-foreground">
            <span>app.barberline.ai/dashboard</span>
          </div>
        </div>

        {/* Dashboard content */}
        <div className="p-5 md:p-8 space-y-6">
          {/* Header */}
          <div>
            <h3 className="font-serif text-lg text-cream">Welcome, Marcus</h3>
            <p className="text-xs text-warm-gray">Here&apos;s an overview of Fresh Cuts Studio today.</p>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded border border-gold/10 bg-secondary p-3 md:p-4"
              >
                <div className="flex items-center gap-2 text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider">
                  <stat.icon className="h-3 w-3 text-gold" />
                  {stat.label}
                </div>
                <div className="mt-1 font-serif text-2xl md:text-3xl text-cream">
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Mini bar chart */}
            <div className="rounded border border-gold/10 bg-secondary p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="h-3 w-3 text-gold" />
                  This Week
                </span>
                <span className="text-[10px] text-gold font-medium">67% conversion</span>
              </div>
              <div className="flex items-end gap-1.5 md:gap-2 h-24">
                {chartBars.map((bar) => (
                  <div key={bar.day} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex flex-col items-center gap-0.5">
                      <div
                        className="w-full rounded-sm bg-gold/15"
                        style={{ height: `${(bar.total / maxBar) * 80}px` }}
                      />
                      <div
                        className="w-full rounded-sm bg-gold -mt-0.5"
                        style={{
                          height: `${(bar.booked / maxBar) * 80}px`,
                          marginTop: `-${(bar.booked / maxBar) * 80}px`,
                        }}
                      />
                    </div>
                    <span className="text-[9px] text-muted-foreground">{bar.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent calls */}
            <div className="rounded border border-gold/10 bg-secondary p-4">
              <span className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2 mb-3">
                <Phone className="h-3 w-3 text-gold" />
                Recent Calls
              </span>
              <div className="space-y-2">
                {callLog.map((call, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs py-1.5 border-b border-gold/5 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground w-14 text-[10px]">{call.time}</span>
                      <span className="text-cream font-medium text-[11px]">{call.caller}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-[10px]">{call.duration}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-medium ${call.color}`}>
                        {call.outcome}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
