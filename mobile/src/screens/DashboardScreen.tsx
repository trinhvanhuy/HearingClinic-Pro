import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useNavigation } from '@react-navigation/native'
import { reminderService } from '../api/reminderService'
import { clientService } from '../api/clientService'
import { formatDate } from '@hearing-clinic/shared/src/utils/formatting'
import { startOfToday, endOfWeek, addDays } from 'date-fns'

export default function DashboardScreen() {
  const navigation = useNavigation()
  const today = startOfToday()
  const weekEnd = endOfWeek(addDays(today, 7))

  const { data: reminders = [] } = useQuery({
    queryKey: ['reminders', 'today'],
    queryFn: () =>
      reminderService.getAll({
        dueFrom: today,
        dueTo: weekEnd,
        status: 'pending',
        limit: 5,
      }),
  })

  const { data: clients = [] } = useQuery({
    queryKey: ['clients', 'recent'],
    queryFn: () => clientService.getAll({ limit: 5 }),
  })

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('ClientForm' as never)}
          >
            <Text style={styles.actionButtonText}>New Client</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Reminders</Text>
        {reminders.length === 0 ? (
          <Text style={styles.emptyText}>No upcoming reminders</Text>
        ) : (
          reminders.map((reminder) => (
            <View key={reminder.id} style={styles.card}>
              <Text style={styles.cardTitle}>{reminder.get('title')}</Text>
              <Text style={styles.cardSubtitle}>
                Client: {reminder.get('client')?.get('fullName') || 'N/A'}
              </Text>
              <Text style={styles.cardDate}>
                Due: {formatDate(reminder.get('dueAt'))}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Clients</Text>
        {clients.length === 0 ? (
          <Text style={styles.emptyText}>No clients yet</Text>
        ) : (
          clients.map((client) => (
            <TouchableOpacity
              key={client.id}
              style={styles.card}
              onPress={() =>
                navigation.navigate('ClientDetail' as never, { clientId: client.id } as never)
              }
            >
              <Text style={styles.cardTitle}>{client.get('fullName')}</Text>
              <Text style={styles.cardSubtitle}>{client.get('phone')}</Text>
              {client.get('lastVisitDate') && (
                <Text style={styles.cardDate}>
                  Last visit: {formatDate(client.get('lastVisitDate'))}
                </Text>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyText: {
    color: '#64748b',
    fontStyle: 'italic',
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
})

