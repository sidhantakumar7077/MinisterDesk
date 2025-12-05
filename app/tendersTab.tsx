import { UserProfile } from '@/components/UserSwitcher';
import { Bell, Building, Calendar, ChevronDown, ChevronUp, Clock, Download, Eye, Filter, CircleHelp as HelpCircle, IndianRupee, Lock, MapPin, Moon, Search, Settings, Trophy, User } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const tenders = [
  {
    id: '1',
    title: 'Highway Construction Project - NH-16 Extension',
    department: 'Works Department',
    tenderNumber: 'WD/2024/HC/001',
    description: 'Construction of 45 km highway extension from Bhubaneswar to Puri with 4-lane configuration',
    estimatedValue: '₹850 Crores',
    publishDate: '2024-11-15',
    submissionDeadline: '2024-12-30',
    openingDate: '2025-01-05',
    location: 'Bhubaneswar to Puri, Odisha',
    status: 'active',
    category: 'Infrastructure',
    eligibilityCriteria: 'Class A contractors with highway construction experience',
    contactPerson: 'Surendra Kumar Patel, Chief Engineer',
    documents: ['Technical Specifications', 'BOQ', 'Site Survey Report'],
    bidders: 12,
  },
  {
    id: '2',
    title: 'Bridge Construction over Mahanadi River',
    department: 'Works Department',
    tenderNumber: 'WD/2024/BC/002',
    description: 'Construction of 2.5 km cable-stayed bridge over Mahanadi River connecting Cuttack and Jagatsinghpur',
    estimatedValue: '₹1,200 Crores',
    publishDate: '2024-10-20',
    submissionDeadline: '2024-12-25',
    openingDate: '2024-12-28',
    location: 'Cuttack-Jagatsinghpur, Odisha',
    status: 'active',
    category: 'Infrastructure',
    eligibilityCriteria: 'Class A+ contractors with bridge construction experience',
    contactPerson: 'Rajesh Kumar Sahoo, Additional Secretary',
    documents: ['Engineering Drawings', 'Environmental Clearance', 'Technical Specs'],
    bidders: 8,
  },
  {
    id: '3',
    title: 'Legal Documentation Management System',
    department: 'Law Department',
    tenderNumber: 'LD/2024/IT/003',
    description: 'Development and implementation of digital legal document management system for Odisha Law Department',
    estimatedValue: '₹15 Crores',
    publishDate: '2024-11-01',
    submissionDeadline: '2024-12-20',
    openingDate: '2024-12-22',
    location: 'Odisha Secretariat, Bhubaneswar',
    status: 'active',
    category: 'IT Services',
    eligibilityCriteria: 'IT companies with government project experience',
    contactPerson: 'Priyanka Mohanty, Legal Advisor',
    documents: ['System Requirements', 'Technical Architecture', 'Security Guidelines'],
    bidders: 15,
  },
  {
    id: '4',
    title: 'Road Maintenance Contract - District Roads',
    department: 'Works Department',
    tenderNumber: 'WD/2024/RM/004',
    description: 'Annual maintenance contract for district roads across 10 districts in Odisha',
    estimatedValue: '₹320 Crores',
    publishDate: '2024-09-15',
    submissionDeadline: '2024-11-30',
    openingDate: '2024-12-05',
    location: 'Multiple Districts, Odisha',
    status: 'completed',
    category: 'Maintenance',
    eligibilityCriteria: 'Class B contractors with road maintenance experience',
    contactPerson: 'Bikash Chandra Rout, Project Director',
    documents: ['Maintenance Guidelines', 'Quality Standards', 'Performance Metrics'],
    bidders: 22,
    winnerCompany: 'Odisha Infrastructure Pvt. Ltd.',
    winningAmount: '₹298 Crores',
    completionDate: '2024-12-10',
    contractDuration: '3 years',
  },
  {
    id: '5',
    title: 'Court Complex Construction - Berhampur',
    department: 'Law Department',
    tenderNumber: 'LD/2024/CC/005',
    description: 'Construction of new district court complex in Berhampur with modern facilities',
    estimatedValue: '₹180 Crores',
    publishDate: '2024-08-10',
    submissionDeadline: '2024-10-15',
    openingDate: '2024-10-20',
    location: 'Berhampur, Ganjam District, Odisha',
    status: 'completed',
    category: 'Construction',
    eligibilityCriteria: 'Class A contractors with institutional building experience',
    contactPerson: 'Anita Jena, Joint Secretary',
    documents: ['Architectural Plans', 'Structural Designs', 'MEP Drawings'],
    bidders: 18,
    winnerCompany: 'Supreme Construction Company',
    winningAmount: '₹165 Crores',
    completionDate: '2024-11-25',
    contractDuration: '24 months',
  },
  {
    id: '6',
    title: 'Digital Case Management System',
    department: 'Law Department',
    tenderNumber: 'LD/2024/CMS/006',
    description: 'Implementation of digital case management system for all district courts in Odisha',
    estimatedValue: '₹45 Crores',
    publishDate: '2024-07-20',
    submissionDeadline: '2024-09-30',
    openingDate: '2024-10-05',
    location: 'All District Courts, Odisha',
    status: 'completed',
    category: 'IT Services',
    eligibilityCriteria: 'IT companies with legal software development experience',
    contactPerson: 'Advocate Subhash Chandra Nayak, Government Advocate',
    documents: ['Software Requirements', 'Integration Specs', 'Training Manual'],
    bidders: 11,
    winnerCompany: 'TechLaw Solutions India Ltd.',
    winningAmount: '₹38 Crores',
    completionDate: '2024-10-30',
    contractDuration: '18 months + 3 years maintenance',
  },
  {
    id: '7',
    title: 'Rural Road Development Phase-III',
    department: 'Works Department',
    tenderNumber: 'WD/2024/RRD/007',
    description: 'Development of rural roads connecting 150 villages across 5 districts under PMGSY scheme',
    estimatedValue: '₹420 Crores',
    publishDate: '2024-12-01',
    submissionDeadline: '2025-01-15',
    openingDate: '2025-01-20',
    location: 'Kalahandi, Koraput, Rayagada, Gajapati, Kandhamal Districts',
    status: 'active',
    category: 'Rural Development',
    eligibilityCriteria: 'Class A contractors with rural road construction experience',
    contactPerson: 'Amit Kumar Singh, Executive Engineer',
    documents: ['Village Connectivity Plan', 'Technical Standards', 'Environmental Guidelines'],
    bidders: 6,
  },
];

