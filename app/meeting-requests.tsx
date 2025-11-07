import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { ArrowLeft, Search, Filter, Clock, User, Building, Calendar, MapPin, Users, FileText, Phone, Mail, Check, X, Pause, ChevronDown, ChevronUp } from 'lucide-react-native';
import { router } from 'expo-router';

const meetingRequests = [
  {
    id: '1',
    requesterName: 'Surendra Kumar Patel',
    designation: 'Chief Engineer',
    organization: 'Odisha Works Department',
    contactNumber: '+91 98765 43210',
    email: 'surendra.patel@odisha.gov.in',
    meetingTitle: 'Infrastructure Project Budget Discussion',
    purpose: 'Discuss budget allocation for upcoming highway projects in Odisha',
    preferredDates: [
      { date: '2024-12-20', time: '10:00 AM' },
      { date: '2024-12-21', time: '2:00 PM' },
      { date: '2024-12-22', time: '11:00 AM' }
    ],
    estimatedDuration: '1.5 hours',
    attendeesCount: '5',
    priority: 'High',
    status: 'pending',
    submittedDate: '2024-12-15',
    backgroundInfo: 'Need urgent approval for highway construction projects worth ₹500 crores',
    expectedOutcome: 'Budget approval and timeline confirmation',
    category: 'Works Department',
  },
  {
    id: '2',
    requesterName: 'Priyanka Mohanty',
    designation: 'Legal Advisor',
    organization: 'Odisha Law Department',
    contactNumber: '+91 98765 43211',
    email: 'priyanka.mohanty@odisha.gov.in',
    meetingTitle: 'Legal Compliance Review',
    purpose: 'Review legal compliance for new government policies',
    preferredDates: [
      { date: '2024-12-18', time: '3:00 PM' },
      { date: '2024-12-19', time: '10:00 AM' },
      { date: '2024-12-20', time: '4:00 PM' }
    ],
    estimatedDuration: '45 minutes',
    attendeesCount: '3',
    priority: 'Medium',
    status: 'pending',
    submittedDate: '2024-12-14',
    backgroundInfo: 'New policies require legal review before implementation',
    expectedOutcome: 'Legal clearance and compliance confirmation',
    category: 'Law Department',
  },
  {
    id: '3',
    requesterName: 'Dr. Rajesh Kumar Sahoo',
    designation: 'Additional Secretary',
    organization: 'Odisha Works Department',
    contactNumber: '+91 98765 43212',
    email: 'rajesh.sahoo@odisha.gov.in',
    meetingTitle: 'Emergency Road Repair Authorization',
    purpose: 'Urgent authorization needed for emergency road repairs after recent floods',
    preferredDates: [
      { date: '2024-12-16', time: '9:00 AM' },
      { date: '2024-12-16', time: '11:00 AM' },
      { date: '2024-12-16', time: '2:00 PM' }
    ],
    estimatedDuration: '30 minutes',
    attendeesCount: '4',
    priority: 'Urgent',
    status: 'on-hold',
    submittedDate: '2024-12-15',
    backgroundInfo: 'Recent floods damaged major roads in 3 districts, immediate repair needed',
    expectedOutcome: 'Emergency fund approval and repair authorization',
    category: 'Works Department',
  },
  {
    id: '4',
    requesterName: 'Anita Jena',
    designation: 'Joint Secretary',
    organization: 'Odisha Law Department',
    contactNumber: '+91 98765 43213',
    email: 'anita.jena@odisha.gov.in',
    meetingTitle: 'Inter-departmental Legal Coordination',
    purpose: 'Coordinate legal matters between Works and Law departments',
    preferredDates: [
      { date: '2024-12-25', time: '11:00 AM' },
      { date: '2024-12-26', time: '10:00 AM' },
      { date: '2024-12-27', time: '3:00 PM' }
    ],
    estimatedDuration: '2 hours',
    attendeesCount: '8',
    priority: 'Medium',
    status: 'approved',
    submittedDate: '2024-12-13',
    backgroundInfo: 'Need to establish better coordination protocols between departments',
    expectedOutcome: 'Framework for inter-departmental collaboration',
    category: 'Joint Meeting',
    approvedDate: '2024-12-14',
    scheduledDate: '2024-12-25',
    scheduledTime: '11:00 AM',
  },
];

