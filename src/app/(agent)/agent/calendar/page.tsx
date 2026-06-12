import { Calendar, Clock, MapPin, Video, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";

type Appointment = {
  id: string;
  title: string;
  client: string;
  time: string;
  location: string;
  type: "showing" | "call" | "meeting";
};

const schedule: { day: string; items: Appointment[] }[] = [
  {
    day: "Today",
    items: [
      {
        id: "ap1",
        title: "Property showing · Pine Ridge Dr",
        client: "Alex Rivera",
        time: "10:00 AM",
        location: "1820 Pine Ridge Dr, Denver",
        type: "showing",
      },
      {
        id: "ap2",
        title: "Buyer consultation call",
        client: "Sarah Chen",
        time: "2:30 PM",
        location: "Video call",
        type: "call",
      },
    ],
  },
  {
    day: "Tomorrow",
    items: [
      {
        id: "ap3",
        title: "Open house · Downtown Luxury Condo",
        client: "3 prospects",
        time: "11:00 AM",
        location: "890 Market St #2401, San Francisco",
        type: "showing",
      },
      {
        id: "ap4",
        title: "Offer review meeting",
        client: "Mike Torres",
        time: "4:00 PM",
        location: "Office",
        type: "meeting",
      },
    ],
  },
];

const typeStyles: Record<Appointment["type"], string> = {
  showing: "bg-primary/10 text-primary",
  call: "bg-ai/10 text-ai",
  meeting: "bg-accent/10 text-accent",
};

export const metadata = {
  title: "Calendar",
};

export default function AgentCalendarPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Calendar</h1>
          <p className="text-muted-foreground">
            Your upcoming showings, calls, and meetings
          </p>
        </div>
        <Button variant="ai">
          <Plus className="h-4 w-4" />
          New appointment
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="This Week" value="5" icon={Calendar} />
        <StatCard title="Showings" value="3" icon={MapPin} variant="ai" />
        <StatCard title="Calls" value="2" icon={Video} variant="accent" />
      </div>

      <div className="space-y-6">
        {schedule.map((group) => (
          <div key={group.day}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {group.day}
            </h2>
            <div className="space-y-3">
              {group.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-4 rounded-lg border bg-card p-4 shadow-card"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${typeStyles[item.type]}`}
                  >
                    {item.type === "call" ? (
                      <Video className="h-5 w-5" />
                    ) : item.type === "meeting" ? (
                      <Calendar className="h-5 w-5" />
                    ) : (
                      <MapPin className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">
                      with {item.client}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {item.time}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {item.location}
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Details
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
