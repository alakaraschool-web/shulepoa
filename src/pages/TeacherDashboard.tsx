import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { motion } from 'motion/react';
import { 
  GraduationCap, 
  BookOpen, 
  LogOut, 
  LayoutDashboard, 
  Search,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Save,
  ChevronRight,
  ArrowLeft,
  Upload,
  Download,
  BarChart3,
  FileSpreadsheet,
  ClipboardList,
  Filter,
  ArrowUpDown,
  FileSpreadsheet as ExcelIcon,
  Users,
  Plus,
  Trash2,
  X
} from 'lucide-react';
import { NotificationBell, addNotification } from '../components/NotificationBell';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState<any[]>([]);
  const [activeExam, setActiveExam] = useState<any>(null);
  const [marks, setMarks] = useState<any[]>(() => {
    const saved = localStorage.getItem('alakara_marks');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentMarks, setCurrentMarks] = useState<any>({});
  const [activeTab, setActiveTab] = useState<'exams' | 'analysis' | 'class-management' | 'materials' | 'profile' | 'assignments'>('exams');
  const [currentTeacher, setCurrentTeacher] = useState<any>(() => {
    const saved = localStorage.getItem('alakara_current_teacher');
    return saved ? JSON.parse(saved) : { name: 'Teacher', role: 'Class Teacher', assignedClasses: ['Form 1', 'Grade 7'] };
  });

  const [showBulkPreview, setShowBulkPreview] = useState(false);
  const [bulkPreviewData, setBulkPreviewData] = useState<any>(null);

  const [assignments, setAssignments] = useState<any[]>(() => {
    const saved = localStorage.getItem('alakara_assignments');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [submissions, setSubmissions] = useState<any[]>(() => {
    const saved = localStorage.getItem('alakara_submissions');
    return saved ? JSON.parse(saved) : [];
  });

  const [showAddAssignmentModal, setShowAddAssignmentModal] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    dueDate: '',
    maxMarks: 100,
    class: '',
    subject: ''
  });
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);

  useEffect(() => {
    localStorage.setItem('alakara_assignments', JSON.stringify(assignments));
  }, [assignments]);

  useEffect(() => {
    localStorage.setItem('alakara_submissions', JSON.stringify(submissions));
  }, [submissions]);

  const [examMaterials, setExamMaterials] = useState<any[]>(() => {
    const saved = localStorage.getItem('alakara_exam_materials');
    return saved ? JSON.parse(saved) : [];
  });

  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    subject: 'Mathematics',
    fileType: 'PDF' as 'PDF' | 'DOCX' | 'ZIP'
  });

  useEffect(() => {
    localStorage.setItem('alakara_exam_materials', JSON.stringify(examMaterials));
  }, [examMaterials]);

  const handleAddMaterial = (e: FormEvent) => {
    e.preventDefault();
    const material = {
      id: Math.random().toString(36).substr(2, 9),
      ...newMaterial,
      schoolName: 'Alakara Academy', // Mock school name
      teacherName: currentTeacher.name,
      uploadDate: new Date().toLocaleDateString(),
      status: 'Pending',
      visibility: 'Public'
    };
    setExamMaterials([material, ...examMaterials]);
    setShowAddMaterialModal(false);
    setNewMaterial({ title: '', subject: 'Mathematics', fileType: 'PDF' });
    alert('Material uploaded and sent for approval!');
  };

  const deleteMaterial = (id: string) => {
    if (window.confirm('Delete this material?')) {
      setExamMaterials(examMaterials.filter(m => m.id !== id));
    }
  };

  const [assignedClasses] = useState<string[]>(currentTeacher.assignedClasses || ['Form 1', 'Grade 7']);
  const [teacherRole] = useState<'Teacher' | 'Class Teacher'>(currentTeacher.role === 'Class Teacher' ? 'Class Teacher' : 'Teacher');
  const [managedClass] = useState<string>(assignedClasses[0] || 'Form 1');
  const [selectedAnalysisExamId, setSelectedAnalysisExamId] = useState('');
  const [selectedAnalysisClass, setSelectedAnalysisClass] = useState('All');
  const [selectedEntryClass, setSelectedEntryClass] = useState('');
  const [selectedEntryStream, setSelectedEntryStream] = useState('');
  const [selectedEntrySubject, setSelectedEntrySubject] = useState('');
  const [selectedEntryStudent, setSelectedEntryStudent] = useState<any>(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [entryMode, setEntryMode] = useState<'individual' | 'bulk'>('individual');
  const [analysisOptions, setAnalysisOptions] = useState({
    showGrades: true,
    showRank: true
  });

  const [assessmentCategories] = useState<any[]>(() => {
    const saved = localStorage.getItem('alakara_assessment_categories');
    return saved ? JSON.parse(saved) : [
      { id: 'cat1', name: 'CAT 1', maxScore: 20 },
      { id: 'cat2', name: 'CAT 2', maxScore: 20 },
      { id: 'final', name: 'Final Exam', maxScore: 60 },
    ];
  });

  const [learningAreas] = useState<string[]>(() => {
    const saved = localStorage.getItem('alakara_learning_areas');
    return saved ? JSON.parse(saved) : ['Mathematics', 'English', 'Kiswahili', 'Science', 'Social Studies', 'CRE'];
  });

  const [gradingSystem] = useState<any[]>(() => {
    const saved = localStorage.getItem('alakara_grading');
    return saved ? JSON.parse(saved) : [
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

  // Load students from localStorage if available
  const [allStudents, setAllStudents] = useState<any[]>(() => {
    const saved = localStorage.getItem('alakara_students');
    return saved ? JSON.parse(saved) : [
      { id: 'S1', name: 'Alice Wanjiku', adm: 'ADM-2024-001', class: 'Form 1' },
      { id: 'S2', name: 'Bob Otieno', adm: 'ADM-2024-002', class: 'Form 2' },
      { id: 'S3', name: 'Charlie Mutua', adm: 'ADM-2024-003', class: 'Form 1' },
      { id: 'S4', name: 'Diana Anyango', adm: 'ADM-2024-004', class: 'Form 2' },
      { id: 'S5', name: 'Evans Kiprop', adm: 'ADM-2024-005', class: 'Form 1' },
    ];
  });

  useEffect(() => {
    const loadExams = () => {
      const saved = localStorage.getItem('alakara_exams');
      if (saved) {
        setExams(JSON.parse(saved));
      }
    };
    loadExams();
    const interval = setInterval(loadExams, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem('alakara_marks', JSON.stringify(marks));
  }, [marks]);

  useEffect(() => {
    localStorage.setItem('alakara_students', JSON.stringify(allStudents));
  }, [allStudents]);

  useEffect(() => {
    if (activeExam) {
      if (entryMode === 'individual' && selectedEntryStudent) {
        const examMarks = marks.filter(m => m.examId === activeExam.id && m.studentId === selectedEntryStudent.id);
        const marksMap: any = {};
        examMarks.forEach(m => {
          marksMap[m.subject] = m.assessments || {};
        });
        setCurrentMarks(marksMap);
      } else if (entryMode === 'bulk' && selectedEntrySubject && selectedEntryClass) {
        const examMarks = marks.filter(m => m.examId === activeExam.id && m.subject === selectedEntrySubject);
        const marksMap: any = {};
        examMarks.forEach(m => {
          marksMap[m.studentId] = m.assessments || {};
        });
        setCurrentMarks(marksMap);
      }
    }
  }, [activeExam, selectedEntrySubject, selectedEntryClass, selectedEntryStudent, entryMode, marks]);

  const [newStudent, setNewStudent] = useState({ name: '', adm: '' });
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);

  const handleAddStudent = (e: FormEvent) => {
    e.preventDefault();
    const student = {
      id: Math.random().toString(36).substr(2, 9),
      ...newStudent,
      class: managedClass,
      status: 'Active'
    };
    setAllStudents([...allStudents, student]);
    setNewStudent({ name: '', adm: '' });
    setShowAddStudentModal(false);
    alert('Student admitted successfully!');
  };

  const deleteStudent = (id: string) => {
    if (window.confirm('Are you sure you want to remove this student?')) {
      setAllStudents(allStudents.filter(s => s.id !== id));
    }
  };

  const addLog = (action: string, details: string) => {
    const saved = localStorage.getItem('alakara_audit_trail');
    const logs = saved ? JSON.parse(saved) : [];
    const newLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      user: currentTeacher.name,
      action,
      details
    };
    const updatedLogs = [newLog, ...logs].slice(0, 100);
    localStorage.setItem('alakara_audit_trail', JSON.stringify(updatedLogs));
  };

  const handleLogout = () => {
    navigate('/teacher-login');
  };

  const startMarkEntry = (exam: any) => {
    setActiveExam(exam);
    // Marks will be loaded by useEffect when class and subject are selected
  };

  const handleMarkChange = (studentId: string, categoryId: string, score: string) => {
    if (activeExam.status !== 'Active' || activeExam.locked) return;
    
    const category = assessmentCategories.find(c => c.id === categoryId);
    const numScore = parseFloat(score);
    
    if (score !== '' && (isNaN(numScore) || numScore < 0 || (category && numScore > category.maxScore))) {
      return; // Invalid input
    }

    const updatedStudentMarks = { 
      ...(currentMarks[studentId] || {}), 
      [categoryId]: score 
    };
    
    setCurrentMarks({ ...currentMarks, [studentId]: updatedStudentMarks });
    
    // Auto-save logic could go here, but for now we'll rely on the manual save or a debounced effect
  };

  const saveMarks = () => {
    if (activeExam.locked) {
      alert('This exam is locked and cannot be edited.');
      return;
    }
    
    if (entryMode === 'individual') {
      if (!selectedEntryStudent) {
        alert('Please select a student to save marks.');
        return;
      }

      const newMarks = [...marks.filter(m => m.examId !== activeExam.id || m.studentId !== selectedEntryStudent.id)];
      
      Object.entries(currentMarks).forEach(([subject, assessments]: [string, any]) => {
        let total = 0;
        Object.values(assessments).forEach(val => {
          if (val) total += parseFloat(val as string);
        });

        const percentage = total; // Since total max is 100 in default config

        // Find grade
        const gradeObj = gradingSystem.find(g => percentage >= g.min && percentage <= g.max);
        const grade = gradeObj ? gradeObj.grade : 'E';

        newMarks.push({
          id: `${activeExam.id}-${selectedEntryStudent.id}-${subject}`,
          examId: activeExam.id,
          studentId: selectedEntryStudent.id,
          subject,
          assessments,
          total,
          percentage,
          grade,
          updatedAt: new Date().toISOString()
        });
      });

      setMarks(newMarks);
      addLog('Save Marks', `Updated marks for ${activeExam.title} - ${selectedEntryStudent.name}`);
      alert('Marks saved successfully!');
      
      addNotification({
        title: 'Marks Saved',
        message: `You have successfully saved marks for "${activeExam.title}" - ${selectedEntryStudent.name}.`,
        type: 'success',
        role: 'teacher',
        userId: currentTeacher.id
      });
    } else {
      if (!selectedEntrySubject) {
        alert('Please select a subject to save marks.');
        return;
      }

      const newMarks = [...marks.filter(m => m.examId !== activeExam.id || m.subject !== selectedEntrySubject)];
      
      Object.entries(currentMarks).forEach(([studentId, assessments]: [string, any]) => {
        let total = 0;
        Object.values(assessments).forEach(val => {
          if (val) total += parseFloat(val as string);
        });

        const percentage = total; // Since total max is 100 in default config

        // Find grade
        const gradeObj = gradingSystem.find(g => percentage >= g.min && percentage <= g.max);
        const grade = gradeObj ? gradeObj.grade : 'E';

        newMarks.push({
          id: `${activeExam.id}-${studentId}-${selectedEntrySubject}`,
          examId: activeExam.id,
          studentId,
          subject: selectedEntrySubject,
          assessments,
          total,
          percentage,
          grade,
          updatedAt: new Date().toISOString()
        });
      });

      setMarks(newMarks);
      addLog('Save Marks', `Updated marks for ${activeExam.title} - ${selectedEntrySubject}`);
      alert('Marks saved successfully!');
      
      addNotification({
        title: 'Marks Saved',
        message: `You have successfully saved marks for "${activeExam.title}" - ${selectedEntrySubject}.`,
        type: 'success',
        role: 'teacher',
        userId: currentTeacher.id
      });
    }
  };

  const handleBulkUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

      const header = data[0];
      const subjectIndices: { [key: string]: number } = {};
      
      header.forEach((cell, idx) => {
        const la = String(cell).trim();
        if (learningAreas.includes(la)) {
          subjectIndices[la] = idx;
        }
      });

      if (Object.keys(subjectIndices).length === 0) {
        // Fallback to old format [Adm, Score]
        setBulkPreviewData({ data, type: 'single' });
      } else {
        // Multi-subject upload
        setBulkPreviewData({ data, subjectIndices, type: 'multi' });
      }
      setShowBulkPreview(true);
    };
    reader.readAsBinaryString(file);
  };

  const confirmBulkUpload = () => {
    if (!bulkPreviewData) return;
    const { data, subjectIndices, type } = bulkPreviewData;

    if (type === 'single') {
      const newMarksMap = { ...currentMarks };
      data.forEach((row: any, index: number) => {
        if (index === 0 && isNaN(Number(row[1]))) return;
        const admNo = String(row[0]).trim();
        const score = row[1];
        const student = allStudents.find(s => s.adm === admNo);
        if (student) {
          newMarksMap[student.id] = String(score);
        }
      });
      setCurrentMarks(newMarksMap);
    } else {
      const newMarks = [...marks];
      data.slice(1).forEach((row: any) => {
        const admNo = String(row[0]).trim();
        const student = allStudents.find(s => s.adm === admNo);
        if (student) {
          Object.entries(subjectIndices).forEach(([subject, idx]) => {
            const score = row[idx as number];
            if (score !== undefined && score !== '') {
              const markIdx = newMarks.findIndex(m => m.studentId === student.id && m.examId === activeExam.id && m.subject === subject);
              const markData = {
                id: Math.random().toString(36).substr(2, 9),
                examId: activeExam.id,
                studentId: student.id,
                score: String(score),
                subject,
                updatedAt: new Date().toISOString()
              };
              if (markIdx > -1) newMarks[markIdx] = markData;
              else newMarks.push(markData);
            }
          });
        }
      });
      setMarks(newMarks);
      
      const primarySubject = 'Mathematics'; 
      const primaryIdx = subjectIndices[primarySubject];
      if (primaryIdx !== undefined) {
        const newMarksMap = { ...currentMarks };
        data.slice(1).forEach((row: any) => {
          const admNo = String(row[0]).trim();
          const student = allStudents.find(s => s.adm === admNo);
          if (student) newMarksMap[student.id] = String(row[primaryIdx]);
        });
        setCurrentMarks(newMarksMap);
      }
    }
    
    setShowBulkPreview(false);
    setBulkPreviewData(null);
    alert('Bulk marks imported successfully!');
  };

  const downloadMarksTemplate = () => {
    const data = [
      ['Admission Number', 'Score (0-100)'],
      ['ADM-2024-001', '85'],
      ['ADM-2024-002', '72']
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Marks");
    XLSX.writeFile(wb, `${activeExam.title}_Marks_Template.xlsx`);
  };

  const handleProfilePhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const updatedTeacher = { ...currentTeacher, avatar_url: reader.result };
        setCurrentTeacher(updatedTeacher);
        localStorage.setItem('alakara_current_teacher', JSON.stringify(updatedTeacher));
      };
      reader.readAsDataURL(file);
    }
  };

  const [selectedRankingSubject, setSelectedRankingSubject] = useState('');

  const getAnalysisData = () => {
    if (!selectedAnalysisExamId) return [];
    
    const examMarks = marks.filter(m => m.examId === selectedAnalysisExamId);
    const exam = exams.find(e => e.id === selectedAnalysisExamId);
    if (!exam) return [];

    // Group marks by student - Filtered by assigned classes
    const studentAnalysis = allStudents
      .filter(s => exam.classes.includes(s.class) && assignedClasses.includes(s.class) && (selectedAnalysisClass === 'All' || s.class === selectedAnalysisClass))
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

  const analysisData = getAnalysisData();

  const getSubjectRanking = () => {
    if (!selectedAnalysisExamId || !selectedRankingSubject) return [];
    
    const examMarks = marks.filter(m => m.examId === selectedAnalysisExamId && m.subject === selectedRankingSubject);
    
    const ranked = examMarks
      .map(m => {
        const student = allStudents.find(s => s.id === m.studentId);
        return {
          id: m.studentId,
          name: student?.name || 'Unknown',
          adm: student?.adm || 'N/A',
          score: parseFloat(m.score)
        };
      })
      .sort((a, b) => b.score - a.score);

    return ranked.map((s, index) => ({ ...s, rank: index + 1 }));
  };

  const subjectRanking = getSubjectRanking();

  const exportAnalysisPDF = () => {
    if (!selectedAnalysisExamId) return;
    const exam = exams.find(e => e.id === selectedAnalysisExamId);
    if (!exam) return;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`Performance Analysis: ${exam.title}`, 14, 20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Class: ${selectedAnalysisClass} | Date: ${new Date().toLocaleDateString()}`, 14, 28);

    const headers = ['Rank', 'Adm No', 'Name', ...learningAreas, 'Total', 'Avg', 'Grade'];
    const data = analysisData.map((row: any) => [
      row.rank,
      row.adm,
      row.name,
      ...learningAreas.map(la => row.subjectScores[la] !== null ? row.subjectScores[la] : '--'),
      row.totalScore.toFixed(0),
      `${row.average.toFixed(1)}%`,
      row.grade
    ]);

    autoTable(doc, {
      startY: 35,
      head: [headers],
      body: data,
      theme: 'grid',
      headStyles: { fillColor: [0, 140, 81] },
      styles: { fontSize: 8 }
    });

    doc.save(`Analysis_${exam.title}_${selectedAnalysisClass}.pdf`);
  };

  const exportAnalysisExcel = () => {
    if (!selectedAnalysisExamId) return;
    const exam = exams.find(e => e.id === selectedAnalysisExamId);
    if (!exam) return;

    const headers = ['Rank', 'Adm No', 'Name', ...learningAreas, 'Total', 'Avg', 'Grade'];
    const data = analysisData.map((row: any) => [
      row.rank,
      row.adm,
      row.name,
      ...learningAreas.map(la => row.subjectScores[la] !== null ? row.subjectScores[la] : '--'),
      row.totalScore.toFixed(0),
      `${row.average.toFixed(1)}%`,
      row.grade
    ]);

    const wsData = [
      [`Performance Analysis: ${exam.title}`],
      [`Class: ${selectedAnalysisClass}`, `Date: ${new Date().toLocaleDateString()}`],
      [],
      headers,
      ...data
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Analysis");
    XLSX.writeFile(wb, `Analysis_${exam.title}_${selectedAnalysisClass}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-kenya-black text-white flex flex-col shrink-0">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-12 group cursor-pointer" onClick={() => navigate('/')}>
            <div className="bg-kenya-green p-2 rounded-lg group-hover:rotate-12 transition-transform">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">Alakara <span className="text-kenya-red">Staff</span></span>
          </div>

          <nav className="space-y-2">
            <button 
              onClick={() => { setActiveTab('exams'); setActiveExam(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'exams' ? 'bg-kenya-green text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
              <BookOpen className="w-5 h-5" />
              Examinations
            </button>
            <button 
              onClick={() => { setActiveTab('analysis'); setActiveExam(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'analysis' ? 'bg-kenya-green text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
              <BarChart3 className="w-5 h-5" />
              Exam Analysis
            </button>
            <button 
              onClick={() => { setActiveTab('materials'); setActiveExam(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'materials' ? 'bg-kenya-green text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
              <FileText className="w-5 h-5" />
              Materials
            </button>
            <button 
              onClick={() => { setActiveTab('assignments'); setActiveExam(null); setSelectedAssignment(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'assignments' ? 'bg-kenya-green text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
              <FileText className="w-5 h-5" />
              Assignments
            </button>
            {teacherRole === 'Class Teacher' && (
              <button 
                onClick={() => { setActiveTab('class-management'); setActiveExam(null); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'class-management' ? 'bg-kenya-green text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              >
                <Users className="w-5 h-5" />
                Class Management
              </button>
            )}
            <button 
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'profile' ? 'bg-kenya-green text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
              <LayoutDashboard className="w-5 h-5" />
              My Profile
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
            <h2 className="font-bold text-kenya-black text-lg">
              {activeExam ? `Mark Entry: ${activeExam.title}` : 'Teacher Portal'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell role="teacher" userId={currentTeacher.id} />
            <div className="text-right">
              <p className="text-sm font-bold text-kenya-black">Mr. Kamau</p>
              <p className="text-xs text-gray-500">Mathematics Dept.</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-kenya-green/10 flex items-center justify-center overflow-hidden">
              {currentTeacher.avatar_url ? (
                <img src={currentTeacher.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <FileText className="w-5 h-5 text-kenya-green" />
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50">
          {activeTab === 'exams' ? (
            !activeExam ? (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-black text-kenya-black uppercase tracking-tight">Active Examinations</h1>
                    <p className="text-gray-500">Select an exam to start entering or viewing marks.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {exams
                    .filter(exam => exam.classes.some((c: string) => assignedClasses.includes(c)))
                    .map((exam) => (
                      <motion.div
                        key={exam.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="bg-kenya-green/10 p-3 rounded-2xl group-hover:rotate-6 transition-transform">
                          <BookOpen className="w-6 h-6 text-kenya-green" />
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          exam.status === 'Active' ? 'bg-kenya-green/10 text-kenya-green' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {exam.status === 'Active' ? 'Open for Marks' : 'Processed (View Only)'}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-kenya-black mb-1">{exam.title}</h3>
                      <p className="text-sm text-gray-500 mb-4">{exam.term} - {exam.year}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-6">
                        {exam.classes.map((c: string) => (
                          <span key={c} className="px-2 py-1 bg-gray-100 rounded-lg text-[10px] font-bold text-gray-600 uppercase">
                            {c}
                          </span>
                        ))}
                      </div>

                      <Button 
                        onClick={() => startMarkEntry(exam)}
                        className="w-full gap-2 rounded-2xl"
                        variant={exam.status === 'Active' ? 'default' : 'secondary'}
                      >
                        {exam.status === 'Active' ? 'Enter Marks' : 'View Performance'}
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}

                  {exams.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-4 border-dashed border-gray-100">
                      <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-xl font-bold text-gray-400 uppercase tracking-tight">No active exams assigned yet</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <button 
                    onClick={() => setActiveExam(null)}
                    className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-kenya-black transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Exams
                  </button>
                  <div className="flex items-center gap-4">
                    {activeExam.status === 'Active' && (
                      <>
                        <Button 
                          variant="ghost" 
                          onClick={downloadMarksTemplate}
                          className="gap-2 rounded-2xl"
                        >
                          <Download className="w-4 h-4" />
                          Template
                        </Button>
                        <Button onClick={saveMarks} className="gap-2 rounded-2xl shadow-lg shadow-kenya-green/20">
                          <Save className="w-4 h-4" />
                          Save All Marks
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
                  <div className="p-8 border-b border-gray-100 bg-gray-50/50 space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-kenya-black">Student Mark Entry</h2>
                        <p className="text-gray-500">Select class and subject to enter marks.</p>
                      </div>
                      {activeExam.status !== 'Active' && (
                        <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-4 py-2 rounded-xl font-bold text-sm">
                          <CheckCircle2 className="w-4 h-4" />
                          Marks Processed - Read Only
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <select 
                        value={selectedEntryClass}
                        onChange={(e) => setSelectedEntryClass(e.target.value)}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 font-bold text-sm"
                      >
                        <option value="">Select Class...</option>
                        {assignedClasses.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <select 
                        value={selectedEntryStream}
                        onChange={(e) => setSelectedEntryStream(e.target.value)}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 font-bold text-sm"
                      >
                        <option value="">Select Stream...</option>
                        <option value="All">All Streams</option>
                      </select>
                      <select 
                        value={selectedEntrySubject}
                        onChange={(e) => setSelectedEntrySubject(e.target.value)}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 font-bold text-sm"
                      >
                        <option value="">Select Subject...</option>
                        {learningAreas.map(la => (
                          <option key={la} value={la}>{la}</option>
                        ))}
                      </select>
                      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-1">
                        <button
                          onClick={() => setEntryMode('individual')}
                          className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${entryMode === 'individual' ? 'bg-kenya-green text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                          Individual Entry
                        </button>
                        <button
                          onClick={() => setEntryMode('bulk')}
                          className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${entryMode === 'bulk' ? 'bg-kenya-green text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                          Bulk Upload
                        </button>
                      </div>
                    </div>
                  </div>

                  {entryMode === 'bulk' ? (
                    <div className="p-12 text-center space-y-6">
                      <div className="w-24 h-24 bg-kenya-green/10 rounded-full flex items-center justify-center mx-auto">
                        <Upload className="w-10 h-10 text-kenya-green" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-kenya-black mb-2">Bulk Upload Marks</h3>
                        <p className="text-gray-500 max-w-md mx-auto">
                          Download the template, fill in the marks for all students, and upload the completed Excel file here.
                        </p>
                      </div>
                      <div className="flex justify-center gap-4">
                        <Button variant="secondary" onClick={downloadMarksTemplate} className="gap-2">
                          <Download className="w-4 h-4" />
                          Download Template
                        </Button>
                        <input 
                          type="file" 
                          id="bulk-upload-main" 
                          className="hidden" 
                          accept=".xlsx, .xls, .csv"
                          onChange={handleBulkUpload}
                        />
                        <Button onClick={() => document.getElementById('bulk-upload-main')?.click()} className="gap-2">
                          <Upload className="w-4 h-4" />
                          Select File
                        </Button>
                      </div>
                    </div>
                  ) : selectedEntryClass && selectedEntrySubject ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            <th className="px-8 py-4">Admission No</th>
                            <th className="px-8 py-4">Student Name</th>
                            {assessmentCategories.map(cat => (
                              <th key={cat.id} className="px-4 py-4 text-center w-32">
                                {cat.name}
                                <span className="block text-[8px] opacity-60">Max: {cat.maxScore}</span>
                              </th>
                            ))}
                            <th className="px-8 py-4 text-center">Total</th>
                            <th className="px-8 py-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {allStudents
                            .filter(s => s.class === selectedEntryClass)
                            .map((student) => {
                              const studentAssessments = currentMarks[student.id] || {};
                              let rowTotal = 0;
                              Object.values(studentAssessments).forEach(val => {
                                if (val) rowTotal += parseFloat(val as string);
                              });

                              return (
                                <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                                  <td className="px-8 py-6 font-mono text-sm text-gray-500">{student.adm}</td>
                                  <td className="px-8 py-6 font-bold text-kenya-black">{student.name}</td>
                                  {assessmentCategories.map(cat => (
                                    <td key={cat.id} className="px-4 py-6">
                                      <input 
                                        type="number"
                                        min="0"
                                        max={cat.maxScore}
                                        value={studentAssessments[cat.id] || ''}
                                        onChange={(e) => handleMarkChange(student.id, cat.id, e.target.value)}
                                        disabled={activeExam.status !== 'Active' || activeExam.locked}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 font-bold text-center disabled:opacity-50"
                                        placeholder="--"
                                      />
                                    </td>
                                  ))}
                                  <td className="px-8 py-6 text-center">
                                    <span className="text-lg font-black text-kenya-black">{rowTotal}</span>
                                  </td>
                                  <td className="px-8 py-6">
                                    {Object.keys(studentAssessments).length === assessmentCategories.length ? (
                                      <span className="text-kenya-green flex items-center gap-1 text-xs font-bold uppercase">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Complete
                                      </span>
                                    ) : (
                                      <span className="text-gray-300 flex items-center gap-1 text-xs font-bold uppercase">
                                        <Clock className="w-4 h-4" />
                                        Partial
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-12 text-center">
                      <Filter className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">Please select a class and subject to enter marks.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          ) : activeTab === 'analysis' ? (
            <div className="space-y-8">
              <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div>
                    <h3 className="text-xl font-bold text-kenya-black">Performance Analysis</h3>
                    <p className="text-sm text-gray-500">View detailed results and subject rankings.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <select 
                      value={selectedAnalysisClass}
                      onChange={(e) => setSelectedAnalysisClass(e.target.value)}
                      className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 font-bold text-sm"
                    >
                      <option value="All">All My Classes</option>
                      {assignedClasses.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <select 
                      value={selectedAnalysisExamId}
                      onChange={(e) => setSelectedAnalysisExamId(e.target.value)}
                      className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 font-bold text-sm"
                    >
                      <option value="">Select Examination...</option>
                      {exams
                        .filter(e => e.classes.some((c: string) => assignedClasses.includes(c)))
                        .map(e => (
                          <option key={e.id} value={e.id}>{e.title} ({e.term} {e.year})</option>
                        ))}
                    </select>
                    
                    {selectedAnalysisExamId && (
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
                        <div className="h-6 w-px bg-gray-200 mx-2"></div>
                        <button onClick={exportAnalysisExcel} className="text-gray-500 hover:text-kenya-green transition-colors" title="Export Excel">
                          <FileSpreadsheet className="w-5 h-5" />
                        </button>
                        <button onClick={exportAnalysisPDF} className="text-gray-500 hover:text-kenya-green transition-colors" title="Export PDF">
                          <Download className="w-5 h-5" />
                        </button>
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
                )}
              </div>

              {selectedAnalysisExamId && (
                <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-bold text-kenya-black">Subject Ranking</h3>
                      <p className="text-sm text-gray-500">Rank students based on individual learning areas.</p>
                    </div>
                    <select 
                      value={selectedRankingSubject}
                      onChange={(e) => setSelectedRankingSubject(e.target.value)}
                      className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 font-bold text-sm"
                    >
                      <option value="">Select Subject...</option>
                      {learningAreas.map(la => (
                        <option key={la} value={la}>{la}</option>
                      ))}
                    </select>
                  </div>

                  {!selectedRankingSubject ? (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                      <Filter className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-400 font-medium">Select a subject to view rankings.</p>
                    </div>
                  ) : subjectRanking.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                      <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-400 font-medium">No marks recorded for this subject yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {subjectRanking.slice(0, 10).map((row) => (
                        <div key={row.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${
                            row.rank === 1 ? 'bg-yellow-400 text-white' : 
                            row.rank === 2 ? 'bg-gray-300 text-white' :
                            row.rank === 3 ? 'bg-orange-400 text-white' : 'bg-white text-gray-400 border border-gray-200'
                          }`}>
                            {row.rank}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-kenya-black truncate">{row.name}</p>
                            <p className="text-[10px] text-gray-500 font-mono uppercase">{row.adm}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-black text-kenya-green">{row.score}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : activeTab === 'assignments' ? (
            <div className="space-y-8">
              {!selectedAssignment ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-black text-kenya-black uppercase tracking-tight">Assignments</h1>
                      <p className="text-gray-500">Create and manage assignments for your classes.</p>
                    </div>
                    <Button onClick={() => setShowAddAssignmentModal(true)} className="gap-2 rounded-2xl">
                      <Plus className="w-4 h-4" />
                      New Assignment
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assignments.map(assignment => (
                      <motion.div
                        key={assignment.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group"
                        onClick={() => setSelectedAssignment(assignment)}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="p-3 bg-kenya-green/10 rounded-2xl text-kenya-green">
                            <FileText className="w-6 h-6" />
                          </div>
                          <span className="px-3 py-1 bg-gray-100 rounded-xl text-xs font-bold text-gray-600">
                            {assignment.subject}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-kenya-black mb-2 group-hover:text-kenya-green transition-colors">{assignment.title}</h3>
                        <p className="text-gray-500 text-sm mb-4 line-clamp-2">{assignment.description}</p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-bold text-gray-600">{assignment.class}</span>
                          <span className="text-gray-400">Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-sm">
                          <span className="text-gray-500">Max Marks: <span className="font-bold text-kenya-black">{assignment.maxMarks}</span></span>
                          <span className="text-kenya-green font-bold">
                            {submissions.filter(s => s.assignmentId === assignment.id).length} Submissions
                          </span>
                        </div>
                      </motion.div>
                    ))}
                    {assignments.length === 0 && (
                      <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-4 border-dashed border-gray-100">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-xl font-bold text-gray-400 uppercase tracking-tight">No assignments created yet</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-8"
                >
                  <div className="flex items-center justify-between">
                    <button 
                      onClick={() => setSelectedAssignment(null)}
                      className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-kenya-black transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Assignments
                    </button>
                    <div className="flex items-center gap-4">
                      <Button 
                        variant="ghost" 
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this assignment?')) {
                            setAssignments(assignments.filter(a => a.id !== selectedAssignment.id));
                            setSubmissions(submissions.filter(s => s.assignmentId !== selectedAssignment.id));
                            setSelectedAssignment(null);
                          }
                        }}
                        className="gap-2 rounded-2xl text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Assignment
                      </Button>
                    </div>
                  </div>

                  <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
                    <div className="p-8 border-b border-gray-100 bg-gray-50/50">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h2 className="text-2xl font-bold text-kenya-black">{selectedAssignment.title}</h2>
                          <p className="text-gray-500">{selectedAssignment.subject} | {selectedAssignment.class}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Due Date</p>
                          <p className="font-bold text-kenya-black">{new Date(selectedAssignment.dueDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <p className="text-gray-600">{selectedAssignment.description}</p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            <th className="px-8 py-4">Student</th>
                            <th className="px-8 py-4">Submission Date</th>
                            <th className="px-8 py-4">Status</th>
                            <th className="px-8 py-4 text-center">Marks (/{selectedAssignment.maxMarks})</th>
                            <th className="px-8 py-4">Feedback</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {allStudents
                            .filter(s => s.class === selectedAssignment.class)
                            .map(student => {
                              const submission = submissions.find(s => s.studentId === student.id && s.assignmentId === selectedAssignment.id);
                              return (
                                <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                                  <td className="px-8 py-6">
                                    <p className="font-bold text-kenya-black">{student.name}</p>
                                    <p className="font-mono text-xs text-gray-500">{student.adm}</p>
                                  </td>
                                  <td className="px-8 py-6 text-sm text-gray-600">
                                    {submission ? new Date(submission.submittedAt).toLocaleDateString() : '--'}
                                  </td>
                                  <td className="px-8 py-6">
                                    {submission ? (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-kenya-green/10 text-kenya-green uppercase">
                                        Submitted
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gray-100 text-gray-500 uppercase">
                                        Pending
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-8 py-6 text-center">
                                    {submission ? (
                                      <input 
                                        type="number"
                                        min="0"
                                        max={selectedAssignment.maxMarks}
                                        value={submission.marks || ''}
                                        onChange={(e) => {
                                          const newSubmissions = [...submissions];
                                          const idx = newSubmissions.findIndex(s => s.id === submission.id);
                                          newSubmissions[idx].marks = e.target.value;
                                          setSubmissions(newSubmissions);
                                        }}
                                        className="w-20 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 font-bold text-center"
                                        placeholder="--"
                                      />
                                    ) : (
                                      <span className="text-gray-400">--</span>
                                    )}
                                  </td>
                                  <td className="px-8 py-6">
                                    {submission ? (
                                      <input 
                                        type="text"
                                        value={submission.feedback || ''}
                                        onChange={(e) => {
                                          const newSubmissions = [...submissions];
                                          const idx = newSubmissions.findIndex(s => s.id === submission.id);
                                          newSubmissions[idx].feedback = e.target.value;
                                          setSubmissions(newSubmissions);
                                        }}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 text-sm"
                                        placeholder="Add feedback..."
                                      />
                                    ) : (
                                      <span className="text-gray-400">--</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          ) : activeTab === 'materials' ? (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-black text-kenya-black uppercase tracking-tight">Learning Materials</h1>
                  <p className="text-gray-500">Upload and manage exam materials and revision guides.</p>
                </div>
                <Button onClick={() => setShowAddMaterialModal(true)} className="gap-2 rounded-2xl shadow-lg shadow-kenya-green/20">
                  <Upload className="w-5 h-5" />
                  Upload Material
                </Button>
              </div>

              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        <th className="px-8 py-4">Title</th>
                        <th className="px-8 py-4">Subject</th>
                        <th className="px-8 py-4">Status</th>
                        <th className="px-8 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {examMaterials.filter(m => m.teacherName === currentTeacher.name).map((material) => (
                        <tr key={material.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-gray-100 rounded-lg">
                                <FileText className="w-4 h-4 text-gray-500" />
                              </div>
                              <span className="font-bold text-kenya-black">{material.title}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6 font-bold text-kenya-green text-sm">{material.subject}</td>
                          <td className="px-8 py-6">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              material.status === 'Approved' ? 'bg-kenya-green/10 text-kenya-green' :
                              material.status === 'Rejected' ? 'bg-kenya-red/10 text-kenya-red' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {material.status}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <button 
                              onClick={() => deleteMaterial(material.id)}
                              className="p-2 text-gray-400 hover:text-kenya-red transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {examMaterials.filter(m => m.teacherName === currentTeacher.name).length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-8 py-12 text-center text-gray-400 italic">
                            No materials uploaded yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === 'class-management' ? (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-black text-kenya-black uppercase tracking-tight">Class Management</h1>
                  <p className="text-gray-500">Managing learners for <span className="font-bold text-kenya-green">{managedClass}</span></p>
                </div>
                <Button onClick={() => setShowAddStudentModal(true)} className="gap-2 rounded-2xl shadow-lg shadow-kenya-green/20">
                  <Plus className="w-5 h-5" />
                  Admit New Learner
                </Button>
              </div>

              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        <th className="px-8 py-4">Admission No</th>
                        <th className="px-8 py-4">Student Name</th>
                        <th className="px-8 py-4">Status</th>
                        <th className="px-8 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {allStudents.filter(s => s.class === managedClass).map((student) => (
                        <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-8 py-6 font-mono text-sm text-gray-500">{student.adm}</td>
                          <td className="px-8 py-6 font-bold text-kenya-black">{student.name}</td>
                          <td className="px-8 py-6">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-kenya-green/10 text-kenya-green uppercase">
                              Active
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <button 
                              onClick={() => deleteStudent(student.id)}
                              className="p-2 text-gray-400 hover:text-kenya-red transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
              <h2 className="text-2xl font-bold text-kenya-black mb-4">My Profile</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="relative group w-16 h-16 rounded-full bg-kenya-green/10 flex items-center justify-center overflow-hidden">
                    {currentTeacher.avatar_url ? (
                      <img src={currentTeacher.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <GraduationCap className="w-8 h-8 text-kenya-green" />
                    )}
                    <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                      <Upload className="w-4 h-4 text-white" />
                      <input type="file" className="hidden" accept="image/*" onChange={handleProfilePhotoUpload} />
                    </label>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-kenya-black">{currentTeacher.name}</p>
                    <p className="text-gray-500">{currentTeacher.role}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-gray-100 rounded-xl">
                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Email Address / Username</p>
                    <p className="font-bold text-kenya-black">{currentTeacher.username || currentTeacher.email || 'j.kamau@alakara.ac.ke'}</p>
                  </div>
                  <div className="p-4 border border-gray-100 rounded-xl">
                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Staff ID</p>
                    <p className="font-bold text-kenya-black">STF-2024-088</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Add Assignment Modal */}
      {showAddAssignmentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-kenya-black">New Assignment</h2>
              <button 
                onClick={() => setShowAddAssignmentModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const assignment = {
                id: Math.random().toString(36).substr(2, 9),
                ...newAssignment,
                teacherId: currentTeacher.id,
                createdAt: new Date().toISOString()
              };
              setAssignments([assignment, ...assignments]);
              setShowAddAssignmentModal(false);
              setNewAssignment({ title: '', description: '', dueDate: '', maxMarks: 100, class: assignedClasses[0] || '', subject: learningAreas[0] || '' });
            }} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Assignment Title</label>
                <input 
                  type="text"
                  required
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                  placeholder="e.g. Algebra Homework"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Description</label>
                <textarea 
                  required
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment({...newAssignment, description: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 h-24 resize-none"
                  placeholder="Instructions for the assignment..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Class</label>
                  <select 
                    required
                    value={newAssignment.class}
                    onChange={(e) => setNewAssignment({...newAssignment, class: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                  >
                    <option value="">Select Class</option>
                    {assignedClasses.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Subject</label>
                  <select 
                    required
                    value={newAssignment.subject}
                    onChange={(e) => setNewAssignment({...newAssignment, subject: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                  >
                    <option value="">Select Subject</option>
                    {learningAreas.map(la => (
                      <option key={la} value={la}>{la}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Due Date</label>
                  <input 
                    type="date"
                    required
                    value={newAssignment.dueDate}
                    onChange={(e) => setNewAssignment({...newAssignment, dueDate: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Max Marks</label>
                  <input 
                    type="number"
                    required
                    min="1"
                    value={newAssignment.maxMarks}
                    onChange={(e) => setNewAssignment({...newAssignment, maxMarks: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                  />
                </div>
              </div>
              
              <div className="pt-4 flex gap-4">
                <Button type="button" variant="secondary" onClick={() => setShowAddAssignmentModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Create
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Add Material Modal */}
        {showAddMaterialModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-kenya-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl border border-gray-100"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-kenya-black">Upload Material</h3>
                <button onClick={() => setShowAddMaterialModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddMaterial} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-kenya-black ml-1">Material Title</label>
                  <input 
                    type="text" 
                    required
                    value={newMaterial.title}
                    onChange={(e) => setNewMaterial({...newMaterial, title: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                    placeholder="e.g. Mathematics Revision Guide"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-kenya-black ml-1">Subject</label>
                  <select 
                    value={newMaterial.subject}
                    onChange={(e) => setNewMaterial({...newMaterial, subject: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                  >
                    {learningAreas.map(la => (
                      <option key={la} value={la}>{la}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-kenya-black ml-1">File Type</label>
                  <select 
                    value={newMaterial.fileType}
                    onChange={(e) => setNewMaterial({...newMaterial, fileType: e.target.value as any})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                  >
                    <option value="PDF">PDF Document</option>
                    <option value="DOCX">Word Document</option>
                    <option value="ZIP">Compressed Archive</option>
                  </select>
                </div>
                <Button type="submit" className="w-full py-4 rounded-xl font-bold">Upload & Send for Approval</Button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Bulk Upload Preview Modal */}
        {showBulkPreview && bulkPreviewData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-kenya-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[2.5rem] w-full max-w-4xl p-8 shadow-2xl border border-gray-100 max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-kenya-black">Preview Marks Import</h3>
                  <p className="text-sm text-gray-500">Review the data before saving.</p>
                </div>
                <button onClick={() => { setShowBulkPreview(false); setBulkPreviewData(null); }} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto border border-gray-100 rounded-2xl mb-6">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Admission No</th>
                      {bulkPreviewData.type === 'multi' ? (
                        Object.keys(bulkPreviewData.subjectIndices).map(subject => (
                          <th key={subject} className="px-6 py-4">{subject}</th>
                        ))
                      ) : (
                        <th className="px-6 py-4">Score</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {bulkPreviewData.data.slice(bulkPreviewData.type === 'multi' ? 1 : 0).map((row: any, index: number) => {
                      if (bulkPreviewData.type === 'single' && index === 0 && isNaN(Number(row[1]))) return null;
                      const admNo = String(row[0]).trim();
                      const student = allStudents.find(s => s.adm === admNo);
                      let hasError = !student;
                      
                      if (!hasError && bulkPreviewData.type === 'multi') {
                        Object.values(bulkPreviewData.subjectIndices).forEach((idx: any) => {
                          const score = parseFloat(row[idx]);
                          if (score > 100 || score < 0) hasError = true;
                        });
                      } else if (!hasError && bulkPreviewData.type === 'single') {
                        const score = parseFloat(row[1]);
                        if (score > 100 || score < 0) hasError = true;
                      }

                      return (
                        <tr key={index} className={hasError ? 'bg-red-50/50' : 'hover:bg-gray-50/50'}>
                          <td className="px-6 py-4">
                            {student ? (
                              hasError ? (
                                <span className="text-red-600 flex items-center gap-1 text-xs font-bold"><AlertCircle className="w-4 h-4" /> Invalid Marks</span>
                              ) : (
                                <span className="text-kenya-green flex items-center gap-1 text-xs font-bold"><CheckCircle2 className="w-4 h-4" /> Valid</span>
                              )
                            ) : (
                              <span className="text-red-600 flex items-center gap-1 text-xs font-bold"><AlertCircle className="w-4 h-4" /> Student Not Found</span>
                            )}
                          </td>
                          <td className="px-6 py-4 font-mono text-sm">{admNo}</td>
                          {bulkPreviewData.type === 'multi' ? (
                            Object.values(bulkPreviewData.subjectIndices).map((idx: any, i) => (
                              <td key={i} className={`px-6 py-4 font-bold ${parseFloat(row[idx]) > 100 || parseFloat(row[idx]) < 0 ? 'text-red-600' : 'text-kenya-black'}`}>
                                {row[idx] !== undefined ? row[idx] : '--'}
                              </td>
                            ))
                          ) : (
                            <td className={`px-6 py-4 font-bold ${parseFloat(row[1]) > 100 || parseFloat(row[1]) < 0 ? 'text-red-600' : 'text-kenya-black'}`}>
                              {row[1]}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-4 mt-auto">
                <Button variant="secondary" onClick={() => { setShowBulkPreview(false); setBulkPreviewData(null); }}>Cancel</Button>
                <Button onClick={confirmBulkUpload}>Confirm & Save Marks</Button>
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
                <h3 className="text-2xl font-bold text-kenya-black">Admit New Learner</h3>
                <button onClick={() => setShowAddStudentModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
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
                  <label className="text-sm font-bold text-kenya-black ml-1">Class</label>
                  <input 
                    type="text" 
                    value={managedClass}
                    disabled
                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 font-bold"
                  />
                </div>
                <Button type="submit" className="w-full py-4 rounded-xl font-bold">Admit Learner</Button>
              </form>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
};
