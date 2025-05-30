
import { useState } from 'react';
import { ChevronRight, ChevronDown, File, Folder } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  content?: string;
}

const CodeEditor = () => {
  const [selectedFile, setSelectedFile] = useState<string>('App.tsx');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['src', 'components']));

  // Mock file structure
  const fileTree: FileNode[] = [
    {
      name: 'src',
      type: 'folder',
      children: [
        {
          name: 'components',
          type: 'folder',
          children: [
            { name: 'App.tsx', type: 'file' },
            { name: 'TaskList.tsx', type: 'file' },
            { name: 'TaskItem.tsx', type: 'file' }
          ]
        },
        {
          name: 'utils',
          type: 'folder',
          children: [
            { name: 'api.ts', type: 'file' },
            { name: 'helpers.ts', type: 'file' }
          ]
        },
        { name: 'App.css', type: 'file' },
        { name: 'index.tsx', type: 'file' }
      ]
    },
    { name: 'package.json', type: 'file' },
    { name: 'README.md', type: 'file' }
  ];

  const mockCode = `import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch tasks from API
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks');
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTask = (task) => {
    setTasks([...tasks, { ...task, id: Date.now() }]);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="App">
      <h1>Task Management</h1>
      <TaskList tasks={tasks} />
    </div>
  );
}

export default App;`;

  const toggleFolder = (folderName: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderName)) {
      newExpanded.delete(folderName);
    } else {
      newExpanded.add(folderName);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFileTree = (nodes: FileNode[], depth = 0) => {
    return nodes.map((node) => (
      <div key={node.name}>
        <div
          className={cn(
            "flex items-center py-1 px-2 text-sm cursor-pointer hover:bg-gray-100 rounded",
            selectedFile === node.name && node.type === 'file' && "bg-blue-50 text-blue-600"
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => {
            if (node.type === 'folder') {
              toggleFolder(node.name);
            } else {
              setSelectedFile(node.name);
            }
          }}
        >
          {node.type === 'folder' ? (
            <>
              {expandedFolders.has(node.name) ? (
                <ChevronDown className="h-4 w-4 mr-1" />
              ) : (
                <ChevronRight className="h-4 w-4 mr-1" />
              )}
              <Folder className="h-4 w-4 mr-2 text-blue-500" />
            </>
          ) : (
            <File className="h-4 w-4 mr-2 ml-5 text-gray-500" />
          )}
          <span>{node.name}</span>
        </div>
        {node.type === 'folder' && expandedFolders.has(node.name) && node.children && (
          <div>
            {renderFileTree(node.children, depth + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="flex h-full">
      {/* File Explorer */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Files</h4>
        <div className="space-y-1">
          {renderFileTree(fileTree)}
        </div>
      </div>

      {/* Code Editor */}
      <div className="flex-1 bg-white">
        {/* Tab */}
        <div className="border-b border-gray-200 px-4 py-2">
          <div className="flex items-center space-x-2">
            <File className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-900">{selectedFile}</span>
          </div>
        </div>

        {/* Code Content */}
        <div className="p-4">
          <pre className="text-sm leading-relaxed text-gray-800 font-mono bg-gray-50 p-4 rounded-lg overflow-auto">
            <code>{mockCode}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
