import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRoute, useNavigation } from '@react-navigation/native'
import { clientService } from '../api/clientService'
import { hearingReportService } from '../api/hearingReportService'
import { reminderService } from '../api/reminderService'
import { formatDate, formatPhone } from '@hearing-clinic/shared/src/utils/formatting'

export default function ClientDetailScreen() {
  const route = useRoute()
  const navigation = useNavigation()
  const queryClient = useQueryClient()
  const { clientId } = route.params as { clientId: string }

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => clientService.getById(clientId),
  })

  const { data: reports = [] } = useQuery({
    queryKey: ['hearing-reports', 'client', clientId],
    queryFn: () => hearingReportService.getAll({ clientId }),
  })

  const { data: reminders = [] } = useQuery({
    queryKey: ['reminders', 'client', clientId],
    queryFn: () => reminderService.getAll({ clientId }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => clientService.delete(clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      navigation.goBack()
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to delete client')
    },
  })

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`)
  }

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`)
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    )
  }

  if (!client) {
    return (
      <View style={styles.container}>
        <Text>Client not found</Text>
      </View>
    )
  }

  const phone = client.get('phone')
  const email = client.get('email')

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{client.get('fullName')}</Text>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() =>
              navigation.navigate('ClientForm' as never, { clientId } as never)
            }
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phone:</Text>
          <Text style={styles.infoValue}>{formatPhone(phone)}</Text>
        </View>
        {email && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{email}</Text>
          </View>
        )}
        {client.get('dateOfBirth') && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date of Birth:</Text>
            <Text style={styles.infoValue}>{formatDate(client.get('dateOfBirth'))}</Text>
          </View>
        )}
        {client.get('address') && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Address:</Text>
            <Text style={styles.infoValue}>{client.get('address')}</Text>
          </View>
        )}
      </View>

      <View style={styles.contactActions}>
        {phone && (
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => handleCall(phone)}
          >
            <Text style={styles.contactButtonText}>📞 Call</Text>
          </TouchableOpacity>
        )}
        {email && (
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => handleEmail(email)}
          >
            <Text style={styles.contactButtonText}>✉️ Email</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hearing Reports</Text>
        {reports.length === 0 ? (
          <Text style={styles.emptyText}>No hearing reports</Text>
        ) : (
          reports.map((report) => (
            <TouchableOpacity
              key={report.id}
              style={styles.card}
              onPress={() =>
                navigation.navigate('HearingReportDetail' as never, { reportId: report.id } as never)
              }
            >
              <Text style={styles.cardTitle}>
                {formatDate(report.get('testDate'))} - {report.get('typeOfTest') || 'Hearing Test'}
              </Text>
              {report.get('diagnosis') && (
                <Text style={styles.cardSubtitle}>{report.get('diagnosis')}</Text>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reminders</Text>
        {reminders.length === 0 ? (
          <Text style={styles.emptyText}>No reminders</Text>
        ) : (
          reminders.map((reminder) => (
            <View key={reminder.id} style={styles.card}>
              <Text style={styles.cardTitle}>{reminder.get('title')}</Text>
              <Text style={styles.cardSubtitle}>
                Due: {formatDate(reminder.get('dueAt'))}
              </Text>
            </View>
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
    backgroundColor: '#fff',
    padding: 16,
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
  editButton: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
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
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontWeight: '600',
    width: 100,
    color: '#64748b',
  },
  infoValue: {
    flex: 1,
    color: '#1e293b',
  },
  contactActions: {
    flexDirection: 'row',
    gap: 8,
    padding: 16,
  },
  contactButton: {
    flex: 1,
    backgroundColor: '#0284c7',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  },
  emptyText: {
    color: '#64748b',
    fontStyle: 'italic',
  },
})

