import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Moon, Sun, Keyboard, Target, Trophy, User as UserIcon, Maximize, Minimize, Home, Settings } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import Auth from '@/components/Auth';
import AdminPanel from '@/components/AdminPanel';
import TypingTest from '@/components/TypingTest';
import { NoticeModal } from '@/components/NoticeModal';
import Results from '@/components/Results';
import UserProfile from '@/components/UserProfile';
import HomePage from '@/components/home/HomePage';
import ExamListPage from '@/components/home/ExamListPage';

const queryClient = new QueryClient();

type AppView = 'home' | 'exam-list' | 'typing-test' | 'results' | 'profile' | 'admin';

const Index = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [selectedExamSlug, setSelectedExamSlug] = useState<string | null>(null);
  const [testSettings, setTestSettings] = useState({
    highlightText: true,
    showErrors: true,
    backspaceMode: 'full' as 'full' | 'word' | 'disabled',
    timeLimit: 60,
    language: 'english' as 'english' | 'hindi'
  });
  const [currentTest, setCurrentTest] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [showNotice, setShowNotice] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAuthForAction, setShowAuthForAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        console.log('Checking initial auth state...');
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          console.log('Auth state changed:', event, session?.user?.id);
          
          if (!mounted) return;

          setSession(session);
          setUser(session?.user ?? null);
          setAuthError(null);

          if (session?.user) {
            setTimeout(() => {
              if (mounted) {
                checkUserRole(session.user.id);
              }
            }, 0);
          } else {
            setIsAdmin(false);
          }
        });

        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setAuthError(error.message);
        } else if (initialSession) {
          console.log('Found existing session for user:', initialSession.user.id);
          setSession(initialSession);
          setUser(initialSession.user);
          
          setTimeout(() => {
            if (mounted) {
              checkUserRole(initialSession.user.id);
            }
          }, 0);
        }

        setIsLoading(false);

        return () => {
          mounted = false;
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthError('Failed to initialize authentication');
        setIsLoading(false);
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const checkUserRole = async (userId: string) => {
    try {
      console.log('Checking user role for:', userId);
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();
      
      if (!error && data) {
        console.log('User role:', data.role);
        setIsAdmin(true);
      } else if (error) {
        console.error('Error checking user role:', error);
        setIsAdmin(false);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Error in checkUserRole:', error);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleExamSelect = (examSlug: string) => {
    if (!session) {
      // Show login page, then redirect to exam
      setShowAuthForAction(() => () => {
        setSelectedExamSlug(examSlug);
        setCurrentView('typing-test');
      });
      return;
    }
    setSelectedExamSlug(examSlug);
    setCurrentView('typing-test');
  };

  const handleExploreAll = () => {
    if (!session) {
      setShowAuthForAction(() => () => {
        setCurrentView('exam-list');
      });
      return;
    }
    setCurrentView('exam-list');
  };

  const handleTestComplete = (results: any) => {
    setTestResults(results);
    setCurrentView('results');
  };

  const handleAuthSuccess = () => {
    console.log('Auth success callback triggered');
    setShowAuthForAction(null);
    // Execute the pending action if any
    if (showAuthForAction) {
      showAuthForAction();
    }
  };

  const handleSignOut = async () => {
    try {
      console.log('Signing out...');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      setCurrentView('home');
      console.log('Sign out successful');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Keyboard className="h-16 w-16 mx-auto mb-4 text-blue-500 animate-pulse" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">Authentication Error</div>
          <p className="text-gray-600">{authError}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
          >
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  // Show auth page if there's a pending action requiring login
  if (showAuthForAction && !session) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className={darkMode ? 'dark' : ''}>
          <Auth onAuthSuccess={handleAuthSuccess} />
          <Toaster />
        </div>
      </QueryClientProvider>
    );
  }

  // Render based on current view
  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return (
          <HomePage 
            onExamSelect={handleExamSelect}
            onExploreAll={handleExploreAll}
            isLoggedIn={!!session}
          />
        );
      
      case 'exam-list':
        return (
          <ExamListPage 
            onExamSelect={handleExamSelect}
            onBack={() => setCurrentView('home')}
          />
        );
      
      case 'typing-test':
        return (
          <div className="container mx-auto px-4 py-8">
            <TypingTest 
              settings={testSettings}
              onComplete={handleTestComplete}
              currentTest={currentTest}
              selectedExamSlug={selectedExamSlug}
            />
          </div>
        );
      
      case 'results':
        return (
          <div className="container mx-auto px-4 py-8">
            <Results results={testResults} />
          </div>
        );
      
      case 'profile':
        return (
          <div className="container mx-auto px-4 py-8">
            <UserProfile user={user!} onSignOut={handleSignOut} />
          </div>
        );
      
      case 'admin':
        return (
          <div className="container mx-auto px-4 py-8">
            <AdminPanel onTestCreated={setCurrentTest} />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      {showNotice && session && <NoticeModal onClose={() => setShowNotice(false)} />}
      <div className={`min-h-screen transition-all duration-300 ${
        darkMode 
          ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900' 
          : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
      }`}>
        {/* Header */}
        <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-700">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div 
                className="flex items-center space-x-3 cursor-pointer"
                onClick={() => setCurrentView('home')}
              >
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                  <Keyboard className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    TypeScribe Zen
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Master your typing skills
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Navigation */}
                {session && (
                  <nav className="hidden md:flex items-center space-x-2">
                    <Button 
                      variant={currentView === 'home' ? 'default' : 'ghost'} 
                      size="sm"
                      onClick={() => setCurrentView('home')}
                    >
                      <Home className="h-4 w-4 mr-2" />
                      Home
                    </Button>
                    <Button 
                      variant={currentView === 'typing-test' ? 'default' : 'ghost'} 
                      size="sm"
                      onClick={() => setCurrentView('exam-list')}
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Exams
                    </Button>
                    <Button 
                      variant={currentView === 'results' ? 'default' : 'ghost'} 
                      size="sm"
                      onClick={() => setCurrentView('results')}
                    >
                      <Trophy className="h-4 w-4 mr-2" />
                      Results
                    </Button>
                    <Button 
                      variant={currentView === 'profile' ? 'default' : 'ghost'} 
                      size="sm"
                      onClick={() => setCurrentView('profile')}
                    >
                      <UserIcon className="h-4 w-4 mr-2" />
                      Profile
                    </Button>
                    {isAdmin && (
                      <Button 
                        variant={currentView === 'admin' ? 'default' : 'ghost'} 
                        size="sm"
                        onClick={() => setCurrentView('admin')}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Admin
                      </Button>
                    )}
                  </nav>
                )}
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFullscreen}
                  title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                  {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                </Button>
                <div className="flex items-center space-x-2">
                  <Sun className="h-4 w-4" />
                  <Switch
                    checked={darkMode}
                    onCheckedChange={setDarkMode}
                  />
                  <Moon className="h-4 w-4" />
                </div>
                
                {!session && (
                  <Button onClick={() => setShowAuthForAction(() => () => {})}>
                    Login
                  </Button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main>
          {renderContent()}
        </main>

        {/* Footer */}
        <footer className="py-8 text-center text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 mt-12">
          <p>&copy; 2024 TypeScribe Zen. Built with ❤️ using React & Supabase</p>
        </footer>

        <Toaster />
      </div>
    </QueryClientProvider>
  );
};

export default Index;
