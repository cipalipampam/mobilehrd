import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useAuth } from '@/contexts/AuthContext';
import { apiService, Karyawan, Pelatihan, PelatihanInfo, TrainingStatus } from '@/services/api';

export default function TrainingScreen() {
  const { user } = useAuth();
  const [karyawan, setKaryawan] = useState<Karyawan | null>(null);
  const [trainings, setTrainings] = useState<any[]>([]);
  const [availableTrainings, setAvailableTrainings] = useState<Pelatihan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'today' | 'completed' | 'upcoming'>('today');
  const [activeTab, setActiveTab] = useState<'mytrainings' | 'available'>('mytrainings');

  useEffect(() => {
    loadTrainingData();
  }, []);

  const loadTrainingData = async () => {
    try {
      setIsLoading(true);
      const [profileData, trainingData, availableData] = await Promise.all([
        apiService.getMyProfile(),
        apiService.getMyTrainings(),
        apiService.getAvailableTrainings()
      ]);
      setKaryawan(profileData);
      setTrainings(trainingData);
      setAvailableTrainings(availableData);
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

  const handleConfirm = async (pelatihanId: string) => {
    try {
      await apiService.confirmTraining(pelatihanId);
      await loadTrainingData();
      Alert.alert('Berhasil', 'Anda telah mengonfirmasi keikutsertaan.');
    } catch (e: any) {
      Alert.alert('Gagal', e?.message || 'Tidak dapat mengonfirmasi.');
    }
  };

  const handleJoin = async (pelatihanId: string) => {
    try {
      await apiService.joinTraining(pelatihanId);
      await loadTrainingData();
      Alert.alert('Berhasil', 'Anda berhasil mendaftar pelatihan.');
    } catch (e: any) {
      Alert.alert('Gagal', e?.message || 'Tidak dapat mendaftar.');
    }
  };

  const handleDownloadCertificate = async (pelatihanId: string, pelatihanNama: string) => {
    try {
      Alert.alert('Download', 'Mengunduh sertifikat...');
      
      const token = await apiService.getToken();
      const fileUri = `${FileSystem.documentDirectory}Sertifikat_${pelatihanNama.replace(/\s/g, '_')}.pdf`;
      
      const downloadResult = await FileSystem.downloadAsync(
        `http://10.10.184.147:5000/api/pelatihan/${pelatihanId}/certificate`,
        fileUri,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (downloadResult.status === 200) {
        Alert.alert(
          'Berhasil',
          'Sertifikat berhasil diunduh!',
          [
            {
              text: 'Buka',
              onPress: async () => {
                if (await Sharing.isAvailableAsync()) {
                  await Sharing.shareAsync(downloadResult.uri);
                }
              },
            },
            { text: 'OK' },
          ]
        );
      } else {
        throw new Error('Download gagal');
      }
    } catch (error: any) {
      console.error('Download error:', error);
      Alert.alert('Error', error.message || 'Gagal mengunduh sertifikat');
    }
  };

  const handleDecline = async (pelatihanId: string) => {
    const performDecline = async (alasan?: string) => {
      try {
        await apiService.declineTraining(pelatihanId, alasan);
        await loadTrainingData();
        Alert.alert('Tersimpan', 'Anda menolak undangan pelatihan.');
      } catch (e: any) {
        Alert.alert('Gagal', e?.message || 'Tidak dapat menolak.');
      }
    };

    if (Platform.OS === 'ios') {
      // iOS supports prompt
      // @ts-ignore
      Alert.prompt('Tolak Undangan', 'Opsional: tambahkan alasan penolakan', [
        { text: 'Batal', style: 'cancel' },
        { text: 'Kirim', onPress: (text?: string) => performDecline(text) }
      ]);
    } else {
      Alert.alert('Tolak Undangan', 'Anda yakin ingin menolak undangan ini?', [
        { text: 'Batal', style: 'cancel' },
        { text: 'Ya, Tolak', style: 'destructive', onPress: () => performDecline() }
      ]);
    }
  };

  const getMyJoinedIds = () => {
    return trainings.map(t => t.pelatihan?.id || t.id).filter(Boolean);
  };

  const getAvailableNotJoined = () => {
    const joinedIds = getMyJoinedIds();
    return availableTrainings.filter(t => !joinedIds.includes(t.id));
  };

  const getFilteredTrainings = () => {
    if (!trainings || trainings.length === 0) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let filtered = trainings;
    
    if (selectedFilter === 'today') {
      filtered = filtered.filter(t => {
        const tanggal = t.pelatihan?.tanggal || t.tanggal;
        if (!tanggal) return false;
        const trainingDate = new Date(tanggal);
        trainingDate.setHours(0, 0, 0, 0);
        return trainingDate.getTime() === today.getTime();
      });
    } else if (selectedFilter === 'completed') {
      filtered = filtered.filter(t => {
        const tanggal = t.pelatihan?.tanggal || t.tanggal;
        if (!tanggal) return false;
        return new Date(tanggal) < today;
      });
    } else if (selectedFilter === 'upcoming') {
      filtered = filtered.filter(t => {
        const tanggal = t.pelatihan?.tanggal || t.tanggal;
        if (!tanggal) return false;
        const trainingDate = new Date(tanggal);
        trainingDate.setHours(0, 0, 0, 0);
        return trainingDate.getTime() > today.getTime();
      });
    }
    
    return filtered.sort((a, b) => {
      const dateA = a.pelatihan?.tanggal || a.tanggal;
      const dateB = b.pelatihan?.tanggal || b.tanggal;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
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
          <Text style={styles.headerTitle}>Pelatihan</Text>
          <Text style={styles.headerSubtitle}>
            {activeTab === 'mytrainings' 
              ? `${filteredTrainings.length} pelatihan diikuti`
              : `${getAvailableNotJoined().length} pelatihan tersedia`
            }
          </Text>
        </View>
      </LinearGradient>

      {/* Main Tabs */}
      <View style={styles.mainTabsContainer}>
        <TouchableOpacity
          style={[
            styles.mainTab,
            activeTab === 'mytrainings' && styles.mainTabActive
          ]}
          onPress={() => setActiveTab('mytrainings')}
        >
          <Text style={[
            styles.mainTabText,
            activeTab === 'mytrainings' && styles.mainTabTextActive
          ]}>
            Pelatihan Saya
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.mainTab,
            activeTab === 'available' && styles.mainTabActive
          ]}
          onPress={() => setActiveTab('available')}
        >
          <Text style={[
            styles.mainTabText,
            activeTab === 'available' && styles.mainTabTextActive
          ]}>
            Cari Pelatihan
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs - Only show for My Trainings */}
      {activeTab === 'mytrainings' && (
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterTab,
              selectedFilter === 'today' && styles.filterTabActive
            ]}
            onPress={() => setSelectedFilter('today')}
          >
            <Text style={[
              styles.filterTabText,
              selectedFilter === 'today' && styles.filterTabTextActive
            ]}>
              Hari Ini
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
      )}

      {/* Training List */}
      <View style={styles.content}>
        {activeTab === 'mytrainings' ? (
          // My Trainings Tab
          filteredTrainings.length > 0 ? (
            filteredTrainings.map((training, index) => {
              const pelatihanData = training.pelatihan || training;
              const status = getTrainingStatus(pelatihanData);
              // Get first peserta data (assuming current user is the only one or first)
              const myDetail = training.peserta?.[0] || training;
            
            return (
              <View key={pelatihanData.id || index} style={styles.trainingCard}>
                <View style={styles.trainingHeader}>
                  <View style={styles.trainingInfo}>
                    <Text style={styles.trainingName}>
                      {pelatihanData.nama}
                    </Text>
                    {!!pelatihanData.jenis && (
                      <View style={styles.badgesRow}>
                        <View style={[
                          styles.jenisBadge,
                          { backgroundColor: pelatihanData.jenis === 'WAJIB' ? '#f59e0b' : '#3b82f6' }
                        ]}>
                          <Text style={styles.jenisBadgeText}>{pelatihanData.jenis}</Text>
                        </View>
                      </View>
                    )}
                    <View style={styles.trainingMeta}>
                      <View style={styles.metaItem}>
                        <Ionicons name="calendar-outline" size={16} color="#666" />
                        <Text style={styles.metaText}>
                          {formatDate(pelatihanData.tanggal)}
                        </Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name="location-outline" size={16} color="#666" />
                        <Text style={styles.metaText}>
                          {pelatihanData.lokasi}
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

                {myDetail?.skor && (
                  <View style={styles.scoreContainer}>
                    <View style={styles.scoreItem}>
                      <Text style={styles.scoreLabel}>Skor</Text>
                      <Text style={styles.scoreValue}>{myDetail.skor}</Text>
                    </View>
                    <View style={styles.scoreBar}>
                      <View 
                        style={[
                          styles.scoreProgress,
                          { width: `${(myDetail.skor / 100) * 100}%` }
                        ]}
                      />
                    </View>
                  </View>
                )}

                {myDetail?.catatan && (
                  <View style={styles.notesContainer}>
                    <Text style={styles.notesLabel}>Catatan:</Text>
                    <Text style={styles.notesText}>{myDetail.catatan}</Text>
                  </View>
                )}

                {/* Training Invitation Actions */}
                {myDetail?.status === 'INVITED' && status !== 'completed' && pelatihanData.jenis !== 'WAJIB' && (
                  <View style={styles.invitationActions}>
                    <TouchableOpacity 
                      style={styles.acceptButton}
                      onPress={() => handleConfirm(pelatihanData.id)}
                    >
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      <Text style={styles.acceptButtonText}>Terima</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.declineButton}
                      onPress={() => handleDecline(pelatihanData.id)}
                    >
                      <Ionicons name="close-circle" size={20} color="#fff" />
                      <Text style={styles.declineButtonText}>Tolak</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Status Info for Confirmed/Declined */}
                {myDetail?.status === 'CONFIRMED' && (
                  <View style={styles.statusInfoContainer}>
                    <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                    <Text style={styles.statusInfoText}>
                      Anda telah mengonfirmasi keikutsertaan
                    </Text>
                  </View>
                )}

                {myDetail?.status === 'DECLINED' && (
                  <View style={styles.statusInfoContainer}>
                    <Ionicons name="close-circle" size={20} color="#f44336" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.statusInfoText}>
                        Anda menolak undangan ini
                      </Text>
                      {myDetail.alasanPenolakan && (
                        <Text style={styles.declineReasonText}>
                          Alasan: {myDetail.alasanPenolakan}
                        </Text>
                      )}
                    </View>
                  </View>
                )}

                <View style={styles.trainingActions}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="document-text-outline" size={16} color="#667eea" />
                    <Text style={styles.actionButtonText}>Detail</Text>
                  </TouchableOpacity>
                  {myDetail?.hadir && (
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleDownloadCertificate(pelatihanData.id, pelatihanData.nama)}
                    >
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
              {selectedFilter === 'today' 
                ? 'Tidak ada pelatihan hari ini'
                : `Tidak ada pelatihan ${selectedFilter === 'completed' ? 'yang selesai' : 'yang akan datang'}`
              }
            </Text>
          </View>
        )
        ) : (
          // Available Trainings Tab
          getAvailableNotJoined().length > 0 ? (
            getAvailableNotJoined().map((training, index) => {
              const status = getTrainingStatus(training);
              
              return (
                <View key={training.id || index} style={styles.trainingCard}>
                  <View style={styles.trainingHeader}>
                    <View style={styles.trainingInfo}>
                      <Text style={styles.trainingName}>
                        {training.nama}
                      </Text>
                      {!!training.jenis && (
                        <View style={styles.badgesRow}>
                          <View style={[
                            styles.jenisBadge,
                            { backgroundColor: training.jenis === 'WAJIB' ? '#f59e0b' : '#3b82f6' }
                          ]}>
                            <Text style={styles.jenisBadgeText}>{training.jenis}</Text>
                          </View>
                        </View>
                      )}
                      <View style={styles.trainingMeta}>
                        <View style={styles.metaItem}>
                          <Ionicons name="calendar-outline" size={16} color="#666" />
                          <Text style={styles.metaText}>
                            {formatDate(training.tanggal)}
                          </Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Ionicons name="location-outline" size={16} color="#666" />
                          <Text style={styles.metaText}>
                            {training.lokasi}
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

                  {/* Join Button */}
                  {status !== 'completed' && (
                    <TouchableOpacity 
                      style={styles.joinButton}
                      onPress={() => handleJoin(training.id)}
                    >
                      <Ionicons name="add-circle" size={20} color="#fff" />
                      <Text style={styles.joinButtonText}>Daftar Pelatihan</Text>
                    </TouchableOpacity>
                  )}

                  {status === 'completed' && (
                    <View style={styles.completedNote}>
                      <Text style={styles.completedNoteText}>Pelatihan sudah selesai</Text>
                    </View>
                  )}
                </View>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={64} color="#4CAF50" />
              <Text style={styles.emptyTitle}>Semua Pelatihan Sudah Diikuti</Text>
              <Text style={styles.emptySubtitle}>
                Anda sudah terdaftar di semua pelatihan yang tersedia
              </Text>
            </View>
          )
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
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 15,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 0,
    marginBottom: 16,
    borderRadius: 16,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
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
    paddingBottom: 40,
  },
  trainingCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
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
  badgesRow: {
    flexDirection: 'row',
    marginBottom: 6,
    gap: 8,
  },
  jenisBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  jenisBadgeText: {
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
  invitationActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    gap: 6,
  },
  acceptButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
  },
  declineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f44336',
    gap: 6,
  },
  declineButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
  },
  statusInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    gap: 8,
  },
  statusInfoText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  declineReasonText: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
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
  mainTabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: -30,
    marginBottom: 16,
    borderRadius: 16,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  mainTab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
  },
  mainTabActive: {
    backgroundColor: '#667eea',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  mainTabText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
  },
  mainTabTextActive: {
    color: 'white',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#667eea',
    gap: 6,
  },
  joinButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
  },
  completedNote: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  completedNoteText: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
});
