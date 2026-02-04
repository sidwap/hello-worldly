
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { User, LogOut, Trophy, TrendingUp, Clock, Target, Edit, Upload } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface UserProfileProps {
  user: any;
  onSignOut: () => void;
}

const UserProfile = ({ user, onSignOut }: UserProfileProps) => {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  // Fetch user profile
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      setFullName(data?.full_name || "");
      return data;
    },
    enabled: !!user
  });

  // Fetch user's test results
  const { data: results = [] } = useQuery({
    queryKey: ['user-results', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('test_results')
        .select(`
          *,
          typing_tests (title, language, difficulty)
        `)
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account."
      });
      onSignOut();
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  // Calculate statistics
  const totalTests = results.length;
  const averageWPM = totalTests > 0 ? Math.round(results.reduce((sum, r) => sum + r.wpm, 0) / totalTests) : 0;
  const averageAccuracy = totalTests > 0 ? Math.round(results.reduce((sum, r) => sum + r.accuracy, 0) / totalTests) : 0;
  const bestWPM = totalTests > 0 ? Math.max(...results.map(r => r.wpm)) : 0;
  const totalTimeSpent = results.reduce((sum, r) => sum + r.time_taken, 0);

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      let avatarUrl = profile?.avatar_url;

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
        
        avatarUrl = publicUrl;
      }

      // Upsert to handle both existing and new profiles
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: fullName,
          email: user.email,
          ...(avatarUrl && { avatar_url: avatarUrl })
        }, {
          onConflict: 'id'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      setIsEditDialogOpen(false);
      setAvatarFile(null);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                  {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">{profile?.full_name || 'User'}</h2>
                <p className="text-gray-600 dark:text-gray-400">{profile?.email}</p>
                <div className="flex gap-2 mt-2">
                  {totalTests > 0 && (
                    <Badge variant="outline">
                      {totalTests} test{totalTests !== 1 ? 's' : ''} completed
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="avatar">Profile Picture</Label>
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={avatarFile ? URL.createObjectURL(avatarFile) : profile?.avatar_url} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {fullName ? getInitials(fullName) : "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <Input
                            id="avatar"
                            type="file"
                            accept="image/*"
                            onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                          />
                        </div>
                      </div>
                    </div>
                    <Button 
                      onClick={() => updateProfileMutation.mutate()} 
                      disabled={updateProfileMutation.isPending}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {updateProfileMutation.isPending ? "Updating..." : "Update Profile"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                {isSigningOut ? 'Signing out...' : 'Sign Out'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics */}
      {totalTests > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6 text-center">
              <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
              <div className="text-2xl font-bold">{bestWPM}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Best WPM</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{averageWPM}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Average WPM</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Target className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">{averageAccuracy}%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Average Accuracy</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <div className="text-2xl font-bold">{Math.round(totalTimeSpent / 60)}m</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Practice Time</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Results */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">No Tests Completed Yet</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Take your first typing test to see your results here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.slice(0, 5).map((result) => (
                <div key={result.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold">{result.typing_tests?.title || 'Unknown Test'}</h4>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline">
                        {result.typing_tests?.language === 'hindi' ? 'हिंदी' : 'English'}
                      </Badge>
                      <Badge variant="outline">{result.typing_tests?.difficulty}</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{result.wpm} WPM</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {result.accuracy}% accuracy
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(result.completed_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
              
              {results.length > 5 && (
                <div className="text-center pt-4">
                  <Button variant="outline" size="sm">
                    View All Results ({results.length})
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfile;
