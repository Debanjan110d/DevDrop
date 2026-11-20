import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useApp } from '../../src/state/AppContext';
import { COLORS } from '../../src/constants';

type FilterType = 'all' | 'completed' | 'active' | 'failed';

export default function HistoryScreen() {
  const { transfers, refreshTransfers, isLoadingTransfers } = useApp();
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredTransfers = transfers.filter((t) => {
    if (filter === 'completed') return t.status === 'completed';
    if (filter === 'active')
      return t.status === 'uploading' || t.status === 'downloading' || t.status === 'pending';
    if (filter === 'failed') return t.status === 'failed' || t.status === 'cancelled';
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {(['all', 'completed', 'active', 'failed'] as FilterType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterChip, filter === tab && styles.activeChip]}
            onPress={() => setFilter(tab)}
          >
            <Text
              style={[
                styles.filterText,
                filter === tab && styles.activeFilterText,
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoadingTransfers} onRefresh={refreshTransfers} />
        }
      >
        {filteredTransfers.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No transfers found</Text>
            <Text style={styles.emptyText}>
              Transfers matching this filter will show up here.
            </Text>
          </View>
        ) : (
          filteredTransfers.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemIconBox}>
                <Text style={styles.itemIcon}>
                  {item.direction === 'mobile-to-pc' ? '⬆️' : '⬇️'}
                </Text>
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.fileName}
                </Text>
                <Text style={styles.itemMeta}>
                  {(item.fileSize / 1024 / 1024).toFixed(2)} MB •{' '}
                  {item.direction === 'mobile-to-pc' ? 'Sent to PC' : 'From PC'}
                </Text>
                <Text style={styles.itemDate}>
                  {new Date(item.createdAt).toLocaleString()}
                </Text>
              </View>
              <View
                style={[
                  styles.badge,
                  item.status === 'completed'
                    ? styles.badgeSuccess
                    : item.status === 'failed' || item.status === 'cancelled'
                    ? styles.badgeDanger
                    : styles.badgeWarning,
                ]}
              >
                <Text style={styles.badgeText}>{item.status}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  filterRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  activeChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  activeFilterText: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
  },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginTop: 40,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  itemIconBox: {
    marginRight: 12,
  },
  itemIcon: {
    fontSize: 22,
  },
  itemInfo: {
    flex: 1,
    marginRight: 10,
  },
  itemName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemMeta: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  itemDate: {
    color: '#6b7280',
    fontSize: 11,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  badgeWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  badgeDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  badgeText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});

