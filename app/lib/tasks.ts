import { supabase } from '../config';

export type TaskInsert = {
    title: string;
    description?: string;
    completed?: boolean;
    priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
    due_date?: string | null;     // 'YYYY-MM-DD'
    assigned_to?: string | null;
    category: string;
    created_date?: string | null; // 'YYYY-MM-DD'
    created_by?: string | null;
};

export type TaskRow = TaskInsert & {
    id: string;
    created_by: string | null;
    created_at: string;
    updated_at: string;
};

export async function listTasks() {
    return await supabase
        .from('tasks')
        .select('*')
        .order('created_date', { ascending: false })
        .order('created_at', { ascending: false });
}

export async function createTask(payload: TaskInsert) {

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) {
        console.error('createTask auth error', authError);
    }

    const authUserId = authData?.user?.id ?? null;

    return await supabase
        .from('tasks')
        .insert({
            title: payload.title,
            description: payload.description ?? null,
            completed: payload.completed ?? false,
            priority: payload.priority ?? 'Medium',
            due_date: payload.due_date ?? null,
            assigned_to: payload.assigned_to ?? null,
            category: payload.category,
            created_date: payload.created_date ?? null,
            created_by: payload.created_by ?? authUserId,
        })
        .select()
        .single();
}

export async function updateTask(id: string, patch: Partial<TaskInsert> & { completed?: boolean }) {
    return await supabase
        .from('tasks')
        .update({
            ...(patch.title !== undefined && { title: patch.title }),
            ...(patch.description !== undefined && { description: patch.description }),
            ...(patch.completed !== undefined && { completed: patch.completed }),
            ...(patch.priority !== undefined && { priority: patch.priority }),
            ...(patch.due_date !== undefined && { due_date: patch.due_date }),
            ...(patch.assigned_to !== undefined && { assigned_to: patch.assigned_to }),
            ...(patch.category !== undefined && { category: patch.category }),
            ...(patch.created_date !== undefined && { created_date: patch.created_date }),
        })
        .eq('id', id)
        .select()
        .single();
}

export async function deleteTask(id: string) {
    return await supabase.from('tasks').delete().eq('id', id);
}

export async function toggleTask(id: string, to: boolean) {
    return await supabase.from('tasks').update({ completed: to }).eq('id', id);
}