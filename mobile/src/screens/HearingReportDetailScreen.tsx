import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useRoute } from '@react-navigation/native'
import { hearingReportService } from '../api/hearingReportService'
import { formatDate } from '@hearing-clinic/shared/src/utils/formatting'

export default function HearingReportDetailScreen() {
  const route = useRoute()
  const { reportId } = route.params as { reportId: string }

  const { data: report, isLoading } = useQuery({
    queryKey: ['hearing-report', reportId],
    queryFn: () => hearingReportService.getById(reportId),
  })

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    )
  }

  if (!report) {
    return (
      <View style={styles.container}>
        <Text>Report not found</Text>
      </View>
    )
  }

  const client = report.get('client')

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Hearing Report</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Client:</Text>
          <Text style={styles.value}>{client?.get('fullName')}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Test Date:</Text>
          <Text style={styles.value}>{formatDate(report.get('testDate'))}</Text>
        </View>
        {report.get('diagnosis') && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Diagnosis:</Text>
            <Text style={styles.value}>{report.get('diagnosis')}</Text>
          </View>
        )}
        {report.get('recommendations') && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Recommendations:</Text>
            <Text style={styles.value}>{report.get('recommendations')}</Text>
          </View>
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
  section: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoRow: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#1e293b',
  },
})

