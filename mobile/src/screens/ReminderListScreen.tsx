import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigation } from '@react-navigation/native'
import { reminderService } from '../api/reminderService'
import { ReminderStatus } from '@hearing-clinic/shared/src/models/reminder'
import { formatDate } from '@hearing-clinic/shared/src/utils/formatting'
import { Alert } from 'react-native'

export default function ReminderListScreen() {
  const navigation = useNavigation()
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<ReminderStatus | 'all'>('all')

  const { data: reminders = [], isLoading, refetch } = useQuery({
    queryKey: ['reminders', statusFilter],
    queryFn: () =>
      reminderService.getAll({
        status: statusFilter !== 'all' ? statusFilter : undefined,
      }),
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ReminderStatus }) => {
      return reminderService.update(id, { status })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] })
    },
  })

  const handleStatusChange = (id: string, newStatus: ReminderStatus) => {
    updateStatusMutation.mutate({ id, status: newStatus })
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, statusFilter === 'all' && styles.filterButtonActive]}
          onPress={() => setStatusFilter('all')}
        >
          <Text style={[styles.filterButtonText, statusFilter === 'all' && styles.filterButtonTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, statusFilter === 'pending' && styles.filterButtonActive]}
          onPress={() => setStatusFilter('pending')}
        >
          <Text style={[styles.filterButtonText, statusFilter === 'pending' && styles.filterButtonTextActive]}>
            Pending
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, statusFilter === 'overdue' && styles.filterButtonActive]}
          onPress={() => setStatusFilter('overdue')}
        >
          <Text style={[styles.filterButtonText, statusFilter === 'overdue' && styles.filterButtonTextActive]}>
            Overdue
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, statusFilter === 'done' && styles.filterButtonActive]}
          onPress={() => setStatusFilter('done')}
        >
          <Text style={[styles.filterButtonText, statusFilter === 'done' && styles.filterButtonTextActive]}>
            Done
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={reminders}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        renderItem={({ item }) => {
          const client = item.get('client')
          const status = item.get('status')
          return (
            <View style={styles.reminderCard}>
              <Text style={styles.reminderTitle}>{item.get('title')}</Text>
              {item.get('description') && (
                <Text style={styles.reminderDescription}>{item.get('description')}</Text>
              )}
              <Text style={styles.reminderClient}>
                Client: {client?.get('fullName') || 'N/A'}
              </Text>
              <Text style={styles.reminderDate}>
                Due: {formatDate(item.get('dueAt'))}
              </Text>
              <View style={styles.reminderActions}>
                <View
                  style={[
                    styles.statusBadge,
                    status === 'done' && styles.statusBadgeDone,
                    status === 'overdue' && styles.statusBadgeOverdue,
                    status === 'pending' && styles.statusBadgePending,
                  ]}
                >
                  <Text style={styles.statusBadgeText}>{status}</Text>
                </View>
                {status !== 'done' && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleStatusChange(item.id, 'done')}
                  >
                    <Text style={styles.actionButtonText}>Mark Done</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No reminders found</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  filterButtonActive: {
    backgroundColor: '#0284c7',
  },
  filterButtonText: {
    color: '#64748b',
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  reminderCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  reminderDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  reminderClient: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  reminderDate: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 8,
  },
  reminderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgePending: {
    backgroundColor: '#fef3c7',
  },
  statusBadgeOverdue: {
    backgroundColor: '#fee2e2',
  },
  statusBadgeDone: {
    backgroundColor: '#d1fae5',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  actionButton: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 16,
  },
})

