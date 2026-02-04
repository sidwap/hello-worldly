import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Trash2, 
  Edit, 
  Plus, 
  Save, 
  X, 
  Upload, 
  Image as ImageIcon,
  GripVertical,
  Eye,
  EyeOff
} from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Exam {
  id: string;
  slug: string;
  name: string;
  display_name: string;
  short_name: string;
  description: string | null;
  thumbnail_url: string | null;
  interface_theme: string;
  default_time_limit: number;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  min_accuracy: number;
  min_speed_english: number;
  min_speed_hindi: number;
  min_time_required: number;
  min_words_required: number;
  use_keystroke_speed: boolean;
  show_backspace_count: boolean;
  show_gross_net_speed: boolean;
  show_keystroke_speed: boolean;
  enable_sound: boolean;
  enable_font_size_control: boolean;
  enable_word_limit: boolean;
  default_word_limit_english: number;
  default_word_limit_hindi: number;
  show_skipped_words: boolean;
  show_extra_words: boolean;
  show_qualification_status: boolean;
  show_comparison_paragraph: boolean;
  show_error_rules: boolean;
  show_accuracy_formula: boolean;
}

const defaultExamForm: Partial<Exam> = {
  slug: '',
  name: '',
  display_name: '',
  short_name: '',
  description: '',
  interface_theme: 'default',
  default_time_limit: 900,
  is_active: true,
  is_featured: false,
  sort_order: 0,
  min_accuracy: 85,
  min_speed_english: 30,
  min_speed_hindi: 25,
  min_time_required: 600,
  min_words_required: 400,
  use_keystroke_speed: false,
  show_backspace_count: false,
  show_gross_net_speed: true,
  show_keystroke_speed: true,
  enable_sound: false,
  enable_font_size_control: false,
  enable_word_limit: true,
  default_word_limit_english: 500,
  default_word_limit_hindi: 400,
  show_skipped_words: false,
  show_extra_words: false,
  show_qualification_status: true,
  show_comparison_paragraph: true,
  show_error_rules: false,
  show_accuracy_formula: false,
};

