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
import { apiService, Karyawan } from '@/services/api';
import { router } from 'expo-router';

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const [karyawan, setKaryawan] = useState<Karyawan | null>(null);
  const [upcomingTrainings, setUpcomingTrainings] = useState<any[]>([]);
  const [izinRequests, setIzinRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [profileData, trainingsData, izinData] = await Promise.all([
        apiService.getMyProfile(),
        apiService.getMyTrainings().catch(() => []),
        apiService.getMyIzinRequests().catch(() => [])
      ]);
      setKaryawan(profileData);
      
      // Filter upcoming trainings (hari ini dan ke depan)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const upcoming = trainingsData.filter((t: any) => {
        const trainingDate = new Date(t.pelatihan?.tanggal || t.tanggal);
        trainingDate.setHours(0, 0, 0, 0);
        return trainingDate >= today;
      }).slice(0, 3);
      setUpcomingTrainings(upcoming);
      
      // Get recent izin requests (3 terakhir)
      const recentIzin = izinData
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3);
      setIzinRequests(recentIzin);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      Alert.alert('Error', 'Gagal memuat data dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Apakah Anda yakin ingin keluar?',
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const getCurrentKPI = () => {
    if (!karyawan?.KPI || karyawan.KPI.length === 0) return null;
    const currentYear = new Date().getFullYear();
    return karyawan.KPI.find(kpi => kpi.year === currentYear) || karyawan.KPI[karyawan.KPI.length - 1];
  };

  const getRecentTrainings = () => {
    if (!karyawan?.pelatihanDetail) return [];
    return karyawan.pelatihanDetail
      .sort((a, b) => new Date(b.pelatihan.tanggal).getTime() - new Date(a.pelatihan.tanggal).getTime())
      .slice(0, 3);
  };

  const currentKPI = getCurrentKPI();
  const recentTrainings = getRecentTrainings();

  // Helper untuk membulatkan score (pembulatan matematika untuk tampilan)
  const formatScore = (score: number): string => {
    return Math.round(score).toString();
  };

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
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={30} color="white" />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.welcomeText}>Selamat datang,</Text>
              <Text style={styles.userName}>{karyawan?.nama || user?.username}</Text>
              <Text style={styles.userRole}>
                {karyawan?.Jabatan?.[0]?.nama || 'Karyawan'} • {karyawan?.Departemen?.[0]?.nama || 'Departemen'}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="time" size={24} color="#667eea" />
          </View>
          <Text style={styles.statValue}>{karyawan?.masaKerja || 0}</Text>
          <Text style={styles.statLabel}>Tahun Bekerja</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="trophy" size={24} color="#667eea" />
          </View>
          <Text style={styles.statValue}>{currentKPI?.score ? formatScore(currentKPI.score) : 0}</Text>
          <Text style={styles.statLabel}>KPI Terbaru</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="school" size={24} color="#667eea" />
          </View>
          <Text style={styles.statValue}>{karyawan?.pelatihanDetail?.length || 0}</Text>
          <Text style={styles.statLabel}>Total Pelatihan</Text>
        </View>
      </View>

      {/* Company Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informasi Perusahaan</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="business" size={24} color="#667eea" />
            <Text style={styles.infoTitle}>PT. Mobile HRD Indonesia</Text>
          </View>
          <Text style={styles.infoDescription}>
            Perusahaan teknologi yang berfokus pada pengembangan solusi HR digital untuk meningkatkan produktivitas dan kesejahteraan karyawan.
          </Text>
          <View style={styles.infoStats}>
            <View style={styles.infoStat}>
              <Text style={styles.infoStatValue}>500+</Text>
              <Text style={styles.infoStatLabel}>Karyawan</Text>
            </View>
            <View style={styles.infoStat}>
              <Text style={styles.infoStatValue}>15+</Text>
              <Text style={styles.infoStatLabel}>Departemen</Text>
            </View>
            <View style={styles.infoStat}>
              <Text style={styles.infoStatValue}>50+</Text>
              <Text style={styles.infoStatLabel}>Jabatan</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Upcoming Trainings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pelatihan Mendatang</Text>
        {upcomingTrainings.length > 0 ? (
          <View style={styles.scheduleCard}>
            {upcomingTrainings.map((training, index) => {
              const trainingInfo = training.pelatihan || training;
              const status = training.status || 'INVITED';
              const statusColor = status === 'CONFIRMED' ? '#4CAF50' : status === 'DECLINED' ? '#F44336' : '#FF9800';
              const statusIcon = status === 'CONFIRMED' ? 'checkmark-circle' : status === 'DECLINED' ? 'close-circle' : 'time';
              
              return (
                <View key={index} style={styles.scheduleItem}>
                  <View style={styles.scheduleTime}>
                    <Text style={styles.scheduleTimeText}>
                      {new Date(trainingInfo.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                  <View style={styles.scheduleContent}>
                    <Text style={styles.scheduleTitle}>{trainingInfo.nama}</Text>
                    <Text style={styles.scheduleLocation}>{trainingInfo.lokasi}</Text>
                  </View>
                  <View style={styles.scheduleStatus}>
                    <Ionicons name={statusIcon} size={20} color={statusColor} />
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyStateCard}>
            <Ionicons name="calendar-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Tidak ada pelatihan mendatang</Text>
          </View>
        )}
      </View>

      {/* Izin Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status Izin Terbaru</Text>
        {izinRequests.length > 0 ? (
          <View style={styles.newsCard}>
            {izinRequests.map((izin, index) => {
              const statusColor = izin.status === 'APPROVED' ? '#4CAF50' : izin.status === 'REJECTED' ? '#F44336' : '#FF9800';
              const statusIcon = izin.status === 'APPROVED' ? 'checkmark-circle' : izin.status === 'REJECTED' ? 'close-circle' : 'time';
              const statusText = izin.status === 'APPROVED' ? 'Disetujui' : izin.status === 'REJECTED' ? 'Ditolak' : 'Pending';
              const jenisText = izin.jenis === 'SAKIT' ? 'Sakit' : 'Izin';
              
              const timeAgo = () => {
                const now = new Date();
                const created = new Date(izin.createdAt);
                const diffMs = now.getTime() - created.getTime();
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                
                if (diffDays === 0) return 'Hari ini';
                if (diffDays === 1) return '1 hari yang lalu';
                if (diffDays < 7) return `${diffDays} hari yang lalu`;
                if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu yang lalu`;
                return `${Math.floor(diffDays / 30)} bulan yang lalu`;
              };
              
              return (
                <View key={index} style={styles.newsItem}>
                  <View style={[styles.newsIcon, { backgroundColor: statusColor + '20' }]}>
                    <Ionicons name={statusIcon} size={20} color={statusColor} />
                  </View>
                  <View style={styles.newsContent}>
                    <Text style={styles.newsTitle}>
                      {jenisText} - {new Date(izin.tanggal).toLocaleDateString('id-ID')}
                    </Text>
                    <Text style={styles.newsDate}>{statusText} • {timeAgo()}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyStateCard}>
            <Ionicons name="document-text-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Belum ada pengajuan izin</Text>
          </View>
        )}
      </View>

      {/* Recent Trainings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pelatihan Terbaru</Text>
        {recentTrainings.length > 0 ? (
          recentTrainings.map((training, index) => (
            <View key={index} style={styles.trainingCard}>
              <View style={styles.trainingInfo}>
                <Text style={styles.trainingName}>{training.pelatihan.nama}</Text>
                <Text style={styles.trainingDate}>
                  {new Date(training.pelatihan.tanggal).toLocaleDateString('id-ID')}
                </Text>
                <Text style={styles.trainingLocation}>{training.pelatihan.lokasi}</Text>
              </View>
              {training.skor && (
                <View style={styles.trainingScore}>
                  <Text style={styles.scoreText}>{training.skor}</Text>
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="school-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Belum ada pelatihan</Text>
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
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  welcomeText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    letterSpacing: 0.3,
  },
  userName: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  userRole: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: -30,
    marginBottom: 24,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
    letterSpacing: 0.3,
  },
  infoDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 20,
  },
  infoStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  infoStat: {
    alignItems: 'center',
  },
  infoStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#667eea',
  },
  infoStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  scheduleCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  scheduleTime: {
    width: 60,
    alignItems: 'center',
  },
  scheduleTimeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#667eea',
  },
  scheduleContent: {
    flex: 1,
    marginLeft: 15,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  scheduleLocation: {
    fontSize: 12,
    color: '#666',
  },
  scheduleStatus: {
    width: 30,
    alignItems: 'center',
  },
  newsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  newsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  newsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  newsContent: {
    flex: 1,
  },
  newsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  newsDate: {
    fontSize: 12,
    color: '#666',
  },
  trainingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trainingInfo: {
    flex: 1,
  },
  trainingName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  trainingDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  trainingLocation: {
    fontSize: 12,
    color: '#999',
  },
  trainingScore: {
    backgroundColor: '#667eea',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  scoreText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },
  emptyStateCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
});
