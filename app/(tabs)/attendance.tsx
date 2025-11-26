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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiService, Kehadiran, KehadiranStats } from '../../services/api';
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
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<Kehadiran | null>(null);
  const [history, setHistory] = useState<Kehadiran[]>([]);
  const [stats, setStats] = useState<KehadiranStats | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadData();
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedMonth, selectedYear]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadTodayAttendance(), loadHistory()]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
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

  const handleCheckIn = async () => {
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
              await apiService.checkIn({
                lokasi: 'Kantor Pusat Jakarta',
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
              await apiService.checkOut({
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

  const canCheckIn = !todayAttendance || !todayAttendance.waktuMasuk;
  const canCheckOut = todayAttendance?.waktuMasuk && !todayAttendance?.waktuKeluar;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Kehadiran</Text>
          <Text style={styles.headerSubtitle}>
            {currentTime.toLocaleDateString('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </Text>
        </View>

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
    </SafeAreaView>
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
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  timeCard: {
    margin: 16,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
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
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 32,
  },
  loader: {
    marginVertical: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 14,
    paddingVertical: 20,
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
});
