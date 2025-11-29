import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useNavigation } from '@react-navigation/native'
import { clientService } from '../api/clientService'
import { formatDate, formatPhone } from '@hearing-clinic/shared/src/utils/formatting'

export default function ClientListScreen() {
  const navigation = useNavigation()
  const [search, setSearch] = useState('')

  const { data: clients = [], isLoading, refetch } = useQuery({
    queryKey: ['clients', search],
    queryFn: () => clientService.getAll({ search, isActive: true }),
  })

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, phone, or email..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={clients}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.clientCard}
            onPress={() =>
              navigation.navigate('ClientDetail' as never, { clientId: item.id } as never)
            }
          >
            <Text style={styles.clientName}>{item.get('fullName')}</Text>
            <Text style={styles.clientPhone}>{formatPhone(item.get('phone'))}</Text>
            {item.get('lastVisitDate') && (
              <Text style={styles.clientDate}>
                Last visit: {formatDate(item.get('lastVisitDate'))}
              </Text>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No clients found</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('ClientForm' as never)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchInput: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  clientCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  clientPhone: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  clientDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0284c7',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
})

