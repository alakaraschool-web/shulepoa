import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { motion } from 'motion/react';
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  Settings, 
  LogOut, 
  LayoutDashboard, 
  Bell, 
  Search,
  ShieldAlert,
  Phone,
  Edit,
  Edit3,
  AlertTriangle,
  Plus,
  Trash2,
  UserPlus,
  Mail,
  ShieldCheck,
  Check,
  X,
  MoreVertical,
  PlusCircle,
  Library,
  BarChart3,
  FileSpreadsheet,
  ClipboardList,
  ChevronRight,
  CheckCircle2,
  UserCheck,
  Upload,
  Download,
  ArrowUpDown,
  Filter,
  Globe,
  Building2,
  Image as ImageIcon,
  Quote,
  Trophy
} from 'lucide-react';
import { NotificationBell, addNotification } from '../components/NotificationBell';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Letterhead } from '../components/Letterhead';
import { 
  BarChart, 
  Bar, 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const PrincipalDashboard = () => {
  const navigate = useNavigate();
  const [school, setSchool] = useState<any>(null);
  const [isSuspended, setIsSuspended] = useState(false);
  const [daysToExpiry, setDaysToExpiry] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'staff' | 'students' | 'academic' | 'settings' | 'classes'>('dashboard');
  const [academicSubTab, setAcademicSubTab] = useState<'overview' | 'create-exam' | 'edit-exam' | 'learning-area' | 'grading' | 'analysis' | 'reports' | 'results-processing' | 'academic-settings'>('overview');
  const [topXCount, setTopXCount] = useState(10);
  const [selectedProcessingClass, setSelectedProcessingClass] = useState('All');
  const [selectedAnalysisClass, setSelectedAnalysisClass] = useState('All');
  const [selectedProcessingExamId, setSelectedProcessingExamId] = useState('');
  
  const [selectedEditClass, setSelectedEditClass] = useState('');
  const [selectedEditSubject, setSelectedEditSubject] = useState('');
  const [selectedEditExamId, setSelectedEditExamId] = useState('');
  const [editMarksData, setEditMarksData] = useState<any[]>([]);
  const [showEditConfirmModal, setShowEditConfirmModal] = useState(false);
  
  const handleBulkMarksUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

      // Assuming format: [Admission No, Subject1, Subject2, ...]
      // Header row: Admission Number, Math, English, Science, ...
      const header = data[0];
      const subjectIndices: { [key: string]: number } = {};
      
      header.forEach((cell, idx) => {
        const la = String(cell).trim();
        if (learningAreas.includes(la)) {
          subjectIndices[la] = idx;
        }
      });

      const newMarks = [...marks];
      const examId = selectedProcessingExamId;
      
      if (!examId) {
        alert('Please select an examination first.');
        return;
      }

      data.slice(1).forEach((row) => {
        const admNo = String(row[0]).trim();
        const student = students.find(s => s.adm === admNo);
        
        if (student) {
          Object.entries(subjectIndices).forEach(([subject, idx]) => {
            const score = row[idx];
            if (score !== undefined && score !== '') {
              // Remove existing mark for this student/exam/subject
              const markIdx = newMarks.findIndex(m => m.studentId === student.id && m.examId === examId && m.subject === subject);
              const markData = {
                id: Math.random().toString(36).substr(2, 9),
                examId,
                studentId: student.id,
                score: String(score),
                subject,
                updatedAt: new Date().toISOString()
              };
              
              if (markIdx > -1) {
                newMarks[markIdx] = markData;
              } else {
                newMarks.push(markData);
              }
            }
          });
        }
      });

      setMarks(newMarks);
      alert('Bulk marks imported successfully!');
    };
    reader.readAsBinaryString(file);
  };

  const downloadBulkMarksTemplate = () => {
    const header = ['Admission Number', ...learningAreas];
    const data = [
      header,
      ['ADM-2024-001', ...learningAreas.map(() => '80')],
      ['ADM-2024-002', ...learningAreas.map(() => '75')]
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Marks");
    XLSX.writeFile(wb, "Bulk_Marks_Upload_Template.xlsx");
  };
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showReportPreview, setShowReportPreview] = useState(false);
  const [students, setStudents] = useState<any[]>(() => {
    const saved = localStorage.getItem('alakara_students');
    if (saved) return JSON.parse(saved);
    return [
      { id: '1', name: 'Alice Wanjiku', adm: 'ADM-2024-001', class: 'Form 1', status: 'Active' },
      { id: '2', name: 'Bob Otieno', adm: 'ADM-2024-002', class: 'Form 2', status: 'Active' },
    ];
  });

  const [newStudent, setNewStudent] = useState({ name: '', adm: '', class: 'Form 1' });
  const [editingStudent, setEditingStudent] = useState<any>(null);

  const [classes, setClasses] = useState<any[]>(() => {
    const saved = localStorage.getItem('alakara_classes');
    if (saved) return JSON.parse(saved);
    return [
      { id: '1', name: 'Form 1', teacherId: '1', capacity: 40 },
      { id: '2', name: 'Form 2', teacherId: '2', capacity: 40 },
      { id: '3', name: 'Form 3', teacherId: '3', capacity: 40 },
      { id: '4', name: 'Form 4', teacherId: '', capacity: 40 },
      { id: '5', name: 'Grade 7', teacherId: '', capacity: 40 },
      { id: '6', name: 'Grade 8', teacherId: '', capacity: 40 },
    ];
  });
  const [newClass, setNewClass] = useState({ name: '', teacherId: '', capacity: 40 });
  const [editingClass, setEditingClass] = useState<any>(null);

  useEffect(() => {
    localStorage.setItem('alakara_classes', JSON.stringify(classes));
  }, [classes]);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentSortBy, setStudentSortBy] = useState<'name' | 'adm'>('name');
  const [studentSortOrder, setStudentSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedClassFilter, setSelectedClassFilter] = useState('All');
  const [marks, setMarks] = useState<any[]>(() => {
    const saved = localStorage.getItem('alakara_marks');
    if (saved) return JSON.parse(saved);
    return [];
  });
  const [showEditMarksModal, setShowEditMarksModal] = useState(false);
  const [selectedMarksStudent, setSelectedMarksStudent] = useState<any>(null);
  const [editingMarks, setEditingMarks] = useState<any>({}); // {examId: score}

  const loadEditMarksData = () => {
    if (!selectedEditClass || !selectedEditSubject || !selectedEditExamId) return;
    
    const classStudents = students.filter(s => s.class === selectedEditClass);
    const data = classStudents.map(student => {
      const mark = marks.find(m => m.studentId === student.id && m.examId === selectedEditExamId && m.subject === selectedEditSubject);
      return {
        studentId: student.id,
        adm: student.adm,
        name: student.name,
        score: mark ? mark.score : ''
      };
    });
    setEditMarksData(data);
  };

  useEffect(() => {
    loadEditMarksData();
  }, [selectedEditClass, selectedEditSubject, selectedEditExamId, marks]);

  const handleEditMarkChange = (studentId: string, score: string) => {
    setEditMarksData(prev => prev.map(d => d.studentId === studentId ? { ...d, score } : d));
  };

  const [logs, setLogs] = useState<any[]>(() => {
    const saved = localStorage.getItem('alakara_audit_trail');
    return saved ? JSON.parse(saved) : [];
  });

  const addLog = (action: string, details: string) => {
    const newLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      user: 'Principal',
      action,
      details
    };
    const updatedLogs = [newLog, ...logs].slice(0, 100);
    setLogs(updatedLogs);
    localStorage.setItem('alakara_audit_trail', JSON.stringify(updatedLogs));
  };

  const saveEditedMarks = () => {
    const newMarks = [...marks];
    let changesMade = false;
    editMarksData.forEach(data => {
      if (data.score !== '') {
        const markIdx = newMarks.findIndex(m => m.studentId === data.studentId && m.examId === selectedEditExamId && m.subject === selectedEditSubject);
        const markData = {
          id: Math.random().toString(36).substr(2, 9),
          examId: selectedEditExamId,
          studentId: data.studentId,
          score: data.score,
          subject: selectedEditSubject,
          updatedAt: new Date().toISOString()
        };
        if (markIdx > -1) {
          if (newMarks[markIdx].score !== data.score) {
            newMarks[markIdx] = markData;
            changesMade = true;
          }
        } else {
          newMarks.push(markData);
          changesMade = true;
        }
      }
    });
    setMarks(newMarks);
    setShowEditConfirmModal(false);
    if (changesMade) {
      const exam = exams.find(e => e.id === selectedEditExamId);
      addLog('Edit Marks', `Edited marks for ${selectedEditClass} - ${selectedEditSubject} in ${exam?.title}`);
    }
    alert('Marks updated successfully!');
  };

  useEffect(() => {
    localStorage.setItem('alakara_marks', JSON.stringify(marks));
  }, [marks]);

  useEffect(() => {
    localStorage.setItem('alakara_students', JSON.stringify(students));
  }, [students]);
  const [exams, setExams] = useState<any[]>(() => {
    const saved = localStorage.getItem('alakara_exams');
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [newExam, setNewExam] = useState({
    title: '',
    term: 'Term 1',
    year: '2026',
    classes: [] as string[],
    subjects: [] as string[],
    startDate: '',
    endDate: ''
  });

  const [learningAreas, setLearningAreas] = useState<string[]>(() => {
    const saved = localStorage.getItem('alakara_learning_areas');
    if (saved) return JSON.parse(saved);
    return ['Mathematics', 'English', 'Kiswahili', 'Science', 'Social Studies', 'CRE'];
  });

  const [gradingSystem, setGradingSystem] = useState<any[]>(() => {
    const saved = localStorage.getItem('alakara_grading');
    if (saved) return JSON.parse(saved);
    return [
      { grade: 'A', min: 80, max: 100, points: 12 },
      { grade: 'A-', min: 75, max: 79, points: 11 },
      { grade: 'B+', min: 70, max: 74, points: 10 },
      { grade: 'B', min: 65, max: 69, points: 9 },
      { grade: 'B-', min: 60, max: 64, points: 8 },
      { grade: 'C+', min: 55, max: 59, points: 7 },
      { grade: 'C', min: 50, max: 54, points: 6 },
      { grade: 'C-', min: 45, max: 49, points: 5 },
      { grade: 'D+', min: 40, max: 44, points: 4 },
      { grade: 'D', min: 35, max: 39, points: 3 },
      { grade: 'D-', min: 30, max: 34, points: 2 },
      { grade: 'E', min: 0, max: 29, points: 1 },
    ];
  });

  const [reportConfig, setReportConfig] = useState({
    selectedStudentId: '',
    selectedExamIds: [] as string[],
    includeAverages: true,
    includeGrades: true,
    graphType: 'bar' as 'bar' | 'line',
    templateType: 'classic' as 'classic' | 'modern' | 'graph' | 'primary' | 'compact',
    includeLetterhead: true,
    includePerformanceTrend: true
  });

  const [selectedAnalysisExamId, setSelectedAnalysisExamId] = useState('');
  const [analysisOptions, setAnalysisOptions] = useState({
    showGrades: true,
    showRank: true
  });

  const [assessmentCategories, setAssessmentCategories] = useState<any[]>(() => {
    const saved = localStorage.getItem('alakara_assessment_categories');
    return saved ? JSON.parse(saved) : [
      { id: 'cat1', name: 'CAT 1', maxScore: 20 },
      { id: 'cat2', name: 'CAT 2', maxScore: 20 },
      { id: 'final', name: 'Final Exam', maxScore: 60 },
    ];
  });

  const [rankingLogic, setRankingLogic] = useState<any>(() => {
    const saved = localStorage.getItem('alakara_ranking_logic');
    return saved ? JSON.parse(saved) : {
      primaryCriteria: 'aggregate_total',
      tieBreaker1: 'distinctions_count',
      tieBreaker2: 'core_subjects_total',
      coreSubjects: ['Mathematics', 'English', 'Kiswahili']
    };
  });

  useEffect(() => {
    localStorage.setItem('alakara_assessment_categories', JSON.stringify(assessmentCategories));
  }, [assessmentCategories]);

  useEffect(() => {
    localStorage.setItem('alakara_ranking_logic', JSON.stringify(rankingLogic));
  }, [rankingLogic]);

  const [schoolSettings, setSchoolSettings] = useState({
    name: '',
    motto: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    logo: '',
    letterheadTemplate: 'standard'
  });

  useEffect(() => {
    localStorage.setItem('alakara_learning_areas', JSON.stringify(learningAreas));
  }, [learningAreas]);

  useEffect(() => {
    localStorage.setItem('alakara_grading', JSON.stringify(gradingSystem));
  }, [gradingSystem]);

  useEffect(() => {
    localStorage.setItem('alakara_exams', JSON.stringify(exams));
  }, [exams]);
  const [staff, setStaff] = useState<any[]>(() => {
    const saved = localStorage.getItem('alakara_staff');
    if (saved) return JSON.parse(saved);
    return [
      { id: '1', name: 'John Kamau', email: 'j.kamau@alakara.ac.ke', role: 'Head of Science', status: 'Active', username: 'j.kamau@alakara.ac.ke', password: 'password123', mustChangePassword: true, assignedSubjects: ['Science', 'Biology'], assignedClasses: ['Form 1', 'Form 2', 'Grade 7'] },
      { id: '2', name: 'Sarah Anyango', email: 's.anyango@alakara.ac.ke', role: 'Mathematics Teacher', status: 'Active', username: 's.anyango@alakara.ac.ke', password: 'password123', mustChangePassword: true, assignedSubjects: ['Mathematics'], assignedClasses: ['Form 1', 'Form 2', 'Grade 7'] },
      { id: '3', name: 'David Omondi', email: 'd.omondi@alakara.ac.ke', role: 'History Teacher', status: 'Active', username: 'd.omondi@alakara.ac.ke', password: 'password123', mustChangePassword: true, assignedSubjects: ['Social Studies', 'CRE'], assignedClasses: ['Form 1', 'Form 2', 'Grade 7'] },
      { id: '4', name: 'Mary Wambui', email: 'm.wambui@alakara.ac.ke', role: 'English Teacher', status: 'Active', username: 'm.wambui@alakara.ac.ke', password: 'password123', mustChangePassword: true, assignedSubjects: ['English', 'Kiswahili'], assignedClasses: ['Form 1', 'Form 2', 'Grade 7'] },
    ];
  });

  const [newStaff, setNewStaff] = useState({ name: '', email: '', role: 'Teacher', assignedSubjects: [] as string[], assignedClasses: [] as string[] });
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [generatedStaffCreds, setGeneratedStaffCreds] = useState<{name: string, username: string, password: string} | null>(null);

  useEffect(() => {
    localStorage.setItem('alakara_staff', JSON.stringify(staff));
  }, [staff]);

  useEffect(() => {
    const checkStatus = () => {
      const currentSchool = JSON.parse(localStorage.getItem('alakara_current_school') || '{}');
      const allSchools = JSON.parse(localStorage.getItem('alakara_schools') || '[]');
      
      const updatedSchool = allSchools.find((s: any) => s.id === currentSchool.id);
      
      if (updatedSchool) {
        setSchool(updatedSchool);
        
        // Check subscription expiry
        const expiryDate = updatedSchool.subscriptionExpiresAt ? new Date(updatedSchool.subscriptionExpiresAt) : null;
        const now = new Date();
        const isExpired = expiryDate ? expiryDate < now : false;
        
        setIsSuspended(updatedSchool.status === 'Suspended' || isExpired);

        if (expiryDate) {
          const diffTime = expiryDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          setDaysToExpiry(diffDays);

          // Trigger notification for expiry warning
          if (diffDays <= 15 && diffDays > 0) {
            const lastWarning = localStorage.getItem(`alakara_expiry_warning_${updatedSchool.id}`);
            const today = new Date().toDateString();
            if (lastWarning !== today) {
              addNotification({
                title: 'Subscription Expiry Warning',
                message: `Your school subscription will expire in ${diffDays} days. Please renew to avoid service interruption.`,
                type: 'warning',
                role: 'principal',
                userId: updatedSchool.id
              });
              localStorage.setItem(`alakara_expiry_warning_${updatedSchool.id}`, today);
            }
          }
        } else {
          setDaysToExpiry(null);
        }
      } else {
        navigate('/login');
      }
    };

    // Initial load
    const currentSchool = JSON.parse(localStorage.getItem('alakara_current_school') || '{}');
    const allSchools = JSON.parse(localStorage.getItem('alakara_schools') || '[]');
    const initialSchool = allSchools.find((s: any) => s.id === currentSchool.id);
    if (initialSchool) {
      setSchoolSettings({
        name: initialSchool.name || '',
        motto: initialSchool.motto || '',
        address: initialSchool.address || '',
        phone: initialSchool.phone || '',
        email: initialSchool.email || '',
        website: initialSchool.website || '',
        logo: initialSchool.logo || '',
        letterheadTemplate: initialSchool.letterheadTemplate || 'standard'
      });
    }

    checkStatus();
    // Poll for status changes in this demo
    const interval = setInterval(checkStatus, 2000);
    return () => clearInterval(interval);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('alakara_current_school');
    navigate('/login');
  };

  const handleAddStaff = (e: FormEvent) => {
    e.preventDefault();
    
    // Auto-generate email/username from name if not provided
    let finalEmail = newStaff.email.trim();
    if (!finalEmail) {
      const nameParts = newStaff.name.toLowerCase().split(' ');
      const baseUsername = nameParts.length > 1 
        ? `${nameParts[0][0]}${nameParts[1]}` 
        : nameParts[0];
      finalEmail = `${baseUsername}@alakara.ac.ke`;
    } else if (!finalEmail.includes('@')) {
      finalEmail = `${finalEmail.toLowerCase()}@alakara.ac.ke`;
    } else if (!finalEmail.endsWith('@alakara.ac.ke')) {
      const [prefix] = finalEmail.split('@');
      finalEmail = `${prefix.toLowerCase()}@alakara.ac.ke`;
    }

    if (editingStaff) {
      setStaff(staff.map(s => s.id === editingStaff.id ? { 
        ...editingStaff, 
        name: newStaff.name, 
        email: finalEmail, 
        role: newStaff.role,
        assignedSubjects: newStaff.assignedSubjects,
        assignedClasses: newStaff.assignedClasses
      } : s));
      setEditingStaff(null);
    } else {
      const password = Math.random().toString(36).slice(-8);

      const staffMember = {
        id: Math.random().toString(36).substr(2, 9),
        ...newStaff,
        email: finalEmail,
        status: 'Active',
        username: finalEmail,
        password,
        mustChangePassword: true
      };
      setStaff([...staff, staffMember]);
      setGeneratedStaffCreds({ name: newStaff.name, username: finalEmail, password });
    }
    setNewStaff({ name: '', email: '', role: 'Teacher', assignedSubjects: [], assignedClasses: [] });
    setShowAddStaffModal(false);
  };

  const openEditStaff = (member: any) => {
    setEditingStaff(member);
    setNewStaff({ 
      name: member.name, 
      email: member.email, 
      role: member.role,
      assignedSubjects: member.assignedSubjects || [],
      assignedClasses: member.assignedClasses || []
    });
    setShowAddStaffModal(true);
  };

  const removeStaff = (id: string) => {
    if (window.confirm('Are you sure you want to remove this staff member?')) {
      setStaff(staff.filter(s => s.id !== id));
    }
  };

  const updateStaffRole = (id: string, newRole: string) => {
    setStaff(staff.map(s => s.id === id ? { ...s, role: newRole } : s));
  };

  const handleAddStudent = (e: FormEvent) => {
    e.preventDefault();
    if (editingStudent) {
      setStudents(students.map(s => s.id === editingStudent.id ? { ...editingStudent, ...newStudent } : s));
      setEditingStudent(null);
    } else {
      const student = {
        id: Math.random().toString(36).substr(2, 9),
        ...newStudent,
        status: 'Active'
      };
      setStudents([...students, student]);
    }
    setNewStudent({ name: '', adm: '', class: 'Form 1' });
    setShowAddStudentModal(false);
  };

  const openEditStudent = (student: any) => {
    setEditingStudent(student);
    setNewStudent({ name: student.name, adm: student.adm, class: student.class });
    setShowAddStudentModal(true);
  };

  const handleAddClass = (e: FormEvent) => {
    e.preventDefault();
    if (editingClass) {
      setClasses(classes.map(c => c.id === editingClass.id ? { ...editingClass, ...newClass } : c));
      setEditingClass(null);
    } else {
      const cls = {
        id: Math.random().toString(36).substr(2, 9),
        ...newClass
      };
      setClasses([...classes, cls]);
    }
    setNewClass({ name: '', teacherId: '', capacity: 40 });
    setShowAddClassModal(false);
  };

  const openEditClass = (cls: any) => {
    setEditingClass(cls);
    setNewClass({ name: cls.name, teacherId: cls.teacherId || '', capacity: cls.capacity || 40 });
    setShowAddClassModal(true);
  };

  const removeClass = (id: string) => {
    if (window.confirm('Are you sure you want to remove this class?')) {
      setClasses(classes.filter(c => c.id !== id));
    }
  };

  const handleBulkStudentUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        const newStudents = [...students];
        data.forEach((row, index) => {
          if (index === 0) return; // Skip header
          if (!row[0]) return; // Skip empty rows

          newStudents.push({
            id: Math.random().toString(36).substr(2, 9),
            name: String(row[0]).trim(),
            adm: String(row[1] || '').trim(),
            class: String(row[2] || 'Form 1').trim(),
            status: 'Active'
          });
        });

        setStudents(newStudents);
        alert(`Successfully imported ${newStudents.length - students.length} students!`);
      } catch (err) {
        alert('Error parsing Excel file. Please ensure it follows the format: Name, Admission No, Class');
      }
    };
    reader.readAsBinaryString(file);
  };

  const removeStudent = (id: string) => {
    if (window.confirm('Are you sure you want to remove this student?')) {
      setStudents(students.filter(s => s.id !== id));
    }
  };

  const filteredAndSortedStudents = students
    .filter(s => 
      (s.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
      s.adm.toLowerCase().includes(studentSearchQuery.toLowerCase())) &&
      (selectedClassFilter === 'All' || s.class === selectedClassFilter)
    )
    .sort((a, b) => {
      const valA = a[studentSortBy].toLowerCase();
      const valB = b[studentSortBy].toLowerCase();
      if (studentSortOrder === 'asc') return valA.localeCompare(valB);
      return valB.localeCompare(valA);
    });

  const groupedStudents = filteredAndSortedStudents.reduce((acc: any, student) => {
    const className = student.class;
    if (!acc[className]) acc[className] = [];
    acc[className].push(student);
    return acc;
  }, {});

  const toggleStudentSort = (key: 'name' | 'adm') => {
    if (studentSortBy === key) {
      setStudentSortOrder(studentSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setStudentSortBy(key);
      setStudentSortOrder('asc');
    }
  };

  const downloadStudentTemplate = () => {
    const data = [
      ['Full Name', 'Admission Number', 'Class'],
      ['Jane Doe', 'ADM-2024-001', 'Form 1'],
      ['John Smith', 'ADM-2024-002', 'Form 2']
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "Student_Bulk_Upload_Template.xlsx");
  };

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Auto-save drafts
  useEffect(() => {
    const draft = {
      newExam,
      newStaff,
      schoolSettings,
      newClass,
      newStudent
    };
    localStorage.setItem('alakara_config_draft', JSON.stringify(draft));
    setHasUnsavedChanges(true);
  }, [newExam, newStaff, schoolSettings, newClass, newStudent]);

  // Load drafts on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('alakara_config_draft');
    if (savedDraft) {
      const draft = JSON.parse(savedDraft);
      // Only set if they are not empty to avoid overwriting initial state with empty drafts
      if (draft.newExam.title) setNewExam(draft.newExam);
      if (draft.newStaff.name) setNewStaff(draft.newStaff);
      if (draft.schoolSettings.name) setSchoolSettings(draft.schoolSettings);
      if (draft.newClass.name) setNewClass(draft.newClass);
      if (draft.newStudent.name) setNewStudent(draft.newStudent);
    }
    // Reset unsaved changes after initial load
    setTimeout(() => setHasUnsavedChanges(false), 1000);
  }, []);

  // Prevent accidental reload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleCreateExam = (e: FormEvent) => {
    e.preventDefault();
    const exam = {
      id: Math.random().toString(36).substr(2, 9),
      ...newExam,
      status: 'Active', // Active means teachers can enter marks
      createdAt: new Date().toISOString(),
      schoolId: school.id
    };
    setExams([exam, ...exams]);
    setNewExam({ title: '', term: 'Term 1', year: '2026', classes: [], subjects: [], startDate: '', endDate: '' });
    setAcademicSubTab('overview');
    alert('Exam created successfully! It is now visible to teachers.');
  };

  const processExam = (id: string) => {
    if (window.confirm('Are you sure you want to process this exam? This will lock mark entry for teachers.')) {
      const exam = exams.find(e => e.id === id);
      setExams(exams.map(e => e.id === id ? { ...e, status: 'Completed' } : e));
      addLog('Process Exam', `Processed results for ${exam?.title}`);
      
      addNotification({
        title: 'Exam Results Published',
        message: `Results for "${exam?.title}" have been processed and published.`,
        type: 'success',
        role: 'principal',
        userId: school.id
      });

      // Notify students in the classes
      exam?.classes.forEach((className: string) => {
        addNotification({
          title: 'New Results Available',
          message: `The results for ${exam.title} are now available for viewing.`,
          type: 'info',
          role: 'student'
        });
      });
    }
  };

  const recallExam = (id: string) => {
    if (window.confirm('Are you sure you want to recall this exam? Teachers will be able to edit scores again.')) {
      setExams(exams.map(e => e.id === id ? { ...e, status: 'Active' } : e));
    }
  };

  const deleteExam = (id: string) => {
    if (window.confirm('Delete this exam? All associated marks will be lost.')) {
      setExams(exams.filter(e => e.id !== id));
    }
  };

  const toggleClassSelection = (className: string) => {
    setNewExam(prev => ({
      ...prev,
      classes: prev.classes.includes(className) 
        ? prev.classes.filter(c => c !== className)
        : [...prev.classes, className]
    }));
  };

  const addLearningArea = (name: string) => {
    if (!name.trim()) return;
    if (learningAreas.includes(name.trim())) {
      alert('This learning area already exists.');
      return;
    }
    setLearningAreas([...learningAreas, name.trim()]);
  };

  const removeLearningArea = (name: string) => {
    if (window.confirm(`Remove ${name}?`)) {
      setLearningAreas(learningAreas.filter(la => la !== name));
    }
  };

  const updateGradeBoundary = (index: number, field: string, value: any) => {
    const newGrading = [...gradingSystem];
    newGrading[index] = { ...newGrading[index], [field]: value };
    setGradingSystem(newGrading);
  };

  const addGrade = () => {
    setGradingSystem([...gradingSystem, { grade: 'New', min: 0, max: 0, points: 0 }]);
  };

  const removeGrade = (index: number) => {
    if (window.confirm('Remove this grade?')) {
      const newGrading = [...gradingSystem];
      newGrading.splice(index, 1);
      setGradingSystem(newGrading);
    }
  };

  const mockAnalysisData = [
    { subject: 'Math', average: 72, top: 98, bottom: 45 },
    { subject: 'English', average: 68, top: 92, bottom: 38 },
    { subject: 'Science', average: 65, top: 88, bottom: 42 },
    { subject: 'Social', average: 75, top: 95, bottom: 50 },
    { subject: 'CRE', average: 82, top: 99, bottom: 60 },
  ];

  const getAnalyticsData = () => {
    // 1. Class Performance Comparison
    const classPerformance = classes.map(c => {
      const classStudents = students.filter(s => s.class === c.name);
      const classMarks = marks.filter(m => classStudents.some(s => s.id === m.studentId));
      const totalScore = classMarks.reduce((sum, m) => sum + (m.total || 0), 0);
      const count = classMarks.length;
      return {
        name: c.name,
        average: count > 0 ? totalScore / count : 0,
        studentCount: classStudents.length
      };
    }).sort((a, b) => b.average - a.average);

    // 2. Subject Pass Rates
    const subjectStats = learningAreas.map(subject => {
      const subjectMarks = marks.filter(m => m.subject === subject);
      const passCount = subjectMarks.filter(m => (m.total || 0) >= 50).length;
      const failCount = subjectMarks.filter(m => (m.total || 0) < 50).length;
      const total = subjectMarks.length;
      return {
        subject,
        passRate: total > 0 ? (passCount / total) * 100 : 0,
        failRate: total > 0 ? (failCount / total) * 100 : 0,
        average: total > 0 ? subjectMarks.reduce((sum, m) => sum + (m.total || 0), 0) / total : 0
      };
    });

    // 3. Gender Performance
    const genderStats = ['Male', 'Female'].map(gender => {
      const genderStudents = students.filter(s => s.gender === gender);
      const genderMarks = marks.filter(m => genderStudents.some(s => s.id === m.studentId));
      const total = genderMarks.reduce((sum, m) => sum + (m.total || 0), 0);
      const count = genderMarks.length;
      return {
        gender,
        average: count > 0 ? total / count : 0
      };
    });

    return { classPerformance, subjectStats, genderStats };
  };

  const { classPerformance, subjectStats, genderStats } = getAnalyticsData();

  const handleGenerateReport = () => {
    if (!reportConfig.selectedStudentId) {
      alert('Please select a student.');
      return;
    }
    if (reportConfig.selectedExamIds.length === 0) {
      alert('Please select at least one exam.');
      return;
    }
    setShowReportPreview(true);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const student = students.find(s => s.id === reportConfig.selectedStudentId);
    if (!student) return;

    let startY = 20;

    // Add Letterhead
    if (reportConfig.includeLetterhead && schoolSettings.name) {
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text(schoolSettings.name, 105, startY, { align: "center" });
      startY += 8;
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      if (schoolSettings.motto) {
        doc.text(`"${schoolSettings.motto}"`, 105, startY, { align: "center" });
        startY += 6;
      }
      if (schoolSettings.address) {
        doc.text(schoolSettings.address, 105, startY, { align: "center" });
        startY += 6;
      }
      if (schoolSettings.phone || schoolSettings.email) {
        doc.text(`${schoolSettings.phone} | ${schoolSettings.email}`, 105, startY, { align: "center" });
        startY += 6;
      }
      doc.line(20, startY, 190, startY);
      startY += 10;
    }

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("ACADEMIC PERFORMANCE REPORT", 105, startY, { align: "center" });
    startY += 15;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Student Name: ${student.name}`, 20, startY);
    doc.text(`Class/Grade: ${student.class}`, 140, startY);
    startY += 8;
    doc.text(`Admission No: ${student.adm}`, 20, startY);
    doc.text(`Academic Year: 2024`, 140, startY);
    startY += 15;

    const tableData = learningAreas.map(subject => {
      const row = [subject];
      reportConfig.selectedExamIds.forEach(examId => {
        const mark = marks.find(m => m.studentId === student.id && m.examId === examId && m.subject === subject);
        row.push(mark ? mark.score : '-');
      });
      return row;
    });

    const headers = ['Subject', ...reportConfig.selectedExamIds.map(id => exams.find(e => e.id === id)?.title || 'Exam')];

    autoTable(doc, {
      startY: startY,
      head: [headers],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [0, 140, 81] }, // kenya-green
    });

    doc.save(`${student.name}_Report_Card.pdf`);
  };

  const generateExcel = () => {
    const student = students.find(s => s.id === reportConfig.selectedStudentId);
    if (!student) return;

    const tableData = learningAreas.map(subject => {
      const row = [subject];
      reportConfig.selectedExamIds.forEach(examId => {
        const mark = marks.find(m => m.studentId === student.id && m.examId === examId && m.subject === subject);
        row.push(mark ? mark.score : '-');
      });
      return row;
    });

    const headers = ['Subject', ...reportConfig.selectedExamIds.map(id => exams.find(e => e.id === id)?.title || 'Exam')];
    
    const wsData = [
      ['ACADEMIC PERFORMANCE REPORT'],
      [],
      ['Student Name:', student.name, 'Class/Grade:', student.class],
      ['Admission No:', student.adm, 'Academic Year:', '2024'],
      [],
      headers,
      ...tableData
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report Card");
    XLSX.writeFile(wb, `${student.name}_Report_Card.xlsx`);
  };

  const openEditMarks = (student: any) => {
    setSelectedMarksStudent(student);
    const studentMarks = marks.filter(m => m.studentId === student.id);
    const marksMap: any = {};
    studentMarks.forEach(m => {
      marksMap[m.examId] = m.score;
    });
    setEditingMarks(marksMap);
    setShowEditMarksModal(true);
  };

  const saveStudentMarks = () => {
    const newMarks = [...marks.filter(m => m.studentId !== selectedMarksStudent.id)];
    Object.entries(editingMarks).forEach(([examId, score]) => {
      if (score !== '') {
        newMarks.push({
          id: `${examId}-${selectedMarksStudent.id}`,
          examId,
          studentId: selectedMarksStudent.id,
          score,
          subject: 'Mathematics', // Assuming math for now as per teacher dashboard mock
          updatedAt: new Date().toISOString()
        });
      }
    });
    setMarks(newMarks);
    setShowEditMarksModal(false);
    alert('Marks updated successfully!');
  };

  const getAnalysisData = () => {
    if (!selectedAnalysisExamId) return [];
    
    const examMarks = marks.filter(m => m.examId === selectedAnalysisExamId);
    const exam = exams.find(e => e.id === selectedAnalysisExamId);
    if (!exam) return [];

    // Group marks by student
    const studentAnalysis = students
      .filter(s => exam.classes.includes(s.class) && (selectedAnalysisClass === 'All' || s.class === selectedAnalysisClass))
      .map(student => {
        const studentMarks = examMarks.filter(m => m.studentId === student.id);
        const subjectScores: any = {};
        let totalScore = 0;
        let subjectsCount = 0;

        learningAreas.forEach(la => {
          const mark = studentMarks.find(m => m.subject === la);
          const score = mark ? parseFloat(mark.score) : null;
          subjectScores[la] = score;
          if (score !== null) {
            totalScore += score;
            subjectsCount++;
          }
        });

        const average = subjectsCount > 0 ? totalScore / subjectsCount : 0;
        
        // Find grade
        const gradeObj = gradingSystem.find(g => average >= g.min && average <= g.max);
        const grade = gradeObj ? gradeObj.grade : 'E';

        return {
          id: student.id,
          name: student.name,
          adm: student.adm,
          class: student.class,
          subjectScores,
          totalScore,
          average,
          grade
        };
      });

    // Rank students
    const ranked = studentAnalysis.sort((a, b) => b.totalScore - a.totalScore);
    return ranked.map((s, index) => ({ ...s, rank: index + 1 }));
  };

  const getSubjectChampions = () => {
    if (!selectedProcessingExamId) return [];
    const exam = exams.find(e => e.id === selectedProcessingExamId);
    if (!exam) return [];

    return learningAreas.map(subject => {
      const subjectMarks = marks.filter(m => 
        m.examId === selectedProcessingExamId && 
        m.subject === subject &&
        (selectedProcessingClass === 'All' || students.find(s => s.id === m.studentId)?.class === selectedProcessingClass)
      );
      
      const sorted = subjectMarks.sort((a, b) => parseFloat(b.total || b.score) - parseFloat(a.total || a.score));
      const championMark = sorted[0];
      const champion = championMark ? students.find(s => s.id === championMark.studentId) : null;
      
      return {
        subject,
        champion: champion ? { ...champion, score: championMark.total || championMark.score } : null
      };
    });
  };

  const getTopStudents = () => {
    if (!selectedProcessingExamId) return [];
    
    const exam = exams.find(e => e.id === selectedProcessingExamId);
    if (!exam) return [];

    const classStudents = students.filter(s => 
      (selectedProcessingClass === 'All' ? exam.classes.includes(s.class) : s.class === selectedProcessingClass)
    );
    
    const processed = classStudents.map(student => {
      const studentMarks = marks.filter(m => m.examId === selectedProcessingExamId && m.studentId === student.id);
      
      const aggregateTotal = studentMarks.reduce((acc, m) => acc + parseFloat(m.total || m.score || 0), 0);
      const average = studentMarks.length > 0 ? aggregateTotal / studentMarks.length : 0;
      
      // Find overall grade
      const gradeObj = gradingSystem.find(g => average >= g.min && average <= g.max);
      const grade = gradeObj ? gradeObj.grade : 'E';

      // Count distinctions (A and A-)
      const distinctionsCount = studentMarks.filter(m => {
        const score = parseFloat(m.total || m.score);
        const g = gradingSystem.find(gs => score >= gs.min && score <= gs.max);
        return g && (g.grade === 'A' || g.grade === 'A-');
      }).length;

      // Core subjects total
      const coreSubjectsTotal = studentMarks
        .filter(m => rankingLogic.coreSubjects.includes(m.subject))
        .reduce((acc, m) => acc + parseFloat(m.total || m.score || 0), 0);

      return {
        ...student,
        aggregateTotal,
        average,
        grade,
        distinctionsCount,
        coreSubjectsTotal
      };
    });

    // Ranking Logic
    const ranked = processed.sort((a, b) => {
      if (b.aggregateTotal !== a.aggregateTotal) return b.aggregateTotal - a.aggregateTotal;
      if (b.distinctionsCount !== a.distinctionsCount) return b.distinctionsCount - a.distinctionsCount;
      return b.coreSubjectsTotal - a.coreSubjectsTotal;
    });

    // Assign positions
    let currentPos = 1;
    const positioned = ranked.map((item, idx, arr) => {
      if (idx > 0) {
        const prev = arr[idx - 1];
        const isTie = item.aggregateTotal === prev.aggregateTotal && 
                     item.distinctionsCount === prev.distinctionsCount && 
                     item.coreSubjectsTotal === prev.coreSubjectsTotal;
        if (!isTie) {
          currentPos = idx + 1;
        }
      }
      return { ...item, position: currentPos };
    });

    return positioned.slice(0, topXCount);
  };

  const getMostImproved = (limit: number) => {
    if (exams.length < 2) return [];
    const currentExam = exams[exams.length - 1];
    const prevExam = exams[exams.length - 2];
    
    return students.map(student => {
      const currentMarks = marks.filter(m => m.examId === currentExam.id && m.studentId === student.id);
      const prevMarks = marks.filter(m => m.examId === prevExam.id && m.studentId === student.id);
      
      const currentTotal = currentMarks.reduce((acc, m) => acc + parseFloat(m.total || m.score || 0), 0);
      const prevTotal = prevMarks.reduce((acc, m) => acc + parseFloat(m.total || m.score || 0), 0);
      
      return {
        ...student,
        improvement: currentTotal - prevTotal,
        currentTotal,
        prevTotal
      };
    })
    .filter(s => s.improvement > 0)
    .sort((a, b) => b.improvement - a.improvement)
    .slice(0, limit);
  };

  const getMostDropped = (limit: number) => {
    if (exams.length < 2) return [];
    const currentExam = exams[exams.length - 1];
    const prevExam = exams[exams.length - 2];
    
    return students.map(student => {
      const currentMarks = marks.filter(m => m.examId === currentExam.id && m.studentId === student.id);
      const prevMarks = marks.filter(m => m.examId === prevExam.id && m.studentId === student.id);
      
      const currentTotal = currentMarks.reduce((acc, m) => acc + parseFloat(m.total || m.score || 0), 0);
      const prevTotal = prevMarks.reduce((acc, m) => acc + parseFloat(m.total || m.score || 0), 0);
      
      return {
        ...student,
        drop: prevTotal - currentTotal,
        currentTotal,
        prevTotal
      };
    })
    .filter(s => s.drop > 0)
    .sort((a, b) => b.drop - a.drop)
    .slice(0, limit);
  };

  const analysisData = getAnalysisData();

  const getAnalysisHighlights = () => {
    if (!selectedAnalysisExamId || analysisData.length === 0) return null;

    const bestStudent = analysisData[0];
    
    const currentExam = exams.find(e => e.id === selectedAnalysisExamId);
    if (!currentExam) return { bestStudent };

    const previousExams = exams
      .filter(e => e.id !== selectedAnalysisExamId && e.classes.some(c => currentExam.classes.includes(c)))
      .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
    
    const previousExam = previousExams[0];
    
    if (!previousExam) return { bestStudent };

    const improvements = analysisData.map(student => {
      const prevExamMarks = marks.filter(m => m.examId === previousExam.id && m.studentId === student.id);
      const prevTotal = prevExamMarks.reduce((sum, m) => sum + parseFloat(m.score as string), 0);
      const prevAvg = prevExamMarks.length > 0 ? prevTotal / prevExamMarks.length : null;
      
      if (prevAvg === null) return { ...student, improvement: 0 };
      return { ...student, improvement: student.average - prevAvg };
    });

    const mostImproved = [...improvements].sort((a, b) => b.improvement - a.improvement)[0];
    const mostDropped = [...improvements].sort((a, b) => a.improvement - b.improvement)[0];

    return {
      bestStudent,
      mostImproved: mostImproved && mostImproved.improvement > 0 ? mostImproved : null,
      mostDropped: mostDropped && mostDropped.improvement < 0 ? mostDropped : null,
      previousExamTitle: previousExam.title
    };
  };

  const exportAnalysis = () => {
    if (!selectedAnalysisExamId || analysisData.length === 0) return;
    
    const exam = exams.find(e => e.id === selectedAnalysisExamId);
    const highlights = getAnalysisHighlights();
    
    const mainSheetData = analysisData.map(row => {
      const exportRow: any = {
        'Rank': row.rank,
        'Adm No': row.adm,
        'Student Name': row.name,
        'Class': row.class
      };
      
      learningAreas.forEach(la => {
        exportRow[la] = row.subjectScores[la] ?? '--';
      });
      
      exportRow['Total'] = row.totalScore;
      exportRow['Average (%)'] = row.average.toFixed(1);
      exportRow['Grade'] = row.grade;
      
      return exportRow;
    });

    const highlightsData = [
      { Category: 'Best Student', Name: highlights?.bestStudent?.name, Detail: `${highlights?.bestStudent?.average.toFixed(1)}% (Rank 1)` },
    ];

    if (highlights?.mostImproved) {
      highlightsData.push({ 
        Category: 'Most Improved', 
        Name: highlights.mostImproved.name, 
        Detail: `+${highlights.mostImproved.improvement.toFixed(1)}% from ${highlights.previousExamTitle}` 
      });
    }

    if (highlights?.mostDropped) {
      highlightsData.push({ 
        Category: 'Most Dropped', 
        Name: highlights.mostDropped.name, 
        Detail: `${highlights.mostDropped.improvement.toFixed(1)}% from ${highlights.previousExamTitle}` 
      });
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(mainSheetData);
    const wsHighlights = XLSX.utils.json_to_sheet(highlightsData);
    
    XLSX.utils.book_append_sheet(wb, ws, "Full Analysis");
    XLSX.utils.book_append_sheet(wb, wsHighlights, "Highlights");
    
    XLSX.writeFile(wb, `${exam?.title}_Analysis.xlsx`);
  };

  const handleUpdateSchool = (e: FormEvent) => {
    e.preventDefault();
    const allSchools = JSON.parse(localStorage.getItem('alakara_schools') || '[]');
    const updatedSchools = allSchools.map((s: any) => 
      s.id === school.id ? { ...s, ...schoolSettings } : s
    );
    localStorage.setItem('alakara_schools', JSON.stringify(updatedSchools));
    
    // Update current school too
    const currentSchool = JSON.parse(localStorage.getItem('alakara_current_school') || '{}');
    localStorage.setItem('alakara_current_school', JSON.stringify({ ...currentSchool, ...schoolSettings }));
    
    setSchool({ ...school, ...schoolSettings });
    alert('School settings updated successfully!');
  };

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSchoolSettings({ ...schoolSettings, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  if (!school) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-kenya-black text-white flex flex-col shrink-0">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-kenya-green p-2 rounded-lg">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">Alakara <span className="text-kenya-red">Principal</span></span>
          </div>

          <nav className="space-y-2">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'dashboard' ? 'bg-kenya-green text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('staff')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isSuspended ? 'opacity-50 cursor-not-allowed' : activeTab === 'staff' ? 'bg-kenya-green text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`} 
              disabled={isSuspended}
            >
              <Users className="w-5 h-5" />
              Staff Management
            </button>
            <button 
              onClick={() => setActiveTab('students')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isSuspended ? 'opacity-50 cursor-not-allowed' : activeTab === 'students' ? 'bg-kenya-green text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`} 
              disabled={isSuspended}
            >
              <UserCheck className="w-5 h-5" />
              Student Management
            </button>
            <button 
              onClick={() => setActiveTab('classes')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isSuspended ? 'opacity-50 cursor-not-allowed' : activeTab === 'classes' ? 'bg-kenya-green text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`} 
              disabled={isSuspended}
            >
              <Library className="w-5 h-5" />
              Class Management
            </button>
            <button 
              onClick={() => setActiveTab('academic')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isSuspended ? 'opacity-50 cursor-not-allowed' : activeTab === 'academic' ? 'bg-kenya-green text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`} 
              disabled={isSuspended}
            >
              <BookOpen className="w-5 h-5" />
              Academic Records
            </button>

            <button 
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isSuspended ? 'opacity-50 cursor-not-allowed' : activeTab === 'settings' ? 'bg-kenya-green text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`} 
              disabled={isSuspended}
            >
              <Settings className="w-5 h-5" />
              School Settings
            </button>
          </nav>
        </div>

        <div className="mt-auto p-8">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-kenya-red transition-all"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="font-bold text-kenya-black text-lg">{school.name}</h2>
            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${isSuspended ? 'bg-kenya-red/10 text-kenya-red' : 'bg-kenya-green/10 text-kenya-green'}`}>
              {school.status}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell role="principal" userId={school.id} />
            <div className="h-8 w-px bg-gray-200 mx-2" />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-kenya-black">Principal</p>
                <p className="text-xs text-gray-500">{school.location}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center">
                <Users className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          {daysToExpiry !== null && daysToExpiry <= 15 && daysToExpiry > 0 && !isSuspended && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 bg-amber-500 p-6 rounded-[2rem] text-white shadow-xl flex flex-col md:flex-row items-center gap-6 border-4 border-white/20"
            >
              <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md">
                <AlertTriangle className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-black uppercase tracking-tight">Subscription Expiring Soon</h3>
                <p className="font-bold text-white/90">
                  Your system access will be automatically suspended in <span className="text-2xl font-black underline decoration-white/40">{daysToExpiry} days</span>.
                </p>
              </div>
              <div className="bg-white/10 px-6 py-3 rounded-2xl font-black text-xl border border-white/20">
                Expires: {new Date(school.subscriptionExpiresAt).toLocaleDateString()}
              </div>
            </motion.div>
          )}

          {isSuspended && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 bg-kenya-red p-8 rounded-[2rem] text-white shadow-2xl shadow-kenya-red/30 flex flex-col md:flex-row items-center gap-8 border-4 border-white/20"
            >
              <div className="bg-white/20 p-6 rounded-3xl backdrop-blur-md">
                <AlertTriangle className="w-16 h-16 text-white animate-pulse" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl font-black mb-2 uppercase tracking-tight">
                  {daysToExpiry !== null && daysToExpiry <= 0 ? 'Subscription Expired' : 'Account Suspended'}
                </h2>
                <p className="text-xl font-bold text-white/90 mb-6">
                  {daysToExpiry !== null && daysToExpiry <= 0 
                    ? 'Your school subscription has expired. Please renew to regain access to management features.'
                    : 'Access to school management features has been restricted by the system administrator.'}
                </p>
                <div className="inline-flex items-center gap-4 bg-white text-kenya-red px-8 py-4 rounded-2xl font-black text-2xl shadow-lg">
                  <Phone className="w-8 h-8" />
                  REQUEST AN ADMIN TO ACTIVATE YOUR USAGE CALL 0713209373
                </div>
              </div>
            </motion.div>
          )}

          <div className={`space-y-8 ${isSuspended ? 'opacity-40 pointer-events-none grayscale' : ''}`}>
            {activeTab === 'dashboard' ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">Total Students</p>
                    <p className="text-3xl font-bold text-kenya-black">{students.length}</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">Active Teachers</p>
                    <p className="text-3xl font-bold text-kenya-black">{staff.length}</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">Upcoming Exams</p>
                    <p className="text-3xl font-bold text-kenya-black">{exams.filter(e => e.status === 'Active').length}</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                  <h3 className="text-xl font-bold text-kenya-black mb-6">Class Performance Comparison</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={classPerformance}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                        <Tooltip 
                          contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                        />
                        <Bar dataKey="average" fill="#006633" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                    <h3 className="text-xl font-bold text-kenya-black mb-6">Subject Pass Rates (%)</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={subjectStats} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                          <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10}} />
                          <YAxis dataKey="subject" type="category" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10}} width={80} />
                          <Tooltip 
                            contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                          />
                          <Bar dataKey="passRate" fill="#006633" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                    <h3 className="text-xl font-bold text-kenya-black mb-6">Gender Performance Comparison</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={genderStats}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="average"
                            nameKey="gender"
                          >
                            <Cell fill="#006633" />
                            <Cell fill="#990000" />
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </>
            ) : activeTab === 'staff' ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-kenya-black">Staff Management</h2>
                    <p className="text-gray-500">Manage your teaching and administrative faculty.</p>
                  </div>
                  <Button onClick={() => setShowAddStaffModal(true)} className="gap-2">
                    <UserPlus className="w-4 h-4" />
                    Add Faculty Member
                  </Button>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <th className="px-6 py-4">Name & Email</th>
                        <th className="px-6 py-4">Current Role</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {staff.map((member) => (
                        <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-kenya-black">{member.name}</p>
                            <p className="text-xs text-gray-500">{member.email}</p>
                          </td>
                          <td className="px-6 py-4">
                            <select 
                              value={member.role}
                              onChange={(e) => updateStaffRole(member.id, e.target.value)}
                              className="bg-gray-50 border border-gray-200 rounded-lg text-sm px-2 py-1 focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                            >
                              <option value="Teacher">Teacher</option>
                              <option value="Head of Science">Head of Science</option>
                              <option value="Head of Arts">Head of Arts</option>
                              <option value="Senior Teacher">Senior Teacher</option>
                              <option value="Admin">Admin</option>
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-kenya-green/10 text-kenya-green">
                              {member.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => openEditStaff(member)}
                                className="p-2 text-gray-400 hover:text-kenya-green transition-colors"
                                title="Edit Staff"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => removeStaff(member.id)}
                                className="p-2 text-gray-400 hover:text-kenya-red transition-colors"
                                title="Remove Staff"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : activeTab === 'students' ? (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-kenya-black">Student Management</h2>
                    <p className="text-gray-500">Register and manage your school's learners.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <input 
                      type="file" 
                      id="bulk-student-upload" 
                      className="hidden" 
                      accept=".xlsx, .xls, .csv"
                      onChange={handleBulkStudentUpload}
                    />
                    <Button 
                      variant="secondary" 
                      onClick={() => document.getElementById('bulk-student-upload')?.click()}
                      className="gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Bulk Import
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={downloadStudentTemplate}
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Template
                    </Button>
                    <Button onClick={() => setShowAddStudentModal(true)} className="gap-2">
                      <UserPlus className="w-4 h-4" />
                      Add Individual Learner
                    </Button>
                  </div>
                </div>

                {/* Search and Sort Controls */}
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text"
                      placeholder="Search by name or admission number..."
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                    />
                  </div>
                  <div className="flex items-center gap-4 shrink-0 w-full md:w-auto">
                    <div className="flex items-center gap-2 flex-1 md:flex-none">
                      <Filter className="w-4 h-4 text-gray-400" />
                      <select 
                        value={selectedClassFilter}
                        onChange={(e) => setSelectedClassFilter(e.target.value)}
                        className="bg-gray-50 border border-gray-200 rounded-xl text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-kenya-green/20 min-w-[120px]"
                      >
                        <option value="All">All Classes</option>
                        {Array.from(new Set(students.map(s => s.class))).sort().map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-500">Sort:</span>
                      <button 
                        onClick={() => toggleStudentSort('name')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${studentSortBy === 'name' ? 'bg-kenya-green text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      >
                        Name
                        {studentSortBy === 'name' && <ArrowUpDown className="w-3 h-3" />}
                      </button>
                      <button 
                        onClick={() => toggleStudentSort('adm')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${studentSortBy === 'adm' ? 'bg-kenya-green text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      >
                        Adm
                        {studentSortBy === 'adm' && <ArrowUpDown className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  {Object.keys(groupedStudents).sort().map((className) => (
                    <div key={className} className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-gray-200" />
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest px-4 py-1 bg-gray-100 rounded-full">
                          {className} ({groupedStudents[className].length})
                        </h3>
                        <div className="h-px flex-1 bg-gray-200" />
                      </div>
                      
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                              <th className="px-6 py-4">Name</th>
                              <th className="px-6 py-4">Admission No</th>
                              <th className="px-6 py-4">Status</th>
                              <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {groupedStudents[className].map((student: any) => (
                              <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4 font-bold text-kenya-black">{student.name}</td>
                                <td className="px-6 py-4 font-mono text-sm text-gray-500">{student.adm}</td>
                                <td className="px-6 py-4">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-kenya-green/10 text-kenya-green">
                                    {student.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button 
                                      onClick={() => openEditMarks(student)}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold hover:bg-kenya-green hover:text-white transition-all"
                                      title="Manage Marks"
                                    >
                                      <ClipboardList className="w-3 h-3" />
                                      Marks
                                    </button>
                                    <button 
                                      onClick={() => openEditStudent(student)}
                                      className="p-2 text-gray-400 hover:text-kenya-green transition-colors"
                                      title="Edit Student"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={() => removeStudent(student.id)}
                                      className="p-2 text-gray-400 hover:text-kenya-red transition-colors"
                                      title="Remove Student"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                  
                  {Object.keys(groupedStudents).length === 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Search className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-400 italic">No students found matching your criteria.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : activeTab === 'classes' ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-kenya-black">Class Management</h2>
                    <p className="text-gray-500">Create and manage classes and assign class teachers.</p>
                  </div>
                  <Button onClick={() => setShowAddClassModal(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add New Class
                  </Button>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <th className="px-6 py-4">Class Name</th>
                        <th className="px-6 py-4">Class Teacher</th>
                        <th className="px-6 py-4">Capacity</th>
                        <th className="px-6 py-4">Students Enrolled</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {classes.map((cls) => {
                        const teacher = staff.find(s => s.id === cls.teacherId);
                        const enrolled = students.filter(s => s.class === cls.name).length;
                        return (
                          <tr key={cls.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-kenya-black">{cls.name}</td>
                            <td className="px-6 py-4 text-gray-600">{teacher ? teacher.name : <span className="text-gray-400 italic">Not Assigned</span>}</td>
                            <td className="px-6 py-4 text-gray-600">{cls.capacity}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${enrolled >= cls.capacity ? 'bg-kenya-red/10 text-kenya-red' : 'bg-kenya-green/10 text-kenya-green'}`}>
                                {enrolled} / {cls.capacity}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => openEditClass(cls)}
                                  className="p-2 text-gray-400 hover:text-kenya-green transition-colors"
                                  title="Edit Class"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => removeClass(cls.id)}
                                  className="p-2 text-gray-400 hover:text-kenya-red transition-colors"
                                  title="Remove Class"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : activeTab === 'academic' ? (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-kenya-black">Academic Management</h2>
                    <p className="text-gray-500">Oversee exams, grading, and student performance.</p>
                  </div>
                  {academicSubTab !== 'overview' && (
                    <Button variant="ghost" onClick={() => setAcademicSubTab('overview')} className="gap-2">
                      Back to Academic Overview
                    </Button>
                  )}
                </div>

                {academicSubTab === 'overview' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                      { id: 'create-exam', title: 'Create New Exam', desc: 'Schedule and set up new examinations.', icon: PlusCircle, color: 'text-kenya-green', bg: 'bg-kenya-green/10' },
                      { id: 'edit-exam', title: 'Edit Exams & Marks', desc: 'Modify exam marks and configurations.', icon: Edit3, color: 'text-purple-600', bg: 'bg-purple-50' },
                      { id: 'learning-area', title: 'Learning Areas', desc: 'Manage subjects and curriculum areas.', icon: Library, color: 'text-blue-600', bg: 'bg-blue-50' },
                      { id: 'grading', title: 'Grading System', desc: 'Define grade boundaries and scales.', icon: ClipboardList, color: 'text-orange-600', bg: 'bg-orange-50' },
                      { id: 'analysis', title: 'Analyse Results', desc: 'Deep dive into student performance data.', icon: BarChart3, color: 'text-kenya-red', bg: 'bg-kenya-red/10' },
                      { id: 'results-processing', title: 'Results Processing', desc: 'Subject champions and top performers.', icon: Trophy, color: 'text-yellow-600', bg: 'bg-yellow-50' },
                      { id: 'reports', title: 'Generate Report Cards', desc: 'Produce and distribute student reports.', icon: FileSpreadsheet, color: 'text-purple-600', bg: 'bg-purple-50' },
                      { id: 'academic-settings', title: 'Academic Settings', desc: 'Configure assessments and ranking logic.', icon: Settings, color: 'text-gray-600', bg: 'bg-gray-100' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setAcademicSubTab(item.id as any)}
                        className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-left group"
                      >
                        <div className={`w-12 h-12 ${item.bg} ${item.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                          <item.icon className="w-6 h-6" />
                        </div>
                        <h4 className="font-bold text-kenya-black mb-1 flex items-center justify-between">
                          {item.title}
                          <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </h4>
                        <p className="text-sm text-gray-500">{item.desc}</p>
                      </button>
                    ))}
                  </div>
                ) : academicSubTab === 'edit-exam' ? (
                  <div className="space-y-8">
                    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                          <h3 className="text-xl font-bold text-kenya-black">Edit Exams & Marks</h3>
                          <p className="text-sm text-gray-500">Modify marks for specific classes and subjects.</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                          <select 
                            value={selectedEditClass}
                            onChange={(e) => setSelectedEditClass(e.target.value)}
                            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 font-bold text-sm"
                          >
                            <option value="">Select Class...</option>
                            {classes.map(c => (
                              <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                          </select>
                          <select 
                            value={selectedEditSubject}
                            onChange={(e) => setSelectedEditSubject(e.target.value)}
                            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 font-bold text-sm"
                          >
                            <option value="">Select Subject...</option>
                            {learningAreas.map(la => (
                              <option key={la} value={la}>{la}</option>
                            ))}
                          </select>
                          <select 
                            value={selectedEditExamId}
                            onChange={(e) => setSelectedEditExamId(e.target.value)}
                            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 font-bold text-sm"
                          >
                            <option value="">Select Examination...</option>
                            {exams.map(e => (
                              <option key={e.id} value={e.id}>{e.title}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {(!selectedEditClass || !selectedEditSubject || !selectedEditExamId) ? (
                        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                          <Edit3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-400 font-medium italic">Select class, subject, and examination to edit marks.</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <table className="w-full text-left">
                              <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                                <tr>
                                  <th className="px-6 py-4">Admission No</th>
                                  <th className="px-6 py-4">Student Name</th>
                                  <th className="px-6 py-4">Score (0-100)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {editMarksData.map((data, idx) => (
                                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-sm">{data.adm}</td>
                                    <td className="px-6 py-4 font-bold text-kenya-black">{data.name}</td>
                                    <td className="px-6 py-4">
                                      <input 
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={data.score}
                                        onChange={(e) => handleEditMarkChange(data.studentId, e.target.value)}
                                        className="w-24 px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 font-bold"
                                        placeholder="--"
                                      />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <div className="flex justify-end">
                            <Button onClick={() => setShowEditConfirmModal(true)}>Save Changes</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : academicSubTab === 'create-exam' ? (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-2xl mx-auto">
                    <h3 className="text-xl font-bold text-kenya-black mb-6">Setup New Examination</h3>
                    <form onSubmit={handleCreateExam} className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2 col-span-2">
                          <label className="text-sm font-bold text-kenya-black">Exam Title</label>
                          <input 
                            type="text" required
                            value={newExam.title}
                            onChange={(e) => setNewExam({...newExam, title: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                            placeholder="e.g. End of Term 1 Exams"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-kenya-black">Term</label>
                          <select 
                            value={newExam.term}
                            onChange={(e) => setNewExam({...newExam, term: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                          >
                            <option>Term 1</option>
                            <option>Term 2</option>
                            <option>Term 3</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-kenya-black">Year</label>
                          <select 
                            value={newExam.year}
                            onChange={(e) => setNewExam({...newExam, year: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                          >
                            <option>2024</option>
                            <option>2025</option>
                            <option>2026</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-bold text-kenya-black">Target Classes</label>
                        <div className="grid grid-cols-3 gap-3">
                          {classes.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => toggleClassSelection(c.name)}
                              className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                                newExam.classes.includes(c.name)
                                  ? 'bg-kenya-green text-white border-kenya-green'
                                  : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-kenya-green/50'
                              }`}
                            >
                              {c.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6 pt-4">
                        <Button type="button" variant="ghost" onClick={() => setAcademicSubTab('overview')} className="w-full">Cancel</Button>
                        <Button type="submit" className="w-full">Create & Activate Exam</Button>
                      </div>
                    </form>
                  </div>
                ) : academicSubTab === 'learning-area' ? (
                  <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                      <h3 className="text-xl font-bold text-kenya-black mb-6">Manage Learning Areas</h3>
                      <div className="flex gap-4 mb-8">
                        <input 
                          type="text" 
                          id="new-la-input"
                          placeholder="Enter subject name..."
                          className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              addLearningArea((e.target as HTMLInputElement).value);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }}
                        />
                        <Button onClick={() => {
                          const input = document.getElementById('new-la-input') as HTMLInputElement;
                          addLearningArea(input.value);
                          input.value = '';
                        }}>Add Subject</Button>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {learningAreas.map((la) => (
                          <div key={la} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 group">
                            <span className="font-bold text-kenya-black">{la}</span>
                            <button 
                              onClick={() => removeLearningArea(la)}
                              className="p-2 text-gray-400 hover:text-kenya-red opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : academicSubTab === 'grading' ? (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-kenya-black">Grading System Configuration</h3>
                        <p className="text-sm text-gray-500">Adjust grade boundaries and points for the current term.</p>
                      </div>
                      <Button onClick={addGrade} size="sm" className="gap-2">
                        <Plus className="w-4 h-4" />
                        Add Grade
                      </Button>
                    </div>
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                          <th className="px-6 py-4">Grade</th>
                          <th className="px-6 py-4">Min Score</th>
                          <th className="px-6 py-4">Max Score</th>
                          <th className="px-6 py-4">Points</th>
                          <th className="px-6 py-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {gradingSystem.map((g, idx) => (
                          <tr key={idx}>
                            <td className="px-6 py-4">
                              <input 
                                type="text" 
                                value={g.grade}
                                onChange={(e) => updateGradeBoundary(idx, 'grade', e.target.value)}
                                className="w-20 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-kenya-green/20 font-black text-kenya-black"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <input 
                                type="number" 
                                value={g.min}
                                onChange={(e) => updateGradeBoundary(idx, 'min', parseInt(e.target.value))}
                                className="w-20 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <input 
                                type="number" 
                                value={g.max}
                                onChange={(e) => updateGradeBoundary(idx, 'max', parseInt(e.target.value))}
                                className="w-20 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <input 
                                type="number" 
                                value={g.points}
                                onChange={(e) => updateGradeBoundary(idx, 'points', parseInt(e.target.value))}
                                className="w-20 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <button 
                                onClick={() => removeGrade(idx)}
                                className="p-2 text-gray-400 hover:text-kenya-red transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : academicSubTab === 'academic-settings' ? (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Assessment Categories */}
                      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-xl font-bold text-kenya-black">Assessment Categories</h3>
                          <Button variant="ghost" size="sm" onClick={() => {
                            const name = prompt('Enter category name (e.g. CAT 1):');
                            const max = prompt('Enter maximum score:');
                            if (name && max) {
                              setAssessmentCategories([...assessmentCategories, { id: name.toLowerCase().replace(/\s+/g, '-'), name, maxScore: parseInt(max) }]);
                            }
                          }}>
                            <Plus className="w-4 h-4 mr-2" /> Add Category
                          </Button>
                        </div>
                        <div className="space-y-4">
                          {assessmentCategories.map((cat, idx) => (
                            <div key={cat.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                              <div>
                                <p className="font-bold text-kenya-black">{cat.name}</p>
                                <p className="text-xs text-gray-500">Max Score: {cat.maxScore}</p>
                              </div>
                              <button 
                                onClick={() => setAssessmentCategories(assessmentCategories.filter((_, i) => i !== idx))}
                                className="p-2 text-gray-400 hover:text-kenya-red transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Ranking Logic */}
                      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                        <h3 className="text-xl font-bold text-kenya-black mb-6">Ranking Logic Configuration</h3>
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-500 uppercase">Primary Ranking Criteria</label>
                            <select 
                              value={rankingLogic.primaryCriteria}
                              onChange={(e) => setRankingLogic({...rankingLogic, primaryCriteria: e.target.value})}
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                            >
                              <option value="aggregate_total">Aggregate Total Marks</option>
                              <option value="average_score">Overall Average Score</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-500 uppercase">Core Subjects (Tie-Breakers)</label>
                            <div className="grid grid-cols-2 gap-2">
                              {learningAreas.map(la => (
                                <label key={la} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer">
                                  <input 
                                    type="checkbox"
                                    checked={rankingLogic.coreSubjects.includes(la)}
                                    onChange={(e) => {
                                      const subjects = e.target.checked 
                                        ? [...rankingLogic.coreSubjects, la]
                                        : rankingLogic.coreSubjects.filter((s: string) => s !== la);
                                      setRankingLogic({...rankingLogic, coreSubjects: subjects});
                                    }}
                                    className="w-4 h-4 rounded border-gray-300 text-kenya-green"
                                  />
                                  <span className="text-xs font-medium text-gray-600">{la}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Exam Locking Control */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                      <h3 className="text-xl font-bold text-kenya-black mb-6">Result Locking Control</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {exams.map(exam => (
                          <div key={exam.id} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                            <div>
                              <p className="font-bold text-kenya-black">{exam.title}</p>
                              <p className="text-xs text-gray-500">{exam.term} {exam.year}</p>
                            </div>
                            <Button 
                              variant={exam.locked ? 'secondary' : 'default'}
                              size="sm"
                              onClick={() => {
                                const newExams = exams.map(e => e.id === exam.id ? {...e, locked: !e.locked} : e);
                                setExams(newExams);
                              }}
                              className="gap-2"
                            >
                              {exam.locked ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                              {exam.locked ? 'Unlock' : 'Lock'}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : academicSubTab === 'analysis' ? (
                  <div className="space-y-8">
                    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                          <h3 className="text-xl font-bold text-kenya-black">Exam Analysis</h3>
                          <p className="text-sm text-gray-500">Select an examination to view detailed performance analysis.</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                          <select 
                            value={selectedAnalysisClass}
                            onChange={(e) => setSelectedAnalysisClass(e.target.value)}
                            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 font-bold text-sm"
                          >
                            <option value="All">All Classes</option>
                            {classes.map(c => (
                              <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                          </select>
                          <select 
                            value={selectedAnalysisExamId}
                            onChange={(e) => setSelectedAnalysisExamId(e.target.value)}
                            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 font-bold text-sm"
                          >
                            <option value="">Select Examination...</option>
                            {exams.map(e => (
                              <option key={e.id} value={e.id}>{e.title} ({e.term} {e.year})</option>
                            ))}
                          </select>
                          
                          {selectedAnalysisExamId && (
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input 
                                    type="checkbox"
                                    checked={analysisOptions.showGrades}
                                    onChange={(e) => setAnalysisOptions({...analysisOptions, showGrades: e.target.checked})}
                                    className="w-4 h-4 rounded border-gray-300 text-kenya-green focus:ring-kenya-green"
                                  />
                                  <span className="text-xs font-bold text-gray-600">Show Grades</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input 
                                    type="checkbox"
                                    checked={analysisOptions.showRank}
                                    onChange={(e) => setAnalysisOptions({...analysisOptions, showRank: e.target.checked})}
                                    className="w-4 h-4 rounded border-gray-300 text-kenya-green focus:ring-kenya-green"
                                  />
                                  <span className="text-xs font-bold text-gray-600">Show Rank</span>
                                </label>
                              </div>
                              <Button onClick={exportAnalysis} className="gap-2 py-2 text-xs">
                                <Download className="w-4 h-4" />
                                Export Analysis
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {!selectedAnalysisExamId ? (
                        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-400 font-medium italic">Please select an examination to begin analysis.</p>
                        </div>
                      ) : (
                        <div className="space-y-8">
                          {/* Highlights Section */}
                          {getAnalysisHighlights() && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-kenya-green/5 border border-kenya-green/10 p-4 rounded-2xl">
                                <p className="text-[10px] font-black text-kenya-green uppercase tracking-widest mb-1">Best Student</p>
                                <p className="text-lg font-black text-kenya-black">{getAnalysisHighlights()?.bestStudent?.name}</p>
                                <p className="text-xs font-bold text-gray-500">{getAnalysisHighlights()?.bestStudent?.average.toFixed(1)}% Mean Score</p>
                              </div>
                              
                              {getAnalysisHighlights()?.mostImproved && (
                                <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl">
                                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Most Improved</p>
                                  <p className="text-lg font-black text-kenya-black">{getAnalysisHighlights()?.mostImproved?.name}</p>
                                  <p className="text-xs font-bold text-blue-500">+{getAnalysisHighlights()?.mostImproved?.improvement.toFixed(1)}% from {getAnalysisHighlights()?.previousExamTitle}</p>
                                </div>
                              )}

                              {getAnalysisHighlights()?.mostDropped && (
                                <div className="bg-kenya-red/5 border border-kenya-red/10 p-4 rounded-2xl">
                                  <p className="text-[10px] font-black text-kenya-red uppercase tracking-widest mb-1">Most Dropped</p>
                                  <p className="text-lg font-black text-kenya-black">{getAnalysisHighlights()?.mostDropped?.name}</p>
                                  <p className="text-xs font-bold text-kenya-red">{getAnalysisHighlights()?.mostDropped?.improvement.toFixed(1)}% from {getAnalysisHighlights()?.previousExamTitle}</p>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-wider border-b border-gray-100">
                                {analysisOptions.showRank && <th className="px-4 py-4 sticky left-0 bg-gray-50 z-10">Rank</th>}
                                <th className="px-4 py-4 sticky left-0 bg-gray-50 z-10">Adm No</th>
                                <th className="px-4 py-4 sticky left-0 bg-gray-50 z-10 min-w-[150px]">Student Name</th>
                                {learningAreas.map(la => (
                                  <th key={la} className="px-4 py-4 text-center min-w-[80px]">{la}</th>
                                ))}
                                <th className="px-4 py-4 text-center font-black text-kenya-black">Total</th>
                                <th className="px-4 py-4 text-center font-black text-kenya-black">Avg</th>
                                {analysisOptions.showGrades && <th className="px-4 py-4 text-center font-black text-kenya-black">Grade</th>}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {analysisData.map((row: any) => (
                                <tr key={row.id} className="hover:bg-gray-50/50 transition-colors text-sm">
                                  {analysisOptions.showRank && (
                                    <td className="px-4 py-4 sticky left-0 bg-white z-10">
                                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-black ${
                                        row.rank === 1 ? 'bg-yellow-100 text-yellow-700' : 
                                        row.rank === 2 ? 'bg-gray-100 text-gray-600' :
                                        row.rank === 3 ? 'bg-orange-100 text-orange-700' : 'text-gray-400'
                                      }`}>
                                        {row.rank}
                                      </span>
                                    </td>
                                  )}
                                  <td className="px-4 py-4 font-mono text-xs text-gray-500 sticky left-0 bg-white z-10">{row.adm}</td>
                                  <td className="px-4 py-4 font-bold text-kenya-black sticky left-0 bg-white z-10">{row.name}</td>
                                  {learningAreas.map(la => {
                                    const score = row.subjectScores[la];
                                    const gradeObj = gradingSystem.find(g => score !== null && score >= g.min && score <= g.max);
                                    return (
                                      <td key={la} className="px-4 py-4 text-center">
                                        <div className="flex flex-col items-center">
                                          <span className={`font-bold ${score === null ? 'text-gray-300' : 'text-kenya-black'}`}>
                                            {score !== null ? score : '--'}
                                          </span>
                                          {analysisOptions.showGrades && score !== null && (
                                            <span className="text-[10px] font-black text-kenya-green">{gradeObj?.grade}</span>
                                          )}
                                        </div>
                                      </td>
                                    );
                                  })}
                                  <td className="px-4 py-4 text-center font-black text-kenya-black">{row.totalScore.toFixed(0)}</td>
                                  <td className="px-4 py-4 text-center font-bold text-kenya-green">{row.average.toFixed(1)}%</td>
                                  {analysisOptions.showGrades && (
                                    <td className="px-4 py-4 text-center">
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-kenya-green/10 text-kenya-green">
                                        {row.grade}
                                      </span>
                                    </td>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                        <h3 className="text-xl font-bold text-kenya-black mb-6">Subject Performance Averages</h3>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={mockAnalysisData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                              <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                              <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                              <Tooltip 
                                contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                                cursor={{fill: '#f9fafb'}}
                              />
                              <Bar dataKey="average" fill="#006633" radius={[8, 8, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      
                      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                        <h3 className="text-xl font-bold text-kenya-black mb-6">Performance Range (Top vs Bottom)</h3>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={mockAnalysisData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                              <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                              <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                              <Tooltip 
                                contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                              />
                              <Legend />
                              <Line type="monotone" dataKey="top" stroke="#006633" strokeWidth={3} dot={{r: 6, fill: '#006633'}} />
                              <Line type="monotone" dataKey="bottom" stroke="#990000" strokeWidth={3} dot={{r: 6, fill: '#990000'}} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                      <h3 className="text-xl font-bold text-kenya-black mb-6">Examination Management</h3>
                      <div className="overflow-hidden">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                              <th className="px-6 py-4">Exam Title</th>
                              <th className="px-6 py-4">Term/Year</th>
                              <th className="px-6 py-4">Status</th>
                              <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {exams.map((exam) => (
                              <tr key={exam.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                  <p className="font-bold text-kenya-black">{exam.title}</p>
                                  <p className="text-xs text-gray-500">{exam.classes.join(', ')}</p>
                                </td>
                                <td className="px-6 py-4">
                                  <p className="text-sm text-kenya-black">{exam.term} {exam.year}</p>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    exam.status === 'Active' ? 'bg-kenya-green/10 text-kenya-green' : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    {exam.status === 'Active' ? 'Open for Marks' : 'Processed'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    {exam.status === 'Active' ? (
                                      <button 
                                        onClick={() => processExam(exam.id)}
                                        className="p-2 text-kenya-green hover:bg-kenya-green/10 rounded-lg transition-colors"
                                        title="Process & Lock Marks"
                                      >
                                        <CheckCircle2 className="w-4 h-4" />
                                      </button>
                                    ) : (
                                      <button 
                                        onClick={() => recallExam(exam.id)}
                                        className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                                        title="Recall Exam (Allow Editing)"
                                      >
                                        <ArrowUpDown className="w-4 h-4" />
                                      </button>
                                    )}
                                    <button 
                                      onClick={() => deleteExam(exam.id)}
                                      className="p-2 text-gray-400 hover:text-kenya-red transition-colors"
                                      title="Delete Exam"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : academicSubTab === 'results-processing' ? (
                  <div className="space-y-8">
                    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                          <h3 className="text-xl font-bold text-kenya-black">Results Processing</h3>
                          <p className="text-sm text-gray-500">Manage bulk uploads and identify top performers.</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                          <select 
                            value={selectedProcessingClass}
                            onChange={(e) => setSelectedProcessingClass(e.target.value)}
                            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 font-bold text-sm"
                          >
                            <option value="All">All Classes</option>
                            {classes.map(c => (
                              <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                          </select>
                          <select 
                            value={selectedProcessingExamId}
                            onChange={(e) => setSelectedProcessingExamId(e.target.value)}
                            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 font-bold text-sm"
                          >
                            <option value="">Select Examination...</option>
                            {exams.map(e => (
                              <option key={e.id} value={e.id}>{e.title}</option>
                            ))}
                          </select>
                          
                          <div className="flex items-center gap-2">
                            <Button onClick={downloadBulkMarksTemplate} variant="ghost" size="sm" className="gap-2">
                              <Download className="w-4 h-4" />
                              Template
                            </Button>
                            <label className="cursor-pointer">
                              <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleBulkMarksUpload} />
                              <div className="bg-kenya-green text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-kenya-green/90 transition-colors">
                                <Upload className="w-4 h-4" />
                                Bulk Upload
                              </div>
                            </label>
                          </div>
                        </div>
                      </div>

                      {!selectedProcessingExamId ? (
                        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-400 font-medium italic">Select an examination to begin processing results.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          {/* Subject Champions */}
                          <div className="space-y-6">
                            <div className="flex items-center justify-between">
                              <h4 className="font-black text-kenya-black uppercase tracking-widest text-sm">Subject Champions</h4>
                              <span className="text-[10px] font-bold text-gray-400 uppercase">Top Performer per subject</span>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                              {getSubjectChampions().map((item, idx) => (
                                <div key={idx} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between group hover:border-kenya-green/30 transition-all">
                                  <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm font-black text-kenya-green">
                                      {item.subject.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.subject}</p>
                                      <p className="font-bold text-kenya-black">{item.champion ? item.champion.studentName : 'No data'}</p>
                                    </div>
                                  </div>
                                  {item.champion && (
                                    <div className="text-right">
                                      <p className="text-lg font-black text-kenya-green">{item.champion.score}%</p>
                                      <p className="text-[10px] font-bold text-gray-400 uppercase">{item.champion.studentClass}</p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Top Overall Performers */}
                          <div className="space-y-6">
                            <div className="flex items-center justify-between">
                              <h4 className="font-black text-kenya-black uppercase tracking-widest text-sm">Overall Merit List</h4>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Show Top</span>
                                <select 
                                  value={topXCount}
                                  onChange={(e) => setTopXCount(parseInt(e.target.value))}
                                  className="text-[10px] font-black bg-white border border-gray-200 rounded px-1 py-0.5 focus:outline-none"
                                >
                                  <option value={3}>3</option>
                                  <option value={5}>5</option>
                                  <option value={10}>10</option>
                                  <option value={20}>20</option>
                                  <option value={50}>50</option>
                                </select>
                              </div>
                            </div>
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                              <table className="w-full text-left">
                                <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                                  <tr>
                                    <th className="px-4 py-3">Rank</th>
                                    <th className="px-4 py-3">Student</th>
                                    <th className="px-4 py-3 text-center">Avg</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {getTopStudents().map((student, idx) => (
                                    <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                                      <td className="px-4 py-3">
                                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-black ${
                                          idx === 0 ? 'bg-yellow-100 text-yellow-700' : 
                                          idx === 1 ? 'bg-gray-100 text-gray-600' :
                                          idx === 2 ? 'bg-orange-100 text-orange-700' : 'text-gray-400'
                                        }`}>
                                          {idx + 1}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3">
                                        <p className="text-sm font-bold text-kenya-black">{student.name}</p>
                                        <p className="text-[10px] text-gray-500">{student.adm} • {student.class}</p>
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        <span className="text-sm font-black text-kenya-green">{student.average.toFixed(1)}%</span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Most Improved */}
                          <div className="space-y-6">
                            <div className="flex items-center justify-between">
                              <h4 className="font-black text-kenya-black uppercase tracking-widest text-sm">Most Improved</h4>
                              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Top positive growth</span>
                            </div>
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                              <table className="w-full text-left">
                                <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                                  <tr>
                                    <th className="px-4 py-3">Student</th>
                                    <th className="px-4 py-3 text-center">Growth</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {getMostImproved(5).map((student, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                      <td className="px-4 py-3">
                                        <p className="font-bold text-kenya-black text-xs">{student.name}</p>
                                        <p className="text-[10px] text-gray-500">{student.adm}</p>
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        <span className="font-black text-blue-600">+{student.improvement.toFixed(1)}</span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Most Dropped */}
                          <div className="space-y-6">
                            <div className="flex items-center justify-between">
                              <h4 className="font-black text-kenya-black uppercase tracking-widest text-sm">Most Dropped</h4>
                              <span className="text-[10px] font-bold text-kenya-red uppercase tracking-wider">Highest performance drop</span>
                            </div>
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                              <table className="w-full text-left">
                                <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                                  <tr>
                                    <th className="px-4 py-3">Student</th>
                                    <th className="px-4 py-3 text-center">Drop</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {getMostDropped(5).map((student, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                      <td className="px-4 py-3">
                                        <p className="font-bold text-kenya-black text-xs">{student.name}</p>
                                        <p className="text-[10px] text-gray-500">{student.adm}</p>
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        <span className="font-black text-kenya-red">-{student.drop.toFixed(1)}</span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : academicSubTab === 'reports' ? (
                  <div className="max-w-4xl mx-auto space-y-8">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                      <h3 className="text-xl font-bold text-kenya-black mb-8">Generate Student Report Card</h3>
                      
                      <div className="space-y-8">
                        {/* Step 1: Select Student or Class */}
                        <div className="space-y-4">
                          <label className="text-sm font-black text-kenya-black uppercase tracking-wider">1. Select Learner or Class</label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative">
                              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <select 
                                value={reportConfig.selectedStudentId}
                                onChange={(e) => setReportConfig({...reportConfig, selectedStudentId: e.target.value})}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 appearance-none"
                              >
                                <option value="">Choose a student...</option>
                                {students.map(s => (
                                  <option key={s.id} value={s.id}>{s.name} ({s.adm}) - {s.class}</option>
                                ))}
                              </select>
                            </div>
                            <div className="relative">
                              <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <select 
                                onChange={(e) => {
                                  // In a real app, this would trigger a batch generation process
                                  if (e.target.value) {
                                    alert(`Class report generation for ${e.target.value} initiated. This will generate a combined PDF for all students in the class.`);
                                    e.target.value = '';
                                  }
                                }}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 appearance-none"
                              >
                                <option value="">Or generate for entire class...</option>
                                {classes.map(c => (
                                  <option key={c.id} value={c.name}>{c.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Step 2: Select Exams */}
                        <div className="space-y-4">
                          <label className="text-sm font-black text-kenya-black uppercase tracking-wider">2. Include Examinations</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {exams.map(exam => (
                              <label key={exam.id} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${reportConfig.selectedExamIds.includes(exam.id) ? 'bg-kenya-green/5 border-kenya-green' : 'bg-gray-50 border-gray-100 hover:border-gray-200'}`}>
                                <input 
                                  type="checkbox"
                                  checked={reportConfig.selectedExamIds.includes(exam.id)}
                                  onChange={() => {
                                    const newIds = reportConfig.selectedExamIds.includes(exam.id)
                                      ? reportConfig.selectedExamIds.filter(id => id !== exam.id)
                                      : [...reportConfig.selectedExamIds, exam.id];
                                    setReportConfig({...reportConfig, selectedExamIds: newIds});
                                  }}
                                  className="w-5 h-5 rounded border-gray-300 text-kenya-green focus:ring-kenya-green"
                                />
                                <div>
                                  <p className="font-bold text-kenya-black text-sm">{exam.title}</p>
                                  <p className="text-xs text-gray-500">{exam.term} {exam.year}</p>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Step 3: Report Options */}
                        <div className="space-y-4">
                          <label className="text-sm font-black text-kenya-black uppercase tracking-wider">3. Report Customization</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                            <div className="space-y-4">
                              <label className="flex items-center gap-3 cursor-pointer">
                                <input 
                                  type="checkbox"
                                  checked={reportConfig.includeAverages}
                                  onChange={(e) => setReportConfig({...reportConfig, includeAverages: e.target.checked})}
                                  className="w-4 h-4 rounded border-gray-300 text-kenya-green focus:ring-kenya-green"
                                />
                                <span className="text-sm font-bold text-kenya-black">Include Subject Averages</span>
                              </label>
                              <label className="flex items-center gap-3 cursor-pointer">
                                <input 
                                  type="checkbox"
                                  checked={reportConfig.includeGrades}
                                  onChange={(e) => setReportConfig({...reportConfig, includeGrades: e.target.checked})}
                                  className="w-4 h-4 rounded border-gray-300 text-kenya-green focus:ring-kenya-green"
                                />
                                <span className="text-sm font-bold text-kenya-black">Include Letter Grades</span>
                              </label>
                              <label className="flex items-center gap-3 cursor-pointer">
                                <input 
                                  type="checkbox"
                                  checked={reportConfig.includeLetterhead}
                                  onChange={(e) => setReportConfig({...reportConfig, includeLetterhead: e.target.checked})}
                                  className="w-4 h-4 rounded border-gray-300 text-kenya-green focus:ring-kenya-green"
                                />
                                <span className="text-sm font-bold text-kenya-black">Show School Letterhead</span>
                              </label>
                              <label className="flex items-center gap-3 cursor-pointer">
                                <input 
                                  type="checkbox"
                                  checked={reportConfig.includePerformanceTrend}
                                  onChange={(e) => setReportConfig({...reportConfig, includePerformanceTrend: e.target.checked})}
                                  className="w-4 h-4 rounded border-gray-300 text-kenya-green focus:ring-kenya-green"
                                />
                                <span className="text-sm font-bold text-kenya-black">Track Performance Trend</span>
                              </label>
                            </div>
                            <div className="space-y-2 col-span-2">
                              <label className="text-xs font-bold text-gray-500 uppercase">Report Card Template</label>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {[
                                  { id: 'classic', name: 'Classic' },
                                  { id: 'modern', name: 'Modern' },
                                  { id: 'graph', name: 'Graph-Based' },
                                  { id: 'primary', name: 'Primary' },
                                  { id: 'compact', name: 'Compact' },
                                ].map(t => (
                                  <button 
                                    key={t.id}
                                    onClick={() => setReportConfig({...reportConfig, templateType: t.id as any})}
                                    className={`py-2 rounded-lg text-xs font-bold border transition-all ${reportConfig.templateType === t.id ? 'bg-kenya-black text-white border-kenya-black' : 'bg-white text-gray-500 border-gray-200'}`}
                                  >
                                    {t.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-gray-500 uppercase">Performance Graph Type</label>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => setReportConfig({...reportConfig, graphType: 'bar'})}
                                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${reportConfig.graphType === 'bar' ? 'bg-kenya-black text-white border-kenya-black' : 'bg-white text-gray-500 border-gray-200'}`}
                                >
                                  Bar Chart
                                </button>
                                <button 
                                  onClick={() => setReportConfig({...reportConfig, graphType: 'line'})}
                                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${reportConfig.graphType === 'line' ? 'bg-kenya-black text-white border-kenya-black' : 'bg-white text-gray-500 border-gray-200'}`}
                                >
                                  Trend Line
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <Button onClick={handleGenerateReport} className="w-full py-4 rounded-xl font-black text-lg shadow-xl shadow-kenya-green/20">
                          Generate & Download Report Card
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <BookOpen className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-kenya-black mb-2 uppercase tracking-tight">
                      {academicSubTab.replace('-', ' ')}
                    </h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-8">
                      This module is being configured for the current academic term. Please check back shortly.
                    </p>
                    <Button onClick={() => setAcademicSubTab('overview')}>Return to Menu</Button>
                  </div>
                )}
              </div>
            ) : activeTab === 'settings' ? (
              <div className="max-w-5xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-black text-kenya-black uppercase tracking-tight">School Configuration</h1>
                    <p className="text-gray-500">Manage your institution's identity and communication standards.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: School Info Form */}
                  <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="p-8 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="text-xl font-bold text-kenya-black flex items-center gap-2">
                          <Building2 className="w-5 h-5 text-kenya-green" />
                          Institution Details
                        </h3>
                      </div>
                      
                      <div className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2 col-span-2">
                            <label className="text-sm font-bold text-kenya-black">School Name</label>
                            <input 
                              type="text" 
                              value={schoolSettings.name}
                              onChange={(e) => setSchoolSettings({...schoolSettings, name: e.target.value})}
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                              placeholder="e.g. Alakara High School"
                            />
                          </div>
                          <div className="space-y-2 col-span-2">
                            <label className="text-sm font-bold text-kenya-black">School Motto</label>
                            <div className="relative">
                              <Quote className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input 
                                type="text" 
                                value={schoolSettings.motto}
                                onChange={(e) => setSchoolSettings({...schoolSettings, motto: e.target.value})}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                                placeholder="e.g. Excellence in Service"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-kenya-black">Official Email</label>
                            <div className="relative">
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input 
                                type="email" 
                                value={schoolSettings.email}
                                onChange={(e) => setSchoolSettings({...schoolSettings, email: e.target.value})}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                                placeholder="info@school.ac.ke"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-kenya-black">Phone Number</label>
                            <div className="relative">
                              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input 
                                type="text" 
                                value={schoolSettings.phone}
                                onChange={(e) => setSchoolSettings({...schoolSettings, phone: e.target.value})}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                                placeholder="+254 700 000 000"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-kenya-black">Website</label>
                            <div className="relative">
                              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input 
                                type="text" 
                                value={schoolSettings.website}
                                onChange={(e) => setSchoolSettings({...schoolSettings, website: e.target.value})}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                                placeholder="www.school.ac.ke"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-kenya-black">Physical Address</label>
                            <input 
                              type="text" 
                              value={schoolSettings.address}
                              onChange={(e) => setSchoolSettings({...schoolSettings, address: e.target.value})}
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                              placeholder="P.O. Box 123, Nairobi"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="p-8 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="text-xl font-bold text-kenya-black flex items-center gap-2">
                          <FileSpreadsheet className="w-5 h-5 text-kenya-green" />
                          Letterhead Designer
                        </h3>
                      </div>
                      <div className="p-8 space-y-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[
                            { id: 'standard', name: 'Standard', desc: 'Classic centered layout' },
                            { id: 'modern', name: 'Modern', desc: 'Clean left-aligned style' },
                            { id: 'minimal', name: 'Minimal', desc: 'Sleek professional look' },
                            { id: 'elegant', name: 'Elegant', desc: 'Sophisticated serif design' },
                            { id: 'bold', name: 'Bold', desc: 'Strong header presence' },
                            { id: 'compact', name: 'Compact', desc: 'Space-saving layout' }
                          ].map(template => (
                            <button
                              key={template.id}
                              onClick={() => setSchoolSettings({...schoolSettings, letterheadTemplate: template.id})}
                              className={`p-4 rounded-2xl border-2 transition-all text-left ${
                                schoolSettings.letterheadTemplate === template.id 
                                  ? 'border-kenya-green bg-kenya-green/5' 
                                  : 'border-gray-100 hover:border-gray-200'
                              }`}
                            >
                              <p className="font-bold text-kenya-black text-sm">{template.name}</p>
                              <p className="text-[10px] text-gray-500">{template.desc}</p>
                            </button>
                          ))}
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
                          <p className="text-xs font-black text-gray-400 uppercase mb-4 tracking-widest">Live Preview</p>
                          <div className="bg-white shadow-lg rounded-lg p-8 min-h-[200px] flex flex-col items-center justify-center border border-gray-200">
                            <Letterhead settings={schoolSettings} />
                            <div className="w-full h-32 bg-gray-50 rounded border border-dashed border-gray-200 flex items-center justify-center text-gray-400 text-xs italic">
                              Document Content Area
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Logo Upload */}
                  <div className="space-y-8">
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center">
                      <h3 className="text-lg font-bold text-kenya-black mb-6">School Seal / Logo</h3>
                      <div className="relative group mx-auto w-48 h-48 mb-6">
                        <div className="w-full h-full rounded-3xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden group-hover:border-kenya-green transition-colors">
                          {schoolSettings.logo ? (
                            <img src={schoolSettings.logo} alt="School Logo" className="w-full h-full object-contain p-4" />
                          ) : (
                            <div className="text-center p-4">
                              <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                              <p className="text-[10px] font-bold text-gray-400 uppercase">No Logo Uploaded</p>
                            </div>
                          )}
                        </div>
                        <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-kenya-black/0 group-hover:bg-kenya-black/40 transition-all rounded-3xl">
                          <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                          <Upload className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 px-4">Recommended: Square PNG with transparent background (min 500x500px)</p>
                    </div>

                    <div className="pt-6">
                      <Button onClick={handleUpdateSchool} className="w-full py-4 rounded-xl font-black text-lg shadow-xl shadow-kenya-green/20">
                        Save Configuration
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShieldCheck className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-kenya-black mb-2">Section Under Construction</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  The {activeTab} section is currently being updated to meet the new Ministry of Education guidelines.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Edit Confirm Modal */}
        {showEditConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-kenya-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl border border-gray-100 text-center"
            >
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-2xl font-bold text-kenya-black mb-2">Confirm Changes</h3>
              <p className="text-gray-500 mb-8">Are you sure you want to save these changes to the marks? This action will be logged.</p>
              
              <div className="flex gap-4">
                <Button variant="secondary" onClick={() => setShowEditConfirmModal(false)} className="flex-1">Cancel</Button>
                <Button onClick={saveEditedMarks} className="flex-1">Confirm & Save</Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Add Staff Modal */}
        {showAddStaffModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-kenya-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl border border-gray-100"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-kenya-black">{editingStaff ? 'Edit Faculty Member' : 'Add Faculty Member'}</h3>
                <button onClick={() => { setShowAddStaffModal(false); setEditingStaff(null); setNewStaff({ name: '', email: '', role: 'Teacher', assignedSubjects: [], assignedClasses: [] }); }} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddStaff} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-kenya-black ml-1">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={newStaff.name}
                    onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                    placeholder="e.g. Jane Doe"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-kenya-black ml-1">Designated Role</label>
                  <select 
                    value={newStaff.role}
                    onChange={(e) => setNewStaff({...newStaff, role: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                  >
                    <option value="Teacher">Teacher</option>
                    <option value="Class Teacher">Class Teacher</option>
                    <option value="Head of Science">Head of Science</option>
                    <option value="Head of Arts">Head of Arts</option>
                    <option value="Senior Teacher">Senior Teacher</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-kenya-black ml-1">Assigned Learning Areas</label>
                  <div className="grid grid-cols-2 gap-2">
                    {learningAreas.map(la => (
                      <label key={la} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={newStaff.assignedSubjects.includes(la)}
                          onChange={(e) => {
                            const subjects = e.target.checked 
                              ? [...newStaff.assignedSubjects, la]
                              : newStaff.assignedSubjects.filter(s => s !== la);
                            setNewStaff({...newStaff, assignedSubjects: subjects});
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-kenya-green focus:ring-kenya-green"
                        />
                        <span className="text-xs font-medium text-gray-600">{la}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-kenya-black ml-1">Assigned Classes</label>
                  <div className="grid grid-cols-2 gap-2">
                    {classes.map(c => (
                      <label key={c.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={newStaff.assignedClasses.includes(c.name)}
                          onChange={(e) => {
                            const classesList = e.target.checked 
                              ? [...newStaff.assignedClasses, c.name]
                              : newStaff.assignedClasses.filter(cls => cls !== c.name);
                            setNewStaff({...newStaff, assignedClasses: classesList});
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-kenya-green focus:ring-kenya-green"
                        />
                        <span className="text-xs font-medium text-gray-600">{c.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {editingStaff && editingStaff.mustChangePassword && (
                  <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-yellow-700">
                      <ShieldAlert className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-wider">Default Password</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <code className="text-lg font-black text-kenya-black tracking-widest">{editingStaff.password}</code>
                      <button 
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(editingStaff.password);
                          alert('Password copied to clipboard');
                        }}
                        className="text-[10px] font-bold text-kenya-green uppercase hover:underline"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-[10px] text-yellow-600 italic">This password will expire after the teacher's first successful login.</p>
                  </div>
                )}

                <Button type="submit" className="w-full py-4 rounded-xl font-bold">{editingStaff ? 'Update Member' : 'Register Member'}</Button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Generated Staff Credentials Modal */}
        {generatedStaffCreds && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-kenya-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl border border-gray-100"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-kenya-black">Teacher Added</h3>
                <button onClick={() => setGeneratedStaffCreds(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-6">
                <p className="text-gray-600">
                  Successfully added <span className="font-bold text-kenya-black">{generatedStaffCreds.name}</span>. Please share these login credentials with them:
                </p>
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Username</label>
                    <p className="text-lg font-mono text-kenya-black">{generatedStaffCreds.username}</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
                    <p className="text-lg font-mono text-kenya-black">{generatedStaffCreds.password}</p>
                  </div>
                </div>
                <Button onClick={() => setGeneratedStaffCreds(null)} className="w-full py-4 rounded-xl font-bold">Done</Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Add Student Modal */}
        {showAddStudentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-kenya-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl border border-gray-100"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-kenya-black">{editingStudent ? 'Edit Learner' : 'Add Individual Learner'}</h3>
                <button onClick={() => { setShowAddStudentModal(false); setEditingStudent(null); setNewStudent({ name: '', adm: '', class: 'Form 1' }); }} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddStudent} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-kenya-black ml-1">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-kenya-black ml-1">Admission Number</label>
                  <input 
                    type="text" 
                    required
                    value={newStudent.adm}
                    onChange={(e) => setNewStudent({...newStudent, adm: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                    placeholder="e.g. ADM-2024-001"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-kenya-black ml-1">Class / Grade</label>
                  <select 
                    value={newStudent.class}
                    onChange={(e) => setNewStudent({...newStudent, class: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <Button type="submit" className="w-full py-4 rounded-xl font-bold">{editingStudent ? 'Update Learner' : 'Register Learner'}</Button>
              </form>
            </motion.div>
          </div>
        )}
        {/* Add Class Modal */}
        {showAddClassModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-kenya-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl border border-gray-100"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-kenya-black">{editingClass ? 'Edit Class' : 'Add New Class'}</h3>
                <button onClick={() => { setShowAddClassModal(false); setEditingClass(null); setNewClass({ name: '', teacherId: '', capacity: 40 }); }} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddClass} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-kenya-black ml-1">Class Name</label>
                  <input 
                    type="text" 
                    required
                    value={newClass.name}
                    onChange={(e) => setNewClass({...newClass, name: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                    placeholder="e.g. Form 1A"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-kenya-black ml-1">Class Teacher</label>
                  <select 
                    value={newClass.teacherId}
                    onChange={(e) => setNewClass({...newClass, teacherId: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                  >
                    <option value="">-- Select Teacher --</option>
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-kenya-black ml-1">Capacity</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    value={newClass.capacity}
                    onChange={(e) => setNewClass({...newClass, capacity: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                  />
                </div>
                <Button type="submit" className="w-full py-4 rounded-xl font-bold">{editingClass ? 'Update Class' : 'Create Class'}</Button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Edit Marks Modal */}
        {showEditMarksModal && selectedMarksStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-kenya-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[2.5rem] w-full max-w-2xl p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-kenya-black">Manage Student Marks</h3>
                  <p className="text-sm text-gray-500">{selectedMarksStudent.name} ({selectedMarksStudent.adm}) - {selectedMarksStudent.class}</p>
                </div>
                <button onClick={() => setShowEditMarksModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                {exams.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-400 italic">No examinations found. Create an exam first.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {exams.map(exam => (
                      <div key={exam.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-bold text-kenya-black">{exam.title}</p>
                          <p className="text-xs text-gray-500">{exam.term} {exam.year}</p>
                        </div>
                        <div className="w-32">
                          <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Score (%)</label>
                          <input 
                            type="number"
                            min="0"
                            max="100"
                            value={editingMarks[exam.id] || ''}
                            onChange={(e) => setEditingMarks({...editingMarks, [exam.id]: e.target.value})}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 font-bold"
                            placeholder="--"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 flex gap-3">
                <Button variant="ghost" onClick={() => setShowEditMarksModal(false)} className="flex-1">Cancel</Button>
                <Button onClick={saveStudentMarks} className="flex-1">Save Changes</Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Report Preview Modal */}
        {showReportPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-kenya-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[2.5rem] w-full max-w-4xl p-8 shadow-2xl border border-gray-100 max-h-[95vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-kenya-black">Report Card Preview</h3>
                  <p className="text-sm text-gray-500">Review the document before printing or distribution.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={generateExcel} className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    Export Excel
                  </Button>
                  <Button variant="ghost" onClick={generatePDF} className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Download PDF
                  </Button>
                  <button onClick={() => setShowReportPreview(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 bg-gray-50 p-8 rounded-3xl border border-gray-100">
                <div className="bg-white shadow-sm p-12 min-h-[1000px] border border-gray-200 mx-auto max-w-[800px]">
                  {reportConfig.includeLetterhead && <Letterhead settings={schoolSettings} />}
                  
                  <div className="text-center mb-8">
                    <h1 className="text-xl font-black text-kenya-black uppercase border-b-2 border-kenya-black inline-block pb-1">Academic Performance Report</h1>
                  </div>

                  <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
                    <div className="space-y-1">
                      <p><span className="font-bold text-gray-400 uppercase text-[10px]">Student Name:</span> <span className="font-black text-kenya-black">{students.find(s => s.id === reportConfig.selectedStudentId)?.name}</span></p>
                      <p><span className="font-bold text-gray-400 uppercase text-[10px]">Admission No:</span> <span className="font-black text-kenya-black">{students.find(s => s.id === reportConfig.selectedStudentId)?.adm}</span></p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p><span className="font-bold text-gray-400 uppercase text-[10px]">Class/Grade:</span> <span className="font-black text-kenya-black">{students.find(s => s.id === reportConfig.selectedStudentId)?.class}</span></p>
                      <p><span className="font-bold text-gray-400 uppercase text-[10px]">Academic Year:</span> <span className="font-black text-kenya-black">2024</span></p>
                    </div>
                  </div>

                  <table className="w-full border-collapse mb-8">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 p-3 text-left text-[10px] font-black uppercase text-gray-500">Learning Area</th>
                        <th className="border border-gray-200 p-3 text-left text-[10px] font-black uppercase text-gray-500">Subject Teacher</th>
                        {reportConfig.selectedExamIds.map(id => (
                          <th key={id} className="border border-gray-200 p-3 text-center text-[10px] font-black uppercase text-gray-500">
                            {exams.find(e => e.id === id)?.title}
                          </th>
                        ))}
                        {reportConfig.includeAverages && (
                          <th className="border border-gray-200 p-3 text-center text-[10px] font-black uppercase text-kenya-green">Average</th>
                        )}
                        {reportConfig.includeGrades && (
                          <th className="border border-gray-200 p-3 text-center text-[10px] font-black uppercase text-kenya-red">Grade</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {learningAreas.map(subject => {
                        const student = students.find(s => s.id === reportConfig.selectedStudentId);
                        const subjectTeacher = staff.find(t => 
                          t.assignedSubjects?.includes(subject) && 
                          t.assignedClasses?.includes(student?.class)
                        );

                        const scores = reportConfig.selectedExamIds.map(id => {
                          const mark = marks.find(m => m.studentId === reportConfig.selectedStudentId && m.examId === id && m.subject === subject);
                          return mark ? parseFloat(mark.score) : null;
                        });
                        const validScores = scores.filter(s => s !== null) as number[];
                        const avg = validScores.length > 0 ? validScores.reduce((a, b) => a + b, 0) / validScores.length : null;
                        const grade = avg !== null ? gradingSystem.find(g => avg >= g.min && avg <= g.max)?.grade || '--' : '--';

                        return (
                          <tr key={subject}>
                            <td className="border border-gray-200 p-3 font-bold text-kenya-black text-sm">{subject}</td>
                            <td className="border border-gray-200 p-3 text-gray-500 text-[11px] font-medium italic">{subjectTeacher?.name || 'Not Assigned'}</td>
                            {scores.map((score, idx) => (
                              <td key={idx} className="border border-gray-200 p-3 text-center font-mono text-sm">{score !== null ? score : '--'}</td>
                            ))}
                            {reportConfig.includeAverages && (
                              <td className="border border-gray-200 p-3 text-center font-black text-kenya-green text-sm">{avg !== null ? avg.toFixed(1) : '--'}</td>
                            )}
                            {reportConfig.includeGrades && (
                              <td className="border border-gray-200 p-3 text-center font-black text-kenya-red text-sm">{grade}</td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {reportConfig.includePerformanceTrend && (
                    <div className="mt-12 space-y-8">
                      <div className="border-t-2 border-kenya-black pt-6">
                        <h3 className="text-lg font-black text-kenya-black uppercase mb-6 flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-kenya-green" />
                          Performance Trend Analysis
                        </h3>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                          {/* Graph Section */}
                          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                            <p className="text-[10px] font-black text-gray-400 uppercase mb-4 tracking-widest">Mean Score Trend</p>
                            <div className="h-64 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                {reportConfig.graphType === 'bar' ? (
                                  <BarChart data={reportConfig.selectedExamIds.map(id => {
                                    const exam = exams.find(e => e.id === id);
                                    const studentMarks = marks.filter(m => m.studentId === reportConfig.selectedStudentId && m.examId === id);
                                    const total = studentMarks.reduce((sum, m) => sum + parseFloat(m.score as string), 0);
                                    const mean = studentMarks.length > 0 ? total / studentMarks.length : 0;
                                    return { name: exam?.title || 'Exam', mean: parseFloat(mean.toFixed(1)) };
                                  })}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="name" fontSize={10} fontWeight="bold" tick={{fill: '#141414'}} axisLine={false} tickLine={false} />
                                    <YAxis fontSize={10} fontWeight="bold" tick={{fill: '#141414'}} axisLine={false} tickLine={false} domain={[0, 100]} />
                                    <Tooltip 
                                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                      cursor={{ fill: '#F3F4F6' }}
                                    />
                                    <Bar dataKey="mean" fill="#006837" radius={[4, 4, 0, 0]} barSize={40} />
                                  </BarChart>
                                ) : (
                                  <LineChart data={reportConfig.selectedExamIds.map(id => {
                                    const exam = exams.find(e => e.id === id);
                                    const studentMarks = marks.filter(m => m.studentId === reportConfig.selectedStudentId && m.examId === id);
                                    const total = studentMarks.reduce((sum, m) => sum + parseFloat(m.score as string), 0);
                                    const mean = studentMarks.length > 0 ? total / studentMarks.length : 0;
                                    return { name: exam?.title || 'Exam', mean: parseFloat(mean.toFixed(1)) };
                                  })}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="name" fontSize={10} fontWeight="bold" tick={{fill: '#141414'}} axisLine={false} tickLine={false} />
                                    <YAxis fontSize={10} fontWeight="bold" tick={{fill: '#141414'}} axisLine={false} tickLine={false} domain={[0, 100]} />
                                    <Tooltip 
                                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Line type="monotone" dataKey="mean" stroke="#006837" strokeWidth={4} dot={{ r: 6, fill: '#006837', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                                  </LineChart>
                                )}
                              </ResponsiveContainer>
                            </div>
                          </div>

                          {/* Position Table Section */}
                          <div className="space-y-4">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Termly Position Summary</p>
                            <div className="overflow-hidden rounded-2xl border border-gray-100">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                  <tr>
                                    <th className="px-4 py-3 font-black text-kenya-black uppercase">Exam / Term</th>
                                    <th className="px-4 py-3 font-black text-kenya-black uppercase text-center">Mean</th>
                                    <th className="px-4 py-3 font-black text-kenya-black uppercase text-center">Pos</th>
                                    <th className="px-4 py-3 font-black text-kenya-black uppercase text-center">Out of</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                  {reportConfig.selectedExamIds.map(id => {
                                    const exam = exams.find(e => e.id === id);
                                    if (!exam) return null;
                                    
                                    const student = students.find(s => s.id === reportConfig.selectedStudentId);
                                    const classStudents = students.filter(s => s.class === student?.class);
                                    
                                    const examMarks = marks.filter(m => m.examId === id);
                                    
                                    // Calculate total scores for all students in the class
                                    const rankings = classStudents.map(s => {
                                      const sMarks = examMarks.filter(m => m.studentId === s.id);
                                      const total = sMarks.reduce((sum, m) => sum + parseFloat(m.score as string), 0);
                                      return { id: s.id, total };
                                    }).sort((a, b) => b.total - a.total);
                                    
                                    const position = rankings.findIndex(r => r.id === reportConfig.selectedStudentId) + 1;
                                    const studentMarks = examMarks.filter(m => m.studentId === reportConfig.selectedStudentId);
                                    const total = studentMarks.reduce((sum, m) => sum + parseFloat(m.score as string), 0);
                                    const mean = studentMarks.length > 0 ? total / studentMarks.length : 0;

                                    return (
                                      <tr key={id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-3 font-bold text-kenya-black">
                                          {exam.title}
                                          <span className="block text-[10px] text-gray-400 font-medium">{exam.term} {exam.year}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center font-black text-kenya-green">{mean.toFixed(1)}</td>
                                        <td className="px-4 py-3 text-center">
                                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-kenya-black text-white font-black text-[10px]">
                                            {position}
                                          </span>
                                        </td>
                                        <td className="px-4 py-3 text-center font-bold text-gray-400">{classStudents.length}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-12 grid grid-cols-2 gap-12">
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-[10px] font-black text-gray-400 uppercase mb-8">Class Teacher's Remarks</p>
                      <div className="h-12 border-b border-gray-100 italic text-gray-400 text-xs">Sign: ____________________</div>
                    </div>
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-[10px] font-black text-gray-400 uppercase mb-8">Principal's Remarks</p>
                      <div className="h-12 border-b border-gray-100 italic text-gray-400 text-xs">Sign: ____________________</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
};
