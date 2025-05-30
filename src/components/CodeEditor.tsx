
import { useState, useEffect } from 'react';
import { File } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type CodeFile = Database['public']['Tables']['code_files']['Row'];

interface CodeEditorProps {
  file: CodeFile;
  onContentChange: (content: string) => void;
}

const CodeEditor = ({ file, onContentChange }: CodeEditorProps) => {
  const [content, setContent] = useState(file.content || '');

  useEffect(() => {
    setContent(file.content || '');
  }, [file.content]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    onContentChange(newContent);
  };

  const getFileExtension = (filePath: string) => {
    return filePath.split('.').pop() || '';
  };

  const getLanguageFromExtension = (extension: string) => {
    const languageMap: { [key: string]: string } = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'css': 'css',
      'html': 'html',
      'json': 'json',
      'md': 'markdown',
      'py': 'python',
    };
    return languageMap[extension] || 'text';
  };

  const extension = getFileExtension(file.file_path);
  const language = getLanguageFromExtension(extension);

  return (
    <div className="flex flex-col h-full">
      {/* Tab */}
      <div className="border-b border-gray-200 px-4 py-2 bg-white">
        <div className="flex items-center space-x-2">
          <File className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-900">{file.file_path}</span>
          <span className="text-xs text-gray-500">({language})</span>
        </div>
      </div>

      {/* Code Content */}
      <div className="flex-1 bg-white">
        <textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          className="w-full h-full p-4 font-mono text-sm leading-relaxed text-gray-800 bg-gray-50 border-none resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Start coding..."
          spellCheck={false}
        />
      </div>
    </div>
  );
};

export default CodeEditor;
