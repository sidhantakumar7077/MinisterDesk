// components/CreateTaskModal.tsx
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Calendar, X } from 'lucide-react-native';
import React from 'react';
import {
    Alert,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView, StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type CreateTaskForm = {
    title: string;
    description?: string | null;
    priority: Priority;
    dueDate?: string | null;     // YYYY-MM-DD
    // assignedTo?: string | null;
    category: string;
};

type Mode = 'create' | 'edit';

type Props = {
    visible: boolean;
    mode: Mode;
    onClose: () => void;
    onSubmit: (form: CreateTaskForm) => void | Promise<void>;
    initialValues?: Partial<CreateTaskForm>;     // for edit
    categories?: string[];
    priorities?: Priority[];
    defaultDueDate?: string;                     // YYYY-MM-DD (used when creating)
};

const defaultCategories = ['Works', 'Law', 'Excise', 'Personal'];
const defaultPriorities: Priority[] = ['Low', 'Medium', 'High', 'Urgent'];

const ymd = (d: Date) => d.toISOString().slice(0, 10);

export default function CreateTaskModal({
    visible,
    mode,
    onClose,
    onSubmit,
    initialValues,
    categories = defaultCategories,
    priorities = defaultPriorities,
    defaultDueDate,
}: Props) {
    const isEdit = mode === 'edit';

    const [form, setForm] = React.useState<CreateTaskForm>({
        title: '',
        description: '',
        priority: 'Medium',
        dueDate: defaultDueDate ?? ymd(new Date()),
        // assignedTo: '',
        category: 'Works',
    });

    const [showDuePicker, setShowDuePicker] = React.useState(false);

    // Initialize/reset when modal opens or when mode/initialValues change
    React.useEffect(() => {
        if (!visible) return;
        setForm({
            title: initialValues?.title ?? '',
            description: initialValues?.description ?? '',
            priority: (initialValues?.priority as Priority) ?? 'Medium',
            dueDate: initialValues?.dueDate ?? defaultDueDate ?? ymd(new Date()),
            // assignedTo: initialValues?.assignedTo ?? '',
            category: initialValues?.category ?? 'Works',
        });
        setShowDuePicker(false);
    }, [visible, mode, initialValues, defaultDueDate]);

    const onDuePicked = (e: DateTimePickerEvent, date?: Date) => {
        if (Platform.OS === 'android') {
            setShowDuePicker(false);
            if (e.type === 'set' && date) {
                setForm((p) => ({ ...p, dueDate: ymd(date) }));
            }
        } else {
            if (date) setForm((p) => ({ ...p, dueDate: ymd(date) }));
        }
    };

    const handleSubmit = () => {
        if (!form.title.trim()) {
            Alert.alert('Validation', 'Please enter a task title.');
            return;
        }
        onSubmit({
            title: form.title.trim(),
            description: form.description?.trim() || null,
            priority: form.priority,
            dueDate: form.dueDate || null,
            // assignedTo: form.assignedTo?.trim() || null,
            category: form.category,
        });
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <SafeAreaView style={styles.modalContainer}>
                {/* Header */}
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{isEdit ? 'Edit Task' : 'Create New Task'}</Text>
                    <TouchableOpacity onPress={onClose}>
                        <X size={24} color="#6b7280" />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
                    {/* Title */}
                    <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Title *</Text>
                        <TextInput
                            style={styles.formInput}
                            placeholder="Enter task title"
                            value={form.title}
                            onChangeText={(v) => setForm((p) => ({ ...p, title: v }))}
                        />
                    </View>

                    {/* Description */}
                    <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Description</Text>
                        <TextInput
                            style={[styles.formInput, styles.textArea]}
                            placeholder="Enter task description"
                            value={form.description ?? ''}
                            onChangeText={(v) => setForm((p) => ({ ...p, description: v }))}
                            multiline
                        />
                    </View>

                    {/* Priority */}
                    <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Priority</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                            {priorities.map((p) => {
                                const active = form.priority === p;
                                return (
                                    <TouchableOpacity
                                        key={p}
                                        style={[styles.pill, active && styles.pillActive]}
                                        onPress={() => setForm((s) => ({ ...s, priority: p }))}
                                    >
                                        <Text style={[styles.pillText, active && styles.pillTextActive]}>{p}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>

                    {/* Category */}
                    <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Category</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                            {categories.map((c) => {
                                const active = form.category === c;
                                return (
                                    <TouchableOpacity
                                        key={c}
                                        style={[styles.pill, active && styles.pillActiveAlt]}
                                        onPress={() => setForm((s) => ({ ...s, category: c }))}
                                    >
                                        <Text style={[styles.pillText, active && styles.pillTextActiveAlt]}>{c}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>

                    {/* Due Date */}
                    <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Due Date</Text>
                        <TouchableOpacity
                            style={[styles.formInput, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                            onPress={() => setShowDuePicker(true)}
                        >
                            <Text style={{ fontSize: 16, color: '#1f2937' }}>
                                {form.dueDate || ymd(new Date())}
                            </Text>
                            <Calendar size={18} color="#1e40af" />
                        </TouchableOpacity>

                        {showDuePicker && (
                            <DateTimePicker
                                value={form.dueDate ? new Date(form.dueDate) : new Date()}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                                onChange={onDuePicked}
                                maximumDate={new Date(2100, 11, 31)}
                                minimumDate={new Date(2000, 0, 1)}
                            />
                        )}
                    </View>

                    {/* Assigned To */}
                    {/* <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Assigned To</Text>
                        <TextInput
                            style={styles.formInput}
                            placeholder="Enter person’s name"
                            value={form.assignedTo ?? ''}
                            onChangeText={(v) => setForm((p) => ({ ...p, assignedTo: v }))}
                        />
                    </View> */}
                </ScrollView>

                {/* Footer */}
                <View style={styles.modalFooter}>
                    <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                        <Text style={styles.submitButtonText}>{isEdit ? 'Update Task' : 'Create Task'}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalContainer: { flex: 1, backgroundColor: '#ffffff' },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
    },
    modalTitle: { fontSize: 20, fontWeight: '700', color: '#1f2937' },
    modalContent: { flex: 1, paddingHorizontal: 20, paddingVertical: 16 },

    formGroup: { marginBottom: 20 },
    formLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
    formInput: {
        borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12,
        paddingVertical: 12, backgroundColor: '#ffffff', fontSize: 16, color: '#1f2937',
    },
    textArea: { height: 100, textAlignVertical: 'top' },

    pill: {
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8,
        backgroundColor: '#ffffff', borderColor: '#d1d5db',
    },
    pillActive: { backgroundColor: '#1e40af', borderColor: '#1e40af' },
    pillText: { fontSize: 14, fontWeight: '600', color: '#374151' },
    pillTextActive: { color: '#ffffff' },

    pillActiveAlt: { backgroundColor: '#dbeafe', borderColor: '#93c5fd' },
    pillTextActiveAlt: { color: '#1e40af' },

    modalFooter: {
        flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 16,
        borderTopWidth: 1, borderTopColor: '#e2e8f0', gap: 12,
    },
    cancelButton: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: '#f3f4f6', alignItems: 'center' },
    cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#6b7280' },
    submitButton: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: '#1e40af', alignItems: 'center' },
    submitButtonText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
});