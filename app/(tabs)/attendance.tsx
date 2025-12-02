import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Location from 'expo-location';
import { apiService, Kehadiran, KehadiranStats, IzinRequest, IzinJenis, IzinStatus } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const STATUS_COLORS: Record<string, string> = {
  HADIR: '#10b981',
  TERLAMBAT: '#f59e0b',
  IZIN: '#3b82f6',
  SAKIT: '#ef4444',
  ALPA: '#dc2626',
  BELUM_ABSEN: '#6b7280',
};

const STATUS_LABELS: Record<string, string> = {
  HADIR: 'Hadir',
  TERLAMBAT: 'Terlambat',
  IZIN: 'Izin',
  SAKIT: 'Sakit',
  ALPA: 'Alpa',
  BELUM_ABSEN: 'Belum Absen',
};

export default function AttendanceScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'attendance' | 'izin'>('attendance');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<Kehadiran | null>(null);
  const [history, setHistory] = useState<Kehadiran[]>([]);
  const [stats, setStats] = useState<KehadiranStats | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Izin states
  const [izinRequests, setIzinRequests] = useState<IzinRequest[]>([]);
  const [showIzinModal, setShowIzinModal] = useState(false);
  const [izinFilter, setIzinFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [tanggalIzin, setTanggalIzin] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [jenisIzin, setJenisIzin] = useState<IzinJenis>('IZIN');
  const [keteranganIzin, setKeteranganIzin] = useState('');
  const [izinFile, setIzinFile] = useState<any>(null);
  const [isSubmittingIzin, setIsSubmittingIzin] = useState(false);

  useEffect(() => {
    loadData();
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedMonth, selectedYear, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'attendance') {
        await Promise.all([loadTodayAttendance(), loadHistory()]);
      } else {
        await loadIzinRequests();
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadIzinRequests = async () => {
    try {
      const data = await apiService.getMyIzinRequests();
      setIzinRequests(data);
    } catch (error) {
      console.error('Error loading izin requests:', error);
      Alert.alert('Error', 'Gagal memuat data izin');
    }
  };

  const loadTodayAttendance = async () => {
    try {
      const data = await apiService.getTodayKehadiran();
      setTodayAttendance(data);
    } catch (error) {
      console.error('Error loading today attendance:', error);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await apiService.getKehadiranHistory({
        month: selectedMonth,
        year: selectedYear,
      });
      setHistory(response.data || []);
      setStats(response.stats || null);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Izin lokasi diperlukan untuk check in/out');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  };

  const handleCheckIn = async () => {
    // Validate: Check if there's approved izin for today
    if (todayHasApprovedIzin) {
      Alert.alert(
        'Tidak Dapat Check In',
        'Anda memiliki izin yang telah disetujui untuk hari ini. Check in tidak dapat dilakukan.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Check In',
      'Apakah Anda yakin ingin check in sekarang?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya',
          onPress: async () => {
            try {
              setLoading(true);
              const coords = await getLocation();
              
              await apiService.checkIn({
                lokasi: 'Kantor Pusat Jakarta',
                latitude: coords?.latitude,
                longitude: coords?.longitude,
                keterangan: 'Check in melalui mobile app',
              });
              
              Alert.alert('Berhasil', 'Check in berhasil!');
              await loadData();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Gagal check in');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCheckOut = async () => {
    // Validate: Check if there's approved izin for today
    if (todayHasApprovedIzin) {
      Alert.alert(
        'Tidak Dapat Check Out',
        'Anda memiliki izin yang telah disetujui untuk hari ini. Check out tidak dapat dilakukan.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Check Out',
      'Apakah Anda yakin ingin check out sekarang?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya',
          onPress: async () => {
            try {
              setLoading(true);
              const coords = await getLocation();
              
              await apiService.checkOut({
                latitude: coords?.latitude,
                longitude: coords?.longitude,
                keterangan: 'Check out melalui mobile app',
              });
              
              Alert.alert('Berhasil', 'Check out berhasil!');
              await loadData();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Gagal check out');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Izin functions
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Izinkan akses ke galeri untuk melanjutkan');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setIzinFile({
        uri: result.assets[0].uri,
        type: 'image/jpeg',
        name: `photo_${Date.now()}.jpg`,
      });
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setIzinFile({
          uri: result.assets[0].uri,
          type: result.assets[0].mimeType,
          name: result.assets[0].name,
        });
      }
    } catch (error) {
      console.error('Error picking document:', error);
    }
  };

  const handleSubmitIzin = async () => {
    if (!keteranganIzin.trim()) {
      Alert.alert('Error', 'Mohon isi keterangan');
      return;
    }

    // Validate: Check if there's already attendance for the selected date
    const selectedDate = tanggalIzin.toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    
    // If izin date is today and already checked in, block submission
    if (selectedDate === today && todayAttendance?.waktuMasuk) {
      Alert.alert(
        'Tidak Dapat Mengajukan Izin',
        'Anda sudah melakukan check in hari ini. Izin tidak dapat diajukan untuk tanggal ini.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Check if there's already an izin request for this date
    const existingIzin = izinRequests.find(req => {
      const reqDate = new Date(req.tanggal).toISOString().split('T')[0];
      return reqDate === selectedDate && (req.status === 'PENDING' || req.status === 'APPROVED');
    });

    if (existingIzin) {
      Alert.alert(
        'Tidak Dapat Mengajukan Izin',
        `Anda sudah memiliki pengajuan izin dengan status ${getStatusLabel(existingIzin.status)} untuk tanggal ini.`,
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setIsSubmittingIzin(true);
      await apiService.submitIzinRequest({
        tanggal: selectedDate,
        jenis: jenisIzin,
        keterangan: keteranganIzin,
        file: izinFile,
      });

      Alert.alert('Berhasil', 'Pengajuan izin berhasil dikirim');
      setShowIzinModal(false);
      resetIzinForm();
      await loadIzinRequests();
    } catch (error: any) {
      console.error('Error submitting izin:', error);
      Alert.alert('Error', error.message || 'Gagal mengajukan izin');
    } finally {
      setIsSubmittingIzin(false);
    }
  };

  const resetIzinForm = () => {
    setTanggalIzin(new Date());
    setJenisIzin('IZIN');
    setKeteranganIzin('');
    setIzinFile(null);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setTanggalIzin(selectedDate);
    }
  };

  const getStatusColor = (status: IzinStatus) => {
    switch (status) {
      case 'PENDING': return '#FFA500';
      case 'APPROVED': return '#4CAF50';
      case 'REJECTED': return '#F44336';
      default: return '#666';
    }
  };

  const getStatusLabel = (status: IzinStatus) => {
    switch (status) {
      case 'PENDING': return 'Menunggu';
      case 'APPROVED': return 'Disetujui';
      case 'REJECTED': return 'Ditolak';
      default: return status;
    }
  };

  const filteredIzinRequests = izinRequests.filter(req => {
    if (izinFilter === 'all') return true;
    return req.status === izinFilter.toUpperCase();
  });

  // Check if there's an approved izin for today
  const hasTodayApprovedIzin = () => {
    const today = new Date().toISOString().split('T')[0];
    return izinRequests.some(req => {
      const izinDate = new Date(req.tanggal).toISOString().split('T')[0];
      return izinDate === today && req.status === 'APPROVED';
    });
  };

  const todayHasApprovedIzin = hasTodayApprovedIzin();
  
  // Can only check in if: no attendance yet, no check in time, and no approved izin for today
  const canCheckIn = (!todayAttendance || !todayAttendance.waktuMasuk) && !todayHasApprovedIzin;
  
  // Can only check out if: has checked in, no check out time, and no approved izin
  const canCheckOut = todayAttendance?.waktuMasuk && !todayAttendance?.waktuKeluar && !todayHasApprovedIzin;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Kehadiran</Text>
        <Text style={styles.headerSubtitle}>
          {currentTime.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </Text>
      </LinearGradient>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'attendance' && styles.tabActive]}
          onPress={() => setActiveTab('attendance')}
        >
          <Ionicons 
            name="calendar-outline" 
            size={20} 
            color={activeTab === 'attendance' ? 'white' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'attendance' && styles.tabTextActive]}>
            Absensi
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'izin' && styles.tabActive]}
          onPress={() => setActiveTab('izin')}
        >
          <Ionicons 
            name="document-text-outline" 
            size={20} 
            color={activeTab === 'izin' ? 'white' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'izin' && styles.tabTextActive]}>
            Izin/Cuti
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'attendance' ? (
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >

        {/* Current Time Card */}
        <View style={styles.timeCard}>
          <View style={styles.timeCardContent}>
            <Ionicons name="time-outline" size={32} color="#3b82f6" />
            <Text style={styles.currentTime}>{formatTime(currentTime)}</Text>
          </View>
        </View>

        {/* Check In/Out Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.checkInButton,
              (!canCheckIn || loading) && styles.disabledButton,
            ]}
            onPress={handleCheckIn}
            disabled={!canCheckIn || loading}
          >
            <Ionicons name="log-in-outline" size={24} color="white" />
            <Text style={styles.actionButtonText}>Check In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.checkOutButton,
              (!canCheckOut || loading) && styles.disabledButton,
            ]}
            onPress={handleCheckOut}
            disabled={!canCheckOut || loading}
          >
            <Ionicons name="log-out-outline" size={24} color="white" />
            <Text style={styles.actionButtonText}>Check Out</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Attendance Status */}
        {todayAttendance && (
          <View style={styles.todayCard}>
            <Text style={styles.sectionTitle}>Status Hari Ini</Text>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: STATUS_COLORS[todayAttendance.status] },
                ]}
              >
                <Text style={styles.statusText}>
                  {STATUS_LABELS[todayAttendance.status]}
                </Text>
              </View>
            </View>

            {todayAttendance.waktuMasuk && (
              <View style={styles.timeRow}>
                <Ionicons name="enter-outline" size={20} color="#10b981" />
                <Text style={styles.timeLabel}>Masuk:</Text>
                <Text style={styles.timeValue}>
                  {formatDateTime(todayAttendance.waktuMasuk)}
                </Text>
              </View>
            )}

            {todayAttendance.waktuKeluar && (
              <View style={styles.timeRow}>
                <Ionicons name="exit-outline" size={20} color="#ef4444" />
                <Text style={styles.timeLabel}>Keluar:</Text>
                <Text style={styles.timeValue}>
                  {formatDateTime(todayAttendance.waktuKeluar)}
                </Text>
              </View>
            )}

            {todayAttendance.lokasi && (
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={18} color="#6b7280" />
                <Text style={styles.infoText}>{todayAttendance.lokasi}</Text>
              </View>
            )}

            {todayAttendance.keterangan && (
              <View style={styles.infoRow}>
                <Ionicons name="document-text-outline" size={18} color="#6b7280" />
                <Text style={styles.infoText}>{todayAttendance.keterangan}</Text>
              </View>
            )}
          </View>
        )}

        {/* Statistics */}
        {stats && (
          <View style={styles.statsCard}>
            <Text style={styles.sectionTitle}>
              Statistik Bulan {selectedMonth}/{selectedYear}
            </Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#10b981' }]}>
                  {stats.hadir}
                </Text>
                <Text style={styles.statLabel}>Hadir</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#f59e0b' }]}>
                  {stats.terlambat}
                </Text>
                <Text style={styles.statLabel}>Terlambat</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#3b82f6' }]}>
                  {stats.izin}
                </Text>
                <Text style={styles.statLabel}>Izin</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#ef4444' }]}>
                  {stats.sakit}
                </Text>
                <Text style={styles.statLabel}>Sakit</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#dc2626' }]}>
                  {stats.alpa}
                </Text>
                <Text style={styles.statLabel}>Alpa</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#6b7280' }]}>
                  {stats.total}
                </Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
            </View>
          </View>
        )}

        {/* History */}
        <View style={styles.historyCard}>
          <Text style={styles.sectionTitle}>Riwayat Kehadiran</Text>
          {loading && history.length === 0 ? (
            <ActivityIndicator size="large" color="#3b82f6" style={styles.loader} />
          ) : history.length === 0 ? (
            <Text style={styles.emptyText}>Belum ada riwayat kehadiran</Text>
          ) : (
            history.map((item) => (
              <View key={item.id} style={styles.historyItem}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyDate}>{formatDate(item.tanggal)}</Text>
                  <View
                    style={[
                      styles.historyStatusBadge,
                      { backgroundColor: STATUS_COLORS[item.status] },
                    ]}
                  >
                    <Text style={styles.historyStatusText}>
                      {STATUS_LABELS[item.status]}
                    </Text>
                  </View>
                </View>

                {item.waktuMasuk && (
                  <View style={styles.historyTimeRow}>
                    <Ionicons name="enter-outline" size={16} color="#10b981" />
                    <Text style={styles.historyTimeText}>
                      Masuk: {formatDateTime(item.waktuMasuk)}
                    </Text>
                  </View>
                )}

                {item.waktuKeluar && (
                  <View style={styles.historyTimeRow}>
                    <Ionicons name="exit-outline" size={16} color="#ef4444" />
                    <Text style={styles.historyTimeText}>
                      Keluar: {formatDateTime(item.waktuKeluar)}
                    </Text>
                  </View>
                )}

                {item.keterangan && (
                  <Text style={styles.historyNote}>{item.keterangan}</Text>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
      ) : (
        /* Izin Tab Content */
        <>
          <View style={styles.izinFilterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {['all', 'pending', 'approved', 'rejected'].map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[styles.izinFilterTab, izinFilter === filter && styles.izinFilterTabActive]}
                  onPress={() => setIzinFilter(filter as any)}
                >
                  <Text style={[styles.izinFilterText, izinFilter === filter && styles.izinFilterTextActive]}>
                    {filter === 'all' ? 'Semua' : filter === 'pending' ? 'Menunggu' : filter === 'approved' ? 'Disetujui' : 'Ditolak'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <ScrollView 
            style={styles.scrollView}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            <View style={styles.izinContent}>
              {filteredIzinRequests.length > 0 ? (
                filteredIzinRequests.map((request) => (
                  <View key={request.id} style={styles.izinCard}>
                    <View style={styles.izinHeader}>
                      <View style={styles.izinInfo}>
                        <Text style={styles.izinDate}>
                          {new Date(request.tanggal).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </Text>
                        <View style={styles.izinMeta}>
                          <View style={[styles.izinJenisBadge, { backgroundColor: request.jenis === 'SAKIT' ? '#ef4444' : '#3b82f6' }]}>
                            <Text style={styles.izinBadgeText}>{request.jenis}</Text>
                          </View>
                          <View style={[styles.izinStatusBadge, { backgroundColor: getStatusColor(request.status) }]}>
                            <Text style={styles.izinBadgeText}>{getStatusLabel(request.status)}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    <Text style={styles.izinKeterangan}>{request.keterangan}</Text>
                    {request.fileUrl && (
                      <View style={styles.izinFileInfo}>
                        <Ionicons name="document-attach" size={16} color="#667eea" />
                        <Text style={styles.izinFileText}>Lampiran tersedia</Text>
                      </View>
                    )}
                    <Text style={styles.izinTimestamp}>
                      Diajukan: {new Date(request.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                    {request.approvedAt && (
                      <Text style={styles.izinTimestamp}>
                        Diproses: {new Date(request.approvedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </Text>
                    )}
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="document-text-outline" size={64} color="#ccc" />
                  <Text style={styles.emptyText}>Belum ada pengajuan izin</Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* FAB for Izin */}
          <TouchableOpacity
            style={styles.fab}
            onPress={() => setShowIzinModal(true)}
          >
            <Ionicons name="add" size={28} color="white" />
          </TouchableOpacity>
        </>
      )}

      {/* Izin Modal */}
      <Modal
        visible={showIzinModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowIzinModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajukan Izin</Text>
              <TouchableOpacity onPress={() => setShowIzinModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Tanggal</Text>
              <TouchableOpacity
                style={styles.inputField}
                onPress={() => setShowDatePicker(true)}
              >
                <Text>{tanggalIzin.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
                <Ionicons name="calendar-outline" size={20} color="#666" />
              </TouchableOpacity>
              
              {showDatePicker && (
                <DateTimePicker
                  value={tanggalIzin}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                  minimumDate={new Date()}
                />
              )}

              <Text style={styles.label}>Jenis Izin</Text>
              <View style={styles.radioGroup}>
                <TouchableOpacity
                  style={[styles.radioButton, jenisIzin === 'IZIN' && styles.radioButtonActive]}
                  onPress={() => setJenisIzin('IZIN')}
                >
                  <Text style={[styles.radioText, jenisIzin === 'IZIN' && styles.radioTextActive]}>Izin</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.radioButton, jenisIzin === 'SAKIT' && styles.radioButtonActive]}
                  onPress={() => setJenisIzin('SAKIT')}
                >
                  <Text style={[styles.radioText, jenisIzin === 'SAKIT' && styles.radioTextActive]}>Sakit</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Keterangan</Text>
              <TextInput
                style={[styles.inputField, styles.textArea]}
                value={keteranganIzin}
                onChangeText={setKeteranganIzin}
                placeholder="Masukkan alasan izin..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <Text style={styles.label}>Lampiran (Opsional)</Text>
              {izinFile ? (
                <View style={styles.filePreview}>
                  <View style={styles.filePreviewInfo}>
                    <Ionicons name="document-attach" size={24} color="#667eea" />
                    <Text style={styles.fileName}>{izinFile.name}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setIzinFile(null)}>
                    <Ionicons name="close-circle" size={24} color="#F44336" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.fileButtons}>
                  <TouchableOpacity style={styles.fileButton} onPress={handlePickImage}>
                    <Ionicons name="image-outline" size={20} color="#667eea" />
                    <Text style={styles.fileButtonText}>Pilih Foto</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.fileButton} onPress={handlePickDocument}>
                    <Ionicons name="document-outline" size={20} color="#667eea" />
                    <Text style={styles.fileButtonText}>Pilih Dokumen</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => setShowIzinModal(false)}
              >
                <Text style={styles.buttonSecondaryText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary, isSubmittingIzin && styles.buttonDisabled]}
                onPress={handleSubmitIzin}
                disabled={isSubmittingIzin}
              >
                <Text style={styles.buttonPrimaryText}>
                  {isSubmittingIzin ? 'Mengirim...' : 'Kirim'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  timeCard: {
    margin: 20,
    padding: 24,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  timeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  currentTime: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#111827',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 14,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  checkInButton: {
    backgroundColor: '#10b981',
  },
  checkOutButton: {
    backgroundColor: '#ef4444',
  },
  disabledButton: {
    opacity: 0.5,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  todayCard: {
    margin: 20,
    marginTop: 0,
    padding: 24,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  statusRow: {
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  timeLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  timeValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  statsCard: {
    margin: 20,
    marginTop: 0,
    padding: 24,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flex: 1,
    minWidth: '30%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  historyCard: {
    margin: 20,
    marginTop: 0,
    padding: 24,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 40,
  },
  loader: {
    marginVertical: 20,
  },
  historyItem: {
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  historyStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  historyStatusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  historyTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  historyTimeText: {
    fontSize: 12,
    color: '#6b7280',
  },
  historyNote: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  // Tab styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 6,
    marginHorizontal: 20,
    marginTop: -30,
    marginBottom: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#667eea',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  // Izin styles
  izinFilterContainer: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  izinFilterTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  izinFilterTabActive: {
    backgroundColor: '#667eea',
  },
  izinFilterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  izinFilterTextActive: {
    color: 'white',
  },
  izinContent: {
    padding: 20,
  },
  izinCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  izinHeader: {
    marginBottom: 12,
  },
  izinInfo: {
    gap: 8,
  },
  izinDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  izinMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  izinJenisBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  izinStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  izinBadgeText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  izinKeterangan: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  izinFileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  izinFileText: {
    fontSize: 12,
    color: '#667eea',
  },
  izinTimestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    letterSpacing: 0.3,
  },
  modalBody: {
    padding: 24,
    maxHeight: 500,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  inputField: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  radioButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  radioButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  radioText: {
    fontSize: 14,
    color: '#666',
  },
  radioTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  fileButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  fileButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#667eea',
  },
  fileButtonText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
  },
  filePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  filePreviewInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#f0f0f0',
  },
  buttonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  buttonPrimary: {
    backgroundColor: '#667eea',
  },
  buttonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
