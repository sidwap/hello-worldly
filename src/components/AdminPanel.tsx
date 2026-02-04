import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Edit, Plus, Save, X, Users, CheckCircle, XCircle, Ban, UserCheck, History, Download, CalendarIcon, FileText, Upload, FileJson, Eye, Search, Filter, GraduationCap } from 'lucide-react';
import { NoticeManager } from './NoticeManager';
import ExamManager from './admin/ExamManager';
import { getAvailableExams, getExamShortName, type ExamType } from '@/config/examConfig';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  exportUserTestHistory, 
  exportTopUsersByDate, 
  exportAllTimeTopUsers, 
  exportPerTestTopUsers,
  generateUserTestHistoryPDF,
  generateTopUsersByDatePDF,
  generateAllTimeTopUsersPDF,
  generatePerTestTopUsersPDF
} from '@/utils/pdfExport';
import PDFPreviewDialog from './PDFPreviewDialog';

interface TypingTest {
  id: string;
  title: string;
  content: string;
  language: 'english' | 'hindi';
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  time_limit: number;
  is_active: boolean;
  created_at: string;
}

interface AdminPanelProps {
  onTestCreated?: (test: TypingTest) => void;
}

const AdminPanel = ({ onTestCreated }: AdminPanelProps) => {
  const [newTest, setNewTest] = useState({
    title: '',
    content: '',
    language: 'english' as 'english' | 'hindi',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    category: '',
    time_limit: 0 // Time in minutes
  });

  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTest, setEditingTest] = useState<TypingTest | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    language: 'english' as 'english' | 'hindi',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    category: '',
    time_limit: 0
  });

  const [selectedUserForHistory, setSelectedUserForHistory] = useState<string | null>(null);
  const [selectedDateForReport, setSelectedDateForReport] = useState<Date>();
  const [selectedTestForReport, setSelectedTestForReport] = useState<string | null>(null);

  // Bulk import state
  const [bulkJsonText, setBulkJsonText] = useState('');
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [bulkImportProgress, setBulkImportProgress] = useState({ current: 0, total: 0 });
  const [bulkImportResults, setBulkImportResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  // PDF Preview state
  const [pdfPreviewConfig, setPdfPreviewConfig] = useState<{
    isOpen: boolean;
    title: string;
    generatePDF: () => Promise<any>;
    fileName: string;
  } | null>(null);

  // Search states
  const [testSearchQuery, setTestSearchQuery] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [userHistorySearch, setUserHistorySearch] = useState('');
  
  // Exam type filter for reports
  const [reportExamType, setReportExamType] = useState<string>('all');
  const availableExams = getAvailableExams();

  const queryClient = useQueryClient();

  // Fetch all tests for admin view
  const { data: tests = [], refetch: refetchTests } = useQuery({
    queryKey: ['admin-tests'],
    queryFn: async () => {
      // Fetch all tests by paginating to overcome the 1000 row limit
      let allTests: TypingTest[] = [];
      let from = 0;
      const pageSize = 1000;
      let hasMore = true;
      
      while (hasMore) {
        const { data, error } = await supabase
          .from('typing_tests')
          .select('*')
          .order('created_at', { ascending: false })
          .range(from, from + pageSize - 1);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          allTests = [...allTests, ...data as TypingTest[]];
          from += pageSize;
          hasMore = data.length === pageSize;
        } else {
          hasMore = false;
        }
      }
      
      return allTests;
    }
  });

  // Get unique categories
  const categories = Array.from(new Set(tests.map(test => test.category))).filter(Boolean);

  // Fetch all users for admin management
  const { data: users = [], refetch: refetchUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // Fetch test counts for each user
      const usersWithCounts = await Promise.all(
        data.map(async (user) => {
          const { count } = await supabase
            .from('test_results')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
          
          return { ...user, test_count: count || 0 };
        })
      );
      
      return usersWithCounts;
    }
  });

  // Fetch test history for selected user
  const { data: userTestHistory = [] } = useQuery({
    queryKey: ['user-test-history', selectedUserForHistory],
    queryFn: async () => {
      if (!selectedUserForHistory) return [];
      
      const { data, error } = await supabase
        .from('test_results')
        .select(`
          *,
          typing_tests (
            title,
            category,
            language
          )
        `)
        .eq('user_id', selectedUserForHistory)
        .order('completed_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedUserForHistory
  });

  const handleUpdateUserStatus = async (userId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `User ${status === 'active' ? 'approved' : status === 'restricted' ? 'restricted' : 'updated'} successfully`,
      });
      refetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });
      refetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!newTest.title || !newTest.content || !newTest.category) {
        throw new Error('Please fill in all required fields');
      }

      const { data, error } = await supabase
        .from('typing_tests')
        .insert([{
          title: newTest.title,
          content: newTest.content.trim(),
          language: newTest.language,
          difficulty: newTest.difficulty,
          category: newTest.category.trim(),
          time_limit: newTest.time_limit * 60 // Convert minutes to seconds
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Test created successfully!",
      });

      // Reset form
      setNewTest({
        title: '',
        content: '',
        language: 'english',
        difficulty: 'medium',
        category: '',
        time_limit: 1
      });

      // Refresh data
      refetchTests();
      queryClient.invalidateQueries({ queryKey: ['typing-tests'] });

      if (onTestCreated) {
        onTestCreated(data as TypingTest);
      }
    } catch (error: any) {
      console.error('Error creating test:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTest = async (testId: string) => {
    try {
      const { error } = await supabase
        .from('typing_tests')
        .delete()
        .eq('id', testId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Test deleted successfully!",
      });

      refetchTests();
      queryClient.invalidateQueries({ queryKey: ['typing-tests'] });
    } catch (error: any) {
      console.error('Error deleting test:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (testId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('typing_tests')
        .update({ is_active: !isActive })
        .eq('id', testId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Test ${!isActive ? 'activated' : 'deactivated'} successfully!`,
      });

      refetchTests();
      queryClient.invalidateQueries({ queryKey: ['typing-tests'] });
    } catch (error: any) {
      console.error('Error updating test:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.trim()) return;

    try {
      // Create a placeholder test with the new category
      const { error } = await supabase
        .from('typing_tests')
        .insert([{
          title: `Sample ${newCategory} Test`,
          content: 'This is a sample test for the new category. You can edit or delete this test.',
          language: 'english',
          difficulty: 'medium',
          category: newCategory.trim(),
          time_limit: 60,
          is_active: false
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category created successfully!",
      });

      setNewCategory('');
      refetchTests();
      queryClient.invalidateQueries({ queryKey: ['typing-tests'] });
    } catch (error: any) {
      console.error('Error creating category:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditCategory = async (oldCategory: string) => {
    if (!editCategoryName.trim() || editCategoryName === oldCategory) {
      setEditingCategory(null);
      setEditCategoryName('');
      return;
    }

    try {
      const { error } = await supabase
        .from('typing_tests')
        .update({ category: editCategoryName.trim() })
        .eq('category', oldCategory);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category updated successfully!",
      });

      setEditingCategory(null);
      setEditCategoryName('');
      refetchTests();
      queryClient.invalidateQueries({ queryKey: ['typing-tests'] });
    } catch (error: any) {
      console.error('Error updating category:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (category: string) => {
    try {
      const { error } = await supabase
        .from('typing_tests')
        .delete()
        .eq('category', category);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category and all its tests deleted successfully!",
      });

      refetchTests();
      queryClient.invalidateQueries({ queryKey: ['typing-tests'] });
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditTest = (test: TypingTest) => {
    setEditingTest(test);
    setEditForm({
      title: test.title,
      content: test.content,
      language: test.language,
      difficulty: test.difficulty,
      category: test.category,
      time_limit: Math.floor(test.time_limit / 60) // Convert seconds to minutes
    });
  };

  const handleCancelEdit = () => {
    setEditingTest(null);
    setEditForm({
      title: '',
      content: '',
      language: 'english',
      difficulty: 'medium',
      category: '',
      time_limit: 0
    });
  };

  const handleUpdateTest = async () => {
    if (!editingTest) return;
    setIsSubmitting(true);

    try {
      if (!editForm.title || !editForm.content || !editForm.category) {
        throw new Error('Please fill in all required fields');
      }

      const { error } = await supabase
        .from('typing_tests')
        .update({
          title: editForm.title,
          content: editForm.content.trim(),
          language: editForm.language,
          difficulty: editForm.difficulty,
          category: editForm.category.trim(),
          time_limit: editForm.time_limit * 60 // Convert minutes to seconds
        })
        .eq('id', editingTest.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Test updated successfully!",
      });

      handleCancelEdit();
      refetchTests();
      queryClient.invalidateQueries({ queryKey: ['typing-tests'] });
    } catch (error: any) {
      console.error('Error updating test:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${seconds}s`;
  };

  // Bulk import handler
  const handleBulkImport = async (jsonData: string) => {
    setIsBulkImporting(true);
    setBulkImportResults(null);
    setBulkImportProgress({ current: 0, total: 0 });

    try {
      const parsed = JSON.parse(jsonData);
      
      if (!parsed.paragraphs || !Array.isArray(parsed.paragraphs)) {
        throw new Error('Invalid JSON format. Expected { "paragraphs": [...] }');
      }

      const paragraphs = parsed.paragraphs;
      const total = paragraphs.length;
      setBulkImportProgress({ current: 0, total });
      
      let successCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < paragraphs.length; i++) {
        const para = paragraphs[i];
        setBulkImportProgress({ current: i + 1, total });
        
        try {
          if (!para.title || !para.content || !para.category) {
            throw new Error(`Missing required fields (title, content, category)`);
          }

          const timeLimit = parseInt(para.time) || 10;
          const language = (para.language?.toLowerCase() === 'hindi' ? 'hindi' : 'english') as 'english' | 'hindi';
          const difficulty = (['easy', 'medium', 'hard'].includes(para.difficulty?.toLowerCase()) 
            ? para.difficulty.toLowerCase() 
            : 'medium') as 'easy' | 'medium' | 'hard';

          const { error } = await supabase
            .from('typing_tests')
            .insert([{
              title: para.title.trim(),
              content: para.content.trim(),
              language: language,
              difficulty: difficulty,
              category: para.category.trim(),
              time_limit: timeLimit * 60 // Convert minutes to seconds
            }]);

          if (error) throw error;
          successCount++;
        } catch (err: any) {
          failedCount++;
          errors.push(`"${para.title || para.id || 'Unknown'}": ${err.message}`);
        }
      }

      setBulkImportResults({ success: successCount, failed: failedCount, errors });

      if (successCount > 0) {
        toast({
          title: "Bulk Import Complete",
          description: `Successfully created ${successCount} test(s)${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
        });
        refetchTests();
        queryClient.invalidateQueries({ queryKey: ['typing-tests'] });
      } else {
        toast({
          title: "Import Failed",
          description: "No tests were imported. Check the errors below.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "JSON Parse Error",
        description: err.message,
        variant: "destructive",
      });
      setBulkImportResults({ success: 0, failed: 0, errors: [err.message] });
    } finally {
      setIsBulkImporting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setBulkJsonText(content);
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  // Export category tests as JSON
  const handleExportCategory = (category: string) => {
    const categoryTests = tests.filter(t => t.category === category);
    
    if (categoryTests.length === 0) {
      toast({
        title: 'No Tests',
        description: 'No tests found in this category to export',
        variant: 'destructive',
      });
      return;
    }

    // Format to match import JSON structure
    const exportData = {
      paragraphs: categoryTests.map(test => ({
        title: test.title,
        content: test.content,
        category: test.category,
        difficulty: test.difficulty,
        time: Math.floor(test.time_limit / 60), // Convert seconds to minutes
        language: test.language.charAt(0).toUpperCase() + test.language.slice(1) // Capitalize
      }))
    };

    // Create and download JSON file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${category.replace(/\s+/g, '_')}_tests_backup.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Export Successful',
      description: `Exported ${categoryTests.length} test(s) from "${category}"`,
    });
  };

  // Fetch leaderboard data for reports with additional data (filtered by exam type)
  const { data: allTimeTopUsers = [] } = useQuery({
    queryKey: ['all-time-leaderboard', reportExamType],
    queryFn: async () => {
      // Build query with exam type filter
      let query = supabase
        .from('test_results')
        .select(`
          id,
          user_id,
          wpm,
          accuracy,
          time_taken,
          total_words,
          exam_type,
          completed_at,
          profiles!inner(full_name, email),
          typing_tests!inner(language, title)
        `)
        .gte('accuracy', 85)
        .order('wpm', { ascending: false })
        .limit(100);

      // Filter by exam type
      if (reportExamType !== 'all') {
        query = query.eq('exam_type', reportExamType);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Filter for qualification criteria and format data
      const qualified = (data || [])
        .filter((r: any) => r.time_taken >= 600 || (r.total_words || 0) >= 400)
        .map((r: any) => ({
          result_id: r.id,
          user_id: r.user_id,
          wpm: r.wpm,
          accuracy: r.accuracy,
          time_taken: r.time_taken,
          total_words: r.total_words || 0,
          exam_type: r.exam_type,
          completed_at: r.completed_at,
          language: r.typing_tests?.language || 'english',
          test_title: r.typing_tests?.title || 'Unknown Test',
          display_name: r.profiles?.full_name || 
            (r.profiles?.email ? r.profiles.email.split('@')[0] : 'Anonymous'),
        }));
      
      return qualified;
    }
  });

  // Fetch leaderboard data for specific test with additional data
  const { data: testTopUsers = [] } = useQuery({
    queryKey: ['test-leaderboard', selectedTestForReport],
    queryFn: async () => {
      if (!selectedTestForReport) return [];
      const { data, error } = await supabase.rpc('get_leaderboard', { p_test_id: selectedTestForReport });
      if (error) throw error;
      
      // Fetch additional data (completed_at, language, and title) for each result
      if (data && data.length > 0) {
        const resultIds = data.map((item: any) => item.result_id);
        const { data: additionalData, error: additionalError } = await supabase
          .from('test_results')
          .select(`
            id,
            completed_at,
            typing_tests!inner(language, title)
          `)
          .in('id', resultIds);
        
        if (!additionalError && additionalData) {
          // Merge additional data with leaderboard data
          return data.map((item: any) => {
            const additional = additionalData.find((ad: any) => ad.id === item.result_id);
            return {
              ...item,
              completed_at: additional?.completed_at,
              language: additional?.typing_tests?.language || 'english',
              test_title: additional?.typing_tests?.title || 'Unknown Test'
            };
          });
        }
      }
      
      return data || [];
    },
    enabled: !!selectedTestForReport
  });

  const handlePreviewUserHistory = (userName: string) => {
    if (userTestHistory.length === 0) {
      toast({
        title: 'No Data',
        description: 'No test history available to export',
        variant: 'destructive',
      });
      return;
    }

    setPdfPreviewConfig({
      isOpen: true,
      title: `Test History - ${userName}`,
      generatePDF: () => generateUserTestHistoryPDF(userName, userTestHistory),
      fileName: `${userName.replace(/\s+/g, '_')}_test_history_${Date.now()}.pdf`
    });
  };

  const handleExportUserHistory = (userName: string) => {
    if (userTestHistory.length === 0) {
      toast({
        title: 'No Data',
        description: 'No test history available to export',
        variant: 'destructive',
      });
      return;
    }

    try {
      exportUserTestHistory(userName, userTestHistory);
      toast({
        title: 'Success',
        description: 'User test history exported successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to export test history',
        variant: 'destructive',
      });
    }
  };

  const handlePreviewAllTimeTopUsers = () => {
    if (allTimeTopUsers.length === 0) {
      toast({
        title: 'No Data',
        description: 'No leaderboard data available to export',
        variant: 'destructive',
      });
      return;
    }

    setPdfPreviewConfig({
      isOpen: true,
      title: 'All-Time Top Users',
      generatePDF: () => generateAllTimeTopUsersPDF(allTimeTopUsers),
      fileName: `all_time_top_users_${Date.now()}.pdf`
    });
  };

  const handleExportAllTimeTopUsers = () => {
    if (allTimeTopUsers.length === 0) {
      toast({
        title: 'No Data',
        description: 'No leaderboard data available to export',
        variant: 'destructive',
      });
      return;
    }

    try {
      exportAllTimeTopUsers(allTimeTopUsers);
      toast({
        title: 'Success',
        description: 'All-time top users report exported successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to export report',
        variant: 'destructive',
      });
    }
  };

  const handleExportDateTopUsers = async () => {
    if (!selectedDateForReport) {
      toast({
        title: 'Error',
        description: 'Please select a date first',
        variant: 'destructive',
      });
      return;
    }

    try {
      const dateStr = format(selectedDateForReport, 'yyyy-MM-dd');
      
      // Fetch top users for the selected date with exam type filter
      let query = supabase
        .from('test_results')
        .select('id, user_id, wpm, accuracy, time_taken, total_words, completed_at, test_id, exam_type')
        .gte('completed_at', `${dateStr}T00:00:00`)
        .lte('completed_at', `${dateStr}T23:59:59`)
        .gte('accuracy', 85)
        .order('wpm', { ascending: false });

      // Apply exam type filter
      if (reportExamType !== 'all') {
        query = query.eq('exam_type', reportExamType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Date top users query error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        toast({
          title: 'No Data',
          description: 'No qualified users found for this date',
          variant: 'destructive',
        });
        return;
      }

      // Get unique user IDs and test IDs
      const userIds = [...new Set(data.map((result: any) => result.user_id))];
      const testIds = [...new Set(data.map((result: any) => result.test_id))];
      
      // Fetch profile details
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      if (profileError) {
        console.error('Profile query error:', profileError);
        throw profileError;
      }

      // Fetch test details for languages and titles
      const { data: testData, error: testError } = await supabase
        .from('typing_tests')
        .select('id, language, title')
        .in('id', testIds);

      if (testError) {
        console.error('Test details query error:', testError);
        throw testError;
      }

      // Create maps for quick lookup
      const profileMap = new Map(
        profileData?.map((profile: any) => [profile.id, profile]) || []
      );
      const testMap = new Map(
        testData?.map((test: any) => [test.id, test]) || []
      );

      // Filter and format the data
      const topUsers = data
        .filter((result: any) => 
          result.accuracy >= 85 && 
          (result.time_taken >= 600 || (result.total_words || 0) >= 400)
        )
        .map((result: any) => {
          const profile = profileMap.get(result.user_id);
          const test = testMap.get(result.test_id);
          return {
            result_id: result.id,
            user_id: result.user_id,
            wpm: result.wpm,
            accuracy: result.accuracy,
            time_taken: result.time_taken,
            total_words: result.total_words || 0,
            completed_at: result.completed_at,
            language: test?.language || 'english',
            test_title: test?.title || 'Unknown Test',
            display_name: profile?.full_name || 
                         profile?.email?.split('@')[0] || 
                         'Anonymous'
          };
        })
        .slice(0, 100);

      if (topUsers.length === 0) {
        toast({
          title: 'No Data',
          description: 'No qualified users found for this date',
          variant: 'destructive',
        });
        return;
      }

      // Open preview
      setPdfPreviewConfig({
        isOpen: true,
        title: `Top Users - ${format(selectedDateForReport, 'PP')}`,
        generatePDF: () => generateTopUsersByDatePDF(dateStr, topUsers),
        fileName: `top_users_${dateStr}_${Date.now()}.pdf`
      });
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to export report',
        variant: 'destructive',
      });
    }
  };

  const handlePreviewTestTopUsers = async () => {
    if (!selectedTestForReport) {
      toast({
        title: 'Error',
        description: 'Please select a test first',
        variant: 'destructive',
      });
      return;
    }

    if (testTopUsers.length === 0) {
      toast({
        title: 'No Data',
        description: 'No leaderboard data available for this test',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Fetch test details
      const { data: testData, error } = await supabase
        .from('typing_tests')
        .select('title, content')
        .eq('id', selectedTestForReport)
        .single();

      if (error) throw error;

      setPdfPreviewConfig({
        isOpen: true,
        title: `Top Users - ${testData.title}`,
        generatePDF: () => generatePerTestTopUsersPDF(testData.title, testData.content, testTopUsers),
        fileName: `top_users_${testData.title.replace(/\s+/g, '_')}_${Date.now()}.pdf`
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load test details',
        variant: 'destructive',
      });
    }
  };

  const handleExportTestTopUsers = async () => {
    if (!selectedTestForReport) {
      toast({
        title: 'Error',
        description: 'Please select a test first',
        variant: 'destructive',
      });
      return;
    }

    if (testTopUsers.length === 0) {
      toast({
        title: 'No Data',
        description: 'No leaderboard data available for this test',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Fetch test details
      const { data: testData, error } = await supabase
        .from('typing_tests')
        .select('title, content')
        .eq('id', selectedTestForReport)
        .single();

      if (error) throw error;

      exportPerTestTopUsers(testData.title, testData.content, testTopUsers);
      toast({
        title: 'Success',
        description: 'Test top users report exported successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to export report',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin Panel</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="create-test" className="space-y-4">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="exams">Manage Exams</TabsTrigger>
              <TabsTrigger value="create-test">Create Test</TabsTrigger>
              <TabsTrigger value="bulk-import">Bulk Import</TabsTrigger>
              <TabsTrigger value="manage-tests">Manage Tests</TabsTrigger>
              <TabsTrigger value="manage-categories">Categories</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="notices">Notices</TabsTrigger>
            </TabsList>
            
            <TabsContent value="exams">
              <ExamManager />
            </TabsContent>

            <TabsContent value="create-test">
              <form onSubmit={handleCreateTest} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Test Title *</Label>
                    <Input
                      id="title"
                      value={newTest.title}
                      onChange={(e) => setNewTest({ ...newTest, title: e.target.value })}
                      placeholder="Enter test title"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Input
                      id="category"
                      value={newTest.category}
                      onChange={(e) => setNewTest({ ...newTest, category: e.target.value })}
                      placeholder="Enter category name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select value={newTest.language} onValueChange={(value: 'english' | 'hindi') => setNewTest({ ...newTest, language: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="english">English</SelectItem>
                        <SelectItem value="hindi">Hindi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty</Label>
                    <Select value={newTest.difficulty} onValueChange={(value: 'easy' | 'medium' | 'hard') => setNewTest({ ...newTest, difficulty: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time_limit">Time Limit (minutes) *</Label>
                    <Input
                      id="time_limit"
                      type="number"
                      min="1"
                      max="60"
                      value={newTest.time_limit}
                      onChange={(e) => setNewTest({ ...newTest, time_limit: parseInt(e.target.value) || 1 })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Test Content *</Label>
                  <Textarea
                    id="content"
                    value={newTest.content}
                    onChange={(e) => setNewTest({ ...newTest, content: e.target.value })}
                    placeholder="Enter the text for typing test"
                    className="min-h-[200px]"
                    required
                  />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Words: {newTest.content.split(' ').filter(word => word.length > 0).length}
                  </p>
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? 'Creating...' : 'Create Test'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="bulk-import">
              <div className="space-y-6">
                <div className="bg-muted/50 p-4 rounded-lg border border-border">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <FileJson className="h-5 w-5" />
                    JSON Format Reference
                  </h3>
                  <pre className="text-xs bg-background p-3 rounded overflow-x-auto border">
{`{
  "paragraphs": [
    {
      "id": "1",
      "title": "Test Title",
      "content": "Paragraph text content...",
      "category": "Category Name",
      "difficulty": "easy | medium | hard",
      "time": "15",
      "language": "English | Hindi"
    }
  ]
}`}
                  </pre>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Label htmlFor="json-file" className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                        <Upload className="h-4 w-4" />
                        Upload JSON File
                      </div>
                      <input
                        id="json-file"
                        type="file"
                        accept=".json"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </Label>
                    <span className="text-sm text-muted-foreground">or paste JSON below</span>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bulk-json">JSON Data</Label>
                    <Textarea
                      id="bulk-json"
                      value={bulkJsonText}
                      onChange={(e) => setBulkJsonText(e.target.value)}
                      placeholder='{"paragraphs": [...]}'
                      className="min-h-[300px] font-mono text-sm"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <Button 
                        onClick={() => handleBulkImport(bulkJsonText)}
                        disabled={isBulkImporting || !bulkJsonText.trim()}
                        className="flex items-center gap-2"
                      >
                        {isBulkImporting ? (
                          <>
                            <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Importing...
                          </>
                        ) : (
                          <>
                            <FileJson className="h-4 w-4" />
                            Import Tests
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setBulkJsonText('');
                          setBulkImportResults(null);
                          setBulkImportProgress({ current: 0, total: 0 });
                        }}
                        disabled={isBulkImporting}
                      >
                        Clear
                      </Button>
                    </div>

                    {isBulkImporting && bulkImportProgress.total > 0 && (
                      <div className="space-y-2 p-4 rounded-lg border bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium text-blue-700 dark:text-blue-300">
                            Importing tests...
                          </span>
                          <span className="font-bold text-blue-800 dark:text-blue-200">
                            {Math.round((bulkImportProgress.current / bulkImportProgress.total) * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-blue-200 dark:bg-blue-900 rounded-full h-3 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${(bulkImportProgress.current / bulkImportProgress.total) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          {bulkImportProgress.current} of {bulkImportProgress.total} tests processed
                        </p>
                      </div>
                    )}
                  </div>

                  {bulkImportResults && (
                    <div className={cn(
                      "p-4 rounded-lg border",
                      bulkImportResults.success > 0 && bulkImportResults.failed === 0 
                        ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                        : bulkImportResults.failed > 0 
                          ? "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800"
                          : "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
                    )}>
                      <div className="flex items-center gap-4 mb-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="font-medium">{bulkImportResults.success} Successful</span>
                        </div>
                        {bulkImportResults.failed > 0 && (
                          <div className="flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-red-600" />
                            <span className="font-medium">{bulkImportResults.failed} Failed</span>
                          </div>
                        )}
                      </div>
                      {bulkImportResults.errors.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium mb-1">Errors:</p>
                          <ScrollArea className="h-[100px]">
                            <ul className="text-sm text-muted-foreground space-y-1">
                              {bulkImportResults.errors.map((err, idx) => (
                                <li key={idx} className="text-red-600 dark:text-red-400">• {err}</li>
                              ))}
                            </ul>
                          </ScrollArea>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="manage-tests">
              <div className="space-y-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Tests: {tests.length} | Active: {tests.filter(t => t.is_active).length}
                </div>
                
                {editingTest ? (
                  <Card className="p-6 border-2 border-primary">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Edit Test</h3>
                        <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-title">Test Title *</Label>
                          <Input
                            id="edit-title"
                            value={editForm.title}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            placeholder="Enter test title"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="edit-category">Category *</Label>
                          <Input
                            id="edit-category"
                            value={editForm.category}
                            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                            placeholder="Enter category name"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="edit-language">Language</Label>
                          <Select value={editForm.language} onValueChange={(value: 'english' | 'hindi') => setEditForm({ ...editForm, language: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="english">English</SelectItem>
                              <SelectItem value="hindi">Hindi</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="edit-difficulty">Difficulty</Label>
                          <Select value={editForm.difficulty} onValueChange={(value: 'easy' | 'medium' | 'hard') => setEditForm({ ...editForm, difficulty: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="easy">Easy</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="hard">Hard</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="edit-time-limit">Time Limit (minutes) *</Label>
                          <Input
                            id="edit-time-limit"
                            type="number"
                            min="1"
                            max="60"
                            value={editForm.time_limit}
                            onChange={(e) => setEditForm({ ...editForm, time_limit: parseInt(e.target.value) || 1 })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-content">Test Content *</Label>
                        <Textarea
                          id="edit-content"
                          value={editForm.content}
                          onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                          placeholder="Enter the text for typing test"
                          className="min-h-[200px]"
                        />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Words: {editForm.content.split(' ').filter(word => word.length > 0).length}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={handleUpdateTest} disabled={isSubmitting} className="flex-1">
                          {isSubmitting ? 'Updating...' : 'Update Test'}
                        </Button>
                        <Button variant="outline" onClick={handleCancelEdit} className="flex-1">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {/* Search box for tests */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search tests by title, category, or language..."
                        value={testSearchQuery}
                        onChange={(e) => setTestSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                    {tests
                      .filter(test => {
                        if (!testSearchQuery.trim()) return true;
                        const searchLower = testSearchQuery.toLowerCase();
                        return test.title.toLowerCase().includes(searchLower) ||
                               test.category.toLowerCase().includes(searchLower) ||
                               test.language.toLowerCase().includes(searchLower);
                      })
                      .map((test) => (
                      <Card key={test.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{test.title}</h3>
                              <Badge variant="outline">{test.language}</Badge>
                              <Badge variant="outline">{test.difficulty}</Badge>
                              <Badge variant="outline">{test.category}</Badge>
                              <Badge variant={test.is_active ? "default" : "secondary"}>
                                {test.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {test.content.substring(0, 100)}...
                            </p>
                            <div className="text-xs text-gray-500">
                              Time: {formatTime(test.time_limit)} | Words: {test.content.split(' ').length}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditTest(test)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              size="sm"
                              variant={test.is_active ? "secondary" : "default"}
                              onClick={() => handleToggleActive(test.id, test.is_active)}
                            >
                              {test.is_active ? "Deactivate" : "Activate"}
                            </Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Test</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{test.title}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteTest(test.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </Card>
                    ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="manage-categories">
              <div className="space-y-6">
                {/* Create New Category */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Create New Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Input
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="Enter category name"
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
                      />
                      <Button onClick={handleCreateCategory} disabled={!newCategory.trim()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Existing Categories */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Existing Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {categories.map((category) => (
                        <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            {editingCategory === category ? (
                              <Input
                                value={editCategoryName}
                                onChange={(e) => setEditCategoryName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleEditCategory(category);
                                  if (e.key === 'Escape') {
                                    setEditingCategory(null);
                                    setEditCategoryName('');
                                  }
                                }}
                                autoFocus
                                className="w-48"
                              />
                            ) : (
                              <>
                                <span className="font-medium capitalize">{category}</span>
                                <Badge variant="secondary">
                                  {tests.filter(t => t.category === category).length} tests
                                </Badge>
                              </>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {editingCategory === category ? (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleEditCategory(category)}
                                >
                                  <Save className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingCategory(null);
                                    setEditCategoryName('');
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleExportCategory(category)}
                                  title="Export category tests as JSON"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingCategory(category);
                                    setEditCategoryName(category);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="destructive">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Category</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete the "{category}" category? This will also delete all tests in this category. This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteCategory(category)}>
                                        Delete Category
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {categories.length === 0 && (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          No categories found. Create your first category above.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* User Management Tab */}
            <TabsContent value="users">
              <div className="space-y-6">
                {/* Top Users Reports Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Generate Top Users Reports
                      </div>
                      {/* Exam Type Filter for Reports */}
                      <Select value={reportExamType} onValueChange={setReportExamType}>
                        <SelectTrigger className="w-[180px]">
                          <Filter className="w-4 h-4 mr-2" />
                          <SelectValue placeholder="Exam Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Exams</SelectItem>
                          {availableExams.map(exam => (
                            <SelectItem key={exam.id} value={exam.id}>
                              {exam.shortName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* All-Time Top Users */}
                      <Card className="p-4">
                        <h3 className="font-semibold mb-2">All-Time Top Users</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Export leaderboard of top performing users 
                          {reportExamType !== 'all' && ` for ${getExamShortName(reportExamType)}`}
                        </p>
                        <div className="flex gap-2">
                          <Button 
                            onClick={handlePreviewAllTimeTopUsers}
                            variant="outline"
                            className="flex-1"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </Button>
                          <Button 
                            onClick={handleExportAllTimeTopUsers}
                            className="flex-1"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Export
                          </Button>
                        </div>
                      </Card>

                      {/* Date-Wise Top Users */}
                      <Card className="p-4">
                        <h3 className="font-semibold mb-2">Date-Wise Top Users</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Export leaderboard for a specific date
                        </p>
                        <div className="space-y-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !selectedDateForReport && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {selectedDateForReport ? format(selectedDateForReport, "PPP") : "Pick a date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={selectedDateForReport}
                                onSelect={setSelectedDateForReport}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <Button 
                            onClick={handleExportDateTopUsers}
                            disabled={!selectedDateForReport}
                            className="w-full"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Preview & Export
                          </Button>
                        </div>
                      </Card>

                      {/* Per-Test Top Users */}
                      <Card className="p-4">
                        <h3 className="font-semibold mb-2">Per-Test Top Users</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Export leaderboard for a specific test with test details
                        </p>
                        <div className="space-y-2">
                          <Select value={selectedTestForReport || ''} onValueChange={setSelectedTestForReport}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a test" />
                            </SelectTrigger>
                            <SelectContent>
                              {tests.filter(t => t.is_active).map((test) => (
                                <SelectItem key={test.id} value={test.id}>
                                  {test.title} ({test.category})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="flex gap-2">
                            <Button 
                              onClick={handlePreviewTestTopUsers}
                              disabled={!selectedTestForReport}
                              variant="outline"
                              className="flex-1"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </Button>
                            <Button 
                              onClick={handleExportTestTopUsers}
                              disabled={!selectedTestForReport}
                              className="flex-1"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Export
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      User Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Tests Completed</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src={user.avatar_url} />
                                    <AvatarFallback className="bg-primary text-primary-foreground">
                                      {getInitials(user.full_name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium">{user.full_name || 'Unknown'}</span>
                                </div>
                              </TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    user.status === 'active' ? 'default' :
                                    user.status === 'restricted' ? 'destructive' :
                                    'secondary'
                                  }
                                >
                                  {user.status || 'active'}
                                </Badge>
                              </TableCell>
                              <TableCell>{user.test_count || 0}</TableCell>
                              <TableCell>
                                {new Date(user.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-end gap-2">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setSelectedUserForHistory(user.id)}
                                        title="View Test History"
                                      >
                                        <History className="h-4 w-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-4xl max-h-[80vh]">
                                      <DialogHeader>
                                        <DialogTitle className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <History className="h-5 w-5" />
                                            Test History - {user.full_name || 'Unknown'}
                                          </div>
                                          <div className="flex gap-2">
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => handlePreviewUserHistory(user.full_name || 'Unknown')}
                                            >
                                              <Eye className="h-4 w-4 mr-2" />
                                              Preview
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => handleExportUserHistory(user.full_name || 'Unknown')}
                                            >
                                              <Download className="h-4 w-4 mr-2" />
                                              Export
                                            </Button>
                                          </div>
                                        </DialogTitle>
                                      </DialogHeader>
                                      <ScrollArea className="h-[60vh] pr-4">
                                        {userTestHistory.length > 0 ? (
                                          <div className="space-y-4">
                                            {userTestHistory.map((result: any) => {
                                              const isQualified = result.is_qualified ?? (result.accuracy >= 85 && (result.time_taken >= 600 || (result.total_words || 0) >= 400));
                                              const totalKeystrokes = result.total_keystrokes || (result.correct_keystrokes || 0) + (result.wrong_keystrokes || 0);
                                              
                                              return (
                                                <Card key={result.id}>
                                                  <CardContent className="pt-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                      <div>
                                                        <div className="flex items-center gap-2 mb-2">
                                                          <h3 className="font-semibold text-lg">
                                                            {result.typing_tests?.title || 'Unknown Test'}
                                                          </h3>
                                                          <Badge 
                                                            className={`text-xs ${
                                                              isQualified 
                                                                ? 'bg-green-100 text-green-700' 
                                                                : 'bg-red-100 text-red-700'
                                                            }`}
                                                          >
                                                            {isQualified ? 'Qualified' : 'Not Qualified'}
                                                          </Badge>
                                                        </div>
                                                        <div className="space-y-1 text-sm text-muted-foreground">
                                                          <p>Category: {result.typing_tests?.category || 'N/A'}</p>
                                                          <p>Language: {result.typing_tests?.language || 'N/A'}</p>
                                                          <p>Completed: {new Date(result.completed_at).toLocaleString()}</p>
                                                        </div>
                                                      </div>
                                                      <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                          <p className="text-sm text-muted-foreground">WPM</p>
                                                          <p className="text-2xl font-bold text-primary">{Number(result.wpm).toFixed(1)}</p>
                                                        </div>
                                                        <div>
                                                          <p className="text-sm text-muted-foreground">Accuracy</p>
                                                          <p className="text-2xl font-bold text-primary">{Number(result.accuracy).toFixed(1)}%</p>
                                                        </div>
                                                        <div>
                                                          <p className="text-sm text-muted-foreground">Time</p>
                                                          <p className="text-lg font-semibold">{formatTime(result.time_taken)}</p>
                                                        </div>
                                                        <div>
                                                          <p className="text-sm text-muted-foreground">Words</p>
                                                          <p className="text-lg font-semibold">{result.total_words || 0}</p>
                                                        </div>
                                                      </div>
                                                    </div>
                                                    <div className="mt-4 pt-4 border-t grid grid-cols-4 gap-4 text-sm">
                                                      <div>
                                                        <p className="text-muted-foreground">Correct Words</p>
                                                        <p className="font-medium text-green-600">{result.correct_words_count || 0}</p>
                                                      </div>
                                                      <div>
                                                        <p className="text-muted-foreground">Incorrect Words</p>
                                                        <p className="font-medium text-red-600">{result.incorrect_words || 0}</p>
                                                      </div>
                                                      <div>
                                                        <p className="text-muted-foreground">Gross WPM</p>
                                                        <p className="font-medium">{result.gross_wpm ? Number(result.gross_wpm).toFixed(1) : 'N/A'}</p>
                                                      </div>
                                                      <div>
                                                        <p className="text-muted-foreground">Keystrokes</p>
                                                        <p className="font-medium">{totalKeystrokes}</p>
                                                      </div>
                                                    </div>
                                                  </CardContent>
                                                </Card>
                                              );
                                            })}
                                          </div>
                                        ) : (
                                          <div className="text-center py-8 text-muted-foreground">
                                            No test history found for this user
                                          </div>
                                        )}
                                      </ScrollArea>
                                    </DialogContent>
                                  </Dialog>
                                  {user.status !== 'active' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleUpdateUserStatus(user.id, 'active')}
                                      title="Approve User"
                                    >
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    </Button>
                                  )}
                                  {user.status !== 'restricted' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleUpdateUserStatus(user.id, 'restricted')}
                                      title="Restrict User"
                                    >
                                      <Ban className="h-4 w-4 text-orange-600" />
                                    </Button>
                                  )}
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="sm" variant="destructive" title="Delete User">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete {user.full_name || 'this user'}? 
                                          This will permanently delete their profile and all associated data. 
                                          This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>
                                          Delete User
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                          {users.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                No users found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="notices">
              <NoticeManager />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* PDF Preview Dialog */}
      {pdfPreviewConfig && (
        <PDFPreviewDialog
          isOpen={pdfPreviewConfig.isOpen}
          onClose={() => setPdfPreviewConfig(null)}
          title={pdfPreviewConfig.title}
          generatePDF={pdfPreviewConfig.generatePDF}
          fileName={pdfPreviewConfig.fileName}
        />
      )}
    </div>
  );
};

export default AdminPanel;