const statusFilters = ['All', 'Pending', 'Approved', 'On Hold', 'Rejected'];
const priorityFilters = ['All', 'Low', 'Medium', 'High', 'Urgent'];

export default function MeetingRequestsScreen() {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [actionNotes, setActionNotes] = useState('');

  const filteredRequests = meetingRequests.filter(request => {
    const matchesSearch = request.requesterName.toLowerCase().includes(searchText.toLowerCase()) ||
                         request.meetingTitle.toLowerCase().includes(searchText.toLowerCase()) ||
                         request.organization.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = statusFilter === 'All' || request.status === statusFilter.toLowerCase().replace(' ', '-');
    const matchesPriority = priorityFilter === 'All' || request.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleAction = (request: any, action: 'approve' | 'reject' | 'hold') => {
    setSelectedRequest(request);
    setShowActionModal(true);
  };

  const confirmAction = (action: 'approve' | 'reject' | 'hold') => {
    const actionText = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'put on hold';
    
    Alert.alert(
      'Action Confirmed',
      `Meeting request from ${selectedRequest?.requesterName} has been ${actionText}.${action === 'approve' ? ' Calendar invitation will be sent.' : ''}`,
      [
        {
          text: 'OK',
          onPress: () => {
            setShowActionModal(false);
            setActionNotes('');
            setSelectedRequest(null);
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#f59e0b',
      approved: '#059669',
      rejected: '#dc2626',
      'on-hold': '#6b7280',
    };
    return colors[status] || '#6b7280';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      Low: '#6b7280',
      Medium: '#1e40af',
      High: '#f59e0b',
      Urgent: '#dc2626',
    };
    return colors[priority] || '#6b7280';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#1e40af" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Meeting Requests</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Search and Filters */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Search size={20} color="#6b7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search requests..."
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
              {/* Status Filter */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Status</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                  {statusFilters.map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.filterChip,
                        statusFilter === status && styles.activeFilterChip
                      ]}
                      onPress={() => setStatusFilter(status)}
                    >
                      <Text style={[
                        styles.filterChipText,
                        statusFilter === status && styles.activeFilterChipText
                      ]}>
                        {status}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Priority Filter */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Priority</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                  {priorityFilters.map((priority) => (
                    <TouchableOpacity
                      key={priority}
                      style={[
                        styles.filterChip,
                        priorityFilter === priority && styles.activeFilterChip
                      ]}
                      onPress={() => setPriorityFilter(priority)}
                    >
                      <Text style={[
                        styles.filterChipText,
                        priorityFilter === priority && styles.activeFilterChipText
                      ]}>
                        {priority}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{meetingRequests.filter(r => r.status === 'pending').length}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{meetingRequests.filter(r => r.status === 'approved').length}</Text>
              <Text style={styles.statLabel}>Approved</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{meetingRequests.filter(r => r.status === 'on-hold').length}</Text>
              <Text style={styles.statLabel}>On Hold</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{meetingRequests.filter(r => r.priority === 'Urgent').length}</Text>
              <Text style={styles.statLabel}>Urgent</Text>
            </View>
          </View>
        </View>

        {/* Requests List */}
        <View style={styles.requestsList}>
          {filteredRequests.length > 0 ? (
            filteredRequests.map((request) => (
              <View key={request.id} style={[
                styles.requestCard,
                request.priority === 'Urgent' && styles.urgentCard
              ]}>
                {/* Request Header */}
                <View style={styles.requestHeader}>
                  <View style={styles.requesterInfo}>
                    <View style={styles.avatarContainer}>
                      <User size={20} color="#ffffff" />
                    </View>
                    <View style={styles.requesterDetails}>
                      <Text style={styles.requesterName}>{request.requesterName}</Text>
                      <Text style={styles.requesterRole}>{request.designation}</Text>
                      <Text style={styles.requesterOrg}>{request.organization}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.statusSection}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
                      <Text style={styles.statusText}>{request.status.replace('-', ' ').toUpperCase()}</Text>
                    </View>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(request.priority) }]}>
                      <Text style={styles.priorityText}>{request.priority}</Text>
                    </View>
                  </View>
                </View>

                {/* Meeting Title */}
                <Text style={styles.meetingTitle}>{request.meetingTitle}</Text>
                <Text style={styles.meetingPurpose}>{request.purpose}</Text>

                {/* Quick Details */}
                <View style={styles.quickDetails}>
                  <View style={styles.detailItem}>
                    <Calendar size={14} color="#6b7280" />
                    <Text style={styles.detailText}>
                      {new Date(request.preferredDates[0].date).toLocaleDateString()} at {request.preferredDates[0].time}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Clock size={14} color="#6b7280" />
                    <Text style={styles.detailText}>{request.estimatedDuration}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Users size={14} color="#6b7280" />
                    <Text style={styles.detailText}>{request.attendeesCount} attendees</Text>
                  </View>
                </View>

                {/* Expand/Collapse Button */}
                <TouchableOpacity 
                  style={styles.expandButton}
                  onPress={() => setExpandedRequest(expandedRequest === request.id ? null : request.id)}
                >
                  <Text style={styles.expandButtonText}>
                    {expandedRequest === request.id ? 'Show Less' : 'Show More Details'}
                  </Text>
                  {expandedRequest === request.id ? 
                    <ChevronUp size={16} color="#1e40af" /> : 
                    <ChevronDown size={16} color="#1e40af" />
                  }
                </TouchableOpacity>

                {/* Expanded Details */}
                {expandedRequest === request.id && (
                  <View style={styles.expandedDetails}>
                    <View style={styles.contactInfo}>
                      <Text style={styles.expandedSectionTitle}>Contact Information</Text>
                      <View style={styles.contactRow}>
                        <Phone size={16} color="#6b7280" />
                        <Text style={styles.contactText}>{request.contactNumber}</Text>
                      </View>
                      <View style={styles.contactRow}>
                        <Mail size={16} color="#6b7280" />
                        <Text style={styles.contactText}>{request.email}</Text>
                      </View>
                    </View>

                    <View style={styles.schedulingInfo}>
                      <Text style={styles.expandedSectionTitle}>Preferred Schedule Options</Text>
                      {request.preferredDates.map((dateOption, index) => (
                        <View key={index} style={styles.dateOption}>
                          <Text style={styles.dateOptionLabel}>Option {index + 1}:</Text>
                          <Text style={styles.dateOptionText}>
                            {new Date(dateOption.date).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              month: 'long', 
                              day: 'numeric' 
                            })} at {dateOption.time}
                          </Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.additionalInfo}>
                      <Text style={styles.expandedSectionTitle}>Additional Information</Text>
                      <Text style={styles.infoText}>
                        <Text style={styles.infoLabel}>Background: </Text>
                        {request.backgroundInfo}
                      </Text>
                      <Text style={styles.infoText}>
                        <Text style={styles.infoLabel}>Expected Outcome: </Text>
                        {request.expectedOutcome}
                      </Text>
                      <Text style={styles.infoText}>
                        <Text style={styles.infoLabel}>Submitted: </Text>
                        {new Date(request.submittedDate).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Action Buttons */}
                {request.status === 'pending' && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      style={styles.rejectButton}
                      onPress={() => handleAction(request, 'reject')}
                    >
                      <X size={16} color="#ffffff" />
                      <Text style={styles.rejectButtonText}>Reject</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.holdButton}
                      onPress={() => handleAction(request, 'hold')}
                    >
                      <Pause size={16} color="#f59e0b" />
                      <Text style={styles.holdButtonText}>Hold</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.approveButton}
                      onPress={() => handleAction(request, 'approve')}
                    >
                      <Check size={16} color="#ffffff" />
                      <Text style={styles.approveButtonText}>Approve</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {request.status === 'on-hold' && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      style={styles.rejectButton}
                      onPress={() => handleAction(request, 'reject')}
                    >
                      <X size={16} color="#ffffff" />
                      <Text style={styles.rejectButtonText}>Reject</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.approveButton}
                      onPress={() => handleAction(request, 'approve')}
                    >
                      <Check size={16} color="#ffffff" />
                      <Text style={styles.approveButtonText}>Approve</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {request.status === 'approved' && (
                  <View style={styles.approvedInfo}>
                    <Text style={styles.approvedText}>
                      ✓ Approved on {new Date(request.approvedDate!).toLocaleDateString()}
                    </Text>
                    <Text style={styles.scheduledText}>
                      Scheduled: {new Date(request.scheduledDate!).toLocaleDateString()} at {request.scheduledTime}
                    </Text>
                  </View>
                )}
              </View>
            ))
          ) : (
            <View style={styles.noResults}>
              <Text style={styles.noResultsText}>No meeting requests found</Text>
              <Text style={styles.noResultsSubtext}>
                Try adjusting your search or filter criteria
              </Text>
            </View>
          )}
        </View>

        {/* Action Modal */}
        <Modal
          visible={showActionModal}
          transparent
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Review Meeting Request</Text>
              
              {selectedRequest && (
                <View style={styles.modalRequestInfo}>
                  <Text style={styles.modalRequestTitle}>{selectedRequest.meetingTitle}</Text>
                  <Text style={styles.modalRequesterName}>Requested by: {selectedRequest.requesterName}</Text>
                </View>
              )}

              <View style={styles.modalNotesSection}>
                <Text style={styles.modalNotesLabel}>Notes (Optional)</Text>
                <TextInput
                  style={styles.modalNotesInput}
                  multiline
                  placeholder="Add any notes or comments..."
                  value={actionNotes}
                  onChangeText={setActionNotes}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.modalCancelButton}
                  onPress={() => setShowActionModal(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                
                <View style={styles.modalActionButtons}>
                  <TouchableOpacity 
                    style={styles.modalRejectButton}
                    onPress={() => confirmAction('reject')}
                  >
                    <X size={16} color="#ffffff" />
                    <Text style={styles.modalRejectText}>Reject</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.modalHoldButton}
                    onPress={() => confirmAction('hold')}
                  >
                    <Pause size={16} color="#f59e0b" />
                    <Text style={styles.modalHoldText}>Hold</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.modalApproveButton}
                    onPress={() => confirmAction('approve')}
                  >
                    <Check size={16} color="#ffffff" />
                    <Text style={styles.modalApproveText}>Approve</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  placeholder: {
    width: 40,
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
    fontSize: 20,
    fontWeight: '800',
    color: '#1e40af',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    textAlign: 'center',
  },
  requestsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
  },
  requestCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  urgentCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  requesterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e40af',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  requesterDetails: {
    flex: 1,
  },
  requesterName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 2,
  },
  requesterRole: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  requesterOrg: {
    fontSize: 12,
    color: '#9ca3af',
  },
  statusSection: {
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
    fontWeight: '600',
    color: '#ffffff',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  meetingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  meetingPurpose: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  quickDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  expandButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e40af',
  },
  expandedDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 16,
  },
  expandedSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  contactInfo: {
    gap: 4,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  contactText: {
    fontSize: 14,
    color: '#6b7280',
  },
  schedulingInfo: {
    gap: 4,
  },
  dateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  dateOptionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    minWidth: 60,
  },
  dateOptionText: {
    fontSize: 14,
    color: '#6b7280',
  },
  additionalInfo: {
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 18,
  },
  infoLabel: {
    fontWeight: '600',
    color: '#374151',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  holdButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#f59e0b',
    gap: 6,
  },
  holdButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f59e0b',
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  approveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  approvedInfo: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  approvedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 4,
  },
  scheduledText: {
    fontSize: 14,
    color: '#059669',
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    minHeight: 300,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalRequestInfo: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  modalRequestTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  modalRequesterName: {
    fontSize: 14,
    color: '#6b7280',
  },
  modalNotesSection: {
    marginBottom: 24,
  },
  modalNotesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  modalNotesInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1f2937',
    minHeight: 80,
  },
  modalActions: {
    gap: 16,
  },
  modalCancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#6b7280',
  },
  modalActionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  modalRejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  modalRejectText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalHoldButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#f59e0b',
    gap: 6,
  },
  modalHoldText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f59e0b',
  },
  modalApproveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  modalApproveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});