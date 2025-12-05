// app/(tabs)/tasks.tsx
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Calendar,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Edit,
  Flag,
  Plus,
  Square,
  Trash2
} from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { supabase } from '../config';
import CreateTaskModal, { CreateTaskForm, Priority } from '../CreateTaskModal';

// ---------- Types ----------
type PriorityLocal = Priority;

interface TodoItem {
  id: string;              // uuid
  title: string;
  description?: string | null;
  completed: boolean;
  priority: PriorityLocal;
  dueDate?: string | null; // YYYY-MM-DD
  // assignedTo?: string | null;
  category: string;
  createdDate?: string | null;
  created_by?: string | null;
}

const priorities: PriorityLocal[] = ['Low', 'Medium', 'High', 'Urgent'];
const categories = ['Works', 'Law', 'Excise', 'Personal'];

// DB <-> UI mapping
function mapFromDB(row: any): TodoItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    completed: row.completed,
    priority: row.priority,
    dueDate: row.due_date,
    // assignedTo: row.assigned_to,
    category: row.category,
    createdDate: row.created_date,
    created_by: row.created_by,
  };
}

function mapToDB(payload: Partial<TodoItem>) {
  return {
    ...(payload.title !== undefined && { title: payload.title }),
    ...(payload.description !== undefined && { description: payload.description }),
    ...(payload.completed !== undefined && { completed: payload.completed }),
    ...(payload.priority !== undefined && { priority: payload.priority }),
    ...(payload.dueDate !== undefined && { due_date: payload.dueDate }),
    // ...(payload.assignedTo !== undefined && { assigned_to: payload.assignedTo }),
    ...(payload.category !== undefined && { category: payload.category }),
    ...(payload.createdDate !== undefined && { created_date: payload.createdDate }),
    ...(payload.created_by !== undefined && { created_by: payload.created_by }),
  };
}

// Helpers
const ymd = (d: Date) => d.toISOString().slice(0, 10);
const formatNice = (d: Date) =>
  d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
const formatFull = (d: Date) =>
  d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
const getPriorityColor = (p: PriorityLocal) =>
  ({ Low: '#6b7280', Medium: '#1e40af', High: '#f59e0b', Urgent: '#ef4444' }[p]);
const getCategoryColor = (c: string) =>
  ({ 'Works': '#1e40af', 'Law': '#7c3aed', 'Excise': '#059669', 'Personal': '#f59e0b' }[c] || '#6b7280');

const showToast = (type: 'success' | 'error' | 'info', text1: string, text2?: string, onPress?: () => void) =>
  Toast.show({ type, text1, text2, position: 'bottom', onPress });

