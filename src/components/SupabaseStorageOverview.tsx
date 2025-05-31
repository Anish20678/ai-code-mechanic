
import { useState, useEffect } from 'react';
import { HardDrive, Upload, Download, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface StorageStats {
  totalUsed: string;
  totalLimit: string;
  usagePercentage: number;
  buckets: Array<{
    name: string;
    size: string;
    files: number;
    isPublic: boolean;
  }>;
}

const SupabaseStorageOverview = () => {
  const [storageStats, setStorageStats] = useState<StorageStats>({
    totalUsed: '0 MB',
    totalLimit: '1 GB',
    usagePercentage: 0,
    buckets: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStorageStats = async () => {
      try {
        // Simulate storage data - in reality, this would come from Supabase Storage API
        setStorageStats({
          totalUsed: '0 MB',
          totalLimit: '1 GB',
          usagePercentage: 0,
          buckets: [
            {
              name: 'project-assets',
              size: '0 MB',
              files: 0,
              isPublic: true,
            },
            {
              name: 'user-uploads',
              size: '0 MB',
              files: 0,
              isPublic: false,
            },
          ],
        });
      } catch (error) {
        console.error('Error loading storage stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStorageStats();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="h-5 w-5" />
          Storage Overview
        </CardTitle>
        <CardDescription>
          File storage usage and bucket management
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Storage Usage */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Storage Usage</span>
              <span className="text-sm text-gray-600">
                {storageStats.totalUsed} / {storageStats.totalLimit}
              </span>
            </div>
            <Progress value={storageStats.usagePercentage} className="h-2" />
            <p className="text-xs text-gray-600 mt-1">
              {storageStats.usagePercentage}% used
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <HardDrive className="h-6 w-6 mx-auto text-blue-600 mb-1" />
              <div className="text-lg font-bold text-blue-900">{storageStats.buckets.length}</div>
              <div className="text-xs text-blue-700">Buckets</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <Upload className="h-6 w-6 mx-auto text-green-600 mb-1" />
              <div className="text-lg font-bold text-green-900">
                {storageStats.buckets.reduce((sum, bucket) => sum + bucket.files, 0)}
              </div>
              <div className="text-xs text-green-700">Files</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <Download className="h-6 w-6 mx-auto text-purple-600 mb-1" />
              <div className="text-lg font-bold text-purple-900">{storageStats.totalUsed}</div>
              <div className="text-xs text-purple-700">Used</div>
            </div>
          </div>

          {/* Buckets List */}
          <div>
            <h4 className="font-medium mb-3">Storage Buckets</h4>
            {storageStats.buckets.length > 0 ? (
              <div className="space-y-2">
                {storageStats.buckets.map((bucket) => (
                  <div key={bucket.name} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <HardDrive className="h-4 w-4 text-gray-600" />
                        <span className="font-medium">{bucket.name}</span>
                        <Badge variant={bucket.isPublic ? "default" : "secondary"}>
                          {bucket.isPublic ? "Public" : "Private"}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        {bucket.files} files • {bucket.size}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <HardDrive className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No storage buckets found</p>
                <p className="text-sm">Create buckets to store files and assets</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SupabaseStorageOverview;
