
import { useState } from 'react';
import { File, Folder, FolderOpen, Plus, Search, MoreVertical, FileText, Image, Code, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useCodeFiles } from '@/hooks/useCodeFiles';
import { useToast } from '@/hooks/use-toast';
import type { Database as DatabaseType } from '@/integrations/supabase/types';

type CodeFile = DatabaseType['public']['Tables']['code_files']['Row'];

interface EnhancedFileExplorerProps {
  projectId: string;
  selectedFile: CodeFile | null;
  onFileSelect: (file: CodeFile) => void;
}

const EnhancedFileExplorer = ({ projectId, selectedFile, onFileSelect }: EnhancedFileExplorerProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['src']));
  const [isCreateFileOpen, setIsCreateFileOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState('component');
  
  const { codeFiles, createCodeFile, deleteCodeFile } = useCodeFiles(projectId);
  const { toast } = useToast();

  const fileTree = buildFileTree(codeFiles || []);
  const filteredTree = filterTree(fileTree, searchTerm);

  const handleCreateFile = async () => {
    if (!newFileName.trim()) return;

    const extension = getFileExtension(newFileType);
    const fileName = newFileName.endsWith(extension) ? newFileName : `${newFileName}${extension}`;
    const filePath = `src/components/${fileName}`;

    const template = getFileTemplate(newFileType, fileName);

    try {
      await createCodeFile.mutateAsync({
        project_id: projectId,
        file_path: filePath,
        content: template,
      });

      toast({
        title: "File created",
        description: `${fileName} has been created successfully.`,
      });

      setNewFileName('');
      setIsCreateFileOpen(false);
    } catch (error) {
      toast({
        title: "Failed to create file",
        description: "Could not create the file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFile = async (file: CodeFile) => {
    if (confirm(`Are you sure you want to delete ${file.file_path}?`)) {
      try {
        await deleteCodeFile.mutateAsync(file.id);
        toast({
          title: "File deleted",
          description: `${file.file_path} has been deleted.`,
        });
      } catch (error) {
        toast({
          title: "Failed to delete file",
          description: "Could not delete the file. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const toggleFolder = (folderPath: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderPath)) {
      newExpanded.delete(folderPath);
    } else {
      newExpanded.add(folderPath);
    }
    setExpandedFolders(newExpanded);
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'tsx':
      case 'jsx':
        return <Code className="h-4 w-4 text-blue-500" />;
      case 'ts':
      case 'js':
        return <FileText className="h-4 w-4 text-yellow-500" />;
      case 'css':
        return <FileText className="h-4 w-4 text-purple-500" />;
      case 'json':
        return <Database className="h-4 w-4 text-orange-500" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
        return <Image className="h-4 w-4 text-green-500" />;
      default:
        return <File className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900">Files</h3>
          <Dialog open={isCreateFileOpen} onOpenChange={setIsCreateFileOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New File</DialogTitle>
                <DialogDescription>
                  Add a new file to your project
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fileName">File Name</Label>
                  <Input
                    id="fileName"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    placeholder="MyComponent"
                  />
                </div>
                <div>
                  <Label htmlFor="fileType">File Type</Label>
                  <select
                    id="fileType"
                    value={newFileType}
                    onChange={(e) => setNewFileType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="component">React Component (.tsx)</option>
                    <option value="hook">React Hook (.tsx)</option>
                    <option value="utility">Utility (.ts)</option>
                    <option value="style">Stylesheet (.css)</option>
                    <option value="json">JSON (.json)</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateFileOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateFile}>
                  Create File
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* File Tree */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {renderTreeNode(filteredTree, '', expandedFolders, toggleFolder, selectedFile, onFileSelect, handleDeleteFile, getFileIcon)}
        </div>
      </ScrollArea>
    </div>
  );
};

// Helper functions
function buildFileTree(files: CodeFile[]) {
  const tree: any = {};
  
  files.forEach(file => {
    const parts = file.file_path.split('/');
    let current = tree;
    
    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        current[part] = file;
      } else {
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }
    });
  });
  
  return tree;
}

function filterTree(tree: any, searchTerm: string): any {
  if (!searchTerm) return tree;
  
  const filtered: any = {};
  
  function traverse(node: any, path: string = '') {
    for (const [key, value] of Object.entries(node)) {
      const currentPath = path ? `${path}/${key}` : key;
      
      if (value && typeof value === 'object' && 'id' in value) {
        // This is a file
        if (currentPath.toLowerCase().includes(searchTerm.toLowerCase())) {
          setNestedProperty(filtered, currentPath.split('/'), value);
        }
      } else {
        // This is a folder
        traverse(value, currentPath);
      }
    }
  }
  
  traverse(tree);
  return filtered;
}

function setNestedProperty(obj: any, path: string[], value: any) {
  let current = obj;
  for (let i = 0; i < path.length - 1; i++) {
    if (!current[path[i]]) {
      current[path[i]] = {};
    }
    current = current[path[i]];
  }
  current[path[path.length - 1]] = value;
}

function renderTreeNode(
  node: any,
  path: string,
  expandedFolders: Set<string>,
  toggleFolder: (path: string) => void,
  selectedFile: CodeFile | null,
  onFileSelect: (file: CodeFile) => void,
  onDeleteFile: (file: CodeFile) => void,
  getFileIcon: (fileName: string) => JSX.Element,
  depth: number = 0
): JSX.Element[] {
  const items: JSX.Element[] = [];
  
  const sortedEntries = Object.entries(node).sort(([a, aVal], [b, bVal]) => {
    const aIsFile = aVal && typeof aVal === 'object' && 'id' in aVal;
    const bIsFile = bVal && typeof bVal === 'object' && 'id' in bVal;
    
    if (aIsFile && !bIsFile) return 1;
    if (!aIsFile && bIsFile) return -1;
    return a.localeCompare(b);
  });
  
  sortedEntries.forEach(([key, value]) => {
    const currentPath = path ? `${path}/${key}` : key;
    const isFile = value && typeof value === 'object' && 'id' in value;
    
    if (isFile) {
      const file = value as CodeFile;
      items.push(
        <div
          key={file.id}
          className={`group flex items-center px-2 py-1 rounded cursor-pointer hover:bg-gray-100 ${
            selectedFile?.id === file.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''
          }`}
          style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}
          onClick={() => onFileSelect(file)}
        >
          {getFileIcon(key)}
          <span className="ml-2 text-sm truncate flex-1">{key}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onDeleteFile(file)}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    } else {
      const isExpanded = expandedFolders.has(currentPath);
      items.push(
        <div key={currentPath}>
          <div
            className="flex items-center px-2 py-1 rounded cursor-pointer hover:bg-gray-100"
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
            onClick={() => toggleFolder(currentPath)}
          >
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 text-blue-500" />
            ) : (
              <Folder className="h-4 w-4 text-blue-500" />
            )}
            <span className="ml-2 text-sm font-medium">{key}</span>
          </div>
          {isExpanded && (
            <div>
              {renderTreeNode(value, currentPath, expandedFolders, toggleFolder, selectedFile, onFileSelect, onDeleteFile, getFileIcon, depth + 1)}
            </div>
          )}
        </div>
      );
    }
  });
  
  return items;
}

function getFileExtension(fileType: string): string {
  switch (fileType) {
    case 'component':
    case 'hook':
      return '.tsx';
    case 'utility':
      return '.ts';
    case 'style':
      return '.css';
    case 'json':
      return '.json';
    default:
      return '.tsx';
  }
}

function getFileTemplate(fileType: string, fileName: string): string {
  const componentName = fileName.replace(/\.[^/.]+$/, '');
  
  switch (fileType) {
    case 'component':
      return `import React from 'react';

interface ${componentName}Props {
  // Define your props here
}

const ${componentName} = ({}: ${componentName}Props) => {
  return (
    <div>
      <h1>${componentName}</h1>
    </div>
  );
};

export default ${componentName};
`;
    case 'hook':
      return `import { useState, useEffect } from 'react';

export const ${componentName} = () => {
  const [state, setState] = useState();

  useEffect(() => {
    // Add your effect logic here
  }, []);

  return {
    state,
    setState,
  };
};
`;
    case 'utility':
      return `// Utility functions for ${componentName}

export const ${componentName.toLowerCase()} = () => {
  // Add your utility functions here
};
`;
    case 'style':
      return `/* Styles for ${componentName} */

.${componentName.toLowerCase()} {
  /* Add your styles here */
}
`;
    case 'json':
      return `{
  "name": "${componentName}",
  "description": ""
}
`;
    default:
      return '';
  }
}

export default EnhancedFileExplorer;
