import {
  Calendar,
  CalendarApi,
  DateSelectArg,
  EventClickArg,
  ViewApi,
} from "@fullcalendar/core";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import React, { useEffect, useRef } from "react";
import Layout from "@/components/layout";
import { useWarpContext } from "@/context/warp.context";
import { notifications } from "@mantine/notifications";

let eventId = 0;

function createEventId() {
  return String(eventId++);
}

export function resetEventId() {
  eventId = 0;
}

export default function Home() {
  const { hollowdb, isConnected } = useWarpContext();
  const CalendarRef = useRef<HTMLInputElement>() as any;

  // checks for previous events on a deployed contract
  // also resets
  useEffect(() => {
    const checkPrevEvents = async () => {
      if (hollowdb?.contractTxId == "" || !isConnected) return;

      // clean up the calendar (helps with redeployment)
      removeAll();

      let oldEventKeys: Array<string> = [];
      let oldEvents: Array<any> = [];

      // get all existing keys on the hollowdb contract
      await hollowdb?.getAllKeys().then((keys: []) => {
        if (keys) {
          oldEventKeys = Array.from(keys.values());
        }
      });

      // get all existing values on the hollowdb contract then convert it to an array
      const eventValues = await hollowdb?.getStorageValues(oldEventKeys);
      const mappedEvents = eventValues?.cachedValue;
      if (mappedEvents) {
        oldEvents = Array.from(mappedEvents.values());
      }

      // filter empty events
      oldEvents = oldEvents.filter((elements) => {
        return elements !== null;
      });

      // Obtain a calendar api instance to add previous events to the calendar
      const calendarApi = CalendarRef.current.getApi();
      for (let i = 0; i < oldEvents.length; i++) {
        oldEvents[i] = await JSON.parse(oldEvents[i]);
        const eventId = createEventId();
        if (oldEvents[i].title != "")
          calendarApi.addEvent({
            id: eventId,
            title: oldEvents[i].title,
            start: new Date(oldEvents[i].start),
            end: new Date(oldEvents[i].end),
            allDay: new Date(oldEvents[i].allDay),
          });
      }
    };
    checkPrevEvents();
  }, [hollowdb]);

  async function put(key: string, value: {}) {
    if (!isConnected) {
      return;
    }
    await hollowdb?.put(key, JSON.stringify(value));
  }

  async function removeAll() {
    resetEventId();
    const calendarApi = CalendarRef.current.getApi();
    calendarApi.removeAllEvents();
  }

  async function remove(key: string) {
    if (!isConnected) {
      return;
    }
    // empty event object
    const emptyValue = JSON.stringify({
      title: "",
      start: "",
      end: "",
      allDay: "",
    });
    await hollowdb?.update(key, emptyValue);
  }

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    if (!hollowdb || !isConnected) {
      notifications.show({
        title: "Contract not found",
        message: "Connect your wallet and deploy a contract first",
        color: "red",
      });
      return;
    }

    let title = prompt("Please enter a new title for your event");
    let calendarApi = selectInfo.view.calendar;

    calendarApi.unselect(); // clear date selection

    if (title) {
      const eventId = createEventId();
      const start = selectInfo.startStr;
      const end = selectInfo.endStr;
      const allDay = selectInfo.allDay;
      calendarApi.addEvent({
        id: eventId,
        title,
        start: start,
        end: end,
        allDay: allDay,
      });
      put(eventId, { title: title, start: start, end: end, allDay: allDay });
    }
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    if (
      confirm(
        `Are you sure you want to delete the event '${clickInfo.event.title}'`
      )
    ) {
      remove(clickInfo.event.id);
      clickInfo.event.remove();
    }
  };

  return (
    <Layout>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin, timeGridPlugin]}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek",
        }}
        initialView="dayGridMonth"
        nowIndicator={true}
        editable={true}
        selectable={true}
        select={handleDateSelect}
        ref={CalendarRef}
        eventClick={handleEventClick}
      />
    </Layout>
  );
}