const departments = ['All', 'Works Department', 'Law Department'];
const statuses = ['All', 'Active', 'Completed'];
const categories = ['All', 'Infrastructure', 'Construction', 'IT Services', 'Maintenance', 'Rural Development'];

const settingsData = [
  {
    category: 'Profile',
    icon: User,
    items: [
      { id: 'profile', title: 'Edit Profile', subtitle: 'Update your personal information', hasArrow: true },
      { id: 'preferences', title: 'Preferences', subtitle: 'Customize your experience', hasArrow: true },
    ]
  },
  {
    category: 'Notifications',
    icon: Bell,
    items: [
      { id: 'push', title: 'Push Notifications', subtitle: 'Receive meeting reminders', hasSwitch: true, enabled: true },
      { id: 'email', title: 'Email Notifications', subtitle: 'Get updates via email', hasSwitch: true, enabled: false },
      { id: 'sound', title: 'Sound Alerts', subtitle: 'Audio notifications for meetings', hasSwitch: true, enabled: true },
    ]
  },
  {
    category: 'Calendar',
    icon: Calendar,
    items: [
      { id: 'sync', title: 'Calendar Sync', subtitle: 'Sync with device calendar', hasSwitch: true, enabled: true },
      { id: 'reminders', title: 'Default Reminders', subtitle: '15 minutes before meetings', hasArrow: true },
      { id: 'timezone', title: 'Time Zone', subtitle: 'Eastern Time (UTC-5)', hasArrow: true },
    ]
  },
  {
    category: 'Appearance',
    icon: Moon,
    items: [
      { id: 'theme', title: 'Dark Mode', subtitle: 'Enable dark theme', hasSwitch: true, enabled: false },
      { id: 'language', title: 'Language', subtitle: 'English', hasArrow: true },
    ]
  },
  {
    category: 'Security',
    icon: Lock,
    items: [
      { id: 'password', title: 'Change Password', subtitle: 'Update your account password', hasArrow: true },
      { id: 'biometric', title: 'Biometric Login', subtitle: 'Use fingerprint or face ID', hasSwitch: true, enabled: false },
      { id: 'backup', title: 'Data Backup', subtitle: 'Backup your meetings and contacts', hasArrow: true },
    ]
  },
  {
    category: 'Support',
    icon: HelpCircle,
    items: [
      { id: 'help', title: 'Help Center', subtitle: 'Get help and support', hasArrow: true },
      { id: 'feedback', title: 'Send Feedback', subtitle: 'Help us improve the app', hasArrow: true },
      { id: 'about', title: 'About', subtitle: 'App version 1.0.0', hasArrow: true },
    ]
  }
];

