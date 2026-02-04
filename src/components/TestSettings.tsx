
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Settings, Type, Timer, Keyboard } from 'lucide-react';

interface TestSettingsProps {
  settings: {
    highlightText: boolean;
    showErrors: boolean;
    backspaceMode: 'full' | 'word' | 'disabled';
    timeLimit: number;
    language: 'english' | 'hindi';
  };
  onSettingsChange: (settings: any) => void;
}

const TestSettings = ({ settings, onSettingsChange }: TestSettingsProps) => {
  const updateSetting = (key: string, value: any) => {
    onSettingsChange({
      ...settings,
      [key]: value
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Test Settings</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Customize your typing test experience
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Display Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5" />
              Display Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="highlight-text" className="text-sm font-medium">
                Highlight current text
              </Label>
              <Switch
                id="highlight-text"
                checked={settings.highlightText}
                onCheckedChange={(checked) => updateSetting('highlightText', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show-errors" className="text-sm font-medium">
                Show typing errors
              </Label>
              <Switch
                id="show-errors"
                checked={settings.showErrors}
                onCheckedChange={(checked) => updateSetting('showErrors', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Input Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Input Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="backspace-mode" className="text-sm font-medium">
                Backspace behavior
              </Label>
              <Select
                value={settings.backspaceMode}
                onValueChange={(value) => updateSetting('backspaceMode', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select backspace mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full correction allowed</SelectItem>
                  <SelectItem value="word">Word-level correction</SelectItem>
                  <SelectItem value="disabled">Backspace disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language" className="text-sm font-medium">
                Test language
              </Label>
              <Select
                value={settings.language}
                onValueChange={(value) => updateSetting('language', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="hindi">हिंदी (Hindi)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Time Settings */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              Time Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="time-limit" className="text-sm font-medium">
                  Time limit: {settings.timeLimit} seconds
                </Label>
              </div>
              <Slider
                id="time-limit"
                min={30}
                max={300}
                step={15}
                value={[settings.timeLimit]}
                onValueChange={(value) => updateSetting('timeLimit', value[0])}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>30s</span>
                <span>60s</span>
                <span>120s</span>
                <span>300s</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Current Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium text-gray-500 dark:text-gray-400">Language</div>
              <div className="capitalize">{settings.language === 'hindi' ? 'हिंदी' : 'English'}</div>
            </div>
            <div>
              <div className="font-medium text-gray-500 dark:text-gray-400">Time Limit</div>
              <div>{settings.timeLimit}s</div>
            </div>
            <div>
              <div className="font-medium text-gray-500 dark:text-gray-400">Backspace</div>
              <div className="capitalize">{settings.backspaceMode.replace('_', ' ')}</div>
            </div>
            <div>
              <div className="font-medium text-gray-500 dark:text-gray-400">Features</div>
              <div className="text-xs">
                {settings.highlightText ? '✓' : '✗'} Highlight
                {' • '}
                {settings.showErrors ? '✓' : '✗'} Errors
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestSettings;
