import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

export const supabaseService = {
  // Auth
  async signUp(email: string, password: string, metadata: any) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });
    if (error) throw error;
    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

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

  async getSchools() {
    const { data, error } = await supabase
      .from('school_settings')
      .select('*');
    if (error) throw error;
    return data;
  },

  async getClasses(schoolId: string) {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('school_id', schoolId);
    if (error) throw error;
    return data;
  },

  async getExamsByClass(className: string) {
    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .eq('class_id', className); // Assuming class_id stores class name for now or we need a join
    if (error) throw error;
    return data;
  },

  async getMarksByStudent(studentId: string) {
    const { data, error } = await supabase
      .from('marks')
      .select('*, exams!inner(*)')
      .eq('student_id', studentId);
    if (error) throw error;
    return data;
  },

  async getMarksBySchool(schoolId: string) {
    const { data, error } = await supabase
      .from('marks')
      .select('*, students!inner(*)')
      .eq('students.school_id', schoolId);
    if (error) throw error;
    return data;
  },

  async getMaterials() {
    // Assuming a materials table exists or using a generic fetch
    const { data, error } = await supabase
      .from('exam_materials') // Need to ensure this table exists
      .select('*');
    if (error) return []; // Return empty if table doesn't exist yet
    return data;
  },

  // Students
  async createStudent(student: any) {
    const { data, error } = await supabase
      .from('students')
      .insert(student)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateStudent(id: string, student: any) {
    const { data, error } = await supabase
      .from('students')
      .update(student)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

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
  }
};
