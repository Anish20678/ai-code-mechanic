
import { useState, useEffect } from 'react';
import { Database, Table, Columns, Key, Users, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface TableInfo {
  table_name: string;
  column_count: number;
  row_count: number;
  has_rls: boolean;
  created_at: string;
}

const SupabaseDatabaseSchema = () => {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDatabaseSchema = async () => {
      try {
        // For demo purposes, we'll use the known tables from the schema
        const knownTables: TableInfo[] = [
          { table_name: 'projects', column_count: 9, row_count: 0, has_rls: false, created_at: '2024-01-01' },
          { table_name: 'code_files', column_count: 5, row_count: 0, has_rls: false, created_at: '2024-01-01' },
          { table_name: 'conversations', column_count: 5, row_count: 0, has_rls: false, created_at: '2024-01-01' },
          { table_name: 'messages', column_count: 6, row_count: 0, has_rls: false, created_at: '2024-01-01' },
          { table_name: 'build_jobs', column_count: 10, row_count: 0, has_rls: false, created_at: '2024-01-01' },
          { table_name: 'deployments', column_count: 11, row_count: 0, has_rls: false, created_at: '2024-01-01' },
          { table_name: 'ai_sessions', column_count: 10, row_count: 0, has_rls: false, created_at: '2024-01-01' },
          { table_name: 'ai_models', column_count: 12, row_count: 0, has_rls: false, created_at: '2024-01-01' },
          { table_name: 'user_profiles', column_count: 8, row_count: 0, has_rls: false, created_at: '2024-01-01' },
        ];

        setTables(knownTables);
      } catch (error) {
        console.error('Error fetching database schema:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDatabaseSchema();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Schema
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
          <Database className="h-5 w-5" />
          Database Schema
        </CardTitle>
        <CardDescription>
          Overview of your database tables and structure
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Table className="h-8 w-8 mx-auto text-blue-600 mb-2" />
            <div className="text-2xl font-bold text-blue-900">{tables.length}</div>
            <div className="text-sm text-blue-700">Tables</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Columns className="h-8 w-8 mx-auto text-green-600 mb-2" />
            <div className="text-2xl font-bold text-green-900">
              {tables.reduce((sum, table) => sum + table.column_count, 0)}
            </div>
            <div className="text-sm text-green-700">Columns</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Key className="h-8 w-8 mx-auto text-purple-600 mb-2" />
            <div className="text-2xl font-bold text-purple-900">
              {tables.filter(table => table.has_rls).length}
            </div>
            <div className="text-sm text-purple-700">RLS Enabled</div>
          </div>
        </div>

        <ScrollArea className="h-64">
          <div className="space-y-2">
            {tables.map((table) => (
              <Collapsible key={table.table_name}>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Table className="h-4 w-4 text-gray-600" />
                    <span className="font-medium">{table.table_name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {table.column_count} cols
                    </Badge>
                    {table.has_rls && (
                      <Badge variant="outline" className="text-xs">
                        RLS
                      </Badge>
                    )}
                  </div>
                  <Clock className="h-4 w-4 text-gray-400" />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-3 py-2 text-sm text-gray-600">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <strong>Columns:</strong> {table.column_count}
                    </div>
                    <div>
                      <strong>Rows:</strong> {table.row_count}
                    </div>
                    <div>
                      <strong>RLS:</strong> {table.has_rls ? 'Enabled' : 'Disabled'}
                    </div>
                    <div>
                      <strong>Created:</strong> {new Date(table.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default SupabaseDatabaseSchema;
