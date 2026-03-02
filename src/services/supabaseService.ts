import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

export const supabaseService = {
  // Profiles
  async getProfile(id: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async updateProfile(id: string, updates: Database['public']['Tables']['profiles']['Update']) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
    return data;
  },

  // Exams
  async getExams(schoolId: string) {
    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .eq('school_id', schoolId);
    if (error) throw error;
    return data;
  },

  async createExam(exam: Database['public']['Tables']['exams']['Insert']) {
    const { data, error } = await supabase
      .from('exams')
      .insert(exam)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateExam(id: string, updates: Database['public']['Tables']['exams']['Update']) {
    const { data, error } = await supabase
      .from('exams')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
    return data;
  },

  // Marks
  async getMarks(examId: string) {
    const { data, error } = await supabase
      .from('marks')
      .select('*')
      .eq('exam_id', examId);
    if (error) throw error;
    return data;
  },

  async upsertMarks(marks: Database['public']['Tables']['marks']['Insert'][]) {
    const { data, error } = await supabase
      .from('marks')
      .upsert(marks);
    if (error) throw error;
    return data;
  },

  // Students
  async getStudents(schoolId: string) {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('school_id', schoolId);
    if (error) throw error;
    return data;
  },

  async getStudentsByClass(schoolId: string, className: string) {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('school_id', schoolId)
      .eq('class', className);
    if (error) throw error;
    return data;
  },

  // School Settings
  async getSchoolSettings(schoolId: string) {
    const { data, error } = await supabase
      .from('school_settings')
      .select('*')
      .eq('school_id', schoolId)
      .single();
    if (error) throw error;
    return data;
  },

  async updateSchoolSettings(schoolId: string, updates: Database['public']['Tables']['school_settings']['Update']) {
    const { data, error } = await supabase
      .from('school_settings')
      .update(updates)
      .eq('school_id', schoolId);
    if (error) throw error;
    return data;
  },

  // Audit Logs
  async addAuditLog(log: Database['public']['Tables']['audit_logs']['Insert']) {
    const { data, error } = await supabase
      .from('audit_logs')
      .insert(log);
    if (error) throw error;
    return data;
  },

  // Storage
  async uploadAvatar(id: string, file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${id}-${Math.random()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return publicUrl;
  },

  async uploadLogo(schoolId: string, file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${schoolId}-${Math.random()}.${fileExt}`;
    const filePath = `logos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('logos')
      .getPublicUrl(filePath);

    return publicUrl;
  },

  async getPublicResources() {
    const { data, error } = await supabase.storage
      .from('public-resources')
      .list();
    if (error) throw error;
    return data;
  },

  async getResourceUrl(fileName: string) {
    const { data: { publicUrl } } = supabase.storage
      .from('public-resources')
      .getPublicUrl(fileName);
    return publicUrl;
  },

  async syncData(schoolId: string = 'default-school') {
    try {
      // 1. Sync Students
      const { data: remoteStudents, error: studentsError } = await supabase.from('students').select('*');
      if (!studentsError && remoteStudents) {
        if (remoteStudents.length > 0) {
          localStorage.setItem('alakara_students', JSON.stringify(remoteStudents));
        } else {
          const localStudents = JSON.parse(localStorage.getItem('alakara_students') || '[]');
          if (localStudents.length > 0) {
            const mapped = localStudents.map((s: any) => ({
              id: s.id, name: s.name, adm: s.adm, class: s.class, gender: s.gender || 'Unknown', status: s.status || 'Active', school_id: schoolId
            }));
            await supabase.from('students').upsert(mapped);
          }
        }
      }

      // 2. Sync Classes
      const { data: remoteClasses, error: classesError } = await supabase.from('classes').select('*');
      if (!classesError && remoteClasses) {
        if (remoteClasses.length > 0) {
          localStorage.setItem('alakara_classes', JSON.stringify(remoteClasses));
        } else {
          const localClasses = JSON.parse(localStorage.getItem('alakara_classes') || '[]');
          if (localClasses.length > 0) {
            const mapped = localClasses.map((c: any) => ({
              id: c.id, name: c.name, teacher_id: c.teacherId || null, capacity: c.capacity || 40, school_id: schoolId
            }));
            await supabase.from('classes').upsert(mapped);
          }
        }
      }

      // 3. Sync Marks
      const { data: remoteMarks, error: marksError } = await supabase.from('marks').select('*');
      if (!marksError && remoteMarks) {
        if (remoteMarks.length > 0) {
          const mappedLocal = remoteMarks.map(m => ({
            id: m.id, examId: m.exam_id, studentId: m.student_id, subject: m.subject_id, score: String(m.score), total: m.score, grade: m.grade
          }));
          localStorage.setItem('alakara_marks', JSON.stringify(mappedLocal));
        } else {
          const localMarks = JSON.parse(localStorage.getItem('alakara_marks') || '[]');
          if (localMarks.length > 0) {
            const mapped = localMarks.map((m: any) => ({
              id: m.id, student_id: m.studentId, subject_id: m.subject, exam_id: m.examId, score: parseFloat(m.score) || 0, grade: m.grade
            }));
            await supabase.from('marks').upsert(mapped);
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Sync failed:', error);
      return false;
    }
  }
};
