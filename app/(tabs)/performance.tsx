import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { apiService, Karyawan } from '@/services/api';
import { LineChart, BarChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function PerformanceScreen() {
  const { user } = useAuth();
  const [karyawan, setKaryawan] = useState<Karyawan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'kpi' | 'rating'>('kpi');

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getMyProfile();
      setKaryawan(data);
    } catch (error) {
      console.error('Error loading performance data:', error);
      Alert.alert('Error', 'Gagal memuat data kinerja');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPerformanceData();
    setRefreshing(false);
  };

  const getCurrentYearData = () => {
    const currentYear = new Date().getFullYear();
    const kpiData = karyawan?.KPI || [];
    const ratingData = karyawan?.Rating || [];
    
    return {
      kpi: kpiData.find(kpi => kpi.year === currentYear),
      rating: ratingData.find(rating => rating.year === currentYear),
      allKPI: kpiData.sort((a, b) => a.year - b.year),
      allRating: ratingData.sort((a, b) => a.year - b.year),
    };
  };

  const prepareChartData = (data: any[], type: 'kpi' | 'rating') => {
    if (!data || data.length === 0) {
      return {
        labels: ['Tidak ada data'],
        datasets: [{
          data: [0],
          color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
        }]
      };
    }

    const labels = data.map(item => item.year.toString());
    const values = data.map(item => item.score);

    return {
      labels: labels.length > 6 ? labels.slice(-6) : labels,
      datasets: [{
        data: values.length > 6 ? values.slice(-6) : values,
        color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
        strokeWidth: 2,
      }]
    };
  };

  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return { level: 'Excellent', color: '#4CAF50' };
    if (score >= 80) return { level: 'Good', color: '#8BC34A' };
    if (score >= 70) return { level: 'Average', color: '#FFC107' };
    if (score >= 60) return { level: 'Below Average', color: '#FF9800' };
    return { level: 'Poor', color: '#F44336' };
  };

  const currentData = getCurrentYearData();
  const chartData = selectedTab === 'kpi' 
    ? prepareChartData(currentData.allKPI, 'kpi')
    : prepareChartData(currentData.allRating, 'rating');

  const currentScore = selectedTab === 'kpi' 
    ? currentData.kpi?.score 
    : currentData.rating?.score;

  const performanceLevel = currentScore ? getPerformanceLevel(currentScore) : null;

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
          <Text style={styles.headerTitle}>Kinerja & Penilaian</Text>
          <Text style={styles.headerSubtitle}>
            Pantau perkembangan kinerja Anda
          </Text>
        </View>
      </LinearGradient>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'kpi' && styles.tabActive
          ]}
          onPress={() => setSelectedTab('kpi')}
        >
          <Ionicons 
            name="trophy-outline" 
            size={20} 
            color={selectedTab === 'kpi' ? 'white' : '#666'} 
          />
          <Text style={[
            styles.tabText,
            selectedTab === 'kpi' && styles.tabTextActive
          ]}>
            KPI
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'rating' && styles.tabActive
          ]}
          onPress={() => setSelectedTab('rating')}
        >
          <Ionicons 
            name="star-outline" 
            size={20} 
            color={selectedTab === 'rating' ? 'white' : '#666'} 
          />
          <Text style={[
            styles.tabText,
            selectedTab === 'rating' && styles.tabTextActive
          ]}>
            Rating
          </Text>
        </TouchableOpacity>
      </View>

      {/* Current Performance Card */}
      <View style={styles.content}>
        <View style={styles.currentCard}>
          <View style={styles.currentHeader}>
            <Text style={styles.currentTitle}>
              {selectedTab === 'kpi' ? 'KPI Tahun Ini' : 'Rating Tahun Ini'}
            </Text>
            <Text style={styles.currentYear}>{new Date().getFullYear()}</Text>
          </View>
          
          {currentScore ? (
            <View style={styles.currentContent}>
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreValue}>{currentScore}</Text>
                <Text style={styles.scoreLabel}>Skor</Text>
              </View>
              
              {performanceLevel && (
                <View style={styles.levelContainer}>
                  <View style={[
                    styles.levelBadge,
                    { backgroundColor: performanceLevel.color }
                  ]}>
                    <Text style={styles.levelText}>{performanceLevel.level}</Text>
                  </View>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.noDataContainer}>
              <Ionicons name="document-outline" size={48} color="#ccc" />
              <Text style={styles.noDataText}>
                Belum ada data {selectedTab === 'kpi' ? 'KPI' : 'Rating'} untuk tahun ini
              </Text>
            </View>
          )}
        </View>

        {/* Chart Section */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>
            Riwayat {selectedTab === 'kpi' ? 'KPI' : 'Rating'}
          </Text>
          
          {chartData.datasets[0].data.length > 0 && chartData.datasets[0].data[0] !== 0 ? (
            <View style={styles.chartContainer}>
              <LineChart
                data={chartData}
                width={screenWidth - 80}
                height={220}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: '#667eea',
                  },
                }}
                bezier
                style={styles.chart}
              />
            </View>
          ) : (
            <View style={styles.noChartContainer}>
              <Ionicons name="bar-chart-outline" size={48} color="#ccc" />
              <Text style={styles.noChartText}>
                Tidak ada data untuk ditampilkan
              </Text>
            </View>
          )}
        </View>

        {/* Performance Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Tips Peningkatan Kinerja</Text>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.tipText}>
                Tetapkan target yang jelas dan terukur
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.tipText}>
                Konsisten dalam menyelesaikan tugas
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.tipText}>
                Ikuti pelatihan untuk meningkatkan skill
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.tipText}>
                Minta feedback dari atasan secara berkala
              </Text>
            </View>
          </View>
        </View>

        {/* Historical Data */}
        {(selectedTab === 'kpi' ? currentData.allKPI : currentData.allRating).length > 0 && (
          <View style={styles.historyCard}>
            <Text style={styles.historyTitle}>Riwayat Lengkap</Text>
            {(selectedTab === 'kpi' ? currentData.allKPI : currentData.allRating).map((item, index) => (
              <View key={index} style={styles.historyItem}>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyYear}>{item.year}</Text>
                  {item.notes && (
                    <Text style={styles.historyNotes}>{item.notes}</Text>
                  )}
                </View>
                <View style={styles.historyScore}>
                  <Text style={styles.historyScoreValue}>{item.score}</Text>
                  <View style={[
                    styles.historyScoreBar,
                    { 
                      width: `${(item.score / 100) * 60}%`,
                      backgroundColor: getPerformanceLevel(item.score).color
                    }
                  ]} />
                </View>
              </View>
            ))}
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
    alignItems: 'center',
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
  tabContainer: {
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
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    marginLeft: 6,
  },
  tabTextActive: {
    color: 'white',
  },
  content: {
    padding: 20,
  },
  currentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  currentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  currentYear: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
  },
  currentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  levelContainer: {
    alignItems: 'center',
  },
  levelBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  levelText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noDataText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
    textAlign: 'center',
  },
  chartCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  chartContainer: {
    alignItems: 'center',
  },
  chart: {
    borderRadius: 16,
  },
  noChartContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noChartText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },
  tipsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    flex: 1,
  },
  historyCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  historyInfo: {
    flex: 1,
  },
  historyYear: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  historyNotes: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  historyScore: {
    alignItems: 'flex-end',
    width: 80,
  },
  historyScoreValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  historyScoreBar: {
    height: 4,
    borderRadius: 2,
    width: 60,
  },
});
