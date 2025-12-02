import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { router } from 'expo-router';
import { apiService, Karyawan } from '@/services/api';

const screenWidth = Dimensions.get('window').width;

export default function KPIDetailScreen() {
  const [loading, setLoading] = useState(true);
  const [karyawan, setKaryawan] = useState<Karyawan | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'yearly'>('yearly');

  useEffect(() => {
    loadKPIData();
  }, []);

  const loadKPIData = async () => {
    try {
      setLoading(true);
      const data = await apiService.getMyProfile();
      setKaryawan(data);
    } catch (error) {
      console.error('Error loading KPI data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getYearlyData = () => {
    if (!karyawan?.KPI) return { labels: [], data: [] };

    const sorted = [...karyawan.KPI].sort((a, b) => a.year - b.year);
    const labels = sorted.map(kpi => kpi.year.toString());
    const data = sorted.map(kpi => kpi.score);

    return { labels, data };
  };

  const getScoreCategory = (score: number) => {
    if (score >= 90) return { label: 'Sangat Baik', color: '#10b981' };
    if (score >= 80) return { label: 'Baik', color: '#3b82f6' };
    if (score >= 70) return { label: 'Cukup', color: '#f59e0b' };
    if (score >= 60) return { label: 'Kurang', color: '#ef4444' };
    return { label: 'Sangat Kurang', color: '#dc2626' };
  };

  const calculateAverage = () => {
    if (!karyawan?.KPI || karyawan.KPI.length === 0) return '0';
    const sum = karyawan.KPI.reduce((acc, kpi) => acc + kpi.score, 0);
    return (sum / karyawan.KPI.length).toFixed(2);
  };

  const getHighestScore = () => {
    if (!karyawan?.KPI || karyawan.KPI.length === 0) return null;
    return karyawan.KPI.reduce((max, kpi) => kpi.score > max.score ? kpi : max);
  };

  const getLowestScore = () => {
    if (!karyawan?.KPI || karyawan.KPI.length === 0) return null;
    return karyawan.KPI.reduce((min, kpi) => kpi.score < min.score ? kpi : min);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Memuat data KPI...</Text>
      </View>
    );
  }

  const yearlyData = getYearlyData();
  const avgScore = parseFloat(calculateAverage());
  const highestScore = getHighestScore();
  const lowestScore = getLowestScore();
  const scoreCategory = getScoreCategory(avgScore);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail KPI</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Ionicons name="trending-up" size={24} color="#667eea" />
            <Text style={styles.summaryValue}>{avgScore}</Text>
            <Text style={styles.summaryLabel}>Rata-rata</Text>
            <View style={[styles.categoryBadge, { backgroundColor: scoreCategory.color }]}>
              <Text style={styles.categoryText}>{scoreCategory.label}</Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <Ionicons name="trophy" size={24} color="#10b981" />
            <Text style={styles.summaryValue}>{highestScore?.score || 0}</Text>
            <Text style={styles.summaryLabel}>Tertinggi</Text>
            <Text style={styles.summaryYear}>{highestScore?.year || '-'}</Text>
          </View>

          <View style={styles.summaryCard}>
            <Ionicons name="alert-circle" size={24} color="#ef4444" />
            <Text style={styles.summaryValue}>{lowestScore?.score || 0}</Text>
            <Text style={styles.summaryLabel}>Terendah</Text>
            <Text style={styles.summaryYear}>{lowestScore?.year || '-'}</Text>
          </View>
        </View>

        {/* Chart Section */}
        {yearlyData.labels.length > 0 ? (
          <>
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Tren KPI Tahunan</Text>
              <LineChart
                data={{
                  labels: yearlyData.labels,
                  datasets: [{ data: yearlyData.data }],
                }}
                width={screenWidth - 32}
                height={220}
                chartConfig={{
                  backgroundColor: '#fff',
                  backgroundGradientFrom: '#fff',
                  backgroundGradientTo: '#fff',
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: { borderRadius: 16 },
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

            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Perbandingan Skor</Text>
              <BarChart
                data={{
                  labels: yearlyData.labels,
                  datasets: [{ data: yearlyData.data }],
                }}
                width={screenWidth - 32}
                height={220}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={{
                  backgroundColor: '#fff',
                  backgroundGradientFrom: '#fff',
                  backgroundGradientTo: '#fff',
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: { borderRadius: 16 },
                }}
                style={styles.chart}
                showValuesOnTopOfBars
              />
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="bar-chart-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Belum ada data KPI</Text>
          </View>
        )}

        {/* Detail List */}
        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>Detail Per Tahun</Text>
          {karyawan?.KPI.sort((a, b) => b.year - a.year).map((kpi, index) => {
            const category = getScoreCategory(kpi.score);
            return (
              <View key={index} style={styles.detailCard}>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailYear}>{kpi.year}</Text>
                  <View style={[styles.scoreBadge, { backgroundColor: category.color }]}>
                    <Text style={styles.scoreText}>{kpi.score}</Text>
                  </View>
                </View>
                <View style={[styles.categoryBadge, { backgroundColor: category.color }]}>
                  <Text style={styles.categoryText}>{category.label}</Text>
                </View>
                {kpi.notes && (
                  <Text style={styles.detailNotes}>{kpi.notes}</Text>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    flex: 1,
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  summaryYear: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  categoryBadge: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  chartCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  detailSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  detailCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailYear: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  detailNotes: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
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
});
