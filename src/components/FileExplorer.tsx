
import { useState } from 'react';
import { File, Folder, Plus, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCodeFiles } from '@/hooks/useCodeFiles';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type CodeFile = Database['public']['Tables']['code_files']['Row'];

interface FileExplorerProps {
  projectId: string;
  selectedFile?: CodeFile;
  onFileSelect: (file: CodeFile) => void;
}

const FileExplorer = ({ projectId, selectedFile, onFileSelect }: FileExplorerProps) => {
  const [newFileName, setNewFileName] = useState('');
  const [showNewFileInput, setShowNewFileInput] = useState(false);
  const { codeFiles, isLoading, createCodeFile } = useCodeFiles(projectId);

  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    await createCodeFile.mutateAsync({
      project_id: projectId,
      file_path: newFileName,
      content: '',
    });

    setNewFileName('');
    setShowNewFileInput(false);
  };

  const getFileIcon = (filePath: string) => {
    if (filePath.includes('/')) {
      return <Folder className="h-4 w-4 text-blue-500" />;
    }
    return <File className="h-4 w-4 text-gray-500" />;
  };

  const organizeFiles = (files: CodeFile[]) => {
    const folders: { [key: string]: CodeFile[] } = {};
    const rootFiles: CodeFile[] = [];

    files.forEach(file => {
      const pathParts = file.file_path.split('/');
      if (pathParts.length > 1) {
        const folderName = pathParts[0];
        if (!folders[folderName]) {
          folders[folderName] = [];
        }
        folders[folderName].push(file);
      } else {
        rootFiles.push(file);
      }
    });

    return { folders, rootFiles };
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <p className="text-sm text-gray-500">Loading files...</p>
      </div>
    );
  }

  const { folders, rootFiles } = organizeFiles(codeFiles || []);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-gray-900">Files</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowNewFileInput(true)}
          >
            <Plus className="h-3 w-3 mr-1" />
            New
          </Button>
        </div>
        
        {showNewFileInput && (
          <form onSubmit={handleCreateFile} className="mt-2">
            <Input
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="filename.js"
              className="text-sm"
              autoFocus
              onBlur={() => {
                if (!newFileName.trim()) {
                  setShowNewFileInput(false);
                }
              }}
            />
          </form>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* Root files */}
          {rootFiles.map((file) => (
            <button
              key={file.id}
              onClick={() => onFileSelect(file)}
              className={cn(
                "w-full flex items-center gap-2 p-2 text-left text-sm rounded hover:bg-gray-100 transition-colors",
                selectedFile?.id === file.id && "bg-gray-100"
              )}
            >
              {getFileIcon(file.file_path)}
              <span className="truncate">{file.file_path}</span>
            </button>
          ))}

          {/* Folders */}
          {Object.entries(folders).map(([folderName, files]) => (
            <div key={folderName} className="mt-2">
              <div className="flex items-center gap-2 p-2 text-sm font-medium text-gray-700">
                <FolderOpen className="h-4 w-4 text-blue-500" />
                <span>{folderName}</span>
              </div>
              <div className="ml-4">
                {files.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => onFileSelect(file)}
                    className={cn(
                      "w-full flex items-center gap-2 p-2 text-left text-sm rounded hover:bg-gray-100 transition-colors",
                      selectedFile?.id === file.id && "bg-gray-100"
                    )}
                  >
                    <File className="h-4 w-4 text-gray-500" />
                    <span className="truncate">{file.file_path.split('/').pop()}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {(!codeFiles || codeFiles.length === 0) && (
            <div className="text-center py-8">
              <File className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No files yet</p>
              <p className="text-xs text-gray-400 mt-1">Click "New" to create your first file</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default FileExplorer;
