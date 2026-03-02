import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSynced, setIsSynced] = useState(false);

  useEffect(() => {
    const setupSync = async () => {
      // 1. Pull all data from server
      const keys = [
        'alakara_staff', 'alakara_students', 'alakara_schools', 'alakara_classes',
        'alakara_exams', 'alakara_assignments', 'alakara_submissions',
        'alakara_exam_materials', 'alakara_success_stories', 'alakara_notifications',
        'alakara_audit_trail', 'alakara_learning_areas', 'alakara_assessment_categories',
        'alakara_grading', 'alakara_ranking_logic'
      ];
      
      for (const key of keys) {
        try {
          const data = await api.getStore(key);
          if (data) {
            localStorage.setItem(key, JSON.stringify(data));
          }
        } catch (e) {
          console.error(`Failed to sync ${key}`, e);
        }
      }
      
      try {
        const marks = await api.getMarks();
        if (marks && marks.length > 0) {
          localStorage.setItem('alakara_marks', JSON.stringify(marks));
        }
      } catch (e) {
        console.error('Failed to sync marks', e);
      }

      // 2. Intercept localStorage.setItem to push changes to server
      if (!(window as any).__localStorageIntercepted) {
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = function(key, value) {
          originalSetItem.apply(this, [key, value] as any);
          
          if (key.startsWith('alakara_') && !key.includes('current_')) {
            try {
              const parsedValue = JSON.parse(value);
              if (key === 'alakara_marks') {
                api.upsertMarks(parsedValue);
              } else {
                api.setStore(key, parsedValue);
              }
            } catch (e) {
              console.error('Failed to push to server', e);
            }
          }
        };
        (window as any).__localStorageIntercepted = true;
      }

      setIsSynced(true);
    };

    setupSync();
  }, []);

  if (!isSynced) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-16 h-16 border-4 border-kenya-green border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-bold text-gray-800">Connecting to Live Server...</h2>
        <p className="text-gray-500 mt-2">Syncing data, please wait.</p>
      </div>
    );
  }

  return <>{children}</>;
};
