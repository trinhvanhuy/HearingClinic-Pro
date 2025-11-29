import React, { useState } from 'react'
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRoute, useNavigation } from '@react-navigation/native'
import { hearingReportService } from '../api/hearingReportService'
import { clientService } from '../api/clientService'
import { HearingReport, EarThresholds } from '@hearing-clinic/shared/src/models/hearingReport'
import Parse from 'parse'

export default function HearingReportFormScreen() {
  const route = useRoute()
  const navigation = useNavigation()
  const queryClient = useQueryClient()
  const { reportId, clientId } = (route.params as { reportId?: string; clientId?: string }) || {}
  const isEdit = !!reportId

  const { data: report } = useQuery({
    queryKey: ['hearing-report', reportId],
    queryFn: () => hearingReportService.getById(reportId!),
    enabled: isEdit,
  })

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientService.getAll({ isActive: true }),
  })

  const [formData, setFormData] = useState({
    clientId: clientId || '',
    testDate: new Date().toISOString().split('T')[0],
    typeOfTest: 'pure tone audiometry',
    diagnosis: '',
    recommendations: '',
  })

  const mutation = useMutation({
    mutationFn: async (data: Partial<HearingReport>) => {
      const client = Parse.Object.createWithoutData('Client', data.clientId as any)
      const reportData = {
        ...data,
        client,
        testDate: new Date(data.testDate as any),
      }
      if (isEdit) {
        return hearingReportService.update(reportId!, reportData)
      } else {
        return hearingReportService.create(reportData)
      }
    },
    onSuccess: () => {
      Alert.alert('Success', isEdit ? 'Report updated' : 'Report created')
      queryClient.invalidateQueries({ queryKey: ['hearing-reports'] })
      navigation.goBack()
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to save report')
    },
  })

  const handleSubmit = () => {
    if (!formData.clientId || !formData.testDate) {
      Alert.alert('Error', 'Please fill in all required fields')
      return
    }
    mutation.mutate(formData as any)
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Client *</Text>
          <TextInput
            style={styles.input}
            value={formData.clientId}
            editable={false}
            placeholder="Client ID"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Test Date *</Text>
          <TextInput
            style={styles.input}
            value={formData.testDate}
            onChangeText={(text) => setFormData({ ...formData, testDate: text })}
            placeholder="YYYY-MM-DD"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Diagnosis</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.diagnosis}
            onChangeText={(text) => setFormData({ ...formData, diagnosis: text })}
            placeholder="Diagnosis"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Recommendations</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.recommendations}
            onChangeText={(text) => setFormData({ ...formData, recommendations: text })}
            placeholder="Recommendations"
            multiline
            numberOfLines={4}
          />
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={mutation.isPending}
        >
          <Text style={styles.submitButtonText}>
            {mutation.isPending ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1e293b',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#0284c7',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})

