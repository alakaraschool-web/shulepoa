import { supabase } from './supabase';

export const api = {
  async getStore(key: string) {
    const { data, error } = await supabase
      .from('store')
      .select('value')
      .eq('key', key)
      .single();
      
    if (error || !data) return null;
    return data.value;
  },
  
  async setStore(key: string, value: any) {
    const { error } = await supabase
      .from('store')
      .upsert({ key, value });
      
    if (error) {
      console.error('Error setting store in Supabase:', error);
    }
  },
  
  async getMarks() {
    const { data, error } = await supabase
      .from('marks')
      .select('*');
      
    if (error || !data) return [];
    return data;
  },
  
  async upsertMarks(marks: any[]) {
    // Filter out deleted marks and delete them from Supabase
    const toDelete = marks.filter(m => m._delete).map(m => m.id);
    const toUpsert = marks.filter(m => !m._delete).map(m => ({
      id: m.id,
      examId: m.examId,
      studentId: m.studentId,
      subject: m.subject,
      assessments: m.assessments,
      total: m.total,
      percentage: m.percentage,
      grade: m.grade,
      updatedAt: m.updatedAt
    }));

    if (toDelete.length > 0) {
      await supabase.from('marks').delete().in('id', toDelete);
    }

    if (toUpsert.length > 0) {
      const { error } = await supabase.from('marks').upsert(toUpsert);
      if (error) {
        console.error('Error upserting marks in Supabase:', error);
      }
    }
  }
};
