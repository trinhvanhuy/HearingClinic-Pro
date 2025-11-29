import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRoute, useNavigation } from '@react-navigation/native'
import { clientService } from '../api/clientService'
import { Client } from '@hearing-clinic/shared/src/models/client'

export default function ClientFormScreen() {
  const route = useRoute()
  const navigation = useNavigation()
  const queryClient = useQueryClient()
  const { clientId } = (route.params as { clientId?: string }) || {}
  const isEdit = !!clientId

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => clientService.getById(clientId!),
    enabled: isEdit,
  })

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '' as 'male' | 'female' | 'other' | '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  })

  useEffect(() => {
    if (client) {
      setFormData({
        firstName: client.get('firstName') || '',
        lastName: client.get('lastName') || '',
        dateOfBirth: client.get('dateOfBirth')
          ? new Date(client.get('dateOfBirth')).toISOString().split('T')[0]
          : '',
        gender: client.get('gender') || '',
        phone: client.get('phone') || '',
        email: client.get('email') || '',
        address: client.get('address') || '',
        notes: client.get('notes') || '',
      })
    }
  }, [client])

  const mutation = useMutation({
    mutationFn: async (data: Partial<Client>) => {
      const submitData = {
        ...data,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth as any) : undefined,
        gender: data.gender || undefined,
        email: data.email || undefined,
        address: data.address || undefined,
        notes: data.notes || undefined,
      }
      if (isEdit) {
        return clientService.update(clientId!, submitData)
      } else {
        return clientService.create(submitData)
      }
    },
    onSuccess: () => {
      Alert.alert('Success', isEdit ? 'Client updated' : 'Client created')
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      navigation.goBack()
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to save client')
    },
  })

  const handleSubmit = () => {
    if (!formData.firstName || !formData.lastName || !formData.phone) {
      Alert.alert('Error', 'Please fill in all required fields')
      return
    }
    mutation.mutate(formData as any)
  }

  if (isEdit && isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>First Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.firstName}
            onChangeText={(text) => setFormData({ ...formData, firstName: text })}
            placeholder="First name"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Last Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.lastName}
            onChangeText={(text) => setFormData({ ...formData, lastName: text })}
            placeholder="Last name"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone *</Text>
          <TextInput
            style={styles.input}
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            placeholder="Phone number"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            placeholder="Email address"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date of Birth</Text>
          <TextInput
            style={styles.input}
            value={formData.dateOfBirth}
            onChangeText={(text) => setFormData({ ...formData, dateOfBirth: text })}
            placeholder="YYYY-MM-DD"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
            placeholder="Address"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            placeholder="Notes"
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

