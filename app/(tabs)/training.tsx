import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { apiService, Karyawan, Pelatihan, PelatihanInfo } from '@/services/api';

export default function TrainingScreen() {
  const { user } = useAuth();
  const [karyawan, setKaryawan] = useState<Karyawan | null>(null);
  const [trainings, setTrainings] = useState<Pelatihan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'completed' | 'upcoming'>('all');

  useEffect(() => {
    loadTrainingData();
  }, []);

  const loadTrainingData = async () => {
    try {
      setIsLoading(true);
      const [profileData, trainingData] = await Promise.all([
        apiService.getMyProfile(),
        apiService.getMyTrainings()
      ]);
      setKaryawan(profileData);
      setTrainings(trainingData);
    } catch (error) {
      console.error('Error loading training data:', error);
      Alert.alert('Error', 'Gagal memuat data pelatihan');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTrainingData();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getTrainingStatus = (training: PelatihanInfo) => {
    const trainingDate = new Date(training.tanggal);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (trainingDate < today) {
      return 'completed';
    } else if (trainingDate.toDateString() === today.toDateString()) {
      return 'today';
    } else {
      return 'upcoming';
    }
  };

  const getFilteredTrainings = () => {
    if (!karyawan?.pelatihanDetail) return [];
    
    let filtered = karyawan.pelatihanDetail;
    
    if (selectedFilter === 'completed') {
      filtered = filtered.filter(detail => 
        new Date(detail.pelatihan.tanggal) < new Date()
      );
    } else if (selectedFilter === 'upcoming') {
      filtered = filtered.filter(detail => 
        new Date(detail.pelatihan.tanggal) >= new Date()
      );
    }
    
    return filtered.sort((a, b) => 
      new Date(b.pelatihan.tanggal).getTime() - new Date(a.pelatihan.tanggal).getTime()
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'today': return '#FF9800';
      case 'upcoming': return '#2196F3';
      default: return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Selesai';
      case 'today': return 'Hari Ini';
      case 'upcoming': return 'Akan Datang';
      default: return 'Tidak Diketahui';
    }
  };

  const filteredTrainings = getFilteredTrainings();

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Pelatihan & Pengembangan</Text>
          <Text style={styles.headerSubtitle}>
            {filteredTrainings.length} pelatihan ditemukan
          </Text>
        </View>
      </LinearGradient>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterTab,
            selectedFilter === 'all' && styles.filterTabActive
          ]}
          onPress={() => setSelectedFilter('all')}
        >
          <Text style={[
            styles.filterTabText,
            selectedFilter === 'all' && styles.filterTabTextActive
          ]}>
            Semua
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            selectedFilter === 'upcoming' && styles.filterTabActive
          ]}
          onPress={() => setSelectedFilter('upcoming')}
        >
          <Text style={[
            styles.filterTabText,
            selectedFilter === 'upcoming' && styles.filterTabTextActive
          ]}>
            Akan Datang
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            selectedFilter === 'completed' && styles.filterTabActive
          ]}
          onPress={() => setSelectedFilter('completed')}
        >
          <Text style={[
            styles.filterTabText,
            selectedFilter === 'completed' && styles.filterTabTextActive
          ]}>
            Selesai
          </Text>
        </TouchableOpacity>
      </View>

      {/* Training List */}
      <View style={styles.content}>
        {filteredTrainings.length > 0 ? (
          filteredTrainings.map((trainingDetail, index) => {
            const status = getTrainingStatus(trainingDetail.pelatihan);
            return (
              <View key={index} style={styles.trainingCard}>
                <View style={styles.trainingHeader}>
                  <View style={styles.trainingInfo}>
                    <Text style={styles.trainingName}>
                      {trainingDetail.pelatihan.nama}
                    </Text>
                    <View style={styles.trainingMeta}>
                      <View style={styles.metaItem}>
                        <Ionicons name="calendar-outline" size={16} color="#666" />
                        <Text style={styles.metaText}>
                          {formatDate(trainingDetail.pelatihan.tanggal)}
                        </Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name="location-outline" size={16} color="#666" />
                        <Text style={styles.metaText}>
                          {trainingDetail.pelatihan.lokasi}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.statusContainer}>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(status) }
                    ]}>
                      <Text style={styles.statusText}>
                        {getStatusText(status)}
                      </Text>
                    </View>
                  </View>
                </View>

                {trainingDetail.skor && (
                  <View style={styles.scoreContainer}>
                    <View style={styles.scoreItem}>
                      <Text style={styles.scoreLabel}>Skor</Text>
                      <Text style={styles.scoreValue}>{trainingDetail.skor}</Text>
                    </View>
                    <View style={styles.scoreBar}>
                      <View 
                        style={[
                          styles.scoreProgress,
                          { width: `${(trainingDetail.skor / 100) * 100}%` }
                        ]}
                      />
                    </View>
                  </View>
                )}

                {trainingDetail.catatan && (
                  <View style={styles.notesContainer}>
                    <Text style={styles.notesLabel}>Catatan:</Text>
                    <Text style={styles.notesText}>{trainingDetail.catatan}</Text>
                  </View>
                )}

                <View style={styles.trainingActions}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="document-text-outline" size={16} color="#667eea" />
                    <Text style={styles.actionButtonText}>Detail</Text>
                  </TouchableOpacity>
                  {trainingDetail.skor && (
                    <TouchableOpacity style={styles.actionButton}>
                      <Ionicons name="download-outline" size={16} color="#667eea" />
                      <Text style={styles.actionButtonText}>Sertifikat</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="school-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>Tidak ada pelatihan</Text>
            <Text style={styles.emptySubtitle}>
              {selectedFilter === 'all' 
                ? 'Belum ada pelatihan yang diikuti'
                : `Tidak ada pelatihan ${selectedFilter === 'completed' ? 'yang selesai' : 'yang akan datang'}`
              }
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: -15,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  filterTabActive: {
    backgroundColor: '#667eea',
  },
  filterTabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: 'white',
  },
  content: {
    padding: 20,
  },
  trainingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trainingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  trainingInfo: {
    flex: 1,
    marginRight: 15,
  },
  trainingName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  trainingMeta: {
    gap: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scoreContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  scoreItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#666',
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  scoreBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  scoreProgress: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  notesContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  trainingActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  actionButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 5,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