export default function TendersScreen() {
  const [currentUser, setCurrentUser] = useState<UserProfile>({
    id: 'minister',
    name: 'Prithiviraj Harichandan',
    role: 'Senior Minister',
    email: 'prithiviraj.harichandan@odisha.gov.in',
  });

  const [searchText, setSearchText] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedTender, setExpandedTender] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [switchStates, setSwitchStates] = useState<Record<string, boolean>>({
    push: true,
    email: false,
    sound: true,
    sync: true,
    theme: false,
    biometric: false,
  });

  const toggleSwitch = (key: string) => {
    setSwitchStates(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredTenders = tenders.filter(tender => {
    const matchesSearch = tender.title.toLowerCase().includes(searchText.toLowerCase()) ||
                         tender.description.toLowerCase().includes(searchText.toLowerCase()) ||
                         tender.tenderNumber.toLowerCase().includes(searchText.toLowerCase());
    const matchesDepartment = selectedDepartment === 'All' || tender.department === selectedDepartment;
    const matchesStatus = selectedStatus === 'All' || tender.status === selectedStatus.toLowerCase();
    const matchesCategory = selectedCategory === 'All' || tender.category === selectedCategory;
    
    return matchesSearch && matchesDepartment && matchesStatus && matchesCategory;
  });

  const activeTenders = filteredTenders.filter(t => t.status === 'active');
  const completedTenders = filteredTenders.filter(t => t.status === 'completed');

  const getStatusColor = (status: string) => {
    return status === 'active' ? '#059669' : '#6b7280';
  };

  const getDepartmentColor = (department: string) => {
    const colors: Record<string, string> = {
      'Works Department': '#1e40af',
      'Law Department': '#7c3aed',
    };
    return colors[department] || '#6b7280';
  };

  const getDaysRemaining = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const renderFilterChips = (options: string[], selected: string, onSelect: (value: string) => void) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {options.map((option) => (
        <TouchableOpacity
          key={option}
          style={[
            styles.filterChip,
            selected === option && styles.activeFilterChip
          ]}
          onPress={() => onSelect(option)}
        >
          <Text style={[
            styles.filterChipText,
            selected === option && styles.activeFilterChipText
          ]}>
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <>
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{showSettings ? 'Settings' : 'Tenders'}</Text>
          </View>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => setShowSettings(!showSettings)}
          >
            <Settings size={24} color="#1e40af" />
          </TouchableOpacity>
        </View>

        {/* Search and Filters */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Search size={20} color="#6b7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search tenders..."
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor="#9ca3af"
            />
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => setShowFilters(!showFilters)}
            >
              <Filter size={20} color="#1e40af" />
            </TouchableOpacity>
          </View>

          {showFilters && (
            <View style={styles.filtersContainer}>
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Department</Text>
                {renderFilterChips(departments, selectedDepartment, setSelectedDepartment)}
              </View>

              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Status</Text>
                {renderFilterChips(statuses, selectedStatus, setSelectedStatus)}
              </View>

              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Category</Text>
                {renderFilterChips(categories, selectedCategory, setSelectedCategory)}
              </View>
            </View>
          )}
        </View>

        {/* Statistics */}
        <View style={styles.statsSection}>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{activeTenders.length}</Text>
              <Text style={styles.statLabel}>Active Tenders</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{completedTenders.length}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                ₹{Math.round(tenders.reduce((sum, t) => {
                  const value = parseFloat(t.estimatedValue.replace(/[₹,\s]/g, '').replace('Crores', ''));
                  return sum + value;
                }, 0))}Cr
              </Text>
              <Text style={styles.statLabel}>Total Value</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{tenders.reduce((sum, t) => sum + t.bidders, 0)}</Text>
              <Text style={styles.statLabel}>Total Bidders</Text>
            </View>
          </View>
        </View>

        {/* Active Tenders */}
        <View style={styles.tendersSection}>
          <Text style={styles.sectionTitle}>Active Tenders ({activeTenders.length})</Text>
          {activeTenders.map((tender) => (
            <View key={tender.id} style={styles.tenderCard}>
              <View style={styles.tenderHeader}>
                <View style={styles.tenderTitleSection}>
                  <Text style={styles.tenderTitle}>{tender.title}</Text>
                  <Text style={styles.tenderNumber}>{tender.tenderNumber}</Text>
                </View>
                <View style={styles.tenderBadges}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(tender.status) }]}>
                    <Text style={styles.statusText}>ACTIVE</Text>
                  </View>
                  <View style={[styles.departmentBadge, { backgroundColor: getDepartmentColor(tender.department) }]}>
                    <Text style={styles.departmentText}>{tender.department}</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.tenderDescription}>{tender.description}</Text>

              <View style={styles.tenderDetails}>
                <View style={styles.detailRow}>
                  <IndianRupee size={16} color="#6b7280" />
                  <Text style={styles.detailText}>Estimated Value: {tender.estimatedValue}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Calendar size={16} color="#6b7280" />
                  <Text style={styles.detailText}>
                    Deadline: {new Date(tender.submissionDeadline).toLocaleDateString('en-IN')}
                  </Text>
                  <View style={styles.urgencyBadge}>
                    <Clock size={12} color="#f59e0b" />
                    <Text style={styles.urgencyText}>
                      {getDaysRemaining(tender.submissionDeadline)} days left
                    </Text>
                  </View>
                </View>
                
                <View style={styles.detailRow}>
                  <MapPin size={16} color="#6b7280" />
                  <Text style={styles.detailText}>{tender.location}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Building size={16} color="#6b7280" />
                  <Text style={styles.detailText}>{tender.bidders} bidders registered</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.expandButton}
                onPress={() => setExpandedTender(expandedTender === tender.id ? null : tender.id)}
              >
                <Text style={styles.expandButtonText}>
                  {expandedTender === tender.id ? 'Show Less' : 'Show More Details'}
                </Text>
                {expandedTender === tender.id ? 
                  <ChevronUp size={16} color="#1e40af" /> : 
                  <ChevronDown size={16} color="#1e40af" />
                }
              </TouchableOpacity>

              {expandedTender === tender.id && (
                <View style={styles.expandedContent}>
                  <View style={styles.expandedSection}>
                    <Text style={styles.expandedSectionTitle}>Contact Information</Text>
                    <Text style={styles.expandedText}>{tender.contactPerson}</Text>
                  </View>

                  <View style={styles.expandedSection}>
                    <Text style={styles.expandedSectionTitle}>Eligibility Criteria</Text>
                    <Text style={styles.expandedText}>{tender.eligibilityCriteria}</Text>
                  </View>

                  <View style={styles.expandedSection}>
                    <Text style={styles.expandedSectionTitle}>Required Documents</Text>
                    {tender.documents.map((doc, index) => (
                      <Text key={index} style={styles.documentItem}>• {doc}</Text>
                    ))}
                  </View>

                  <View style={styles.expandedSection}>
                    <Text style={styles.expandedSectionTitle}>Important Dates</Text>
                    <Text style={styles.dateItem}>Published: {new Date(tender.publishDate).toLocaleDateString('en-IN')}</Text>
                    <Text style={styles.dateItem}>Submission Deadline: {new Date(tender.submissionDeadline).toLocaleDateString('en-IN')}</Text>
                    <Text style={styles.dateItem}>Opening Date: {new Date(tender.openingDate).toLocaleDateString('en-IN')}</Text>
                  </View>
                </View>
              )}

              <View style={styles.tenderActions}>
                <TouchableOpacity style={styles.viewButton}>
                  <Eye size={16} color="#1e40af" />
                  <Text style={styles.viewButtonText}>View Details</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.downloadButton}>
                  <Download size={16} color="#059669" />
                  <Text style={styles.downloadButtonText}>Download</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Completed Tenders */}
        <View style={styles.tendersSection}>
          <Text style={styles.sectionTitle}>Completed Tenders ({completedTenders.length})</Text>
          {completedTenders.map((tender) => (
            <View key={tender.id} style={[styles.tenderCard, styles.completedTenderCard]}>
              <View style={styles.tenderHeader}>
                <View style={styles.tenderTitleSection}>
                  <Text style={styles.tenderTitle}>{tender.title}</Text>
                  <Text style={styles.tenderNumber}>{tender.tenderNumber}</Text>
                </View>
                <View style={styles.tenderBadges}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(tender.status) }]}>
                    <Text style={styles.statusText}>COMPLETED</Text>
                  </View>
                  <View style={[styles.departmentBadge, { backgroundColor: getDepartmentColor(tender.department) }]}>
                    <Text style={styles.departmentText}>{tender.department}</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.tenderDescription}>{tender.description}</Text>

              {/* Winner Information */}
              <View style={styles.winnerSection}>
                <View style={styles.winnerHeader}>
                  <Trophy size={20} color="#f59e0b" />
                  <Text style={styles.winnerTitle}>Winning Bid</Text>
                </View>
                
                <View style={styles.winnerDetails}>
                  <View style={styles.winnerInfo}>
                    <Text style={styles.winnerCompany}>{tender.winnerCompany}</Text>
                    <Text style={styles.winnerAmount}>{tender.winningAmount}</Text>
                  </View>
                  <View style={styles.savingsInfo}>
                    <Text style={styles.savingsLabel}>Savings:</Text>
                    <Text style={styles.savingsAmount}>
                      ₹{(parseFloat(tender.estimatedValue.replace(/[₹,\s]/g, '').replace('Crores', '')) - 
                          parseFloat(tender.winningAmount!.replace(/[₹,\s]/g, '').replace('Crores', ''))).toFixed(0)} Cr
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.tenderDetails}>
                <View style={styles.detailRow}>
                  <Calendar size={16} color="#6b7280" />
                  <Text style={styles.detailText}>
                    Completed: {new Date(tender.completionDate!).toLocaleDateString('en-IN')}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Clock size={16} color="#6b7280" />
                  <Text style={styles.detailText}>Contract Duration: {tender.contractDuration}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <MapPin size={16} color="#6b7280" />
                  <Text style={styles.detailText}>{tender.location}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Building size={16} color="#6b7280" />
                  <Text style={styles.detailText}>{tender.bidders} total bidders participated</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.expandButton}
                onPress={() => setExpandedTender(expandedTender === tender.id ? null : tender.id)}
              >
                <Text style={styles.expandButtonText}>
                  {expandedTender === tender.id ? 'Show Less' : 'Show More Details'}
                </Text>
                {expandedTender === tender.id ? 
                  <ChevronUp size={16} color="#1e40af" /> : 
                  <ChevronDown size={16} color="#1e40af" />
                }
              </TouchableOpacity>

              {expandedTender === tender.id && (
                <View style={styles.expandedContent}>
                  <View style={styles.expandedSection}>
                    <Text style={styles.expandedSectionTitle}>Project Manager</Text>
                    <Text style={styles.expandedText}>{tender.contactPerson}</Text>
                  </View>

                  <View style={styles.expandedSection}>
                    <Text style={styles.expandedSectionTitle}>Selection Criteria</Text>
                    <Text style={styles.expandedText}>{tender.eligibilityCriteria}</Text>
                  </View>

                  <View style={styles.expandedSection}>
                    <Text style={styles.expandedSectionTitle}>Project Documents</Text>
                    {tender.documents.map((doc, index) => (
                      <Text key={index} style={styles.documentItem}>• {doc}</Text>
                    ))}
                  </View>

                  <View style={styles.expandedSection}>
                    <Text style={styles.expandedSectionTitle}>Timeline</Text>
                    <Text style={styles.dateItem}>Published: {new Date(tender.publishDate).toLocaleDateString('en-IN')}</Text>
                    <Text style={styles.dateItem}>Submission Deadline: {new Date(tender.submissionDeadline).toLocaleDateString('en-IN')}</Text>
                    <Text style={styles.dateItem}>Bid Opening: {new Date(tender.openingDate).toLocaleDateString('en-IN')}</Text>
                    <Text style={styles.dateItem}>Award Date: {new Date(tender.completionDate!).toLocaleDateString('en-IN')}</Text>
                  </View>
                </View>
              )}

              <View style={styles.tenderActions}>
                <TouchableOpacity style={styles.viewButton}>
                  <Eye size={16} color="#1e40af" />
                  <Text style={styles.viewButtonText}>View Contract</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.downloadButton}>
                  <Download size={16} color="#059669" />
                  <Text style={styles.downloadButtonText}>Download Report</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1f2937',
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  filterButton: {
    padding: 4,
  },
  filtersContainer: {
    marginTop: 16,
    gap: 16,
  },
  filterGroup: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activeFilterChip: {
    backgroundColor: '#1e40af',
    borderColor: '#1e40af',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeFilterChipText: {
    color: '#ffffff',
  },
  statsSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e40af',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6b7280',
    textAlign: 'center',
  },
  tendersSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  tenderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  completedTenderCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
  },
  tenderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tenderTitleSection: {
    flex: 1,
    marginRight: 12,
  },
  tenderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
    lineHeight: 22,
  },
  tenderNumber: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
  tenderBadges: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  departmentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  departmentText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  tenderDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  winnerSection: {
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  winnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  winnerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400e',
  },
  winnerDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  winnerInfo: {
    flex: 1,
  },
  winnerCompany: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  winnerAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#059669',
  },
  savingsInfo: {
    alignItems: 'flex-end',
  },
  savingsLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  savingsAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#dc2626',
  },
  tenderDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f59e0b',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginBottom: 16,
    gap: 4,
  },
  expandButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e40af',
  },
  expandedContent: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginBottom: 16,
    gap: 16,
  },
  expandedSection: {
    gap: 4,
  },
  expandedSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  expandedText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 18,
  },
  documentItem: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  dateItem: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  tenderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
  },
  downloadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  downloadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  settingsButton: {
    width: 48,
    height: 48,
    backgroundColor: '#f1f5f9',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginVertical: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1e40af',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  profileRole: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e40af',
  },
  editProfileButton: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
  },
  settingsCategory: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
    gap: 8,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
  },
  settingsGroup: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  lastSettingItem: {
    borderBottomWidth: 0,
  },
  settingContent: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  appInfoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  versionText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  copyrightText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
  },
});