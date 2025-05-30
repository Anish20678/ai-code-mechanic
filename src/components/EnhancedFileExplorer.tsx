
import { useState } from 'react';
import { File, Folder, Plus, FolderOpen, Trash2, Edit2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { useCodeFiles } from '@/hooks/useCodeFiles';
import { cn } from '@/lib/utils';
import CodeGeneratorDialog from './CodeGeneratorDialog';
import type { Database } from '@/integrations/supabase/types';

type CodeFile = Database['public']['Tables']['code_files']['Row'];

interface EnhancedFileExplorerProps {
  projectId: string;
  selectedFile?: CodeFile;
  onFileSelect: (file: CodeFile) => void;
}

const EnhancedFileExplorer = ({ projectId, selectedFile, onFileSelect }: EnhancedFileExplorerProps) => {
  const [newFileName, setNewFileName] = useState('');
  const [showNewFileInput, setShowNewFileInput] = useState(false);
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [editFileName, setEditFileName] = useState('');
  
  const { 
    codeFiles, 
    isLoading, 
    createCodeFile, 
    updateCodeFile, 
    deleteCodeFile, 
    duplicateCodeFile, 
    renameCodeFile 
  } = useCodeFiles(projectId);

  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    try {
      await createCodeFile.mutateAsync({
        project_id: projectId,
        file_path: newFileName,
        content: '',
      });

      setNewFileName('');
      setShowNewFileInput(false);
    } catch (error) {
      console.error('Failed to create file:', error);
    }
  };

  const handleRenameFile = async (fileId: string) => {
    if (!editFileName.trim()) return;

    try {
      await renameCodeFile.mutateAsync({
        id: fileId,
        newPath: editFileName,
      });

      setEditingFile(null);
      setEditFileName('');
    } catch (error) {
      console.error('Failed to rename file:', error);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      await deleteCodeFile.mutateAsync(fileId);
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };

  const handleDuplicateFile = async (file: CodeFile) => {
    try {
      await duplicateCodeFile.mutateAsync(file);
    } catch (error) {
      console.error('Failed to duplicate file:', error);
    }
  };

  const getFileIcon = (filePath: string) => {
    const extension = filePath.split('.').pop()?.toLowerCase();
    const iconClass = "h-4 w-4";
    
    switch (extension) {
      case 'tsx':
      case 'jsx':
        return <File className={`${iconClass} text-blue-500`} />;
      case 'ts':
      case 'js':
        return <File className={`${iconClass} text-yellow-500`} />;
      case 'css':
        return <File className={`${iconClass} text-purple-500`} />;
      case 'json':
        return <File className={`${iconClass} text-green-500`} />;
      default:
        return <File className={`${iconClass} text-gray-500`} />;
    }
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
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-8 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    );
  }

  const { folders, rootFiles } = organizeFiles(codeFiles || []);

  const FileActions = ({ file }: { file: CodeFile }) => (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <Button
        size="sm"
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation();
          handleDuplicateFile(file);
        }}
        className="h-6 w-6 p-0"
        title="Duplicate file"
      >
        <Copy className="h-3 w-3" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation();
          setEditingFile(file.id);
          setEditFileName(file.file_path);
        }}
        className="h-6 w-6 p-0"
        title="Rename file"
      >
        <Edit2 className="h-3 w-3" />
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => e.stopPropagation()}
            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
            title="Delete file"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{file.file_path}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteFile(file.id)}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900">Files ({codeFiles?.length || 0})</h3>
          <div className="flex gap-1">
            <CodeGeneratorDialog 
              projectId={projectId}
              existingFiles={codeFiles}
              onFileCreated={(file) => onFileSelect(file)}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowNewFileInput(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              New
            </Button>
          </div>
        </div>
        
        {showNewFileInput && (
          <form onSubmit={handleCreateFile} className="mt-2">
            <Input
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="filename.tsx"
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
            <div key={file.id} className="group">
              {editingFile === file.id ? (
                <div className="p-2">
                  <Input
                    value={editFileName}
                    onChange={(e) => setEditFileName(e.target.value)}
                    onBlur={() => handleRenameFile(file.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameFile(file.id);
                      if (e.key === 'Escape') {
                        setEditingFile(null);
                        setEditFileName('');
                      }
                    }}
                    className="text-sm"
                    autoFocus
                  />
                </div>
              ) : (
                <div
                  className={cn(
                    "flex items-center justify-between p-2 text-sm rounded hover:bg-gray-100 transition-colors cursor-pointer",
                    selectedFile?.id === file.id && "bg-gray-100"
                  )}
                  onClick={() => onFileSelect(file)}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getFileIcon(file.file_path)}
                    <span className="truncate">{file.file_path}</span>
                  </div>
                  <FileActions file={file} />
                </div>
              )}
            </div>
          ))}

          {/* Folders */}
          {Object.entries(folders).map(([folderName, files]) => (
            <div key={folderName} className="mt-2">
              <div className="flex items-center gap-2 p-2 text-sm font-medium text-gray-700">
                <FolderOpen className="h-4 w-4 text-blue-500" />
                <span>{folderName}</span>
                <span className="text-xs text-gray-500">({files.length})</span>
              </div>
              <div className="ml-4">
                {files.map((file) => (
                  <div key={file.id} className="group">
                    <div
                      className={cn(
                        "flex items-center justify-between p-2 text-sm rounded hover:bg-gray-100 transition-colors cursor-pointer",
                        selectedFile?.id === file.id && "bg-gray-100"
                      )}
                      onClick={() => onFileSelect(file)}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {getFileIcon(file.file_path)}
                        <span className="truncate">{file.file_path.split('/').pop()}</span>
                      </div>
                      <FileActions file={file} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {(!codeFiles || codeFiles.length === 0) && (
            <div className="text-center py-8">
              <File className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No files yet</p>
              <p className="text-xs text-gray-400 mt-1">Use "Generate Code" or "New" to create files</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default EnhancedFileExplorer;
