"use client";

import { useState } from "react";
import { 
  ProfilePhotoReminder, 
  CompactPhotoReminder, 
  PhotoUploadSuccess 
} from "@/features/experts/components/ProfilePhotoReminder";
import { ProfilePhotoUpload } from "@/features/experts/components/ProfilePhotoUpload";

const demoPhotoStatuses = {
  low: {
    hasPhoto: false,
    needsPhoto: true,
    urgency: 'low' as const,
    message: '💡 Consider adding a professional photo to make your profile more trustworthy.'
  },
  medium: {
    hasPhoto: false,
    needsPhoto: true,
    urgency: 'medium' as const,
    message: '📸 Upload your professional headshot to complete your profile and attract more clients.'
  },
  high: {
    hasPhoto: false,
    needsPhoto: true,
    urgency: 'high' as const,
    message: '⚠️ Add your profile photo to build trust with clients. Profiles with photos get 3x more bookings.'
  },
  success: {
    hasPhoto: true,
    needsPhoto: false,
    urgency: 'low' as const,
    message: 'Profile photo uploaded ✓'
  }
};

export default function PhotoReminderDemo() {
  const [isUploading, setIsUploading] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(null);

  const handlePhotoUpload = async (file: File) => {
    setIsUploading(true);
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create preview URL
    const photoUrl = URL.createObjectURL(file);
    setCurrentPhoto(photoUrl);
    setIsUploading(false);
    
    console.log('Photo uploaded:', file.name);
  };

  const handlePhotoRemove = async () => {
    setCurrentPhoto(null);
    console.log('Photo removed');
  };

  const handleUploadClick = () => {
    console.log('Upload button clicked');
    // In real app: navigate to upload page or open modal
    alert('Would navigate to photo upload page');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Profile Photo Reminder System
        </h1>
        <p className="text-gray-600">
          Interactive components to encourage experts to upload professional profile photos
        </p>
      </div>

      {/* Full Profile Photo Reminders */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-800">Full Profile Photo Reminders</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Low Urgency (Recent registration)</h3>
            <ProfilePhotoReminder
              photoStatus={demoPhotoStatuses.low}
              onUploadClick={handleUploadClick}
              onDismiss={() => console.log('Dismissed low urgency reminder')}
            />
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Medium Urgency (3+ days without photo)</h3>
            <ProfilePhotoReminder
              photoStatus={demoPhotoStatuses.medium}
              onUploadClick={handleUploadClick}
              onDismiss={() => console.log('Dismissed medium urgency reminder')}
            />
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">High Urgency (1+ weeks without photo)</h3>
            <ProfilePhotoReminder
              photoStatus={demoPhotoStatuses.high}
              onUploadClick={handleUploadClick}
              onDismiss={() => console.log('Dismissed high urgency reminder')}
            />
          </div>
        </div>
      </section>

      {/* Compact Dashboard Widgets */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-800">Compact Dashboard Widgets</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Medium Urgency Compact</h3>
            <CompactPhotoReminder
              photoStatus={demoPhotoStatuses.medium}
              onUploadClick={handleUploadClick}
            />
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">High Urgency Compact</h3>
            <CompactPhotoReminder
              photoStatus={demoPhotoStatuses.high}
              onUploadClick={handleUploadClick}
            />
          </div>
        </div>
      </section>

      {/* Success State */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-800">Success State</h2>
        
        <PhotoUploadSuccess
          photoUrl="/myjudicial-logo.svg"
          onChangePhoto={() => console.log('Change photo clicked')}
        />
      </section>

      {/* Photo Upload Component */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-800">Photo Upload Component</h2>
        
        <ProfilePhotoUpload
          currentPhotoUrl={currentPhoto}
          onPhotoUpload={handlePhotoUpload}
          onPhotoRemove={currentPhoto ? handlePhotoRemove : undefined}
          isUploading={isUploading}
        />
      </section>

      {/* Usage Stats */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">System Benefits</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">300%</div>
            <div className="text-sm text-green-800">More bookings with photos</div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">85%</div>
            <div className="text-sm text-blue-800">Higher trust ratings</div>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">92%</div>
            <div className="text-sm text-purple-800">Profile completion rate</div>
          </div>
        </div>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-2">Reminder Strategy:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li><strong>Low Urgency:</strong> Gentle suggestions for new users (0-2 days)</li>
            <li><strong>Medium Urgency:</strong> Clear benefits highlight (3-7 days)</li>
            <li><strong>High Urgency:</strong> Urgent calls-to-action with statistics (7+ days)</li>
            <li><strong>Success State:</strong> Positive reinforcement when completed</li>
          </ul>
        </div>
      </section>
    </div>
  );
}