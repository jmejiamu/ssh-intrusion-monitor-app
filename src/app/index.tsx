import { useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  type Filter,
  type SecurityEvent,
  useSecurityEvents,
} from "@/hooks/useSecurityEvent";

import { socket } from "@/services/socket";

export default function Index() {
  const {
    events,
    filter,
    total,
    loading,
    loadingMore,
    refreshing,
    fetchEvents,
    loadMore,
    refresh,
    changeFilter,
    addEvent,
  } = useSecurityEvents();

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    socket.connect();

    const handleConnect = () => {
      console.log("Socket connected:", socket.id);
    };

    const handleEvent = (event: SecurityEvent) => {
      addEvent(event);
    };

    const handleConnectionError = (error: Error) => {
      console.log("Socket connection error:", error.message);
    };

    socket.on("connect", handleConnect);
    socket.on("security_event", handleEvent);
    socket.on("connect_error", handleConnectionError);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("security_event", handleEvent);
      socket.off("connect_error", handleConnectionError);

      socket.disconnect();
    };
  }, [filter]);

  const highCount = events.filter((event) => event.severity === "high").length;

  const mediumCount = events.filter(
    (event) => event.severity === "medium",
  ).length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#39D98A" />

        <Text style={styles.loadingText}>Loading security events...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={events}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        onEndReached={loadMore}
        onEndReachedThreshold={0.2}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor="#39D98A"
          />
        }
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <View>
                <Text style={styles.eyebrow}>SECURITY OPERATIONS</Text>

                <Text style={styles.title}>SSH Monitor</Text>

                <Text style={styles.subtitle}>
                  Raspberry Pi Intrusion Detection
                </Text>
              </View>

              <View style={styles.status}>
                <View style={styles.statusDot} />

                <Text style={styles.statusText}>ONLINE</Text>
              </View>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>TOTAL EVENTS</Text>

                <Text style={styles.statValue}>{total}</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statLabel}>HIGH LOADED</Text>

                <Text style={[styles.statValue, styles.highText]}>
                  {highCount}
                </Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statLabel}>MEDIUM LOADED</Text>

                <Text style={[styles.statValue, styles.mediumText]}>
                  {mediumCount}
                </Text>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Recent Events</Text>

                <Text style={styles.sectionSubtitle}>
                  Authentication activity
                </Text>
              </View>

              <Text style={styles.eventCount}>{total} events</Text>
            </View>

            <View style={styles.filters}>
              {(["all", "high", "medium"] as Filter[]).map((item) => {
                const selected = filter === item;

                return (
                  <Pressable
                    key={item}
                    onPress={() => changeFilter(item)}
                    style={[
                      styles.filterButton,
                      selected && styles.filterButtonSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        selected && styles.filterTextSelected,
                      ]}
                    >
                      {item.toUpperCase()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No security events</Text>

            <Text style={styles.emptyText}>
              No events match the selected severity.
            </Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator
              size="small"
              color="#39D98A"
              style={styles.footerLoader}
            />
          ) : null
        }
        renderItem={({ item }) => {
          const isHigh = item.severity === "high";

          return (
            <View style={styles.eventCard}>
              <View
                style={[
                  styles.severityLine,
                  isHigh ? styles.severityLineHigh : styles.severityLineMedium,
                ]}
              />

              <View style={styles.eventContent}>
                <View style={styles.eventTop}>
                  <View
                    style={[
                      styles.badge,
                      isHigh ? styles.highBadge : styles.mediumBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        isHigh ? styles.highBadgeText : styles.mediumBadgeText,
                      ]}
                    >
                      {item.severity.toUpperCase()}
                    </Text>
                  </View>

                  <Text style={styles.timestamp}>
                    {formatDate(item.timestamp)}
                  </Text>
                </View>

                <Text style={styles.eventTitle}>
                  {formatEventType(item.type)}
                </Text>

                <View style={styles.details}>
                  <View style={styles.detail}>
                    <Text style={styles.detailLabel}>SOURCE IP</Text>

                    <Text style={styles.ipAddress}>{item.ip_address}</Text>
                  </View>

                  <View style={styles.detail}>
                    <Text style={styles.detailLabel}>USER</Text>

                    <Text style={styles.detailValue}>{item.username}</Text>
                  </View>

                  <View style={styles.detail}>
                    <Text style={styles.detailLabel}>ATTEMPTS</Text>

                    <Text style={styles.detailValue}>{item.attempt_count}</Text>
                  </View>
                </View>

                {item.should_alert && (
                  <View style={styles.alert}>
                    <Text style={styles.alertText}>
                      ⚠ BRUTE FORCE THRESHOLD TRIGGERED
                    </Text>
                  </View>
                )}
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

function formatEventType(type: SecurityEvent["type"]) {
  switch (type) {
    case "possible_brute_force":
      return "Possible Brute Force Attack";

    case "ssh_failed_login":
      return "Failed SSH Login";

    default:
      return type;
  }
}

function formatDate(timestamp: string) {
  return new Date(timestamp).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#090D12",
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 40,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: "#090D12",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: "#8B949E",
    marginTop: 14,
    fontSize: 14,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },

  eyebrow: {
    color: "#39D98A",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 6,
  },

  title: {
    color: "#E6EDF3",
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.8,
  },

  subtitle: {
    color: "#8B949E",
    fontSize: 13,
    marginTop: 4,
  },

  status: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10231B",
    borderWidth: 1,
    borderColor: "#1E4D38",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#39D98A",
    marginRight: 6,
  },

  statusText: {
    color: "#39D98A",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },

  statsContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 30,
  },

  statCard: {
    flex: 1,
    backgroundColor: "#101720",
    borderWidth: 1,
    borderColor: "#263241",
    borderRadius: 14,
    padding: 14,
  },

  statLabel: {
    color: "#6E7681",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 8,
  },

  statValue: {
    color: "#E6EDF3",
    fontSize: 25,
    fontWeight: "800",
  },

  highText: {
    color: "#FF5A65",
  },

  mediumText: {
    color: "#E3B341",
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 16,
  },

  sectionTitle: {
    color: "#E6EDF3",
    fontSize: 19,
    fontWeight: "700",
  },

  sectionSubtitle: {
    color: "#6E7681",
    fontSize: 12,
    marginTop: 3,
  },

  eventCount: {
    color: "#6E7681",
    fontSize: 12,
  },

  filters: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 18,
  },

  filterButton: {
    borderWidth: 1,
    borderColor: "#263241",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  filterButtonSelected: {
    backgroundColor: "#16241E",
    borderColor: "#39D98A",
  },

  filterText: {
    color: "#8B949E",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.7,
  },

  filterTextSelected: {
    color: "#39D98A",
  },

  eventCard: {
    flexDirection: "row",
    backgroundColor: "#101720",
    borderWidth: 1,
    borderColor: "#263241",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 12,
  },

  severityLine: {
    width: 4,
  },

  severityLineHigh: {
    backgroundColor: "#FF5A65",
  },

  severityLineMedium: {
    backgroundColor: "#E3B341",
  },

  eventContent: {
    flex: 1,
    padding: 15,
  },

  eventTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  highBadge: {
    backgroundColor: "#35171C",
  },

  mediumBadge: {
    backgroundColor: "#302817",
  },

  badgeText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
  },

  highBadgeText: {
    color: "#FF5A65",
  },

  mediumBadgeText: {
    color: "#E3B341",
  },

  timestamp: {
    color: "#6E7681",
    fontSize: 11,
  },

  eventTitle: {
    color: "#E6EDF3",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 16,
  },

  details: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#1D2632",
    paddingTop: 13,
    gap: 20,
  },

  detail: {
    flexShrink: 1,
  },

  detailLabel: {
    color: "#6E7681",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.7,
    marginBottom: 5,
  },

  detailValue: {
    color: "#C9D1D9",
    fontSize: 13,
    fontWeight: "600",
  },

  ipAddress: {
    color: "#58A6FF",
    fontSize: 13,
    fontWeight: "600",
  },

  alert: {
    marginTop: 14,
    backgroundColor: "#35171C",
    borderWidth: 1,
    borderColor: "#5C242B",
    borderRadius: 8,
    padding: 10,
  },

  alertText: {
    color: "#FF7B83",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
  },

  empty: {
    alignItems: "center",
    paddingVertical: 60,
  },

  emptyTitle: {
    color: "#E6EDF3",
    fontSize: 16,
    fontWeight: "700",
  },

  emptyText: {
    color: "#6E7681",
    fontSize: 13,
    marginTop: 5,
  },

  footerLoader: {
    marginVertical: 20,
  },
});
