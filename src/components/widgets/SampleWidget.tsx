'use client';

import React from 'react';
import { WidgetProps } from '@/types';
import { WidgetWrapper } from './WidgetWrapper';
import { Calendar, CheckSquare, TrendingUp, Cloud, Sun, Droplets, Wind } from 'lucide-react';

const SampleWidget: React.FC<WidgetProps> = (props) => {
  const { widget } = props;

  const renderContent = () => {
    switch (widget.type) {
      case 'task-manager':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <CheckSquare className="w-5 h-5" />
              <span className="text-sm font-medium">Today's Tasks</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm">Complete project proposal</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-sm">Review team feedback</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm">Update documentation</span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              3 of 5 tasks completed today
            </div>
          </div>
        );

      case 'mood-tracker':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl mb-2">😊</div>
              <p className="text-sm font-medium">Feeling Good</p>
              <p className="text-xs text-muted-foreground">Today</p>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {['😊', '😐', '😊', '😴', '😊', '😄', '😊'].map((emoji, index) => (
                <div
                  key={`mood-${index}-${emoji}`}
                  className="aspect-square bg-muted rounded text-center text-xs flex items-center justify-center"
                >
                  {emoji}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              7-day mood trend
            </p>
          </div>
        );

      case 'finance-tracker':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-medium">Monthly Budget</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Income</span>
                <span className="text-sm font-medium text-green-600">+$4,200</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Expenses</span>
                <span className="text-sm font-medium text-red-600">-$2,800</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Remaining</span>
                  <span className="text-sm font-bold text-primary">$1,400</span>
                </div>
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full" 
                style={{ width: '67%' }}
              ></div>
            </div>
          </div>
        );

      case 'weather':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Cloud className="w-5 h-5" />
              <span className="text-sm font-medium">Weather</span>
            </div>
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center space-x-3">
                <Sun className="w-8 h-8 text-yellow-500" />
                <div>
                  <div className="text-2xl font-bold">22°C</div>
                  <div className="text-xs text-muted-foreground">Feels like 24°C</div>
                </div>
              </div>
              <div className="text-sm font-medium">Partly cloudy</div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center space-x-1">
                <Droplets className="w-3 h-3 text-blue-500" />
                <span>Humidity: 65%</span>
              </div>
              <div className="flex items-center space-x-1">
                <Wind className="w-3 h-3 text-gray-500" />
                <span>Wind: 15 km/h</span>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <Calendar className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Widget content will appear here
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Type: {widget.type}
            </p>
          </div>
        );
    }
  };

  return (
    <WidgetWrapper widget={widget}>
      {renderContent()}
    </WidgetWrapper>
  );
};

export default SampleWidget; 