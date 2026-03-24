import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { create } from "zustand";

interface DateRangeStore {
  range: string;
  setRange: (range: string) => void;
}

export const useDateRange = create<DateRangeStore>((set) => ({
  range: "90",
  setRange: (range) => set({ range }),
}));

export function Header({ title }: { title: string }) {
  const { range, setRange } = useDateRange();

  return (
    <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      <h1 className="text-xl font-semibold text-brand-navy tracking-tight">{title}</h1>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-secondary/50 p-1 rounded-lg border border-border/50">
          <Calendar className="h-4 w-4 text-muted-foreground ml-2" />
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[180px] border-none bg-transparent h-8 shadow-none focus:ring-0">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
              <SelectItem value="365">Last Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </header>
  );
}