// ===== Component =====
export default function TasksScreen() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);

  // filters / UI (search removed)
  const [selectedPriority, setSelectedPriority] = useState<'All' | PriorityLocal>('All');
  const [selectedCategory, setSelectedCategory] = useState<'All' | string>('All');
  const [showCompleted, setShowCompleted] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'completed' | 'urgent'>('all');

  // date (top)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const selectedYMD = ymd(selectedDate);
  const isToday = selectedDate.toDateString() === new Date().toDateString();

  // ONE reusable modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);

  // Keep last deleted for "Undo"
  const lastDeletedRef = useRef<TodoItem | null>(null);

  // ---------- Fetch by due_date ----------
  const loadByDate = useCallback(async (ymdStr: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('due_date', ymdStr)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTodos((data ?? []).map(mapFromDB));
    } catch (e: any) {
      showToast('error', 'Failed to load tasks', e?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadByDate(selectedYMD); }, [selectedYMD, loadByDate]);

  // Refresh
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadByDate(selectedYMD);
    setRefreshing(false);
  }, [loadByDate, selectedYMD]);

  // ---------- Realtime for the selected due_date ----------
  useEffect(() => {
    const channel = supabase
      .channel(`tasks:due:${selectedYMD}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `due_date=eq.${selectedYMD}` },
        (payload) => {
          setTodos((curr) => {
            if (payload.eventType === 'INSERT') {
              const row = mapFromDB(payload.new);
              if (curr.some((t) => t.id === row.id)) return curr;
              return [row, ...curr];
            }
            if (payload.eventType === 'UPDATE') {
              const row = mapFromDB(payload.new);
              return curr.map((t) => (t.id === row.id ? row : t));
            }
            if (payload.eventType === 'DELETE') {
              const row = mapFromDB(payload.old);
              return curr.filter((t) => t.id !== row.id);
            }
            return curr;
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedYMD]);

  // ---------- CRUD ----------
  const toggleTodo = async (id: string) => {
    const t = todos.find((x) => x.id === id);
    if (!t) return;
    setTodos((prev) => prev.map((x) => (x.id === id ? { ...x, completed: !x.completed } : x))); // optimistic
    const { error } = await supabase.from('tasks').update({ completed: !t.completed }).eq('id', id);
    if (error) {
      setTodos((prev) => prev.map((x) => (x.id === id ? { ...x, completed: t.completed } : x))); // rollback
      showToast('error', 'Could not update task', error.message);
    } else {
      showToast('success', t.completed ? 'Marked as Pending' : 'Marked as Completed');
    }
  };

  // Delete with Undo via toast (no Alert)
  const deleteTodo = async (id: string) => {
    const snapshot = todos.slice();
    const item = snapshot.find(t => t.id === id) || null;
    lastDeletedRef.current = item;

    // optimistic remove
    setTodos((prev) => prev.filter((t) => t.id !== id));

    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) {
      setTodos(snapshot);
      showToast('error', 'Delete failed', error.message);
      return;
    }

    // Offer Undo (re-insert if tapped)
    showToast('info', 'Task deleted', 'Tap to undo', async () => {
      if (!lastDeletedRef.current) return;
      const payload = mapToDB({
        ...lastDeletedRef.current,
        dueDate: lastDeletedRef.current.dueDate ?? selectedYMD,
      });
      const { error: insErr, data } = await supabase.from('tasks').insert(payload).select('*').single();
      if (insErr) {
        showToast('error', 'Undo failed', insErr.message);
      } else {
        setTodos((prev) => [mapFromDB(data), ...prev]);
        showToast('success', 'Restored');
      }
      lastDeletedRef.current = null;
    });
  };

  // OPEN create
  const openCreate = () => {
    setModalMode('create');
    setEditingTodo(null);
    setModalVisible(true);
  };

  // OPEN edit
  const openEdit = (todo: TodoItem) => {
    setModalMode('edit');
    setEditingTodo(todo);
    setModalVisible(true);
  };

  // Modal submit (create or edit)
  const handleModalSubmit = async (form: CreateTaskForm) => {
    try {
      if (modalMode === 'create') {
        const payload = mapToDB({
          title: form.title,
          description: form.description ?? null,
          priority: form.priority,
          dueDate: form.dueDate ?? selectedYMD,
          // assignedTo: form.assignedTo ?? null,
          category: form.category,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        });

        // optimistic
        const tempId = `temp-${Date.now()}`;
        setTodos((prev) => [
          {
            id: tempId,
            title: form.title,
            description: form.description ?? null,
            completed: false,
            priority: form.priority,
            dueDate: form.dueDate ?? selectedYMD,
            // assignedTo: form.assignedTo ?? null,
            category: form.category,
            created_by: payload.created_by,
          },
          ...prev,
        ]);

        const { error } = await supabase.from('tasks').insert(payload);
        if (error) {
          setTodos((prev) => prev.filter((t) => t.id !== tempId));
          showToast('error', 'Could not create task', error.message);
          return;
        }
        showToast('success', 'Task created');
      } else if (modalMode === 'edit' && editingTodo) {
        const patch = mapToDB({
          title: form.title,
          description: form.description ?? null,
          priority: form.priority,
          dueDate: form.dueDate ?? null,
          // assignedTo: form.assignedTo ?? null,
          category: form.category,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        });

        // optimistic
        const snapshot = todos;
        setTodos((prev) =>
          prev.map((t) =>
            t.id === editingTodo.id
              ? {
                ...t,
                title: form.title,
                description: form.description ?? null,
                priority: form.priority,
                dueDate: form.dueDate ?? null,
                // assignedTo: form.assignedTo ?? null,
                category: form.category,
                created_by: patch.created_by,
              }
              : t
          )
        );

        const { error } = await supabase.from('tasks').update(patch).eq('id', editingTodo.id);
        if (error) {
          setTodos(snapshot);
          showToast('error', 'Could not save changes', error.message);
          return;
        }
        showToast('success', 'Task updated');
      }

      await loadByDate(selectedYMD);
      setModalVisible(false);
      setEditingTodo(null);
    } catch (e: any) {
      showToast('error', 'Error', e?.message ?? 'Failed to save task');
    }
  };

  // Date nav
  const navigateDate = (direction: 'prev' | 'next') => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + (direction === 'prev' ? -1 : 1));
    setSelectedDate(d);
  };
  const resetToToday = () => setSelectedDate(new Date());

  // Header date picker
  const [showHeaderPicker, setShowHeaderPickerState] = useState(false);
  const onHeaderDatePicked = (e: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowHeaderPickerState(false);
      if (e.type === 'set' && date) setSelectedDate(date);
    } else {
      if (date) setSelectedDate(date);
    }
  };

  // ---------- Filters for current day list (search removed) ----------
  const filteredTodos = useMemo(() => {
    const list = todos.filter((todo) => {
      const matchesPriority = selectedPriority === 'All' || todo.priority === selectedPriority;
      const matchesCategory = selectedCategory === 'All' || todo.category === selectedCategory;
      const matchesCompleted = showCompleted || !todo.completed;

      let matchesActive = true;
      switch (activeFilter) {
        case 'pending': matchesActive = !todo.completed; break;
        case 'completed': matchesActive = todo.completed; break;
        case 'urgent': matchesActive = (todo.priority === 'Urgent' && !todo.completed); break;
        default: matchesActive = true;
      }
      return matchesPriority && matchesCategory && matchesCompleted && matchesActive;
    });
    return list;
  }, [todos, selectedPriority, selectedCategory, showCompleted, activeFilter]);

  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter((t) => t.completed).length;
    const pending = total - completed;
    const urgent = todos.filter((t) => t.priority === 'Urgent' && !t.completed).length;
    return { total, completed, pending, urgent };
  }, [todos]);

  // ---------- UI ----------
  return (
    <SafeAreaView style={styles.container}>
      {/* Gradient Header */}
      <LinearGradient
        colors={['#eef2ff', '#ffffff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerWrap}
      >
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Tasks</Text>
          <TouchableOpacity style={styles.addButton} onPress={openCreate}>
            <Plus size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Date Navigation */}
        <View style={styles.dateSection}>
          <View style={styles.dateNavigation}>
            <TouchableOpacity onPress={() => navigateDate('prev')} style={styles.dateNavButton}>
              <ChevronLeft size={20} color="#1e40af" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.dateDisplay} onPress={() => setShowHeaderPickerState(true)}>
              <Calendar size={16} color="#1e40af" />
              <Text style={styles.dateText}>
                {isToday ? 'Today' : formatNice(selectedDate)}
              </Text>
              <Text style={styles.fullDateText}>{formatFull(selectedDate)}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigateDate('next')} style={styles.dateNavButton}>
              <ChevronRight size={20} color="#1e40af" />
            </TouchableOpacity>
          </View>

          {showHeaderPicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={onHeaderDatePicked}
              maximumDate={new Date(2100, 11, 31)}
              minimumDate={new Date(2000, 0, 1)}
              style={{ alignSelf: 'center' }}
            />
          )}

          <View style={styles.dateInfo}>
            <Text style={styles.dateInfoText}>
              {loading ? 'Loading…' : `${filteredTodos.length} task${filteredTodos.length !== 1 ? 's' : ''} for this date`}
            </Text>
            {!isToday && (
              <TouchableOpacity onPress={resetToToday} style={styles.todayButton}>
                <Text style={styles.todayButtonText}>Go to Today</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Quick filter chips only (search removed) */}
          <View style={styles.filtersRow}>
            <TouchableOpacity
              onPress={() => setActiveFilter('all')}
              style={[styles.chip, activeFilter === 'all' && styles.chipActiveSlate]}
            >
              <Text style={[styles.chipTxt, activeFilter === 'all' && styles.chipTxtActive]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveFilter('pending')}
              style={[styles.chip, activeFilter === 'pending' && styles.chipActiveAmber]}
            >
              <Text style={[styles.chipTxt, activeFilter === 'pending' && styles.chipTxtActive]}>Pending</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setActiveFilter('completed'); setShowCompleted(true); }}
              style={[styles.chip, activeFilter === 'completed' && styles.chipActiveBlue]}
            >
              <Text style={[styles.chipTxt, activeFilter === 'completed' && styles.chipTxtActive]}>Done</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveFilter('urgent')}
              style={[styles.chip, activeFilter === 'urgent' && styles.chipActiveRed]}
            >
              <Text style={[styles.chipTxt, activeFilter === 'urgent' && styles.chipTxtActive]}>Urgent</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1e40af"
            colors={['#1e40af']}
            progressViewOffset={8}
          />
        }
        contentContainerStyle={{ paddingBottom: 28 }}
      >
        {/* Stats (glassy) */}
        <View style={styles.statsSection}>
          <View style={styles.statsContainer}>
            <StatCard label="Total" value={String(stats.total)} />
            <StatCard label="Pending" value={String(stats.pending)} emphasis="amber" />
            <StatCard label="Completed" value={String(stats.completed)} emphasis="green" />
            <StatCard label="Urgent" value={String(stats.urgent)} emphasis="red" />
          </View>
        </View>

        {/* List */}
        <View style={styles.todosList}>
          {loading ? (
            <Text style={{ textAlign: 'center', color: '#6b7280', paddingVertical: 24 }}>Loading…</Text>
          ) : filteredTodos.length ? (
            filteredTodos.map((todo) => (
              <View key={todo.id} style={[styles.todoCard, todo.completed && styles.completedTodoCard]}>
                <View style={styles.todoHeader}>
                  <TouchableOpacity style={styles.checkboxContainer} onPress={() => toggleTodo(todo.id)}>
                    {todo.completed ? <CheckSquare size={24} color="#059669" /> : <Square size={24} color="#6b7280" />}
                  </TouchableOpacity>

                  <View style={styles.todoContent}>
                    <Text style={[styles.todoTitle, todo.completed && styles.completedTodoTitle]}>
                      {todo.title}
                    </Text>
                    {!!todo.description && (
                      <Text style={styles.todoDescription}>{todo.description}</Text>
                    )}
                  </View>

                  <View style={styles.todoActions}>
                    <TouchableOpacity style={styles.editButton} onPress={() => openEdit(todo)}>
                      <Edit size={16} color="#1e40af" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteButton} onPress={() => deleteTodo(todo.id)}>
                      <Trash2 size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.todoMeta}>
                  <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(todo.priority) }]}>
                    <Flag size={12} color="#ffffff" />
                    <Text style={styles.priorityText}>{todo.priority}</Text>
                  </View>

                  <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(todo.category) }]}>
                    <Text style={styles.categoryText}>{todo.category}</Text>
                  </View>

                  {todo.dueDate && (
                    <View style={styles.dueDateBadge}>
                      <Calendar size={12} color="#6b7280" />
                      <Text style={styles.dueDateText}>
                        {new Date(todo.dueDate).toLocaleDateString()}
                      </Text>
                    </View>
                  )}

                  {/* {todo.assignedTo && (
                    <View style={styles.assignedBadge}>
                      <User size={12} color="#6b7280" />
                      <Text style={styles.assignedText}>{todo.assignedTo}</Text>
                    </View>
                  )} */}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.noTodos}>
              <Text style={styles.noTodosText}>No tasks found</Text>
              <Text style={styles.noTodosSubtext}>Create your first task or adjust your filters</Text>
              <TouchableOpacity style={styles.createFirstButton} onPress={openCreate}>
                <Plus size={16} color="#1e40af" />
                <Text style={styles.createFirstButtonText}>Create Task</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ONE modal for Create & Edit */}
      <CreateTaskModal
        visible={modalVisible}
        mode={modalMode}
        onClose={() => { setModalVisible(false); setEditingTodo(null); }}
        onSubmit={handleModalSubmit}
        defaultDueDate={selectedYMD}
        categories={categories}
        priorities={priorities}
        initialValues={
          modalMode === 'edit' && editingTodo
            ? {
              title: editingTodo.title,
              description: editingTodo.description ?? '',
              priority: editingTodo.priority,
              dueDate: editingTodo.dueDate ?? selectedYMD,
              // assignedTo: editingTodo.assignedTo ?? '',
              category: editingTodo.category,
            }
            : undefined
        }
      />

      {/* Toast portal */}
      <Toast />
    </SafeAreaView>
  );
}

/* ---------- Small UI bits ---------- */
const StatCard = ({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: 'amber' | 'green' | 'red';
}) => {
  const ring =
    emphasis === 'amber' ? '#f59e0b33' :
      emphasis === 'green' ? '#10b98133' :
        emphasis === 'red' ? '#ef444433' :
          '#1e40af22';

  return (
    <LinearGradient
      colors={['#ffffff', '#f8fafc']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.statCard]}
    >
      <View style={[styles.statPill, { backgroundColor: ring }]} />
      <Text style={styles.statNumber}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </LinearGradient>
  );
};

// -------------------- Styles --------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  /* Header + Gradient */
  headerWrap: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, borderBottomColor: '#e2e8f0', borderBottomWidth: 0.4, },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#0f172a' },
  addButton: {
    width: 46, height: 46, backgroundColor: '#1e40af', borderRadius: 23,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#1e40af', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 8,
  },

  dateSection: {
    // backgroundColor: '#ffffff',
    // borderBottomWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 16, padding: 12,
  },
  dateNavigation: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  dateNavButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  dateDisplay: {
    alignItems: 'center', backgroundColor: '#f8fafc', paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', gap: 8,
  },
  dateText: { fontSize: 18, fontWeight: '800', color: '#1e40af' },
  fullDateText: { fontSize: 12, color: '#64748b', marginLeft: 8 },
  dateInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  dateInfoText: { fontSize: 13, color: '#64748b' },
  todayButton: { backgroundColor: '#dbeafe', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  todayButtonText: { fontSize: 12, fontWeight: '800', color: '#1e40af' },

  /* Chips row (search removed) */
  filtersRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0'
  },
  chipTxt: { fontSize: 12, fontWeight: '800', color: '#0f172a' },
  chipTxtActive: { color: '#fff' },
  chipActiveSlate: { backgroundColor: '#334155', borderColor: '#334155' },
  chipActiveAmber: { backgroundColor: '#b45309', borderColor: '#b45309' },
  chipActiveBlue: { backgroundColor: '#1e3a8a', borderColor: '#1e3a8a' },
  chipActiveRed: { backgroundColor: '#b91c1c', borderColor: '#b91c1c' },

  /* Stats */
  statsSection: { paddingHorizontal: 16, paddingTop: 8 },
  statsContainer: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    alignItems: 'center',
  },
  statPill: { width: '100%', height: 6, borderRadius: 999, marginBottom: 8 },
  statNumber: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  statLabel: { fontSize: 11, fontWeight: '800', color: '#64748b' },

  /* List */
  todosList: { paddingHorizontal: 16, paddingBottom: 20, marginTop: 10 },
  todoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 12,
  },
  completedTodoCard: { opacity: 0.72 },
  todoHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  checkboxContainer: { marginRight: 12, marginTop: 2 },
  todoContent: { flex: 1, marginRight: 12 },
  todoTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  completedTodoTitle: { textDecorationLine: 'line-through', color: '#6b7280' },
  todoDescription: { fontSize: 14, color: '#475569', lineHeight: 20 },
  todoActions: { flexDirection: 'row', gap: 8 },
  editButton: { padding: 8 },
  deleteButton: { padding: 8 },

  todoMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  priorityBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  priorityText: { fontSize: 12, fontWeight: '800', color: '#ffffff' },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  categoryText: { fontSize: 12, fontWeight: '800', color: '#ffffff' },
  dueDateBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: '#f3f4f6', gap: 4 },
  dueDateText: { fontSize: 12, fontWeight: '800', color: '#64748b' },
  assignedBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: '#f3f4f6', gap: 4 },
  assignedText: { fontSize: 12, fontWeight: '800', color: '#64748b' },

  noTodos: { alignItems: 'center', paddingVertical: 48 },
  noTodosText: { fontSize: 18, fontWeight: '900', color: '#0f172a', marginBottom: 8 },
  noTodosSubtext: { fontSize: 14, color: '#9ca3af', textAlign: 'center', marginBottom: 24 },
  createFirstButton: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 10, backgroundColor: '#e0ecff', gap: 8, borderWidth: 1, borderColor: '#c7d2fe'
  },
  createFirstButtonText: { fontSize: 14, fontWeight: '900', color: '#1e3a8a' },
});