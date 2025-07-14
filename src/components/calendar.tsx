"use client";
import * as React from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

function SimpleCalendar({ ...props }: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      style={
        {
          "--rdp-accent-color": "#ef4444",
        } as React.CSSProperties
      }
      {...props}
    />
  );
}

export { SimpleCalendar }; 
