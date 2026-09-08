// hooks/useSecurityEvent.ts

import { API_URL } from "@/config/apiConfig";
import { useState } from "react";

export type SecurityEvent = {
  _id: string;
  type: "ssh_failed_login" | "possible_brute_force";
  severity: "medium" | "high";
  username: string;
  ip_address: string;
  attempt_count: number;
  timestamp: string;
  should_alert: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
};

export type Filter = "all" | "high" | "medium";

type EventsResponse = {
  data: SecurityEvent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
  };
};

export function useSecurityEvents() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [filter, setFilter] = useState<Filter>("all");

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEvents = async (
    requestedPage = 1,
    selectedFilter: Filter = filter,
  ) => {
    try {
      const params = new URLSearchParams({
        page: requestedPage.toString(),
        limit: "5",
      });

      if (selectedFilter !== "all") {
        params.append("severity", selectedFilter);
      }

      const response = await fetch(
        `${API_URL}/api/events?${params.toString()}`,
      );

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const result: EventsResponse = await response.json();

      if (requestedPage === 1) {
        setEvents(result.data);
      } else {
        setEvents((currentEvents) => {
          const combined = [...currentEvents, ...result.data];

          return Array.from(
            new Map(combined.map((event) => [event._id, event])).values(),
          );
        });
      }

      setPage(result.pagination.page);
      setTotal(result.pagination.total);
      setHasNextPage(result.pagination.hasNextPage);
    } catch (error) {
      console.error("Failed to fetch security events:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const loadMore = async () => {
    if (!hasNextPage || loadingMore || loading) {
      return;
    }

    setLoadingMore(true);
    try {
      await fetchEvents(page + 1, filter);
    } finally {
      setLoadingMore(false);
    }
  };

  const refresh = () => {
    if (refreshing) {
      return;
    }

    setRefreshing(true);

    fetchEvents(1, filter);
  };

  const changeFilter = (newFilter: Filter) => {
    if (newFilter === filter) {
      return;
    }

    setFilter(newFilter);
    setPage(1);
    setLoading(true);

    fetchEvents(1, newFilter);
  };

  const addEvent = (event: SecurityEvent) => {
    // Don't insert a socket event that doesn't match
    // the currently selected filter.
    if (filter !== "all" && event.severity !== filter) {
      return;
    }

    setEvents((currentEvents) => {
      const exists = currentEvents.some(
        (currentEvent) => currentEvent._id === event._id,
      );

      if (exists) {
        return currentEvents;
      }

      return [event, ...currentEvents];
    });

    setTotal((currentTotal) => currentTotal + 1);
  };

  return {
    events,
    filter,
    page,
    total,
    hasNextPage,
    loading,
    loadingMore,
    refreshing,
    fetchEvents,
    loadMore,
    refresh,
    changeFilter,
    addEvent,
  };
}