const ExamManager = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [formData, setFormData] = useState<Partial<Exam>>(defaultExamForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const queryClient = useQueryClient();

  const { data: exams = [], isLoading } = useQuery({
    queryKey: ['admin-exams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as Exam[];
    }
  });

  const handleCreate = () => {
    setFormData(defaultExamForm);
    setIsCreating(true);
    setEditingExam(null);
  };

  const handleEdit = (exam: Exam) => {
    setFormData(exam);
    setEditingExam(exam);
    setIsCreating(false);
  };

  const handleCancel = () => {
    setFormData(defaultExamForm);
    setIsCreating(false);
    setEditingExam(null);
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingThumbnail(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${formData.slug || 'new'}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('exam-thumbnails')
        .upload(fileName, file, { upsert: true });
      
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('exam-thumbnails')
        .getPublicUrl(fileName);
      
      setFormData(prev => ({ ...prev, thumbnail_url: publicUrl }));
      toast({ title: 'Success', description: 'Thumbnail uploaded successfully' });
    } catch (error: any) {
      console.error('Error uploading thumbnail:', error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to upload thumbnail', 
        variant: 'destructive' 
      });
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.slug || !formData.display_name || !formData.short_name) {
      toast({ 
        title: 'Error', 
        description: 'Please fill in all required fields', 
        variant: 'destructive' 
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const examData = {
        slug: formData.slug,
        name: formData.slug,
        display_name: formData.display_name,
        short_name: formData.short_name,
        description: formData.description || null,
        thumbnail_url: formData.thumbnail_url || null,
        interface_theme: formData.interface_theme || 'default',
        default_time_limit: formData.default_time_limit || 900,
        is_active: formData.is_active ?? true,
        is_featured: formData.is_featured ?? false,
        sort_order: formData.sort_order || 0,
        min_accuracy: formData.min_accuracy || 85,
        min_speed_english: formData.min_speed_english || 30,
        min_speed_hindi: formData.min_speed_hindi || 25,
        min_time_required: formData.min_time_required || 600,
        min_words_required: formData.min_words_required || 400,
        use_keystroke_speed: formData.use_keystroke_speed ?? false,
        show_backspace_count: formData.show_backspace_count ?? false,
        show_gross_net_speed: formData.show_gross_net_speed ?? true,
        show_keystroke_speed: formData.show_keystroke_speed ?? true,
        enable_sound: formData.enable_sound ?? false,
        enable_font_size_control: formData.enable_font_size_control ?? false,
        enable_word_limit: formData.enable_word_limit ?? true,
        default_word_limit_english: formData.default_word_limit_english || 500,
        default_word_limit_hindi: formData.default_word_limit_hindi || 400,
        show_skipped_words: formData.show_skipped_words ?? false,
        show_extra_words: formData.show_extra_words ?? false,
        show_qualification_status: formData.show_qualification_status ?? true,
        show_comparison_paragraph: formData.show_comparison_paragraph ?? true,
        show_error_rules: formData.show_error_rules ?? false,
        show_accuracy_formula: formData.show_accuracy_formula ?? false,
      };

      if (editingExam) {
        const { error } = await supabase
          .from('exams')
          .update(examData)
          .eq('id', editingExam.id);
        
        if (error) throw error;
        toast({ title: 'Success', description: 'Exam updated successfully' });
      } else {
        const { error } = await supabase
          .from('exams')
          .insert([examData]);
        
        if (error) throw error;
        toast({ title: 'Success', description: 'Exam created successfully' });
      }

      handleCancel();
      queryClient.invalidateQueries({ queryKey: ['admin-exams'] });
      queryClient.invalidateQueries({ queryKey: ['featured-exams'] });
      queryClient.invalidateQueries({ queryKey: ['all-exams'] });
    } catch (error: any) {
      console.error('Error saving exam:', error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to save exam', 
        variant: 'destructive' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (examId: string) => {
    try {
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', examId);
      
      if (error) throw error;
      
      toast({ title: 'Success', description: 'Exam deleted successfully' });
      queryClient.invalidateQueries({ queryKey: ['admin-exams'] });
    } catch (error: any) {
      console.error('Error deleting exam:', error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to delete exam', 
        variant: 'destructive' 
      });
    }
  };

  const handleToggleActive = async (exam: Exam) => {
    try {
      const { error } = await supabase
        .from('exams')
        .update({ is_active: !exam.is_active })
        .eq('id', exam.id);
      
      if (error) throw error;
      
      toast({ 
        title: 'Success', 
        description: `Exam ${!exam.is_active ? 'activated' : 'deactivated'} successfully` 
      });
      queryClient.invalidateQueries({ queryKey: ['admin-exams'] });
    } catch (error: any) {
      console.error('Error toggling exam:', error);
      toast({ 
        title: 'Error', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  };

  const handleToggleFeatured = async (exam: Exam) => {
    try {
      const { error } = await supabase
        .from('exams')
        .update({ is_featured: !exam.is_featured })
        .eq('id', exam.id);
      
      if (error) throw error;
      
      toast({ 
        title: 'Success', 
        description: `Exam ${!exam.is_featured ? 'featured' : 'unfeatured'} successfully` 
      });
      queryClient.invalidateQueries({ queryKey: ['admin-exams'] });
    } catch (error: any) {
      console.error('Error toggling featured:', error);
      toast({ 
        title: 'Error', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  };

  const renderForm = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{editingExam ? 'Edit Exam' : 'Create New Exam'}</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Basic Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Slug (URL identifier) *</Label>
                  <Input 
                    value={formData.slug || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      slug: e.target.value.toLowerCase().replace(/\s+/g, '_') 
                    }))}
                    placeholder="up_police"
                    disabled={!!editingExam}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Short Name *</Label>
                  <Input 
                    value={formData.short_name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, short_name: e.target.value }))}
                    placeholder="UP Police"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Display Name *</Label>
                <Input 
                  value={formData.display_name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                  placeholder="UP Police SI/ASI Typing Test"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Official UP Police Computer Operator typing test format"
                  rows={3}
                />
              </div>
              
              {/* Thumbnail */}
              <div className="space-y-2">
                <Label>Thumbnail</Label>
                <div className="flex items-center gap-4">
                  {formData.thumbnail_url ? (
                    <img 
                      src={formData.thumbnail_url} 
                      alt="Thumbnail preview" 
                      className="w-32 h-24 object-cover rounded-lg border"
                    />
                  ) : (
                    <div className="w-32 h-24 bg-muted rounded-lg border flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleThumbnailUpload}
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingThumbnail}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploadingThumbnail ? 'Uploading...' : 'Upload Image'}
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Interface Theme</Label>
                  <Select 
                    value={formData.interface_theme || 'default'}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, interface_theme: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="nta_style">NTA Style</SelectItem>
                      <SelectItem value="ssc_style">SSC Style</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Default Time (minutes)</Label>
                  <Input 
                    type="number"
                    value={Math.floor((formData.default_time_limit || 900) / 60)}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      default_time_limit: parseInt(e.target.value) * 60 
                    }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Sort Order</Label>
                  <Input 
                    type="number"
                    value={formData.sort_order || 0}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      sort_order: parseInt(e.target.value) 
                    }))}
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={formData.is_active ?? true}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label>Active</Label>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={formData.is_featured ?? false}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
                  />
                  <Label>Featured on Homepage</Label>
                </div>
              </div>
            </div>
            
            {/* Qualification Criteria */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Qualification Criteria</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Min Accuracy (%)</Label>
                  <Input 
                    type="number"
                    value={formData.min_accuracy || 85}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      min_accuracy: parseFloat(e.target.value) 
                    }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Min Speed English (WPM)</Label>
                  <Input 
                    type="number"
                    value={formData.min_speed_english || 30}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      min_speed_english: parseInt(e.target.value) 
                    }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Min Speed Hindi (WPM)</Label>
                  <Input 
                    type="number"
                    value={formData.min_speed_hindi || 25}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      min_speed_hindi: parseInt(e.target.value) 
                    }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Min Time Required (sec)</Label>
                  <Input 
                    type="number"
                    value={formData.min_time_required || 600}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      min_time_required: parseInt(e.target.value) 
                    }))}
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch 
                  checked={formData.use_keystroke_speed ?? false}
                  onCheckedChange={(checked) => setFormData(prev => ({ 
                    ...prev, 
                    use_keystroke_speed: checked 
                  }))}
                />
                <Label>Use Keystroke-based Speed (5 keys = 1 word)</Label>
              </div>
            </div>
            
            {/* Feature Flags */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Interface Features</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={formData.show_backspace_count ?? false}
                    onCheckedChange={(checked) => setFormData(prev => ({ 
                      ...prev, 
                      show_backspace_count: checked 
                    }))}
                  />
                  <Label>Show Backspace Count</Label>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={formData.show_gross_net_speed ?? true}
                    onCheckedChange={(checked) => setFormData(prev => ({ 
                      ...prev, 
                      show_gross_net_speed: checked 
                    }))}
                  />
                  <Label>Show Gross/Net Speed</Label>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={formData.show_keystroke_speed ?? true}
                    onCheckedChange={(checked) => setFormData(prev => ({ 
                      ...prev, 
                      show_keystroke_speed: checked 
                    }))}
                  />
                  <Label>Show Keystroke Speed</Label>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={formData.enable_sound ?? false}
                    onCheckedChange={(checked) => setFormData(prev => ({ 
                      ...prev, 
                      enable_sound: checked 
                    }))}
                  />
                  <Label>Enable Sound</Label>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={formData.enable_font_size_control ?? false}
                    onCheckedChange={(checked) => setFormData(prev => ({ 
                      ...prev, 
                      enable_font_size_control: checked 
                    }))}
                  />
                  <Label>Enable Font Size Control</Label>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={formData.enable_word_limit ?? true}
                    onCheckedChange={(checked) => setFormData(prev => ({ 
                      ...prev, 
                      enable_word_limit: checked 
                    }))}
                  />
                  <Label>Enable Word Limit</Label>
                </div>
              </div>
            </div>
            
            {/* Results Display */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Results Display</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={formData.show_skipped_words ?? false}
                    onCheckedChange={(checked) => setFormData(prev => ({ 
                      ...prev, 
                      show_skipped_words: checked 
                    }))}
                  />
                  <Label>Show Skipped Words</Label>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={formData.show_extra_words ?? false}
                    onCheckedChange={(checked) => setFormData(prev => ({ 
                      ...prev, 
                      show_extra_words: checked 
                    }))}
                  />
                  <Label>Show Extra Words</Label>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={formData.show_qualification_status ?? true}
                    onCheckedChange={(checked) => setFormData(prev => ({ 
                      ...prev, 
                      show_qualification_status: checked 
                    }))}
                  />
                  <Label>Show Qualification Status (Qualified/Not Qualified)</Label>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={formData.show_comparison_paragraph ?? true}
                    onCheckedChange={(checked) => setFormData(prev => ({ 
                      ...prev, 
                      show_comparison_paragraph: checked 
                    }))}
                  />
                  <Label>Show Comparison Paragraph</Label>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={formData.show_error_rules ?? false}
                    onCheckedChange={(checked) => setFormData(prev => ({ 
                      ...prev, 
                      show_error_rules: checked 
                    }))}
                  />
                  <Label>Show Error Rules</Label>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={formData.show_accuracy_formula ?? false}
                    onCheckedChange={(checked) => setFormData(prev => ({ 
                      ...prev, 
                      show_accuracy_formula: checked 
                    }))}
                  />
                  <Label>Show Accuracy Formula</Label>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Saving...' : editingExam ? 'Update Exam' : 'Create Exam'}
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Exam Management</h2>
          <p className="text-muted-foreground">Create and manage typing exam types</p>
        </div>
        {!isCreating && !editingExam && (
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Exam
          </Button>
        )}
      </div>
      
      {(isCreating || editingExam) && renderForm()}
      
      {/* Exams List */}
      <Card>
        <CardHeader>
          <CardTitle>All Exams ({exams.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading exams...</div>
          ) : exams.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No exams found. Create your first exam to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Order</TableHead>
                  <TableHead>Exam</TableHead>
                  <TableHead>Theme</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Min Speed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exams.map((exam) => (
                  <TableRow key={exam.id}>
                    <TableCell>
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      {exam.sort_order}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {exam.thumbnail_url ? (
                          <img 
                            src={exam.thumbnail_url} 
                            alt={exam.short_name}
                            className="w-12 h-9 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-9 bg-muted rounded flex items-center justify-center">
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{exam.display_name}</div>
                          <div className="text-xs text-muted-foreground">{exam.slug}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{exam.interface_theme}</Badge>
                    </TableCell>
                    <TableCell>{Math.floor(exam.default_time_limit / 60)}min</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>EN: {exam.min_speed_english} WPM</div>
                        <div>HI: {exam.min_speed_hindi} WPM</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {exam.is_active ? (
                          <Badge className="bg-green-100 text-green-700">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                        {exam.is_featured && (
                          <Badge className="bg-yellow-100 text-yellow-700">Featured</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleToggleActive(exam)}
                          title={exam.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {exam.is_active ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEdit(exam)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Exam</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{exam.display_name}"? 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(exam.id)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExamManager;
