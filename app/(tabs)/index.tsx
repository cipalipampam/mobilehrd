import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { apiService, Karyawan } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';

const API_BASE_URL = 'http://10.10.1.89:5000';

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const [karyawan, setKaryawan] = useState<Karyawan | null>(null);
  const [upcomingTrainings, setUpcomingTrainings] = useState<any[]>([]);
  const [izinRequests, setIzinRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);

  // Load data only once on mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Refresh photo when screen comes into focus (but not on initial mount)
  useFocusEffect(
    React.useCallback(() => {
      // Only reload photo, not all dashboard data
      if (!isLoading) {
        loadUserPhoto();
      }
    }, [isLoading])
  );

  const loadUserPhoto = async () => {
    try {
      setPhotoLoading(true);
      const currentUser = await apiService.getCurrentUser();
      
      if (currentUser && currentUser.foto_profil) {
        setPhotoUrl(currentUser.foto_profil);
      } else {
        setPhotoUrl(null);
      }
    } catch (photoError) {
      console.error('❌ Dashboard: Error loading photo:', photoError);
      setPhotoUrl(null);
    } finally {
      setPhotoLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load all data in parallel including photo
      const [currentUser, profileData, trainingsData, izinData] = await Promise.all([
        apiService.getCurrentUser(),
        apiService.getMyProfile(),
        apiService.getMyTrainings().catch(() => []),
        apiService.getMyIzinRequests().catch(() => [])
      ]);
      
      // Set photo from currentUser
      if (currentUser && currentUser.foto_profil) {
        setPhotoUrl(currentUser.foto_profil);
      }
      
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
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.userInfo}>
            <TouchableOpacity 
              style={styles.avatarContainer}
              onPress={() => router.push('/(tabs)/profile')}
            >
              {photoLoading ? (
                <View style={styles.avatar}>
                  <ActivityIndicator size="small" color="white" />
                </View>
              ) : photoUrl ? (
                <Image 
                  source={{ 
                    uri: photoUrl.startsWith('http') 
                      ? photoUrl 
                      : `${API_BASE_URL}${photoUrl.startsWith('/') ? photoUrl : '/' + photoUrl}` 
                  }} 
                  style={styles.avatarImage}
                  onLoadStart={() => setPhotoLoading(true)}
                  onLoadEnd={() => setPhotoLoading(false)}
                  onError={(e) => {
                    console.log('❌ Dashboard: Error loading image');
                    setPhotoLoading(false);
                    setPhotoUrl(null);
                  }}
                />
              ) : (
                <View style={styles.avatar}>
                  <Ionicons name="person" size={30} color="white" />
                </View>
              )}
            </TouchableOpacity>
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
      </View>

      {/* Content Wrapper with curved top */}
      <View style={styles.contentWrapper}>
        {/* Stats Cards - Redesigned */}
        <View style={styles.statsContainer}>
        {/* Large Featured Card - KPI */}
        <View style={styles.featuredCard}>
          <View style={styles.featuredCardHeader}>
            <View style={styles.featuredIconWrapper}>
              <Ionicons name="trophy" size={28} color="#FFD700" />
            </View>
            <View style={styles.decorativeCircle1} />
            <View style={styles.decorativeCircle2} />
          </View>
          <Text style={styles.featuredLabel}>KPI Score</Text>
          <Text style={styles.featuredValue}>{currentKPI?.score ? formatScore(currentKPI.score) : 0}</Text>
          <View style={styles.featuredProgressBar}>
            <View style={[styles.featuredProgress, { width: `${currentKPI?.score || 0}%` }]} />
          </View>
          <Text style={styles.featuredSubtext}>Performance Tahun Ini</Text>
        </View>

        {/* Two Small Cards */}
        <View style={styles.smallCardsRow}>
          <View style={styles.smallCard}>
            <View style={styles.smallCardIconWrapper}>
              <Ionicons name="time-outline" size={24} color="#1a1a1a" />
            </View>
            <Text style={styles.smallCardValue}>{karyawan?.masaKerja || 0}</Text>
            <Text style={styles.smallCardLabel}>Tahun</Text>
            <Text style={styles.smallCardSubtext}>Masa Kerja</Text>
          </View>

          <View style={styles.smallCard}>
            <View style={styles.smallCardIconWrapper}>
              <Ionicons name="school-outline" size={24} color="#1a1a1a" />
            </View>
            <Text style={styles.smallCardValue}>{karyawan?.pelatihanDetail?.length || 0}</Text>
            <Text style={styles.smallCardLabel}>Training</Text>
            <Text style={styles.smallCardSubtext}>Completed</Text>
          </View>
        </View>
      </View>

      {/* Company Information */}
      {/* <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informasi Perusahaan</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="business" size={24} color="#1a1a1a" />
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
      </View> */}

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
      {/* End Content Wrapper */}
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
    paddingBottom: 60,
    paddingHorizontal: 24,
    backgroundColor: '#1a1a1a',
    position: 'relative',
  },
  headerWave: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: '#f5f5f5',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    marginTop: -50,
    paddingTop: 50,
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
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
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
    paddingHorizontal: 20,
    marginTop: -40,
    marginBottom: 20,
    gap: 16,
  },
  featuredCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 24,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  featuredCardHeader: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 120,
    height: 120,
  },
  featuredIconWrapper: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  decorativeCircle2: {
    position: 'absolute',
    top: 10,
    right: -50,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  featuredLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  featuredValue: {
    fontSize: 56,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
    letterSpacing: -2,
  },
  featuredProgressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  featuredProgress: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 3,
  },
  featuredSubtext: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 0.3,
  },
  smallCardsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  smallCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  smallCardIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  smallCardValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
    letterSpacing: -1,
  },
  smallCardLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
    fontWeight: '600',
  },
  smallCardSubtext: {
    fontSize: 11,
    color: '#999',
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
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
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
    color: '#1a1a1a',
  },
  infoStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  scheduleCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  scheduleTime: {
    width: 60,
    alignItems: 'center',
    marginRight: 16,
  },
  scheduleTimeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  scheduleContent: {
    flex: 1,
    marginRight: 12,
  },
  scheduleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  scheduleLocation: {
    fontSize: 13,
    color: '#666',
  },
  scheduleStatus: {
    width: 32,
    alignItems: 'center',
  },
  newsCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  newsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  newsIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
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
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  trainingInfo: {
    flex: 1,
  },
  trainingName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  trainingDate: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  trainingLocation: {
    fontSize: 12,
    color: '#999',
  },
  trainingScore: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  scoreText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
  emptyStateCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
});
